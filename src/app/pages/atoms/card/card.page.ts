import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import {
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  CardFooterComponent,
} from '../../../../components/atoms/card/card.component';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { BadgeComponent } from '../../../../components/atoms/badge/badge.component';
import { InputComponent } from '../../../../components/atoms/input/input.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-card-page',
  imports: [PageHeaderComponent, 
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    ButtonComponent,
    BadgeComponent,
    InputComponent,
    DemoBlockComponent,
    CodeBlockComponent,
  ],
  templateUrl: './card.page.html',
})
export class CardPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'variants', label: 'Variantes' },
    { id: 'example', label: 'Ejemplo real' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import {
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  CardFooterComponent,
} from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-card>
  <ui-card-header>
    <ui-card-title>Título de la tarjeta</ui-card-title>
    <ui-card-description>Una breve descripción.</ui-card-description>
  </ui-card-header>
  <ui-card-content>
    Contenido principal de la tarjeta.
  </ui-card-content>
  <ui-card-footer>
    <ui-button>Aceptar</ui-button>
    <ui-button variant="ghost">Cancelar</ui-button>
  </ui-card-footer>
</ui-card>`;

  readonly variantsCode = `<ui-card variant="elevated">...</ui-card>
<ui-card variant="outline">...</ui-card>
<ui-card variant="soft">...</ui-card>
<ui-card variant="interactive">...</ui-card>`;

  readonly exampleCode = `<ui-card class="max-w-sm">
  <ui-card-header>
    <div class="flex items-center justify-between">
      <ui-card-title>Plan Pro</ui-card-title>
      <ui-badge color="success" variant="soft">Popular</ui-badge>
    </div>
    <ui-card-description>Para equipos en crecimiento.</ui-card-description>
  </ui-card-header>
  <ui-card-content>
    <p class="text-3xl font-semibold">$29<span class="text-sm">/mes</span></p>
  </ui-card-content>
  <ui-card-footer>
    <ui-button variant="gradient" [full]="true">Empezar</ui-button>
  </ui-card-footer>
</ui-card>`;
}
