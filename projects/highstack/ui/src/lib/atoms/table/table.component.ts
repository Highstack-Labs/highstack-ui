import {
  Directive,
  Component,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { SkeletonComponent } from '../loading/loading.component';
import { SortDirection, SortState, TableAlign, TableColumn, getByPath } from './table.types';

type Row = Record<string, unknown>;

/** Marca un template de celda para un field: <ng-template tableCell="estado">. */
@Directive({ selector: '[tableCell]' })
export class TableCellDirective {
  readonly field = input.required<string>({ alias: 'tableCell' });
  readonly template = inject(TemplateRef<unknown>);
}

/**
 * Tabla data-driven. Pinta `columns` automáticamente (incluido anidado);
 * para render custom, declara <ng-template tableCell="<field>"> y se usa solo
 * en esa columna. Soporta sorting, selección, loading y estado vacío.
 */
@Component({
  selector: 'ui-table',
  templateUrl: './table.component.html',
  imports: [NgTemplateOutlet, CheckboxComponent, SkeletonComponent],
})
export class TableComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly data = input<any[]>([]);
  readonly columns = input<TableColumn[]>([]);
  readonly loading = input(false, { transform: booleanAttribute });
  readonly rowKey = input<string>('');
  readonly selectable = input(false, { transform: booleanAttribute });
  readonly emptyMessage = input<string>('No hay resultados');

  readonly sortChange = output<SortState>();
  readonly selectionChange = output<Row[]>();

  private readonly cellTemplates = contentChildren(TableCellDirective);
  protected readonly sort = signal<SortState>({ field: '', direction: null });
  private readonly selectedKeys = signal<Set<unknown>>(new Set());

  // Filas de skeleton para el estado de carga.
  protected readonly skeletonRows = [0, 1, 2, 3, 4];

  protected templateFor(field: string | undefined): TemplateRef<unknown> | null {
    if (!field) return null;
    return this.cellTemplates().find((t) => t.field() === field)?.template ?? null;
  }

  protected value(row: Row, field: string | undefined) {
    return getByPath(row, field);
  }

  protected readonly rows = computed<Row[]>(() => {
    const list = [...this.data()];
    const { field, direction } = this.sort();
    if (!field || !direction) return list;
    return list.sort((a, b) => {
      const av = getByPath(a, field);
      const bv = getByPath(b, field);
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return direction === 'asc' ? cmp : -cmp;
    });
  });

  protected align(a: TableAlign | undefined) {
    return a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';
  }

  // --- Sorting ---
  protected toggleSort(col: TableColumn) {
    if (!col.sortable || !col.field) return;
    const cur = this.sort();
    let direction: SortDirection;
    if (cur.field !== col.field) direction = 'asc';
    else direction = cur.direction === 'asc' ? 'desc' : cur.direction === 'desc' ? null : 'asc';
    const next: SortState = { field: direction ? col.field : '', direction };
    this.sort.set(next);
    this.sortChange.emit(next);
  }

  protected sortDir(col: TableColumn): SortDirection {
    return this.sort().field === col.field ? this.sort().direction : null;
  }

  // --- Selección ---
  private keyOf(row: Row): unknown {
    const k = this.rowKey();
    return k ? getByPath(row, k) : row;
  }

  protected isSelected(row: Row) {
    return this.selectedKeys().has(this.keyOf(row));
  }

  protected toggleRow(row: Row) {
    const key = this.keyOf(row);
    this.selectedKeys.update((set) => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    this.emitSelection();
  }

  protected readonly allSelected = computed(() => {
    const rows = this.rows();
    return rows.length > 0 && rows.every((r) => this.selectedKeys().has(this.keyOf(r)));
  });
  protected readonly someSelected = computed(() => {
    const rows = this.rows();
    const sel = rows.filter((r) => this.selectedKeys().has(this.keyOf(r))).length;
    return sel > 0 && sel < rows.length;
  });

  protected toggleAll() {
    const rows = this.rows();
    this.selectedKeys.update((set) => {
      const next = new Set(set);
      if (rows.every((r) => next.has(this.keyOf(r)))) {
        rows.forEach((r) => next.delete(this.keyOf(r)));
      } else {
        rows.forEach((r) => next.add(this.keyOf(r)));
      }
      return next;
    });
    this.emitSelection();
  }

  private emitSelection() {
    const sel = this.data().filter((r) => this.selectedKeys().has(this.keyOf(r)));
    this.selectionChange.emit(sel);
  }

  protected trackRow = (index: number, row: Row) => (this.rowKey() ? this.keyOf(row) : index);
}
