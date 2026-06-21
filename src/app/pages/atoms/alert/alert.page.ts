import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import { AlertComponent } from '../../../../components/atoms/alert/alert.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';

@Component({
  selector: 'app-alert-page',
  imports: [AlertComponent, DemoBlockComponent, CodeBlockComponent],
  templateUrl: './alert.page.html',
})
export class AlertPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  readonly visible = signal(true);

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'types', label: 'Tipos' },
    { id: 'solid', label: 'Solid' },
    { id: 'title', label: 'Con título' },
    { id: 'closable', label: 'Cerrable' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import { AlertComponent } from '@highstacklabs2026/ui';`;

  readonly typesCode = `<ui-alert type="info">Mensaje informativo.</ui-alert>
<ui-alert type="success">Operación completada.</ui-alert>
<ui-alert type="warning">Revisa esta acción.</ui-alert>
<ui-alert type="error">Algo salió mal.</ui-alert>`;

  readonly solidCode = `<ui-alert type="success" variant="solid">Guardado.</ui-alert>
<ui-alert type="error" variant="solid">No se pudo guardar.</ui-alert>`;

  readonly titleCode = `<ui-alert type="success" title="Cambios guardados">
  Tu perfil se actualizó correctamente.
</ui-alert>`;

  readonly closableCode = `<ui-alert type="info" title="Nueva versión" [closable]="true" (close)="dismiss()">
  Recarga para aplicar la actualización.
</ui-alert>`;
}
