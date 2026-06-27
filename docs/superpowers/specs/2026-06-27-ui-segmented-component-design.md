# Diseño: componente `ui-segmented` (segmented control)

**Fecha:** 2026-06-27
**Estado:** Aprobado (diseño)

## Problema

Falta un control de **selección única con apariencia de botones conectados** (segmented
control / toggle group), útil para elegir entre opciones como modelos de IA, vistas
(Día/Semana/Mes), etc. Hoy lo más cercano es `ui-radio-group` con `appearance: 'card'`, pero
semánticamente y visualmente no es lo mismo.

## Objetivo

Un componente `ui-segmented` standalone, data-driven (recibe un array de opciones), que se
integre con formularios igual que el resto de la librería (CVA + Signal Forms), con su
documentación y página de demo.

## No-objetivos (YAGNI)

- Selección múltiple (esto es selección única).
- Navegación con flechas del teclado (los botones son enfocables con Tab; se puede añadir
  después). Se incluye accesibilidad básica con roles ARIA.

## Diseño

### Componente

- **Selector:** `ui-segmented`
- **Ubicación:** `src/components/atoms/segmented/segmented.component.ts` + `segmented.component.html`
- Standalone, prefijo `ui-`, en `atoms/`. Reutiliza el patrón de `ui-radio-group`.

### Tipos y API

```ts
export type SegmentedSize = 'sm' | 'md';

export interface SegmentedOption {
  value: string;
  label: string;
  /** SVG inline opcional mostrado a la izquierda del label. */
  icon?: string;
  disabled?: boolean;
}
```

| Propiedad | Tipo | Default | Para qué |
|-----------|------|---------|----------|
| `value` | `model<string>` | `''` | Opción seleccionada (two-way + forms). |
| `options` | `SegmentedOption[]` | `[]` | Opciones a mostrar. |
| `size` | `SegmentedSize` | `'md'` | Tamaño. |
| `fullWidth` | `boolean` | `false` | Segmentos de igual ancho que llenan el contenedor. |
| `disabled` | `boolean` | `false` | Deshabilita todo el grupo. |
| `name` | `string` | autogenerado | Nombre del grupo. |
| `required` | `boolean` | `false` | Validación. |
| `invalid`, `touched`, `errors` | — | — | Estado de validación (Signal Forms). |

### Comportamiento de formularios

Implementa `ControlValueAccessor` + duck typing de `FormValueControl`, copiando el patrón de
`ui-radio-group` (`src/components/atoms/radio/radio.component.ts`):
- `value = model<string>('')` como fuente de verdad.
- `writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`.
- método `select(value)` que actualiza value + dispara `onChange`/`onTouched`.
- `cvaDisabled` combinado con el input `disabled` → `isDisabled`.
- `errorMessage`/`hasError` computados igual que en radio (color de error en el borde).

Funciona con `[(value)]`, `[formField]`, `formControlName` y `ngModel`.

### Visual (estilo shadcn)

- Contenedor: `inline-flex` (o `flex w-full` si `fullWidth`), `bg-[var(--color-muted)]`,
  `rounded-[var(--radius)]`, padding interno pequeño (track).
- Cada segmento: `<button type="button">`. El activo se eleva con
  `bg-[var(--color-background)]` + sombra suave + texto foreground; los inactivos en
  `text-muted-foreground` con hover sutil.
- Tamaños: `sm` (h-7, text-xs) y `md` (h-8/9, text-sm), alineados con input/radio.
- En error (`hasError`), el contenedor toma borde `--color-destructive`.
- `disabled`: opacidad reducida y cursor not-allowed.
- Ícono opcional renderizado a la izquierda del label vía `[innerHTML]` saneado con
  `DomSanitizer.bypassSecurityTrustHtml` (el icono es SVG inline que provee el consumidor).

### Accesibilidad

- Contenedor `role="radiogroup"` (+ `aria-required`/`aria-invalid` cuando aplique).
- Cada botón `role="radio"` con `aria-checked` y `[disabled]` por opción o grupo.
- Botones enfocables con Tab; foco visible con ring.

## Documentación

- `AI-USAGE-GUIDE.md`: nueva sección `Segmented` en el catálogo (cerca de Radio/Select).
- Copiar a `public/AI-USAGE-GUIDE.md` (las dos copias se desincronizan).

## Demo + navegación

- Página `src/app/pages/atoms/segmented/segmented.page.ts` + `.html`, con el mismo formato
  que las demás (header, demo-blocks con código, scroll-spy, tabla de API). Ejemplos:
  básico (modelos), con íconos, tamaños, full-width, deshabilitado, Signal Forms.
- Registrar ruta `atoms/segmented` en `src/app/app.routes.ts`.
- Añadir `{ label: 'Segmented', route: '/atoms/segmented' }` al array `atoms` de
  `src/app/shell/shell.ts`.

## Verificación

- `npm run build` compila sin errores.
- `npm test` pasa (salvo el fallo preexistente no relacionado en `button.page.spec.ts`).
- En `npm start`: aparece "Segmented" en el sidebar; seleccionar cambia el activo; funciona
  con `[(value)]` y `[formField]`; íconos, tamaños y full-width se ven correctos; clic en
  opción disabled no cambia el valor.
