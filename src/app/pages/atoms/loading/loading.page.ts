import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  SpinnerComponent,
  SkeletonComponent,
  ProgressComponent,
} from '../../../../components/atoms/loading/loading.component';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';

@Component({
  selector: 'app-loading-page',
  imports: [
    SpinnerComponent,
    SkeletonComponent,
    ProgressComponent,
    ButtonComponent,
    DemoBlockComponent,
    CodeBlockComponent,
  ],
  templateUrl: './loading.page.html',
})
export class LoadingPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  readonly progress = signal(60);

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'spinner', label: 'Spinner' },
    { id: 'skeleton', label: 'Skeleton' },
    { id: 'progress', label: 'Progress' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  step(d: number) {
    this.progress.update((v) => Math.max(0, Math.min(100, v + d)));
  }

  readonly importExample = `import { SpinnerComponent, SkeletonComponent, ProgressComponent } from '@highstacklabs2026/ui';`;

  readonly spinnerCode = `<ui-spinner size="sm" />
<ui-spinner size="md" />
<ui-spinner size="lg" />

<!-- Hereda el color del contexto -->
<ui-button>
  <ui-spinner size="sm" /> Cargando…
</ui-button>`;

  readonly skeletonCode = `<!-- Línea de texto -->
<ui-skeleton width="60%" />

<!-- Avatar circular -->
<ui-skeleton width="2.5rem" height="2.5rem" [circle]="true" />

<!-- Tarjeta -->
<ui-skeleton height="8rem" />`;

  readonly progressCode = `<ui-progress [value]="60" />
<ui-progress [value]="60" size="sm" />
<ui-progress [indeterminate]="true" />`;
}
