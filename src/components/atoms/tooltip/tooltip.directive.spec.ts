import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TooltipDirective } from './tooltip.directive';

@Component({
  selector: 'app-tooltip-host',
  imports: [TooltipDirective],
  template: `<button uiTooltip="Guardar" [tooltipDelay]="0">Guardar</button>`,
})
class TooltipHost {}

function tip(): HTMLElement | null {
  return document.querySelector('[role="tooltip"]');
}

describe('TooltipDirective', () => {
  afterEach(() => {
    document.querySelector('[data-ui-overlay-root]')?.remove();
  });

  it('inyecta el tooltip en el contenedor de overlays, no en el <body>', async () => {
    const fixture = TestBed.createComponent(TooltipHost);
    fixture.detectChanges();

    const button: HTMLElement = fixture.nativeElement.querySelector('button');
    button.dispatchEvent(new MouseEvent('mouseenter'));
    await new Promise((r) => setTimeout(r, 0));

    const root = document.querySelector('[data-ui-overlay-root]');
    expect(root).not.toBeNull();
    expect(tip()!.parentElement).toBe(root);
    expect(tip()!.textContent).toBe('Guardar');
    expect(button.getAttribute('aria-describedby')).toBe(tip()!.id);
  });

  it('lo retira al salir el puntero', async () => {
    const fixture = TestBed.createComponent(TooltipHost);
    fixture.detectChanges();

    const button: HTMLElement = fixture.nativeElement.querySelector('button');
    button.dispatchEvent(new MouseEvent('mouseenter'));
    await new Promise((r) => setTimeout(r, 0));
    expect(tip()).not.toBeNull();

    button.dispatchEvent(new MouseEvent('mouseleave'));
    expect(tip()).toBeNull();
    expect(button.hasAttribute('aria-describedby')).toBe(false);
  });
});
