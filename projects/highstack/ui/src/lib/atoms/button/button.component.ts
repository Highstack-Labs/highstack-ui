import { Component, computed, input } from '@angular/core';

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'secondary'
  | 'gradient'
  | 'glass'
  | 'success'
  | 'warning';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

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
  readonly pill = input<boolean>(false);
  readonly full = input<boolean>(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  protected readonly hostClasses = computed(() => {
    const base = [
      'inline-flex items-center justify-center gap-2 whitespace-nowrap',
      this.pill() ? 'rounded-full' : 'rounded-[var(--radius)]',
      this.full() ? 'w-full' : '',
      'font-semibold transition-all duration-150',
      'outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--color-ring)]/50',
      'disabled:pointer-events-none disabled:opacity-50 disabled:transform-none disabled:shadow-none',
      'cursor-pointer',
    ].filter(Boolean).join(' ');

    const variantMap: Record<ButtonVariant, string> = {
      default:
        'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm hover:bg-[var(--color-primary)]/95 hover:-translate-y-[1px] hover:shadow-md active:translate-y-[1px] active:scale-[0.98] active:shadow-sm',
      destructive:
        'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] shadow-sm hover:bg-[var(--color-destructive)]/95 hover:-translate-y-[1px] hover:shadow-md active:translate-y-[1px] active:scale-[0.98] active:shadow-sm focus-visible:ring-[var(--color-destructive)]/20',
      outline:
        'border border-[var(--color-input)] bg-[var(--color-background)] shadow-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)] hover:-translate-y-[1px] hover:shadow-md active:translate-y-[1px] active:scale-[0.98] active:shadow-sm',
      secondary:
        'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] shadow-sm hover:bg-[var(--color-secondary)]/90 hover:-translate-y-[1px] hover:shadow-md active:translate-y-[1px] active:scale-[0.98] active:shadow-sm',
      ghost:
        'hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)] active:scale-[0.98]',
      link: 'text-[var(--color-primary)] underline-offset-4 hover:underline',
      gradient:
        'text-[var(--color-primary-foreground)] ' +
        'bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-gradient)_50%,var(--color-primary)_100%)] ' +
        'bg-[length:200%_100%] bg-left ' +
        'shadow-[0_1px_2px_0_rgb(0_0_0/0.10),inset_0_1px_0_0_rgb(255_255_255/0.22)] ' +
        'transition-[background-position,transform,box-shadow] duration-300 ease-out ' +
        'hover:bg-right hover:-translate-y-[1px] hover:shadow-[0_6px_16px_-4px_rgb(0_0_0/0.30),inset_0_1px_0_0_rgb(255_255_255/0.28)] ' +
        'active:translate-y-[1px] active:scale-[0.98] active:shadow-sm',
      glass:
        'backdrop-blur-2xl bg-white/10 border border-white/15 text-white/90 shadow-sm hover:bg-white/[0.18] hover:-translate-y-[1px] hover:shadow-md active:translate-y-[1px] active:scale-[0.98] active:shadow-sm',
      success:
        'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 hover:-translate-y-[1px] hover:shadow-md active:translate-y-[1px] active:scale-[0.98] active:shadow-sm focus-visible:ring-emerald-500/20',
      warning:
        'bg-amber-500 text-white shadow-sm hover:bg-amber-600 hover:-translate-y-[1px] hover:shadow-md active:translate-y-[1px] active:scale-[0.98] active:shadow-sm focus-visible:ring-amber-500/20',
    };

    const sizeMap: Record<ButtonSize, string> = {
      xs: 'h-7 px-2.5 gap-1 text-xs',
      sm: 'h-8 px-3 gap-1.5 text-xs',
      md: 'h-9 px-4 gap-2 text-sm',
      lg: 'h-11 px-6 gap-2 text-base',
      icon: 'size-9',
    };

    return [base, variantMap[this.variant()], sizeMap[this.size()]].join(' ');
  });
}
