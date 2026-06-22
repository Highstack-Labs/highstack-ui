import { AfterViewInit, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  TableComponent,
  TableCellDirective,
} from '../../../../components/atoms/table/table.component';
import { TableColumn } from '../../../../components/atoms/table/table.types';
import { BadgeComponent } from '../../../../components/atoms/badge/badge.component';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { DemoBlockComponent } from '../../../shared/demo-block/demo-block.component';
import { CodeBlockComponent } from '../../../shared/code-block/code-block.component';
import { PageNavService, PageSection } from '../../../shared/page-nav.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  estado: 'activo' | 'inactivo';
  direccion: { ciudad: string; pais: string };
  creadoEn: string; // ISO
}

@Component({
  selector: 'app-table-page',
  imports: [PageHeaderComponent, 
    TableComponent,
    TableCellDirective,
    BadgeComponent,
    ButtonComponent,
    DemoBlockComponent,
    CodeBlockComponent,
  ],
  templateUrl: './table.page.html',
})
export class TablePage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageNav = inject(PageNavService);

  readonly users: User[] = [
    { id: 1, nombre: 'Ana López', email: 'ana@mail.com', rol: 'Admin', estado: 'activo', direccion: { ciudad: 'CDMX', pais: 'México' }, creadoEn: '2026-01-15' },
    { id: 2, nombre: 'Luis Mora', email: 'luis@mail.com', rol: 'Editor', estado: 'activo', direccion: { ciudad: 'Lima', pais: 'Perú' }, creadoEn: '2026-02-03' },
    { id: 3, nombre: 'Carla Ruiz', email: 'carla@mail.com', rol: 'Viewer', estado: 'inactivo', direccion: { ciudad: 'Bogotá', pais: 'Colombia' }, creadoEn: '2026-03-21' },
    { id: 4, nombre: 'Eva Soto', email: 'eva@mail.com', rol: 'Editor', estado: 'activo', direccion: { ciudad: 'Santiago', pais: 'Chile' }, creadoEn: '2026-04-10' },
  ];

  readonly cols: TableColumn[] = [
    { field: 'nombre', header: 'Nombre', sortable: true },
    { field: 'direccion.ciudad', header: 'Ciudad', sortable: true },
    { field: 'estado', header: 'Estado' },
    { field: 'creadoEn', header: 'Creado', sortable: true, align: 'right' },
  ];

  readonly actionCols: TableColumn[] = [
    { field: 'nombre', header: 'Usuario' },
    { field: 'rol', header: 'Rol' },
    { header: 'Acciones', align: 'right' },
  ];

  readonly selected = signal<User[]>([]);
  readonly loading = signal(false);
  readonly emptyCols = this.cols;

  toggleLoading() {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 1500);
  }

  fmtDate(iso: unknown): string {
    const d = new Date(String(iso));
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private readonly sections: PageSection[] = [
    { id: 'instalacion', label: 'Instalación' },
    { id: 'concepto', label: 'Cómo funciona' },
    { id: 'basic', label: 'Básico + anidado' },
    { id: 'custom', label: 'Celdas custom' },
    { id: 'selection', label: 'Selección' },
    { id: 'states', label: 'Loading / vacío' },
    { id: 'api', label: 'API' },
  ];

  ngAfterViewInit() {
    this.pageNav.startSpy(this.sections);
    this.destroyRef.onDestroy(() => this.pageNav.stopSpy());
  }

  readonly importExample = `import { TableComponent, TableCellDirective, TableColumn } from '@highstacklabs2026/ui';`;

  readonly conceptColumns = `// 1) Defines las columnas como un ARRAY (conciso, automático).
//    'field' soporta paths anidados con punto: 'direccion.ciudad'.
cols: TableColumn[] = [
  { field: 'nombre',           header: 'Nombre',  sortable: true },
  { field: 'direccion.ciudad', header: 'Ciudad',  sortable: true }, // anidado
  { field: 'creadoEn',         header: 'Creado',  align: 'right' },
  { header: 'Acciones',        align: 'right' },                    // sin field (solo template)
];`;

  readonly conceptTemplate = `<!-- 2) La tabla pinta TODO automáticamente. Solo declaras un
        <ng-template tableCell="FIELD"> para las celdas que necesitan
        render custom; el resto se pinta como texto. -->
<ui-table [data]="users" [columns]="cols">

  <!-- esta columna pasa por TU componente / markup -->
  <ng-template tableCell="creadoEn" let-value let-row="row" let-i="index">
    <mi-fecha [valor]="value" />
  </ng-template>

</ui-table>

<!-- El contexto del template trae:
       let-value       → el valor de la celda (ya resuelto, incl. anidado)
       let-row="row"   → la fila completa (el objeto original)
       let-i="index"   → el índice de la fila                              -->`;

  readonly basicCode = `cols: TableColumn[] = [
  { field: 'nombre', header: 'Nombre', sortable: true },
  { field: 'direccion.ciudad', header: 'Ciudad', sortable: true }, // anidado
  { field: 'creadoEn', header: 'Creado', sortable: true, align: 'right' },
];

<ui-table [data]="users" [columns]="cols" />`;

  readonly customCode = `<ui-table [data]="users" [columns]="cols">
  <!-- Solo las columnas especiales llevan template -->
  <ng-template tableCell="estado" let-value>
    <ui-badge [color]="value === 'activo' ? 'success' : 'secondary'" variant="soft">
      {{ value }}
    </ui-badge>
  </ng-template>

  <ng-template tableCell="creadoEn" let-value>
    {{ fmtDate(value) }}
  </ng-template>
</ui-table>`;

  readonly selectionCode = `<ui-table
  [data]="users"
  [columns]="cols"
  rowKey="id"
  [selectable]="true"
  (selectionChange)="selected.set($event)"
/>`;

  readonly statesCode = `<!-- Carga: filas skeleton -->
<ui-table [data]="[]" [columns]="cols" [loading]="true" />

<!-- Vacío -->
<ui-table [data]="[]" [columns]="cols" emptyMessage="No hay usuarios" />`;
}
