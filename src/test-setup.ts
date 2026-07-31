/**
 * Setup global de los tests.
 *
 * jsdom no implementa IntersectionObserver, y el scroll-spy de las páginas del
 * showcase (PageNavService.startSpy) lo instancia en ngAfterViewInit. Sin este
 * stub cualquier spec que renderice una página entera revienta.
 */
class IntersectionObserverStub implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly scrollMargin: string = '';
  readonly thresholds: readonly number[] = [];

  constructor(_callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.root = options?.root ?? null;
    this.rootMargin = options?.rootMargin ?? '';
    const t = options?.threshold;
    this.thresholds = Array.isArray(t) ? t : [t ?? 0];
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

globalThis.IntersectionObserver ??= IntersectionObserverStub;
