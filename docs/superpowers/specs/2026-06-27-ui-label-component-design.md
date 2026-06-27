# Diseño: componente `ui-label`

**Fecha:** 2026-06-27
**Estado:** Aprobado (diseño)

## Problema

Cada componente de formulario (`ui-input`, `ui-textarea`, `ui-select`, `ui-checkbox`,
`ui-switch`, `ui-radio`) duplica el mismo bloque de `<label>`: el elemento, sus clases de
Tailwind, y el asterisco de `required`. No existe forma de etiquetar controles que **no** sean
de la librería (controles custom, grupos, file-upload, etc.), ni una fuente única de verdad
para el estilo del label.

## Objetivo

1. Centralizar el estilo del label (DRY): una sola definición reutilizada por los componentes.
2. Ofrecer un label standalone reusable para controles que no pertenecen a la librería.

## No-objetivos (YAGNI)

- No se crea un "form field wrapper" (label + control + hint + error). Los componentes ya
  manejan hint/error internamente; un wrapper sería redundante.
- Sin marca de "opcional", sin tooltip de ayuda, sin posición izquierda/derecha, sin estado
  disabled propio. Se pueden añadir después si surge la necesidad real.
- `ui-checkbox`, `ui-switch` y `ui-radio` **no** se refactorizan en este trabajo: su label es
  *inline* (texto clickeable junto al control), un patrón visual distinto al "label arriba del
  campo". Forzarlos requeriría variantes innecesarias.

## Diseño

### Componente

- **Selector:** `ui-label`
- **Ubicación:** `src/components/atoms/label/label.component.ts` + `label.component.html`
- **Convención:** standalone, prefijo `ui-`, igual que el resto de `atoms/`.

### API

| Propiedad | Tipo | Default | Para qué |
|-----------|------|---------|----------|
| `for` (alias de `htmlFor`) | `string` | `''` | Cablea `<label for>` al `id` del control. |
| `required` | `boolean` (booleanAttribute) | `false` | Muestra el asterisco `*` en color destructive. |
| contenido proyectado | `<ng-content />` | — | El texto/markup del label. |

`htmlFor` se declara con `input<string>('', { alias: 'for' })` para poder usar `for="..."`
en la plantilla del consumidor sin colisionar con la palabra reservada.

### Template (`label.component.html`)

```html
<label
  [attr.for]="htmlFor() || null"
  class="block mb-1.5 text-sm font-medium text-[var(--color-foreground)]"
>
  <ng-content />
  @if (required()) {
    <span class="text-[var(--color-destructive)]">*</span>
  }
</label>
```

Las clases se copian exactamente del markup actual de `ui-input` para no introducir cambios
visuales.

### Component class (`label.component.ts`)

```ts
import { Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'ui-label',
  templateUrl: './label.component.html',
})
export class LabelComponent {
  readonly htmlFor = input<string>('', { alias: 'for' });
  readonly required = input(false, { transform: booleanAttribute });
}
```

### Uso standalone

```html
<ui-label for="custom-field" required>Nombre</ui-label>
<mi-control-custom id="custom-field" />
```

### Refactor interno

`ui-input`, `ui-textarea` y `ui-select` reemplazan su bloque `<label>` por:

```html
@if (label()) {
  <ui-label [for]="id()" [required]="required()">{{ label() }}</ui-label>
}
```

Cada uno importa `LabelComponent` en su `imports: [...]`.

## Accesibilidad

Sin cambios respecto al comportamiento actual: `for`/`id` se siguen cableando, así que el clic
en el label enfoca el control y los lectores de pantalla mantienen la asociación.

## Verificación

- `ui-label` standalone renderiza `<label>` con el `for` correcto y el asterisco cuando
  `required` está activo.
- El clic en `ui-label` enfoca el control referenciado por `for`.
- `ui-input`, `ui-textarea` y `ui-select` siguen renderizando su label igual que antes
  (sin regresión visual) y el clic en el label sigue enfocando el control.
- `npm test` pasa.
