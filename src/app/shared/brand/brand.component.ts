import { Component, inject, input } from '@angular/core';
import { ThemeService } from '../theme.service';

/**
 * Wordmark oficial de HIGHSTACK. Cambia automáticamente entre la versión
 * para fondo claro y la de fondo oscuro según el modo activo.
 */
@Component({
  selector: 'app-brand',
  template: `
    <img
      [src]="theme.isDark() ? '/hs-logo-dark-mode.webp' : '/hs-logo-light-mode.webp'"
      alt="HIGHSTACK"
      class="w-auto select-none"
      [class.h-4]="size() === 'sm'"
      [class.h-5]="size() === 'md'"
      [class.h-7]="size() === 'lg'"
      draggable="false"
    />
  `,
})
export class BrandComponent {
  protected readonly theme = inject(ThemeService);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
}
