import {
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { containsTarget } from '../../shared/overlay-container';
import { OverlayPortalDirective } from '../../shared/overlay-portal.directive';

export type PopoverSide = 'bottom' | 'top' | 'left' | 'right';
export type PopoverAlign = 'start' | 'center' | 'end';

/**
 * Contenedor flotante anclado a un disparador. A diferencia del dropdown
 * (menú de ítems) o el tooltip (solo texto en hover), el popover proyecta
 * contenido libre y se abre al hacer clic. Maneja posición, click-afuera y
 * cierre con Escape.
 *
 * El panel se posiciona con `position: fixed` y coordenadas calculadas, y se
 * monta en el contenedor de overlays a nivel de <body>. Antes se colocaba con
 * clases `absolute` relativas al host, lo que lo dejaba a merced del `overflow`
 * y el `transform` de cualquier ancestro: dentro de un modal o un drawer salía
 * recortado o descolocado. `side` y `align` siguen siendo la misma API.
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
/** Separación entre el disparador y el panel (px). */
const GAP = 8;

@Component({
  selector: 'ui-popover',
  template: `
    <ng-content select="[uiPopoverTrigger]" />
    @if (open()) {
      <div
        #panel
        uiOverlayPortal
        role="dialog"
        [class]="panelClasses()"
        [style.top.px]="panelTop()"
        [style.left.px]="panelLeft()"
        [style.pointerEvents]="ready() ? 'auto' : 'none'"
      >
        <ng-content />
      </div>
    }
  `,
  imports: [OverlayPortalDirective],
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
  /** Coordenadas fixed del panel (px, relativas al viewport). */
  protected readonly panelTop = signal(0);
  protected readonly panelLeft = signal(0);

  constructor() {
    // Capture=true reposiciona también cuando el scroll ocurre en un contenedor
    // interno (no solo la ventana), ya que el panel es `fixed` y vive fuera de él.
    const onScroll = () => {
      if (this.open()) this.updatePosition();
    };
    window.addEventListener('scroll', onScroll, true);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('scroll', onScroll, true));
  }

  protected readonly panelClasses = computed(() => {
    const base =
      'fixed w-72 max-w-[calc(100vw-2rem)] rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-md text-[var(--color-foreground)] transition-opacity duration-100';
    return [base, this.ready() ? 'opacity-100' : 'opacity-0'].join(' ');
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

  /**
   * El panel está portalizado a nivel de <body>, así que ya no se puede buscar
   * con un querySelector desde el host: hay que quedarse con la referencia de la
   * plantilla.
   */
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  private panelEl(): HTMLElement | null {
    return this.panelRef()?.nativeElement ?? null;
  }

  /**
   * Mide el panel, voltea lado/alineación si se sale del viewport y traduce el
   * resultado a coordenadas.
   */
  private updatePosition() {
    const panel = this.panelEl();
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

    // Con el panel a la izquierda o a la derecha, el eje transversal es el vertical.
    const vertical = side === 'left' || side === 'right';

    /** Posición del panel a lo largo del eje transversal, para una alineación dada. */
    const crossFor = (a: PopoverAlign) => {
      if (vertical) {
        return a === 'start'
          ? host.top
          : a === 'end'
            ? host.bottom - rect.height
            : host.top + host.height / 2 - rect.height / 2;
      }
      return a === 'start'
        ? host.left
        : a === 'end'
          ? host.right - rect.width
          : host.left + host.width / 2 - rect.width / 2;
    };

    // --- Eje transversal: elegir la alineación que mantiene el panel dentro. ---
    const size = vertical ? rect.height : rect.width;
    const limit = vertical ? vh : vw;
    const inView = (a: PopoverAlign) =>
      crossFor(a) >= MARGIN && crossFor(a) + size <= limit - MARGIN;
    let align = reqAlign;
    if (!inView(align)) {
      align = (['center', 'start', 'end'] as PopoverAlign[]).find(inView) ?? align;
    }

    this.resolvedSide.set(side);
    this.resolvedAlign.set(align);

    // --- Y de ahí a coordenadas ---
    const mainStart =
      side === 'bottom'
        ? host.bottom + GAP
        : side === 'top'
          ? host.top - rect.height - GAP
          : side === 'right'
            ? host.right + GAP
            : host.left - rect.width - GAP;

    const cross = crossFor(align);
    const top = vertical ? cross : mainStart;
    const left = vertical ? mainStart : cross;

    // Fijar a los bordes del viewport (respeta solo los límites de la pantalla).
    this.panelTop.set(clamp(top, MARGIN, vh - rect.height - MARGIN));
    this.panelLeft.set(clamp(left, MARGIN, vw - rect.width - MARGIN));
    this.ready.set(true);
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent) {
    if (!this.open()) return;
    // El panel vive fuera del host (portalizado): hay que preguntar por los dos,
    // o cualquier clic en el contenido proyectado cerraría el popover.
    if (!containsTarget(event.target as Node, this.el.nativeElement, this.panelEl())) {
      this.close();
    }
  }

  @HostListener('window:resize')
  protected onViewportChange() {
    if (this.open()) this.updatePosition();
  }

  @HostListener('document:keydown.escape')
  protected onEscape() {
    if (this.open()) this.close();
  }
}

/** Clampea respetando el mínimo cuando el rango es inválido (panel gigante). */
function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
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
