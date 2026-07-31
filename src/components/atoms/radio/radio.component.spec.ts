import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RadioComponent, RadioGroupComponent } from './radio.component';

@Component({
  imports: [RadioGroupComponent, RadioComponent],
  template: `
    <ui-radio-group [orientation]="'horizontal'" [error]="error()" [hint]="hint()">
      <ui-radio value="a" label="A" />
      <ui-radio value="b" label="B" />
    </ui-radio-group>
  `,
})
class Host {
  readonly error = signal('');
  readonly hint = signal('');
}

describe('RadioGroupComponent', () => {
  it('muestra el mensaje de error debajo del grupo, no como item del flex', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.error.set('Elige una opción');
    fixture.detectChanges();

    const group = fixture.nativeElement.querySelector('ui-radio-group') as HTMLElement;
    const p = group.querySelector('p')!;
    expect(p.textContent?.trim()).toBe('Elige una opción');
    // El <p> es hermano del contenedor de opciones, no está dentro del flex.
    expect(p.parentElement).toBe(group);
    expect(p.previousElementSibling?.className).toContain('flex-row');
    expect(p.previousElementSibling?.querySelectorAll('ui-radio').length).toBe(2);
  });

  it('cablea aria-invalid y aria-describedby en el host', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.error.set('Elige una opción');
    fixture.detectChanges();

    const group = fixture.nativeElement.querySelector('ui-radio-group') as HTMLElement;
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('aria-invalid')).toBe('true');
    const describedBy = group.getAttribute('aria-describedby')!;
    expect(group.querySelector(`#${describedBy}`)?.textContent?.trim()).toBe('Elige una opción');
  });

  it('cae al hint cuando no hay error, y a nada cuando no hay ninguno', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.hint.set('Solo una opción');
    fixture.detectChanges();

    const group = fixture.nativeElement.querySelector('ui-radio-group') as HTMLElement;
    expect(group.querySelector('p')?.textContent?.trim()).toBe('Solo una opción');

    fixture.componentInstance.hint.set('');
    fixture.detectChanges();
    expect(group.querySelector('p')).toBeNull();
    expect(group.getAttribute('aria-describedby')).toBeNull();
  });
});
