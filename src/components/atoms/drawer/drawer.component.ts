import { DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';

export type DrawerSide = 'right' | 'left' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Panel lateral deslizante (sheet). Entra desde cualquier borde con overlay,
 * bloqueo de scroll y accesibilidad básica (`role="dialog"`, `aria-modal`).
 *
 * Es composicional como el modal: opcionalmente proyectas `ui-drawer-header`,
 * `ui-drawer-title`, `ui-drawer-description`, `ui-drawer-content` y
 * `ui-drawer-footer`.
 *
 * @example
 * ```html
 * <ui-button (click)="open.set(true)">Abrir panel</ui-button>
 *
 * <ui-drawer [(open)]="open" side="right">
 *   <ui-drawer-header>
 *     <ui-drawer-title>Filtros</ui-drawer-title>
 *     <ui-drawer-description>Ajusta los resultados.</ui-drawer-description>
 *   </ui-drawer-header>
 *   <ui-drawer-content>…</ui-drawer-content>
 *   <ui-drawer-footer>
 *     <ui-button variant="ghost" (click)="open.set(false)">Cancelar</ui-button>
 *     <ui-button (click)="open.set(false)">Aplicar</ui-button>
 *   </ui-drawer-footer>
 * </ui-drawer>
 * ```
 *
 * ```ts
 * open = signal(false);
 * ```
 */
@Component({
  selector: 'ui-drawer',
  templateUrl: './drawer.component.html',
})
export class DrawerComponent {
  /** Estado abierto/cerrado. Two-way: `[(open)]="miSignal"`. */
  readonly open = model(false);

  /** Borde desde el que entra el panel. */
  readonly side = input<DrawerSide>('right');

  /** Tamaño del panel (ancho en left/right, alto en top/bottom). */
  readonly size = input<DrawerSize>('md');

  /** Cerrar al hacer clic en el fondo (backdrop). */
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });

  /** Cerrar al pulsar la tecla Escape. */
  readonly closeOnEscape = input(true, { transform: booleanAttribute });

  /** Mostrar el botón (X) de cerrar. */
  readonly showClose = input(true, { transform: booleanAttribute });

  /** Etiqueta accesible (usa el título si lo omites). */
  readonly ariaLabel = input<string>();

  readonly opened = output<void>();
  readonly closed = output<void>();

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly document = inject(DOCUMENT);

  protected readonly visible = signal(false);
  protected readonly shown = signal(false);

  private previousActive: HTMLElement | null = null;

  /** ¿El panel entra horizontalmente (left/right) o verticalmente (top/bottom)? */
  private readonly horizontal = computed(() => this.side() === 'left' || this.side() === 'right');

  protected readonly panelClasses = computed(() => {
    const side = this.side();
    const base =
      'relative flex flex-col gap-6 py-6 border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xl transition-transform duration-300 ease-out';

    // Posición / borde / redondeo del lado interno.
    const sideMap: Record<DrawerSide, string> = {
      right: 'ml-auto h-full border-l rounded-l-[var(--radius)]',
      left: 'mr-auto h-full border-r rounded-r-[var(--radius)]',
      top: 'mb-auto w-full border-b rounded-b-[var(--radius)]',
      bottom: 'mt-auto w-full border-t rounded-t-[var(--radius)]',
    };

    // Tamaño según orientación.
    const widthMap: Record<DrawerSize, string> = {
      sm: 'w-full max-w-sm',
      md: 'w-full max-w-md',
      lg: 'w-full max-w-lg',
      xl: 'w-full max-w-2xl',
      full: 'w-full',
    };
    const heightMap: Record<DrawerSize, string> = {
      sm: 'h-[30vh]',
      md: 'h-[45vh]',
      lg: 'h-[60vh]',
      xl: 'h-[80vh]',
      full: 'h-full',
    };
    const sizeClass = this.horizontal() ? widthMap[this.size()] : heightMap[this.size()];

    // Transform de entrada/salida según el borde.
    const closedMap: Record<DrawerSide, string> = {
      right: 'translate-x-full',
      left: '-translate-x-full',
      top: '-translate-y-full',
      bottom: 'translate-y-full',
    };
    const anim = this.shown() ? 'translate-x-0 translate-y-0' : closedMap[side];

    return [base, sideMap[side], sizeClass, anim].join(' ');
  });

  constructor() {
    effect(() => {
      if (this.open()) this.onOpen();
      else this.onClose();
    });
  }

  close() {
    this.open.set(false);
  }

  protected onBackdropClick() {
    if (this.closeOnBackdrop()) this.close();
  }

  @HostListener('document:keydown.escape')
  protected onEscape() {
    if (this.visible() && this.closeOnEscape()) this.close();
  }

  private onOpen() {
    if (this.visible()) return;
    this.previousActive = this.document.activeElement as HTMLElement | null;
    this.visible.set(true);
    this.lockScroll(true);

    requestAnimationFrame(() => {
      this.shown.set(true);
      const dialog = this.el.nativeElement.querySelector('[role="dialog"]') as HTMLElement | null;
      dialog?.focus();
      this.opened.emit();
    });
  }

  private onClose() {
    if (!this.visible()) return;
    this.shown.set(false);
    this.lockScroll(false);
    this.closed.emit();
    this.previousActive?.focus?.();

    // Debe coincidir con duration-300.
    setTimeout(() => this.visible.set(false), 300);
  }

  private lockScroll(lock: boolean) {
    this.document.body.style.overflow = lock ? 'hidden' : '';
  }
}

/** Cabecera del drawer: columna con título + descripción. */
@Component({
  selector: 'ui-drawer-header',
  template: `<ng-content />`,
  host: { class: 'flex flex-col gap-1.5 px-6 pr-12' },
})
export class DrawerHeaderComponent {}

/** Título del drawer. */
@Component({
  selector: 'ui-drawer-title',
  template: `<ng-content />`,
  host: { class: 'block text-lg font-semibold tracking-tight text-[var(--color-foreground)]' },
})
export class DrawerTitleComponent {}

/** Descripción / subtítulo del drawer. */
@Component({
  selector: 'ui-drawer-description',
  template: `<ng-content />`,
  host: { class: 'block text-sm text-[var(--color-muted-foreground)]' },
})
export class DrawerDescriptionComponent {}

/** Cuerpo del drawer. Crece y hace scroll si el contenido es largo. */
@Component({
  selector: 'ui-drawer-content',
  template: `<ng-content />`,
  host: { class: 'flex-1 min-h-0 px-6 text-sm text-[var(--color-foreground)] overflow-y-auto' },
})
export class DrawerContentComponent {}

/** Pie del drawer: fila de acciones. */
@Component({
  selector: 'ui-drawer-footer',
  template: `<ng-content />`,
  host: { class: 'flex items-center justify-end gap-3 px-6' },
})
export class DrawerFooterComponent {}
