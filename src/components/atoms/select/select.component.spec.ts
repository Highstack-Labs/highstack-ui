import { TestBed } from '@angular/core/testing';
import { SelectComponent } from './select.component';

describe('SelectComponent', () => {
  it('no renderiza un párrafo de error vacío cuando invalid+touched sin mensaje', () => {
    const fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('invalid', true);
    fixture.componentRef.setInput('touched', true);
    fixture.componentRef.setInput('hint', 'Elige una opción');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const paragraphs = Array.from(host.querySelectorAll('p'));
    expect(paragraphs.length).toBe(1);
    expect(paragraphs[0].textContent?.trim()).toBe('Elige una opción');
    expect(host.querySelector('[data-trigger]')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('aria-describedby apunta al párrafo que sí existe', () => {
    const fixture = TestBed.createComponent(SelectComponent);
    fixture.componentRef.setInput('error', 'Campo obligatorio');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const describedBy = host.querySelector('[data-trigger]')!.getAttribute('aria-describedby')!;
    expect(host.querySelector(`#${describedBy}`)?.textContent?.trim()).toBe('Campo obligatorio');
  });
});
