import { AfterViewInit, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { form, required, FormField } from '@angular/forms/signals';

import { TimezoneSelectComponent } from '../../../../components/atoms/timezone-select/timezone-select.component';
import { getLocalTimezone } from '../../../../components/atoms/timezone-select/timezone-utils';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-timezone-select-page',
  imports: [
    PageHeaderComponent,
    TimezoneSelectComponent,
    DemoBlockComponent,
    CodeBlockComponent,
    FormField,
    ReactiveFormsModule,
  ],
  templateUrl: './timezone-select.page.html',
})
export class TimezoneSelectPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  readonly zona = signal('');
  readonly zonaLocal = signal(getLocalTimezone());
  readonly zonaPlana = signal('Europe/Madrid');

  /** La hora que es ahora mismo en la zona elegida, para la demo del básico. */
  readonly horaEnZona = computed(() => {
    const id = this.zona();
    if (!id) return '';
    return new Intl.DateTimeFormat('es', {
      timeZone: id,
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
  });

  // Signal Forms
  readonly signalModel = signal({ zona: '' });
  readonly signalForm = form(this.signalModel, (path) => {
    required(path.zona, { message: 'Selecciona una zona horaria' });
  });

  // Reactive Forms
  readonly reactiveCtrl = new FormControl('', { nonNullable: true });

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'zona-local', label: 'Zona local' },
    { id: 'agrupacion', label: 'Agrupación' },
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
  readonly importExample = `import { TimezoneSelectComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-timezone-select
  label="Zona horaria"
  [(value)]="zona"
  hint="Busca por ciudad, región o desfase (por ejemplo «gmt-5»)."
/>

// El valor es SIEMPRE el identificador IANA: 'America/Bogota'.
zona = signal('');`;

  readonly zonaLocalCode = `import { getLocalTimezone } from '@highstacklabs2026/ui';

// Arranca en la zona del propio dispositivo.
zona = signal(getLocalTimezone());`;

  readonly agrupacionCode = `<!-- Por defecto la lista va agrupada por región -->
<ui-timezone-select label="Agrupada" [(value)]="zona" />

<!-- Lista plana, ordenada solo por desfase -->
<ui-timezone-select label="Plana" [grouped]="false" [(value)]="zonaPlana" />`;

  readonly estadosCode = `<ui-timezone-select label="Deshabilitado" [disabled]="true" value="America/Bogota" />
<ui-timezone-select label="Con error" error="Selecciona una zona horaria" />
<ui-timezone-select
  label="Textos propios"
  modalTitle="¿Dónde estás?"
  searchPlaceholder="Escribe tu ciudad…"
  placeholder="Sin definir"
/>`;

  readonly signalFormsCode = `model = signal({ zona: '' });
form = form(this.model, (path) => {
  required(path.zona, { message: 'Selecciona una zona horaria' });
});`;

  readonly signalFormsTemplate = `<ui-timezone-select [formField]="form.zona" label="Zona horaria" />`;

  readonly reactiveFormsCode = `ctrl = new FormControl('', { nonNullable: true });`;

  readonly reactiveFormsTemplate = `<ui-timezone-select [formControl]="ctrl" label="Zona horaria" />`;
}
