# @highstacklabs2026/ui

Colección de componentes de UI premium para **Angular 21/22**, diseñados para funcionar de forma nativa con **Tailwind CSS v4**. Todos los componentes son standalone y usan **Angular Signals** para el estado reactivo.

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

## Configuración de estilos

La librería ya incluye su propio CSS precompilado con todas las utilidades que usan los componentes **y** los tokens de tema por defecto. Solo tienes que importarlo una vez en tu archivo global de estilos:

```css
@import '@highstacklabs2026/ui/styles.css';
```

No necesitas Tailwind en tu app, ni añadir `@source` apuntando a `node_modules`. El CSS **no incluye preflight** (el reset global de Tailwind), así que no pisa los estilos base de tu aplicación.

### Re-tematizar

Los tokens vienen con valores por defecto. Para cambiar la apariencia, redefine las variables CSS **después** del import:

```css
@import '@highstacklabs2026/ui/styles.css';

:root {
  --color-primary: oklch(0.55 0.2 264);        /* tu color de marca */
  --color-primary-foreground: oklch(0.985 0 0);
  --radius: 0.5rem;
}
```

Tokens disponibles: `--color-background`, `--color-foreground`, `--color-primary(-foreground)`, `--color-destructive(-foreground)`, `--color-secondary(-foreground)`, `--color-accent(-foreground)`, `--color-muted(-foreground)`, `--color-border`, `--color-input`, `--color-ring`, `--radius`.

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

## Componentes

### `<ui-button>`

```html
<!-- Variantes -->
<ui-button variant="default">Default</ui-button>
<ui-button variant="secondary">Secondary</ui-button>
<ui-button variant="destructive">Destructive</ui-button>
<ui-button variant="outline">Outline</ui-button>
<ui-button variant="ghost">Ghost</ui-button>
<ui-button variant="link">Link</ui-button>
<ui-button variant="gradient">Gradient</ui-button>
<ui-button variant="glass">Glass</ui-button>

<!-- Tamaños -->
<ui-button size="sm">Small</ui-button>
<ui-button size="lg">Large</ui-button>
<ui-button size="icon">★</ui-button>

<!-- Estados -->
<ui-button [disabled]="true">Disabled</ui-button>
<ui-button [loading]="true">Loading</ui-button>
```

| Prop       | Tipo                                                                                          | Default     |
| ---------- | --------------------------------------------------------------------------------------------- | ----------- |
| `variant`  | `'default' \| 'secondary' \| 'destructive' \| 'outline' \| 'ghost' \| 'link' \| 'gradient' \| 'glass'` | `'default'` |
| `size`     | `'sm' \| 'md' \| 'lg' \| 'icon'`                                                              | `'md'`      |
| `disabled` | `boolean`                                                                                      | `false`     |
| `loading`  | `boolean`                                                                                      | `false`     |
| `type`     | `'button' \| 'submit' \| 'reset'`                                                             | `'button'`  |

### `<ui-modal>`

Ventana modal (diálogo) con overlay, animación de entrada/salida, bloqueo del scroll del body, cierre con `Escape` / clic en el fondo y accesibilidad básica. Se controla con un signal vía `[(open)]`.

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

      <ui-modal-content>
        Se borrarán todos los archivos asociados de forma permanente.
      </ui-modal-content>

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

| Prop              | Tipo                                          | Default | Descripción                                          |
| ----------------- | --------------------------------------------- | ------- | ---------------------------------------------------- |
| `open`            | `boolean` (model, two-way `[(open)]`)         | `false` | Abre / cierra el modal.                              |
| `size`            | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'`      | `'md'`  | Ancho máximo del panel.                              |
| `closeOnBackdrop` | `boolean`                                     | `true`  | Cerrar al hacer clic en el fondo.                    |
| `closeOnEscape`   | `boolean`                                     | `true`  | Cerrar al pulsar `Escape`.                           |
| `showClose`       | `boolean`                                     | `true`  | Muestra el botón (X) de cerrar.                      |
| `ariaLabel`       | `string`                                      | —       | Etiqueta accesible (usa el título si lo omites).     |

| Evento   | Cuándo se emite                          |
| -------- | ---------------------------------------- |
| `opened` | El modal terminó de abrirse.             |
| `closed` | El modal se cerró (por cualquier vía).   |

Componentes exportados: `ModalComponent`, `ModalHeaderComponent`, `ModalTitleComponent`, `ModalDescriptionComponent`, `ModalContentComponent`, `ModalFooterComponent`.

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
