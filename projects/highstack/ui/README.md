# @highstacklabs/ui

Colección de componentes de UI premium para **Angular 21/22**, diseñados para funcionar de forma nativa con **Tailwind CSS v4**. Todos los componentes son standalone y usan **Angular Signals** para el estado reactivo.

## Instalación

```bash
npm install @highstacklabs/ui
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
@import '@highstacklabs/ui/styles.css';
```

No necesitas Tailwind en tu app, ni añadir `@source` apuntando a `node_modules`. El CSS **no incluye preflight** (el reset global de Tailwind), así que no pisa los estilos base de tu aplicación.

### Re-tematizar

Los tokens vienen con valores por defecto. Para cambiar la apariencia, redefine las variables CSS **después** del import:

```css
@import '@highstacklabs/ui/styles.css';

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
import { ButtonComponent } from '@highstacklabs/ui';

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
