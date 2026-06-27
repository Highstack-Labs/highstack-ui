import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

import { LabelComponent } from '../../../../components/atoms/label/label.component';
import { InputComponent } from '../../../../components/atoms/input/input.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';

@Component({
  selector: 'app-label-page',
  imports: [
    PageHeaderComponent,
    LabelComponent,
    InputComponent,
    DemoBlockComponent,
    CodeBlockComponent,
  ],
  templateUrl: './label.page.html',
})
export class LabelPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  // --- Scroll-spy ---
  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'required', label: 'Requerido' },
    { id: 'custom', label: 'Control propio' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import { LabelComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-label for="nombre">Nombre</ui-label>`;

  readonly requiredCode = `<ui-label for="email" required>Email</ui-label>`;

  readonly customCode = `<!-- Etiqueta un control que no es de la librería.
     El clic en el label enfoca el control por su id. -->
<ui-label for="rango" required>Volumen</ui-label>
<input id="rango" type="range" />`;
}
