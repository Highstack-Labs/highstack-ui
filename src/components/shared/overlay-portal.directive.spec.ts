import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayPortalDirective } from './overlay-portal.directive';

@Component({
  selector: 'app-portal-host',
  imports: [OverlayPortalDirective],
  template: `
    <div data-host>
      @if (open()) {
        <div uiOverlayPortal data-panel>contenido</div>
      }
    </div>
  `,
})
class PortalHost {
  readonly open = signal(true);
}

function panel() {
  return document.querySelector('[data-panel]');
}

describe('OverlayPortalDirective', () => {
  afterEach(() => {
    document.querySelector('[data-ui-overlay-root]')?.remove();
  });

  it('mueve el panel al contenedor de overlays, fuera del host', async () => {
    const fixture = TestBed.createComponent(PortalHost);
    await fixture.whenStable();

    const root = document.querySelector('[data-ui-overlay-root]');
    expect(panel()?.parentElement).toBe(root);
    expect(fixture.nativeElement.querySelector('[data-panel]')).toBeNull();
  });

  it('retira el panel del contenedor al cerrarse', async () => {
    const fixture = TestBed.createComponent(PortalHost);
    await fixture.whenStable();
    expect(panel()).not.toBeNull();

    fixture.componentInstance.open.set(false);
    await fixture.whenStable();

    expect(panel()).toBeNull();
  });

  it('retira el panel al destruirse el componente', async () => {
    const fixture = TestBed.createComponent(PortalHost);
    await fixture.whenStable();

    fixture.destroy();

    expect(panel()).toBeNull();
  });
});
