import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { form, required, FormField } from '@angular/forms/signals';

import { PhoneInputComponent } from '../../../../components/atoms/phone-input/phone-input.component';
import {
  ModalComponent,
  ModalHeaderComponent,
  ModalTitleComponent,
  ModalDescriptionComponent,
  ModalContentComponent,
  ModalFooterComponent,
} from '../../../../components/atoms/modal/modal.component';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-phone-input-page',
  imports: [
    PageHeaderComponent,
    PhoneInputComponent,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleComponent,
    ModalDescriptionComponent,
    ModalContentComponent,
    ModalFooterComponent,
    ButtonComponent,
    DemoBlockComponent,
    CodeBlockComponent,
    FormField,
    ReactiveFormsModule,
  ],
  templateUrl: './phone-input.page.html',
})
export class PhoneInputPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  readonly telefono = signal('');
  readonly precargado = signal('+593987654321');
  readonly conPreferidos = signal('');
  readonly soloAndinos = signal('');
  readonly pais = signal('');

  // Demo de layering: el panel dentro de un modal.
  readonly modalAbierto = signal(false);
  readonly modalTelefono = signal('');

  // Signal Forms
  readonly signalModel = signal({ telefono: '' });
  readonly signalForm = form(this.signalModel, (path) => {
    required(path.telefono, { message: 'El teléfono es obligatorio' });
  });

  // Reactive Forms
  readonly reactiveCtrl = new FormControl('', { nonNullable: true });

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'paises', label: 'Países' },
    { id: 'estados', label: 'Estados' },
    { id: 'dentro-de-paneles', label: 'Dentro de paneles' },
    { id: 'signal-forms', label: 'Signal Forms' },
    { id: 'reactive-forms', label: 'Reactive Forms' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import { PhoneInputComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-phone-input
  label="Teléfono"
  locale="es-EC"
  [(value)]="telefono"
  hint="Elige el país o pega el número completo."
/>

// El valor es SIEMPRE un string E.164: '+593987654321', o '' si está vacío.
// Nunca un objeto ni dos campos separados.
telefono = signal('');`;

  readonly paisesCode = `<!-- País inicial derivado del locale: es-EC -> Ecuador -->
<ui-phone-input label="Teléfono" locale="es-EC" [(value)]="telefono" />

<!-- Forzado con defaultCountry (gana sobre el locale) -->
<ui-phone-input label="Teléfono" defaultCountry="MX" [(value)]="telefono" />

<!-- Los más usados, fijados arriba del panel -->
<ui-phone-input
  label="Teléfono"
  [preferredCountries]="['EC', 'MX', 'US', 'ES']"
  [(value)]="conPreferidos"
/>

<!-- Solo los mercados donde operas (con pocos países el buscador se oculta) -->
<ui-phone-input
  label="Teléfono"
  [countries]="['EC', 'CO', 'PE', 'BO']"
  [(value)]="soloAndinos"
  (countryChange)="pais.set($event)"
/>`;

  readonly estadosCode = `<ui-phone-input label="Deshabilitado" [disabled]="true" value="+593987654321" />
<ui-phone-input label="Solo lectura" [readonly]="true" value="+593987654321" />
<ui-phone-input label="Con error" error="Ese número ya está registrado" />`;

  readonly dentroDePanelesCode = `<!-- No hace falta nada especial: el panel de países se monta en un contenedor
     a nivel de <body>, así que no lo recorta el overflow del modal ni lo
     descoloca su transform. -->
<ui-modal [(open)]="modalAbierto" size="md">
  <ui-modal-content>
    <ui-phone-input label="Teléfono de contacto" [(value)]="modalTelefono" />
  </ui-modal-content>
</ui-modal>`;

  readonly signalFormsCode = `model = signal({ telefono: '' });
form = form(this.model, (path) => {
  required(path.telefono, { message: 'El teléfono es obligatorio' });
});`;

  readonly signalFormsTemplate = `<ui-phone-input [formField]="form.telefono" label="Teléfono" />`;

  readonly reactiveFormsCode = `ctrl = new FormControl('', { nonNullable: true });`;

  readonly reactiveFormsTemplate = `<ui-phone-input [formControl]="ctrl" label="Teléfono" />`;
}
