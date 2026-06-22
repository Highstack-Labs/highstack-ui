import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import { ToastService } from '../../../../components/atoms/toast/toast.service';
import { ToastPosition } from '../../../../components/atoms/toast/toast.types';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-toast-page',
  imports: [PageHeaderComponent, ButtonComponent, DemoBlockComponent, CodeBlockComponent],
  templateUrl: './toast.page.html',
})
export class ToastPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);
  protected readonly toast = inject(ToastService);

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'tipos', label: 'Tipos' },
    { id: 'title', label: 'Con título' },
    { id: 'action', label: 'Con acción' },
    { id: 'position', label: 'Posición' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Acciones de la demo ---
  showInfo() {
    this.toast.info('Hay una nueva actualización disponible.');
  }
  showSuccess() {
    this.toast.success('Tus cambios se guardaron correctamente.');
  }
  showWarning() {
    this.toast.warning('Tu sesión expirará pronto.');
  }
  showError() {
    this.toast.error('No se pudo conectar con el servidor.');
  }
  showWithTitle() {
    this.toast.success('Tu perfil se actualizó correctamente.', { title: 'Guardado' });
  }
  showWithAction() {
    this.toast.info('Archivo movido a la papelera.', {
      title: 'Eliminado',
      action: { label: 'Deshacer', handler: () => this.toast.success('Restaurado.') },
    });
  }
  setPosition(p: ToastPosition) {
    this.toast.setPosition(p);
    this.toast.info(`Posición: ${p}`);
  }

  // --- Snippets ---
  readonly importExample = `import { ToastService } from '@highstacklabs2026/ui';

// en cualquier componente
private toast = inject(ToastService);`;

  readonly typesCode = `this.toast.info('Mensaje informativo');
this.toast.success('Guardado correctamente');
this.toast.warning('Atención requerida');
this.toast.error('Algo salió mal');`;

  readonly titleCode = `this.toast.success('Tu perfil se actualizó.', { title: 'Guardado' });`;

  readonly actionCode = `this.toast.show({
  type: 'info',
  title: 'Eliminado',
  message: 'Archivo movido a la papelera.',
  action: { label: 'Deshacer', handler: () => restaurar() },
});`;

  readonly positionCode = `// Posición global (por defecto 'bottom-right')
this.toast.setPosition('top-right');`;
}
