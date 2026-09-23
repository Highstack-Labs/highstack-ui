import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import { SeparatorComponent } from '../../../../components/atoms/separator/separator.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-separator-page',
  imports: [
    PageHeaderComponent,
    SeparatorComponent,
    DemoBlockComponent,
    CodeBlockComponent,
  ],
  templateUrl: './separator.page.html',
})
export class SeparatorPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Horizontal' },
    { id: 'vertical', label: 'Vertical' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  readonly importExample = `import { SeparatorComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<p>Sección superior</p>
<ui-separator />
<p>Sección inferior</p>`;

  readonly verticalCode = `<div class="flex items-center gap-3 h-5">
  <span>Inicio</span>
  <ui-separator orientation="vertical" />
  <span>Perfil</span>
  <ui-separator orientation="vertical" />
  <span>Ajustes</span>
</div>`;
}
