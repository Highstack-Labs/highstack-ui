import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OptionComponent, SelectComponent } from './select.component';

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

@Component({
  selector: 'app-select-host',
  imports: [SelectComponent, OptionComponent],
  template: `
    <ui-select [(value)]="valor" label="Fruta">
      <ui-option value="manzana">Manzana</ui-option>
      <ui-option value="pera">Pera</ui-option>
      <ui-option value="uva" [disabled]="true">Uva</ui-option>
    </ui-select>
  `,
})
class SelectHost {
  readonly valor = signal('');
}

describe('SelectComponent — panel portalizado', () => {
  function create() {
    const fixture = TestBed.createComponent(SelectHost);
    fixture.detectChanges();
    return fixture;
  }
  function trigger(fixture: ReturnType<typeof create>): HTMLButtonElement {
    return fixture.nativeElement.querySelector('[data-trigger]');
  }
  /** El panel vive en el contenedor de overlays, no en el host. */
  function panel(): HTMLElement {
    return document.querySelector('[role="listbox"]')!;
  }

  afterEach(() => {
    document.querySelector('[data-ui-overlay-root]')?.remove();
  });

  it('monta el panel en el contenedor de overlays, fuera del host', () => {
    const fixture = create();
    const root = document.querySelector('[data-ui-overlay-root]');
    expect(root).not.toBeNull();
    expect(panel().parentElement).toBe(root);
    expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeNull();
  });

  it('las opciones proyectadas siguen dentro del panel tras portalizarlo', () => {
    create();
    expect(panel().querySelectorAll('[role="option"]').length).toBe(3);
  });

  it('un clic dentro del panel no lo cierra; elegir una opción sí', () => {
    const fixture = create();
    trigger(fixture).click();
    fixture.detectChanges();
    expect(panel().classList.contains('hidden')).toBe(false);

    // Clic en el propio panel (no en una opción): sigue abierto.
    panel().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(panel().classList.contains('hidden')).toBe(false);

    const manzana = panel().querySelectorAll<HTMLElement>('[role="option"]')[0];
    manzana.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.valor()).toBe('manzana');
    expect(panel().classList.contains('hidden')).toBe(true);
  });

  it('las flechas navegan con el foco dentro del panel', () => {
    // Regresión: el handler estaba en el host, que ya no ve estas teclas.
    const fixture = create();
    trigger(fixture).click();
    fixture.detectChanges();

    const opciones = panel().querySelectorAll<HTMLElement>('[role="option"]');
    opciones[0].focus();
    panel().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(opciones[1]);
  });

  it('Escape cierra el panel y devuelve el foco al trigger', () => {
    const fixture = create();
    trigger(fixture).click();
    fixture.detectChanges();

    panel().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(panel().classList.contains('hidden')).toBe(true);
    expect(document.activeElement).toBe(trigger(fixture));
  });

  it('salta las opciones deshabilitadas al navegar', () => {
    const fixture = create();
    trigger(fixture).click();
    fixture.detectChanges();

    const opciones = panel().querySelectorAll<HTMLElement>('[role="option"]');
    opciones[1].focus(); // Pera; la siguiente (Uva) está deshabilitada.
    panel().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(opciones[0]); // vuelve a Manzana
  });
});
