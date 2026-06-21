import { Component, computed, inject } from '@angular/core';
import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';
import { ToastPosition } from './toast.types';

/** Contenedor flotante de toasts. Se auto-monta vía ToastService (interno). */
@Component({
  selector: 'ui-toaster',
  imports: [ToastComponent],
  template: `
    <div [class]="containerClasses()">
      @for (t of svc.toasts(); track t.id) {
        <ui-toast [toast]="t" (close)="svc.dismiss(t.id)" />
      }
    </div>
  `,
})
export class ToasterComponent {
  protected readonly svc = inject(ToastService);

  protected readonly containerClasses = computed(() => {
    const base = 'fixed z-[100] flex flex-col gap-2 p-4 pointer-events-none [&>*]:pointer-events-auto';
    const posMap: Record<ToastPosition, string> = {
      'top-left': 'top-0 left-0 items-start',
      'top-center': 'top-0 left-1/2 -translate-x-1/2 items-center',
      'top-right': 'top-0 right-0 items-end',
      'bottom-left': 'bottom-0 left-0 items-start flex-col-reverse',
      'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 items-center flex-col-reverse',
      'bottom-right': 'bottom-0 right-0 items-end flex-col-reverse',
    };
    return [base, posMap[this.svc.position()]].join(' ');
  });
}
