import { inject, APP_INITIALIZER, Provider } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type HighstackTheme = 'indigo' | 'teal' | 'violet' | 'rose' | 'default';

export interface HighstackConfig {
  theme?: HighstackTheme;
  /** Activa el modo oscuro añadiendo la clase `dark` al <body>. */
  dark?: boolean;
}

export function provideHighstack(config: HighstackConfig): Provider[] {
  return [
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const document = inject(DOCUMENT);
        return () => {
          const body = document.body;

          // Remove pre-existing theme classes
          body.classList.forEach((className) => {
            if (className.startsWith('theme-')) {
              body.classList.remove(className);
            }
          });

          // Apply selected theme if not default
          if (config.theme && config.theme !== 'default') {
            body.classList.add(`theme-${config.theme}`);
          }

          // Apply dark mode
          body.classList.toggle('dark', !!config.dark);
        };
      },
      multi: true,
    },
  ];
}
