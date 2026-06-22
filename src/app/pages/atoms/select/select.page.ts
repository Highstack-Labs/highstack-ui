import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { form, required, FormField } from '@angular/forms/signals';

import {
  SelectComponent,
  OptionComponent,
} from '../../../../components/atoms/select/select.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-select-page',
  imports: [PageHeaderComponent, 
    SelectComponent,
    OptionComponent,
    DemoBlockComponent,
    CodeBlockComponent,
    FormField,
    ReactiveFormsModule,
  ],
  templateUrl: './select.page.html',
})
export class SelectPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  readonly country = signal('');
  readonly fruit = signal('banana');

  // Signal Forms
  readonly signalModel = signal({ country: '' });
  readonly signalForm = form(this.signalModel, (path) => {
    required(path.country, { message: 'Selecciona un país' });
  });

  // Reactive Forms
  readonly reactiveCtrl = new FormControl('', { nonNullable: true });

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'label-hint', label: 'Label y ayuda' },
    { id: 'sizes', label: 'Tamaños' },
    { id: 'disabled-opt', label: 'Opción deshabilitada' },
    { id: 'signal-forms', label: 'Signal Forms' },
    { id: 'reactive-forms', label: 'Reactive Forms' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import { SelectComponent, OptionComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-select [(value)]="fruta" placeholder="Elige una fruta">
  <ui-option value="apple">Manzana</ui-option>
  <ui-option value="banana">Banana</ui-option>
  <ui-option value="orange">Naranja</ui-option>
</ui-select>`;

  readonly labelCode = `<ui-select
  [(value)]="pais"
  label="País"
  placeholder="Selecciona…"
  hint="Donde resides actualmente."
>
  <ui-option value="mx">México</ui-option>
  <ui-option value="co">Colombia</ui-option>
  <ui-option value="ar">Argentina</ui-option>
</ui-select>`;

  readonly sizesCode = `<ui-select size="sm" placeholder="Small"> … </ui-select>
<ui-select size="md" placeholder="Medium"> … </ui-select>
<ui-select size="lg" placeholder="Large"> … </ui-select>`;

  readonly disabledOptCode = `<ui-select placeholder="Elige un plan">
  <ui-option value="free">Free</ui-option>
  <ui-option value="pro">Pro</ui-option>
  <ui-option value="ent" disabled>Enterprise (próximamente)</ui-option>
</ui-select>`;

  readonly signalFormsCode = `model = signal({ country: '' });
form = form(this.model, (path) => {
  required(path.country, { message: 'Selecciona un país' });
});`;

  readonly signalFormsTemplate = `<ui-select [formField]="form.country" label="País" placeholder="Elige…">
  <ui-option value="mx">México</ui-option>
  <ui-option value="co">Colombia</ui-option>
</ui-select>`;

  readonly reactiveFormsCode = `ctrl = new FormControl('', { nonNullable: true });`;

  readonly reactiveFormsTemplate = `<ui-select [formControl]="ctrl" label="Rol" placeholder="Elige…">
  <ui-option value="admin">Admin</ui-option>
  <ui-option value="editor">Editor</ui-option>
</ui-select>`;
}
