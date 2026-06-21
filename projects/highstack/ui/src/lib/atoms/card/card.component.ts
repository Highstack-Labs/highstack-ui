import { Component, computed, input } from '@angular/core';

export type CardVariant = 'elevated' | 'outline' | 'soft' | 'interactive';

/** Contenedor principal. Proyecta header/content/footer (u contenido libre). */
@Component({
  selector: 'ui-card',
  template: `<ng-content />`,
  host: { '[class]': 'hostClasses()' },
})
export class CardComponent {
  readonly variant = input<CardVariant>('elevated');

  protected readonly hostClasses = computed(() => {
    const base = 'block rounded-[var(--radius)] bg-[var(--color-background)] text-[var(--color-foreground)]';

    const variantMap: Record<CardVariant, string> = {
      elevated: 'border border-[var(--color-border)] shadow-sm',
      outline: 'border border-[var(--color-border)]',
      soft: 'bg-[var(--color-muted)]/40',
      interactive:
        'border border-[var(--color-border)] shadow-sm transition-all hover:shadow-md hover:border-[var(--color-ring)]/40 active:scale-[0.995] cursor-pointer',
    };

    return `${base} ${variantMap[this.variant()]}`;
  });
}

/** Cabecera: padding + columna con separación. */
@Component({
  selector: 'ui-card-header',
  template: `<ng-content />`,
  host: { class: 'flex flex-col gap-1.5 px-6 pt-6' },
})
export class CardHeaderComponent {}

/** Título de la tarjeta. */
@Component({
  selector: 'ui-card-title',
  template: `<ng-content />`,
  host: { class: 'block text-base font-semibold tracking-tight text-[var(--color-foreground)]' },
})
export class CardTitleComponent {}

/** Descripción / subtítulo. */
@Component({
  selector: 'ui-card-description',
  template: `<ng-content />`,
  host: { class: 'block text-sm text-[var(--color-muted-foreground)]' },
})
export class CardDescriptionComponent {}

/** Cuerpo de la tarjeta. */
@Component({
  selector: 'ui-card-content',
  template: `<ng-content />`,
  host: { class: 'block px-6 py-6' },
})
export class CardContentComponent {}

/** Pie: fila para acciones (botones). */
@Component({
  selector: 'ui-card-footer',
  template: `<ng-content />`,
  host: { class: 'flex items-center gap-3 px-6 pb-6' },
})
export class CardFooterComponent {}
