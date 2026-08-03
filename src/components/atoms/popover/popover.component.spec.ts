import { TestBed } from '@angular/core/testing';
import { PopoverComponent } from './popover.component';

/** Construye un DOMRect a partir de left/top/width/height. */
function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('PopoverComponent placement', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PopoverComponent] });
  });

  afterEach(() => {
    document.querySelector('[data-ui-overlay-root]')?.remove();
  });

  function openWith(side: 'top' | 'bottom' | 'left' | 'right', align: 'start' | 'center' | 'end') {
    const fixture = TestBed.createComponent(PopoverComponent);
    fixture.componentRef.setInput('side', side);
    fixture.componentRef.setInput('align', align);
    const cmp = fixture.componentInstance as any;
    cmp.resolvedSide.set(side);
    cmp.resolvedAlign.set(align);
    cmp.open.set(true);
    fixture.detectChanges();
    // El panel está portalizado: se busca en el documento, no en el host.
    const panel = document.querySelector('[role="dialog"]') as HTMLElement;
    return { fixture, cmp, panel };
  }

  /** Mockea las medidas de host y panel; jsdom no hace layout. */
  function measure(
    fixture: { nativeElement: HTMLElement },
    panel: HTMLElement,
    host: DOMRect,
    panelRect: DOMRect,
  ) {
    vi.spyOn(fixture.nativeElement, 'getBoundingClientRect').mockReturnValue(host);
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue(panelRect);
  }

  it('monta el panel en el contenedor de overlays, fuera del host', () => {
    const { fixture, panel } = openWith('bottom', 'center');
    const root = document.querySelector('[data-ui-overlay-root]');
    expect(panel.parentElement).toBe(root);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('voltea align a "end" cuando el panel se saldría por la derecha', () => {
    const { fixture, cmp, panel } = openWith('bottom', 'start');
    // viewport 1024 de ancho (jsdom); trigger pegado a la derecha.
    measure(fixture, panel, rect(900, 100, 80, 30), rect(900, 132, 288, 120));

    cmp.updatePosition();

    expect(cmp.resolvedSide()).toBe('bottom');
    expect(cmp.resolvedAlign()).toBe('end'); // se ancla a la derecha del trigger
  });

  it('voltea side a "top" cuando no cabe abajo pero sí arriba', () => {
    const { fixture, cmp, panel } = openWith('bottom', 'center');
    // trigger cerca del borde inferior (vh=768 en jsdom).
    measure(fixture, panel, rect(400, 720, 80, 30), rect(400, 752, 288, 200));

    cmp.updatePosition();

    expect(cmp.resolvedSide()).toBe('top');
    // 720 - 200 - GAP(8)
    expect(cmp.panelTop()).toBe(512);
  });

  it('mantiene el lado pedido cuando sí cabe', () => {
    const { fixture, cmp, panel } = openWith('bottom', 'center');
    measure(fixture, panel, rect(400, 100, 80, 30), rect(328, 132, 288, 120));

    cmp.updatePosition();

    expect(cmp.resolvedSide()).toBe('bottom');
    expect(cmp.resolvedAlign()).toBe('center');
  });

  it('traduce side/align a coordenadas fixed', () => {
    const { fixture, cmp, panel } = openWith('bottom', 'center');
    // host de 80 de ancho en x=400; panel de 288 → centrado en 400+40-144 = 296.
    measure(fixture, panel, rect(400, 100, 80, 30), rect(0, 0, 288, 120));

    cmp.updatePosition();

    expect(cmp.panelLeft()).toBe(296);
    expect(cmp.panelTop()).toBe(138); // 100 + 30 + GAP(8)
    expect(cmp.ready()).toBe(true);
  });

  it('con side="right" el eje transversal pasa a ser el vertical', () => {
    const { fixture, cmp, panel } = openWith('right', 'start');
    measure(fixture, panel, rect(100, 300, 80, 30), rect(0, 0, 288, 120));

    cmp.updatePosition();

    expect(cmp.resolvedSide()).toBe('right');
    expect(cmp.panelLeft()).toBe(188); // 100 + 80 + GAP(8)
    expect(cmp.panelTop()).toBe(300); // align start = borde superior del host
  });

  it('fija el panel a los bordes del viewport si aún se sale', () => {
    const { fixture, cmp, panel } = openWith('bottom', 'start');
    // Trigger fuera por la izquierda: el panel no puede quedar en negativo.
    measure(fixture, panel, rect(-200, 100, 80, 30), rect(0, 0, 288, 120));

    cmp.updatePosition();

    expect(cmp.panelLeft()).toBe(8); // MARGIN
  });

  it('un clic dentro del panel portalizado no lo cierra', () => {
    // Regresión: al salir el panel del host, el detector de clic-afuera lo
    // consideraba "afuera" y el popover se cerraba al usar su contenido.
    const { fixture, cmp, panel } = openWith('bottom', 'center');

    panel.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(cmp.open()).toBe(true);
  });

  it('un clic fuera lo cierra', () => {
    const { fixture, cmp } = openWith('bottom', 'center');

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(cmp.open()).toBe(false);
  });
});
