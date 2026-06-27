import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StepperComponent } from './stepper.component';

@Component({
  imports: [StepperComponent],
  template: `
    <ui-stepper
      [(active)]="active"
      [steps]="steps"
      [variant]="variant()"
      [orientation]="orientation()"
      [linear]="linear()"
      [showCheck]="showCheck()"
    />
  `,
})
class HostComponent {
  active = signal(0);
  steps = [{ label: 'Uno' }, { label: 'Dos' }, { label: 'Tres' }, { label: 'Cuatro' }];
  variant = signal<'circles' | 'progress'>('circles');
  orientation = signal<'horizontal' | 'vertical'>('horizontal');
  linear = signal(false);
  showCheck = signal(true);
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const stepper = fixture.debugElement.children[0].componentInstance as StepperComponent;
  return { fixture, host: fixture.componentInstance, stepper };
}

describe('StepperComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  it('renderiza un indicador por paso', () => {
    const { fixture } = setup();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    expect(buttons.length).toBe(4);
  });

  it('deriva estados completed/current/upcoming desde active', () => {
    const { host, stepper, fixture } = setup();
    host.active.set(2);
    fixture.detectChanges();
    const states = stepper.states();
    expect(states[0].completed).toBe(true);
    expect(states[2].current).toBe(true);
    expect(states[3].upcoming).toBe(true);
  });

  it('select cambia active cuando es clicable', () => {
    const { host, stepper } = setup();
    stepper.select(2);
    expect(host.active()).toBe(2);
  });

  it('linear bloquea saltar hacia adelante', () => {
    const { host, stepper, fixture } = setup();
    host.linear.set(true);
    fixture.detectChanges();
    expect(stepper.canSelect(3)).toBe(false); // adelante: no
    expect(stepper.canSelect(0)).toBe(true); // atrás/actual: sí
    stepper.select(3);
    expect(host.active()).toBe(0);
  });

  it('progressPct refleja el avance', () => {
    const { host, stepper, fixture } = setup();
    host.active.set(3); // último de 4 => 100%
    fixture.detectChanges();
    expect(stepper.progressPct()).toBe(100);
    host.active.set(1); // 1/3 => 33.33
    fixture.detectChanges();
    expect(Math.round(stepper.progressPct())).toBe(33);
  });

  it('muestra ✓ en pasos completados cuando showCheck', () => {
    const { host, fixture } = setup();
    host.active.set(2);
    fixture.detectChanges();
    const firstBtn = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(firstBtn?.querySelector('svg')).toBeTruthy();
  });
});
