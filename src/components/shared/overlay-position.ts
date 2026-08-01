/**
 * Cálculo puro de la posición de un panel flotante respecto a su trigger.
 *
 * Devuelve coordenadas para `position: fixed`, o sea relativas al viewport, que
 * es lo que permite al panel escapar de contenedores con `overflow`.
 *
 * Está separado del componente a propósito: esta misma lógica está hoy copiada
 * en select, dropdown, popover y tooltip. Aquí es una función pura y se puede
 * probar sin DOM (jsdom no hace layout).
 */

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface OverlayPlacement {
  top: number;
  left: number;
  /** true si terminó arriba del trigger en lugar de abajo. */
  flipped: boolean;
}

/** Separación mínima contra el borde del viewport. */
const MARGIN = 8;
/** Separación entre el trigger y el panel. */
const GAP = 6;

export function positionOverlay(
  trigger: Rect,
  panel: { width: number; height: number },
  viewport: Viewport,
  align: 'start' | 'end' = 'start',
): OverlayPlacement {
  const spaceBelow = viewport.height - (trigger.top + trigger.height);
  const spaceAbove = trigger.top;
  const needed = panel.height + GAP;

  // Solo voltea si abajo no cabe Y arriba sí cabe entero: si no cabe en ningún
  // lado, quedarse abajo es menos desconcertante que saltar hacia arriba.
  const flipped = spaceBelow < needed && spaceAbove >= needed;

  const rawTop = flipped ? trigger.top - GAP - panel.height : trigger.top + trigger.height + GAP;
  const rawLeft = align === 'end' ? trigger.left + trigger.width - panel.width : trigger.left;

  return {
    top: clamp(rawTop, MARGIN, viewport.height - panel.height - MARGIN),
    left: clamp(rawLeft, MARGIN, viewport.width - panel.width - MARGIN),
    flipped,
  };
}

/** Clampea respetando el mínimo cuando el rango es inválido (panel gigante). */
function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}
