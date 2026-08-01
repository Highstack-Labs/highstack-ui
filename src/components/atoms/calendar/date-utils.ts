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
