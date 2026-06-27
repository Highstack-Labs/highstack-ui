import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import {
  PopoverComponent,
  PopoverTriggerDirective,
} from '../../../../components/atoms/popover/popover.component';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { InputComponent } from '../../../../components/atoms/input/input.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-popover-page',
  imports: [
    PageHeaderComponent,
    PopoverComponent,
    PopoverTriggerDirective,
    ButtonComponent,
    InputComponent,
    DemoBlockComponent,
    CodeBlockComponent,
  ],
  templateUrl: './popover.page.html',
})
export class PopoverPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'sides', label: 'Posición' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  readonly importExample = `import {
  PopoverComponent,
  PopoverTriggerDirective,
} from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-popover side="bottom" align="start">
  <ui-button uiPopoverTrigger variant="outline">Dimensiones</ui-button>

  <div class="space-y-3">
    <p class="text-sm font-medium">Dimensiones</p>
    <ui-input label="Ancho" placeholder="100%" />
    <ui-input label="Alto" placeholder="auto" />
  </div>
</ui-popover>`;

  readonly sidesCode = `<ui-popover side="top">…</ui-popover>
<ui-popover side="bottom">…</ui-popover>
<ui-popover side="left">…</ui-popover>
<ui-popover side="right">…</ui-popover>

<!-- alineación a lo largo del borde -->
<ui-popover side="bottom" align="start">…</ui-popover>
<ui-popover side="bottom" align="center">…</ui-popover>
<ui-popover side="bottom" align="end">…</ui-popover>`;
}
