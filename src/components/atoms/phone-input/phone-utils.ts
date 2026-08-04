import {
  BY_DIAL,
  BY_ISO2,
  COUNTRY_CODES,
  CountryCode,
  MAX_DIAL_LENGTH,
} from './country-codes';

/**
 * Helpers puros del phone-input: parseo, formateo y validación de teléfonos.
 *
 * Todo aquí es sin DOM y sin señales, para poder probarlo directo en jsdom
 * (mismo reparto que `time-utils` / `date-utils`).
 */

/** Código ISO 3166-1 alpha-2 en mayúsculas: `'EC'`, `'US'`. */
export type Iso2 = string;

/** Teléfono en formato E.164 (`'+593987654321'`), o `''` si no hay. */
export type E164 = string;

/** Un país ya listo para pintar: con nombre localizado y bandera. */
export interface Country {
  iso2: Iso2;
  /** Prefijo sin el `+`: `'593'`. */
  dial: string;
  /** Nombre en el locale pedido. */
  name: string;
  flag: string;
  min: number;
  max: number;
  groups?: string;
}

/** Un E.164 partido en sus pedazos. */
export interface ParsedPhone {
  iso2: Iso2;
  dial: string;
  /** Número nacional, solo dígitos. */
  national: string;
}

/** Resultado de validar un número nacional. */
export type PhoneProblem = 'empty' | 'no-country' | 'too-short' | 'too-long' | 'ok';

/** Tope de dígitos que admite E.164, prefijo incluido. */
const E164_MAX_DIGITS = 15;

/** Prefijos de salida internacional más comunes. */
const EXIT_PREFIXES = ['011', '010', '00'];

/** Todo lo que no sea dígito se va. */
export function digitsOnly(text: string): string {
  return (text ?? '').replace(/\D+/g, '');
}

/**
 * La bandera se compone con los dos indicadores regionales del ISO2
 * (`'EC'` → 🇪🇨). No hay tabla de emojis: es aritmética de codepoints.
 */
export function flagEmoji(iso2: Iso2): string {
  const code = (iso2 ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '';
  const BASE = 0x1f1e6; // 🇦
  return String.fromCodePoint(
    BASE + (code.charCodeAt(0) - 65),
    BASE + (code.charCodeAt(1) - 65),
  );
}

/**
 * ¿El texto viene escrito como número internacional? Es decir, con `+` o con un
 * prefijo de salida (`00`, `011`, `010`) seguido de dígitos suficientes.
 *
 * Sirve para dos cosas: decidir si un valor de fuera es E.164 o un número
 * nacional, y detectar que el usuario acaba de pegar un número completo.
 */
export function isInternationalText(raw: string): boolean {
  const text = (raw ?? '').trim();
  if (text.startsWith('+')) return true;
  const digits = digitsOnly(text);
  return EXIT_PREFIXES.some((exit) => digits.startsWith(exit) && digits.length >= exit.length + 4);
}

/**
 * Deja cualquier cosa en E.164 desnudo (`'+' + dígitos`), o `''`.
 *
 * Acepta separadores, paréntesis y prefijos de salida; recorta al tope de 15
 * dígitos de E.164. No comprueba que el prefijo exista: eso es `parseE164`.
 */
export function normalizeE164(raw: unknown): E164 {
  if (typeof raw !== 'string') return '';
  const text = raw.trim();
  let digits = digitsOnly(text);

  // El `+` explícito manda; si no está, se busca un prefijo de salida.
  if (!text.startsWith('+')) {
    const exit = EXIT_PREFIXES.find(
      (candidate) => digits.startsWith(candidate) && digits.length >= candidate.length + 4,
    );
    if (exit) digits = digits.slice(exit.length);
  }

  if (!digits) return '';
  return `+${digits.slice(0, E164_MAX_DIGITS)}`;
}

/**
 * Candidatos para un número, buscando el prefijo MÁS LARGO que exista en la
 * tabla. Devuelve todos los países que lo comparten, con el primario primero.
 */
export function matchDialCode(digits: string): readonly CountryCode[] {
  const clean = digitsOnly(digits);
  const start = Math.min(MAX_DIAL_LENGTH, clean.length);
  for (let length = start; length >= 1; length--) {
    const found = BY_DIAL.get(clean.slice(0, length));
    if (found) return found;
  }
  return [];
}

/**
 * Parte un E.164 en país + número nacional.
 *
 * `prefer` es lo que resuelve los prefijos compartidos (+1 → US/CA/PR…, +7 →
 * RU/KZ): gana el primer país preferido cuyo prefijo coincida con el detectado,
 * y si ninguno coincide, el primario de la tabla. Así la elección del usuario
 * sobrevive cuando el formulario le devuelve su propio valor; si el prefijo
 * cambió, en cambio, se respeta el número nuevo.
 *
 * Limitación conocida: un `+1` que llega de fuera sin preferencia válida se
 * resuelve como Estados Unidos aunque sea canadiense. Distinguirlos exige la
 * tabla de NPA del NANP, que es justo el peso que este componente evita. El
 * valor nunca se altera — solo la bandera puede quedar mal, y se corrige con un
 * clic.
 */
export function parseE164(
  value: string,
  prefer: readonly (Iso2 | null | undefined)[] = [],
): ParsedPhone | null {
  const digits = digitsOnly(value);
  if (!digits) return null;

  const candidates = matchDialCode(digits);
  if (!candidates.length) return null;

  const dial = candidates[0][1];
  const preferred = prefer.find((iso2) => !!iso2 && BY_ISO2.get(iso2)?.[1] === dial);
  const entry = preferred ? BY_ISO2.get(preferred)! : candidates[0];

  return { iso2: entry[0], dial, national: digits.slice(dial.length) };
}

/** Arma el E.164 canónico. `''` si falta el país o no hay dígitos. */
export function toE164(iso2: Iso2, national: string): E164 {
  const entry = BY_ISO2.get(iso2);
  if (!entry) return '';
  const digits = digitsOnly(national);
  if (!digits) return '';
  return `+${(entry[1] + digits).slice(0, E164_MAX_DIGITS)}`;
}

/**
 * Quita el cero de troncal cuando sobra: `'0987654321'` → `'987654321'` en
 * Ecuador. Solo actúa si CON el cero el número se pasa del rango del país y SIN
 * él encaja, y nunca quita más de uno.
 */
export function stripTrunkPrefix(national: string, iso2: Iso2): string {
  const digits = digitsOnly(national);
  const entry = BY_ISO2.get(iso2);
  if (!entry || !digits.startsWith('0')) return digits;

  const [, , min, max] = entry;
  const withoutZero = digits.slice(1);
  const fitsNow = digits.length >= min && digits.length <= max;
  const fitsWithout = withoutZero.length >= min && withoutZero.length <= max;
  return !fitsNow && fitsWithout ? withoutZero : digits;
}

/**
 * Agrupa el número nacional según el patrón del país (`'2-3-4'` →
 * `'98 765 4321'`). Sin patrón, los dígitos salen tal cual: mejor eso que
 * inventar una agrupación equivocada.
 */
export function formatNational(national: string, iso2: Iso2): string {
  const digits = digitsOnly(national);
  const pattern = BY_ISO2.get(iso2)?.[4];
  if (!digits || !pattern) return digits;

  const sizes = pattern.split('-').map(Number);
  const parts: string[] = [];
  let index = 0;
  for (let i = 0; i < sizes.length && index < digits.length; i++) {
    // Al último grupo se le vacía lo que quede: un número más largo de lo
    // previsto se sigue viendo entero, solo con el último bloque más gordo.
    const size = i === sizes.length - 1 ? digits.length - index : sizes[i];
    parts.push(digits.slice(index, index + size));
    index += size;
  }
  if (index < digits.length) parts.push(digits.slice(index));
  return parts.join(' ');
}

/**
 * Valida el número nacional: **solo dígitos y longitud**. No sabe nada de
 * prefijos de operadora, así que `'000000000'` pasa en Ecuador. Para más rigor,
 * validación de servidor.
 */
export function checkNational(national: string, iso2: Iso2 | null): PhoneProblem {
  const digits = digitsOnly(national);
  if (!digits) return 'empty';
  if (!iso2) return 'no-country';

  const entry = BY_ISO2.get(iso2);
  if (!entry) return 'no-country';

  const [, , min, max] = entry;
  if (digits.length < min) return 'too-short';
  if (digits.length > max) return 'too-long';
  return 'ok';
}

/**
 * Región del locale, si es un país de la tabla: `'es-EC'` → `'EC'`.
 * `'es'` (sin región) y `'es-419'` (Latinoamérica, que no es un país) → `''`.
 */
export function regionFromLocale(locale: string): Iso2 {
  try {
    const region = new Intl.Locale(locale).region ?? '';
    return BY_ISO2.has(region) ? region : '';
  } catch {
    return '';
  }
}

/** El nombre de país sale del locale, no de una tabla propia. */
function displayNames(locale: string): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' });
  } catch {
    return null;
  }
}

const listCache = new Map<string, readonly Country[]>();

/**
 * Los ~240 países con nombre localizado y bandera, ordenados por nombre con el
 * collator del locale (para que la Ñ y los acentos caigan donde deben).
 *
 * Memoizado por locale: son 240 llamadas a `Intl.DisplayNames` y esto se lee en
 * cada apertura del panel.
 */
export function countryList(locale: string): readonly Country[] {
  const cached = listCache.get(locale);
  if (cached) return cached;

  const names = displayNames(locale);
  const list = COUNTRY_CODES.map(([iso2, dial, min, max, groups]) => ({
    iso2,
    dial,
    // Si el locale no tiene datos de regiones, `of` devuelve el propio código:
    // el país sigue siendo buscable por prefijo en vez de reventar.
    name: (names?.of(iso2) ?? iso2) || iso2,
    flag: flagEmoji(iso2),
    min,
    max,
    groups,
  }));

  let collator: Intl.Collator;
  try {
    collator = new Intl.Collator(locale);
  } catch {
    collator = new Intl.Collator();
  }
  list.sort((a, b) => collator.compare(a.name, b.name));

  const frozen = Object.freeze(list) as readonly Country[];
  listCache.set(locale, frozen);
  return frozen;
}

/** Quita acentos y mayúsculas para comparar como la gente busca. */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Filtra por nombre (sin acentos ni mayúsculas: `espana` encuentra España) o por
 * prefijo, con o sin `+`. Consulta vacía devuelve la lista entera.
 */
export function filterCountries(
  list: readonly Country[],
  query: string,
): readonly Country[] {
  const text = (query ?? '').trim();
  if (!text) return list;

  const needle = fold(text);
  const digits = digitsOnly(text);
  return list.filter(
    (country) =>
      fold(country.name).includes(needle) ||
      (!!digits && country.dial.startsWith(digits)) ||
      fold(country.iso2) === needle,
  );
}
