import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { form, required, FormField } from '@angular/forms/signals';

import { RadioGroupComponent, RadioComponent } from '../../../../components/atoms/radio/radio.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';

@Component({
  selector: 'app-radio-page',
  imports: [
    RadioGroupComponent,
    RadioComponent,
    DemoBlockComponent,
    CodeBlockComponent,
    FormField,
    ReactiveFormsModule,
  ],
  templateUrl: './radio.page.html',
})
export class RadioPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  readonly plan = signal('pro');
  readonly fruit = signal('apple');
  readonly layout = signal('grid');
  readonly cardPlan = signal('pro');

  // Signal Forms
  readonly signalModel = signal({ plan: '' });
  readonly signalForm = form(this.signalModel, (path) => {
    required(path.plan, { message: 'Selecciona un plan' });
  });

  // Reactive Forms
  readonly reactiveCtrl = new FormControl('mensual', { nonNullable: true });

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'description', label: 'Con descripción' },
    { id: 'horizontal', label: 'Horizontal' },
    { id: 'sizes', label: 'Tamaños' },
    { id: 'card', label: 'Variante card' },
    { id: 'signal-forms', label: 'Signal Forms' },
    { id: 'reactive-forms', label: 'Reactive Forms' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import { RadioGroupComponent, RadioComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-radio-group [(value)]="fruta">
  <ui-radio value="apple" label="Manzana" />
  <ui-radio value="banana" label="Banana" />
  <ui-radio value="orange" label="Naranja" />
</ui-radio-group>`;

  readonly descriptionCode = `<ui-radio-group [(value)]="plan">
  <ui-radio value="free" label="Free" description="Para empezar." />
  <ui-radio value="pro" label="Pro" description="$29/mes, hasta 10 usuarios." />
  <ui-radio value="ent" label="Enterprise" description="Facturación personalizada." />
</ui-radio-group>`;

  readonly horizontalCode = `<ui-radio-group orientation="horizontal" [(value)]="layout">
  <ui-radio value="grid" label="Cuadrícula" />
  <ui-radio value="list" label="Lista" />
  <ui-radio value="board" label="Tablero" />
</ui-radio-group>`;

  readonly sizesCode = `<ui-radio-group size="sm" [(value)]="a"> ... </ui-radio-group>
<ui-radio-group size="md" [(value)]="b"> ... </ui-radio-group>`;

  readonly cardCode = `<ui-radio-group appearance="card" orientation="horizontal" [(value)]="plan">
  <ui-radio value="free" label="Free" description="$0/mes" />
  <ui-radio value="pro" label="Pro" description="$29/mes" />
  <ui-radio value="ent" label="Enterprise" description="Custom" />
</ui-radio-group>`;

  readonly signalFormsCode = `model = signal({ plan: '' });
planForm = form(this.model, (path) => {
  required(path.plan, { message: 'Selecciona un plan' });
});`;

  readonly signalFormsTemplate = `<ui-radio-group [formField]="planForm.plan">
  <ui-radio value="free" label="Free" />
  <ui-radio value="pro" label="Pro" />
</ui-radio-group>`;

  readonly reactiveFormsCode = `ctrl = new FormControl('mensual', { nonNullable: true });`;

  readonly reactiveFormsTemplate = `<ui-radio-group [formControl]="ctrl">
  <ui-radio value="mensual" label="Mensual" />
  <ui-radio value="anual" label="Anual" />
</ui-radio-group>`;
}
