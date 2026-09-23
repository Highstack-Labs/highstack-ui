/**
 * Aritmética y formato de horas sobre strings `'HH:mm'` / `'HH:mm:ss'` en 24h.
 *
 * Es el mismo truco que `calendar/date-utils.ts` usa con las fechas ISO: al
 * rellenar con ceros a la izquierda, el orden lexicográfico del string coincide
 * con el cronológico, así que comparar horas (`min`/`max`, rangos) es comparar
 * strings — sin parsear, sin `Date` y sin zonas horarias de por medio.
 *
 * Cuidado con una asimetría: `'09:30'` y `'09:30:00'` son la misma hora pero NO
 * el mismo string. Por eso todas las comparaciones pasan por `normalizeBound`,
 * que iguala la precisión antes de comparar.
 *
 * `Date` aparece solo en dos sitios, ambos inevitables: `now()` (leer el reloj) y
 * el formateo con `Intl`, que necesita una fecha portadora. Todo lo demás es
 * aritmética entera.
 */

export type IsoTime = string;

/** Formato de hora de cara al usuario. `'auto'` lo deriva del locale. */
export type HourFormat = 12 | 24 | 'auto';

const ISO_TIME_RE = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** Fecha portadora para `Intl`: la hora se inyecta en hora local, no en UTC. */
function carrier(h: number, m: number, s: number): Date {
  return new Date(2026, 0, 1, h, m, s);
}

/** Rellena a dos dígitos. */
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Parsea validando el rango real del reloj: `'24:00'` y `'09:60'` devuelven
 * null, no una hora corrida al día siguiente como haría `new Date()`.
 *
 * Los segundos son opcionales; si no vienen, se asumen 0.
 */
export function parseIsoTime(s: string): { h: number; m: number; s: number } | null {
  const match = ISO_TIME_RE.exec(s ?? '');
  if (!match) return null;

  const h = Number(match[1]);
  const m = Number(match[2]);
  const sec = match[3] === undefined ? 0 : Number(match[3]);
  if (h > 23 || m > 59 || sec > 59) return null;

  return { h, m, s: sec };
}

export function isValidIsoTime(s: string): boolean {
  return parseIsoTime(s) !== null;
}

/** Construye la forma canónica. Con `withSeconds` en false los segundos se pierden. */
export function toIsoTime(h: number, m: number, s = 0, withSeconds = false): IsoTime {
  return withSeconds ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}`;
}

/**
 * Iguala la precisión de un string de hora a `'HH:mm:ss'` para poder comparar
 * lexicográficamente `'09:30'` con `'09:30:00'`. Devuelve '' si no es una hora.
 */
export function normalizeBound(s: string): string {
  const p = parseIsoTime(s);
  return p ? `${pad(p.h)}:${pad(p.m)}:${pad(p.s)}` : '';
}

/**
 * Compara dos horas sin importar si traen segundos.
 * Devuelve <0, 0 o >0, como cualquier comparador.
 */
export function compareTimes(a: string, b: string): number {
  const na = normalizeBound(a);
  const nb = normalizeBound(b);
  return na < nb ? -1 : na > nb ? 1 : 0;
}

/** La hora actual, redondeada hacia abajo al paso de minutos indicado. */
export function now(minuteStep = 1): IsoTime {
  const d = new Date();
  const step = Math.max(1, Math.floor(minuteStep));
  const m = Math.floor(d.getMinutes() / step) * step;
  return toIsoTime(d.getHours(), m, d.getSeconds(), true);
}

/** 0 → 12 am, 12 → 12 pm. Las dos medianoches/medios días son el caso a cuidar. */
export function to12Hour(h: number): { hour12: number; period: 'am' | 'pm' } {
  const period = h < 12 ? 'am' : 'pm';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour12, period };
}

export function from12Hour(hour12: number, period: 'am' | 'pm'): number {
  const base = hour12 % 12; // 12 → 0
  return period === 'pm' ? base + 12 : base;
}

/**
 * ¿Este locale escribe la hora con AM/PM? Se lo preguntamos a Intl en vez de
 * mantener una lista de países, igual que `date-utils` deriva de Intl el orden
 * de los campos de una fecha.
 */
export function resolveHour12(locale: string): boolean {
  try {
    const resolved = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions();
    // `hour12` puede venir undefined según el motor; en ese caso se deduce del
    // hourCycle, donde h11/h12 son los relojes de 12 horas.
    if (typeof resolved.hour12 === 'boolean') return resolved.hour12;
    return resolved.hourCycle === 'h11' || resolved.hourCycle === 'h12';
  } catch {
    return true;
  }
}

/** Resuelve `'auto'` a 12 o 24 según el locale. */
export function resolveHourFormat(format: HourFormat, locale: string): 12 | 24 {
  if (format === 12 || format === 24) return format;
  return resolveHour12(locale) ? 12 : 24;
}

export interface TimeFormatOptions {
  locale: string;
  hourFormat: HourFormat;
  showSeconds?: boolean;
}

/**
 * Ej. `'9:30 a.m.'` en es-MX con formato 12, `'09:30'` con formato 24.
 * Cadena vacía si no hay hora.
 *
 * El texto del periodo (a.m./p.m./AM/PM) sale de Intl, no está escrito aquí:
 * cada locale tiene el suyo.
 */
export function formatTimeForDisplay(iso: IsoTime, opts: TimeFormatOptions): string {
  const p = parseIsoTime(iso);
  if (!p) return '';

  const hour12 = resolveHourFormat(opts.hourFormat, opts.locale) === 12;
  return new Intl.DateTimeFormat(opts.locale, {
    hour: hour12 ? 'numeric' : '2-digit',
    minute: '2-digit',
    ...(opts.showSeconds ? { second: '2-digit' } : {}),
    hour12,
  }).format(carrier(p.h, p.m, p.s));
}

/**
 * El texto que este locale usa para am y pm, en minúsculas y sin puntos, para
 * poder reconocerlo al teclear. Ej. es-MX → ['am', 'pm'] (de 'a.m.'/'p.m.').
 */
function localeDayPeriods(locale: string): { am: string; pm: string } {
  const read = (h: number) => {
    try {
      const parts = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true }).formatToParts(
        carrier(h, 0, 0),
      );
      return (parts.find((x) => x.type === 'dayPeriod')?.value ?? '').toLowerCase().replace(/\W/g, '');
    } catch {
      return '';
    }
  };
  return { am: read(9), pm: read(21) };
}

export interface TimeParseOptions {
  locale: string;
  hourFormat: HourFormat;
}

/**
 * Parsea lo que el usuario tecleó, con la misma tolerancia que
 * `parseLocalized` para las fechas: acepta `'9'`, `'930'`, `'9:30'`, `'9.30'`,
 * `'9:30 pm'`, `'9 PM'`, `'21:30'`, `'9:30:15'`.
 *
 * Devuelve la forma canónica en 24h, o null ante cualquier duda. Las reglas que
 * importan:
 *
 *  - Sin marcador am/pm y con formato 12, un `'9'` se interpreta como 9 am: es
 *    lo que el usuario ve escrito, adivinar la tarde sorprendería.
 *  - Con marcador am/pm la hora tiene que ser 1-12; `'13 pm'` no existe.
 *  - `'930'` se parte en 9:30 y `'0930'` también; `'93'` no se entiende.
 */
export function parseLocalizedTime(text: string, opts: TimeParseOptions): IsoTime | null {
  const raw = (text ?? '').trim().toLowerCase();
  if (!raw) return null;

  // --- Marcador de periodo, en inglés o en el idioma del locale ---
  const { am, pm } = localeDayPeriods(opts.locale);
  const bare = raw.replace(/\./g, '').replace(/\s+/g, '');
  let period: 'am' | 'pm' | null = null;
  const pmTokens = [pm, 'pm', 'p'].filter(Boolean);
  const amTokens = [am, 'am', 'a'].filter(Boolean);
  if (pmTokens.some((t) => bare.endsWith(t))) period = 'pm';
  else if (amTokens.some((t) => bare.endsWith(t))) period = 'am';

  // --- Números ---
  const chunks = raw
    .split(/[^\d]+/)
    .filter(Boolean)
    .map(Number);
  if (!chunks.length || chunks.length > 3) return null;
  if (chunks.some((n) => !Number.isInteger(n))) return null;

  let h: number;
  let m = 0;
  let s = 0;

  if (chunks.length === 1) {
    const digits = String(chunks[0]);
    if (digits.length <= 2) {
      h = chunks[0];
    } else if (digits.length === 3 || digits.length === 4) {
      // '930' → 9:30, '0930' → 09:30, '2130' → 21:30.
      const cut = digits.length - 2;
      h = Number(digits.slice(0, cut));
      m = Number(digits.slice(cut));
    } else {
      return null;
    }
  } else {
    h = chunks[0];
    m = chunks[1];
    s = chunks[2] ?? 0;
  }

  if (period) {
    // Con am/pm explícito el reloj es de 12: 1-12 y nada más.
    if (h < 1 || h > 12) return null;
    h = from12Hour(h, period);
  }

  const iso = toIsoTime(h, m, s, true);
  return isValidIsoTime(iso) ? iso : null;
}

/**
 * Las horas que ofrece la columna, ya en el orden en que se muestran: 0-23 en
 * formato 24, y 12, 1, 2… 11 en formato 12 (como cualquier reloj: las doce
 * abren la vuelta, no la cierran).
 */
export function hourOptions(hourFormat: 12 | 24): number[] {
  if (hourFormat === 24) return Array.from({ length: 24 }, (_, i) => i);
  return [12, ...Array.from({ length: 11 }, (_, i) => i + 1)];
}

/** Los minutos (o segundos) que ofrece la columna, según el paso. */
export function stepOptions(step: number): number[] {
  const s = Math.max(1, Math.min(60, Math.floor(step) || 1));
  const out: number[] = [];
  for (let i = 0; i < 60; i += s) out.push(i);
  return out;
}
