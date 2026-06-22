import { Injectable, signal } from '@angular/core';

export interface PageSection {
  id: string;
  label: string;
}

/** Id del contenedor scrolleable del shell (ver shell.html). */
const SCROLL_ROOT_ID = 'app-content';

/**
 * Comparte las secciones de la página activa con el shell para que la barra
 * derecha muestre el nav "En esta página" y gestiona el scroll-spy.
 */
@Injectable({ providedIn: 'root' })
export class PageNavService {
  readonly sections = signal<PageSection[]>([]);
  readonly active = signal<string>('');

  private observer?: IntersectionObserver;
  private scrollEl?: HTMLElement;
  private readonly visible = new Set<string>();

  /** Inicia el scroll-spy para las secciones dadas (llamar en ngAfterViewInit). */
  startSpy(sections: PageSection[]) {
    this.stopSpy();
    this.sections.set(sections);
    this.active.set(sections[0]?.id ?? '');
    this.visible.clear();

    this.scrollEl = document.getElementById(SCROLL_ROOT_ID) ?? undefined;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) this.visible.add(e.target.id);
          else this.visible.delete(e.target.id);
        }
        this.refresh();
      },
      { root: this.scrollEl ?? null, rootMargin: '-10% 0px -70% 0px', threshold: 0 },
    );

    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) this.observer.observe(el);
    }

    this.scrollEl?.addEventListener('scroll', this.refresh, { passive: true });
  }

  stopSpy() {
    this.observer?.disconnect();
    this.observer = undefined;
    this.scrollEl?.removeEventListener('scroll', this.refresh);
    this.scrollEl = undefined;
    this.visible.clear();
    this.sections.set([]);
    this.active.set('');
  }

  /** Decide la sección activa: la última al llegar al fondo, si no la primera visible. */
  private readonly refresh = () => {
    const list = this.sections();
    const el = this.scrollEl;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
      const last = list[list.length - 1];
      if (last) {
        this.active.set(last.id);
        return;
      }
    }
    const firstVisible = list.find((s) => this.visible.has(s.id));
    if (firstVisible) this.active.set(firstVisible.id);
  };

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
