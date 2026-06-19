import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-installation-page',
  templateUrl: './installation.page.html',
})
export class InstallationPage {
  readonly npmInstallCmd = 'npm install @highstacklabs2026/ui';

  readonly importExample = `import { Component } from '@angular/core';
import { ComponenteComponent } from '@highstacklabs2026/ui';

@Component({
  selector: 'app-mi-componente',
  imports: [ComponenteComponent],
  template: \`<ui-componente>Contenido</ui-componente>\`
})
export class MiComponente {}`;

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
