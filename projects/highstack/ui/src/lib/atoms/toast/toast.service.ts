import {
  ApplicationRef,
  EmbeddedViewRef,
  EnvironmentInjector,
  Injectable,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import { Toast, ToastOptions, ToastPosition, ToastType } from './toast.types';
import { ToasterComponent } from './toaster.component';

const MAX_TOASTS = 5;

/**
 * API de notificaciones. Auto-monta el contenedor en el <body> al primer uso
 * (cero setup para el consumidor).
 *
 *   private toast = inject(ToastService);
 *   toast.success('Guardado');
 *   toast.error('Falló', { title: 'Error' });
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);

  readonly toasts = signal<Toast[]>([]);
  readonly position = signal<ToastPosition>('bottom-right');

  private mounted = false;
  private seq = 0;

  show(opts: ToastOptions): number {
    this.ensureMounted();
    const id = ++this.seq;
    const toast: Toast = {
      id,
      type: opts.type ?? 'info',
      title: opts.title,
      message: opts.message,
      action: opts.action,
    };
    this.toasts.update((list) => [...list, toast].slice(-MAX_TOASTS));

    const duration = opts.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
    return id;
  }

  success(message: string, opts?: Omit<ToastOptions, 'type' | 'message'>) {
    return this.show({ ...opts, type: 'success', message });
  }
  error(message: string, opts?: Omit<ToastOptions, 'type' | 'message'>) {
    return this.show({ ...opts, type: 'error', message });
  }
  warning(message: string, opts?: Omit<ToastOptions, 'type' | 'message'>) {
    return this.show({ ...opts, type: 'warning', message });
  }
  info(message: string, opts?: Omit<ToastOptions, 'type' | 'message'>) {
    return this.show({ ...opts, type: 'info', message });
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  setPosition(position: ToastPosition) {
    this.position.set(position);
  }

  private ensureMounted() {
    if (this.mounted) return;
    const ref = createComponent(ToasterComponent, { environmentInjector: this.envInjector });
    this.appRef.attachView(ref.hostView);
    const node = (ref.hostView as EmbeddedViewRef<unknown>).rootNodes[0] as HTMLElement;
    document.body.appendChild(node);
    this.mounted = true;
  }
}

export type { ToastType };
