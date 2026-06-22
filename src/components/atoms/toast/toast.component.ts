import { Component, afterNextRender, computed, input, output, signal } from '@angular/core';
import { Toast } from './toast.types';

/** Tarjeta individual de toast. */
@Component({
  selector: 'ui-toast',
  templateUrl: './toast.component.html',
})
export class ToastComponent {
  readonly toast = input.required<Toast>();
  readonly close = output<void>();

  /** Controla la transición de entrada (false → true tras montar). */
  protected readonly shown = signal(false);

  constructor() {
    afterNextRender(() => this.shown.set(true));
  }

  protected readonly iconColor = computed(() => {
    const map: Record<Toast['type'], string> = {
      info: 'text-[var(--color-primary)]',
      success: 'text-emerald-600',
      warning: 'text-amber-600',
      error: 'text-[var(--color-destructive)]',
    };
    return map[this.toast().type];
  });

  protected runAction() {
    this.toast().action?.handler();
    this.close.emit();
  }
}
