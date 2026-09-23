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
              Header automático: si pasas title/description en open(), se renderiza
              con las mismas piezas que confirm/alert (incluye el hueco pr-12 para
              la X), así no tienes que escribirlo dentro del componente.
            -->
            @if (d.options.title || d.options.description) {
              <ui-modal-header>
                @if (d.options.title) {
                  <ui-modal-title>{{ d.options.title }}</ui-modal-title>
                }
                @if (d.options.description) {
                  <ui-modal-description>{{ d.options.description }}</ui-modal-description>
                }
              </ui-modal-header>
            }
            <!--
              El host que crea ngComponentOutlet rompería el flex del panel, así
              que aquí aportamos el padding horizontal por defecto y convertimos al
              host en una columna con gap para espaciar el contenido del componente
              (sin necesidad de sub-componentes).
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
