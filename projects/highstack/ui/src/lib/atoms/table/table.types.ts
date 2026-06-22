export type TableAlign = 'left' | 'center' | 'right';
export type SortDirection = 'asc' | 'desc' | null;

export interface TableColumn {
  /** Path al valor (soporta anidado "a.b.c"). Omitir para columnas solo-template (acciones). */
  field?: string;
  header: string;
  sortable?: boolean;
  align?: TableAlign;
  /** Ancho CSS, p. ej. '120px' o '20%'. */
  width?: string;
}

export interface SortState {
  field: string;
  direction: SortDirection;
}

/** Resuelve un path anidado: getByPath(row, 'direccion.ciudad'). */
export function getByPath(obj: unknown, path: string | undefined): unknown {
  if (!obj || !path) return undefined;
  return path.split('.').reduce<unknown>((acc, key) => {
    return acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined;
  }, obj);
}
