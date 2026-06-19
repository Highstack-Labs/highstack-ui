import { Component, signal } from '@angular/core';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';

@Component({
  selector: 'app-button-page',
  imports: [ButtonComponent],
  templateUrl: './button.page.html',
})
export class ButtonPage {
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
<ui-button variant="success">Success</ui-button>
<ui-button variant="warning">Warning</ui-button>

<!-- Tamaños -->
<ui-button size="sm">Small</ui-button>
<ui-button size="md">Medium</ui-button>
<ui-button size="lg">Large</ui-button>
<ui-button size="icon">★</ui-button>

<!-- Estados -->
<ui-button [disabled]="true">Disabled</ui-button>
<ui-button [loading]="true">Loading</ui-button>
<ui-button type="submit">Submit</ui-button>

<!-- Formas -->
<ui-button [pill]="true">Pill Button</ui-button>
<ui-button [full]="true">Full Width</ui-button>`;

  activeTab = signal<'examples' | 'installation'>('examples');
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

