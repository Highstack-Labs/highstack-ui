import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import {
  AvatarComponent,
  AvatarGroupComponent,
} from '../../../../components/atoms/avatar/avatar.component';
import { BadgeComponent } from '../../../../components/atoms/badge/badge.component';
import {
  CardComponent,
  CardContentComponent,
} from '../../../../components/atoms/card/card.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';

@Component({
  selector: 'app-avatar-page',
  imports: [
    AvatarComponent,
    AvatarGroupComponent,
    BadgeComponent,
    CardComponent,
    CardContentComponent,
    DemoBlockComponent,
    CodeBlockComponent,
  ],
  templateUrl: './avatar.page.html',
})
export class AvatarPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  readonly photo = 'https://i.pravatar.cc/150?img=12';
  readonly photo2 = 'https://i.pravatar.cc/150?img=32';
  readonly photo3 = 'https://i.pravatar.cc/150?img=45';

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Imagen y fallback' },
    { id: 'sizes', label: 'Tamaños' },
    { id: 'shapes', label: 'Formas' },
    { id: 'status', label: 'Estado' },
    { id: 'group', label: 'Grupo apilado' },
    { id: 'example', label: 'Ejemplo real' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import { AvatarComponent, AvatarGroupComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<!-- Con imagen -->
<ui-avatar src="/foto.jpg" name="Juan Díaz" />

<!-- Fallback a iniciales si no hay imagen o falla -->
<ui-avatar name="Juan Díaz" />

<!-- Sin nombre: ícono genérico -->
<ui-avatar />`;

  readonly sizesCode = `<ui-avatar size="xs" name="Ana López" />
<ui-avatar size="sm" name="Ana López" />
<ui-avatar size="md" name="Ana López" />
<ui-avatar size="lg" name="Ana López" />
<ui-avatar size="xl" name="Ana López" />`;

  readonly shapesCode = `<ui-avatar shape="circle" name="Juan Díaz" />
<ui-avatar shape="square" name="Juan Díaz" />`;

  readonly statusCode = `<ui-avatar name="Ana López" status="online" />
<ui-avatar name="Ana López" status="away" />
<ui-avatar name="Ana López" status="busy" />
<ui-avatar name="Ana López" status="offline" />`;

  readonly groupCode = `<ui-avatar-group [max]="3">
  <ui-avatar [src]="foto1" name="Ana López" />
  <ui-avatar [src]="foto2" name="Juan Díaz" />
  <ui-avatar name="Carla Ruiz" />
  <ui-avatar name="Luis Mora" />
  <ui-avatar name="Eva Soto" />
</ui-avatar-group>
<!-- muestra 3 + "+2" -->`;

  readonly exampleCode = `<ui-card class="max-w-xs">
  <ui-card-content>
    <div class="flex items-center gap-3">
      <ui-avatar size="lg" [src]="foto" name="Juan Díaz" status="online" />
      <div>
        <p class="font-semibold">Juan Díaz</p>
        <ui-badge color="success" variant="soft" size="sm">Pro</ui-badge>
      </div>
    </div>
  </ui-card-content>
</ui-card>`;
}
