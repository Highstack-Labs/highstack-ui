import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-button-page',
  imports: [PageHeaderComponent, ButtonComponent, DemoBlockComponent, CodeBlockComponent],
  templateUrl: './button.page.html',
})
export class ButtonPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  // --- Secciones para el scroll-spy (mismo orden que en la plantilla) ---
  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'variants', label: 'Variants' },
    { id: 'sizes', label: 'Sizes' },
    { id: 'pill', label: 'Pill Shape' },
    { id: 'full-width', label: 'Full Width' },
    { id: 'with-icon', label: 'With Icon' },
    { id: 'icon-only', label: 'Icon Only' },
    { id: 'trailing-icon', label: 'Trailing Icon' },
    { id: 'loading', label: 'Loading' },
    { id: 'disabled', label: 'Disabled' },
    { id: 'gradient', label: 'Gradient' },
    { id: 'glass', label: 'Glass' },
    { id: 'social', label: 'Social & OAuth' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Cómo importar ---
  readonly importExample = `import { ButtonComponent } from '@highstacklabs2026/ui';`;

  // --- Código de cada grupo de ejemplos ---
  readonly variantsCode = `<ui-button variant="default">Default</ui-button>
<ui-button variant="secondary">Secondary</ui-button>
<ui-button variant="destructive">Destructive</ui-button>
<ui-button variant="outline">Outline</ui-button>
<ui-button variant="ghost">Ghost</ui-button>
<ui-button variant="link">Link</ui-button>
<ui-button variant="gradient">Gradient</ui-button>
<ui-button variant="success">Success</ui-button>
<ui-button variant="warning">Warning</ui-button>`;

  readonly sizesCode = `<ui-button size="xs">Extra Small</ui-button>
<ui-button size="sm">Small</ui-button>
<ui-button size="md">Default</ui-button>
<ui-button size="lg">Large</ui-button>
<ui-button size="icon" variant="outline">
  <svg><!-- icono --></svg>
</ui-button>`;

  readonly pillCode = `<ui-button [pill]="true">Pill Button</ui-button>
<ui-button variant="secondary" [pill]="true">Secondary Pill</ui-button>
<ui-button variant="outline" [pill]="true">Outline Pill</ui-button>
<ui-button variant="gradient" [pill]="true">Gradient Pill</ui-button>
<ui-button size="icon" [pill]="true">
  <svg><!-- icono --></svg>
</ui-button>`;

  readonly fullWidthCode = `<ui-button [full]="true">Full Width Button</ui-button>
<ui-button variant="secondary" [full]="true">Secondary Full Width</ui-button>`;

  readonly withIconCode = `<ui-button>
  <svg><!-- icono --></svg>
  Login with GitHub
</ui-button>
<ui-button variant="secondary">
  <svg><!-- icono --></svg>
  Download
</ui-button>`;

  readonly iconOnlyCode = `<ui-button size="icon" variant="default">
  <svg><!-- icono --></svg>
</ui-button>
<ui-button size="icon" variant="outline">
  <svg><!-- icono --></svg>
</ui-button>
<ui-button size="icon" variant="destructive">
  <svg><!-- icono --></svg>
</ui-button>`;

  readonly trailingIconCode = `<ui-button>
  Next
  <svg><!-- icono --></svg>
</ui-button>
<ui-button variant="outline">
  Open
  <svg><!-- icono --></svg>
</ui-button>`;

  readonly loadingCode = `<ui-button [loading]="true">Please wait</ui-button>
<ui-button variant="secondary" [loading]="true">Processing</ui-button>
<ui-button variant="destructive" [loading]="true">Deleting...</ui-button>
<ui-button variant="outline" [loading]="true">Saving</ui-button>
<ui-button variant="ghost" [loading]="true">Loading</ui-button>`;

  readonly disabledCode = `<ui-button [disabled]="true">Default</ui-button>
<ui-button variant="secondary" [disabled]="true">Secondary</ui-button>
<ui-button variant="destructive" [disabled]="true">Destructive</ui-button>
<ui-button variant="outline" [disabled]="true">Outline</ui-button>
<ui-button variant="ghost" [disabled]="true">Ghost</ui-button>
<ui-button variant="link" [disabled]="true">Link</ui-button>`;

  readonly gradientCode = `<ui-button variant="gradient">Gradient</ui-button>
<ui-button variant="gradient" size="sm">Small</ui-button>
<ui-button variant="gradient" size="lg">Large</ui-button>
<ui-button variant="gradient" size="icon">
  <svg><!-- icono --></svg>
</ui-button>`;

  readonly glassCode = `<!-- Colocar sobre una imagen o fondo oscuro -->
<ui-button variant="glass">Glass</ui-button>
<ui-button variant="glass" size="sm">Small</ui-button>
<ui-button variant="glass" size="lg">Large</ui-button>
<ui-button variant="glass" size="icon">
  <svg><!-- icono --></svg>
</ui-button>`;

  readonly socialCode = `<ui-button variant="outline">
  <svg><!-- logo --></svg>
  Continue with Google
</ui-button>
<ui-button variant="outline">
  <svg><!-- logo --></svg>
  Continue with GitHub
</ui-button>
<ui-button variant="outline">
  <svg><!-- logo --></svg>
  Continue with Apple
</ui-button>`;

}
