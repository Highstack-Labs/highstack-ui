import {
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

export type DropdownSide = 'bottom' | 'top';
export type DropdownAlign = 'start' | 'end';

/** Margen mínimo al borde del viewport (px). */
const MARGIN = 8;

/**
 * Menú desplegable compositional, sin dependencias. Maneja abrir/cerrar,
 * posición (con auto-flip al viewport), click-afuera y navegación por teclado.
 */
@Component({
  selector: 'ui-dropdown',
  templateUrl: './dropdown.component.html',
  host: { class: 'relative inline-block' },
})
export class DropdownComponent {
  readonly side = input<DropdownSide>('bottom');
  readonly align = input<DropdownAlign>('start');

  readonly open = signal(false);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private readonly items = contentChildren(DropdownItemComponent);

  /** Coordenadas fixed del panel (px, relativas al viewport). */
  protected readonly panelTop = signal(0);
  protected readonly panelLeft = signal(0);
  /** Oculta el panel un frame hasta posicionarlo, para que el flip no se vea saltar. */
  protected readonly ready = signal(false);

  constructor() {
    // Capture=true reposiciona también cuando el scroll ocurre en un contenedor
    // interno (no solo la ventana), ya que el panel es `fixed`.
    const onScroll = () => {
      if (this.open()) this.updatePosition();
    };
    window.addEventListener('scroll', onScroll, true);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('scroll', onScroll, true));
  }

  protected readonly panelClasses = computed(() => {
    const base =
      'fixed z-50 min-w-48 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-1 shadow-md text-[var(--color-foreground)] outline-none transition-opacity duration-100';
    const visibility = this.ready() ? 'opacity-100' : 'opacity-0 pointer-events-none';
    return [base, visibility].join(' ');
  });

  toggle() {
    if (this.open()) this.close();
    else this.openDropdown();
  }

  private openDropdown() {
    this.ready.set(false);
    this.open.set(true);
    // `afterNextRender` corre una vez que el panel del @if ya está en el DOM,
    // sin depender del timing del ciclo de detección de cambios (a diferencia de
    // un requestAnimationFrame suelto, que podía dispararse antes de montarlo y
    // dejar el panel invisible hasta un resize). Se posiciona y se enfoca el
    // panel (no un ítem: al abrir nada debe verse resaltado/seleccionado).
    afterNextRender(
      () => {
        this.updatePosition();
        this.panel()?.focus();
      },
      { injector: this.injector },
    );
  }

  close() {
    this.open.set(false);
    this.ready.set(false);
  }

  private panel(): HTMLElement | null {
    return this.el.nativeElement.querySelector('[role="menu"]');
  }

  /**
   * Posiciona el panel `fixed` a partir del rect del trigger, volteando de lado
   * (arriba/abajo) y realineando (izq/der) para que quepa en el viewport, y
   * finalmente lo fija a los bordes de la pantalla si aún se sale.
   */
  private updatePosition() {
    const panel = this.panel();
    if (!panel || !this.open()) return;

    const host = this.el.nativeElement.getBoundingClientRect();
    const rect = panel.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const GAP = 6;

    // Eje vertical: abajo por defecto; voltear arriba si no cabe y hay más sitio.
    let side = this.side();
    const spaceBelow = vh - host.bottom;
    const spaceAbove = host.top;
    if (side === 'bottom' && spaceBelow < rect.height + GAP + MARGIN && spaceAbove >= spaceBelow) {
      side = 'top';
    } else if (
      side === 'top' &&
      spaceAbove < rect.height + GAP + MARGIN &&
      spaceBelow >= spaceAbove
    ) {
      side = 'bottom';
    }
    let top = side === 'top' ? host.top - rect.height - GAP : host.bottom + GAP;

    // Eje horizontal: start ancla a la izquierda del trigger, end a la derecha.
    let left = this.align() === 'end' ? host.right - rect.width : host.left;

    // Fijar a los bordes del viewport (respeta solo los límites de la pantalla).
    left = Math.max(MARGIN, Math.min(left, vw - rect.width - MARGIN));
    top = Math.max(MARGIN, Math.min(top, vh - rect.height - MARGIN));

    this.panelLeft.set(left);
    this.panelTop.set(top);
    this.ready.set(true);
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent) {
    if (this.open() && !this.el.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('window:resize')
  protected onViewportChange() {
    if (this.open()) this.updatePosition();
  }

  @HostListener('keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent) {
    if (!this.open()) return;
    const enabled = this.items().filter((i) => !i.disabled());
    if (!enabled.length) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const active = document.activeElement;
      const idx = enabled.findIndex((i) => i.isActive(active));
      const next =
        event.key === 'ArrowDown'
          ? (idx + 1) % enabled.length
          : (idx - 1 + enabled.length) % enabled.length;
      enabled[next].focus();
    }
  }
}

/** Marca el elemento disparador del dropdown. */
@Directive({
  selector: '[uiDropdownTrigger]',
  host: {
    '(click)': 'dd.toggle()',
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'dd.open()',
  },
})
export class DropdownTriggerDirective {
  protected readonly dd = inject(DropdownComponent);
}

/** Ítem seleccionable del menú. */
@Component({
  selector: 'ui-dropdown-item',
  template: `
    <span class="shrink-0 flex items-center [&:empty]:hidden"><ng-content select="[slot=icon]" /></span>
    <span class="flex-1 text-left"><ng-content /></span>
    <span class="shrink-0 text-xs text-[var(--color-muted-foreground)] [&:empty]:hidden"><ng-content select="[slot=shortcut]" /></span>
  `,
  host: {
    role: 'menuitem',
    tabindex: '-1',
    '[attr.aria-disabled]': 'disabled() || null',
    '(click)': 'onClick()',
    '[class]': 'hostClasses()',
  },
})
export class DropdownItemComponent {
  readonly destructive = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly select = output<void>();

  private readonly dd = inject(DropdownComponent);
  private readonly el = inject(ElementRef<HTMLElement>);

  protected readonly hostClasses = computed(() => {
    const base =
      'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer select-none outline-none transition-colors';
    const tone = this.destructive()
      ? 'text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 focus:bg-[var(--color-destructive)]/10'
      : 'text-[var(--color-foreground)] hover:bg-[var(--color-accent)] focus:bg-[var(--color-accent)]';
    const disabled = this.disabled() ? 'opacity-50 pointer-events-none' : '';
    return [base, tone, disabled].join(' ');
  });

  focus() {
    this.el.nativeElement.focus();
  }
  isActive(node: Element | null) {
    return node === this.el.nativeElement;
  }

  protected onClick() {
    if (this.disabled()) return;
    this.select.emit();
    this.dd.close();
  }
}

/** Encabezado de sección. */
@Component({
  selector: 'ui-dropdown-label',
  template: `<ng-content />`,
  host: {
    class:
      'block px-2 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]',
  },
})
export class DropdownLabelComponent {}

/** Línea divisoria. */
@Component({
  selector: 'ui-dropdown-separator',
  template: '',
  host: { class: '-mx-1 my-1 block h-px bg-[var(--color-border)]' },
})
export class DropdownSeparatorComponent {}
