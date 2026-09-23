import { containsTarget, overlayContainer } from './overlay-container';

describe('overlayContainer', () => {
  afterEach(() => {
    document.querySelector('[data-ui-overlay-root]')?.remove();
  });

  it('crea el contenedor como último hijo del body', () => {
    const root = overlayContainer(document);
    expect(root.getAttribute('data-ui-overlay-root')).toBe('');
    expect(document.body.lastElementChild).toBe(root);
  });

  it('reutiliza el mismo contenedor en llamadas sucesivas', () => {
    const first = overlayContainer(document);
    const second = overlayContainer(document);
    expect(second).toBe(first);
    expect(document.querySelectorAll('[data-ui-overlay-root]').length).toBe(1);
  });

  it('no captura eventos de puntero: el contenedor cubre la pantalla', () => {
    const root = overlayContainer(document);
    expect(root.style.position).toBe('fixed');
    expect(root.style.pointerEvents).toBe('none');
  });
});

describe('containsTarget', () => {
  it('encuentra el target en cualquiera de los roots', () => {
    const host = document.createElement('div');
    const panel = document.createElement('div');
    const inPanel = document.createElement('button');
    panel.appendChild(inPanel);

    expect(containsTarget(inPanel, host, panel)).toBe(true);
    expect(containsTarget(inPanel, host)).toBe(false);
  });

  it('cuenta el propio root como contenido (contains se incluye a sí mismo)', () => {
    const host = document.createElement('div');
    expect(containsTarget(host, host)).toBe(true);
  });

  it('devuelve false con target nulo o roots nulos', () => {
    expect(containsTarget(null, document.createElement('div'))).toBe(false);
    expect(containsTarget(document.createElement('div'), null)).toBe(false);
  });
});
