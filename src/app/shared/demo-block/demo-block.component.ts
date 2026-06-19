import { Component, input, signal } from '@angular/core';
import { CodeBlockComponent } from '../code-block/code-block.component';

/**
 * Tarjeta de demo estilo shadcn: toggle Preview/Código.
 * Proyecta el preview vivo y recibe el código por input.
 */
@Component({
  selector: 'app-demo-block',
  imports: [CodeBlockComponent],
  templateUrl: './demo-block.component.html',
})
export class DemoBlockComponent {
  readonly title = input<string>('');
  readonly code = input<string>('');

  protected readonly view = signal<'preview' | 'code'>('preview');
}
