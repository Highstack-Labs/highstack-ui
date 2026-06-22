import {
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

let nextId = 0;

/**
 * Acordeón compositional. `multiple` permite varios paneles abiertos; por
 * defecto solo uno (al abrir otro se cierra el anterior).
 */
@Component({
  selector: 'ui-accordion',
  template: `<ng-content />`,
  host: { class: 'block divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]' },
})
export class AccordionComponent {
  readonly multiple = input(false, { transform: booleanAttribute });

  /** Ids de los items abiertos. */
  private readonly openIds = signal<Set<number>>(new Set());

  isOpen(id: number) {
    return this.openIds().has(id);
  }

  toggle(id: number) {
    this.openIds.update((set) => {
      const next = new Set(this.multiple() ? set : []);
      if (set.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
}

/** Un panel del acordeón. */
@Component({
  selector: 'ui-accordion-item',
  templateUrl: './accordion-item.component.html',
})
export class AccordionItemComponent {
  readonly title = input<string>('');
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly accordion = inject(AccordionComponent);
  protected readonly id = nextId++;
  protected readonly contentId = `ui-accordion-panel-${this.id}`;

  protected readonly open = computed(() => this.accordion.isOpen(this.id));

  protected toggle() {
    if (!this.disabled()) this.accordion.toggle(this.id);
  }
}
