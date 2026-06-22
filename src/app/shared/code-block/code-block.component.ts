import { Component, input, signal } from '@angular/core';

/** Bloque de código oscuro-suave con barra superior (semáforo + etiqueta + copiar). */
@Component({
  selector: 'app-code-block',
  templateUrl: './code-block.component.html',
})
export class CodeBlockComponent {
  readonly code = input<string>('');
  readonly lang = input<string>('html');
  /** Si se pasa, se muestra como nombre de archivo en lugar del lenguaje. */
  readonly filename = input<string>('');
  /** Altura máxima del área de código (p. ej. '60vh'); por defecto sin límite. */
  readonly maxHeight = input<string>('');

  protected readonly copied = signal(false);

  protected copy() {
    navigator.clipboard.writeText(this.code()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
