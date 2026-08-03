import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  DrawerComponent,
  DrawerHeaderComponent,
  DrawerTitleComponent,
  DrawerDescriptionComponent,
  DrawerContentComponent,
  DrawerFooterComponent,
  DrawerSide,
} from '../../../../components/atoms/drawer/drawer.component';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { InputComponent } from '../../../../components/atoms/input/input.component';
import { DatepickerComponent } from '../../../../components/atoms/datepicker/datepicker.component';
import { TimepickerComponent } from '../../../../components/atoms/timepicker/timepicker.component';
import {
  SelectComponent,
  OptionComponent,
} from '../../../../components/atoms/select/select.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-drawer-page',
  imports: [
    PageHeaderComponent,
    DrawerComponent,
    DrawerHeaderComponent,
    DrawerTitleComponent,
    DrawerDescriptionComponent,
    DrawerContentComponent,
    DrawerFooterComponent,
    ButtonComponent,
    InputComponent,
    DatepickerComponent,
    TimepickerComponent,
    SelectComponent,
    OptionComponent,
    DemoBlockComponent,
    CodeBlockComponent,
  ],
  templateUrl: './drawer.page.html',
})
export class DrawerPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  protected readonly basicOpen = signal(false);
  protected readonly sideOpen = signal(false);
  protected readonly currentSide = signal<DrawerSide>('right');
  protected readonly overlaysOpen = signal(false);

  // Demo de layering: paneles flotantes dentro del drawer.
  protected readonly overlayHora = signal('');
  protected readonly overlayFecha = signal('');
  protected readonly overlaySala = signal('');

  protected openWithSide(side: DrawerSide) {
    this.currentSide.set(side);
    this.sideOpen.set(true);
  }

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'sides', label: 'Bordes' },
    { id: 'overlays', label: 'Con paneles flotantes' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  readonly importExample = `import {
  DrawerComponent,
  DrawerHeaderComponent,
  DrawerTitleComponent,
  DrawerDescriptionComponent,
  DrawerContentComponent,
  DrawerFooterComponent,
} from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-button (click)="open.set(true)">Abrir panel</ui-button>

<ui-drawer [(open)]="open" side="right">
  <ui-drawer-header>
    <ui-drawer-title>Filtros</ui-drawer-title>
    <ui-drawer-description>Ajusta los resultados.</ui-drawer-description>
  </ui-drawer-header>
  <ui-drawer-content>
    <div class="space-y-3">
      <ui-input label="Buscar" placeholder="Término…" />
      <ui-input label="Categoría" placeholder="Todas" />
    </div>
  </ui-drawer-content>
  <ui-drawer-footer>
    <ui-button variant="ghost" (click)="open.set(false)">Cancelar</ui-button>
    <ui-button (click)="open.set(false)">Aplicar</ui-button>
  </ui-drawer-footer>
</ui-drawer>

// En el componente:
open = signal(false);`;

  readonly sidesCode = `<ui-drawer [(open)]="open" side="right">…</ui-drawer>
<ui-drawer [(open)]="open" side="left">…</ui-drawer>
<ui-drawer [(open)]="open" side="top">…</ui-drawer>
<ui-drawer [(open)]="open" side="bottom">…</ui-drawer>`;

  readonly overlaysCode = `<!-- El drawer es el caso peor: su panel lleva translate-* de forma permanente,
     lo que lo convierte en el bloque contenedor de cualquier descendiente fixed.
     No hace falta hacer nada: los paneles del select, el datepicker y el
     timepicker se montan en un contenedor a nivel de <body>. -->
<ui-drawer [(open)]="overlaysOpen" side="right">
  <ui-drawer-header>
    <ui-drawer-title>Nuevo evento</ui-drawer-title>
  </ui-drawer-header>
  <ui-drawer-content>
    <ui-timepicker label="Hora" [(value)]="hora" [minuteStep]="15" />
    <ui-datepicker label="Fecha" [(value)]="fecha" />
    <ui-select label="Sala" [(value)]="sala">
      <ui-option value="a">Sala A</ui-option>
    </ui-select>
  </ui-drawer-content>
</ui-drawer>`;
}
