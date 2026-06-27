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
/** Margen mínimo al borde del viewport (px). */
const MARGIN = 8;

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

  /** Lado/alineación efectivos tras medir el viewport (pueden voltear los inputs). */
  protected readonly resolvedSide = signal<PopoverSide>('bottom');
  protected readonly resolvedAlign = signal<PopoverAlign>('center');
  /** Oculta el panel un frame hasta posicionarlo, para que el flip no se vea saltar. */
  protected readonly ready = signal(false);

  protected readonly panelClasses = computed(() => {
    const base =
      'absolute z-50 w-72 max-w-[calc(100vw-2rem)] rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-md text-[var(--color-foreground)] transition-opacity duration-100';

    const side = this.resolvedSide();
    const align = this.resolvedAlign();

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

    const visibility = this.ready() ? 'opacity-100' : 'opacity-0';
    return [base, sideMap[side], alignClass, visibility].join(' ');
  });

  toggle() {
    if (this.open()) this.close();
    else this.openPopover();
  }

  private openPopover() {
    this.resolvedSide.set(this.side());
    this.resolvedAlign.set(this.align());
    this.ready.set(false);
    this.open.set(true);
    // Tras renderizar el panel, medirlo y ajustar la posición al viewport.
    requestAnimationFrame(() => this.updatePosition());
  }

  close() {
    this.open.set(false);
    this.ready.set(false);
  }

  /** Mide el panel y voltea lado/alineación si se sale del viewport. */
  private updatePosition() {
    const panel = this.el.nativeElement.querySelector('[role="dialog"]') as HTMLElement | null;
    if (!panel || !this.open()) return;

    const host = this.el.nativeElement.getBoundingClientRect();
    const rect = panel.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const reqSide = this.side();
    const reqAlign = this.align();

    // --- Eje principal: voltear al lado opuesto si no cabe y el opuesto sí. ---
    const need = (axis: 'v' | 'h') => (axis === 'v' ? rect.height : rect.width) + MARGIN;
    const space = {
      top: host.top,
      bottom: vh - host.bottom,
      left: host.left,
      right: vw - host.right,
    };
    const opposite: Record<PopoverSide, PopoverSide> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    };
    let side = reqSide;
    const axisOfSide = side === 'left' || side === 'right' ? 'h' : 'v';
    if (space[side] < need(axisOfSide) && space[opposite[side]] >= space[side]) {
      side = opposite[side];
    }

    // --- Eje transversal: elegir la alineación que mantiene el panel dentro. ---
    let align = reqAlign;
    if (side === 'top' || side === 'bottom') {
      // alineación horizontal: start ancla a la izquierda del trigger, end a la derecha.
      const leftFor = (a: PopoverAlign) =>
        a === 'start'
          ? host.left
          : a === 'end'
            ? host.right - rect.width
            : host.left + host.width / 2 - rect.width / 2;
      const inView = (a: PopoverAlign) =>
        leftFor(a) >= MARGIN && leftFor(a) + rect.width <= vw - MARGIN;
      if (!inView(align)) align = (['center', 'start', 'end'] as PopoverAlign[]).find(inView) ?? align;
    } else {
      // alineación vertical.
      const topFor = (a: PopoverAlign) =>
        a === 'start'
          ? host.top
          : a === 'end'
            ? host.bottom - rect.height
            : host.top + host.height / 2 - rect.height / 2;
      const inView = (a: PopoverAlign) =>
        topFor(a) >= MARGIN && topFor(a) + rect.height <= vh - MARGIN;
      if (!inView(align)) align = (['center', 'start', 'end'] as PopoverAlign[]).find(inView) ?? align;
    }

    this.resolvedSide.set(side);
    this.resolvedAlign.set(align);
    this.ready.set(true);
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent) {
    if (this.open() && !this.el.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  protected onViewportChange() {
    if (this.open()) this.updatePosition();
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
