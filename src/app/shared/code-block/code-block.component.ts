import { Component, input, signal } from '@angular/core';

/** Bloque de código oscuro-suave con barra superior (semáforo + lenguaje + copiar). */
@Component({
  selector: 'app-code-block',
  templateUrl: './code-block.component.html',
})
export class CodeBlockComponent {
  readonly code = input<string>('');
  readonly lang = input<string>('html');

  protected readonly copied = signal(false);

  protected copy() {
    navigator.clipboard.writeText(this.code()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
