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

Se elimina el wrapper hacky. El nuevo render del caso `component`:

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
  <ng-container *ngComponentOutlet="d.component!; injector: d.injector!" />
}
```

- El componente proyectado se renderiza **directo**, sin wrapper que altere el padding.
- El componente es responsable de su estructura usando las piezas composables (`<ui-modal-content>`, `<ui-modal-footer>`), idéntico al uso declarativo de `<ui-modal>`. Son las que aportan `px-6`.
- Si el dev pasa `title`/`description` en `open()`, el outlet renderiza el `<ui-modal-header>` automáticamente (con su `px-6 pr-12`), sin que el componente tenga que escribirlo.

**Tradeoff aceptado:** un componente que proyecte contenido "plano" (sin `ui-modal-content`) quedará sin padding horizontal. Es el modelo shadcn-puro: se compone con las piezas. Los ejemplos se actualizan para reflejarlo.

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

Verificar que `projects/highstack/ui/src/public-api.ts` exporta `ModalContentComponent`, `ModalFooterComponent`, `ModalHeaderComponent`, `ModalTitleComponent`, `ModalDescriptionComponent` (el componente dinámico del consumidor los necesita para componer). Añadir los que falten.

### 6. Documentación IA y ejemplos

- **`AI-USAGE-GUIDE.md` (raíz)** sección Dialog:
  - Documentar `opts.title` / `opts.description` en `open()`.
  - Cambiar el ejemplo de componente dinámico: ya **no** es "PLANO (el diálogo le da el padding)"; ahora compone con `<ui-modal-content>` / `<ui-modal-footer>`, o usa `title`/`description` para el header.
  - Tras editar la raíz, `cp AI-USAGE-GUIDE.md public/AI-USAGE-GUIDE.md` (ver memoria `ai-guide-two-copies`).
- **`src/app/pages/atoms/dialog/dialog.page.ts`**:
  - `EditNameDialogComponent` se reescribe para componer con `ui-modal-content`/`ui-modal-footer` (importándolos) en vez de divs con clases sueltas; el header se pasa vía `open({ title, description })`.
  - Actualizar el snippet `componentCode` para que coincida.
- **`src/app/pages/atoms/dialog/dialog.page.html`**: añadir filas `opts.title` y `opts.description` a la tabla de API Reference.

## Testing

- `npm test` — los specs existentes de `dialog.service` deben seguir verdes.
- Verificación visual: abrir un dialog de componente con `title`/`description` y confirmar que el header se ve igual que en confirm/alert, sin choque con la X y con spacing consistente.

## Fuera de alcance

- No se rediseña `confirm`/`alert`.
- No se añade `footer`/botones automáticos a `open()` (el componente arma su propio footer).
- No se toca la animación, scroll-lock ni a11y del modal base.
