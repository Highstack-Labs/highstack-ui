import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import { BadgeComponent } from '../../../../components/atoms/badge/badge.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';

@Component({
  selector: 'app-badge-page',
  imports: [BadgeComponent, DemoBlockComponent, CodeBlockComponent],
  templateUrl: './badge.page.html',
})
export class BadgePage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  // Tags removibles de la demo
  readonly tags = signal(['Angular', 'TypeScript', 'Tailwind', 'Signals']);

  removeTag(tag: string) {
    this.tags.update((list) => list.filter((t) => t !== tag));
  }

  resetTags() {
    this.tags.set(['Angular', 'TypeScript', 'Tailwind', 'Signals']);
  }

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'styles', label: 'Estilos' },
    { id: 'colors', label: 'Colores' },
    { id: 'dot', label: 'Con punto' },
    { id: 'icon', label: 'Con ícono' },
    { id: 'glass', label: 'Glass' },
    { id: 'removable', label: 'Removible' },
    { id: 'sizes', label: 'Tamaños' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import { BadgeComponent } from '@highstacklabs2026/ui';`;

  readonly stylesCode = `<ui-badge variant="solid">Solid</ui-badge>
<ui-badge variant="soft">Soft</ui-badge>
<ui-badge variant="outline">Outline</ui-badge>`;

  readonly colorsCode = `<ui-badge color="primary">Primary</ui-badge>
<ui-badge color="secondary">Secondary</ui-badge>
<ui-badge color="success">Success</ui-badge>
<ui-badge color="warning">Warning</ui-badge>
<ui-badge color="destructive">Destructive</ui-badge>`;

  readonly dotCode = `<ui-badge color="success" [dot]="true">Activo</ui-badge>
<ui-badge color="warning" [dot]="true">Pendiente</ui-badge>
<ui-badge color="destructive" [dot]="true">Offline</ui-badge>`;

  readonly iconCode = `<ui-badge color="success" variant="soft">
  <svg slot="icon"><!-- ícono check --></svg>
  Verificado
</ui-badge>`;

  readonly removableCode = `@for (tag of tags(); track tag) {
  <ui-badge [removable]="true" (remove)="removeTag(tag)">{{ tag }}</ui-badge>
}`;

  readonly glassCode = `<!-- Luce mejor sobre una imagen o fondo con color -->
<ui-badge variant="glass" color="primary">Primary</ui-badge>
<ui-badge variant="glass" color="success" [dot]="true">En vivo</ui-badge>
<ui-badge variant="glass" color="secondary">Neutral</ui-badge>`;

  readonly sizesCode = `<ui-badge size="sm">Small</ui-badge>
<ui-badge size="md">Medium</ui-badge>`;
}
