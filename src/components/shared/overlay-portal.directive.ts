import { DOCUMENT, Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { overlayContainer, setPortalOrigin } from './overlay-container';

/**
 * Mueve el elemento al que se aplica al contenedor de overlays (último hijo de
 * <body>), sacándolo del subárbol donde lo declaró su componente.
 *
 * Angular sigue actualizando los bindings y despachando los eventos del nodo
 * aunque cambie de padre: la vista mantiene la referencia al elemento, no a su
 * posición en el DOM.
 *
 * Hay DOS cosas que sí se rompen al portalizar, y que cada componente tiene que
 * resolver de su lado:
 *
 *  1. `host.contains(event.target)` deja de ser cierto para lo que pasa dentro
 *     del panel → usar `containsTarget(target, host, panel)` de
 *     `./overlay-container`.
 *  2. Un `@HostListener('keydown')` en el host ya no recibe las teclas pulsadas
 *     con el foco dentro del panel → el handler tiene que colgarse del propio
 *     elemento del panel en la plantilla.
 *
 * @example
 * ```html
 * @if (open()) {
 *   <div uiOverlayPortal role="listbox" class="fixed pointer-events-auto …">…</div>
 * }
 * ```
 */
@Directive({ selector: '[uiOverlayPortal]' })
export class OverlayPortalDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly doc = inject(DOCUMENT);

  /**
   * El traslado va en `ngOnInit`, no en el constructor: los constructores de las
   * directivas de una vista embebida (la de un `@if`) corren ANTES de que
   * Angular inserte esa vista en el DOM, así que mover el nodo ahí no sirve de
   * nada — la inserción posterior lo devuelve a su sitio original.
   */
  ngOnInit(): void {
    // Antes de mover el nodo hay que anotar dónde estaba: es lo único que queda
    // del anidamiento original, y `containsTarget` lo necesita para que un
    // overlay siga reconociendo como «dentro» los paneles que se abren desde su
    // contenido (un select dentro de un popover, p. ej.).
    setPortalOrigin(this.el.nativeElement, this.el.nativeElement.parentElement);
    this.bringToFront();
  }

  /**
   * Mueve el panel al final del contenedor de overlays.
   *
   * Dentro del contenedor no hay z-index por panel: el apilado lo resuelve el
   * orden del DOM, así que el último insertado gana. Los paneles declarados bajo
   * `@if (open())` se insertan al abrirse y eso basta, pero el del select vive
   * siempre en el DOM (necesita sus `<ui-option>` montadas para resolver la
   * etiqueta seleccionada aunque esté cerrado), así que se insertó al arrancar el
   * componente y quedaba por debajo de cualquier overlay abierto después — por
   * ejemplo el popover que lo contiene. Llamar aquí al abrir lo devuelve arriba.
   */
  bringToFront(): void {
    overlayContainer(this.doc).appendChild(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    // El @if que declaró el panel ya no puede quitarlo: su ancla está en otro
    // sitio del DOM. Hay que retirarlo a mano o el nodo queda huérfano dentro
    // del contenedor.
    this.el.nativeElement.remove();
    // No retener el nodo donde se declaró, que ya no existe.
    setPortalOrigin(this.el.nativeElement, null);
  }
}
