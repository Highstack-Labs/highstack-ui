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
  styleUrl: './button.component.css',
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
    // Layout y tipografía en Tailwind; relleno, relieve y estados en button.component.css.
    const base = [
      'ui-btn inline-flex items-center justify-center gap-2 whitespace-nowrap',
      this.pill() ? 'rounded-full' : '',
      this.full() ? 'w-full' : '',
      'font-medium',
    ].filter(Boolean).join(' ');

    const variantMap: Record<ButtonVariant, string> = {
      default: 'ui-btn-raised ui-btn-solid ui-btn-default',
      destructive: 'ui-btn-raised ui-btn-solid ui-btn-destructive',
      success: 'ui-btn-raised ui-btn-solid ui-btn-success',
      warning: 'ui-btn-raised ui-btn-solid ui-btn-warning',
      gradient: 'ui-btn-raised ui-btn-gradient',
      secondary: 'ui-btn-raised ui-btn-secondary',
      outline: 'ui-btn-raised ui-btn-outline',
      glass: 'ui-btn-raised ui-btn-glass',
      ghost: 'ui-btn-ghost',
      link: 'ui-btn-link',
    };

    // Radio ligado al tamaño: menos alto → menos redondez (estilo shadcn).
    const pill = this.pill();
    const sizeMap: Record<ButtonSize, string> = {
      xs: `h-6 px-2 gap-1 text-xs ${pill ? '' : 'rounded-lg'}`,
      sm: `h-8 px-3 gap-1.5 text-xs ${pill ? '' : 'rounded-lg'}`,
      md: `h-9 px-4 gap-2 text-sm ${pill ? '' : 'rounded-[10px]'}`,
      lg: `h-10 px-5 gap-2 text-sm ${pill ? '' : 'rounded-[10px]'}`,
      icon: `size-9 ${pill ? '' : 'rounded-[10px]'}`,
    };

    return [base, variantMap[this.variant()], sizeMap[this.size()]].join(' ');
  });
}
