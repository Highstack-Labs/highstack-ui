import { Component, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import {
  ModalComponent,
  ModalHeaderComponent,
  ModalTitleComponent,
  ModalDescriptionComponent,
  ModalFooterComponent,
} from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';
import { DialogService } from './dialog.service';

/**
 * Contenedor flotante de diálogos. Se auto-monta vía `DialogService` (interno).
 * Renderiza un `<ui-modal>` por cada diálogo abierto.
 */
@Component({
  selector: 'ui-dialog-outlet',
  imports: [
    NgComponentOutlet,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleComponent,
    ModalDescriptionComponent,
    ModalFooterComponent,
    ButtonComponent,
  ],
  template: `
    @for (d of svc.dialogs(); track d.id) {
      <ui-modal
        [open]="d.open()"
        [size]="d.options.size ?? 'md'"
        [closeOnBackdrop]="d.options.closeOnBackdrop ?? true"
        [closeOnEscape]="d.options.closeOnEscape ?? true"
        [showClose]="d.options.showClose ?? true"
        [ariaLabel]="d.options.ariaLabel"
        (closed)="svc.finalize(d.id)"
      >
        @switch (d.kind) {
          @case ('component') {
            <!--
              El host que crea ngComponentOutlet rompería el flex del panel, así
              que aquí aportamos el padding horizontal y convertimos al host en
              una columna con gap para que el contenido del componente quede
              espaciado igual que confirm/alert (sin necesidad de sub-componentes).
            -->
            <div class="px-6 [&>*]:flex [&>*]:flex-col [&>*]:gap-4">
              <ng-container *ngComponentOutlet="d.component!; injector: d.injector!" />
            </div>
          }
          @case ('confirm') {
            <ui-modal-header>
              @if (d.confirm!.title) {
                <ui-modal-title>{{ d.confirm!.title }}</ui-modal-title>
              }
              <ui-modal-description>{{ d.confirm!.message }}</ui-modal-description>
            </ui-modal-header>
            <ui-modal-footer>
              <ui-button variant="ghost" (click)="svc.dismiss(d.id, false)">
                {{ d.confirm!.cancelText ?? 'Cancelar' }}
              </ui-button>
              <ui-button
                [variant]="d.confirm!.confirmVariant ?? 'default'"
                (click)="svc.dismiss(d.id, true)"
              >
                {{ d.confirm!.confirmText ?? 'Confirmar' }}
              </ui-button>
            </ui-modal-footer>
          }
          @case ('alert') {
            <ui-modal-header>
              @if (d.alert!.title) {
                <ui-modal-title>{{ d.alert!.title }}</ui-modal-title>
              }
              <ui-modal-description>{{ d.alert!.message }}</ui-modal-description>
            </ui-modal-header>
            <ui-modal-footer>
              <ui-button (click)="svc.dismiss(d.id, undefined)">
                {{ d.alert!.confirmText ?? 'Aceptar' }}
              </ui-button>
            </ui-modal-footer>
          }
        }
      </ui-modal>
    }
  `,
})
export class DialogOutletComponent {
  protected readonly svc = inject(DialogService);
}
