/**
 * Aritmética de calendario sobre strings ISO 'YYYY-MM-DD'.
 *
 * Trabajar con strings en lugar de Date tiene una propiedad que se aprovecha en
 * todo el componente: el orden lexicográfico de 'YYYY-MM-DD' coincide con el
 * orden cronológico, así que comparar fechas (min/max, rangos) es comparar
 * strings — sin parsear y sin zonas horarias de por medio.
 *
 * `new Date()` se usa solo en `today()`. Todo lo demás es aritmética entera.
 */

export type IsoDate = string;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** ¿Año bisiesto? Divisible entre 4, salvo los siglos que no lo son entre 400. */
function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Días del mes. `m` es 1-12. */
export function daysInMonth(y: number, m: number): number {
  return m === 2 && isLeap(y) ? 29 : MONTH_LENGTHS[m - 1];
}

/** Formatea con ceros a la izquierda. `m` es 1-12. */
export function toIso(y: number, m: number, d: number): IsoDate {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Parsea validando contra el calendario real: '2026-02-30' devuelve null, no
 * una fecha corrida al 2 de marzo como haría `new Date()`.
 */
export function parseIso(s: string): { y: number; m: number; d: number } | null {
  const match = ISO_RE.exec(s);
  if (!match) return null;

  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);

  if (m < 1 || m > 12) return null;
  if (d < 1 || d > daysInMonth(y, m)) return null;

  return { y, m, d };
}

export function isValidIso(s: string): boolean {
  return parseIso(s) !== null;
}

/** Hoy en la zona horaria local del usuario. */
export function today(): IsoDate {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Día de la semana. 0 = domingo, igual que `Date.prototype.getDay()`. */
export function weekday(iso: IsoDate): number {
  const p = parseIso(iso);
  if (!p) return 0;
  // Date.UTC evita que la zona horaria local corra el día.
  return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
}

export function addDays(iso: IsoDate, n: number): IsoDate {
  const p = parseIso(iso);
  if (!p) return iso;
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
  return toIso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/**
 * Suma meses truncando el día: 31 de enero + 1 mes = 28 de febrero, no 3 de
 * marzo. Es el comportamiento que espera cualquiera navegando un calendario.
 */
export function addMonths(iso: IsoDate, n: number): IsoDate {
  const p = parseIso(iso);
  if (!p) return iso;

  const total = p.y * 12 + (p.m - 1) + n;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;

  return toIso(y, m, Math.min(p.d, daysInMonth(y, m)));
}

export function startOfMonth(iso: IsoDate): IsoDate {
  const p = parseIso(iso);
  if (!p) return iso;
  return toIso(p.y, p.m, 1);
}

/**
 * Cuadrícula del mes: SIEMPRE 42 celdas (6 semanas), rellenando con días de los
 * meses vecinos. Un mes de 28 días que empieza en el primer día de la semana
 * cabe en 4 filas; si el grid cambiara de alto, el panel saltaría al navegar.
 *
 * `weekStartsOn` es 0-6 con 0 = domingo.
 */
export function buildMonthGrid(monthIso: IsoDate, weekStartsOn: number): IsoDate[] {
  const first = startOfMonth(monthIso);
  const offset = (weekday(first) - weekStartsOn + 7) % 7;
  const start = addDays(first, -offset);

  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

// --- Localización vía Intl -------------------------------------------------
// Todo lo dependiente del idioma sale del navegador. No hay nombres de meses ni
// formatos hardcodeados en la librería.

/** Instante UTC a mediodía: inmune a cualquier corrimiento por zona horaria. */
function utcNoon(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d, 12));
}

/**
 * Primer día de la semana del locale, en numeración 0-6 con 0 = domingo.
 *
 * OJO: `getWeekInfo().firstDay` usa numeración ISO-8601 (1 = lunes … 7 =
 * domingo), distinta a la de `Date.getDay()`. Esta función es el único lugar
 * donde se hace la conversión.
 *
 * `getWeekInfo` es API reciente; si no existe, se asume domingo.
 */
export function resolveWeekStart(locale: string): number {
  try {
    const info = (
      new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number } }
    ).getWeekInfo?.();
    if (!info) return 0;
    return info.firstDay === 7 ? 0 : info.firstDay;
  } catch {
    return 0;
  }
}

/** Ej. 'julio de 2026' en es-MX, 'July 2026' en en-US. */
export function monthLabel(monthIso: IsoDate, locale: string): string {
  const p = parseIso(monthIso);
  if (!p) return '';
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(utcNoon(p.y, p.m, 1));
}

/** Siete nombres cortos de día, rotados según `weekStartsOn` (0 = domingo). */
export function weekdayLabels(locale: string, weekStartsOn: number): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  // 2026-08-02 es domingo, así que sirve de ancla para el índice 0.
  return Array.from({ length: 7 }, (_, i) =>
    fmt.format(utcNoon(2026, 8, 2 + ((weekStartsOn + i) % 7))),
  );
}

/** Ej. '31 de julio de 2026'. Para el aria-label de cada día del grid. */
export function fullDateLabel(iso: IsoDate, locale: string): string {
  const p = parseIso(iso);
  if (!p) return '';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    utcNoon(p.y, p.m, p.d),
  );
}

/**
 * Orden y separador de los campos según el locale, leídos de Intl en vez de
 * mantener una tabla de patrones. Esto es lo que hace que en es-MX se teclee
 * dd/mm/aaaa y en en-US mm/dd/aaaa sin código específico.
 */
function fieldOrder(locale: string): ('day' | 'month' | 'year')[] {
  const parts = new Intl.DateTimeFormat(locale, { timeZone: 'UTC' }).formatToParts(
    utcNoon(2026, 7, 31),
  );
  return parts
    .filter((p) => p.type === 'day' || p.type === 'month' || p.type === 'year')
    .map((p) => p.type as 'day' | 'month' | 'year');
}

/** Ej. '31/07/2026' en es-MX. Cadena vacía si no hay fecha. */
export function formatForDisplay(iso: IsoDate, locale: string): string {
  const p = parseIso(iso);
  if (!p) return '';

  const value = {
    day: String(p.d).padStart(2, '0'),
    month: String(p.m).padStart(2, '0'),
    year: String(p.y),
  };
  return fieldOrder(locale)
    .map((f) => value[f])
    .join('/');
}

/**
 * Parsea lo que el usuario tecleó, interpretando el orden según el locale.
 * Devuelve null ante cualquier duda: texto incompleto, fecha inexistente, o año
 * de dos dígitos (adivinar el siglo produce bugs silenciosos).
 */
export function parseLocalized(text: string, locale: string): IsoDate | null {
  const chunks = text
    .trim()
    .split(/[^\d]+/)
    .filter(Boolean);
  if (chunks.length !== 3) return null;

  const order = fieldOrder(locale);
  const raw: Record<string, string> = {};
  order.forEach((field, i) => (raw[field] = chunks[i]));

  // Un año debe venir con sus cuatro dígitos: '26' es ambiguo.
  if (raw['year'].length !== 4) return null;

  const y = Number(raw['year']);
  const m = Number(raw['month']);
  const d = Number(raw['day']);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;

  const iso = toIso(y, m, d);
  return isValidIso(iso) ? iso : null;
}
