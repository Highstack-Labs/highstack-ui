import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InputComponent } from './input.component';

/** Host que sí proyecta un prefijo, para contrastar con el caso vacío. */
@Component({
  imports: [InputComponent],
  template: `<ui-input placeholder="con prefijo"><span slot="prefix">@</span></ui-input>`,
})
class HostWithPrefix {}

describe('InputComponent', () => {
  function slots(host: HTMLElement) {
    return Array.from(host.querySelectorAll('span[class*="shrink-0"]')) as HTMLElement[];
  }

  it('deja los slots prefix/suffix vacíos (para que empty:hidden los colapse)', () => {
    const fixture = TestBed.createComponent(InputComponent);
    fixture.detectChanges();

    const found = slots(fixture.nativeElement);
    expect(found.length).toBe(2);
    // Si Angular dejara texto o un nodo ancla aquí, `:empty` no aplicaría y el
    // `gap-2` del wrapper metería 16px de espacio muerto dentro del input.
    for (const span of found) {
      expect(span.matches(':empty')).toBe(true);
    }
  });

  it('mantiene el slot con contenido proyectado', () => {
    const fixture = TestBed.createComponent(HostWithPrefix);
    fixture.detectChanges();

    const [prefix, suffix] = slots(fixture.nativeElement);
    expect(prefix.matches(':empty')).toBe(false);
    expect(prefix.textContent?.trim()).toBe('@');
    expect(suffix.matches(':empty')).toBe(true);
  });

  it('no renderiza un párrafo de error vacío cuando invalid+touched sin mensaje', () => {
    const fixture = TestBed.createComponent(InputComponent);
    fixture.componentRef.setInput('invalid', true);
    fixture.componentRef.setInput('touched', true);
    fixture.componentRef.setInput('hint', 'Texto de ayuda');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const paragraphs = Array.from(host.querySelectorAll('p'));
    expect(paragraphs.length).toBe(1);
    expect(paragraphs[0].textContent?.trim()).toBe('Texto de ayuda');
    // El borde sigue marcándose en rojo aunque no haya texto de error.
    expect(host.querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('aria-describedby apunta al párrafo que sí existe', () => {
    const fixture = TestBed.createComponent(InputComponent);
    fixture.componentRef.setInput('error', 'Campo obligatorio');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector('input')!;
    const describedBy = input.getAttribute('aria-describedby')!;
    expect(host.querySelector(`#${describedBy}`)?.textContent?.trim()).toBe('Campo obligatorio');
  });

  it('deshabilita el toggle de contraseña cuando el input está deshabilitado', () => {
    const fixture = TestBed.createComponent(InputComponent);
    fixture.componentRef.setInput('type', 'password');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
