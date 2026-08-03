import { DOCUMENT, Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { overlayContainer } from './overlay-container';

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
    overlayContainer(this.doc).appendChild(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    // El @if que declaró el panel ya no puede quitarlo: su ancla está en otro
    // sitio del DOM. Hay que retirarlo a mano o el nodo queda huérfano dentro
    // del contenedor.
    this.el.nativeElement.remove();
  }
}
