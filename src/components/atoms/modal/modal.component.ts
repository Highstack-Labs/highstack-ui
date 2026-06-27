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

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Ventana modal (diálogo) con overlay, animación de entrada/salida, bloqueo de
 * scroll del body y accesibilidad básica (`role="dialog"`, `aria-modal`).
 *
 * Es composicional como `ui-card`: opcionalmente proyectas `ui-modal-header`,
 * `ui-modal-title`, `ui-modal-description`, `ui-modal-content` y
 * `ui-modal-footer`. También puedes meter cualquier contenido libre.
 *
 * @example Uso mínimo (con two-way binding)
 * ```html
 * <ui-button (click)="open.set(true)">Abrir</ui-button>
 *
 * <ui-modal [(open)]="open">
 *   <ui-modal-header>
 *     <ui-modal-title>¿Eliminar proyecto?</ui-modal-title>
 *     <ui-modal-description>Esta acción no se puede deshacer.</ui-modal-description>
 *   </ui-modal-header>
 *
 *   <ui-modal-content>
 *     Se borrarán todos los archivos asociados de forma permanente.
 *   </ui-modal-content>
 *
 *   <ui-modal-footer>
 *     <ui-button variant="ghost" (click)="open.set(false)">Cancelar</ui-button>
 *     <ui-button variant="destructive" (click)="confirmar()">Eliminar</ui-button>
 *   </ui-modal-footer>
 * </ui-modal>
 * ```
 *
 * ```ts
 * // En el componente:
 * open = signal(false);
 * ```
 */
@Component({
  selector: 'ui-modal',
  templateUrl: './modal.component.html',
})
export class ModalComponent {
  /** Estado abierto/cerrado. Two-way: `[(open)]="miSignal"`. */
  readonly open = model(false);

  /** Tamaño máximo del panel. */
  readonly size = input<ModalSize>('md');

  /** Cerrar al hacer clic en el fondo (backdrop). */
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });

  /** Cerrar al pulsar la tecla Escape. */
  readonly closeOnEscape = input(true, { transform: booleanAttribute });

  /** Mostrar el botón (X) de cerrar en la esquina superior derecha. */
  readonly showClose = input(true, { transform: booleanAttribute });

  /** Etiqueta accesible del diálogo (usa el título si lo omites). */
  readonly ariaLabel = input<string>();

  /** Se emite cuando el modal termina de abrirse. */
  readonly opened = output<void>();

  /** Se emite cuando el modal se cierra (por cualquier vía). */
  readonly closed = output<void>();

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly document = inject(DOCUMENT);

  /** Presencia en el DOM (se mantiene durante la animación de salida). */
  protected readonly visible = signal(false);
  /** Estado de la transición (false = invisible, true = visible). */
  protected readonly shown = signal(false);

  /** Elemento que tenía el foco antes de abrir, para restaurarlo al cerrar. */
  private previousActive: HTMLElement | null = null;

  protected readonly panelClasses = computed(() => {
    const base =
      'relative w-full flex flex-col gap-6 py-6 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xl transition-all duration-200';
    const sizeMap: Record<ModalSize, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-2xl',
      full: 'max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]',
    };
    const anim = this.shown() ? 'opacity-100 scale-100' : 'opacity-0 scale-95';
    return [base, sizeMap[this.size()], anim].join(' ');
  });

  constructor() {
    // Reacciona a cambios de `open` (vía binding o programáticos) y orquesta
    // la animación + el bloqueo de scroll del body.
    effect(() => {
      if (this.open()) {
        this.onOpen();
      } else {
        this.onClose();
      }
    });
  }

  /** Cierra el modal. Disponible para usar desde la plantilla del host. */
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

    // Espera un frame para que el panel monte invisible y luego transicione.
    requestAnimationFrame(() => {
      this.shown.set(true);
      // Enfoca el panel para capturar el teclado dentro del diálogo.
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

    // Quita del DOM cuando termina la transición (debe coincidir con duration-200).
    setTimeout(() => this.visible.set(false), 200);
  }

  private lockScroll(lock: boolean) {
    this.document.body.style.overflow = lock ? 'hidden' : '';
  }
}

/** Cabecera del modal: columna con título + descripción. */
@Component({
  selector: 'ui-modal-header',
  template: `<ng-content />`,
  host: { class: 'flex flex-col gap-1.5 px-6 pr-12' },
})
export class ModalHeaderComponent {}

/** Título del modal. */
@Component({
  selector: 'ui-modal-title',
  template: `<ng-content />`,
  host: {
    class: 'block text-lg font-semibold tracking-tight text-[var(--color-foreground)]',
  },
})
export class ModalTitleComponent {}

/** Descripción / subtítulo del modal. */
@Component({
  selector: 'ui-modal-description',
  template: `<ng-content />`,
  host: { class: 'block text-sm text-[var(--color-muted-foreground)]' },
})
export class ModalDescriptionComponent {}

/**
 * Cuerpo del modal. Hace scroll si el contenido es largo. Usa `flex-1` para
 * ocupar el espacio disponible cuando el panel tiene altura fija (`size="full"`),
 * de modo que el footer queda anclado abajo.
 */
@Component({
  selector: 'ui-modal-content',
  template: `<ng-content />`,
  host: { class: 'flex-1 min-h-0 px-6 text-sm text-[var(--color-foreground)] overflow-y-auto' },
})
export class ModalContentComponent {}

/** Pie del modal: fila alineada a la derecha para los botones de acción. */
@Component({
  selector: 'ui-modal-footer',
  template: `<ng-content />`,
  host: { class: 'flex items-center justify-end gap-3 px-6' },
})
export class ModalFooterComponent {}
