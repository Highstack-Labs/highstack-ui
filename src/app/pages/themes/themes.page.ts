import { Component, inject } from '@angular/core';
import { ThemeService } from '../../shared/theme.service';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';

@Component({
  selector: 'app-themes-page',
  imports: [CodeBlockComponent],
  templateUrl: './themes.page.html',
})
export class ThemesPage {
  protected readonly theme = inject(ThemeService);

  // 1. Importar los estilos (incluye los tokens de tema)
  readonly stylesExample = `/* En tu archivo de estilos global (styles.css) */
@import '@highstacklabs2026/ui/styles.css';`;

  // 2. Aplicar el tema con el provider de la librería
  readonly providerExample = `import { ApplicationConfig } from '@angular/core';
import { provideHighstack } from '@highstacklabs2026/ui';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHighstack({ theme: 'indigo' }),
    // ...otros providers
  ],
};`;

  // Alternativa: aplicar la clase manualmente
  readonly manualExample = `<!-- O agrega la clase del tema al <body> manualmente -->
<body class="theme-indigo">
  ...
</body>

<!-- Temas disponibles: theme-indigo | theme-teal | theme-violet | theme-rose -->
<!-- (sin clase = tema por defecto / Zinc) -->`;
}
