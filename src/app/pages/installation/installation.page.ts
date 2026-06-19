import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-installation-page',
  templateUrl: './installation.page.html',
})
export class InstallationPage {
  readonly npmInstallCmd = 'npm install @diegopolancodev/highstack-ui';
  
  readonly importExample = `import { Component } from '@angular/core';
import { ButtonComponent } from '@diegopolancodev/highstack-ui';

@Component({
  selector: 'app-mi-componente',
  imports: [ButtonComponent],
  template: \`<ui-button variant="gradient">Mi Botón</ui-button>\`
})
export class MiComponente {}`;

  readonly stylesExample = `@import "tailwindcss";

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
