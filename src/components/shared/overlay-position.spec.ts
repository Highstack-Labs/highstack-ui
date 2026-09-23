import { positionOverlay, type Rect } from './overlay-position';

/** jsdom no hace layout, así que los rects se fabrican a mano. */
function rect(left: number, top: number, width: number, height: number): Rect {
  return { left, top, width, height };
}

const VIEWPORT = { width: 1000, height: 800 };

describe('positionOverlay', () => {
  it('coloca el panel debajo del trigger cuando hay espacio', () => {
    const p = positionOverlay(rect(100, 100, 200, 36), { width: 280, height: 300 }, VIEWPORT);
    expect(p.flipped).toBe(false);
    expect(p.top).toBe(142); // 100 + 36 + GAP(6)
    expect(p.left).toBe(100);
  });

  it('voltea hacia arriba cuando no cabe abajo pero sí arriba', () => {
    // Trigger cerca del fondo: 700 + 36 + 6 + 300 = 1042 > 800.
    const p = positionOverlay(rect(100, 700, 200, 36), { width: 280, height: 300 }, VIEWPORT);
    expect(p.flipped).toBe(true);
    expect(p.top).toBe(394); // 700 - 6 - 300
  });

  it('se queda abajo si tampoco cabe arriba', () => {
    // Panel más alto que cualquiera de los dos huecos: gana el de abajo.
    const p = positionOverlay(rect(100, 400, 200, 36), { width: 280, height: 700 }, VIEWPORT);
    expect(p.flipped).toBe(false);
  });

  it('alinea a la derecha cuando se pide align=end', () => {
    const p = positionOverlay(
      rect(100, 100, 200, 36),
      { width: 280, height: 300 },
      VIEWPORT,
      'end',
    );
    expect(p.left).toBe(20); // 100 + 200 - 280
  });

  it('nunca deja el panel salirse por la derecha', () => {
    const p = positionOverlay(rect(900, 100, 200, 36), { width: 280, height: 300 }, VIEWPORT);
    expect(p.left).toBe(712); // 1000 - 280 - MARGIN(8)
  });

  it('nunca deja el panel salirse por la izquierda', () => {
    const p = positionOverlay(rect(-50, 100, 200, 36), { width: 280, height: 300 }, VIEWPORT);
    expect(p.left).toBe(8); // MARGIN
  });

  it('clampea el top cuando el panel es más alto que el viewport', () => {
    const p = positionOverlay(rect(100, 100, 200, 36), { width: 280, height: 900 }, VIEWPORT);
    expect(p.top).toBe(8); // MARGIN
  });
});
