import { Component, booleanAttribute, computed, input, model, numberAttribute } from '@angular/core';
import { SelectComponent, OptionComponent } from '../select/select.component';

export type PaginationVariant = 'numbers' | 'compact';
export type PaginationSize = 'sm' | 'md';

/** Token de elipsis en la lista de páginas. */
const GAP = '…' as const;

/**
 * Paginación. Two-way `[(page)]` (1-based). Modo 'numbers' (con elipsis) o
 * 'compact' ('Página X de Y'). Selector opcional de items por página.
 */
@Component({
  selector: 'ui-pagination',
  templateUrl: './pagination.component.html',
  imports: [SelectComponent, OptionComponent],
  host: { role: 'navigation', 'aria-label': 'Paginación', class: 'flex items-center gap-3 flex-wrap' },
})
export class PaginationComponent {
  readonly page = model<number>(1);
  readonly totalPages = input(1, { transform: numberAttribute });
  readonly variant = input<PaginationVariant>('numbers');
  readonly size = input<PaginationSize>('md');

  /** Si se pasan opciones, se muestra el selector de items por página. */
  readonly pageSize = model<number>(10);
  readonly pageSizeOptions = input<number[]>([]);

  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly gap = GAP;

  protected readonly canPrev = computed(() => this.page() > 1 && !this.disabled());
  protected readonly canNext = computed(() => this.page() < this.totalPages() && !this.disabled());

  /** Lista de páginas visibles con elipsis: 1 … 4 5 6 … 20 */
  protected readonly pages = computed<(number | typeof GAP)[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const result: (number | typeof GAP)[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) result.push(GAP);
    for (let i = start; i <= end; i++) result.push(i);
    if (end < total - 1) result.push(GAP);
    result.push(total);
    return result;
  });

  protected readonly btnSize = computed(() => (this.size() === 'sm' ? 'size-8 text-xs' : 'size-9 text-sm'));

  // pageSize como string para el ui-select (que usa value:string)
  protected readonly pageSizeStr = computed(() => String(this.pageSize()));

  protected go(p: number) {
    if (p < 1 || p > this.totalPages() || p === this.page() || this.disabled()) return;
    this.page.set(p);
  }
  protected prev() {
    if (this.canPrev()) this.page.set(this.page() - 1);
  }
  protected next() {
    if (this.canNext()) this.page.set(this.page() + 1);
  }
  protected onPageSize(v: string) {
    this.pageSize.set(Number(v));
    this.page.set(1);
  }
  protected isGap(p: number | typeof GAP): p is typeof GAP {
    return p === GAP;
  }
}
