import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import { PaginationComponent } from '../../../../components/atoms/pagination/pagination.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-pagination-page',
  imports: [PageHeaderComponent, PaginationComponent, DemoBlockComponent, CodeBlockComponent],
  templateUrl: './pagination.page.html',
})
export class PaginationPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  readonly page1 = signal(5);
  readonly page2 = signal(1);
  readonly page3 = signal(3);
  readonly page4 = signal(1);
  readonly pageSize = signal(10);

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'compact', label: 'Compacto' },
    { id: 'sizes', label: 'Tamaños' },
    { id: 'pagesize', label: 'Items por página' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  readonly importExample = `import { PaginationComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-pagination [(page)]="page" [totalPages]="20" />`;

  readonly compactCode = `<ui-pagination [(page)]="page" [totalPages]="20" variant="compact" />`;

  readonly sizesCode = `<ui-pagination [(page)]="page" [totalPages]="10" size="sm" />
<ui-pagination [(page)]="page" [totalPages]="10" size="md" />`;

  readonly pageSizeCode = `<ui-pagination
  [(page)]="page"
  [totalPages]="20"
  [(pageSize)]="pageSize"
  [pageSizeOptions]="[10, 25, 50]"
/>`;
}
