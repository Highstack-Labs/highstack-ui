# highstack-ui — Guía para agentes de IA

> Referencia completa de `@highstacklabs2026/ui`, una librería de componentes para **Angular 22** (standalone + signals + Tailwind v4). Está escrita para que un agente de IA (Claude u otro) pueda implementar componentes correctamente y a la primera, o diagnosticar errores. Copia los ejemplos tal cual.

---

## 0. Reglas de oro (léelas antes de generar código)

1. **Todos los componentes son standalone.** Se importan en el array `imports: [...]` del componente que los usa (no hay NgModule).
2. **Angular 22 + signals.** Inputs son signals (`input()`), valores con `model()` para two-way.
3. **Selectores con prefijo `ui-`** (componentes) o `ui*`/`[ui...]` (directivas).
4. **Theming por CSS variables.** Nunca hardcodees colores; todo sale de tokens `--color-*`. Para personalizar, redefine los tokens, no toques los componentes.
5. **No inventes inputs.** Usa solo los listados aquí. Si algo no está, no existe.
6. Requiere `@angular/forms` (CVA/Reactive) y, para Signal Forms, `@angular/forms/signals` (experimental en Angular 22).

---

## 1. Instalación

```bash
npm install @highstacklabs2026/ui
```

**Estilos** (una sola vez, en tu `styles.css` global):

```css
@import '@highstacklabs2026/ui/styles.css';
```

**Uso de un componente** (todos standalone):

```ts
import { Component } from '@angular/core';
import { ButtonComponent, BadgeComponent } from '@highstacklabs2026/ui';

@Component({
  selector: 'app-demo',
  imports: [ButtonComponent, BadgeComponent],
  template: `
    <ui-button variant="gradient">Guardar</ui-button>
    <ui-badge color="success">Activo</ui-badge>
  `,
})
export class Demo {}
```

---

## 2. Temas y modo oscuro

5 paletas (`default`/zinc, `indigo`, `teal`, `violet`, `rose`) + modo oscuro. Se activan con **clases en el `<body>`** o con el provider.

```ts
// app.config.ts
import { provideHighstack } from '@highstacklabs2026/ui';

export const appConfig = {
  providers: [
    provideHighstack({ theme: 'indigo', dark: true }),
  ],
};
```

O manual:

```html
<body class="theme-indigo dark">  <!-- tema indigo + oscuro -->
```

- Clases de tema: `theme-indigo | theme-teal | theme-violet | theme-rose` (sin clase = default/zinc).
- Modo oscuro: clase `dark`. Combinable con cualquier tema.
- Tokens principales (redefinibles): `--color-background`, `--color-foreground`, `--color-primary`, `--color-primary-foreground`, `--color-secondary`, `--color-accent`, `--color-muted`, `--color-muted-foreground`, `--color-border`, `--color-input`, `--color-ring`, `--color-destructive`, `--radius`.

---

## 3. Cómo funcionan los FORMULARIOS (importante)

Los componentes de formulario (**Input, Textarea, Checkbox, Switch, Radio, Select**) soportan **3 formas** de enlace, todas sobre la misma fuente de verdad:

```html
<!-- a) Two-way simple -->
<ui-input [(value)]="texto" />
<ui-checkbox [(checked)]="acepto" />

<!-- b) Reactive Forms / ngModel (ControlValueAccessor) -->
<ui-input [formControl]="ctrl" />
<ui-input formControlName="email" />

<!-- c) Signal Forms (Angular 22) -->
<ui-input [formField]="form.email" />
```

- Input/Textarea/Select usan `value` (string). Checkbox/Switch usan `checked` (boolean). Radio usa `value` en el **grupo**.
- Para mostrar errores de validación, los componentes aceptan `[invalid]`, `[touched]`, `[errors]` (Signal Forms los cablea solo con `[formField]`). Con Reactive Forms, pásalos tú o usa `[error]="'mensaje'"`.

---

## 4. Catálogo de componentes

> Formato: **import** · **selector** · inputs/outputs · ejemplo.

### Button
`ButtonComponent` · `<ui-button>`
- `variant`: `'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link' | 'gradient' | 'glass' | 'success' | 'warning'` (def. `'default'`)
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'icon'` (def. `'md'`)
- `disabled`, `loading`, `pill`, `full`: boolean · `type`: `'button'|'submit'|'reset'`
- Contenido proyectado (texto, íconos SVG).

```html
<ui-button variant="gradient" size="lg">Empezar</ui-button>
<ui-button variant="outline" [loading]="cargando">Guardar</ui-button>
<ui-button size="icon" variant="ghost"><svg>…</svg></ui-button>
```

### Input
`InputComponent` · `<ui-input>`
- `value` (model, string), `type` (`'text'|'email'|'password'|'number'|'search'|'tel'|'url'`), `size` (`'sm'|'md'|'lg'`)
- `label`, `hint`, `error`, `placeholder`, `name`, `id`: string
- `disabled`, `readonly`, `required`, `passwordToggle` (def. true): boolean
- `invalid`, `touched`, `errors`: estado de validación
- Slots: `[slot=prefix]`, `[slot=suffix]` (íconos).

```html
<ui-input label="Email" type="email" placeholder="tu@correo.com" [(value)]="email" hint="No lo compartiremos." />
<ui-input placeholder="Buscar…"><svg slot="prefix">…</svg></ui-input>
<ui-input label="Contraseña" type="password" />  <!-- trae ojito; [passwordToggle]="false" para quitarlo -->
```

### Textarea
`TextareaComponent` · `<ui-textarea>`
- `value` (model), `label`, `hint`, `error`, `placeholder`, `rows` (def. 4), `disabled`, `readonly`, `required`, `autoGrow` (crece con el contenido).

```html
<ui-textarea label="Biografía" [rows]="5" [autoGrow]="true" [(value)]="bio" />
```

### Checkbox
`CheckboxComponent` · `<ui-checkbox>`
- `checked` (model, boolean), `label`, `description`, `size` (`'sm'|'md'`), `disabled`, `required`, `indeterminate`.

```html
<ui-checkbox label="Acepto los términos" [(checked)]="acepto" />
<ui-checkbox label="Todo" [indeterminate]="parcial" />
```

### Switch
`SwitchComponent` · `<ui-switch>`
- `checked` (model), `label`, `description`, `size` (`'sm'|'md'`), `disabled`, `required`.

```html
<ui-switch label="Notificaciones" [(checked)]="notif" />
```

### Radio
`RadioGroupComponent` + `RadioComponent` · `<ui-radio-group>` + `<ui-radio>`
- Grupo: `value` (model), `size` (`'sm'|'md'`), `orientation` (`'vertical'|'horizontal'`), `appearance` (`'default'|'card'`), `name`, `disabled`, `required`.
- Item: `value` (**requerido**), `label`, `description`, `disabled`.

```html
<ui-radio-group [(value)]="plan" appearance="card" orientation="horizontal">
  <ui-radio value="free" label="Free" description="$0/mes" />
  <ui-radio value="pro" label="Pro" description="$29/mes" />
</ui-radio-group>
```

### Select
`SelectComponent` + `OptionComponent` · `<ui-select>` + `<ui-option>`
- Select: `value` (model), `placeholder`, `label`, `hint`, `error`, `size` (`'sm'|'md'|'lg'`), `disabled`, `required`.
- Option: `value` (**requerido**), `disabled`.

```html
<ui-select label="País" placeholder="Elige…" [(value)]="pais">
  <ui-option value="mx">México</ui-option>
  <ui-option value="co">Colombia</ui-option>
  <ui-option value="ar" disabled>Argentina</ui-option>
</ui-select>
```

### Badge
`BadgeComponent` · `<ui-badge>`
- `variant`: `'solid' | 'soft' | 'outline' | 'glass'` (def. `'soft'`)
- `color`: `'primary' | 'secondary' | 'success' | 'warning' | 'destructive'` (def. `'primary'`)
- `size`: `'sm' | 'md'` · `dot`, `removable`: boolean · output `(remove)` · slot `[slot=icon]`.

```html
<ui-badge color="success" variant="soft" [dot]="true">Activo</ui-badge>
<ui-badge [removable]="true" (remove)="quitar()">Angular</ui-badge>
```

### Avatar
`AvatarComponent` (+ `AvatarGroupComponent`) · `<ui-avatar>` (+ `<ui-avatar-group>`)
- Avatar: `src`, `name` (genera iniciales), `alt`, `size` (`'xs'|'sm'|'md'|'lg'|'xl'`), `shape` (`'circle'|'square'`), `status` (`'online'|'offline'|'away'|'busy'|null`).
- Group: `max` (number), `size`.

```html
<ui-avatar [src]="foto" name="Juan Díaz" status="online" size="lg" />
<ui-avatar name="Ana López" />  <!-- fallback a iniciales "AL" -->
<ui-avatar-group [max]="3">
  <ui-avatar name="A B" /> <ui-avatar name="C D" /> …
</ui-avatar-group>
```

### Card
`CardComponent` + subcomponentes · `<ui-card>` + `<ui-card-header>`, `<ui-card-title>`, `<ui-card-description>`, `<ui-card-content>`, `<ui-card-footer>`
- Card: `variant` (`'elevated'|'outline'|'soft'|'interactive'`, def. `'elevated'`).

```html
<ui-card>
  <ui-card-header>
    <ui-card-title>Plan Pro</ui-card-title>
    <ui-card-description>Para equipos.</ui-card-description>
  </ui-card-header>
  <ui-card-content>$29/mes</ui-card-content>
  <ui-card-footer><ui-button [full]="true">Empezar</ui-button></ui-card-footer>
</ui-card>
```

### Modal
`ModalComponent` + subcomponentes · `<ui-modal>` + `<ui-modal-header>`, `<ui-modal-title>`, `<ui-modal-description>`, `<ui-modal-content>`, `<ui-modal-footer>`
- Modal: `[(open)]` (model boolean, controla abrir/cerrar), `size` (`'sm'|'md'|'lg'|'xl'|'full'`, def. `'md'`), `closeOnBackdrop` (def. `true`), `closeOnEscape` (def. `true`), `showClose` (def. `true`), `ariaLabel`.
- Outputs: `(opened)`, `(closed)`.
- Los subcomponentes son opcionales: puedes proyectar contenido libre dentro de `<ui-modal>`.

```html
<ui-button (click)="open.set(true)">Abrir</ui-button>

<ui-modal [(open)]="open" size="md">
  <ui-modal-header>
    <ui-modal-title>¿Eliminar proyecto?</ui-modal-title>
    <ui-modal-description>Esta acción no se puede deshacer.</ui-modal-description>
  </ui-modal-header>
  <ui-modal-content>Se borrarán todos los archivos de forma permanente.</ui-modal-content>
  <ui-modal-footer>
    <ui-button variant="ghost" (click)="open.set(false)">Cancelar</ui-button>
    <ui-button variant="destructive" (click)="open.set(false)">Eliminar</ui-button>
  </ui-modal-footer>
</ui-modal>
```

```ts
open = signal(false); // en el componente
```

### Drawer (sheet lateral)
`DrawerComponent` + subcomponentes · `<ui-drawer>` + `<ui-drawer-header>`, `<ui-drawer-title>`, `<ui-drawer-description>`, `<ui-drawer-content>`, `<ui-drawer-footer>`
- Drawer: `[(open)]` (model boolean), `side` (`'right'|'left'|'top'|'bottom'`, def. `'right'`), `size` (`'sm'|'md'|'lg'|'xl'|'full'`, def. `'md'`), `closeOnBackdrop`/`closeOnEscape`/`showClose` (def. `true`), `ariaLabel`.
- Outputs: `(opened)`, `(closed)`. Subcomponentes opcionales (mismo patrón que el modal).
- Mismo control que el modal pero entra deslizando desde un borde. Ideal para nav móvil, filtros y formularios laterales.

```html
<ui-button (click)="open.set(true)">Abrir panel</ui-button>

<ui-drawer [(open)]="open" side="right">
  <ui-drawer-header>
    <ui-drawer-title>Filtros</ui-drawer-title>
    <ui-drawer-description>Ajusta los resultados.</ui-drawer-description>
  </ui-drawer-header>
  <ui-drawer-content>…</ui-drawer-content>
  <ui-drawer-footer>
    <ui-button variant="ghost" (click)="open.set(false)">Cancelar</ui-button>
    <ui-button (click)="open.set(false)">Aplicar</ui-button>
  </ui-drawer-footer>
</ui-drawer>
```

### Popover
`PopoverComponent` + `PopoverTriggerDirective` · `<ui-popover>` + `[uiPopoverTrigger]`
- `<ui-popover>`: `side` (`'bottom'|'top'|'left'|'right'`, def. `'bottom'`), `align` (`'start'|'center'|'end'`, def. `'center'`).
- `[uiPopoverTrigger]`: directiva en el elemento que abre el popover (con clic).
- Contenedor flotante de **contenido libre** (a diferencia del dropdown, que es un menú de ítems, y el tooltip, que es solo texto en hover). Cierra con clic-afuera o Escape.

```html
<ui-popover side="bottom" align="start">
  <ui-button uiPopoverTrigger variant="outline">Dimensiones</ui-button>

  <div class="space-y-2">
    <ui-input label="Ancho" />
    <ui-input label="Alto" />
  </div>
</ui-popover>
```

### Separator
`SeparatorComponent` · `<ui-separator>`
- `orientation`: `'horizontal' | 'vertical'` (def. `'horizontal'`) · `decorative`: boolean (def. `true`; ponlo `false` si separa grupos con significado semántico).

```html
<ui-separator />

<div class="flex items-center gap-3 h-5">
  <span>Inicio</span>
  <ui-separator orientation="vertical" />
  <span>Perfil</span>
</div>
```

### Alert
`AlertComponent` · `<ui-alert>`
- `type`: `'info' | 'success' | 'warning' | 'error'` (def. `'info'`)
- `variant`: `'soft' | 'solid'` · `title`: string · `closable`: boolean · output `(close)` · cuerpo proyectado.

```html
<ui-alert type="success" title="Guardado" [closable]="true" (close)="ocultar()">
  Tus cambios se aplicaron.
</ui-alert>
```

### Tooltip (directiva)
`TooltipDirective` · `[uiTooltip]`
- `uiTooltip` (texto), `tooltipPlacement` (`'top'|'bottom'|'left'|'right'`, def. `'top'`), `tooltipDelay` (ms, def. 300), `tooltipDisabled`.

```html
<ui-button uiTooltip="Guardar cambios">Guardar</ui-button>
<span uiTooltip="Info" tooltipPlacement="right">ⓘ</span>
```

### Dropdown
`DropdownComponent` + `DropdownTriggerDirective` + `DropdownItemComponent` + `DropdownLabelComponent` + `DropdownSeparatorComponent`
- `<ui-dropdown>`: `side` (`'bottom'|'top'`), `align` (`'start'|'end'`).
- `[uiDropdownTrigger]`: directiva en el botón disparador.
- `<ui-dropdown-item>`: output `(select)`, `destructive`, `disabled`, slots `[slot=icon]`/`[slot=shortcut]`.
- `<ui-dropdown-label>`, `<ui-dropdown-separator>`.

```html
<ui-dropdown align="end">
  <ui-button uiDropdownTrigger variant="outline">Opciones</ui-button>
  <ui-dropdown-label>Cuenta</ui-dropdown-label>
  <ui-dropdown-item (select)="editar()">Editar <span slot="shortcut">⌘E</span></ui-dropdown-item>
  <ui-dropdown-separator />
  <ui-dropdown-item destructive (select)="borrar()">Eliminar</ui-dropdown-item>
</ui-dropdown>
```

### Toast (servicio, sin setup)
`ToastService` (inyectable, `providedIn: 'root'`). El contenedor se auto-monta.
- `success/error/warning/info(message, opts?)` · `show(opts)` · `dismiss(id)` · `setPosition(pos)`.
- `opts`: `{ type?, title?, message, duration? (ms, 0 = no auto-cierra), action?: { label, handler } }`.
- Posiciones: `'top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right'` (def. `'bottom-right'`). `setPosition()` se llama normalmente una vez al inicio; si lo cambias en caliente, descarta los toasts visibles (no los reubica).

```ts
import { ToastService } from '@highstacklabs2026/ui';
private toast = inject(ToastService);

this.toast.success('Guardado');
this.toast.error('Falló', { title: 'Error', duration: 8000 });
this.toast.show({ type: 'info', message: 'Eliminado', action: { label: 'Deshacer', handler: () => undo() } });
```

### Tabs
`TabsComponent` + `TabComponent` · `<ui-tabs>` + `<ui-tab>`
- Tabs: `value` (model), `variant` (`'underline'|'pills'`), `size` (`'sm'|'md'`).
- Tab: `value` (**requerido**), `label`, `disabled`, slot `[slot=icon]`. Su contenido proyectado es el panel.

```html
<ui-tabs [(value)]="activa" variant="pills">
  <ui-tab value="cuenta" label="Cuenta">Contenido de cuenta…</ui-tab>
  <ui-tab value="seguridad" label="Seguridad">Contenido…</ui-tab>
</ui-tabs>
```

### Accordion
`AccordionComponent` + `AccordionItemComponent` · `<ui-accordion>` + `<ui-accordion-item>`
- Accordion: `multiple` (boolean; false = uno abierto a la vez).
- Item: `title` (string), `disabled`. Contenido proyectado.

```html
<ui-accordion [multiple]="false">
  <ui-accordion-item title="¿Qué incluye?">Contenido…</ui-accordion-item>
  <ui-accordion-item title="¿Precio?">Contenido…</ui-accordion-item>
</ui-accordion>
```

### Breadcrumb
`BreadcrumbComponent` + `BreadcrumbItemComponent` · `<ui-breadcrumb>` + `<ui-breadcrumb-item>`
- Item: `link` (string/array para `routerLink`; sin `link` = ítem actual). Separador chevron automático.

```html
<ui-breadcrumb>
  <ui-breadcrumb-item link="/">Inicio</ui-breadcrumb-item>
  <ui-breadcrumb-item link="/productos">Productos</ui-breadcrumb-item>
  <ui-breadcrumb-item>Camiseta</ui-breadcrumb-item>
</ui-breadcrumb>
```

### Loading: Spinner / Skeleton / Progress
`SpinnerComponent`, `SkeletonComponent`, `ProgressComponent` · `<ui-spinner>`, `<ui-skeleton>`, `<ui-progress>`
- Spinner: `size` (`'sm'|'md'|'lg'`). Hereda color (`currentColor`).
- Skeleton: `width`, `height` (CSS), `circle` (boolean).
- Progress: `value` (0-100), `size` (`'sm'|'md'|'lg'`), `indeterminate`.

```html
<ui-spinner size="md" />
<ui-skeleton width="60%" /> <ui-skeleton width="2.5rem" height="2.5rem" [circle]="true" />
<ui-progress [value]="60" /> <ui-progress [indeterminate]="true" />
```

### Pagination
`PaginationComponent` · `<ui-pagination>`
- `page` (model, **1-based**), `totalPages` (number), `variant` (`'numbers'|'compact'`), `size` (`'sm'|'md'`).
- Opcional items por página: `pageSize` (model), `pageSizeOptions` (number[]).

```html
<ui-pagination [(page)]="page" [totalPages]="20" />
<ui-pagination [(page)]="page" [totalPages]="20" variant="compact" />
<ui-pagination [(page)]="page" [totalPages]="20" [(pageSize)]="size" [pageSizeOptions]="[10,25,50]" />
```

### Table (el más complejo — leer con atención)
`TableComponent` + `TableCellDirective` + tipo `TableColumn` · `<ui-table>` + `<ng-template tableCell="…">`

**Estrategia:** es **data-driven**. Pasas `[data]` (array) y `[columns]` (array) y pinta TODO solo, incluido **acceso anidado** por path (`'direccion.ciudad'`). Para celdas que necesitan render custom (una fecha con formato, un badge, botones de acción), declaras un `<ng-template tableCell="FIELD">` y SOLO esa columna lo usa. **No se escriben filas ni celdas a mano.**

- `<ui-table>` inputs: `data` (T[]), `columns` (`TableColumn[]`), `loading` (bool → filas skeleton), `rowKey` (string, id para track/selección), `selectable` (bool), `emptyMessage` (string).
- Outputs: `(sortChange)` → `{ field, direction }`, `(selectionChange)` → `T[]`.
- `TableColumn`: `{ field?: string; header: string; sortable?: boolean; align?: 'left'|'center'|'right'; width?: string }`. `field` omitido = columna solo-template (p. ej. acciones).
- `<ng-template tableCell="field">` recibe contexto: `let-value` (valor de la celda, ya resuelto), `let-row="row"` (fila completa), `let-i="index"`.

```ts
cols: TableColumn[] = [
  { field: 'nombre', header: 'Nombre', sortable: true },
  { field: 'direccion.ciudad', header: 'Ciudad', sortable: true }, // anidado
  { field: 'estado', header: 'Estado' },
  { field: 'creadoEn', header: 'Creado', align: 'right' },
  { header: 'Acciones', align: 'right' },  // sin field
];
```

```html
<ui-table [data]="users" [columns]="cols" rowKey="id" [selectable]="true"
          (selectionChange)="sel.set($event)">

  <!-- solo las columnas especiales llevan template -->
  <ng-template tableCell="estado" let-value>
    <ui-badge [color]="value === 'activo' ? 'success' : 'secondary'" variant="soft">{{ value }}</ui-badge>
  </ng-template>

  <ng-template tableCell="creadoEn" let-value>
    <mi-fecha [valor]="value" />   <!-- TU componente -->
  </ng-template>

  <ng-template tableCell="Acciones" let-row="row">
    <ui-button size="sm" (click)="editar(row)">Editar</ui-button>
  </ng-template>
</ui-table>
```

---

## 5. Gotchas / errores frecuentes (para diagnosticar rápido)

- **"X is not a known element" / no se ve el componente** → faltó importar la clase en `imports: [...]` del componente que lo usa (todos son standalone).
- **Estilos no aplican / se ve sin formato** → falta `@import '@highstacklabs2026/ui/styles.css'` en el `styles.css` global.
- **Dark mode no cambia los componentes** → activar con clase `dark` en `<body>` (o `provideHighstack({ dark: true })`). Los componentes ya usan tokens; no requieren cambios.
- **Table: la celda custom no aparece / sale el texto crudo** → el `tableCell="X"` debe coincidir EXACTAMENTE con el `field` (o `header` si no hay field) de la columna.
- **NG5002 "Invalid ICU message"** → hay una llave `{` literal en un template HTML; escápala o reescribe el texto.
- **Multi `<ng-content>`**: si proyectas contenido y "desaparece", probablemente hay 2 `<ng-content>` sin `select` en ramas `@if/@else`; usa uno solo.
- **Signal Forms** (`[formField]`) es API **experimental** de Angular 22 (`@angular/forms/signals`). Si no quieres experimental, usa `[formControl]`/`formControlName` (estable) — todos los componentes de formulario lo soportan vía ControlValueAccessor.
- **Radio/Select/Tabs/Dropdown/Accordion/Breadcrumb** son **compositional**: el contenedor (`ui-*-group`/`ui-*`) y los items deben importarse AMBOS y usarse juntos (los items se inyectan del padre por DI).

---

## 6. Lista rápida de imports (todos desde `@highstacklabs2026/ui`)

```
ButtonComponent, InputComponent, TextareaComponent, CheckboxComponent, SwitchComponent,
RadioGroupComponent, RadioComponent, SelectComponent, OptionComponent,
BadgeComponent, AvatarComponent, AvatarGroupComponent,
CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent, CardFooterComponent,
ModalComponent, ModalHeaderComponent, ModalTitleComponent, ModalDescriptionComponent, ModalContentComponent, ModalFooterComponent,
DrawerComponent, DrawerHeaderComponent, DrawerTitleComponent, DrawerDescriptionComponent, DrawerContentComponent, DrawerFooterComponent,
PopoverComponent, PopoverTriggerDirective, SeparatorComponent,
AlertComponent, TooltipDirective,
DropdownComponent, DropdownTriggerDirective, DropdownItemComponent, DropdownLabelComponent, DropdownSeparatorComponent,
ToastService, TabsComponent, TabComponent,
AccordionComponent, AccordionItemComponent, BreadcrumbComponent, BreadcrumbItemComponent,
SpinnerComponent, SkeletonComponent, ProgressComponent,
TableComponent, TableCellDirective, TableColumn (tipo),
PaginationComponent,
provideHighstack
```
