import {
  Component,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  model,
} from '@angular/core';

export type StepperOrientation = 'horizontal' | 'vertical';
/** `circles` = círculos numerados conectados; `progress` = barra de progreso. */
export type StepperVariant = 'circles' | 'progress';

/** Un paso en modo data-driven (`[steps]`). */
export interface StepItem {
  label: string;
  description?: string;
}

/** Estado visual de cada paso, derivado de `active`. */
export interface StepState {
  index: number;
  label: string;
  description?: string;
  completed: boolean;
  current: boolean;
  upcoming: boolean;
}

/**
 * Indicador de pasos / wizard. API híbrida: define los pasos con `[steps]`
 * (array de datos) **o** proyectando componentes `<ui-step>` hijos (que además
 * muestran su panel de contenido cuando están activos).
 *
 * @example Data-driven, horizontal con círculos
 * ```html
 * <ui-stepper [(active)]="paso" [steps]="[
 *   { label: 'Cuenta' }, { label: 'Perfil' }, { label: 'Listo' }
 * ]" />
 * ```
 *
 * @example Composicional con paneles y barra de progreso vertical
 * ```html
 * <ui-stepper [(active)]="paso" orientation="vertical" variant="progress">
 *   <ui-step label="Datos" description="Tu información">…contenido…</ui-step>
 *   <ui-step label="Pago">…contenido…</ui-step>
 * </ui-stepper>
 * ```
 */
@Component({
  selector: 'ui-stepper',
  templateUrl: './stepper.component.html',
  host: { class: 'block' },
})
export class StepperComponent {
  /** Índice del paso activo (0-based). Two-way: `[(active)]`. */
  readonly active = model<number>(0);

  readonly orientation = input<StepperOrientation>('horizontal');
  readonly variant = input<StepperVariant>('circles');

  /** Pasos completados muestran ✓ en vez del número. */
  readonly showCheck = input(true, { transform: booleanAttribute });

  /** Si `true`, solo se puede navegar a pasos ya completados (no saltar adelante). */
  readonly linear = input(false, { transform: booleanAttribute });

  /** Habilita la navegación por clic en los indicadores. */
  readonly clickable = input(true, { transform: booleanAttribute });

  /** Pasos en modo data-driven. Si está vacío, se derivan de los `<ui-step>` hijos. */
  readonly steps = input<StepItem[]>([]);

  readonly children = contentChildren(StepComponent);

  /** Fuente única de verdad para los indicadores. */
  readonly resolvedSteps = computed<StepItem[]>(() => {
    const data = this.steps();
    if (data.length) return data;
    return this.children().map((s) => ({ label: s.label(), description: s.description() }));
  });

  /** Estado derivado de cada paso. */
  readonly states = computed<StepState[]>(() => {
    const active = this.active();
    return this.resolvedSteps().map((step, index) => ({
      index,
      label: step.label,
      description: step.description,
      completed: index < active,
      current: index === active,
      upcoming: index > active,
    }));
  });

  /** Porcentaje de avance para la variante `progress` (0–100). */
  readonly progressPct = computed(() => {
    const n = this.resolvedSteps().length;
    if (n <= 1) return this.active() > 0 ? 100 : 0;
    return (Math.min(this.active(), n - 1) / (n - 1)) * 100;
  });

  protected readonly containerClasses = computed(() => {
    if (this.orientation() === 'vertical') return 'flex flex-col gap-0';
    return 'flex items-start';
  });

  /** ¿Se puede navegar a este índice por clic? */
  canSelect(index: number): boolean {
    if (!this.clickable()) return false;
    if (this.linear()) return index <= this.active();
    return true;
  }

  select(index: number) {
    if (!this.canSelect(index)) return;
    this.active.set(index);
  }

  /** Clases del círculo indicador según el estado del paso. */
  circleClasses(state: StepState): string {
    const base =
      'flex items-center justify-center size-9 shrink-0 rounded-full border text-sm font-medium transition-colors';
    if (state.completed || state.current) {
      return [
        base,
        'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary)]',
      ].join(' ');
    }
    return [
      base,
      'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] border-[var(--color-border)]',
    ].join(' ');
  }

  /** Clases del tramo conector entre dos pasos. */
  connectorClasses(state: StepState): string {
    const filled = state.completed ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]';
    if (this.orientation() === 'vertical') {
      return ['w-px flex-1 my-1 self-stretch min-h-6', filled].join(' ');
    }
    return ['h-px flex-1 mx-2 mt-4', filled].join(' ');
  }

  /** Clases del label según el estado. */
  labelClasses(state: StepState): string {
    const color =
      state.completed || state.current
        ? 'text-[var(--color-foreground)]'
        : 'text-[var(--color-muted-foreground)]';
    return ['text-sm font-medium', color].join(' ');
  }
}

/** Un paso composicional: aporta label/descripción y proyecta su panel si está activo. */
@Component({
  selector: 'ui-step',
  template: `
    @if (isActive()) {
      <ng-content />
    }
  `,
})
export class StepComponent {
  readonly label = input<string>('');
  readonly description = input<string>('');

  private readonly stepper = inject(StepperComponent);

  private readonly index = computed(() => this.stepper.children().indexOf(this));
  readonly isActive = computed(() => this.stepper.active() === this.index());
}
