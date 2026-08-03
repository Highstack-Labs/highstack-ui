import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DropdownComponent,
  DropdownItemComponent,
  DropdownTriggerDirective,
} from './dropdown.component';

@Component({
  selector: 'app-dropdown-host',
  imports: [DropdownComponent, DropdownTriggerDirective, DropdownItemComponent],
  template: `
    <ui-dropdown>
      <button uiDropdownTrigger>Abrir</button>
      <ui-dropdown-item>Editar</ui-dropdown-item>
      <ui-dropdown-item>Duplicar</ui-dropdown-item>
      <ui-dropdown-item [disabled]="true">Archivar</ui-dropdown-item>
    </ui-dropdown>
  `,
})
class DropdownHost {}

@Component({
  selector: 'app-empty-dropdown-host',
  imports: [DropdownComponent, DropdownTriggerDirective],
  template: `
    <ui-dropdown>
      <button uiDropdownTrigger>Abrir</button>
    </ui-dropdown>
  `,
})
class EmptyDropdownHost {}

describe('DropdownComponent — panel portalizado', () => {
  function create() {
    const fixture = TestBed.createComponent(DropdownHost);
    fixture.detectChanges();
    return fixture;
  }
  function trigger(fixture: { nativeElement: HTMLElement }): HTMLButtonElement {
    return fixture.nativeElement.querySelector('[uiDropdownTrigger]')!;
  }
  /** El panel vive en el contenedor de overlays, no en el host. */
  function panel(): HTMLElement | null {
    return document.querySelector('[role="menu"]');
  }

  afterEach(() => {
    document.querySelector('[data-ui-overlay-root]')?.remove();
  });

  it('monta el panel en el contenedor de overlays, fuera del host', () => {
    const fixture = create();
    trigger(fixture).click();
    fixture.detectChanges();

    const root = document.querySelector('[data-ui-overlay-root]');
    expect(panel()!.parentElement).toBe(root);
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
  });

  it('los ítems proyectados siguen dentro del panel tras portalizarlo', () => {
    const fixture = create();
    trigger(fixture).click();
    fixture.detectChanges();

    expect(panel()!.querySelectorAll('[role="menuitem"]').length).toBe(3);
  });

  it('un clic dentro del panel no lo cierra', () => {
    const fixture = create();
    trigger(fixture).click();
    fixture.detectChanges();

    panel()!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(panel()).not.toBeNull();
  });

  it('las flechas navegan con el foco dentro del panel, saltando los deshabilitados', () => {
    // Regresión: el handler estaba en el host, que ya no ve estas teclas.
    const fixture = create();
    trigger(fixture).click();
    fixture.detectChanges();

    const items = panel()!.querySelectorAll<HTMLElement>('[role="menuitem"]');
    items[1].focus(); // Duplicar; el siguiente (Archivar) está deshabilitado.
    panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(items[0]);
  });

  it('Escape cierra el panel y devuelve el foco al disparador', () => {
    const fixture = create();
    trigger(fixture).click();
    fixture.detectChanges();

    panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger(fixture));
  });

  it('Escape cierra también un menú sin ítems', () => {
    const fixture = TestBed.createComponent(EmptyDropdownHost);
    fixture.detectChanges();
    trigger(fixture).click();
    fixture.detectChanges();
    expect(panel()).not.toBeNull();

    panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(panel()).toBeNull();
  });
});
