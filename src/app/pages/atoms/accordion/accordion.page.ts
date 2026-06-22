import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import {
  AccordionComponent,
  AccordionItemComponent,
} from '../../../../components/atoms/accordion/accordion.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-accordion-page',
  imports: [PageHeaderComponent, AccordionComponent, AccordionItemComponent, DemoBlockComponent, CodeBlockComponent],
  templateUrl: './accordion.page.html',
})
export class AccordionPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'single', label: 'Single' },
    { id: 'multiple', label: 'Multiple' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  readonly importExample = `import { AccordionComponent, AccordionItemComponent } from '@highstacklabs2026/ui';`;

  readonly singleCode = `<ui-accordion>
  <ui-accordion-item title="¿Qué es highstack-ui?">
    Una librería de componentes para Angular.
  </ui-accordion-item>
  <ui-accordion-item title="¿Es gratis?">
    Sí, totalmente open source.
  </ui-accordion-item>
</ui-accordion>`;

  readonly multipleCode = `<ui-accordion [multiple]="true">
  <ui-accordion-item title="Envíos">…</ui-accordion-item>
  <ui-accordion-item title="Devoluciones">…</ui-accordion-item>
</ui-accordion>`;
}
