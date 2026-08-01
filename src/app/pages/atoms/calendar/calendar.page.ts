import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';

import { CalendarComponent } from '../../../../components/atoms/calendar/calendar.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-calendar-page',
  imports: [PageHeaderComponent,
    CalendarComponent,
    DemoBlockComponent,
    CodeBlockComponent,
  ],
  templateUrl: './calendar.page.html',
})
export class CalendarPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  readonly fecha = signal('2026-08-15');
  readonly cita = signal('');
  readonly entrega = signal('');
  readonly enIngles = signal('2026-08-15');

  /** Días bloqueados en la demo de restricciones. */
  readonly feriados = ['2026-08-17', '2026-08-18', '2026-08-19'];

  /** Bloquea sábados y domingos. */
  readonly soloEntreSemana = (iso: string) => {
    const dia = new Date(iso + 'T12:00:00Z').getUTCDay();
    return dia === 0 || dia === 6;
  };

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'restricciones', label: 'Restricciones' },
    { id: 'locale', label: 'Idioma' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import { CalendarComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-calendar [(value)]="fecha" />

// El valor es SIEMPRE un string ISO 'YYYY-MM-DD', nunca un Date.
fecha = signal('2026-08-15');`;

  readonly restriccionesCode = `<!-- Rango permitido -->
<ui-calendar [(value)]="cita" min="2026-08-01" max="2026-12-31" />

<!-- Lista de días bloqueados -->
<ui-calendar [(value)]="entrega" [disabledDates]="feriados" />

<!-- Predicado: solo entre semana -->
<ui-calendar [(value)]="entrega" [dateDisabled]="soloEntreSemana" />

feriados = ['2026-08-17', '2026-08-18', '2026-08-19'];
soloEntreSemana = (iso: string) => {
  const dia = new Date(iso + 'T12:00:00Z').getUTCDay();
  return dia === 0 || dia === 6;
};`;

  readonly localeCode = `<!-- El idioma, el orden y el inicio de semana salen de Intl -->
<ui-calendar [(value)]="fecha" locale="en-US" />
<ui-calendar [(value)]="fecha" locale="es-ES" />

<!-- O se fuerza el inicio de semana (0 = domingo) -->
<ui-calendar [(value)]="fecha" [weekStartsOn]="1" />`;
}
