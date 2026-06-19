import { Injectable, signal } from '@angular/core';

export interface PageSection {
  id: string;
  label: string;
}

/**
 * Comparte las secciones de la página activa con el shell para que la barra
 * derecha muestre el nav "En esta página" (scroll-spy).
 */
@Injectable({ providedIn: 'root' })
export class PageNavService {
  readonly sections = signal<PageSection[]>([]);
  readonly active = signal<string>('');

  setSections(sections: PageSection[]) {
    this.sections.set(sections);
  }

  setActive(id: string) {
    this.active.set(id);
  }

  clear() {
    this.sections.set([]);
    this.active.set('');
  }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
