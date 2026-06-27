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

  function openWith(side: 'top' | 'bottom' | 'left' | 'right', align: 'start' | 'center' | 'end') {
    const fixture = TestBed.createComponent(PopoverComponent);
    fixture.componentRef.setInput('side', side);
    fixture.componentRef.setInput('align', align);
    const cmp = fixture.componentInstance as any;
    cmp.resolvedSide.set(side);
    cmp.resolvedAlign.set(align);
    cmp.open.set(true);
    fixture.detectChanges();
    return { fixture, cmp };
  }

  it('voltea align a "end" cuando el panel se saldría por la derecha', () => {
    const { fixture, cmp } = openWith('bottom', 'start');
    const hostEl = fixture.nativeElement as HTMLElement;
    const panel = hostEl.querySelector('[role="dialog"]') as HTMLElement;

    // viewport 1024 de ancho (jsdom); trigger pegado a la derecha.
    vi.spyOn(hostEl, 'getBoundingClientRect').mockReturnValue(rect(900, 100, 80, 30));
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue(rect(900, 132, 288, 120));

    cmp.updatePosition();

    expect(cmp.resolvedSide()).toBe('bottom');
    expect(cmp.resolvedAlign()).toBe('end'); // se ancla a la derecha del trigger
  });

  it('voltea side a "top" cuando no cabe abajo pero sí arriba', () => {
    const { fixture, cmp } = openWith('bottom', 'center');
    const hostEl = fixture.nativeElement as HTMLElement;
    const panel = hostEl.querySelector('[role="dialog"]') as HTMLElement;

    // trigger cerca del borde inferior (vh=768 en jsdom).
    vi.spyOn(hostEl, 'getBoundingClientRect').mockReturnValue(rect(400, 720, 80, 30));
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue(rect(400, 752, 288, 200));

    cmp.updatePosition();

    expect(cmp.resolvedSide()).toBe('top');
  });

  it('mantiene el lado pedido cuando sí cabe', () => {
    const { fixture, cmp } = openWith('bottom', 'center');
    const hostEl = fixture.nativeElement as HTMLElement;
    const panel = hostEl.querySelector('[role="dialog"]') as HTMLElement;

    vi.spyOn(hostEl, 'getBoundingClientRect').mockReturnValue(rect(400, 100, 80, 30));
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue(rect(328, 132, 288, 120));

    cmp.updatePosition();

    expect(cmp.resolvedSide()).toBe('bottom');
    expect(cmp.resolvedAlign()).toBe('center');
  });
});
