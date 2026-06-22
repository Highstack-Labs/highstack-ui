import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { form, validate, requiredError, FormField } from '@angular/forms/signals';

import { CheckboxComponent } from '../../../../components/atoms/checkbox/checkbox.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-checkbox-page',
  imports: [PageHeaderComponent, CheckboxComponent, DemoBlockComponent, CodeBlockComponent, FormField, ReactiveFormsModule],
  templateUrl: './checkbox.page.html',
})
export class CheckboxPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  // Demos
  readonly checkedValue = signal(true);
  readonly selectAll = signal(false);

  // Signal Forms
  readonly signalModel = signal({ terms: false });
  readonly signalForm = form(this.signalModel, (path) => {
    validate(path.terms, (ctx) =>
      ctx.value() ? null : requiredError({ message: 'Debes aceptar los términos' }),
    );
  });

  // Reactive Forms
  readonly reactiveCtrl = new FormControl(false, { nonNullable: true });

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'description', label: 'Con descripción' },
    { id: 'indeterminate', label: 'Indeterminado' },
    { id: 'sizes', label: 'Tamaños' },
    { id: 'states', label: 'Estados' },
    { id: 'signal-forms', label: 'Signal Forms' },
    { id: 'reactive-forms', label: 'Reactive Forms' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import { CheckboxComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-checkbox label="Acepto los términos" [(checked)]="aceptado" />`;

  readonly descriptionCode = `<ui-checkbox
  label="Marketing"
  description="Recibe novedades y ofertas por correo."
/>`;

  readonly indeterminateCode = `<ui-checkbox label="Seleccionar todo" [indeterminate]="true" />`;

  readonly sizesCode = `<ui-checkbox size="sm" label="Small" />
<ui-checkbox size="md" label="Medium" />`;

  readonly statesCode = `<ui-checkbox label="Marcado" [checked]="true" />
<ui-checkbox label="Deshabilitado" [disabled]="true" />
<ui-checkbox label="Marcado + deshabilitado" [checked]="true" [disabled]="true" />`;

  readonly signalFormsCode = `model = signal({ terms: false });
termsForm = form(this.model, (path) => {
  validate(path.terms, (ctx) =>
    ctx.value() ? null : requiredError({ message: 'Debes aceptar los términos' }));
});`;

  readonly signalFormsTemplate = `<ui-checkbox [formField]="termsForm.terms" label="Acepto los términos" />`;

  readonly reactiveFormsCode = `ctrl = new FormControl(false, { nonNullable: true });`;

  readonly reactiveFormsTemplate = `<ui-checkbox [formControl]="ctrl" label="Recordarme" />`;
}
