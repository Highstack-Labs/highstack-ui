import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import { TooltipDirective } from '../../../../components/atoms/tooltip/tooltip.directive';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';

@Component({
  selector: 'app-tooltip-page',
  imports: [TooltipDirective, ButtonComponent, DemoBlockComponent, CodeBlockComponent],
  templateUrl: './tooltip.page.html',
})
export class TooltipPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'placement', label: 'Posiciones' },
    { id: 'delay', label: 'Delay' },
    { id: 'icons', label: 'En íconos' },
    { id: 'disabled', label: 'Deshabilitado' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import { TooltipDirective } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-button uiTooltip="Guardar cambios">Guardar</ui-button>`;

  readonly placementCode = `<ui-button uiTooltip="Arriba" tooltipPlacement="top">Top</ui-button>
<ui-button uiTooltip="Abajo" tooltipPlacement="bottom">Bottom</ui-button>
<ui-button uiTooltip="Izquierda" tooltipPlacement="left">Left</ui-button>
<ui-button uiTooltip="Derecha" tooltipPlacement="right">Right</ui-button>`;

  readonly delayCode = `<ui-button uiTooltip="Sin delay" [tooltipDelay]="0">Inmediato</ui-button>
<ui-button uiTooltip="Medio segundo" [tooltipDelay]="500">500ms</ui-button>`;

  readonly iconsCode = `<button uiTooltip="Más información" tooltipPlacement="right" class="...">
  <svg><!-- ícono info --></svg>
</button>`;

  readonly disabledCode = `<ui-button uiTooltip="No se muestra" [tooltipDisabled]="true">Sin tooltip</ui-button>`;
}
