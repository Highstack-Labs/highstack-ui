import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  ModalComponent,
  ModalHeaderComponent,
  ModalTitleComponent,
  ModalDescriptionComponent,
  ModalContentComponent,
  ModalFooterComponent,
  ModalSize,
} from '../../../../components/atoms/modal/modal.component';
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
  selector: 'app-modal-page',
  imports: [
    PageHeaderComponent,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleComponent,
    ModalDescriptionComponent,
    ModalContentComponent,
    ModalFooterComponent,
    ButtonComponent,
    InputComponent,
    DatepickerComponent,
    TimepickerComponent,
    SelectComponent,
    OptionComponent,
    DemoBlockComponent,
    CodeBlockComponent,
  ],
  templateUrl: './modal.page.html',
})
export class ModalPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  // --- Estado de los demos vivos ---
  protected readonly basicOpen = signal(false);
  protected readonly formOpen = signal(false);
  protected readonly sizeOpen = signal(false);
  protected readonly overlaysOpen = signal(false);

  // Demo de layering: paneles flotantes dentro del modal.
  protected readonly overlayHora = signal('');
  protected readonly overlayFecha = signal('');
  protected readonly overlaySala = signal('');
  protected readonly currentSize = signal<ModalSize>('md');

  protected openWithSize(size: ModalSize) {
    this.currentSize.set(size);
    this.sizeOpen.set(true);
  }

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'sizes', label: 'Tamaños' },
    { id: 'form', label: 'Con formulario' },
    { id: 'overlays', label: 'Con paneles flotantes' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import {
  ModalComponent,
  ModalHeaderComponent,
  ModalTitleComponent,
  ModalDescriptionComponent,
  ModalContentComponent,
  ModalFooterComponent,
} from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-button (click)="open.set(true)">Abrir modal</ui-button>

<ui-modal [(open)]="open">
  <ui-modal-header>
    <ui-modal-title>¿Eliminar proyecto?</ui-modal-title>
    <ui-modal-description>Esta acción no se puede deshacer.</ui-modal-description>
  </ui-modal-header>
  <ui-modal-content>
    Se borrarán todos los archivos asociados de forma permanente.
  </ui-modal-content>
  <ui-modal-footer>
    <ui-button variant="ghost" (click)="open.set(false)">Cancelar</ui-button>
    <ui-button variant="destructive" (click)="open.set(false)">Eliminar</ui-button>
  </ui-modal-footer>
</ui-modal>

// En el componente:
open = signal(false);`;

  readonly sizesCode = `<ui-modal [(open)]="open" size="sm">...</ui-modal>
<ui-modal [(open)]="open" size="md">...</ui-modal>
<ui-modal [(open)]="open" size="lg">...</ui-modal>
<ui-modal [(open)]="open" size="xl">...</ui-modal>
<ui-modal [(open)]="open" size="full">...</ui-modal>`;

  readonly formCode = `<ui-modal [(open)]="open" size="md">
  <ui-modal-header>
    <ui-modal-title>Crear cuenta</ui-modal-title>
    <ui-modal-description>Completa tus datos para empezar.</ui-modal-description>
  </ui-modal-header>
  <ui-modal-content>
    <div class="space-y-3">
      <ui-input label="Nombre" placeholder="Ada Lovelace" />
      <ui-input label="Email" type="email" placeholder="ada@correo.com" />
    </div>
  </ui-modal-content>
  <ui-modal-footer>
    <ui-button variant="ghost" (click)="open.set(false)">Cancelar</ui-button>
    <ui-button (click)="open.set(false)">Crear</ui-button>
  </ui-modal-footer>
</ui-modal>`;

  readonly overlaysCode = `<!-- No hace falta nada especial: los paneles del select, el datepicker y el
     timepicker se montan en un contenedor a nivel de <body>, así que se dibujan
     por encima del modal y no los recorta su overflow ni los descoloca el
     transform de su animación. -->
<ui-modal [(open)]="overlaysOpen" size="md">
  <ui-modal-header>
    <ui-modal-title>Agendar reunión</ui-modal-title>
  </ui-modal-header>
  <ui-modal-content>
    <ui-timepicker label="Hora" [(value)]="hora" [minuteStep]="15" />
    <ui-datepicker label="Fecha" [(value)]="fecha" />
    <ui-select label="Sala" [(value)]="sala">
      <ui-option value="a">Sala A</ui-option>
    </ui-select>
  </ui-modal-content>
</ui-modal>`;
}
