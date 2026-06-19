import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-installation-page',
  templateUrl: './installation.page.html',
})
export class InstallationPage {
  readonly npmInstallCmd = 'npm install @highstacklabs2026/ui';

  readonly importExample = `import { Component } from '@angular/core';
import { ButtonComponent } from '@highstacklabs2026/ui';

@Component({
  selector: 'app-mi-componente',
  imports: [ButtonComponent],
  template: \`<ui-button variant="gradient">Mi Botón</ui-button>\`
})
export class MiComponente {}`;

  readonly usageExample = `<!-- Variantes -->
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
<ui-button size="md">Medium</ui-button>
<ui-button size="lg">Large</ui-button>
<ui-button size="icon">★</ui-button>

<!-- Estados -->
<ui-button [disabled]="true">Disabled</ui-button>
<ui-button [loading]="true">Loading</ui-button>
<ui-button type="submit">Submit</ui-button>`;

  readonly stylesExample = `/* En tu archivo global de estilos (p. ej. styles.css) */
@import '@highstacklabs2026/ui/styles.css';

/* (Opcional) Re-tematiza redefiniendo los tokens DESPUÉS del import */
:root {
  --color-primary: oklch(0.55 0.2 264);        /* tu color de marca */
  --color-primary-foreground: oklch(0.985 0 0);
  --radius: 0.5rem;
}`;

  copiedState = signal<Record<string, boolean>>({});

  copyToClipboard(id: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedState.update(state => ({ ...state, [id]: true }));
      setTimeout(() => {
        this.copiedState.update(state => ({ ...state, [id]: false }));
      }, 2000);
    });
  }
}
