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

/**
 * ¿`target` está dentro de alguno de estos elementos?
 *
 * Al portalizar el panel deja de ser descendiente del host, así que el
 * `host.contains(event.target)` que usaban los detectores de click-afuera
 * empezaba a dar `false` para clicks DENTRO del propio panel — y el panel se
 * cerraba al usarlo. Hay que preguntar por los dos nodos.
 */
export function containsTarget(target: Node | null, ...roots: (HTMLElement | null)[]): boolean {
  if (!target) return false;
  return roots.some((root) => !!root && root.contains(target));
}
