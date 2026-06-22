import { Component, computed, contentChildren, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Ruta de navegación jerárquica. Inserta un separador entre ítems. */
@Component({
  selector: 'ui-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  host: { 'aria-label': 'Breadcrumb' },
})
export class BreadcrumbComponent {
  readonly items = contentChildren(BreadcrumbItemComponent);
}

/** Un ítem del breadcrumb. Con `link` es navegable; sin él, es el actual. */
@Component({
  selector: 'ui-breadcrumb-item',
  template: `
    <a
      [routerLink]="link() || null"
      [attr.aria-current]="link() ? null : 'page'"
      [class]="
        link()
          ? 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors cursor-pointer'
          : 'font-medium text-[var(--color-foreground)]'
      "
    >
      <ng-content />
    </a>
    @if (!isLast()) {
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-1.5 text-[var(--color-muted-foreground)]/60"><path d="m9 18 6-6-6-6" /></svg>
    }
  `,
  imports: [RouterLink],
  host: { class: 'inline-flex items-center' },
})
export class BreadcrumbItemComponent {
  /** Destino de routerLink; si se omite, el ítem es el actual (no navegable). */
  readonly link = input<string | unknown[] | null>(null);

  private readonly parent = inject(BreadcrumbComponent);
  /** Es el último ítem (no muestra separador después). */
  readonly isLast = computed(() => {
    const list = this.parent.items();
    return list.length > 0 && list[list.length - 1] === this;
  });
}
