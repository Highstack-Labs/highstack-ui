import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import {
  BreadcrumbComponent,
  BreadcrumbItemComponent,
} from '../../../../components/atoms/breadcrumb/breadcrumb.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';

@Component({
  selector: 'app-breadcrumb-page',
  imports: [BreadcrumbComponent, BreadcrumbItemComponent, DemoBlockComponent, CodeBlockComponent],
  templateUrl: './breadcrumb.page.html',
})
export class BreadcrumbPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  readonly importExample = `import { BreadcrumbComponent, BreadcrumbItemComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-breadcrumb>
  <ui-breadcrumb-item link="/">Inicio</ui-breadcrumb-item>
  <ui-breadcrumb-item link="/productos">Productos</ui-breadcrumb-item>
  <ui-breadcrumb-item>Camiseta</ui-breadcrumb-item>
</ui-breadcrumb>`;
}
