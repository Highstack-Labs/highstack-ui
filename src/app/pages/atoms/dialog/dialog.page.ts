import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import { DialogService } from '../../../../components/atoms/dialog/dialog.service';
import { DialogRef, DIALOG_DATA } from '../../../../components/atoms/dialog/dialog.types';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { InputComponent } from '../../../../components/atoms/input/input.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ToastService } from '../../../../components/atoms/toast/toast.service';

/**
 * Componente de ejemplo abierto con `dialog.open()`. Lee los datos vía
 * `DIALOG_DATA` y se cierra devolviendo un resultado vía `DialogRef`.
 */
@Component({
  selector: 'app-edit-name-dialog',
  imports: [ButtonComponent, InputComponent],
  template: `
    <ui-input [(value)]="name" placeholder="Tu nombre" />
    <div class="flex items-center justify-end gap-3">
      <ui-button variant="ghost" (click)="ref.close()">Cancelar</ui-button>
      <ui-button (click)="ref.close(name)">Guardar</ui-button>
    </div>
  `,
})
export class EditNameDialogComponent {
  protected readonly ref = inject(DialogRef<string>);
  private readonly data = inject(DIALOG_DATA) as { name?: string } | null;
  protected name = this.data?.name ?? '';
}

@Component({
  selector: 'app-dialog-page',
  imports: [PageHeaderComponent, ButtonComponent, DemoBlockComponent, CodeBlockComponent],
  templateUrl: './dialog.page.html',
})
export class DialogPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'confirm', label: 'Confirmar' },
    { id: 'alert', label: 'Alert' },
    { id: 'componente', label: 'Componente dinámico' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Acciones de la demo ---
  async confirmDelete() {
    const ok = await this.dialog.confirm({
      title: '¿Eliminar proyecto?',
      message: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      confirmVariant: 'destructive',
    });
    if (ok) this.toast.success('Proyecto eliminado.');
    else this.toast.info('Cancelado.');
  }

  async showAlert() {
    await this.dialog.alert({ title: 'Listo', message: 'Tus cambios se guardaron.' });
    this.toast.info('Alert cerrado.');
  }

  async openComponent() {
    const ref = this.dialog.open<string, { name?: string }>(EditNameDialogComponent, {
      data: { name: 'Ada' },
      title: 'Editar nombre',
      description: 'Componente dinámico abierto vía servicio.',
      size: 'md',
    });
    const result = await ref.closed;
    if (result) this.toast.success(`Guardado: ${result}`);
    else this.toast.info('Edición cancelada.');
  }

  // --- Snippets ---
  readonly importExample = `import { DialogService } from '@highstacklabs2026/ui';

// en cualquier componente
private dialog = inject(DialogService);`;

  readonly confirmCode = `const ok = await this.dialog.confirm({
  title: '¿Eliminar proyecto?',
  message: 'Esta acción no se puede deshacer.',
  confirmText: 'Eliminar',
  confirmVariant: 'destructive',
});
if (ok) this.borrar();`;

  readonly alertCode = `await this.dialog.alert({
  title: 'Listo',
  message: 'Tus cambios se guardaron.',
});`;

  readonly componentCode = `// 1. El componente solo escribe su cuerpo (el diálogo le da el padding).
//    El título/descripción se pasan por opción → header automático.
@Component({
  template: \`
    <ui-input [(value)]="name" />
    <div class="flex justify-end gap-3">
      <ui-button variant="ghost" (click)="ref.close()">Cancelar</ui-button>
      <ui-button (click)="ref.close(name)">Guardar</ui-button>
    </div>
  \`,
})
export class EditNameDialog {
  ref = inject(DialogRef<string>);
  data = inject(DIALOG_DATA);
  name = '';
}

// 2. Lo abres desde el servicio (title/description renderizan el header)
const ref = this.dialog.open(EditNameDialog, {
  data: { name: 'Ada' },
  title: 'Editar nombre',
  description: 'Componente dinámico abierto vía servicio.',
  size: 'md',
});
const result = await ref.closed;`;
}
