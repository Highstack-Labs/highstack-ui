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

Añade las variables (tokens) de color y bordes en tu archivo global de estilos (`styles.css`), después de importar Tailwind v4:

```css
@import "tailwindcss";

:root {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0.005 285.82);

  --color-primary: oklch(0.205 0.006 285.82);
  --color-primary-foreground: oklch(0.985 0 0);

  --color-destructive: oklch(0.577 0.245 27.33);
  --color-destructive-foreground: oklch(0.985 0 0);

  --color-secondary: oklch(0.965 0.003 285.82);
  --color-secondary-foreground: oklch(0.205 0.006 285.82);

  --color-accent: oklch(0.965 0.003 285.82);
  --color-accent-foreground: oklch(0.205 0.006 285.82);

  --color-muted: oklch(0.965 0.003 285.82);
  --color-muted-foreground: oklch(0.556 0.015 285.82);

  --color-border: oklch(0.922 0.005 285.82);
  --color-input: oklch(0.922 0.005 285.82);
  --color-ring: oklch(0.705 0.015 285.82);

  --radius: 0.625rem;
}
```

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
ng build @highstacklabs/ui
```

Los artefactos quedan en `dist/highstack/ui`.

### Publicar

```bash
npm publish dist/highstack/ui --access public
```
