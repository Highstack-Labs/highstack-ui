import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  DropdownComponent,
  DropdownTriggerDirective,
  DropdownItemComponent,
  DropdownLabelComponent,
  DropdownSeparatorComponent,
} from '../../../../components/atoms/dropdown/dropdown.component';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { AvatarComponent } from '../../../../components/atoms/avatar/avatar.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-dropdown-page',
  imports: [PageHeaderComponent, 
    DropdownComponent,
    DropdownTriggerDirective,
    DropdownItemComponent,
    DropdownLabelComponent,
    DropdownSeparatorComponent,
    ButtonComponent,
    AvatarComponent,
    DemoBlockComponent,
    CodeBlockComponent,
  ],
  templateUrl: './dropdown.page.html',
})
export class DropdownPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  readonly lastAction = signal('');

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'icons', label: 'Íconos y atajos' },
    { id: 'sections', label: 'Secciones' },
    { id: 'placement', label: 'Posición' },
    { id: 'example', label: 'Ejemplo real' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import {
  DropdownComponent,
  DropdownTriggerDirective,
  DropdownItemComponent,
  DropdownLabelComponent,
  DropdownSeparatorComponent,
} from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-dropdown>
  <ui-button uiDropdownTrigger variant="outline">Opciones</ui-button>
  <ui-dropdown-item (select)="editar()">Editar</ui-dropdown-item>
  <ui-dropdown-item (select)="duplicar()">Duplicar</ui-dropdown-item>
  <ui-dropdown-item destructive (select)="borrar()">Eliminar</ui-dropdown-item>
</ui-dropdown>`;

  readonly iconsCode = `<ui-dropdown-item (select)="...">
  <svg slot="icon"><!-- ícono --></svg>
  Editar
  <span slot="shortcut">⌘E</span>
</ui-dropdown-item>`;

  readonly sectionsCode = `<ui-dropdown>
  <ui-button uiDropdownTrigger variant="outline">Mi cuenta</ui-button>
  <ui-dropdown-label>Sesión</ui-dropdown-label>
  <ui-dropdown-item>Perfil</ui-dropdown-item>
  <ui-dropdown-item>Ajustes</ui-dropdown-item>
  <ui-dropdown-separator />
  <ui-dropdown-item destructive>Cerrar sesión</ui-dropdown-item>
</ui-dropdown>`;

  readonly placementCode = `<ui-dropdown side="bottom" align="end"> ... </ui-dropdown>
<ui-dropdown side="top" align="start"> ... </ui-dropdown>`;

  readonly exampleCode = `<ui-dropdown align="end">
  <button uiDropdownTrigger>
    <ui-avatar size="sm" name="Juan Díaz" />
  </button>
  <ui-dropdown-label>Juan Díaz</ui-dropdown-label>
  <ui-dropdown-item>Perfil</ui-dropdown-item>
  <ui-dropdown-item>Facturación</ui-dropdown-item>
  <ui-dropdown-separator />
  <ui-dropdown-item destructive>Cerrar sesión</ui-dropdown-item>
</ui-dropdown>`;

  act(label: string) {
    this.lastAction.set(label);
  }
}
