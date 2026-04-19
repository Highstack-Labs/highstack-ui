import { Component, computed, input } from '@angular/core';

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'secondary'
  | 'gradient'
  | 'glass';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

@Component({
  selector: 'ui-button',
  templateUrl: './button.component.html',
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('default');
  readonly size = input<ButtonSize>('md');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  protected readonly hostClasses = computed(() => {
    const base = [
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)]',
      'text-sm font-medium transition-all',
      'outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--color-ring)]/50',
      'disabled:pointer-events-none disabled:opacity-50',
      'cursor-pointer',
    ].join(' ');

    const variantMap: Record<ButtonVariant, string> = {
      default:
        'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-xs hover:bg-[var(--color-primary)]/90',
      destructive:
        'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] shadow-xs hover:bg-[var(--color-destructive)]/90 focus-visible:ring-[var(--color-destructive)]/20',
      outline:
        'border border-[var(--color-input)] bg-[var(--color-background)] shadow-xs hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
      secondary:
        'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] shadow-xs hover:bg-[var(--color-secondary)]/80',
      ghost:
        'hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
      link: 'text-[var(--color-primary)] underline-offset-4 hover:underline',
      gradient:
        'bg-gradient-to-r from-zinc-900 to-zinc-700 text-white shadow-xs hover:from-zinc-800 hover:to-zinc-600',
      glass:
        'backdrop-blur-2xl bg-white/10 border border-white/15 text-white/90 shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:bg-white/[0.18] active:bg-white/[0.12]',
    };

    const sizeMap: Record<ButtonSize, string> = {
      sm: 'h-8 px-3 gap-1.5',
      md: 'h-9 px-4 py-2',
      lg: 'h-10 px-6',
      icon: 'size-9',
    };

    return [base, variantMap[this.variant()], sizeMap[this.size()]].join(' ');
  });
}
