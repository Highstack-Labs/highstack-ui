import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  Renderer2,
  booleanAttribute,
  numberAttribute,
} from '@angular/core';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

const GAP = 8; // separación entre trigger y tooltip (px)
const MARGIN = 8; // margen mínimo al borde del viewport (px)

/**
 * Tooltip accesible sin dependencias: se añade a cualquier elemento.
 * Posiciona un elemento flotante (position: fixed) con auto-flip y flecha.
 *
 *   <ui-button uiTooltip="Guardar" tooltipPlacement="top">Guardar</ui-button>
 */
@Directive({
  selector: '[uiTooltip]',
})
export class TooltipDirective implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  readonly text = input<string>('', { alias: 'uiTooltip' });
  readonly placement = input<TooltipPlacement>('top', { alias: 'tooltipPlacement' });
  readonly delay = input(300, { alias: 'tooltipDelay', transform: numberAttribute });
  readonly disabled = input(false, { alias: 'tooltipDisabled', transform: booleanAttribute });

  private tooltipEl: HTMLElement | null = null;
  private arrowEl: HTMLElement | null = null;
  private openTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly tipId = `ui-tooltip-${Math.floor(performance.now() * 1000) % 1_000_000}`;

  @HostListener('mouseenter')
  @HostListener('focusin')
  protected onEnter() {
    this.scheduleShow();
  }

  @HostListener('mouseleave')
  @HostListener('focusout')
  protected onLeave() {
    this.hide();
  }

  @HostListener('document:keydown.escape')
  protected onEscape() {
    this.hide();
  }

  private scheduleShow() {
    if (this.disabled() || !this.text() || this.tooltipEl) return;
    this.clearTimer();
    this.openTimer = setTimeout(() => this.show(), this.delay());
  }

  private show() {
    if (this.tooltipEl) return;

    const tip = this.renderer.createElement('div') as HTMLElement;
    tip.id = this.tipId;
    tip.setAttribute('role', 'tooltip');
    tip.className =
      'fixed z-50 px-2 py-1 rounded-md text-xs font-medium shadow-md max-w-xs whitespace-normal pointer-events-none opacity-0 transition-opacity duration-150 bg-[var(--color-foreground)] text-[var(--color-background)]';
    tip.textContent = this.text();

    const arrow = this.renderer.createElement('div') as HTMLElement;
    arrow.className = 'fixed z-50 size-2 rotate-45 pointer-events-none bg-[var(--color-foreground)]';

    this.renderer.appendChild(document.body, tip);
    this.renderer.appendChild(document.body, arrow);
    this.tooltipEl = tip;
    this.arrowEl = arrow;
    this.host.nativeElement.setAttribute('aria-describedby', this.tipId);

    this.position();
    // fade-in tras posicionar
    requestAnimationFrame(() => {
      if (this.tooltipEl) this.tooltipEl.style.opacity = '1';
    });
  }

  private position() {
    if (!this.tooltipEl || !this.arrowEl) return;

    const trigger = this.host.nativeElement.getBoundingClientRect();
    const tip = this.tooltipEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let place = this.placement();

    // Auto-flip si no cabe en el lado elegido.
    const fits = (p: TooltipPlacement) => {
      if (p === 'top') return trigger.top - GAP - tip.height >= MARGIN;
      if (p === 'bottom') return trigger.bottom + GAP + tip.height <= vh - MARGIN;
      if (p === 'left') return trigger.left - GAP - tip.width >= MARGIN;
      return trigger.right + GAP + tip.width <= vw - MARGIN; // right
    };
    const opposite: Record<TooltipPlacement, TooltipPlacement> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    };
    if (!fits(place) && fits(opposite[place])) place = opposite[place];

    let top = 0;
    let left = 0;
    let arrowTop = 0;
    let arrowLeft = 0;

    if (place === 'top' || place === 'bottom') {
      left = trigger.left + trigger.width / 2 - tip.width / 2;
      top = place === 'top' ? trigger.top - GAP - tip.height : trigger.bottom + GAP;
      arrowLeft = trigger.left + trigger.width / 2 - 4;
      arrowTop = place === 'top' ? trigger.top - GAP - 4 : trigger.bottom + GAP - 4;
    } else {
      top = trigger.top + trigger.height / 2 - tip.height / 2;
      left = place === 'left' ? trigger.left - GAP - tip.width : trigger.right + GAP;
      arrowTop = trigger.top + trigger.height / 2 - 4;
      arrowLeft = place === 'left' ? trigger.left - GAP - 4 : trigger.right + GAP - 4;
    }

    // Clamp horizontal/vertical al viewport.
    left = Math.max(MARGIN, Math.min(left, vw - tip.width - MARGIN));
    top = Math.max(MARGIN, Math.min(top, vh - tip.height - MARGIN));

    this.tooltipEl.style.top = `${Math.round(top)}px`;
    this.tooltipEl.style.left = `${Math.round(left)}px`;
    this.arrowEl.style.top = `${Math.round(arrowTop)}px`;
    this.arrowEl.style.left = `${Math.round(arrowLeft)}px`;
  }

  private hide() {
    this.clearTimer();
    if (this.tooltipEl) {
      this.renderer.removeChild(document.body, this.tooltipEl);
      this.tooltipEl = null;
    }
    if (this.arrowEl) {
      this.renderer.removeChild(document.body, this.arrowEl);
      this.arrowEl = null;
    }
    this.host.nativeElement.removeAttribute('aria-describedby');
  }

  private clearTimer() {
    if (this.openTimer) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
  }

  ngOnDestroy() {
    this.hide();
  }
}
