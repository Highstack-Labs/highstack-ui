import { Component, signal } from '@angular/core';
import { ButtonComponent } from '../../../components/atoms/button/button.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';

@Component({
  selector: 'app-ai-guide-page',
  imports: [ButtonComponent, PageHeaderComponent, CodeBlockComponent],
  templateUrl: './ai-guide.page.html',
})
export class AiGuidePage {
  protected readonly content = signal<string>('Cargando…');
  protected readonly copied = signal(false);
  protected readonly fileName = 'AI-USAGE-GUIDE.md';

  constructor() {
    fetch(this.fileName)
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((text) => this.content.set(text))
      .catch(() => this.content.set('No se pudo cargar la guía.'));
  }

  protected copyAll() {
    navigator.clipboard.writeText(this.content()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
