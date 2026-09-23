import { AfterViewInit, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import {
  StepperComponent,
  StepComponent,
  StepItem,
} from '../../../../components/atoms/stepper/stepper.component';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

@Component({
  selector: 'app-stepper-page',
  imports: [
    PageHeaderComponent,
    StepperComponent,
    StepComponent,
    ButtonComponent,
    DemoBlockComponent,
    CodeBlockComponent,
  ],
  templateUrl: './stepper.page.html',
})
export class StepperPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'circles', label: 'Círculos' },
    { id: 'check', label: 'Con check' },
    { id: 'description', label: 'Con descripción' },
    { id: 'vertical', label: 'Vertical' },
    { id: 'progress', label: 'Barra de progreso' },
    { id: 'composicional', label: 'Composicional' },
    { id: 'wizard', label: 'Wizard' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  // --- Estado de las demos ---
  protected readonly basic = signal(1);
  protected readonly withDesc = signal(1);
  protected readonly vertical = signal(1);
  protected readonly progress = signal(1);
  protected readonly compositional = signal(0);
  protected readonly wizard = signal(0);

  protected readonly steps: StepItem[] = [
    { label: 'Cuenta' },
    { label: 'Perfil' },
    { label: 'Confirmar' },
  ];

  protected readonly stepsDesc: StepItem[] = [
    { label: 'Cuenta', description: 'Email y contraseña' },
    { label: 'Perfil', description: 'Tus datos' },
    { label: 'Confirmar', description: 'Revisa y envía' },
  ];

  protected readonly wizardSteps: StepItem[] = [
    { label: 'Datos' },
    { label: 'Dirección' },
    { label: 'Pago' },
    { label: 'Listo' },
  ];

  protected readonly isFirst = computed(() => this.wizard() === 0);
  protected readonly isLast = computed(() => this.wizard() === this.wizardSteps.length - 1);

  next() {
    if (!this.isLast()) this.wizard.update((i) => i + 1);
  }
  prev() {
    if (!this.isFirst()) this.wizard.update((i) => i - 1);
  }

  // --- Snippets ---
  readonly basicCode = `<ui-stepper [(active)]="paso" [steps]="[
  { label: 'Cuenta' }, { label: 'Perfil' }, { label: 'Confirmar' }
]" />`;

  readonly checkCode = `<!-- showCheck (por defecto true): pasos completados muestran ✓ -->
<ui-stepper [(active)]="paso" [steps]="steps" [showCheck]="true" />`;

  readonly descCode = `<ui-stepper [(active)]="paso" [steps]="[
  { label: 'Cuenta', description: 'Email y contraseña' },
  { label: 'Perfil', description: 'Tus datos' },
]" />`;

  readonly verticalCode = `<ui-stepper [(active)]="paso" orientation="vertical" [steps]="steps" />`;

  readonly progressCode = `<ui-stepper [(active)]="paso" variant="progress" [steps]="steps" />`;

  readonly compositionalCode = `<!-- Modo composicional: cada <ui-step> proyecta el contenido del paso activo -->
<ui-stepper [(active)]="paso">
  <ui-step label="Cuenta" description="Email y contraseña">
    <p>Formulario de la cuenta…</p>
  </ui-step>
  <ui-step label="Perfil" description="Tus datos">
    <p>Formulario del perfil…</p>
  </ui-step>
  <ui-step label="Confirmar">
    <p>Resumen y envío…</p>
  </ui-step>
</ui-stepper>`;

  readonly wizardCode = `<ui-stepper [(active)]="paso" [steps]="steps" [linear]="true">
  <!-- contenido del paso activo va aparte; aquí solo el indicador -->
</ui-stepper>

<ui-button (click)="prev()" [disabled]="paso === 0">Anterior</ui-button>
<ui-button (click)="next()">Siguiente</ui-button>`;
}
