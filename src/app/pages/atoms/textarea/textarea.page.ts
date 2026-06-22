import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { form, required, FormField } from '@angular/forms/signals';

import { TextareaComponent } from '../../../../components/atoms/textarea/textarea.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';

@Component({
  selector: 'app-textarea-page',
  imports: [TextareaComponent, DemoBlockComponent, CodeBlockComponent, FormField, ReactiveFormsModule],
  templateUrl: './textarea.page.html',
})
export class TextareaPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  readonly bio = signal('');

  readonly signalModel = signal({ feedback: '' });
  readonly signalForm = form(this.signalModel, (path) => {
    required(path.feedback, { message: 'Cuéntanos algo' });
  });

  readonly reactiveCtrl = new FormControl('', { nonNullable: true });

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'autogrow', label: 'Auto-grow' },
    { id: 'states', label: 'Estados' },
    { id: 'signal-forms', label: 'Signal Forms' },
    { id: 'reactive-forms', label: 'Reactive Forms' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  readonly importExample = `import { TextareaComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-textarea
  label="Biografía"
  placeholder="Cuéntanos sobre ti…"
  hint="Máximo 200 caracteres."
  [(value)]="bio"
/>`;

  readonly autogrowCode = `<ui-textarea
  label="Notas"
  placeholder="Escribe y crece solo…"
  [autoGrow]="true"
/>`;

  readonly statesCode = `<ui-textarea label="Error" [error]="'Este campo es obligatorio'" />
<ui-textarea label="Deshabilitado" [disabled]="true" value="No editable" />
<ui-textarea label="Solo lectura" [readonly]="true" value="Solo lectura" />`;

  readonly signalFormsCode = `model = signal({ feedback: '' });
form = form(this.model, (path) => {
  required(path.feedback, { message: 'Cuéntanos algo' });
});`;

  readonly signalFormsTemplate = `<ui-textarea [formField]="form.feedback" label="Comentarios" />`;

  readonly reactiveFormsCode = `ctrl = new FormControl('', { nonNullable: true });`;

  readonly reactiveFormsTemplate = `<ui-textarea [formControl]="ctrl" label="Mensaje" />`;
}
