import { InjectionToken, Type, WritableSignal, Injector } from '@angular/core';
import { ModalSize } from '../modal/modal.component';
import { ButtonVariant } from '../button/button.component';

/** Opciones comunes que se reenvían al `<ui-modal>` interno. */
export interface DialogBaseOptions {
  /** Tamaño del panel. */
  size?: ModalSize;
  /** Cerrar al hacer clic en el fondo. */
  closeOnBackdrop?: boolean;
  /** Cerrar al pulsar Escape. */
  closeOnEscape?: boolean;
  /** Mostrar el botón (X) de cerrar. */
  showClose?: boolean;
  /** Etiqueta accesible del diálogo. */
  ariaLabel?: string;
}

/** Opciones para `dialog.open(Componente, opts)`. */
export interface DialogOptions<D = unknown> extends DialogBaseOptions {
  /** Datos inyectados en el componente vía el token `DIALOG_DATA`. */
  data?: D;
  /**
   * Título opcional. Si lo pasas, el diálogo renderiza un header automático
   * (con su propio espaciado y hueco para la X) encima del componente, sin que
   * tengas que escribirlo dentro.
   */
  title?: string;
  /** Descripción opcional bajo el título del header automático. */
  description?: string;
}

/** Opciones para `dialog.confirm(opts)`. */
export interface ConfirmOptions extends DialogBaseOptions {
  title?: string;
  message: string;
  /** Texto del botón de confirmar. Por defecto 'Confirmar'. */
  confirmText?: string;
  /** Texto del botón de cancelar. Por defecto 'Cancelar'. */
  cancelText?: string;
  /** Variante del botón de confirmar. Usa 'destructive' para acciones peligrosas. */
  confirmVariant?: ButtonVariant;
}

/** Opciones para `dialog.alert(opts)`. */
export interface AlertOptions extends DialogBaseOptions {
  title?: string;
  message: string;
  /** Texto del botón de aceptar. Por defecto 'Aceptar'. */
  confirmText?: string;
}

/**
 * Token para inyectar los datos pasados en `dialog.open(Comp, { data })`.
 *
 * @example
 * ```ts
 * export class MiDialogo {
 *   protected data = inject(DIALOG_DATA);
 * }
 * ```
 */
export const DIALOG_DATA = new InjectionToken<unknown>('DIALOG_DATA');

/**
 * Referencia a un diálogo abierto. Se inyecta en el componente dinámico para
 * leer los datos y cerrarse devolviendo un resultado.
 *
 * @example
 * ```ts
 * export class MiDialogo {
 *   private ref = inject(DialogRef<string>);
 *   guardar() { this.ref.close('ok'); }
 * }
 * ```
 */
export class DialogRef<R = unknown> {
  /** Resuelve cuando el diálogo termina de cerrarse, con el resultado de `close()`. */
  readonly closed: Promise<R | undefined>;

  /** @internal Resuelve la promesa `closed`. Lo invoca el servicio al finalizar. */
  _resolve!: (value: R | undefined) => void;

  /** @internal Cierra el diálogo. Lo configura el servicio. */
  private _close: (result?: R) => void = () => {};

  constructor(
    /** Datos pasados en `open({ data })`. */
    readonly data: unknown,
  ) {
    this.closed = new Promise<R | undefined>((resolve) => {
      this._resolve = resolve;
    });
  }

  /** @internal Conecta `close()` con el servicio. */
  _bindClose(fn: (result?: R) => void) {
    this._close = fn;
  }

  /** Cierra el diálogo y resuelve `closed` con `result`. */
  close(result?: R) {
    this._close(result);
  }
}

/** @internal Instancia de un diálogo abierto, mantenida por el servicio. */
export interface DialogInstance {
  id: number;
  open: WritableSignal<boolean>;
  options: DialogBaseOptions & { title?: string; description?: string };
  // `any` evita el conflicto de varianza del parámetro de `_resolve` al guardar
  // refs de distintos tipos (DialogRef<boolean>, <void>, <R>) en una misma lista.
  ref: DialogRef<any>;
  kind: 'component' | 'confirm' | 'alert';
  component?: Type<unknown>;
  injector?: Injector;
  confirm?: ConfirmOptions;
  alert?: AlertOptions;
  result?: unknown;
}
