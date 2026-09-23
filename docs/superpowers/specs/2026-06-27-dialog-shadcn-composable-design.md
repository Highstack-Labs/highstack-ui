# Dialog/Modal: modelo composicional estilo shadcn

**Fecha:** 2026-06-27
**Estado:** Diseño aprobado (Opción A)

## Problema

Hoy conviven **dos modelos de spacing** en el sistema Dialog/Modal:

- **`<ui-modal>` declarativo** — compone bien: el panel es `flex flex-col gap-6 py-6` (sin padding horizontal) y cada hijo (`ui-modal-header/content/footer`) aporta su propio `px-6`. El header lleva `pr-12` para esquivar el botón (X) absoluto.
- **`DialogService.open(Componente)`** — el `dialog-outlet` envuelve el componente en un `<div class="px-6 [&>*]:flex [&>*]:flex-col [&>*]:gap-4">` ad-hoc que **no lleva `pr-12`**. Resultado: el título del componente choca con la X y el spacing se siente distinto al resto. Además **no hay forma de pasar un título/descripción** a `open()` (sí existe en `confirm`/`alert`).

## Objetivo

Alinear el path imperativo con el modelo composicional de shadcn: un **único** sistema de spacing, el componente dinámico compone con las mismas piezas que el modal declarativo, y un atajo opcional (`title`/`description`) para los casos simples.

## Diseño (Opción A — composicional puro)

### 1. `dialog-outlet`: caso `component`

El header pasa a ser **opcional y automático** vía opciones, y el cuerpo del
componente conserva un **padding por defecto** (no se exige composición). Nuevo
render del caso `component`:

```html
@case ('component') {
  @if (d.options.title || d.options.description) {
    <ui-modal-header>
      @if (d.options.title) {
        <ui-modal-title>{{ d.options.title }}</ui-modal-title>
      }
      @if (d.options.description) {
        <ui-modal-description>{{ d.options.description }}</ui-modal-description>
      }
    </ui-modal-header>
  }
  <div class="px-6 [&>*]:flex [&>*]:flex-col [&>*]:gap-4">
    <ng-container *ngComponentOutlet="d.component!; injector: d.injector!" />
  </div>
}
```

- **El cuerpo mantiene el wrapper con padding por defecto** (`px-6` + gap entre
  los elementos raíz del componente). Un componente con contenido "plano" sigue
  quedando bien espaciado, sin obligar a usar sub-componentes.
- **Lo que cambia / arregla:** si el dev pasa `title`/`description` en `open()`,
  el outlet renderiza el `<ui-modal-header>` **por encima** del wrapper, con su
  propio `px-6 pr-12`. Así el título nunca choca con la X (el bug actual ocurría
  porque el título iba dentro del wrapper sin `pr-12`).
- El header automático usa exactamente las mismas piezas (`ui-modal-header/
  title/description`) que `confirm`/`alert` → un solo modelo visual de header en
  todo el sistema.

**Nota:** el componente ya no necesita escribir su propio `<h2>`/título a mano;
lo pasa por opción. Si aún así quiere un header custom dentro del cuerpo, puede,
pero pierde el `pr-12` (igual que hoy) — por eso se recomienda la opción.

### 2. Tipos: `DialogOptions`

Añadir a `DialogOptions` (path `open`):

```ts
export interface DialogOptions<D = unknown> extends DialogBaseOptions {
  data?: D;
  /** Título opcional; renderiza un ui-modal-header automático arriba del componente. */
  title?: string;
  /** Descripción opcional bajo el título. */
  description?: string;
}
```

`DialogInstance.options` debe transportar `title`/`description`, así que `baseOptions()` en el servicio los reenvía cuando `kind === 'component'`. (confirm/alert mantienen su `title` + `message` actuales sin cambios.)

### 3. `confirm` / `alert`

Sin cambios funcionales: ya renderizan `ui-modal-header` + `ui-modal-footer` correctamente. Se dejan igual.

### 4. Modal: sin cambios estructurales

El panel y los subcomponentes ya están bien. El `pr-12` del header ya esquiva la X. No se toca `modal.component.ts/html` salvo que la verificación visual revele algo.

### 5. Dos árboles de componentes

Replicar **todos** los cambios de código en ambos árboles (ver memoria `two-component-trees`):

- `src/components/atoms/dialog/` (showcase)
- `projects/highstack/ui/src/lib/atoms/dialog/` (publicable)

No hacen falta exports nuevos en `public-api.ts`: el componente del consumidor
sigue usando contenido plano y el outlet provee header + padding.

### 6. Documentación IA y ejemplos

- **`AI-USAGE-GUIDE.md` (raíz)** sección Dialog:
  - Documentar `opts.title` / `opts.description` en `open()`.
  - Aclarar el ejemplo de componente dinámico: el cuerpo sigue siendo "PLANO (el
    diálogo le da el padding)", pero el **título/descripción se pasan por opción**
    (`open({ title, description })`) en vez de escribir un `<h2>` a mano.
  - Tras editar la raíz, `cp AI-USAGE-GUIDE.md public/AI-USAGE-GUIDE.md` (ver memoria `ai-guide-two-copies`).
- **`src/app/pages/atoms/dialog/dialog.page.ts`**:
  - `EditNameDialogComponent`: quitar el bloque `<h2>` + `<p>` del template (el
    header ahora viene del outlet); dejar solo input + botones. `openComponent()`
    pasa `{ title: 'Editar nombre', description: '…' }`.
  - Actualizar el snippet `componentCode` para que coincida.
- **`src/app/pages/atoms/dialog/dialog.page.html`**: añadir filas `opts.title` y `opts.description` a la tabla de API Reference.

## Testing

- `npm test` — los specs existentes de `dialog.service` deben seguir verdes.
- Verificación visual: abrir un dialog de componente con `title`/`description` y confirmar que el header se ve igual que en confirm/alert, sin choque con la X y con spacing consistente.

## Fuera de alcance

- No se rediseña `confirm`/`alert`.
- No se añade `footer`/botones automáticos a `open()` (el componente arma su propio footer).
- No se toca la animación, scroll-lock ni a11y del modal base.
