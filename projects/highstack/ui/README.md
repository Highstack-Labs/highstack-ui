# @highstacklabs2026/ui

Colección de componentes de UI premium para **Angular 22**, diseñados para funcionar de forma nativa con **Tailwind CSS v4**. Todos los componentes son standalone y usan **Angular Signals** para el estado reactivo.

## Instalación

```bash
npm install @highstacklabs2026/ui
```

### Peer dependencies

Requiere Angular 22+:

```jsonc
"@angular/common": "^22.0.0",
"@angular/core": "^22.0.0"
```

Los componentes de formulario requieren además `@angular/forms`. Para Signal Forms (`[formField]`, experimental en Angular 22) se usa `@angular/forms/signals`.

## Configuración de estilos

La librería ya incluye su propio CSS precompilado con todas las utilidades que usan los componentes **y** los tokens de tema por defecto. Solo tienes que importarlo una vez en tu archivo global de estilos:

```css
@import '@highstacklabs2026/ui/styles.css';
```

No necesitas Tailwind en tu app, ni añadir `@source` apuntando a `node_modules`. El CSS **no incluye preflight** (el reset global de Tailwind), así que no pisa los estilos base de tu aplicación.

## Temas y modo oscuro

Hay **6 paletas** (`default`/zinc, `indigo`, `teal`, `violet`, `rose`, `orange`) y **modo oscuro**, combinables entre sí. Se activan con el provider:

```ts
// app.config.ts
import { provideHighstack } from '@highstacklabs2026/ui';

export const appConfig: ApplicationConfig = {
  providers: [provideHighstack({ theme: 'indigo', dark: true })],
};
```

O directamente con clases en el `<body>`:

```html
<body class="theme-indigo dark">
  <!-- tema indigo + modo oscuro -->
</body>
```

- Clases de tema: `theme-indigo | theme-teal | theme-violet | theme-rose | theme-orange`. Sin clase = paleta por defecto (zinc).
- Modo oscuro: clase `dark`.
- `provideHighstack(config)` acepta `{ theme?: HighstackTheme; dark?: boolean }` y aplica las clases al `<body>` al arrancar.

### Re-tematizar

Si ninguna paleta te sirve, redefine los tokens CSS **después** del import:

```css
@import '@highstacklabs2026/ui/styles.css';

:root {
  --color-primary: oklch(0.55 0.2 264); /* tu color de marca */
  --color-primary-foreground: oklch(0.985 0 0);
  --radius: 0.5rem;
}
```

Tokens disponibles: `--color-background`, `--color-foreground`, `--color-primary(-foreground)`, `--color-destructive(-foreground)`, `--color-secondary(-foreground)`, `--color-accent(-foreground)`, `--color-muted(-foreground)`, `--color-border`, `--color-input`, `--color-ring`, `--radius`.

Los componentes nunca hardcodean colores: todo sale de estos tokens.

## Uso

Los componentes son standalone, así que se importan directamente en el array `imports`:

```ts
import { Component } from '@angular/core';
import { ButtonComponent } from '@highstacklabs2026/ui';

@Component({
  selector: 'app-mi-componente',
  imports: [ButtonComponent],
  template: `<ui-button variant="gradient">Mi Botón</ui-button>`,
})
export class MiComponente {}
```

## Formularios

Los componentes de formulario (**Input, Textarea, Checkbox, Switch, Radio, Select, Segmented, Datepicker**) soportan tres formas de enlace sobre la misma fuente de verdad:

```html
<!-- a) Two-way simple -->
<ui-input [(value)]="texto" />
<ui-checkbox [(checked)]="acepto" />

<!-- b) Reactive Forms / ngModel (ControlValueAccessor) -->
<ui-input [formControl]="ctrl" />
<ui-input formControlName="email" />

<!-- c) Signal Forms (Angular 22, experimental) -->
<ui-input [formField]="form.email" />
```

Input, Textarea, Select, Segmented y Datepicker usan `value` (string); Checkbox y Switch usan `checked` (boolean); Radio usa `value` en el **grupo**.

### Errores y textos de ayuda

Mismo contrato en Input, Textarea, Select, Datepicker, Checkbox, Segmented y Radio (en el grupo):

| Input                | Comportamiento                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `error`              | Mensaje manual. **Gana sobre todo lo demás** y se muestra de inmediato (no espera `touched`). |
| `errors` + `touched` | Los cablea Signal Forms solo con `[formField]`. Se muestran **solo tras interactuar**.      |
| `invalid` + `touched`| Marca el borde en rojo y `aria-invalid` aunque no haya texto que mostrar.                   |
| `hint`               | Texto de ayuda. Se muestra **solo cuando no hay error**.                                    |

El mensaje se renderiza debajo del control (en Radio, debajo del grupo). Con Reactive Forms no hay cableado automático: pasa tú `[error]` o `[invalid]`/`[touched]`.

## Componentes

### `<ui-button>`

```html
<ui-button variant="gradient" size="lg">Empezar</ui-button>
<ui-button variant="outline" [loading]="cargando">Guardar</ui-button>
<ui-button size="icon" variant="ghost" aria-label="Cerrar">✕</ui-button>
```

| Prop       | Tipo                                                                                                              | Default     |
| ---------- | ----------------------------------------------------------------------------------------------------------------- | ----------- |
| `variant`  | `'default' \| 'secondary' \| 'destructive' \| 'outline' \| 'ghost' \| 'link' \| 'gradient' \| 'glass' \| 'success' \| 'warning'` | `'default'` |
| `size`     | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'icon'`                                                                          | `'md'`      |
| `disabled` | `boolean`                                                                                                           | `false`     |
| `loading`  | `boolean` (deshabilita y muestra spinner)                                                                           | `false`     |
| `pill`     | `boolean` (bordes completamente redondeados)                                                                        | `false`     |
| `full`     | `boolean` (ancho completo)                                                                                          | `false`     |
| `type`     | `'button' \| 'submit' \| 'reset'`                                                                                 | `'button'`  |

### `<ui-input>`

```html
<ui-input label="Email" type="email" placeholder="tu@correo.com" [(value)]="email" hint="No lo compartiremos." />
<ui-input label="Contraseña" type="password" />
<ui-input placeholder="Buscar…"><svg slot="prefix">…</svg></ui-input>
```

| Prop             | Tipo                                                                    | Default  |
| ---------------- | ----------------------------------------------------------------------- | -------- |
| `value`          | `string` (model, two-way)                                                 | `''`     |
| `type`           | `'text' \| 'email' \| 'password' \| 'number' \| 'search' \| 'tel' \| 'url'` | `'text'` |
| `size`           | `'sm' \| 'md' \| 'lg'`                                                  | `'md'`   |
| `label`, `hint`, `error`, `placeholder`, `name`, `id` | `string`                           | `''`     |
| `disabled`, `readonly`, `required`                    | `boolean`                          | `false`  |
| `passwordToggle` | `boolean` (ojito para `type="password"`)                                  | `true`   |
| `invalid`, `touched`, `errors`                        | estado de validación               | —        |

Slots: `[slot=prefix]` y `[slot=suffix]` para íconos.

### `<ui-label>`

Etiqueta suelta para controles propios. `<ui-input>`, `<ui-textarea>` y `<ui-select>` ya renderizan su label vía su prop `label`.

```html
<ui-label for="campo" required>Nombre</ui-label>
<mi-control id="campo"></mi-control>
```

| Prop       | Tipo      | Default |
| ---------- | --------- | ------- |
| `for`      | `string`  | `''`    |
| `required` | `boolean` (muestra `*`) | `false` |

### `<ui-textarea>`

```html
<ui-textarea label="Biografía" [rows]="5" [autoGrow]="true" [(value)]="bio" />
```

| Prop       | Tipo                    | Default |
| ---------- | ----------------------- | ------- |
| `value`    | `string` (model)          | `''`    |
| `rows`     | `number`                  | `4`     |
| `autoGrow` | `boolean` (crece con el contenido) | `false` |

Más `label`, `hint`, `error`, `placeholder`, `disabled`, `readonly`, `required` y el contrato de validación.

### `<ui-checkbox>`

```html
<ui-checkbox label="Acepto los términos" [(checked)]="acepto" />
<ui-checkbox label="Todo" [indeterminate]="parcial" />
```

| Prop            | Tipo             | Default |
| --------------- | ---------------- | ------- |
| `checked`       | `boolean` (model)  | `false` |
| `size`          | `'sm' \| 'md'`   | `'md'`  |
| `label`, `description`, `hint`, `error` | `string` | `''` |
| `disabled`, `required`, `indeterminate` | `boolean` | `false` |

`description` va en línea junto al label; `hint` va debajo de todo el control.

### `<ui-switch>`

```html
<ui-switch label="Notificaciones" [(checked)]="notif" />
```

| Prop      | Tipo            | Default |
| --------- | --------------- | ------- |
| `checked` | `boolean` (model) | `false` |
| `size`    | `'sm' \| 'md'`  | `'md'`  |

Más `label`, `description`, `disabled`, `required`.

### `<ui-radio-group>` + `<ui-radio>`

```html
<ui-radio-group [(value)]="plan" appearance="card" orientation="horizontal">
  <ui-radio value="free" label="Free" description="$0/mes" />
  <ui-radio value="pro" label="Pro" description="$29/mes" />
</ui-radio-group>
```

| Prop (grupo)  | Tipo                            | Default      |
| ------------- | ------------------------------- | ------------ |
| `value`       | `string` (model)                  | `''`         |
| `orientation` | `'vertical' \| 'horizontal'`    | `'vertical'` |
| `appearance`  | `'default' \| 'card'`           | `'default'`  |
| `size`        | `'sm' \| 'md'`                  | `'md'`       |

Más `name`, `id`, `hint`, `error`, `disabled`, `required`. En `<ui-radio>`: `value` (**requerido**), `label`, `description`, `disabled`.

Exporta `RadioGroupComponent` y `RadioComponent` — hay que importar **ambos**.

### `<ui-segmented>`

Selección única con apariencia de botones conectados. Data-driven.

```html
<!-- modelos = [{ value: 'gpt', label: 'GPT-4' }, { value: 'claude', label: 'Claude' }] -->
<ui-segmented [options]="modelos" [(value)]="modelo" />
```

| Prop        | Tipo                 | Default |
| ----------- | -------------------- | ------- |
| `value`     | `string` (model)       | `''`    |
| `options`   | `SegmentedOption[]`    | `[]`    |
| `size`      | `'sm' \| 'md'`       | `'md'`  |
| `fullWidth` | `boolean`              | `false` |

`SegmentedOption`: `{ value, label, icon?, disabled? }` (`icon` es SVG inline). Más `name`, `id`, `hint`, `error`, `required` y el contrato de validación.

### `<ui-select>` + `<ui-option>`

```html
<ui-select label="País" placeholder="Elige…" [(value)]="pais">
  <ui-option value="mx">México</ui-option>
  <ui-option value="co">Colombia</ui-option>
  <ui-option value="ar" disabled>Argentina</ui-option>
</ui-select>
```

| Prop          | Tipo                   | Default |
| ------------- | ---------------------- | ------- |
| `value`       | `string` (model)         | `''`    |
| `size`        | `'sm' \| 'md' \| 'lg'` | `'md'`  |
| `placeholder`, `label`, `hint`, `error` | `string` | `''` |
| `disabled`, `required`                  | `boolean` | `false` |

`<ui-option>`: `value` (**requerido**), `disabled`.

### `<ui-calendar>`

Cuadrícula de un mes para elegir una fecha. Se puede embeber suelto, sin campo de texto.

> **El valor es un string ISO `'YYYY-MM-DD'`, o `''` si no hay fecha. Nunca un `Date`.** Si le pasas un `Date` o un ISO con hora, se normaliza a `''`.

```html
<ui-calendar [(value)]="fecha" min="2026-08-01" max="2026-12-31" />
<ui-calendar [(value)]="fecha" locale="en-US" [dateDisabled]="soloEntreSemana" />
```

| Prop            | Tipo                          | Default   |
| --------------- | ----------------------------- | --------- |
| `value`         | `string` ISO (model)            | `''`      |
| `month`         | `string` ISO (mes inicial)      | del `value`, o hoy |
| `locale`        | `string`                        | `'es-MX'` |
| `weekStartsOn`  | `number` (`0` = domingo)        | del locale |
| `min`, `max`    | `string` ISO                    | `''`      |
| `disabledDates` | `readonly string[]`             | `[]`      |
| `dateDisabled`  | `(iso: string) => boolean`      | —         |

Los nombres de mes/día y el inicio de semana salen de `Intl`: no hay texto hardcodeado. Teclado: ←/→ un día, ↑/↓ una semana, Inicio/Fin extremos de la semana, AvPág/RePág un mes (con Shift, un año), Enter selecciona.

### `<ui-datepicker>`

Campo de fecha: compone `<ui-input>` (campo, label y mensaje) con `<ui-calendar>` (panel flotante). Se puede **teclear o elegir**; el orden al teclear lo define el locale (`dd/mm/aaaa` en es-MX, `mm/dd/aaaa` en en-US).

```html
<ui-datepicker label="Fecha de nacimiento" [(value)]="fecha" hint="Puedes escribirla o elegirla." />
<ui-datepicker label="Cita" min="2026-08-01" max="2026-12-31" [formControl]="ctrl" />
```

Acepta los props de formulario (`value` model ISO, `label`, `hint`, `error`, `placeholder`, `name`, `id`, `size`, `disabled`, `readonly`, `required`, `invalid`, `touched`, `errors`) **más** los del calendario (`locale`, `weekStartsOn`, `min`, `max`, `disabledDates`, `dateDisabled`).

Los errores de formato aparecen solo al salir del campo, nunca mientras se escribe. El panel se voltea solo si no cabe en el viewport.

### `<ui-badge>`

```html
<ui-badge color="success" variant="soft" [dot]="true">Activo</ui-badge>
<ui-badge [removable]="true" (remove)="quitar()">Angular</ui-badge>
```

| Prop        | Tipo                                                                | Default     |
| ----------- | ------------------------------------------------------------------- | ----------- |
| `variant`   | `'solid' \| 'soft' \| 'outline' \| 'glass'`                         | `'soft'`    |
| `color`     | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'destructive'` | `'primary'` |
| `size`      | `'sm' \| 'md'`                                                      | `'md'`      |
| `dot`, `removable` | `boolean`                                                    | `false`     |

Output `(remove)`. Slot `[slot=icon]`.

### `<ui-avatar>` + `<ui-avatar-group>`

```html
<ui-avatar [src]="foto" name="Juan Díaz" status="online" size="lg" />
<ui-avatar name="Ana López" />
<!-- fallback a iniciales "AL" -->

<ui-avatar-group [max]="3">
  <ui-avatar name="A B" />
  <ui-avatar name="C D" />
</ui-avatar-group>
```

| Prop     | Tipo                                                    | Default    |
| -------- | ------------------------------------------------------- | ---------- |
| `src`, `name`, `alt` | `string`                                    | `''`       |
| `size`   | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`                  | `'md'`     |
| `shape`  | `'circle' \| 'square'`                                  | `'circle'` |
| `status` | `'online' \| 'offline' \| 'away' \| 'busy' \| null`     | `null`     |

`<ui-avatar-group>`: `max` (number), `size`.

### `<ui-card>`

```html
<ui-card>
  <ui-card-header>
    <ui-card-title>Plan Pro</ui-card-title>
    <ui-card-description>Para equipos.</ui-card-description>
  </ui-card-header>
  <ui-card-content>$29/mes</ui-card-content>
  <ui-card-footer><ui-button [full]="true">Empezar</ui-button></ui-card-footer>
</ui-card>
```

| Prop      | Tipo                                                  | Default      |
| --------- | ----------------------------------------------------- | ------------ |
| `variant` | `'elevated' \| 'outline' \| 'soft' \| 'interactive'`  | `'elevated'` |

Exporta `CardComponent` + `Card{Header,Title,Description,Content,Footer}Component`.

### `<ui-modal>`

Ventana modal con overlay, animación de entrada/salida, bloqueo del scroll del body, cierre con `Escape` / clic en el fondo y accesibilidad básica. Se controla con un signal vía `[(open)]`.

```ts
import { Component, signal } from '@angular/core';
import {
  ButtonComponent,
  ModalComponent,
  ModalHeaderComponent,
  ModalTitleComponent,
  ModalDescriptionComponent,
  ModalContentComponent,
  ModalFooterComponent,
} from '@highstacklabs2026/ui';

@Component({
  selector: 'app-demo',
  imports: [
    ButtonComponent,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleComponent,
    ModalDescriptionComponent,
    ModalContentComponent,
    ModalFooterComponent,
  ],
  template: `
    <ui-button (click)="open.set(true)">Abrir modal</ui-button>

    <ui-modal [(open)]="open">
      <ui-modal-header>
        <ui-modal-title>¿Eliminar proyecto?</ui-modal-title>
        <ui-modal-description>Esta acción no se puede deshacer.</ui-modal-description>
      </ui-modal-header>

      <ui-modal-content> Se borrarán todos los archivos asociados de forma permanente. </ui-modal-content>

      <ui-modal-footer>
        <ui-button variant="ghost" (click)="open.set(false)">Cancelar</ui-button>
        <ui-button variant="destructive" (click)="open.set(false)">Eliminar</ui-button>
      </ui-modal-footer>
    </ui-modal>
  `,
})
export class DemoComponent {
  open = signal(false);
}
```

Las partes (`ui-modal-header`, `ui-modal-title`, etc.) son **opcionales**: dentro de `<ui-modal>` puedes proyectar cualquier contenido libre.

| Prop              | Tipo                                     | Default | Descripción                                      |
| ----------------- | ---------------------------------------- | ------- | ------------------------------------------------ |
| `open`            | `boolean` (model, two-way `[(open)]`)      | `false` | Abre / cierra el modal.                          |
| `size`            | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'`  | Ancho máximo del panel.                          |
| `closeOnBackdrop` | `boolean`                                  | `true`  | Cerrar al hacer clic en el fondo.                |
| `closeOnEscape`   | `boolean`                                  | `true`  | Cerrar al pulsar `Escape`.                       |
| `showClose`       | `boolean`                                  | `true`  | Muestra el botón (X) de cerrar.                  |
| `ariaLabel`       | `string`                                   | —       | Etiqueta accesible (usa el título si lo omites). |

| Evento   | Cuándo se emite                        |
| -------- | -------------------------------------- |
| `opened` | El modal terminó de abrirse.           |
| `closed` | El modal se cerró (por cualquier vía). |

Componentes exportados: `ModalComponent`, `ModalHeaderComponent`, `ModalTitleComponent`, `ModalDescriptionComponent`, `ModalContentComponent`, `ModalFooterComponent`.

### `<ui-drawer>`

Panel deslizante anclado a un borde. Mismo control y subcomponentes que el modal (`[(open)]`, header/title/description/content/footer), pero entra desde un lado. Ideal para navegación móvil, filtros y formularios laterales.

```html
<ui-button (click)="open.set(true)">Abrir panel</ui-button>

<ui-drawer [(open)]="open" side="right">
  <ui-drawer-header>
    <ui-drawer-title>Filtros</ui-drawer-title>
    <ui-drawer-description>Ajusta los resultados.</ui-drawer-description>
  </ui-drawer-header>
  <ui-drawer-content>…</ui-drawer-content>
  <ui-drawer-footer>
    <ui-button variant="ghost" (click)="open.set(false)">Cancelar</ui-button>
    <ui-button (click)="open.set(false)">Aplicar</ui-button>
  </ui-drawer-footer>
</ui-drawer>
```

| Prop   | Tipo                                     | Default   |
| ------ | ---------------------------------------- | --------- |
| `open` | `boolean` (model, two-way `[(open)]`)      | `false`   |
| `side` | `'right' \| 'left' \| 'top' \| 'bottom'` | `'right'` |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'`    |

También: `closeOnBackdrop`, `closeOnEscape`, `showClose` (todos `true`), `ariaLabel`, y outputs `(opened)`/`(closed)`. Exporta `DrawerComponent` + `Drawer{Header,Title,Description,Content,Footer}Component`.

### `DialogService` (modales imperativos)

Versión imperativa del modal: lo abres desde TypeScript, sin declarar `<ui-modal>` en el HTML. Se auto-monta (cero setup), reutiliza `<ui-modal>` por dentro y toda la API es basada en `Promise`.

```ts
import { inject } from '@angular/core';
import { DialogService, DialogRef, DIALOG_DATA } from '@highstacklabs2026/ui';

private dialog = inject(DialogService);

const ok = await this.dialog.confirm({
  title: '¿Eliminar proyecto?',
  message: 'Esta acción no se puede deshacer.',
  confirmText: 'Eliminar',
  confirmVariant: 'destructive',
});
if (ok) this.borrar();

await this.dialog.alert({ title: 'Listo', message: 'Cambios guardados.' });

const ref = this.dialog.open(EditarUsuarioComponent, {
  data: { id: 42 },
  title: 'Editar usuario',
  size: 'lg',
});
const result = await ref.closed;
```

| Método                     | Devuelve            | Opciones                                                                                  |
| -------------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| `confirm(opts)`            | `Promise<boolean>`  | `message` (req.), `title?`, `confirmText?` (`'Confirmar'`), `cancelText?` (`'Cancelar'`), `confirmVariant?` |
| `alert(opts)`              | `Promise<void>`     | `message` (req.), `title?`, `confirmText?` (`'Aceptar'`)                                    |
| `open<R>(Componente, opts)`| `DialogRef<R>`      | `data?` (inyectable con `DIALOG_DATA`), `title?`, `description?`, más los props de `<ui-modal>` |

`ref.closed` es una `Promise` con el resultado; el componente se cierra con `ref.close(resultado)`. Cerrar por backdrop/Escape/✕ resuelve `confirm` como `false` y `open()` como `undefined`.

En el componente dinámico, escribe solo el cuerpo plano — el diálogo pone el padding, y `title`/`description` de `open()` renderizan el header:

```ts
export class EditarUsuarioComponent {
  private ref = inject(DialogRef<Usuario>);
  protected data = inject(DIALOG_DATA);
  guardar(u: Usuario) {
    this.ref.close(u);
  }
}
```

### `<ui-popover>`

Contenedor flotante de contenido libre, anclado a un disparador. A diferencia del dropdown (menú de ítems) o el tooltip (solo texto en hover), proyecta cualquier HTML. Abre al hacer clic; cierra con clic-afuera o `Escape`.

```html
<ui-popover side="bottom" align="start">
  <ui-button uiPopoverTrigger variant="outline">Dimensiones</ui-button>

  <div class="space-y-2">
    <ui-input label="Ancho" />
    <ui-input label="Alto" />
  </div>
</ui-popover>
```

| Prop    | Tipo                                     | Default    |
| ------- | ---------------------------------------- | ---------- |
| `side`  | `'bottom' \| 'top' \| 'left' \| 'right'` | `'bottom'` |
| `align` | `'start' \| 'center' \| 'end'`           | `'center'` |

`side`/`align` son la posición **preferida**: si el panel no cabe en el viewport, se voltea automáticamente al lado/alineación opuesta. El disparador se marca con la directiva `[uiPopoverTrigger]`. Exporta `PopoverComponent` y `PopoverTriggerDirective`.

### `<ui-dropdown>`

Menú de acciones anclado a un botón, con auto-flip igual que el popover.

```html
<ui-dropdown align="end">
  <ui-button uiDropdownTrigger variant="outline">Opciones</ui-button>
  <ui-dropdown-label>Cuenta</ui-dropdown-label>
  <ui-dropdown-item (select)="editar()">Editar <span slot="shortcut">⌘E</span></ui-dropdown-item>
  <ui-dropdown-separator />
  <ui-dropdown-item destructive (select)="borrar()">Eliminar</ui-dropdown-item>
</ui-dropdown>
```

| Prop    | Tipo                 | Default    |
| ------- | -------------------- | ---------- |
| `side`  | `'bottom' \| 'top'`  | `'bottom'` |
| `align` | `'start' \| 'end'`   | `'start'`  |

`<ui-dropdown-item>`: output `(select)`, props `destructive`, `disabled`, slots `[slot=icon]` / `[slot=shortcut]`. Exporta `DropdownComponent`, `DropdownTriggerDirective`, `DropdownItemComponent`, `DropdownLabelComponent`, `DropdownSeparatorComponent`.

### `[uiTooltip]` (directiva)

```html
<ui-button uiTooltip="Guardar cambios">Guardar</ui-button>
<span uiTooltip="Info" tooltipPlacement="right">ⓘ</span>
```

| Prop               | Tipo                                     | Default |
| ------------------ | ---------------------------------------- | ------- |
| `uiTooltip`        | `string` (texto)                           | —       |
| `tooltipPlacement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` |
| `tooltipDelay`     | `number` (ms)                              | `300`   |
| `tooltipDisabled`  | `boolean`                                  | `false` |

### `<ui-alert>`

```html
<ui-alert type="success" title="Guardado" [closable]="true" (close)="ocultar()">
  Tus cambios se aplicaron.
</ui-alert>
```

| Prop       | Tipo                                            | Default  |
| ---------- | ----------------------------------------------- | -------- |
| `type`     | `'info' \| 'success' \| 'warning' \| 'error'`   | `'info'` |
| `variant`  | `'soft' \| 'solid'`                             | `'soft'` |
| `title`    | `string`                                          | `''`     |
| `closable` | `boolean`                                         | `false`  |

Output `(close)`. El cuerpo va proyectado.

### `ToastService`

Notificaciones flotantes. El contenedor se auto-monta: no hay que declarar nada en el HTML.

```ts
import { inject } from '@angular/core';
import { ToastService } from '@highstacklabs2026/ui';

private toast = inject(ToastService);

this.toast.success('Guardado');
this.toast.error('Falló', { title: 'Error', duration: 8000 });
this.toast.show({
  type: 'info',
  message: 'Eliminado',
  action: { label: 'Deshacer', handler: () => this.undo() },
});
```

- `success` / `error` / `warning` / `info(message, opts?)`, `show(opts)`, `dismiss(id)`, `setPosition(pos)`.
- `opts`: `{ type?, title?, message, duration? (ms, 0 = no auto-cierra), action?: { label, handler } }`.
- Posiciones: `'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'` (def. `'bottom-right'`). Llama a `setPosition()` una vez al inicio; cambiarla en caliente descarta los toasts visibles.

### `<ui-tabs>` + `<ui-tab>`

```html
<ui-tabs [(value)]="activa" variant="pills">
  <ui-tab value="cuenta" label="Cuenta">Contenido de cuenta…</ui-tab>
  <ui-tab value="seguridad" label="Seguridad">Contenido…</ui-tab>
</ui-tabs>
```

| Prop      | Tipo                        | Default       |
| --------- | --------------------------- | ------------- |
| `value`   | `string` (model)              | `''`          |
| `variant` | `'underline' \| 'pills'`    | `'underline'` |
| `size`    | `'sm' \| 'md'`              | `'md'`        |

`<ui-tab>`: `value` (**requerido**), `label`, `disabled`, slot `[slot=icon]`. Su contenido proyectado es el panel.

### `<ui-accordion>` + `<ui-accordion-item>`

```html
<ui-accordion [multiple]="false">
  <ui-accordion-item title="¿Qué incluye?">Contenido…</ui-accordion-item>
  <ui-accordion-item title="¿Precio?">Contenido…</ui-accordion-item>
</ui-accordion>
```

| Prop       | Tipo                                        | Default |
| ---------- | ------------------------------------------- | ------- |
| `multiple` | `boolean` (`false` = uno abierto a la vez)    | `false` |

`<ui-accordion-item>`: `title` (string), `disabled`.

### `<ui-breadcrumb>` + `<ui-breadcrumb-item>`

```html
<ui-breadcrumb>
  <ui-breadcrumb-item link="/">Inicio</ui-breadcrumb-item>
  <ui-breadcrumb-item link="/productos">Productos</ui-breadcrumb-item>
  <ui-breadcrumb-item>Camiseta</ui-breadcrumb-item>
</ui-breadcrumb>
```

`<ui-breadcrumb-item>`: `link` (string o array para `routerLink`). Sin `link` = ítem actual. El separador chevron es automático.

### `<ui-stepper>` + `<ui-step>`

API **híbrida**: los pasos se declaran por array `[steps]` o por componentes `<ui-step>` hijos.

```html
<!-- Data-driven -->
<ui-stepper [(active)]="paso" [steps]="[{ label: 'Cuenta' }, { label: 'Perfil' }, { label: 'Confirmar' }]" />

<!-- Composicional, con contenido por paso -->
<ui-stepper [(active)]="paso" orientation="vertical">
  <ui-step label="Cuenta" description="Email y contraseña">…contenido…</ui-step>
  <ui-step label="Perfil">…contenido…</ui-step>
</ui-stepper>
```

| Prop          | Tipo                            | Default        |
| ------------- | ------------------------------- | -------------- |
| `active`      | `number` (model, **0-based**)     | `0`            |
| `steps`       | `StepItem[]` = `{ label, description? }` | `[]`  |
| `orientation` | `'horizontal' \| 'vertical'`    | `'horizontal'` |
| `variant`     | `'circles' \| 'progress'`       | `'circles'`    |
| `showCheck`   | `boolean` (✓ en completados)      | `true`         |
| `linear`      | `boolean` (solo navega a pasos ya completados) | `false` |
| `clickable`   | `boolean`                         | `true`         |

### `<ui-table>`

Tabla **data-driven**: pasas `[data]` y `[columns]` y renderiza todo, incluido acceso anidado por path (`'direccion.ciudad'`). Para celdas con render custom, declaras un `<ng-template tableCell="FIELD">` y solo esa columna lo usa. No se escriben filas ni celdas a mano.

```ts
import { TableColumn } from '@highstacklabs2026/ui';

cols: TableColumn[] = [
  { field: 'nombre', header: 'Nombre', sortable: true },
  { field: 'direccion.ciudad', header: 'Ciudad', sortable: true }, // anidado
  { field: 'estado', header: 'Estado' },
  { header: 'Acciones', align: 'right' }, // sin field: solo template
];
```

```html
<ui-table [data]="users" [columns]="cols" rowKey="id" [selectable]="true" (selectionChange)="sel.set($event)">
  <ng-template tableCell="estado" let-value>
    <ui-badge [color]="value === 'activo' ? 'success' : 'secondary'" variant="soft">{{ value }}</ui-badge>
  </ng-template>

  <ng-template tableCell="Acciones" let-row="row">
    <ui-button size="sm" (click)="editar(row)">Editar</ui-button>
  </ng-template>
</ui-table>
```

| Prop           | Tipo                     | Default                        |
| -------------- | ------------------------ | ------------------------------ |
| `data`         | `T[]`                      | `[]`                           |
| `columns`      | `TableColumn[]`            | `[]`                           |
| `loading`      | `boolean` (filas skeleton) | `false`                        |
| `rowKey`       | `string` (id para track/selección) | `''`                   |
| `selectable`   | `boolean`                  | `false`                        |
| `emptyMessage` | `string`                   | `'No hay resultados'`          |
| `size`         | `'sm' \| 'md' \| 'lg'`   | `'md'`                         |
| `headerColor`  | `string` (CSS)             | `'var(--color-muted)'`         |
| `contentColor` | `string` (CSS)             | `'var(--color-background)'`    |

Outputs: `(sortChange)` → `{ field, direction }`, `(selectionChange)` → `T[]`.

`TableColumn`: `{ field?: string; header: string; sortable?: boolean; align?: 'left' | 'center' | 'right'; width?: string }`. El `tableCell="X"` debe coincidir exactamente con el `field` (o con el `header` si la columna no tiene `field`).

### `<ui-pagination>`

```html
<ui-pagination [(page)]="page" [totalPages]="20" />
<ui-pagination [(page)]="page" [totalPages]="20" variant="compact" />
<ui-pagination [(page)]="page" [totalPages]="20" [(pageSize)]="size" [pageSizeOptions]="[10, 25, 50]" />
```

| Prop              | Tipo                       | Default     |
| ----------------- | -------------------------- | ----------- |
| `page`            | `number` (model, **1-based**) | `1`        |
| `totalPages`      | `number`                     | `1`         |
| `variant`         | `'numbers' \| 'compact'`   | `'numbers'` |
| `size`            | `'sm' \| 'md' \| 'lg'`     | `'md'`      |
| `pageSize`        | `number` (model, opcional)   | —           |
| `pageSizeOptions` | `number[]`                   | `[]`        |

### Loading: `<ui-spinner>`, `<ui-skeleton>`, `<ui-progress>`

```html
<ui-spinner size="md" />
<ui-skeleton width="60%" />
<ui-skeleton width="2.5rem" height="2.5rem" [circle]="true" />
<ui-progress [value]="60" />
<ui-progress [indeterminate]="true" />
```

- **Spinner**: `size` (`'sm' | 'md' | 'lg'`). Hereda el color con `currentColor`.
- **Skeleton**: `width`, `height` (valores CSS), `circle` (boolean).
- **Progress**: `value` (0-100), `size` (`'sm' | 'md' | 'lg'`), `indeterminate`.

### `<ui-separator>`

```html
<ui-separator />

<div class="flex items-center gap-3 h-5">
  <span>Inicio</span>
  <ui-separator orientation="vertical" />
  <span>Perfil</span>
</div>
```

| Prop          | Tipo                         | Default        |
| ------------- | ---------------------------- | -------------- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `decorative`  | `boolean`                      | `true`         |

Pon `decorative="false"` si el separador divide grupos con significado semántico.

## Índice de exports

```
ButtonComponent, InputComponent, TextareaComponent, LabelComponent, CheckboxComponent, SwitchComponent,
RadioGroupComponent, RadioComponent, SegmentedComponent, SelectComponent, OptionComponent,
CalendarComponent, DatepickerComponent,
BadgeComponent, AvatarComponent, AvatarGroupComponent,
CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent,
ModalComponent, ModalHeaderComponent, ModalTitleComponent, ModalDescriptionComponent, ModalContentComponent, ModalFooterComponent,
DrawerComponent, DrawerHeaderComponent, DrawerTitleComponent, DrawerDescriptionComponent, DrawerContentComponent, DrawerFooterComponent,
PopoverComponent, PopoverTriggerDirective, SeparatorComponent,
DialogService, DialogRef, DIALOG_DATA, DialogOutletComponent,
StepperComponent, StepComponent,
AlertComponent, TooltipDirective,
DropdownComponent, DropdownTriggerDirective, DropdownItemComponent, DropdownLabelComponent, DropdownSeparatorComponent,
ToastService, TabsComponent, TabComponent,
AccordionComponent, AccordionItemComponent, BreadcrumbComponent, BreadcrumbItemComponent,
SpinnerComponent, SkeletonComponent, ProgressComponent,
TableComponent, TableCellDirective, TableColumn (tipo),
PaginationComponent,
provideHighstack, HighstackTheme (tipo), HighstackConfig (tipo)
```

## Problemas frecuentes

- **"X is not a known element"** → falta importar la clase en `imports: [...]` del componente que la usa (todos son standalone).
- **Los estilos no aplican** → falta `@import '@highstacklabs2026/ui/styles.css'` en el `styles.css` global.
- **El modo oscuro no cambia los componentes** → activa la clase `dark` en el `<body>` (o `provideHighstack({ dark: true })`).
- **El autofill del navegador se ve con fondo azul** → falta el import del `styles.css`; el fix vive en esa hoja.
- **Calendar/Datepicker sale vacío** → el valor debe ser un string `'YYYY-MM-DD'`, no un `Date` ni un ISO con hora.
- **Radio / Select / Tabs / Dropdown / Accordion / Breadcrumb** son composicionales: importa el contenedor **y** los items.

## Desarrollo

### Build de la librería

```bash
npm run build:lib
```

Esto compila la librería con ng-packagr **y** genera `styles.css` (vía Tailwind) dentro del paquete. Los artefactos quedan en `dist/highstack/ui`.

### Publicar

```bash
npm publish dist/highstack/ui --access public
```
