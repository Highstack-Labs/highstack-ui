import { Component, computed, input } from '@angular/core';

export type SeparatorOrientation = 'horizontal' | 'vertical';

/**
 * Línea divisoria fina para separar contenido. Decorativa por defecto
 * (`aria-hidden`); pásale `[decorative]="false"` si separa grupos con
 * significado semántico (se anuncia como `role="separator"`).
 *
 * @example
 * ```html
 * <ui-separator />
 * <div class="flex items-center gap-3 h-5">
 *   <span>Inicio</span>
 *   <ui-separator orientation="vertical" />
 *   <span>Perfil</span>
 * </div>
 * ```
 */
@Component({
  selector: 'ui-separator',
  template: '',
  host: {
    '[class]': 'hostClasses()',
    '[attr.role]': 'decorative() ? "none" : "separator"',
    '[attr.aria-orientation]': 'decorative() ? null : orientation()',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
  },
})
export class SeparatorComponent {
  readonly orientation = input<SeparatorOrientation>('horizontal');
  readonly decorative = input(true);

  protected readonly hostClasses = computed(() => {
    // `block` es necesario: un custom element es inline por defecto e ignoraría
    // width/height (un separador horizontal colapsaría a 0).
    const base = 'block shrink-0 bg-[var(--color-border)]';
    return this.orientation() === 'vertical' ? `${base} h-full w-px` : `${base} h-px w-full`;
  });
}
