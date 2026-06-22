import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { form, required, email, minLength, FormField } from '@angular/forms/signals';

import { InputComponent } from '../../../../components/atoms/input/input.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';

@Component({
  selector: 'app-input-page',
  imports: [PageHeaderComponent, 
    InputComponent,
    DemoBlockComponent,
    CodeBlockComponent,
    FormField,
    ReactiveFormsModule,
  ],
  templateUrl: './input.page.html',
})
export class InputPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  // --- Demo two-way simple ---
  readonly demoValue = signal('');

  // --- Demo Signal Forms ---
  readonly signalModel = signal({ email: '', password: '' });
  readonly signalForm = form(this.signalModel, (path) => {
    required(path.email, { message: 'El correo es obligatorio' });
    email(path.email, { message: 'Ingresa un correo válido' });
    required(path.password, { message: 'La contraseña es obligatoria' });
    minLength(path.password, 8, { message: 'Mínimo 8 caracteres' });
  });

  // --- Demo Reactive Forms ---
  readonly reactiveForm = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  get usernameError(): string {
    const c = this.reactiveForm.controls.username;
    return c.touched && c.hasError('required') ? 'El usuario es obligatorio' : '';
  }

  // --- Scroll-spy ---
  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'label-hint', label: 'Label y ayuda' },
    { id: 'icons', label: 'Con íconos' },
    { id: 'sizes', label: 'Tamaños' },
    { id: 'states', label: 'Estados' },
    { id: 'password', label: 'Password' },
    { id: 'signal-forms', label: 'Signal Forms' },
    { id: 'reactive-forms', label: 'Reactive Forms' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Snippets ---
  readonly importExample = `import { InputComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-input placeholder="Escribe algo..." [(value)]="texto" />`;

  readonly labelCode = `<ui-input
  label="Email"
  type="email"
  placeholder="tu@correo.com"
  hint="No compartiremos tu correo."
/>`;

  readonly iconsCode = `<ui-input placeholder="Buscar...">
  <svg slot="prefix"><!-- ícono lupa --></svg>
</ui-input>

<ui-input type="email" placeholder="tu@correo.com">
  <svg slot="suffix"><!-- ícono check --></svg>
</ui-input>`;

  readonly sizesCode = `<ui-input size="sm" placeholder="Small" />
<ui-input size="md" placeholder="Medium" />
<ui-input size="lg" placeholder="Large" />`;

  readonly statesCode = `<ui-input label="Error" [error]="'Este campo es obligatorio'" />
<ui-input label="Deshabilitado" [disabled]="true" value="No editable" />
<ui-input label="Solo lectura" [readonly]="true" value="Solo lectura" />`;

  readonly passwordCode = `<!-- Con ojito (por defecto) -->
<ui-input label="Contraseña" type="password" placeholder="••••••••" />

<!-- Sin ojito -->
<ui-input label="Contraseña" type="password" [passwordToggle]="false" />`;

  readonly signalFormsCode = `// componente.ts
import { signal } from '@angular/core';
import { form, required, email, minLength, FormField } from '@angular/forms/signals';

model = signal({ email: '', password: '' });
loginForm = form(this.model, (path) => {
  required(path.email, { message: 'El correo es obligatorio' });
  email(path.email, { message: 'Ingresa un correo válido' });
  required(path.password, { message: 'La contraseña es obligatoria' });
  minLength(path.password, 8, { message: 'Mínimo 8 caracteres' });
});`;

  readonly signalFormsTemplate = `<!-- template -->
<ui-input [formField]="loginForm.email" label="Email" type="email" />
<ui-input [formField]="loginForm.password" label="Contraseña" type="password" />
<!-- errores y touched se cablean solos vía [formField] -->`;

  readonly reactiveFormsCode = `// componente.ts
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';

form = new FormGroup({
  username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
});`;

  readonly reactiveFormsTemplate = `<!-- template -->
<form [formGroup]="form">
  <ui-input
    formControlName="username"
    label="Usuario"
    [invalid]="form.controls.username.invalid"
    [touched]="form.controls.username.touched"
    [error]="usernameError"
  />
</form>`;
}
