import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { form, required, FormField } from '@angular/forms/signals';

import { TimepickerComponent } from '../../../../components/atoms/timepicker/timepicker.component';
import { SelectComponent, OptionComponent } from '../../../../components/atoms/select/select.component';
import { DatepickerComponent } from '../../../../components/atoms/datepicker/datepicker.component';
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
  selector: 'app-timepicker-page',
  imports: [
    PageHeaderComponent,
    TimepickerComponent,
    SelectComponent,
    OptionComponent,
    DatepickerComponent,
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
  templateUrl: './timepicker.page.html',
})
export class TimepickerPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  readonly hora = signal('');
  readonly hora24 = signal('14:30');
  readonly conSegundos = signal('09:15:30');
  readonly cita = signal('');
  readonly turno = signal('');

  // Demo de layering: los paneles dentro de un modal.
  readonly modalAbierto = signal(false);
  readonly modalHora = signal('');
  readonly modalFecha = signal('');
  readonly modalSala = signal('');

  /** Horas bloqueadas en la demo de restricciones (la comida). */
  readonly comida = ['13:00', '13:30', '14:00'];

  // Signal Forms
  readonly signalModel = signal({ entrada: '' });
  readonly signalForm = form(this.signalModel, (path) => {
    required(path.entrada, { message: 'Selecciona una hora' });
  });

  // Reactive Forms
  readonly reactiveCtrl = new FormControl('', { nonNullable: true });

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'formatos', label: 'Formatos' },
    { id: 'restricciones', label: 'Restricciones' },
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
  readonly importExample = `import { TimepickerComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-timepicker
  label="Hora de la cita"
  [(value)]="hora"
  hint="Puedes escribirla o elegirla."
/>

// El valor es SIEMPRE un string en 24h: 'HH:mm' (o 'HH:mm:ss' con showSeconds).
// El formato de 12 horas con AM/PM es solo presentación.
hora = signal('');`;

  readonly formatosCode = `<!-- 12 horas con AM/PM -->
<ui-timepicker label="Cita" [hourFormat]="12" [(value)]="hora" />

<!-- 24 horas -->
<ui-timepicker label="Turno" [hourFormat]="24" [(value)]="hora24" />

<!-- Con segundos -->
<ui-timepicker label="Marca" [showSeconds]="true" [(value)]="conSegundos" />

<!-- Paso de minutos -->
<ui-timepicker label="Reunión" [minuteStep]="15" [(value)]="hora" />

<!-- Sin hourFormat, sale del locale: es-MX usa 12h, es-ES usa 24h -->
<ui-timepicker label="Automático" locale="es-ES" [(value)]="hora24" />`;

  readonly restriccionesCode = `<!-- Rango permitido -->
<ui-timepicker label="Cita" min="09:00" max="18:00" [(value)]="cita" />

<!-- Horas bloqueadas -->
<ui-timepicker label="Turno" [disabledTimes]="comida" [(value)]="turno" />

comida = ['13:00', '13:30', '14:00'];`;

  readonly estadosCode = `<ui-timepicker label="Deshabilitado" [disabled]="true" value="09:30" />
<ui-timepicker label="Solo lectura" [readonly]="true" value="09:30" />
<ui-timepicker label="Con error" error="Selecciona una hora válida" />`;

  readonly dentroDePanelesCode = `<!-- No hace falta nada especial: el panel del timepicker (igual que el del
     datepicker y el del select) se monta en un contenedor a nivel de <body>,
     así que no lo recorta ni lo tapa el transform/overflow del modal. -->
<ui-modal [(open)]="modalAbierto" size="md">
  <ui-modal-header>
    <ui-modal-title>Agendar reunión</ui-modal-title>
  </ui-modal-header>
  <ui-modal-content>
    <ui-timepicker label="Hora" [(value)]="modalHora" />
    <ui-datepicker label="Fecha" [(value)]="modalFecha" />
    <ui-select label="Sala" [(value)]="modalSala">…</ui-select>
  </ui-modal-content>
</ui-modal>`;

  readonly signalFormsCode = `model = signal({ entrada: '' });
form = form(this.model, (path) => {
  required(path.entrada, { message: 'Selecciona una hora' });
});`;

  readonly signalFormsTemplate = `<ui-timepicker [formField]="form.entrada" label="Hora de entrada" />`;

  readonly reactiveFormsCode = `ctrl = new FormControl('', { nonNullable: true });`;

  readonly reactiveFormsTemplate = `<ui-timepicker [formControl]="ctrl" label="Hora de salida" />`;
}
