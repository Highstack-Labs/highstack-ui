import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';

import { SwitchComponent } from '../../../../components/atoms/switch/switch.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';

@Component({
  selector: 'app-switch-page',
  imports: [SwitchComponent, DemoBlockComponent, CodeBlockComponent, FormField, ReactiveFormsModule],
  templateUrl: './switch.page.html',
})
export class SwitchPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  readonly enabled = signal(true);

  // Signal Forms
  readonly signalModel = signal({ notifications: true, marketing: false });
  readonly signalForm = form(this.signalModel);

  // Reactive Forms
  readonly reactiveCtrl = new FormControl(false, { nonNullable: true });

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'basic', label: 'Básico' },
    { id: 'description', label: 'Con descripción' },
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
  readonly importExample = `import { SwitchComponent } from '@highstacklabs2026/ui';`;

  readonly basicCode = `<ui-switch label="Modo oscuro" [(checked)]="activo" />`;

  readonly descriptionCode = `<ui-switch
  label="Notificaciones"
  description="Recibe alertas en tiempo real."
/>`;

  readonly sizesCode = `<ui-switch size="sm" label="Small" />
<ui-switch size="md" label="Medium" />`;

  readonly statesCode = `<ui-switch label="Activo" [checked]="true" />
<ui-switch label="Inactivo" />
<ui-switch label="Deshabilitado" [disabled]="true" />
<ui-switch label="Activo + deshabilitado" [checked]="true" [disabled]="true" />`;

  readonly signalFormsCode = `model = signal({ notifications: true, marketing: false });
prefsForm = form(this.model);`;

  readonly signalFormsTemplate = `<ui-switch [formField]="prefsForm.notifications" label="Notificaciones" />
<ui-switch [formField]="prefsForm.marketing" label="Marketing" />`;

  readonly reactiveFormsCode = `ctrl = new FormControl(false, { nonNullable: true });`;

  readonly reactiveFormsTemplate = `<ui-switch [formControl]="ctrl" label="Disponible" />`;
}
