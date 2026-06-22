import {
  Component,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type TabsVariant = 'underline' | 'pills';
export type TabsSize = 'sm' | 'md';

/**
 * Pestañas compositional. ui-tabs guarda la pestaña activa y arma la barra a
 * partir de los ui-tab hijos; cada ui-tab proyecta su panel (visible si activo).
 */
@Component({
  selector: 'ui-tabs',
  templateUrl: './tabs.component.html',
  imports: [NgTemplateOutlet],
  host: { class: 'block' },
})
export class TabsComponent {
  readonly value = model<string>('');
  readonly variant = input<TabsVariant>('underline');
  readonly size = input<TabsSize>('md');

  readonly tabs = contentChildren(TabComponent);

  constructor() {
    // Selecciona la primera pestaña si no hay valor.
    effect(() => {
      const list = this.tabs();
      if (!this.value() && list.length) this.value.set(list[0].value());
    });
  }

  protected readonly listClasses = computed(() => {
    if (this.variant() === 'pills') {
      return 'inline-flex items-center gap-1 rounded-[var(--radius)] bg-[var(--color-muted)] p-1';
    }
    return 'flex items-center gap-1 border-b border-[var(--color-border)]';
  });

  protected select(v: string) {
    this.value.set(v);
  }

  protected tabClasses(tab: TabComponent) {
    const active = this.value() === tab.value();
    const sizePad =
      this.size() === 'sm' ? 'h-8 px-2.5 text-xs gap-1.5' : 'h-9 px-3 text-sm gap-2';
    const base =
      'inline-flex items-center font-medium transition-colors outline-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background)]';

    if (this.variant() === 'pills') {
      const state = active
        ? 'bg-[var(--color-background)] text-[var(--color-foreground)] shadow-sm'
        : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]';
      return [base, sizePad, 'rounded-[calc(var(--radius)-0.25rem)]', state].join(' ');
    }
    // underline
    const state = active
      ? 'text-[var(--color-foreground)] border-[var(--color-primary)]'
      : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] border-transparent';
    return [base, sizePad, '-mb-px border-b-2', state].join(' ');
  }
}

/** Una pestaña: label/ícono para la barra + su panel proyectado. */
@Component({
  selector: 'ui-tab',
  template: `
    <ng-template #icon><ng-content select="[slot=icon]" /></ng-template>
    @if (isActive()) {
      <ng-content />
    }
  `,
  host: { role: 'tabpanel' },
})
export class TabComponent {
  readonly value = input.required<string>();
  readonly label = input<string>('');
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly iconTpl = viewChild<TemplateRef<unknown>>('icon');

  private readonly tabs = inject(TabsComponent);
  readonly isActive = computed(() => this.tabs.value() === this.value());
}
