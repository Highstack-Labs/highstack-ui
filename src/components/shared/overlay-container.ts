/**
 * Contenedor a nivel de <body> donde viven todos los paneles flotantes.
 *
 * El motivo de existir es un detalle de CSS que rompe cualquier overlay
 * renderizado en su sitio: `position: fixed` NO se resuelve contra el viewport
 * si algún ancestro tiene `transform`, `filter`, `backdrop-filter`, `will-change`
 * o `contain` — ese ancestro pasa a ser el bloque contenedor. El modal anima con
 * `scale-*` y el drawer con `translate-*`, así que un datepicker abierto dentro
 * de uno de ellos quedaba mal posicionado Y recortado por el `overflow-y-auto`
 * del cuerpo del panel.
 *
 * Sacando el panel a un contenedor que es último hijo de <body> el problema
 * desaparece de raíz, y además deja de depender de que el consumidor no ponga un
 * `transform` en sus propios wrappers.
 */

/** Atributo que identifica al contenedor. Uno solo por documento. */
const ROOT_ATTR = 'data-ui-overlay-root';

/**
 * Devuelve el contenedor de overlays, creándolo la primera vez.
 *
 * `pointer-events: none` en el contenedor es imprescindible: ocupa toda la
 * pantalla, y sin eso taparía la app entera. Cada panel reactiva los eventos en
 * sí mismo con `pointer-events-auto`.
 */
export function overlayContainer(doc: Document): HTMLElement {
  const existing = doc.querySelector<HTMLElement>(`[${ROOT_ATTR}]`);
  if (existing) return existing;

  const root = doc.createElement('div');
  root.setAttribute(ROOT_ATTR, '');
  root.style.position = 'fixed';
  root.style.top = '0';
  root.style.left = '0';
  root.style.width = '0';
  root.style.height = '0';
  root.style.pointerEvents = 'none';
  // El fallback numérico cubre el caso de un consumidor que importe los
  // componentes sin la hoja de tokens.
  root.style.zIndex = 'var(--z-overlay, 1100)';
  doc.body.appendChild(root);
  return root;
}

/** Dónde se declaró un panel antes de portalizarlo. La pone el uiOverlayPortal. */
const ORIGIN = Symbol('ui-portal-origin');

interface PortaledNode extends Node {
  [ORIGIN]?: HTMLElement | null;
}

/**
 * Recuerda el elemento que contenía al panel antes de moverlo, para que
 * `containsTarget` pueda reconstruir el anidamiento original.
 */
export function setPortalOrigin(panel: HTMLElement, origin: HTMLElement | null): void {
  (panel as PortaledNode)[ORIGIN] = origin;
}

/**
 * ¿`target` está dentro de alguno de estos elementos, contando el anidamiento
 * lógico de los paneles portalizados?
 *
 * Al portalizar, un panel deja de ser descendiente del host, así que el
 * `host.contains(event.target)` que usaban los detectores de click-afuera daba
 * `false` para clics DENTRO del propio panel — y se cerraba al usarlo. Pasar el
 * panel como segunda raíz resuelve ese caso, pero no el de overlays anidados:
 * un select dentro de un popover manda su listbox al contenedor, fuera del
 * panel del popover, así que elegir una opción se leía como un clic afuera y
 * cerraba el popover.
 *
 * Por eso no se usa `contains` sino un ascenso manual que, al llegar a un panel
 * portalizado, salta a donde estaba declarado y sigue subiendo desde ahí.
 */
export function containsTarget(target: Node | null, ...roots: (HTMLElement | null)[]): boolean {
  let node: PortaledNode | null = target;
  while (node) {
    if (roots.some((root) => root === node)) return true;
    node = node[ORIGIN] ?? node.parentNode;
  }
  return false;
}
