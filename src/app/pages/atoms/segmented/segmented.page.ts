import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { form, required, FormField } from '@angular/forms/signals';

import {
  SegmentedComponent,
  SegmentedOption,
} from '../../../../components/atoms/segmented/segmented.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';

@Component({
  selector: 'app-segmented-page',
  imports: [
    PageHeaderComponent,
    SegmentedComponent,
    DemoBlockComponent,
    CodeBlockComponent,
    FormField,
  ],
  templateUrl: './segmented.page.html',
})
export class SegmentedPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  // --- Datos de demo ---
  readonly modelos: SegmentedOption[] = [
    { value: 'gpt', label: 'GPT-4' },
    { value: 'claude', label: 'Claude' },
    { value: 'gemini', label: 'Gemini' },
  ];

  readonly vistas: SegmentedOption[] = [
    {
      value: 'list',
      label: 'Lista',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>',
    },
    {
      value: 'grid',
      label: 'Cuadrícula',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
    },
  ];

  readonly rango: SegmentedOption[] = [
    { value: 'day', label: 'Día' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
  ];

  readonly planes: SegmentedOption[] = [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
    { value: 'enterprise', label: 'Enterprise', disabled: true },
  ];

  // --- Estado de los demos ---
  readonly modelo = signal('claude');
  readonly vista = signal('grid');
  readonly rangoSel = signal('week');
  readonly planSel = signal('pro');

  // --- Demo Signal Forms ---
  readonly signalModel = signal({ modelo: '' });
  readonly signalForm = form(this.signalModel, (path) => {
    required(path.modelo, { message: 'Elige un modelo' });
  });

  // --- Scroll-spy ---
  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'icons', label: 'Con íconos' },
    { id: 'sizes', label: 'Tamaños' },
    { id: 'full-width', label: 'Ancho completo' },
    { id: 'disabled', label: 'Deshabilitado' },
    { id: 'signal-forms', label: 'Signal Forms' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import { SegmentedComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `models = [
  { value: 'gpt', label: 'GPT-4' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
];

<ui-segmented [options]="models" [(value)]="modelo" />`;

  readonly iconsCode = `vistas = [
  { value: 'list', label: 'Lista', icon: '<svg>...</svg>' },
  { value: 'grid', label: 'Cuadrícula', icon: '<svg>...</svg>' },
];

<ui-segmented [options]="vistas" [(value)]="vista" />`;

  readonly sizesCode = `<ui-segmented size="sm" [options]="rango" [(value)]="r" />
<ui-segmented size="md" [options]="rango" [(value)]="r" />`;

  readonly fullWidthCode = `<ui-segmented [fullWidth]="true" [options]="rango" [(value)]="r" />`;

  readonly disabledCode = `planes = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise', disabled: true }, // opción individual
];

<!-- Opción deshabilitada -->
<ui-segmented [options]="planes" [(value)]="plan" />

<!-- Grupo completo deshabilitado -->
<ui-segmented [options]="planes" [(value)]="plan" [disabled]="true" />`;

  readonly signalFormsCode = `// componente.ts
model = signal({ modelo: '' });
miForm = form(this.model, (path) => {
  required(path.modelo, { message: 'Elige un modelo' });
});`;

  readonly signalFormsTemplate = `<!-- template -->
<ui-segmented [formField]="miForm.modelo" [options]="models" />`;
}
