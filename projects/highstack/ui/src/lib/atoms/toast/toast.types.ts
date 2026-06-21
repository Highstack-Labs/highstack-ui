export type ToastType = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastAction {
  label: string;
  handler: () => void;
}

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  /** ms antes de cerrarse solo; 0 = no auto-cerrar. */
  duration?: number;
  action?: ToastAction;
}

/** Toast ya creado (con id interno). */
export interface Toast {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
  action?: ToastAction;
}
