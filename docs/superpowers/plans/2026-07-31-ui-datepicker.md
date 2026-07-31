# ui-calendar + ui-datepicker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a single-date calendar (`<ui-calendar>`) and date picker (`<ui-datepicker>`) that match the library's existing form-control contract, with zero new dependencies.

**Architecture:** Composition over a monolith. Pure TypeScript modules at the bottom (`date-utils.ts` for calendar arithmetic on ISO strings, `overlay-position.ts` for flip/clamp math), a presentational grid component in the middle (`ui-calendar`), and a form control on top (`ui-datepicker`) that wraps the existing `ui-input` and drives an overlay panel. Each layer is testable without the one above it.

**Tech Stack:** Angular 22 standalone components, signals (`signal`/`computed`/`model`/`input`), Tailwind v4 utility classes with `var(--color-*)` tokens, Vitest + `TestBed`, browser-native `Intl` for all localization.

## Global Constraints

- **Zero new dependencies.** The library ships only `@angular/*`, `rxjs`, `tslib`. Nothing may be added to `package.json`.
- **Every component and util exists twice, byte-identical:** `src/components/...` and `projects/highstack/ui/src/lib/...`. Verify with `diff` at the end of every task that touches a component. Public components additionally need an export in `projects/highstack/ui/src/public-api.ts`.
- **Value type is `string` in ISO `'YYYY-MM-DD'` form, or `''` for "no date".** Never a `Date` in any public API.
- **`new Date()` is allowed in exactly two places:** `today()` in `date-utils.ts`, and building the UTC instant handed to `Intl` for formatting. Every other date operation works on the string.
- **Code comments and user-facing strings are in Spanish.** Commit messages are in English (conventional commits, lowercase, scoped).
- **Prettier config:** `printWidth: 100`, `singleQuote: true`. Note that `src/app/pages/**` is not Prettier-formatted in this repo — do not run `--write` over it.
- **`weekStartsOn` is 0-6 with 0 = Sunday** in all public API and in `date-utils`, matching `Date.getDay()`. `Intl`'s `getWeekInfo().firstDay` uses ISO-8601 1-7 with 7 = Sunday and **must be converted at the boundary**.
- **Run a single spec file with:** `npx ng test highstack-ui --include "<path to .spec.ts>"`. Run everything with `npx ng test`. The baseline is green: 37 passed across 11 files.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/components/atoms/calendar/date-utils.ts` | Pure calendar arithmetic on ISO strings. No Angular, no DOM. |
| `src/components/atoms/calendar/date-utils.spec.ts` | Unit tests for the above. |
| `src/components/shared/overlay-position.ts` | Pure flip/clamp math. Takes rects, returns coordinates. New folder. |
| `src/components/shared/overlay-position.spec.ts` | Unit tests with fabricated rects. |
| `src/components/atoms/calendar/calendar.component.ts` / `.html` | `<ui-calendar>`: the 6×7 grid, month navigation, keyboard, disabled logic. |
| `src/components/atoms/calendar/calendar.component.spec.ts` | Component tests. |
| `src/components/atoms/datepicker/datepicker.component.ts` / `.html` | `<ui-datepicker>`: wraps `ui-input`, owns the overlay and the text↔value sync. |
| `src/components/atoms/datepicker/datepicker.component.spec.ts` | Component tests. |
| `projects/highstack/ui/src/lib/...` | Byte-identical copies of all of the above except `.spec.ts` files. |
| `projects/highstack/ui/src/public-api.ts` | Add `CalendarComponent` and `DatepickerComponent` exports. |
| `src/app/pages/atoms/calendar/` and `.../datepicker/` | Showcase pages. |
| `src/app/app.routes.ts` | Two new routes. |
| `AI-USAGE-GUIDE.md` + `public/AI-USAGE-GUIDE.md` | Document both components. |

Tasks 1 and 2 are independent of each other. Tasks 3-8 are strictly sequential.

---

## Task 1: `date-utils.ts` — calendar arithmetic

**Files:**
- Create: `src/components/atoms/calendar/date-utils.ts`
- Test: `src/components/atoms/calendar/date-utils.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type IsoDate = string`
  - `parseIso(s: string): { y: number; m: number; d: number } | null` — `m` is 1-12
  - `isValidIso(s: string): boolean`
  - `toIso(y: number, m: number, d: number): IsoDate`
  - `today(): IsoDate`
  - `daysInMonth(y: number, m: number): number`
  - `weekday(iso: IsoDate): number` — 0 = Sunday
  - `addDays(iso: IsoDate, n: number): IsoDate`
  - `addMonths(iso: IsoDate, n: number): IsoDate`
  - `startOfMonth(iso: IsoDate): IsoDate`
  - `buildMonthGrid(monthIso: IsoDate, weekStartsOn: number): IsoDate[]` — always 42 entries

- [ ] **Step 1: Write the failing test**

Create `src/components/atoms/calendar/date-utils.spec.ts`:

```ts
import {
  addDays,
  addMonths,
  buildMonthGrid,
  daysInMonth,
  isValidIso,
  parseIso,
  startOfMonth,
  toIso,
  today,
  weekday,
} from './date-utils';

describe('parseIso', () => {
  it('parsea una fecha válida', () => {
    expect(parseIso('2026-07-31')).toEqual({ y: 2026, m: 7, d: 31 });
  });

  it('rechaza días que no existen en ese mes', () => {
    expect(parseIso('2026-02-30')).toBeNull();
    expect(parseIso('2026-04-31')).toBeNull();
  });

  it('rechaza meses fuera de rango', () => {
    expect(parseIso('2026-13-01')).toBeNull();
    expect(parseIso('2026-00-10')).toBeNull();
  });

  it('rechaza formatos que no son YYYY-MM-DD', () => {
    expect(parseIso('2026-7-31')).toBeNull();
    expect(parseIso('31/07/2026')).toBeNull();
    expect(parseIso('')).toBeNull();
    expect(parseIso('no-soy-fecha')).toBeNull();
  });

  it('acepta el 29 de febrero solo en bisiesto', () => {
    expect(parseIso('2024-02-29')).not.toBeNull();
    expect(parseIso('2026-02-29')).toBeNull();
  });
});

describe('daysInMonth', () => {
  it('cubre la regla de los siglos', () => {
    // Divisible entre 4 -> bisiesto.
    expect(daysInMonth(2024, 2)).toBe(29);
    // Divisible entre 100 pero no entre 400 -> NO bisiesto. La que todos olvidan.
    expect(daysInMonth(2100, 2)).toBe(28);
    // Divisible entre 400 -> bisiesto.
    expect(daysInMonth(2000, 2)).toBe(29);
  });

  it('devuelve los largos normales', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
  });
});

describe('addMonths', () => {
  it('trunca el día cuando el mes destino es más corto', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
  });

  it('cruza el año en ambos sentidos', () => {
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15');
  });
});

describe('addDays', () => {
  it('cruza mes y año', () => {
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('cruza el 29 de febrero en bisiesto', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });
});

describe('weekday', () => {
  it('devuelve 0 para domingo', () => {
    // 2026-08-02 es domingo.
    expect(weekday('2026-08-02')).toBe(0);
    expect(weekday('2026-07-31')).toBe(5); // viernes
  });
});

describe('orden lexicográfico', () => {
  it('coincide con el orden cronológico', () => {
    // Esta es la propiedad de la que depende todo min/max del componente.
    expect('2026-01-05' < '2026-11-02').toBe(true);
    expect('2026-02-10' < '2026-02-09').toBe(false);
  });
});

describe('buildMonthGrid', () => {
  it('siempre devuelve 42 celdas, sin importar el mes', () => {
    // Febrero 2026 empieza en domingo y tiene 28 días: cabe en 4 semanas,
    // pero el grid debe seguir siendo de 6 para que el panel no cambie de alto.
    expect(buildMonthGrid('2026-02-01', 0)).toHaveLength(42);
    expect(buildMonthGrid('2026-08-01', 0)).toHaveLength(42);
    expect(buildMonthGrid('2026-05-01', 1)).toHaveLength(42);
  });

  it('la primera celda es el inicio de semana pedido', () => {
    // Julio 2026 empieza en miércoles.
    const domingo = buildMonthGrid('2026-07-01', 0);
    expect(weekday(domingo[0])).toBe(0);
    expect(domingo[0]).toBe('2026-06-28');

    const lunes = buildMonthGrid('2026-07-01', 1);
    expect(weekday(lunes[0])).toBe(1);
    expect(lunes[0]).toBe('2026-06-29');
  });

  it('es una secuencia continua de días sin huecos', () => {
    const grid = buildMonthGrid('2026-07-01', 0);
    for (let i = 1; i < grid.length; i++) {
      expect(grid[i]).toBe(addDays(grid[i - 1], 1));
    }
  });

  it('contiene todos los días del mes pedido', () => {
    const grid = buildMonthGrid('2026-07-01', 0);
    expect(grid).toContain('2026-07-01');
    expect(grid).toContain('2026-07-31');
  });
});

describe('helpers', () => {
  it('toIso rellena con ceros', () => {
    expect(toIso(2026, 7, 1)).toBe('2026-07-01');
  });

  it('startOfMonth normaliza al día 1', () => {
    expect(startOfMonth('2026-07-31')).toBe('2026-07-01');
  });

  it('isValidIso es consistente con parseIso', () => {
    expect(isValidIso('2026-07-31')).toBe(true);
    expect(isValidIso('2026-02-30')).toBe(false);
  });

  it('today devuelve un ISO válido', () => {
    expect(isValidIso(today())).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test highstack-ui --include "src/components/atoms/calendar/date-utils.spec.ts"`
Expected: FAIL — the build errors with "Could not resolve './date-utils'".

- [ ] **Step 3: Write the implementation**

Create `src/components/atoms/calendar/date-utils.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test highstack-ui --include "src/components/atoms/calendar/date-utils.spec.ts"`
Expected: PASS, 20 tests.

- [ ] **Step 5: Copy to the library tree and verify**

```bash
mkdir -p projects/highstack/ui/src/lib/atoms/calendar
cp src/components/atoms/calendar/date-utils.ts projects/highstack/ui/src/lib/atoms/calendar/
diff src/components/atoms/calendar/date-utils.ts projects/highstack/ui/src/lib/atoms/calendar/date-utils.ts && echo SYNCED
```

- [ ] **Step 6: Commit**

```bash
git add src/components/atoms/calendar/ projects/highstack/ui/src/lib/atoms/calendar/
git commit -m "feat(calendar): add ISO date arithmetic utilities"
```

---

## Task 2: `overlay-position.ts` — flip and clamp math

**Files:**
- Create: `src/components/shared/overlay-position.ts`
- Test: `src/components/shared/overlay-position.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface Rect { top: number; left: number; width: number; height: number }`
  - `interface Viewport { width: number; height: number }`
  - `interface OverlayPlacement { top: number; left: number; flipped: boolean }`
  - `positionOverlay(trigger: Rect, panel: { width: number; height: number }, viewport: Viewport, align?: 'start' | 'end'): OverlayPlacement`

Constants `MARGIN = 8` and `GAP = 6` match the values already hardcoded in `select.component.ts:23` and `dropdown.component.ts:22`. Coordinates are for `position: fixed`, i.e. viewport-relative.

- [ ] **Step 1: Write the failing test**

Create `src/components/shared/overlay-position.spec.ts`:

```ts
import { positionOverlay, type Rect } from './overlay-position';

/** jsdom no hace layout, así que los rects se fabrican a mano. */
function rect(left: number, top: number, width: number, height: number): Rect {
  return { left, top, width, height };
}

const VIEWPORT = { width: 1000, height: 800 };

describe('positionOverlay', () => {
  it('coloca el panel debajo del trigger cuando hay espacio', () => {
    const p = positionOverlay(rect(100, 100, 200, 36), { width: 280, height: 300 }, VIEWPORT);
    expect(p.flipped).toBe(false);
    expect(p.top).toBe(142); // 100 + 36 + GAP(6)
    expect(p.left).toBe(100);
  });

  it('voltea hacia arriba cuando no cabe abajo pero sí arriba', () => {
    // Trigger cerca del fondo: 700 + 36 + 6 + 300 = 1042 > 800.
    const p = positionOverlay(rect(100, 700, 200, 36), { width: 280, height: 300 }, VIEWPORT);
    expect(p.flipped).toBe(true);
    expect(p.top).toBe(394); // 700 - 6 - 300
  });

  it('se queda abajo si tampoco cabe arriba', () => {
    // Panel más alto que cualquiera de los dos huecos: gana el de abajo.
    const p = positionOverlay(rect(100, 400, 200, 36), { width: 280, height: 700 }, VIEWPORT);
    expect(p.flipped).toBe(false);
  });

  it('alinea a la derecha cuando se pide align=end', () => {
    const p = positionOverlay(
      rect(100, 100, 200, 36),
      { width: 280, height: 300 },
      VIEWPORT,
      'end',
    );
    expect(p.left).toBe(20); // 100 + 200 - 280
  });

  it('nunca deja el panel salirse por la derecha', () => {
    const p = positionOverlay(rect(900, 100, 200, 36), { width: 280, height: 300 }, VIEWPORT);
    expect(p.left).toBe(712); // 1000 - 280 - MARGIN(8)
  });

  it('nunca deja el panel salirse por la izquierda', () => {
    const p = positionOverlay(rect(-50, 100, 200, 36), { width: 280, height: 300 }, VIEWPORT);
    expect(p.left).toBe(8); // MARGIN
  });

  it('clampea el top cuando el panel es más alto que el viewport', () => {
    const p = positionOverlay(rect(100, 100, 200, 36), { width: 280, height: 900 }, VIEWPORT);
    expect(p.top).toBe(8); // MARGIN
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test highstack-ui --include "src/components/shared/overlay-position.spec.ts"`
Expected: FAIL — "Could not resolve './overlay-position'".

- [ ] **Step 3: Write the implementation**

Create `src/components/shared/overlay-position.ts`:

```ts
/**
 * Cálculo puro de la posición de un panel flotante respecto a su trigger.
 *
 * Devuelve coordenadas para `position: fixed`, o sea relativas al viewport, que
 * es lo que permite al panel escapar de contenedores con `overflow`.
 *
 * Está separado del componente a propósito: esta misma lógica está hoy copiada
 * en select, dropdown, popover y tooltip. Aquí es una función pura y se puede
 * probar sin DOM (jsdom no hace layout).
 */

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface OverlayPlacement {
  top: number;
  left: number;
  /** true si terminó arriba del trigger en lugar de abajo. */
  flipped: boolean;
}

/** Separación mínima contra el borde del viewport. */
const MARGIN = 8;
/** Separación entre el trigger y el panel. */
const GAP = 6;

export function positionOverlay(
  trigger: Rect,
  panel: { width: number; height: number },
  viewport: Viewport,
  align: 'start' | 'end' = 'start',
): OverlayPlacement {
  const spaceBelow = viewport.height - (trigger.top + trigger.height);
  const spaceAbove = trigger.top;
  const needed = panel.height + GAP;

  // Solo voltea si abajo no cabe Y arriba cabe mejor: si no cabe en ningún
  // lado, quedarse abajo es menos desconcertante que saltar hacia arriba.
  const flipped = spaceBelow < needed && spaceAbove > spaceBelow;

  const rawTop = flipped ? trigger.top - GAP - panel.height : trigger.top + trigger.height + GAP;
  const rawLeft = align === 'end' ? trigger.left + trigger.width - panel.width : trigger.left;

  return {
    top: clamp(rawTop, MARGIN, viewport.height - panel.height - MARGIN),
    left: clamp(rawLeft, MARGIN, viewport.width - panel.width - MARGIN),
    flipped,
  };
}

/** Clampea respetando el mínimo cuando el rango es inválido (panel gigante). */
function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test highstack-ui --include "src/components/shared/overlay-position.spec.ts"`
Expected: PASS, 7 tests.

- [ ] **Step 5: Copy to the library tree and verify**

```bash
mkdir -p projects/highstack/ui/src/lib/shared
cp src/components/shared/overlay-position.ts projects/highstack/ui/src/lib/shared/
diff src/components/shared/overlay-position.ts projects/highstack/ui/src/lib/shared/overlay-position.ts && echo SYNCED
```

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/ projects/highstack/ui/src/lib/shared/
git commit -m "feat(shared): add pure overlay positioning helper"
```

---

## Task 3: Locale helpers inside `date-utils.ts`

**Files:**
- Modify: `src/components/atoms/calendar/date-utils.ts` (append)
- Modify: `src/components/atoms/calendar/date-utils.spec.ts` (append)

**Interfaces:**
- Consumes: `IsoDate`, `parseIso`, `toIso` from Task 1.
- Produces:
  - `resolveWeekStart(locale: string): number` — 0-6, 0 = Sunday
  - `monthLabel(monthIso: IsoDate, locale: string): string` — e.g. `'julio de 2026'`
  - `weekdayLabels(locale: string, weekStartsOn: number): string[]` — 7 short names, ordered
  - `formatForDisplay(iso: IsoDate, locale: string): string` — e.g. `'31/07/2026'`
  - `fullDateLabel(iso: IsoDate, locale: string): string` — e.g. `'31 de julio de 2026'`
  - `parseLocalized(text: string, locale: string): IsoDate | null`

**The trap this task exists to contain:** `Intl.Locale.getWeekInfo().firstDay` uses ISO-8601 numbering (1 = Monday … 7 = Sunday). Every other number in this codebase is `Date.getDay()` numbering (0 = Sunday). `resolveWeekStart` is the only place that conversion happens.

- [ ] **Step 1: Write the failing test**

Append to `src/components/atoms/calendar/date-utils.spec.ts`:

```ts
import {
  formatForDisplay,
  fullDateLabel,
  monthLabel,
  parseLocalized,
  resolveWeekStart,
  weekdayLabels,
} from './date-utils';

describe('resolveWeekStart', () => {
  it('convierte de numeración ISO (1=lunes..7=domingo) a 0=domingo', () => {
    // es-MX arranca en domingo: Intl dice 7, nosotros usamos 0.
    expect(resolveWeekStart('es-MX')).toBe(0);
    expect(resolveWeekStart('en-US')).toBe(0);
    // es-ES arranca en lunes: Intl dice 1 y 1 también es lunes en 0-6.
    expect(resolveWeekStart('es-ES')).toBe(1);
    expect(resolveWeekStart('en-GB')).toBe(1);
  });

  it('cae en domingo si el locale es basura', () => {
    expect(resolveWeekStart('xx-YY-nonsense')).toBe(0);
  });
});

describe('monthLabel', () => {
  it('usa el idioma del locale', () => {
    expect(monthLabel('2026-07-01', 'es-MX').toLowerCase()).toContain('julio');
    expect(monthLabel('2026-07-01', 'en-US').toLowerCase()).toContain('july');
  });

  it('incluye el año', () => {
    expect(monthLabel('2026-07-01', 'es-MX')).toContain('2026');
  });
});

describe('weekdayLabels', () => {
  it('devuelve siete etiquetas', () => {
    expect(weekdayLabels('es-MX', 0)).toHaveLength(7);
  });

  it('rota según el inicio de semana', () => {
    const domingo = weekdayLabels('es-MX', 0);
    const lunes = weekdayLabels('es-MX', 1);
    // La primera del lunes es la segunda del domingo.
    expect(lunes[0]).toBe(domingo[1]);
    expect(lunes[6]).toBe(domingo[0]);
  });
});

describe('formatForDisplay', () => {
  it('respeta el orden del locale', () => {
    expect(formatForDisplay('2026-07-31', 'es-MX')).toBe('31/07/2026');
    expect(formatForDisplay('2026-07-31', 'en-US')).toBe('07/31/2026');
  });

  it('devuelve cadena vacía si no hay fecha', () => {
    expect(formatForDisplay('', 'es-MX')).toBe('');
  });
});

describe('fullDateLabel', () => {
  it('escribe la fecha en palabras para el aria-label', () => {
    // '31/07/2026' se lee como números sueltos en un lector de pantalla.
    const label = fullDateLabel('2026-07-31', 'es-MX');
    expect(label).toContain('31');
    expect(label.toLowerCase()).toContain('julio');
    expect(label).toContain('2026');
  });

  it('devuelve cadena vacía si no hay fecha', () => {
    expect(fullDateLabel('', 'es-MX')).toBe('');
  });
});

describe('parseLocalized', () => {
  it('lee el orden del locale', () => {
    expect(parseLocalized('31/07/2026', 'es-MX')).toBe('2026-07-31');
    expect(parseLocalized('07/31/2026', 'en-US')).toBe('2026-07-31');
  });

  it('acepta ceros a la izquierda opcionales', () => {
    expect(parseLocalized('1/7/2026', 'es-MX')).toBe('2026-07-01');
  });

  it('acepta separadores alternativos', () => {
    expect(parseLocalized('31-07-2026', 'es-MX')).toBe('2026-07-31');
  });

  it('rechaza años de dos dígitos por ambiguos', () => {
    expect(parseLocalized('31/07/26', 'es-MX')).toBeNull();
  });

  it('rechaza texto incompleto o basura', () => {
    expect(parseLocalized('31/0', 'es-MX')).toBeNull();
    expect(parseLocalized('abc', 'es-MX')).toBeNull();
    expect(parseLocalized('', 'es-MX')).toBeNull();
  });

  it('rechaza fechas que no existen', () => {
    expect(parseLocalized('31/02/2026', 'es-MX')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test highstack-ui --include "src/components/atoms/calendar/date-utils.spec.ts"`
Expected: FAIL — the new imports are not exported.

- [ ] **Step 3: Write the implementation**

Append to `src/components/atoms/calendar/date-utils.ts`:

```ts
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
  return Array.from({ length: 7 }, (_, i) => fmt.format(utcNoon(2026, 8, 2 + ((weekStartsOn + i) % 7))));
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

  const value = { day: String(p.d).padStart(2, '0'), month: String(p.m).padStart(2, '0'), year: String(p.y) };
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
  const chunks = text.trim().split(/[^\d]+/).filter(Boolean);
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test highstack-ui --include "src/components/atoms/calendar/date-utils.spec.ts"`
Expected: PASS, 20 original + 16 new tests.

- [ ] **Step 5: Sync and commit**

```bash
cp src/components/atoms/calendar/date-utils.ts projects/highstack/ui/src/lib/atoms/calendar/
diff src/components/atoms/calendar/date-utils.ts projects/highstack/ui/src/lib/atoms/calendar/date-utils.ts && echo SYNCED
git add src/components/atoms/calendar/ projects/highstack/ui/src/lib/atoms/calendar/
git commit -m "feat(calendar): derive month names, week start and typing order from Intl"
```

---

## Task 4: `<ui-calendar>` — grid rendering and selection

**Files:**
- Create: `src/components/atoms/calendar/calendar.component.ts`
- Create: `src/components/atoms/calendar/calendar.component.html`
- Test: `src/components/atoms/calendar/calendar.component.spec.ts`

**Interfaces:**
- Consumes: everything exported from `./date-utils`.
- Produces: `CalendarComponent` with inputs `value` (model, string), `month` (model, string), `locale` (string), `weekStartsOn` (number | undefined), `min`, `max` (string), `disabledDates` (readonly string[]), `dateDisabled` (`(iso: string) => boolean` | undefined). Public method `isDisabled(iso: string): boolean`.

Keyboard navigation is Task 5. This task renders and selects with the mouse.

- [ ] **Step 1: Write the failing test**

Create `src/components/atoms/calendar/calendar.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { CalendarComponent } from './calendar.component';

function create(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(CalendarComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

function days(fixture: ReturnType<typeof create>): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('[role="gridcell"] button'));
}

describe('CalendarComponent', () => {
  it('renderiza siempre 42 celdas', () => {
    expect(days(create({ month: '2026-02-01' }))).toHaveLength(42);
    expect(days(create({ month: '2026-08-01' }))).toHaveLength(42);
  });

  it('renderiza siete encabezados de día', () => {
    const fixture = create({ month: '2026-07-01' });
    const heads = fixture.nativeElement.querySelectorAll('[data-weekday]');
    expect(heads).toHaveLength(7);
  });

  it('atenúa los días que no son del mes visible', () => {
    const fixture = create({ month: '2026-07-01', locale: 'es-MX' });
    // Julio 2026 empieza en miércoles; con semana en domingo sobran 3 del mes previo.
    const outside = fixture.nativeElement.querySelectorAll('[data-outside="true"]');
    expect(outside.length).toBeGreaterThan(0);
  });

  it('marca el día seleccionado con aria-selected', () => {
    const fixture = create({ value: '2026-07-15', month: '2026-07-01' });
    const selected = fixture.nativeElement.querySelectorAll('[aria-selected="true"]');
    expect(selected).toHaveLength(1);
    expect(selected[0].textContent?.trim()).toBe('15');
  });

  it('al hacer clic actualiza value', () => {
    const fixture = create({ month: '2026-07-01', value: '' });
    const target = days(fixture).find((b) => b.dataset['date'] === '2026-07-15')!;
    target.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('2026-07-15');
  });

  it('el mes visible arranca en el mes del valor', () => {
    const fixture = create({ value: '2026-11-20' });
    expect(fixture.componentInstance.month()).toBe('2026-11-01');
  });

  describe('días deshabilitados', () => {
    it('respeta min y max', () => {
      const fixture = create({ month: '2026-07-01', min: '2026-07-10', max: '2026-07-20' });
      const cmp = fixture.componentInstance;
      expect(cmp.isDisabled('2026-07-09')).toBe(true);
      expect(cmp.isDisabled('2026-07-10')).toBe(false);
      expect(cmp.isDisabled('2026-07-20')).toBe(false);
      expect(cmp.isDisabled('2026-07-21')).toBe(true);
    });

    it('respeta la lista de fechas', () => {
      const fixture = create({ month: '2026-07-01', disabledDates: ['2026-07-15'] });
      expect(fixture.componentInstance.isDisabled('2026-07-15')).toBe(true);
      expect(fixture.componentInstance.isDisabled('2026-07-16')).toBe(false);
    });

    it('respeta el predicado', () => {
      const fixture = create({
        month: '2026-07-01',
        // Bloquea sábados y domingos.
        dateDisabled: (iso: string) => [0, 6].includes(new Date(iso + 'T12:00:00Z').getUTCDay()),
      });
      expect(fixture.componentInstance.isDisabled('2026-07-04')).toBe(true); // sábado
      expect(fixture.componentInstance.isDisabled('2026-07-06')).toBe(false); // lunes
    });

    it('no selecciona al hacer clic en un día deshabilitado', () => {
      const fixture = create({ month: '2026-07-01', value: '', disabledDates: ['2026-07-15'] });
      days(fixture).find((b) => b.dataset['date'] === '2026-07-15')!.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe('');
    });
  });

  describe('navegación de mes', () => {
    it('los botones ‹ › cambian el mes visible', () => {
      const fixture = create({ month: '2026-07-01' });
      const [prev, next] = Array.from(
        fixture.nativeElement.querySelectorAll('[data-nav]'),
      ) as HTMLButtonElement[];

      next.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.month()).toBe('2026-08-01');

      prev.click();
      prev.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.month()).toBe('2026-06-01');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test highstack-ui --include "src/components/atoms/calendar/calendar.component.spec.ts"`
Expected: FAIL — "Could not resolve './calendar.component'".

- [ ] **Step 3: Write the component class**

Create `src/components/atoms/calendar/calendar.component.ts`:

```ts
import { Component, computed, input, linkedSignal, model, signal } from '@angular/core';
import {
  addMonths,
  buildMonthGrid,
  fullDateLabel,
  monthLabel,
  parseIso,
  resolveWeekStart,
  startOfMonth,
  today,
  weekdayLabels,
} from './date-utils';

/** Una celda del grid, ya resuelta para el template. */
export interface CalendarDay {
  iso: string;
  label: string;
  outside: boolean;
  disabled: boolean;
  selected: boolean;
  isToday: boolean;
}

/**
 * Cuadrícula de un mes. No sabe nada de overlays ni de inputs de texto: recibe
 * un valor y emite el que el usuario elige. Se puede embeber suelto.
 */
@Component({
  selector: 'ui-calendar',
  templateUrl: './calendar.component.html',
  host: { class: 'block' },
})
export class CalendarComponent {
  /** Fecha seleccionada en ISO 'YYYY-MM-DD', o '' si no hay. */
  readonly value = model<string>('');

  readonly locale = input<string>('es-MX');
  /** 0 = domingo. Si no se pasa, se deriva del locale. */
  readonly weekStartsOn = input<number | undefined>(undefined);

  readonly min = input<string>('');
  readonly max = input<string>('');
  readonly disabledDates = input<readonly string[]>([]);
  readonly dateDisabled = input<((iso: string) => boolean) | undefined>(undefined);

  /**
   * Mes visible. Es un linkedSignal para que siga al valor cuando este cambia
   * desde afuera, pero sin perder la navegación manual del usuario.
   */
  readonly month = linkedSignal<string>(() => startOfMonth(this.value() || today()));

  /** Día que tiene el tabindex=0 del roving focus. */
  protected readonly focused = signal<string>('');

  protected readonly resolvedWeekStart = computed(
    () => this.weekStartsOn() ?? resolveWeekStart(this.locale()),
  );

  protected readonly heading = computed(() => monthLabel(this.month(), this.locale()));

  protected readonly weekdays = computed(() =>
    weekdayLabels(this.locale(), this.resolvedWeekStart()),
  );

  protected readonly weeks = computed<CalendarDay[][]>(() => {
    const grid = buildMonthGrid(this.month(), this.resolvedWeekStart());
    const visibleMonth = parseIso(this.month())?.m;
    const selected = this.value();
    const hoy = today();

    const cells = grid.map<CalendarDay>((iso) => ({
      iso,
      label: String(parseIso(iso)!.d),
      outside: parseIso(iso)!.m !== visibleMonth,
      disabled: this.isDisabled(iso),
      selected: iso === selected,
      isToday: iso === hoy,
    }));

    // Seis filas de siete.
    return Array.from({ length: 6 }, (_, r) => cells.slice(r * 7, r * 7 + 7));
  });

  /**
   * Un día se deshabilita si CUALQUIERA de las cuatro restricciones lo dice. Se
   * evalúan en orden y se corta en la primera, para no llamar al predicado 42
   * veces si min ya descartó el día.
   */
  isDisabled(iso: string): boolean {
    const min = this.min();
    if (min && iso < min) return true;

    const max = this.max();
    if (max && iso > max) return true;

    if (this.disabledDates().includes(iso)) return true;

    return this.dateDisabled()?.(iso) ?? false;
  }

  protected select(iso: string) {
    if (this.isDisabled(iso)) return;
    this.value.set(iso);
    this.focused.set(iso);
  }

  protected shiftMonth(n: number) {
    this.month.set(addMonths(this.month(), n));
  }

  /** Para el aria-label de cada día: '15 de julio de 2026', no '15/07/2026'. */
  protected dayLabel(iso: string): string {
    return fullDateLabel(iso, this.locale());
  }
}
```

- [ ] **Step 4: Write the template**

Create `src/components/atoms/calendar/calendar.component.html`:

```html
<div
  class="inline-block rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3"
>
  <div class="flex items-center justify-between gap-2 px-1 pb-2">
    <button
      type="button"
      data-nav="prev"
      (click)="shiftMonth(-1)"
      [attr.aria-label]="'Mes anterior'"
      class="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] cursor-pointer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
    </button>

    <!-- El mes se anuncia al cambiar: sin esto, navegar con flechas es mudo. -->
    <div aria-live="polite" class="text-sm font-medium capitalize text-[var(--color-foreground)]">
      {{ heading() }}
    </div>

    <button
      type="button"
      data-nav="next"
      (click)="shiftMonth(1)"
      [attr.aria-label]="'Mes siguiente'"
      class="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] cursor-pointer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
    </button>
  </div>

  <table role="grid" class="border-collapse">
    <thead>
      <tr>
        @for (w of weekdays(); track $index) {
          <th
            data-weekday
            scope="col"
            [attr.abbr]="w"
            class="size-9 text-center text-xs font-normal capitalize text-[var(--color-muted-foreground)]"
          >
            {{ w }}
          </th>
        }
      </tr>
    </thead>
    <tbody>
      @for (week of weeks(); track $index) {
        <tr role="row">
          @for (day of week; track day.iso) {
            <td role="gridcell" [attr.aria-selected]="day.selected" class="p-0">
              <button
                type="button"
                [attr.data-date]="day.iso"
                [attr.data-outside]="day.outside"
                [attr.aria-label]="dayLabel(day.iso)"
                [attr.aria-disabled]="day.disabled || null"
                [attr.aria-current]="day.isToday ? 'date' : null"
                [tabindex]="day.iso === focused() ? 0 : -1"
                (click)="select(day.iso)"
                [class]="
                  'size-9 rounded-md text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--color-ring)]/40 ' +
                  (day.selected
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-medium'
                    : day.disabled
                      ? 'text-[var(--color-muted-foreground)]/40 cursor-not-allowed'
                      : day.outside
                        ? 'text-[var(--color-muted-foreground)]/60 hover:bg-[var(--color-muted)] cursor-pointer'
                        : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)] cursor-pointer') +
                  (day.isToday && !day.selected ? ' ring-1 ring-[var(--color-border)]' : '')
                "
              >
                {{ day.label }}
              </button>
            </td>
          }
        </tr>
      }
    </tbody>
  </table>
</div>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx ng test highstack-ui --include "src/components/atoms/calendar/calendar.component.spec.ts"`
Expected: PASS, 12 tests.

- [ ] **Step 6: Sync and commit**

```bash
cp src/components/atoms/calendar/calendar.component.ts src/components/atoms/calendar/calendar.component.html projects/highstack/ui/src/lib/atoms/calendar/
diff -r -x "*.spec.ts" src/components/atoms/calendar projects/highstack/ui/src/lib/atoms/calendar && echo SYNCED
git add src/components/atoms/calendar/ projects/highstack/ui/src/lib/atoms/calendar/
git commit -m "feat(calendar): add ui-calendar grid with selection and month navigation"
```

---

## Task 5: `<ui-calendar>` — keyboard navigation

**Files:**
- Modify: `src/components/atoms/calendar/calendar.component.ts` (add `onKeydown`, `focusDay`)
- Modify: `src/components/atoms/calendar/calendar.component.html` (bind `(keydown)` on the table)
- Modify: `src/components/atoms/calendar/calendar.component.spec.ts` (append)

**Interfaces:**
- Consumes: `CalendarComponent` from Task 4, `addDays`/`addMonths`/`startOfMonth` from Task 1.
- Produces: no new public API. `focused` (already present) becomes keyboard-driven.

Nothing in this repo implements two-dimensional grid keyboard navigation; `ui-select` and `ui-dropdown` only handle `ArrowUp`/`ArrowDown`. This is all new.

- [ ] **Step 1: Write the failing test**

Append to `src/components/atoms/calendar/calendar.component.spec.ts`:

```ts
describe('CalendarComponent — teclado', () => {
  function press(fixture: ReturnType<typeof create>, key: string, shiftKey = false) {
    const grid = fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
    grid.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }));
    fixture.detectChanges();
  }

  function focusedDate(fixture: ReturnType<typeof create>): string | undefined {
    const el = fixture.nativeElement.querySelector('[tabindex="0"][data-date]') as HTMLElement;
    return el?.dataset['date'];
  }

  it('arranca con el foco en el valor seleccionado', () => {
    const fixture = create({ value: '2026-07-15', month: '2026-07-01' });
    expect(focusedDate(fixture)).toBe('2026-07-15');
  });

  it('flechas izquierda/derecha mueven un día', () => {
    const fixture = create({ value: '2026-07-15', month: '2026-07-01' });
    press(fixture, 'ArrowRight');
    expect(focusedDate(fixture)).toBe('2026-07-16');
    press(fixture, 'ArrowLeft');
    press(fixture, 'ArrowLeft');
    expect(focusedDate(fixture)).toBe('2026-07-14');
  });

  it('flechas arriba/abajo mueven una semana', () => {
    const fixture = create({ value: '2026-07-15', month: '2026-07-01' });
    press(fixture, 'ArrowDown');
    expect(focusedDate(fixture)).toBe('2026-07-22');
    press(fixture, 'ArrowUp');
    press(fixture, 'ArrowUp');
    expect(focusedDate(fixture)).toBe('2026-07-08');
  });

  it('Home y End van al inicio y fin de la semana', () => {
    // 2026-07-15 es miércoles; con semana en domingo (es-MX) va del 12 al 18.
    const fixture = create({ value: '2026-07-15', month: '2026-07-01', locale: 'es-MX' });
    press(fixture, 'Home');
    expect(focusedDate(fixture)).toBe('2026-07-12');
    press(fixture, 'End');
    expect(focusedDate(fixture)).toBe('2026-07-18');
  });

  it('PageUp y PageDown cambian de mes', () => {
    const fixture = create({ value: '2026-07-15', month: '2026-07-01' });
    press(fixture, 'PageDown');
    expect(focusedDate(fixture)).toBe('2026-08-15');
    expect(fixture.componentInstance.month()).toBe('2026-08-01');
    press(fixture, 'PageUp');
    expect(focusedDate(fixture)).toBe('2026-07-15');
  });

  it('Shift+PageUp y Shift+PageDown cambian de año', () => {
    const fixture = create({ value: '2026-07-15', month: '2026-07-01' });
    press(fixture, 'PageDown', true);
    expect(focusedDate(fixture)).toBe('2027-07-15');
    press(fixture, 'PageUp', true);
    expect(focusedDate(fixture)).toBe('2026-07-15');
  });

  it('cruzar de mes con flechas cambia el mes visible', () => {
    const fixture = create({ value: '2026-07-31', month: '2026-07-01' });
    press(fixture, 'ArrowRight');
    expect(focusedDate(fixture)).toBe('2026-08-01');
    expect(fixture.componentInstance.month()).toBe('2026-08-01');
  });

  it('Enter selecciona el día enfocado', () => {
    const fixture = create({ value: '', month: '2026-07-01' });
    press(fixture, 'ArrowRight');
    const target = focusedDate(fixture)!;
    press(fixture, 'Enter');
    expect(fixture.componentInstance.value()).toBe(target);
  });

  it('Enter no hace nada sobre un día deshabilitado', () => {
    const fixture = create({ value: '2026-07-14', month: '2026-07-01', disabledDates: ['2026-07-15'] });
    press(fixture, 'ArrowRight');
    // El día deshabilitado SÍ recibe foco: saltárselo se cicla si el mes entero
    // está bloqueado, y esconde información del lector de pantalla.
    expect(focusedDate(fixture)).toBe('2026-07-15');
    press(fixture, 'Enter');
    expect(fixture.componentInstance.value()).toBe('2026-07-14');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test highstack-ui --include "src/components/atoms/calendar/calendar.component.spec.ts"`
Expected: FAIL — arrow keys do nothing, `focusedDate` stays put.

- [ ] **Step 3: Add keyboard handling to the class**

In `calendar.component.ts`, initialise `focused` from the value and add the handler. Replace the `focused` declaration with:

```ts
  /**
   * Día con tabindex=0 (roving focus). Sigue al valor cuando cambia desde
   * afuera, pero la navegación con flechas lo mueve sin tocar el valor.
   */
  protected readonly focused = linkedSignal<string>(() => this.value() || startOfMonth(this.month()));
```

Add these methods to the class:

```ts
  /**
   * Navegación bidimensional del grid. No existía nada así en el repo: select y
   * dropdown solo manejan ArrowUp/ArrowDown sobre una lista.
   */
  protected onKeydown(event: KeyboardEvent) {
    const from = this.focused();
    let next: string | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        next = addDays(from, -1);
        break;
      case 'ArrowRight':
        next = addDays(from, 1);
        break;
      case 'ArrowUp':
        next = addDays(from, -7);
        break;
      case 'ArrowDown':
        next = addDays(from, 7);
        break;
      case 'Home':
        next = addDays(from, -this.offsetInWeek(from));
        break;
      case 'End':
        next = addDays(from, 6 - this.offsetInWeek(from));
        break;
      case 'PageUp':
        next = addMonths(from, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        next = addMonths(from, event.shiftKey ? 12 : 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.select(from);
        return;
      default:
        return;
    }

    event.preventDefault();
    this.moveFocus(next);
  }

  /** Posición del día dentro de su semana, respetando weekStartsOn. */
  private offsetInWeek(iso: string): number {
    return (weekday(iso) - this.resolvedWeekStart() + 7) % 7;
  }

  /**
   * Mueve el foco y arrastra el mes visible si hizo falta cruzar. Sin esto,
   * llegar al 1° del mes siguiente obligaría a usar el mouse.
   */
  private moveFocus(iso: string) {
    this.focused.set(iso);
    const target = startOfMonth(iso);
    if (target !== this.month()) this.month.set(target);
  }
```

Add `weekday` to the import list from `./date-utils`.

- [ ] **Step 4: Bind the handler in the template**

In `calendar.component.html`, change the opening table tag to:

```html
  <table role="grid" (keydown)="onKeydown($event)" class="border-collapse">
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx ng test highstack-ui --include "src/components/atoms/calendar/calendar.component.spec.ts"`
Expected: PASS, 12 original + 9 new tests.

- [ ] **Step 6: Sync and commit**

```bash
cp src/components/atoms/calendar/calendar.component.ts src/components/atoms/calendar/calendar.component.html projects/highstack/ui/src/lib/atoms/calendar/
diff -r -x "*.spec.ts" src/components/atoms/calendar projects/highstack/ui/src/lib/atoms/calendar && echo SYNCED
git add src/components/atoms/calendar/ projects/highstack/ui/src/lib/atoms/calendar/
git commit -m "feat(calendar): add two-dimensional keyboard navigation"
```

---

## Task 6: `<ui-datepicker>` — text ↔ value synchronisation

**Files:**
- Create: `src/components/atoms/datepicker/datepicker.component.ts`
- Create: `src/components/atoms/datepicker/datepicker.component.html`
- Test: `src/components/atoms/datepicker/datepicker.component.spec.ts`

**Interfaces:**
- Consumes: `InputComponent` from `../input/input.component`, `CalendarComponent` from `../calendar/calendar.component`, `formatForDisplay`/`parseLocalized`/`isValidIso` from `../calendar/date-utils`.
- Produces: `DatepickerComponent` implementing `ControlValueAccessor`, with the full form-control contract.

The overlay is Task 7. This task builds the control with the calendar always closed, so the text state machine can be tested in isolation.

- [ ] **Step 1: Write the failing test**

Create `src/components/atoms/datepicker/datepicker.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { DatepickerComponent } from './datepicker.component';

function create(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(DatepickerComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

function textbox(fixture: ReturnType<typeof create>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input');
}

function type(fixture: ReturnType<typeof create>, text: string) {
  const el = textbox(fixture);
  el.value = text;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
}

function blur(fixture: ReturnType<typeof create>) {
  textbox(fixture).dispatchEvent(new Event('blur', { bubbles: true }));
  fixture.detectChanges();
}

function errorText(fixture: ReturnType<typeof create>): string {
  const p = fixture.nativeElement.querySelector('p');
  return p?.textContent?.trim() ?? '';
}

describe('DatepickerComponent — texto y valor', () => {
  it('muestra el valor inicial formateado según el locale', () => {
    const fixture = create({ value: '2026-07-31', locale: 'es-MX' });
    expect(textbox(fixture).value).toBe('31/07/2026');
  });

  it('commitea al teclear una fecha completa y válida', () => {
    const fixture = create({ locale: 'es-MX' });
    type(fixture, '31/07/2026');
    expect(fixture.componentInstance.value()).toBe('2026-07-31');
  });

  it('no muestra error mientras se teclea', () => {
    const fixture = create({ locale: 'es-MX' });
    type(fixture, '31/0');
    // '31/0' es un estado legítimo de camino a '31/07/2026'.
    expect(errorText(fixture)).toBe('');
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('revela el error al perder el foco', () => {
    const fixture = create({ locale: 'es-MX' });
    type(fixture, '31/0');
    blur(fixture);
    expect(errorText(fixture)).toBe('Fecha incompleta o inválida');
  });

  it('distingue una fecha que no existe', () => {
    const fixture = create({ locale: 'es-MX' });
    type(fixture, '31/02/2026');
    blur(fixture);
    expect(errorText(fixture)).toBe('Esa fecha no existe');
  });

  it('distingue una fecha fuera de rango', () => {
    const fixture = create({ locale: 'es-MX', min: '2026-01-01' });
    type(fixture, '01/01/2020');
    blur(fixture);
    expect(errorText(fixture)).toContain('debe ser posterior');
  });

  it('distingue una fecha bloqueada', () => {
    const fixture = create({ locale: 'es-MX', disabledDates: ['2026-07-15'] });
    type(fixture, '15/07/2026');
    blur(fixture);
    expect(errorText(fixture)).toBe('Esa fecha no está disponible');
  });

  it('borrar el texto deja el valor vacío sin error', () => {
    const fixture = create({ locale: 'es-MX', value: '2026-07-31' });
    type(fixture, '');
    blur(fixture);
    expect(fixture.componentInstance.value()).toBe('');
    expect(errorText(fixture)).toBe('');
  });

  it('seguir tecleando sobre una fecha válida la invalida', () => {
    const fixture = create({ locale: 'es-MX' });
    type(fixture, '31/07/2026');
    expect(fixture.componentInstance.value()).toBe('2026-07-31');
    type(fixture, '31/07/20261');
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('acepta ceros a la izquierda opcionales', () => {
    const fixture = create({ locale: 'es-MX' });
    type(fixture, '1/7/2026');
    expect(fixture.componentInstance.value()).toBe('2026-07-01');
  });

  it('rechaza años de dos dígitos', () => {
    const fixture = create({ locale: 'es-MX' });
    type(fixture, '31/07/26');
    blur(fixture);
    expect(fixture.componentInstance.value()).toBe('');
    expect(errorText(fixture)).toBe('Fecha incompleta o inválida');
  });
});

describe('DatepickerComponent — valores externos', () => {
  it('muestra un valor fuera de rango sin borrarlo', () => {
    // Las restricciones bloquean lo que el usuario elige; no reescriben lo que
    // la app le pasó al componente.
    const fixture = create({ value: '2020-01-01', min: '2026-01-01', locale: 'es-MX' });
    expect(textbox(fixture).value).toBe('01/01/2020');
    expect(fixture.componentInstance.value()).toBe('2020-01-01');
  });

  it('enfocar y salir sin teclear no dispara el error ni borra el valor', () => {
    const fixture = create({ value: '2020-01-01', min: '2026-01-01', locale: 'es-MX' });
    blur(fixture);
    expect(fixture.componentInstance.value()).toBe('2020-01-01');
    expect(errorText(fixture)).toBe('');
  });

  it('normaliza basura a cadena vacía', () => {
    const fixture = create({});
    fixture.componentInstance.writeValue('no-soy-fecha');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('');
    expect(textbox(fixture).value).toBe('');
  });
});

describe('DatepickerComponent — precedencia de errores', () => {
  it('el input error manual gana sobre el error de parseo', () => {
    const fixture = create({ locale: 'es-MX', error: 'Mensaje del desarrollador' });
    type(fixture, '31/0');
    blur(fixture);
    expect(errorText(fixture)).toBe('Mensaje del desarrollador');
  });

  it('el error de parseo gana sobre los errors de Signal Forms', () => {
    const fixture = create({
      locale: 'es-MX',
      errors: [{ message: 'Requerido' }],
      touched: true,
    });
    type(fixture, '31/0');
    blur(fixture);
    expect(errorText(fixture)).toBe('Fecha incompleta o inválida');
  });

  it('muestra el hint cuando no hay ningún error', () => {
    const fixture = create({ locale: 'es-MX', hint: 'Elige tu fecha de nacimiento' });
    expect(errorText(fixture)).toBe('Elige tu fecha de nacimiento');
  });
});

describe('DatepickerComponent — ControlValueAccessor', () => {
  it('writeValue actualiza el texto', () => {
    const fixture = create({ locale: 'es-MX' });
    fixture.componentInstance.writeValue('2026-12-25');
    fixture.detectChanges();
    expect(textbox(fixture).value).toBe('25/12/2026');
  });

  it('registerOnChange recibe el ISO al teclear', () => {
    const fixture = create({ locale: 'es-MX' });
    const seen: string[] = [];
    fixture.componentInstance.registerOnChange((v: string) => seen.push(v));
    type(fixture, '31/07/2026');
    expect(seen).toContain('2026-07-31');
  });

  it('setDisabledState deshabilita el input', () => {
    const fixture = create({});
    fixture.componentInstance.setDisabledState(true);
    fixture.detectChanges();
    expect(textbox(fixture).disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test highstack-ui --include "src/components/atoms/datepicker/datepicker.component.spec.ts"`
Expected: FAIL — "Could not resolve './datepicker.component'".

- [ ] **Step 3: Write the component class**

Create `src/components/atoms/datepicker/datepicker.component.ts`:

```ts
import {
  Component,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CalendarComponent } from '../calendar/calendar.component';
import { InputComponent } from '../input/input.component';
import { formatForDisplay, isValidIso, parseLocalized } from '../calendar/date-utils';

export type DatepickerSize = 'sm' | 'md' | 'lg';

/** Forma laxa de un error de validación (Signal Forms entrega { kind, message? }). */
interface DatepickerValidationError {
  kind?: string;
  message?: string;
}

let nextId = 0;

/**
 * Selector de fecha: compone ui-input (para el campo, el label y el mensaje) con
 * ui-calendar (para el panel).
 *
 * Mantiene DOS fuentes de verdad sincronizadas: `value` (ISO, lo que ve el
 * formulario) y `text` (lo que hay en la caja). Las reglas de esa sincronía son
 * la parte delicada del componente y están documentadas en cada método.
 */
@Component({
  selector: 'ui-datepicker',
  templateUrl: './datepicker.component.html',
  imports: [InputComponent, CalendarComponent],
  host: { class: 'block' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatepickerComponent), multi: true },
  ],
})
export class DatepickerComponent implements ControlValueAccessor {
  /** Fecha en ISO 'YYYY-MM-DD', o '' si no hay. */
  readonly value = model<string>('');

  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly placeholder = input<string>('');
  readonly name = input<string>('');
  readonly id = input<string>(`ui-datepicker-${nextId++}`);
  readonly size = input<DatepickerSize>('md');

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });

  /** Mensaje de error manual (tiene prioridad sobre todo lo demás). */
  readonly error = input<string>('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly errors = input<readonly DatepickerValidationError[]>([]);

  // Reenviados al calendario.
  readonly locale = input<string>('es-MX');
  readonly weekStartsOn = input<number | undefined>(undefined);
  readonly min = input<string>('');
  readonly max = input<string>('');
  readonly disabledDates = input<readonly string[]>([]);
  readonly dateDisabled = input<((iso: string) => boolean) | undefined>(undefined);

  /** Lo que hay literalmente en la caja de texto. */
  protected readonly text = signal<string>('');
  /** ¿El usuario ya editó el texto? Ver `onBlur`. */
  private dirty = false;
  private focusedField = false;
  /** Error de parseo/restricción, revelado solo tras blur o Enter. */
  protected readonly parseError = signal<string>('');

  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  constructor() {
    // El valor puede cambiar desde afuera (writeValue, [(value)], formField).
    // Reformatear mientras el campo tiene foco movería el caret bajo el cursor,
    // así que solo se sincroniza cuando no está enfocado.
    effect(() => {
      const iso = this.value();
      if (this.focusedField) return;
      this.text.set(formatForDisplay(iso, this.locale()));
    });
  }

  /** Precedencia: manual > parseo > Signal Forms (tras touched). */
  protected readonly resolvedError = computed(() => {
    if (this.error()) return this.error();
    if (this.parseError()) return this.parseError();
    if (this.touched()) {
      const first = this.errors()[0];
      if (first) return first.message ?? first.kind ?? 'Campo inválido';
    }
    return '';
  });

  // --- Sincronización texto -> valor ---

  protected onTextInput(next: string) {
    this.dirty = true;
    this.text.set(next);
    // Al teclear NUNCA se muestra error: '31/0' es un estado de camino válido.
    this.parseError.set('');

    const iso = parseLocalized(next, this.locale());
    this.value.set(iso && !this.violates(iso) ? iso : '');
    this.onChange(this.value());
  }

  protected onFocus() {
    this.focusedField = true;
  }

  /**
   * Al salir del campo se revela el error, si lo hay.
   *
   * Solo se valida texto que el usuario editó: si el valor vino de afuera y
   * nadie tecleó, pasar con Tab por un formulario precargado no debe borrar
   * nada ni marcar error.
   */
  protected onBlur() {
    this.focusedField = false;
    this.onTouched();

    if (!this.dirty) {
      this.text.set(formatForDisplay(this.value(), this.locale()));
      return;
    }

    this.parseError.set(this.validateText(this.text()));
    if (!this.parseError() && this.value()) {
      this.text.set(formatForDisplay(this.value(), this.locale()));
    }
  }

  /** Devuelve el mensaje adecuado, o '' si el texto está bien. */
  private validateText(text: string): string {
    if (!text.trim()) return '';

    const iso = parseLocalized(text, this.locale());
    if (!iso) {
      // Distinguir "no existe" de "no se entiende": si los tres números están
      // completos pero la fecha no existe, el mensaje debe decirlo.
      const chunks = text.trim().split(/[^\d]+/).filter(Boolean);
      const looksComplete = chunks.length === 3 && chunks.some((c) => c.length === 4);
      return looksComplete ? 'Esa fecha no existe' : 'Fecha incompleta o inválida';
    }

    const min = this.min();
    if (min && iso < min) return `La fecha debe ser posterior a ${formatForDisplay(min, this.locale())}`;

    const max = this.max();
    if (max && iso > max) return `La fecha debe ser anterior a ${formatForDisplay(max, this.locale())}`;

    if (this.disabledDates().includes(iso) || this.dateDisabled()?.(iso)) {
      return 'Esa fecha no está disponible';
    }

    return '';
  }

  private violates(iso: string): boolean {
    return this.validateText(formatForDisplay(iso, this.locale())) !== '';
  }

  /** Elegir del calendario siempre produce una fecha válida. */
  protected onCalendarPick(iso: string) {
    this.dirty = true;
    this.value.set(iso);
    this.text.set(formatForDisplay(iso, this.locale()));
    this.parseError.set('');
    this.onChange(iso);
    this.onTouched();
  }

  // --- ControlValueAccessor ---
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    // Basura real se normaliza a '': no hay nada que mostrar.
    const iso = typeof value === 'string' && isValidIso(value) ? value : '';
    this.value.set(iso);
    this.text.set(formatForDisplay(iso, this.locale()));
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
```


- [ ] **Step 4: Write the template (panel closed for now)**

Create `src/components/atoms/datepicker/datepicker.component.html`:

```html
<ui-input
  [id]="id()"
  [name]="name()"
  [label]="label()"
  [hint]="hint()"
  [error]="resolvedError()"
  [placeholder]="placeholder()"
  [size]="size()"
  [disabled]="isDisabled()"
  [readonly]="readonly()"
  [required]="required()"
  [value]="text()"
  (valueChange)="onTextInput($event)"
  (focusin)="onFocus()"
  (focusout)="onBlur()"
/>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx ng test highstack-ui --include "src/components/atoms/datepicker/datepicker.component.spec.ts"`
Expected: PASS, 20 tests.

- [ ] **Step 6: Sync and commit**

```bash
mkdir -p projects/highstack/ui/src/lib/atoms/datepicker
cp src/components/atoms/datepicker/datepicker.component.ts src/components/atoms/datepicker/datepicker.component.html projects/highstack/ui/src/lib/atoms/datepicker/
diff -r -x "*.spec.ts" src/components/atoms/datepicker projects/highstack/ui/src/lib/atoms/datepicker && echo SYNCED
git add src/components/atoms/datepicker/ projects/highstack/ui/src/lib/atoms/datepicker/
git commit -m "feat(datepicker): add ui-datepicker text field with locale-aware parsing"
```

---

## Task 7: `<ui-datepicker>` — overlay panel

**Files:**
- Modify: `src/components/atoms/datepicker/datepicker.component.ts`
- Modify: `src/components/atoms/datepicker/datepicker.component.html`
- Modify: `src/components/atoms/datepicker/datepicker.component.spec.ts` (append)

**Interfaces:**
- Consumes: `positionOverlay`, `Rect` from `../../shared/overlay-position`; `CalendarComponent` from Task 5.
- Produces: public `open` signal on `DatepickerComponent`.

Mirrors the pattern in `select.component.ts`: `position: fixed` panel, `afterNextRender` for the first placement (a bare `requestAnimationFrame` fires before the panel mounts), a `ready` flag to avoid the flash, and a capture-phase scroll listener so inner scroll containers reposition too.

- [ ] **Step 1: Write the failing test**

Append to `src/components/atoms/datepicker/datepicker.component.spec.ts`:

```ts
describe('DatepickerComponent — panel', () => {
  function trigger(fixture: ReturnType<typeof create>): HTMLButtonElement {
    return fixture.nativeElement.querySelector('[data-trigger]');
  }
  function panel(fixture: ReturnType<typeof create>): HTMLElement | null {
    return fixture.nativeElement.querySelector('[role="dialog"]');
  }

  it('arranca cerrado', () => {
    const fixture = create({});
    expect(panel(fixture)).toBeNull();
    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('false');
  });

  it('el botón abre y cierra el panel', () => {
    const fixture = create({});
    trigger(fixture).click();
    fixture.detectChanges();
    expect(panel(fixture)).not.toBeNull();
    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('true');

    trigger(fixture).click();
    fixture.detectChanges();
    expect(panel(fixture)).toBeNull();
  });

  it('no abre si está deshabilitado o en readonly', () => {
    const deshabilitado = create({ disabled: true });
    trigger(deshabilitado).click();
    deshabilitado.detectChanges();
    expect(panel(deshabilitado)).toBeNull();

    const soloLectura = create({ readonly: true });
    trigger(soloLectura).click();
    soloLectura.detectChanges();
    expect(panel(soloLectura)).toBeNull();
  });

  it('Escape cierra el panel y devuelve el foco al campo', () => {
    const fixture = create({});
    trigger(fixture).click();
    fixture.detectChanges();

    panel(fixture)!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(panel(fixture)).toBeNull();
    expect(document.activeElement).toBe(textbox(fixture));
  });

  it('elegir un día cierra el panel y escribe el texto', () => {
    const fixture = create({ locale: 'es-MX', value: '2026-07-01' });
    trigger(fixture).click();
    fixture.detectChanges();

    const day = panel(fixture)!.querySelector('[data-date="2026-07-15"]') as HTMLButtonElement;
    day.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('2026-07-15');
    expect(textbox(fixture).value).toBe('15/07/2026');
    expect(panel(fixture)).toBeNull();
  });

  it('reenvía las restricciones al calendario', () => {
    const fixture = create({ month: '2026-07-01', value: '2026-07-01', disabledDates: ['2026-07-15'] });
    trigger(fixture).click();
    fixture.detectChanges();

    const day = panel(fixture)!.querySelector('[data-date="2026-07-15"]') as HTMLButtonElement;
    expect(day.getAttribute('aria-disabled')).toBe('true');
  });

  it('un clic fuera cierra el panel', () => {
    const fixture = create({});
    trigger(fixture).click();
    fixture.detectChanges();

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(panel(fixture)).toBeNull();
  });

  it('salir del panel con Tab lo cierra', () => {
    // El panel no es modal: no hay trampa de foco, tabular fuera lo cierra.
    const fixture = create({});
    trigger(fixture).click();
    fixture.detectChanges();

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    panel(fixture)!.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }),
    );
    fixture.detectChanges();

    expect(panel(fixture)).toBeNull();
    outside.remove();
  });

  it('mover el foco dentro del panel no lo cierra', () => {
    const fixture = create({});
    trigger(fixture).click();
    fixture.detectChanges();

    const inside = panel(fixture)!.querySelector('[data-nav="next"]') as HTMLElement;
    panel(fixture)!.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: inside }),
    );
    fixture.detectChanges();

    expect(panel(fixture)).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test highstack-ui --include "src/components/atoms/datepicker/datepicker.component.spec.ts"`
Expected: FAIL — `trigger(...)` is null, there is no button yet.

- [ ] **Step 3: Add overlay state to the class**

Add these imports to `datepicker.component.ts`:

```ts
import {
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  inject,
} from '@angular/core';
import { positionOverlay } from '../../shared/overlay-position';
```

Add to the class body:

```ts
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);

  readonly open = signal(false);
  /** Evita el parpadeo: el panel no se ve hasta estar posicionado. */
  protected readonly ready = signal(false);
  protected readonly panelTop = signal(0);
  protected readonly panelLeft = signal(0);

  private readonly scrollTeardown = (() => {
    const onScroll = () => this.open() && this.updatePosition();
    // Captura para que también reposicione al hacer scroll en un contenedor
    // interno, no solo en la ventana.
    window.addEventListener('scroll', onScroll, true);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('scroll', onScroll, true));
  })();

  protected toggle() {
    if (this.isDisabled() || this.readonly()) return;
    this.open() ? this.close() : this.openPanel();
  }

  private openPanel() {
    this.ready.set(false);
    this.open.set(true);
    // afterNextRender y no requestAnimationFrame: un rAF dispara antes de que
    // el panel esté montado y lo deja mal posicionado hasta el primer resize.
    afterNextRender(
      () => {
        this.updatePosition();
        this.ready.set(true);
        this.panelEl()?.focus();
      },
      { injector: this.injector },
    );
  }

  protected close(returnFocus = true) {
    if (!this.open()) return;
    this.open.set(false);
    this.ready.set(false);
    if (returnFocus) this.textInputEl()?.focus();
  }

  private panelEl(): HTMLElement | null {
    return this.el.nativeElement.querySelector('[role="dialog"]');
  }
  private textInputEl(): HTMLElement | null {
    return this.el.nativeElement.querySelector('input');
  }

  private updatePosition() {
    const panel = this.panelEl();
    const trigger = this.el.nativeElement.querySelector('[data-trigger]') as HTMLElement | null;
    if (!panel || !trigger) return;

    const t = trigger.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const placement = positionOverlay(
      { top: t.top, left: t.left, width: t.width, height: t.height },
      { width: p.width, height: p.height },
      { width: window.innerWidth, height: window.innerHeight },
      'end',
    );

    this.panelTop.set(placement.top);
    this.panelLeft.set(placement.left);
  }

  @HostListener('window:resize')
  protected onResize() {
    if (this.open()) this.updatePosition();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent) {
    if (!this.open()) return;
    if (!this.el.nativeElement.contains(event.target as Node)) this.close(false);
  }

  protected onPanelKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  /**
   * El panel no es modal: no hay trampa de foco, así que tabular fuera lo
   * cierra. `relatedTarget` es a dónde va el foco; si sigue dentro del host
   * (por ejemplo del grid al botón de mes siguiente) no se cierra nada.
   */
  protected onPanelFocusout(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (next && this.el.nativeElement.contains(next)) return;
    this.close(false);
  }
```

- [ ] **Step 4: Add the trigger and panel to the template**

Replace `datepicker.component.html` with:

```html
<ui-input
  [id]="id()"
  [name]="name()"
  [label]="label()"
  [hint]="hint()"
  [error]="resolvedError()"
  [placeholder]="placeholder()"
  [size]="size()"
  [disabled]="isDisabled()"
  [readonly]="readonly()"
  [required]="required()"
  [value]="text()"
  (valueChange)="onTextInput($event)"
  (focusin)="onFocus()"
  (focusout)="onBlur()"
>
  <button
    slot="suffix"
    type="button"
    data-trigger
    tabindex="-1"
    [disabled]="isDisabled() || readonly()"
    [attr.aria-haspopup]="'dialog'"
    [attr.aria-expanded]="open()"
    [attr.aria-label]="'Abrir calendario'"
    (click)="toggle()"
    class="shrink-0 inline-flex items-center text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] cursor-pointer disabled:cursor-not-allowed"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
  </button>
</ui-input>

@if (open()) {
  <div
    role="dialog"
    tabindex="-1"
    [attr.aria-label]="'Calendario'"
    (keydown)="onPanelKeydown($event)"
    (focusout)="onPanelFocusout($event)"
    [style.top.px]="panelTop()"
    [style.left.px]="panelLeft()"
    [class.opacity-0]="!ready()"
    [class.pointer-events-none]="!ready()"
    class="fixed z-50 outline-none shadow-lg rounded-[var(--radius)]"
  >
    <ui-calendar
      [value]="value()"
      (valueChange)="onCalendarPick($event)"
      [locale]="locale()"
      [weekStartsOn]="weekStartsOn()"
      [min]="min()"
      [max]="max()"
      [disabledDates]="disabledDates()"
      [dateDisabled]="dateDisabled()"
    />
  </div>
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx ng test highstack-ui --include "src/components/atoms/datepicker/datepicker.component.spec.ts"`
Expected: PASS, 20 original + 7 new tests.

- [ ] **Step 6: Run the whole suite and build**

```bash
npx ng test
npm run build
```
Expected: all green, build succeeds.

- [ ] **Step 7: Sync and commit**

```bash
cp src/components/atoms/datepicker/datepicker.component.ts src/components/atoms/datepicker/datepicker.component.html projects/highstack/ui/src/lib/atoms/datepicker/
diff -r -x "*.spec.ts" src/components/atoms/datepicker projects/highstack/ui/src/lib/atoms/datepicker && echo SYNCED
git add src/components/atoms/datepicker/ projects/highstack/ui/src/lib/atoms/datepicker/
git commit -m "feat(datepicker): add calendar overlay panel with flip positioning"
```

---

## Task 8: Exports, showcase pages and docs

**Files:**
- Modify: `projects/highstack/ui/src/public-api.ts`
- Create: `src/app/pages/atoms/calendar/calendar.page.ts` / `.html`
- Create: `src/app/pages/atoms/datepicker/datepicker.page.ts` / `.html`
- Modify: `src/app/app.routes.ts`
- Modify: `AI-USAGE-GUIDE.md` and `public/AI-USAGE-GUIDE.md`

**Interfaces:**
- Consumes: `CalendarComponent`, `DatepickerComponent`.
- Produces: nothing consumed by later tasks — this is the last one.

- [ ] **Step 1: Add the public exports**

In `projects/highstack/ui/src/public-api.ts`, add alongside the other atom exports (keep alphabetical order with the neighbours):

```ts
export * from './lib/atoms/calendar/calendar.component';
export * from './lib/atoms/datepicker/datepicker.component';
```

Note: `date-utils` and `overlay-position` are **not** exported. They are internal and may change without being a breaking change.

- [ ] **Step 2: Verify the library builds**

```bash
npm run build:lib:css && npx ng build @highstack/ui
```
Expected: succeeds. If it fails with `EACCES` on `dist/highstack/ui`, that directory is owned by root from an old sudo build — ask the user before deleting it; the Angular compile step passing is sufficient evidence.

- [ ] **Step 3: Create the showcase pages**

Copy the structure of `src/app/pages/atoms/select/select.page.ts` and `.html` — the same `app-page-header`, `app-demo-block`, `app-code-block`, `PageNavService` sections wiring and API table markup.

`calendar.page.ts` sections: `instalacion`, `basic`, `restricciones`, `locale`, `api`.
`datepicker.page.ts` sections: `instalacion`, `basic`, `restricciones`, `estados`, `signal-forms`, `reactive-forms`, `api`.

Demos to include on the datepicker page:

```html
<ui-datepicker label="Fecha de nacimiento" [(value)]="fecha" hint="Puedes escribirla o elegirla." />
<ui-datepicker label="Cita" min="2026-08-01" max="2026-12-31" [(value)]="cita" />
<ui-datepicker label="Entrega" [disabledDates]="feriados" [(value)]="entrega" />
<ui-datepicker label="En inglés" locale="en-US" [(value)]="fecha" />
<ui-datepicker label="Deshabilitado" [disabled]="true" value="2026-07-31" />
<ui-datepicker label="Con error" error="Selecciona una fecha válida" />
```

Remember the page files are not Prettier-formatted in this repo — match the surrounding style by hand, do not run `--write`.

- [ ] **Step 4: Add the routes and the sidebar links**

In `src/app/app.routes.ts`, add the two imports alongside the existing page imports:

```ts
import { CalendarPage } from './pages/atoms/calendar/calendar.page';
import { DatepickerPage } from './pages/atoms/datepicker/datepicker.page';
```

and the two routes in the children array, keeping the alphabetical order of the neighbours:

```ts
      { path: 'atoms/calendar', component: CalendarPage },
      { path: 'atoms/datepicker', component: DatepickerPage },
```

The sidebar nav is a separate array in `src/app/shell/shell.ts` (see the
`{ label: 'Segmented', route: '/atoms/segmented' }` entry around line 44). Add:

```ts
    { label: 'Calendar', route: '/atoms/calendar' },
    { label: 'Datepicker', route: '/atoms/datepicker' },
```

Forgetting this second file is the easy mistake: the route works when typed directly but the
page never appears in the sidebar.

- [ ] **Step 5: Verify the pages render**

```bash
npm run build
```
Expected: succeeds.

Then ask the user to check them visually — `:4200` is often occupied by their other app:

```bash
npm start -- --port 4321
```

- [ ] **Step 6: Update the AI guide**

In `AI-USAGE-GUIDE.md`:

1. Add `Datepicker` to the form-components list in section 3 (currently reads "Input, Textarea, Checkbox, Switch, Radio, Select, Segmented").
2. Add a `### Calendar` and a `### Datepicker` entry to the section 4 catalogue, following the format of the neighbouring entries.
3. Add `CalendarComponent, DatepickerComponent` to the section 6 imports list.
4. Add a gotcha: **the value is always a `'YYYY-MM-DD'` string, never a `Date`** — this is the single most likely thing for a consuming agent to get wrong.

Then sync the copy:

```bash
cp AI-USAGE-GUIDE.md public/AI-USAGE-GUIDE.md
diff AI-USAGE-GUIDE.md public/AI-USAGE-GUIDE.md && echo SYNCED
```

- [ ] **Step 7: Final verification**

```bash
npx ng test
npm run build
git status --short
```
Expected: all tests green, build succeeds, nothing unintended left uncommitted.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(datepicker): export components, add showcase pages and docs"
```

---

## Deliberately not in this plan

Recorded so a reviewer does not read them as omissions:

- **Range, month/year and date+time modes.** Increments 2-4, each with its own spec.
- **"Hoy" and "Limpiar" buttons in the panel.** The text field is editable, so clearing it already clears the value.
- **Month/year dropdowns in the panel header.** Navigation is ‹ › plus PageUp/PageDown.
- **Retrofitting `select`, `dropdown`, `popover` and `tooltip` onto `overlay-position.ts`.** They keep their copies; the util has one consumer for now.
- **Fixing `ui-popover`'s out-of-sync library copy.** Pre-existing bug recorded in the spec's "Deuda técnica adyacente" section.
