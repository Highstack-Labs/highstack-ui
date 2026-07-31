import { TestBed } from '@angular/core/testing';
import { SegmentedComponent } from './segmented.component';

const OPTIONS = [
  { value: 'dia', label: 'Día' },
  { value: 'mes', label: 'Mes' },
];

describe('SegmentedComponent', () => {
  function create(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(SegmentedComponent);
    fixture.componentRef.setInput('options', OPTIONS);
    for (const [key, val] of Object.entries(inputs)) fixture.componentRef.setInput(key, val);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra el mensaje de error debajo del track', () => {
    const host = create({ error: 'Selecciona un periodo' });
    const p = host.querySelector('p')!;
    expect(p.textContent?.trim()).toBe('Selecciona un periodo');
    expect(host.querySelector('[role="radiogroup"]')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('muestra los errores de Signal Forms solo tras touched', () => {
    const sinTocar = create({ errors: [{ message: 'Requerido' }] });
    expect(sinTocar.querySelector('p')).toBeNull();

    const tocado = create({ errors: [{ message: 'Requerido' }], touched: true });
    expect(tocado.querySelector('p')?.textContent?.trim()).toBe('Requerido');
  });

  it('aria-describedby apunta al párrafo que sí existe', () => {
    const host = create({ hint: 'Afecta a todo el reporte' });
    const track = host.querySelector('[role="radiogroup"]')!;
    const describedBy = track.getAttribute('aria-describedby')!;
    expect(host.querySelector(`#${describedBy}`)?.textContent?.trim()).toBe(
      'Afecta a todo el reporte',
    );
  });

  it('sin error ni hint no renderiza párrafo ni aria-describedby', () => {
    const host = create({});
    expect(host.querySelector('p')).toBeNull();
    expect(host.querySelector('[role="radiogroup"]')?.getAttribute('aria-describedby')).toBeNull();
  });
});
