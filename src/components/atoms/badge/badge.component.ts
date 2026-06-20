import { Component, booleanAttribute, computed, input, output } from '@angular/core';

export type BadgeVariant = 'solid' | 'soft' | 'outline';
export type BadgeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
export type BadgeSize = 'sm' | 'md';

/**
 * Etiqueta compacta para estados, tags y contadores.
 * Dos ejes: variant (solid/soft/outline) × color, más dot, ícono y removible.
 */
@Component({
  selector: 'ui-badge',
  templateUrl: './badge.component.html',
  host: { class: 'inline-flex' },
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('soft');
  readonly color = input<BadgeColor>('primary');
  readonly size = input<BadgeSize>('md');
  readonly dot = input(false, { transform: booleanAttribute });
  readonly removable = input(false, { transform: booleanAttribute });

  /** Se emite al pulsar la × (solo si removable). */
  readonly remove = output<void>();

  protected readonly hostClasses = computed(() => {
    const base =
      'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap align-middle';

    const sizeMap: Record<BadgeSize, string> = {
      sm: 'h-5 px-2 text-[11px]',
      md: 'h-6 px-2.5 text-xs',
    };

    // color × variant. solid: fondo lleno · soft: tinte suave · outline: solo borde.
    const styleMap: Record<BadgeColor, Record<BadgeVariant, string>> = {
      primary: {
        solid: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
        soft: 'bg-[var(--color-primary)]/12 text-[var(--color-primary)]',
        outline: 'border border-[var(--color-primary)]/40 text-[var(--color-primary)]',
      },
      secondary: {
        solid: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
        soft: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
        outline: 'border border-[var(--color-border)] text-[var(--color-muted-foreground)]',
      },
      success: {
        solid: 'bg-emerald-500 text-white',
        soft: 'bg-emerald-500/12 text-emerald-600',
        outline: 'border border-emerald-500/40 text-emerald-600',
      },
      warning: {
        solid: 'bg-amber-500 text-white',
        soft: 'bg-amber-500/15 text-amber-600',
        outline: 'border border-amber-500/40 text-amber-600',
      },
      destructive: {
        solid: 'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)]',
        soft: 'bg-[var(--color-destructive)]/12 text-[var(--color-destructive)]',
        outline: 'border border-[var(--color-destructive)]/40 text-[var(--color-destructive)]',
      },
    };

    return [base, sizeMap[this.size()], styleMap[this.color()][this.variant()]].join(' ');
  });
}
