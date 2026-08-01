import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { form, required, FormField } from '@angular/forms/signals';

import { DatepickerComponent } from '../../../../components/atoms/datepicker/datepicker.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-datepicker-page',
  imports: [PageHeaderComponent,
    DatepickerComponent,
    DemoBlockComponent,
    CodeBlockComponent,
    FormField,
    ReactiveFormsModule,
  ],
  templateUrl: './datepicker.page.html',
})
export class DatepickerPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  readonly fecha = signal('');
  readonly cita = signal('');
  readonly entrega = signal('');

  /** Días bloqueados en la demo de restricciones. */
  readonly feriados = ['2026-08-17', '2026-08-18', '2026-08-19'];

  // Signal Forms
  readonly signalModel = signal({ nacimiento: '' });
  readonly signalForm = form(this.signalModel, (path) => {
    required(path.nacimiento, { message: 'Selecciona una fecha' });
  });

  // Reactive Forms
  readonly reactiveCtrl = new FormControl('', { nonNullable: true });

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'restricciones', label: 'Restricciones' },
    { id: 'estados', label: 'Estados' },
    { id: 'signal-forms', label: 'Signal Forms' },
    { id: 'reactive-forms', label: 'Reactive Forms' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import { DatepickerComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-datepicker
  label="Fecha de nacimiento"
  [(value)]="fecha"
  hint="Puedes escribirla o elegirla."
/>

// El valor es SIEMPRE un string ISO 'YYYY-MM-DD', nunca un Date.
fecha = signal('');`;

  readonly restriccionesCode = `<!-- Rango permitido -->
<ui-datepicker label="Cita" min="2026-08-01" max="2026-12-31" [(value)]="cita" />

<!-- Lista de días bloqueados -->
<ui-datepicker label="Entrega" [disabledDates]="feriados" [(value)]="entrega" />

feriados = ['2026-08-17', '2026-08-18', '2026-08-19'];`;

  readonly estadosCode = `<ui-datepicker label="En inglés" locale="en-US" [(value)]="fecha" />
<ui-datepicker label="Deshabilitado" [disabled]="true" value="2026-07-31" />
<ui-datepicker label="Con error" error="Selecciona una fecha válida" />`;

  readonly signalFormsCode = `model = signal({ nacimiento: '' });
form = form(this.model, (path) => {
  required(path.nacimiento, { message: 'Selecciona una fecha' });
});`;

  readonly signalFormsTemplate = `<ui-datepicker [formField]="form.nacimiento" label="Fecha de nacimiento" />`;

  readonly reactiveFormsCode = `ctrl = new FormControl('', { nonNullable: true });`;

  readonly reactiveFormsTemplate = `<ui-datepicker [formControl]="ctrl" label="Vencimiento" />`;
}
