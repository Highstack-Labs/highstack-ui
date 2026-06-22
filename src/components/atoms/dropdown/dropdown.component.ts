import {
  Component,
  Directive,
  ElementRef,
  HostListener,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

export type DropdownSide = 'bottom' | 'top';
export type DropdownAlign = 'start' | 'end';

/**
 * Menú desplegable compositional, sin dependencias. Maneja abrir/cerrar,
 * posición, click-afuera y navegación por teclado.
 */
@Component({
  selector: 'ui-dropdown',
  templateUrl: './dropdown.component.html',
  host: { class: 'relative inline-block' },
})
export class DropdownComponent {
  readonly side = input<DropdownSide>('bottom');
  readonly align = input<DropdownAlign>('start');

  readonly open = signal(false);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly items = contentChildren(DropdownItemComponent);

  protected readonly panelClasses = computed(() => {
    const base =
      'absolute z-50 min-w-48 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-1 shadow-md text-[var(--color-foreground)]';
    const side = this.side() === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5';
    const align = this.align() === 'end' ? 'right-0' : 'left-0';
    return [base, side, align].join(' ');
  });

  toggle() {
    this.open.update((o) => !o);
    if (this.open()) this.focusItem(0);
  }

  close() {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent) {
    if (this.open() && !this.el.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent) {
    if (!this.open()) return;
    const enabled = this.items().filter((i) => !i.disabled());
    if (!enabled.length) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const active = document.activeElement;
      const idx = enabled.findIndex((i) => i.isActive(active));
      const next =
        event.key === 'ArrowDown'
          ? (idx + 1) % enabled.length
          : (idx - 1 + enabled.length) % enabled.length;
      enabled[next].focus();
    }
  }

  /** Enfoca el ítem habilitado en la posición dada (tras render). */
  private focusItem(index: number) {
    setTimeout(() => {
      const enabled = this.items().filter((i) => !i.disabled());
      enabled[index]?.focus();
    });
  }
}

/** Marca el elemento disparador del dropdown. */
@Directive({
  selector: '[uiDropdownTrigger]',
  host: {
    '(click)': 'dd.toggle()',
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'dd.open()',
  },
})
export class DropdownTriggerDirective {
  protected readonly dd = inject(DropdownComponent);
}

/** Ítem seleccionable del menú. */
@Component({
  selector: 'ui-dropdown-item',
  template: `
    <span class="shrink-0 flex items-center [&:empty]:hidden"><ng-content select="[slot=icon]" /></span>
    <span class="flex-1 text-left"><ng-content /></span>
    <span class="shrink-0 text-xs text-[var(--color-muted-foreground)] [&:empty]:hidden"><ng-content select="[slot=shortcut]" /></span>
  `,
  host: {
    role: 'menuitem',
    tabindex: '-1',
    '[attr.aria-disabled]': 'disabled() || null',
    '(click)': 'onClick()',
    '[class]': 'hostClasses()',
  },
})
export class DropdownItemComponent {
  readonly destructive = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly select = output<void>();

  private readonly dd = inject(DropdownComponent);
  private readonly el = inject(ElementRef<HTMLElement>);

  protected readonly hostClasses = computed(() => {
    const base =
      'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer select-none outline-none transition-colors';
    const tone = this.destructive()
      ? 'text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 focus:bg-[var(--color-destructive)]/10'
      : 'text-[var(--color-foreground)] hover:bg-[var(--color-accent)] focus:bg-[var(--color-accent)]';
    const disabled = this.disabled() ? 'opacity-50 pointer-events-none' : '';
    return [base, tone, disabled].join(' ');
  });

  focus() {
    this.el.nativeElement.focus();
  }
  isActive(node: Element | null) {
    return node === this.el.nativeElement;
  }

  protected onClick() {
    if (this.disabled()) return;
    this.select.emit();
    this.dd.close();
  }
}

/** Encabezado de sección. */
@Component({
  selector: 'ui-dropdown-label',
  template: `<ng-content />`,
  host: {
    class:
      'block px-2 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]',
  },
})
export class DropdownLabelComponent {}

/** Línea divisoria. */
@Component({
  selector: 'ui-dropdown-separator',
  template: '',
  host: { class: '-mx-1 my-1 block h-px bg-[var(--color-border)]' },
})
export class DropdownSeparatorComponent {}
