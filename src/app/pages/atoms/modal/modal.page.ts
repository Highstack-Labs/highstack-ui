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
}
