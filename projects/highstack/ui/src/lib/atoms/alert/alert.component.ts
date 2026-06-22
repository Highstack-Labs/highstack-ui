import { Component, booleanAttribute, computed, input, output } from '@angular/core';

export type AlertType = 'info' | 'success' | 'warning' | 'error';
export type AlertVariant = 'soft' | 'solid';

/**
 * Mensaje contextual con color e ícono según el tipo. El cuerpo se proyecta;
 * `title` opcional en negrita. Cerrable con el output (close).
 */
@Component({
  selector: 'ui-alert',
  templateUrl: './alert.component.html',
  host: { role: 'alert', '[class]': 'hostClasses()' },
})
export class AlertComponent {
  readonly type = input<AlertType>('info');
  readonly variant = input<AlertVariant>('soft');
  readonly title = input<string>('');
  readonly closable = input(false, { transform: booleanAttribute });

  readonly close = output<void>();

  protected readonly hostClasses = computed(() => {
    const base = 'flex items-start gap-3 rounded-[var(--radius)] px-4 py-3 text-sm';

    const softMap: Record<AlertType, string> = {
      info: 'bg-[var(--color-primary)]/8 text-[var(--color-foreground)] border border-[var(--color-primary)]/20',
      success: 'bg-emerald-500/10 text-[var(--color-foreground)] border border-emerald-500/25',
      warning: 'bg-amber-500/10 text-[var(--color-foreground)] border border-amber-500/30',
      error:
        'bg-[var(--color-destructive)]/10 text-[var(--color-foreground)] border border-[var(--color-destructive)]/25',
    };
    const solidMap: Record<AlertType, string> = {
      info: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
      success: 'bg-emerald-500 text-white',
      warning: 'bg-amber-500 text-white',
      error: 'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)]',
    };

    const tone = this.variant() === 'solid' ? solidMap[this.type()] : softMap[this.type()];
    return [base, tone].join(' ');
  });

  /** Color del ícono (en soft toma el color del tipo; en solid hereda currentColor). */
  protected readonly iconColor = computed(() => {
    if (this.variant() === 'solid') return '';
    const map: Record<AlertType, string> = {
      info: 'text-[var(--color-primary)]',
      success: 'text-emerald-600',
      warning: 'text-amber-600',
      error: 'text-[var(--color-destructive)]',
    };
    return map[this.type()];
  });
}
