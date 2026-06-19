import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class Shell {
  currentTheme = signal<'default' | 'indigo' | 'teal' | 'violet' | 'rose'>('default');

  changeTheme(theme: 'default' | 'indigo' | 'teal' | 'violet' | 'rose') {
    this.currentTheme.set(theme);
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
}
