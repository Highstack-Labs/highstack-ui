import { TestBed } from '@angular/core/testing';
import { CheckboxComponent } from './checkbox.component';

describe('CheckboxComponent', () => {
  it('no renderiza un párrafo de error vacío cuando invalid+touched sin mensaje', () => {
    const fixture = TestBed.createComponent(CheckboxComponent);
    fixture.componentRef.setInput('invalid', true);
    fixture.componentRef.setInput('touched', true);
    fixture.componentRef.setInput('hint', 'Puedes cambiarlo después');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const paragraphs = Array.from(host.querySelectorAll('p'));
    expect(paragraphs.length).toBe(1);
    expect(paragraphs[0].textContent?.trim()).toBe('Puedes cambiarlo después');
    // El borde en rojo y el aria-invalid se mantienen aunque no haya texto.
    expect(host.querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('el input `error` tiene prioridad y no necesita touched', () => {
    const fixture = TestBed.createComponent(CheckboxComponent);
    fixture.componentRef.setInput('error', 'Debes aceptar los términos');
    fixture.componentRef.setInput('errors', [{ message: 'otro' }]);
    fixture.componentRef.setInput('touched', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const describedBy = host.querySelector('input')!.getAttribute('aria-describedby')!;
    expect(host.querySelector(`#${describedBy}`)?.textContent?.trim()).toBe(
      'Debes aceptar los términos',
    );
  });

  it('`description` (en línea) y `hint` (abajo) conviven', () => {
    const fixture = TestBed.createComponent(CheckboxComponent);
    fixture.componentRef.setInput('label', 'Recibir correos');
    fixture.componentRef.setInput('description', 'Máximo uno por semana');
    fixture.componentRef.setInput('hint', 'Puedes darte de baja cuando quieras');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('label')?.textContent).toContain('Máximo uno por semana');
    expect(host.querySelector('p')?.textContent?.trim()).toBe(
      'Puedes darte de baja cuando quieras',
    );
  });
});
