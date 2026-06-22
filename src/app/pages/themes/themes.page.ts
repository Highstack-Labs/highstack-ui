import { Component, inject } from '@angular/core';
import { ThemeService } from '../../shared/theme.service';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-themes-page',
  imports: [CodeBlockComponent, PageHeaderComponent],
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
    provideHighstack({ theme: 'indigo', dark: true }),
    // ...otros providers
  ],
};`;

  // Modo oscuro: clase .dark en el <body>
  readonly darkExample = `<!-- Activa el modo oscuro con la clase .dark en el <body> -->
<body class="dark">           <!-- oscuro -->
<body class="dark theme-indigo"> <!-- oscuro + tema indigo -->

<!-- O alterna con TypeScript -->
document.body.classList.toggle('dark');`;

  // Alternativa: aplicar la clase manualmente
  readonly manualExample = `<!-- O agrega la clase del tema al <body> manualmente -->
<body class="theme-indigo">
  ...
</body>

<!-- Temas disponibles: theme-indigo | theme-teal | theme-violet | theme-rose -->
<!-- (sin clase = tema por defecto / Zinc) -->`;
}
