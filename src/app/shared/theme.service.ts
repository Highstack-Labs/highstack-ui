import { Injectable, computed, signal } from '@angular/core';

export type ThemeId = 'default' | 'indigo' | 'teal' | 'violet' | 'rose';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  /** Preview que refleja el color/gradiente real del tema (tokens.css) */
  swatch: string;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly themes: ThemeOption[] = [
    { id: 'default', label: 'Zinc', swatch: 'oklch(0.205 0.006 285.82)' },
    {
      id: 'indigo',
      label: 'Indigo',
      swatch: 'linear-gradient(135deg, oklch(0.50 0.17 277), oklch(0.60 0.16 305))',
    },
    {
      id: 'teal',
      label: 'Teal',
      swatch: 'linear-gradient(135deg, oklch(0.58 0.085 185), oklch(0.70 0.12 162))',
    },
    {
      id: 'violet',
      label: 'Violet',
      swatch: 'linear-gradient(135deg, oklch(0.53 0.18 293), oklch(0.62 0.17 333))',
    },
    {
      id: 'rose',
      label: 'Rose',
      swatch: 'linear-gradient(135deg, oklch(0.57 0.17 18), oklch(0.69 0.15 45))',
    },
  ];

  readonly current = signal<ThemeId>('default');
  readonly activeLabel = computed(
    () => this.themes.find((t) => t.id === this.current())?.label ?? 'Zinc',
  );

  readonly isDark = signal(false);

  setTheme(theme: ThemeId) {
    this.current.set(theme);
    const body = document.body;
    body.classList.forEach((className) => {
      if (className.startsWith('theme-')) {
        body.classList.remove(className);
      }
    });
    if (theme !== 'default') {
      body.classList.add(`theme-${theme}`);
    }
  }

  setDark(dark: boolean) {
    this.isDark.set(dark);
    document.body.classList.toggle('dark', dark);
  }

  toggleDark() {
    this.setDark(!this.isDark());
  }
}
