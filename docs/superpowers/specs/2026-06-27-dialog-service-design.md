# Diseño: `DialogService` (modales imperativos)

**Fecha:** 2026-06-27
**Estado:** Aprobado para implementación

## Problema

Hoy el modal es 100% declarativo: hay que escribir `<ui-modal [(open)]="signal">` en
el HTML y manejar el estado a mano. Falta la forma imperativa que ofrecen otras
librerías (`MatDialog.open()` de Angular Material, `DialogService` de PrimeNG): abrir
un diálogo desde TypeScript con una sola llamada y recibir el resultado.

El proyecto ya tiene este patrón resuelto en `ToastService`: un servicio
`providedIn: 'root'` que auto-monta su contenedor en el `<body>` con `createComponent`.
Replicamos esa convención para diálogos.

## Objetivo

Un `DialogService` con tres entradas, todas basadas en `Promise` (el proyecto usa
signals, no RxJS):

1. `confirm(opts): Promise<boolean>` — confirmación rápida.
2. `alert(opts): Promise<void>` — aviso simple.
3. `open(Componente, opts): DialogRef<R>` — monta cualquier componente dentro del modal.

Cero setup para el consumidor: solo `inject(DialogService)`. Reutiliza el `<ui-modal>`
existente por dentro (overlay, animación de entrada/salida, cierre por Escape/backdrop,
lock-scroll del body y accesibilidad ya están resueltos ahí).

## No-objetivos (YAGNI)

- No se añade RxJS ni `afterClosed()` como Observable.
- No se elimina ni modifica el `<ui-modal>` declarativo: ambos conviven.
- No hay stacking avanzado de foco entre diálogos anidados más allá de lo que ya hace
  `ui-modal` (un diálogo encima de otro funciona, pero no se diseña gestión especial).

## Arquitectura

Carpeta nueva: `src/components/atoms/dialog/` (separada de `modal/` para que quede claro
que `<ui-modal>` = declarativo y `DialogService` = imperativo).

| Archivo | Rol |
|---|---|
| `dialog.types.ts` | Tipos públicos: `DialogOptions`, `ConfirmOptions`, `AlertOptions`, token `DIALOG_DATA`, clase `DialogRef`, e interna `DialogInstance`. |
| `dialog.service.ts` | El servicio `@Injectable({ providedIn: 'root' })`: `open()`, `confirm()`, `alert()`, auto-montaje del outlet, lista reactiva de diálogos. |
| `dialog-outlet.component.ts` | Contenedor interno (`ui-dialog-outlet`) que renderiza los diálogos abiertos, cada uno dentro de un `<ui-modal>`. |

### Tipos (`dialog.types.ts`)

```ts
import { InjectionToken, Type } from '@angular/core';
import { ModalSize } from '../modal/modal.component';
import { ButtonVariant } from '../button/button.component'; // verificar nombre real en impl.

/** Opciones comunes que se pasan a <ui-modal>. */
export interface DialogBaseOptions {
  size?: ModalSize;            // default 'md'
  closeOnBackdrop?: boolean;   // default true
  closeOnEscape?: boolean;     // default true
  showClose?: boolean;         // default true
  ariaLabel?: string;
}

/** Para dialog.open(Componente, ...) */
export interface DialogOptions<D = unknown> extends DialogBaseOptions {
  data?: D;
}

/** Para dialog.confirm(...) */
export interface ConfirmOptions extends DialogBaseOptions {
  title?: string;
  message: string;
  confirmText?: string;        // default 'Confirmar'
  cancelText?: string;         // default 'Cancelar'
  confirmVariant?: ButtonVariant; // default 'default'; usar 'destructive' para borrar
}

/** Para dialog.alert(...) */
export interface AlertOptions extends DialogBaseOptions {
  title?: string;
  message: string;
  confirmText?: string;        // default 'Aceptar'
}

/** Token para inyectar los datos en el componente dinámico. */
export const DIALOG_DATA = new InjectionToken<unknown>('DIALOG_DATA');
```

`DialogRef<R>`:

```ts
export class DialogRef<R = unknown> {
  /** Resuelve cuando el diálogo termina de cerrarse, con el resultado pasado a close(). */
  readonly closed: Promise<R | undefined>;
  /** Cierra el diálogo (resuelve `closed`). Disponible en el componente dinámico vía inject. */
  close(result?: R): void;
  /** Datos pasados en open({ data }). */
  readonly data: unknown;
}
```

`DialogInstance` (interno, lo que vive en el signal del servicio):

```ts
interface DialogInstance {
  id: number;
  open: WritableSignal<boolean>;     // controla [(open)] del ui-modal por instancia
  options: DialogBaseOptions;
  ref: DialogRef;
  kind: 'component' | 'confirm' | 'alert';
  component?: Type<unknown>;         // solo kind === 'component'
  injector?: Injector;               // injector con DialogRef + DIALOG_DATA
  confirm?: ConfirmOptions;          // solo kind === 'confirm'
  alert?: AlertOptions;              // solo kind === 'alert'
  resolve: (value: unknown) => void; // resuelve ref.closed
  result?: unknown;                  // resultado pendiente hasta que termina la animación
}
```

### Servicio (`dialog.service.ts`)

Estructura paralela a `ToastService`:

- `private readonly appRef = inject(ApplicationRef)`
- `private readonly envInjector = inject(EnvironmentInjector)`
- `readonly dialogs = signal<DialogInstance[]>([])`
- `private mounted = false; private seq = 0;`
- `ensureMounted()` idéntico al de toast: `createComponent(DialogOutletComponent, ...)`,
  `attachView`, `appendChild(document.body)`.

Métodos:

```ts
open<R = unknown, D = unknown>(component: Type<unknown>, opts?: DialogOptions<D>): DialogRef<R>
```
1. `ensureMounted()`, genera `id = ++seq`.
2. Crea la `Promise` y captura su `resolve`.
3. Crea el `DialogRef` (su `close(result)` llama a un método interno `dismiss(id, result)`).
4. Construye un `Injector` hijo con `Injector.create({ providers: [{ provide: DialogRef, useValue: ref }, { provide: DIALOG_DATA, useValue: opts?.data ?? null }], parent: envInjector })`.
5. Empuja la instancia (`open: signal(true)`) a `dialogs`.
6. Devuelve el `ref`.

```ts
confirm(opts: ConfirmOptions): Promise<boolean>
alert(opts: AlertOptions): Promise<void>
```
Internamente crean una `DialogInstance` con `kind: 'confirm' | 'alert'` (sin componente
ni injector) y devuelven `ref.closed` (mapeando `undefined → false` para confirm).

`dismiss(id, result)` interno:
1. Encuentra la instancia, guarda `result`.
2. Pone `instance.open.set(false)` → el `ui-modal` anima la salida.
3. El outlet escucha el `(closed)` del `ui-modal` y llama a `finalize(id)`, que resuelve
   la promise con `result` y saca la instancia de la lista.
   (Se usa el evento `(closed)` del modal en vez de un `setTimeout` para no duplicar la
   duración de animación; el modal ya emite `closed` al iniciar el cierre.)

> Nota de implementación: `ui-modal` emite `closed` al **empezar** a cerrarse y se
> desmonta del DOM 200 ms después. Para resolver la promise tras la animación, `finalize`
> quita la instancia de la lista en el `(closed)`; el `@for` del outlet deja de renderizar
> ese `ui-modal`. Esto es aceptable porque el resultado lógico ya está decidido. Si en la
> implementación se observa un corte visual de la animación, se resolverá la promise en
> `(closed)` pero se retirará la instancia con un `setTimeout(200)` que coincida con el
> modal. La implementación elegirá la variante que se vea bien; ambas son válidas.

### Outlet (`dialog-outlet.component.ts`)

Componente interno, auto-montado (selector `ui-dialog-outlet`). Importa
`ModalComponent` (+ subcomponentes header/title/description/content/footer),
`ButtonComponent` y `NgComponentOutlet`.

```html
@for (d of svc.dialogs(); track d.id) {
  <ui-modal
    [open]="d.open()"
    [size]="d.options.size ?? 'md'"
    [closeOnBackdrop]="d.options.closeOnBackdrop ?? true"
    [closeOnEscape]="d.options.closeOnEscape ?? true"
    [showClose]="d.options.showClose ?? true"
    [ariaLabel]="d.options.ariaLabel"
    (closed)="svc.finalize(d.id)"
  >
    @switch (d.kind) {
      @case ('component') {
        <ng-container *ngComponentOutlet="d.component!; injector: d.injector!" />
      }
      @case ('confirm') {
        <ui-modal-header>
          @if (d.confirm!.title) { <ui-modal-title>{{ d.confirm!.title }}</ui-modal-title> }
          <ui-modal-description>{{ d.confirm!.message }}</ui-modal-description>
        </ui-modal-header>
        <ui-modal-footer>
          <ui-button variant="ghost" (click)="svc.dismiss(d.id, false)">
            {{ d.confirm!.cancelText ?? 'Cancelar' }}
          </ui-button>
          <ui-button [variant]="d.confirm!.confirmVariant ?? 'default'"
                     (click)="svc.dismiss(d.id, true)">
            {{ d.confirm!.confirmText ?? 'Confirmar' }}
          </ui-button>
        </ui-modal-footer>
      }
      @case ('alert') {
        <ui-modal-header>
          @if (d.alert!.title) { <ui-modal-title>{{ d.alert!.title }}</ui-modal-title> }
          <ui-modal-description>{{ d.alert!.message }}</ui-modal-description>
        </ui-modal-header>
        <ui-modal-footer>
          <ui-button (click)="svc.dismiss(d.id, undefined)">
            {{ d.alert!.confirmText ?? 'Aceptar' }}
          </ui-button>
        </ui-modal-footer>
      }
    }
  </ui-modal>
}
```

Cuando el usuario cierra por backdrop/escape/✕, el `ui-modal` pone su propio `open` en
false y emite `closed`; el outlet llama a `svc.finalize(d.id)`. Como en ese caso no pasó
por `dismiss`, el `result` queda `undefined` → `confirm` resuelve `false`, `open()`
resuelve `undefined`. Correcto.

## Flujo de datos (resumen)

1. Consumidor: `await dialog.confirm({...})` o `dialog.open(Comp, {data})`.
2. Servicio crea `DialogRef` + `DialogInstance`, asegura outlet montado, empuja a `dialogs`.
3. Outlet renderiza un `<ui-modal>` por instancia; el componente dinámico recibe
   `DialogRef` y `DIALOG_DATA` por inyección.
4. Cierre (programático vía `ref.close(r)`, botón confirm/cancel, o backdrop/escape/✕) →
   `instance.open.set(false)` → animación → `(closed)` → `finalize` resuelve la promise y
   retira la instancia.

## Manejo de errores / casos borde

- **Cerrar dos veces:** `close()` y `dismiss()` son idempotentes (si la instancia ya no
  está en la lista, no hacen nada).
- **`message` obligatorio** en confirm/alert (tipado lo exige).
- **Diálogos apilados:** cada uno es un `<ui-modal>` independiente con su propio overlay;
  el lock-scroll del body lo gestiona cada modal (al cerrarse el último se restaura).
- **Destrucción de la app:** no aplica (servicio root vive toda la sesión, como toast).

## Testing

Specs con Vitest + TestBed junto al código:

- `dialog.service.spec.ts`:
  - `confirm()` resuelve `true` al pulsar confirmar, `false` al cancelar/cerrar.
  - `alert()` resuelve al aceptar.
  - `open(Comp, {data})` inyecta `DIALOG_DATA` y `DialogRef` en el componente; `ref.close(x)`
    resuelve `ref.closed` con `x`.
  - El outlet se monta una sola vez (idempotencia de `ensureMounted`).

## Documentación

- JSDoc en `dialog.service.ts` con ejemplos (estilo del de `ToastService`).
- Página demo `src/app/pages/atoms/dialog/dialog.page.{ts,html}` siguiendo el patrón de
  las demás (PageHeader, DemoBlock, CodeBlock, PageNavService) con ejemplos vivos de
  `confirm`, `alert` y un componente dinámico de ejemplo.
- Ruta `atoms/dialog` en `src/app/app.routes.ts` y entrada en el menú lateral (donde se
  listan los demás átomos — verificar archivo del shell/nav en impl.).

## Archivos afectados

**Nuevos:**
- `src/components/atoms/dialog/dialog.types.ts`
- `src/components/atoms/dialog/dialog.service.ts`
- `src/components/atoms/dialog/dialog-outlet.component.ts`
- `src/components/atoms/dialog/dialog.service.spec.ts`
- `src/app/pages/atoms/dialog/dialog.page.ts`
- `src/app/pages/atoms/dialog/dialog.page.html`

**Modificados:**
- `src/app/app.routes.ts` (ruta nueva)
- Archivo de navegación lateral (entrada de menú)
