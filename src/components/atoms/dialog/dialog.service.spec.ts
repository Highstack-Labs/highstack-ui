import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DialogService } from './dialog.service';
import { DialogRef, DIALOG_DATA } from './dialog.types';

@Component({ selector: 'test-dialog', template: `{{ data?.name }}` })
class TestDialogComponent {
  readonly ref = inject(DialogRef);
  readonly data = inject(DIALOG_DATA) as { name: string } | null;
}

/** Avanza la animación de salida del `ui-modal` y la finalización del diálogo. */
async function flushClose(svc: DialogService, id: number) {
  // El outlet llama a finalize en el evento (closed) del modal. En el test lo
  // disparamos directamente para resolver la promesa sin esperar al DOM.
  svc.finalize(id);
  await Promise.resolve();
}

describe('DialogService', () => {
  let svc: DialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(DialogService);
  });

  it('confirm resuelve true al confirmar', async () => {
    const p = svc.confirm({ message: '¿Seguro?' });
    const id = svc.dialogs()[0].id;
    svc.dismiss(id, true);
    await flushClose(svc, id);
    expect(await p).toBe(true);
  });

  it('confirm resuelve false al cancelar', async () => {
    const p = svc.confirm({ message: '¿Seguro?' });
    const id = svc.dialogs()[0].id;
    svc.dismiss(id, false);
    await flushClose(svc, id);
    expect(await p).toBe(false);
  });

  it('confirm resuelve false al cerrar sin elegir (backdrop/escape)', async () => {
    const p = svc.confirm({ message: '¿Seguro?' });
    const id = svc.dialogs()[0].id;
    // Cierre directo del modal sin pasar por dismiss => result undefined.
    await flushClose(svc, id);
    expect(await p).toBe(false);
  });

  it('alert resuelve al aceptar', async () => {
    const p = svc.alert({ message: 'Listo' });
    const id = svc.dialogs()[0].id;
    svc.dismiss(id, undefined);
    await flushClose(svc, id);
    await expect(p).resolves.toBeUndefined();
  });

  it('open inyecta DIALOG_DATA y DialogRef, y close() resuelve closed con el resultado', async () => {
    const ref = svc.open<string, { name: string }>(TestDialogComponent, { data: { name: 'Ada' } });
    const id = svc.dialogs()[0].id;
    expect(svc.dialogs()[0].injector).toBeTruthy();
    expect(ref.data).toEqual({ name: 'Ada' });

    ref.close('guardado');
    await flushClose(svc, id);
    expect(await ref.closed).toBe('guardado');
  });

  it('finalize es idempotente y retira la instancia de la lista', async () => {
    svc.confirm({ message: 'x' });
    const id = svc.dialogs()[0].id;
    svc.finalize(id);
    expect(svc.dialogs().length).toBe(0);
    expect(() => svc.finalize(id)).not.toThrow();
  });
});
