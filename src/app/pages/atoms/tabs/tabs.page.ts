import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import { TabsComponent, TabComponent } from '../../../../components/atoms/tabs/tabs.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';

@Component({
  selector: 'app-tabs-page',
  imports: [TabsComponent, TabComponent, DemoBlockComponent, CodeBlockComponent],
  templateUrl: './tabs.page.html',
})
export class TabsPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'underline', label: 'Underline' },
    { id: 'pills', label: 'Pills' },
    { id: 'icons', label: 'Con íconos' },
    { id: 'sizes', label: 'Tamaños' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import { TabsComponent, TabComponent } from '@highstacklabs2026/ui';`;

  readonly underlineCode = `<ui-tabs [(value)]="activa">
  <ui-tab value="cuenta" label="Cuenta">Contenido de cuenta…</ui-tab>
  <ui-tab value="seguridad" label="Seguridad">Contenido de seguridad…</ui-tab>
  <ui-tab value="notif" label="Notificaciones">Preferencias…</ui-tab>
</ui-tabs>`;

  readonly pillsCode = `<ui-tabs variant="pills" [(value)]="activa">
  <ui-tab value="general" label="General">…</ui-tab>
  <ui-tab value="equipo" label="Equipo">…</ui-tab>
</ui-tabs>`;

  readonly iconsCode = `<ui-tab value="cuenta" label="Cuenta">
  <svg slot="icon"><!-- ícono --></svg>
  Contenido…
</ui-tab>`;

  readonly sizesCode = `<ui-tabs size="sm"> … </ui-tabs>
<ui-tabs size="md"> … </ui-tabs>`;
}
