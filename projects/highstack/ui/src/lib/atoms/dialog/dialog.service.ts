import {
  ApplicationRef,
  EmbeddedViewRef,
  EnvironmentInjector,
  Injectable,
  Injector,
  Type,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import {
  AlertOptions,
  ConfirmOptions,
  DialogInstance,
  DialogOptions,
  DialogRef,
  DIALOG_DATA,
} from './dialog.types';
import { DialogOutletComponent } from './dialog-outlet.component';

/**
 * API imperativa de diálogos (modales). Auto-monta su contenedor en el `<body>`
 * al primer uso, igual que `ToastService`: cero setup para el consumidor.
 *
 * Reutiliza el `<ui-modal>` por dentro (overlay, animación, Escape/backdrop,
 * lock-scroll y accesibilidad). Toda la API se basa en `Promise`.
 *
 * @example Confirmación rápida
 * ```ts
 * private dialog = inject(DialogService);
 *
 * const ok = await this.dialog.confirm({
 *   title: '¿Eliminar proyecto?',
 *   message: 'Esta acción no se puede deshacer.',
 *   confirmText: 'Eliminar',
 *   confirmVariant: 'destructive',
 * });
 * if (ok) this.borrar();
 * ```
 *
 * @example Aviso simple
 * ```ts
 * await this.dialog.alert({ title: 'Listo', message: 'Cambios guardados.' });
 * ```
 *
 * @example Componente dinámico
 * ```ts
 * const ref = this.dialog.open(EditarUsuarioComponent, { data: { id: 42 }, size: 'lg' });
 * const result = await ref.closed;
 * ```
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);

  /** @internal Lista reactiva de diálogos abiertos (la consume el outlet). */
  readonly dialogs = signal<DialogInstance[]>([]);

  private mounted = false;
  private seq = 0;

  /**
   * Abre un componente dinámico dentro de un modal. Devuelve un `DialogRef`
   * cuya promesa `closed` se resuelve con el resultado de `ref.close()`.
   */
  open<R = unknown, D = unknown>(component: Type<unknown>, opts?: DialogOptions<D>): DialogRef<R> {
    this.ensureMounted();
    const id = ++this.seq;
    const ref = new DialogRef<R>(opts?.data ?? null);
    ref._bindClose((result) => this.dismiss(id, result));

    const injector = Injector.create({
      providers: [
        { provide: DialogRef, useValue: ref },
        { provide: DIALOG_DATA, useValue: opts?.data ?? null },
      ],
      parent: this.envInjector,
    });

    this.push({
      id,
      open: signal(true),
      options: this.baseOptions(opts),
      ref,
      kind: 'component',
      component,
      injector,
    });

    return ref as DialogRef<R>;
  }

  /** Muestra una confirmación. Resuelve `true` al confirmar, `false` al cancelar/cerrar. */
  confirm(opts: ConfirmOptions): Promise<boolean> {
    this.ensureMounted();
    const id = ++this.seq;
    const ref = new DialogRef<boolean>(null);
    ref._bindClose((result) => this.dismiss(id, result));

    this.push({
      id,
      open: signal(true),
      options: this.baseOptions(opts),
      ref,
      kind: 'confirm',
      confirm: opts,
    });

    return ref.closed.then((v) => v === true);
  }

  /** Muestra un aviso con un único botón. Resuelve al aceptar/cerrar. */
  alert(opts: AlertOptions): Promise<void> {
    this.ensureMounted();
    const id = ++this.seq;
    const ref = new DialogRef<void>(null);
    ref._bindClose((result) => this.dismiss(id, result));

    this.push({
      id,
      open: signal(true),
      options: this.baseOptions(opts),
      ref,
      kind: 'alert',
      alert: opts,
    });

    return ref.closed.then(() => undefined);
  }

  /**
   * @internal Inicia el cierre: guarda el resultado y anima la salida del modal.
   * Lo llaman `ref.close()` y los botones del outlet.
   */
  dismiss(id: number, result?: unknown) {
    const instance = this.find(id);
    if (!instance) return;
    instance.result = result;
    instance.open.set(false);
  }

  /**
   * @internal Lo invoca el evento `(closed)` del `ui-modal` cuando termina de
   * cerrarse: resuelve la promesa y retira la instancia. Idempotente.
   */
  finalize(id: number) {
    const instance = this.find(id);
    if (!instance) return;
    this.dialogs.update((list) => list.filter((d) => d.id !== id));
    instance.ref._resolve(instance.result);
  }

  private push(instance: DialogInstance) {
    this.dialogs.update((list) => [...list, instance]);
  }

  private find(id: number) {
    return this.dialogs().find((d) => d.id === id);
  }

  private baseOptions(opts?: {
    size?: DialogOptions['size'];
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    showClose?: boolean;
    ariaLabel?: string;
    title?: string;
    description?: string;
  }) {
    return {
      size: opts?.size,
      closeOnBackdrop: opts?.closeOnBackdrop,
      closeOnEscape: opts?.closeOnEscape,
      showClose: opts?.showClose,
      ariaLabel: opts?.ariaLabel,
      title: opts?.title,
      description: opts?.description,
    };
  }

  private ensureMounted() {
    if (this.mounted) return;
    const ref = createComponent(DialogOutletComponent, { environmentInjector: this.envInjector });
    this.appRef.attachView(ref.hostView);
    const node = (ref.hostView as EmbeddedViewRef<unknown>).rootNodes[0] as HTMLElement;
    document.body.appendChild(node);
    this.mounted = true;
  }
}
