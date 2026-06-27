import {
  Component,
  Directive,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

export type PopoverSide = 'bottom' | 'top' | 'left' | 'right';
export type PopoverAlign = 'start' | 'center' | 'end';

/**
 * Contenedor flotante anclado a un disparador. A diferencia del dropdown
 * (menú de ítems) o el tooltip (solo texto en hover), el popover proyecta
 * contenido libre y se abre al hacer clic. Maneja posición, click-afuera y
 * cierre con Escape.
 *
 * @example
 * ```html
 * <ui-popover side="bottom" align="start">
 *   <ui-button uiPopoverTrigger variant="outline">Abrir</ui-button>
 *
 *   <div class="space-y-2">
 *     <p class="text-sm font-medium">Dimensiones</p>
 *     <ui-input label="Ancho" />
 *     <ui-input label="Alto" />
 *   </div>
 * </ui-popover>
 * ```
 */
@Component({
  selector: 'ui-popover',
  template: `
    <ng-content select="[uiPopoverTrigger]" />
    @if (open()) {
      <div role="dialog" [class]="panelClasses()">
        <ng-content />
      </div>
    }
  `,
  host: { class: 'relative inline-block' },
})
export class PopoverComponent {
  readonly side = input<PopoverSide>('bottom');
  readonly align = input<PopoverAlign>('center');

  readonly open = signal(false);

  private readonly el = inject(ElementRef<HTMLElement>);

  protected readonly panelClasses = computed(() => {
    const base =
      'absolute z-50 w-72 max-w-[calc(100vw-2rem)] rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-md text-[var(--color-foreground)]';

    const side = this.side();
    const align = this.align();

    // Eje principal: a qué lado del disparador aparece.
    const sideMap: Record<PopoverSide, string> = {
      bottom: 'top-full mt-2',
      top: 'bottom-full mb-2',
      left: 'right-full mr-2',
      right: 'left-full ml-2',
    };

    // Eje transversal: alineación a lo largo del borde del disparador.
    const vertical = side === 'left' || side === 'right';
    let alignClass: string;
    if (vertical) {
      alignClass =
        align === 'start' ? 'top-0' : align === 'end' ? 'bottom-0' : 'top-1/2 -translate-y-1/2';
    } else {
      alignClass =
        align === 'start' ? 'left-0' : align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2';
    }

    return [base, sideMap[side], alignClass].join(' ');
  });

  toggle() {
    this.open.update((o) => !o);
  }

  close() {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent) {
    if (this.open() && !this.el.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape() {
    if (this.open()) this.close();
  }
}

/** Marca el elemento disparador del popover. */
@Directive({
  selector: '[uiPopoverTrigger]',
  host: {
    '(click)': 'pop.toggle()',
    '[attr.aria-haspopup]': '"dialog"',
    '[attr.aria-expanded]': 'pop.open()',
  },
})
export class PopoverTriggerDirective {
  protected readonly pop = inject(PopoverComponent);
}
