import { Component, input } from '@angular/core';

/**
 * Header sticky reutilizable de cada página de la documentación.
 * Barra glass con un glow ambiental detrás del título (profundidad sutil).
 * `actions` se proyecta a la derecha (botones, enlaces, etc.).
 */
@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
})
export class PageHeaderComponent {
  /** Texto que sigue a "highstack-ui ·" (p. ej. "Button"). */
  readonly section = input.required<string>();
  readonly subtitle = input<string>('');
  /** Ancho del contenido centrado, para coincidir con el de la página. */
  readonly width = input<'5xl' | '3xl'>('5xl');
}
