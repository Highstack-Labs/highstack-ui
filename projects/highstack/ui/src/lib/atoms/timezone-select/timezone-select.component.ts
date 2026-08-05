import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LabelComponent } from '../label/label.component';
import {
  ModalComponent,
  ModalHeaderComponent,
  ModalTitleComponent,
  ModalDescriptionComponent,
} from '../modal/modal.component';
import {
  TimezoneGroup,
  TimezoneOption,
  filterTimezones,
  groupByRegion,
  listTimezones,
  toTimezoneOption,
} from './timezone-utils';

export type TimezoneSelectSize = 'sm' | 'md' | 'lg';

interface TimezoneValidationError {
  kind?: string;
  message?: string;
}

/** Una zona ya situada en la lista plana, para poder resaltarla con el teclado. */
interface IndexedZone {
  zone: TimezoneOption;
  index: number;
}

interface RenderGroup extends TimezoneGroup {
  items: IndexedZone[];
}

let nextId = 0;

/**
 * Selector de zona horaria: un trigger igual al del `ui-select` que abre un
 * `ui-modal` con buscador y la lista completa de zonas IANA del runtime.
 *
 * El valor es el identificador IANA (`America/Bogota`). Se integra con
 * formularios por las tres vías de la librería: `[(value)]`, `ControlValueAccessor`
 * (ngModel / reactive) y Signal Forms (`[formField]`).
 *
 * @example
 * ```html
 * <ui-timezone-select label="Zona horaria" [(value)]="zona" />
 * <ui-timezone-select label="Zona horaria" [formField]="form.zona" />
 * ```
 *
 * ```ts
 * // Arrancar en la zona del propio dispositivo:
 * import { getLocalTimezone } from '@highstacklabs2026/ui';
 * zona = signal(getLocalTimezone());
 * ```
 */
@Component({
  selector: 'ui-timezone-select',
  templateUrl: './timezone-select.component.html',
  imports: [
    LabelComponent,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleComponent,
    ModalDescriptionComponent,
  ],
  host: { class: 'block' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimezoneSelectComponent),
      multi: true,
    },
  ],
})
export class TimezoneSelectComponent implements ControlValueAccessor {
  /** Identificador IANA seleccionado. Two-way: `[(value)]`. */
  readonly value = model<string>('');

  readonly placeholder = input<string>('Selecciona una zona horaria…');
  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly size = input<TimezoneSelectSize>('md');
  readonly id = input<string>(`ui-timezone-select-${nextId++}`);

  /** Título del modal. */
  readonly modalTitle = input<string>('Zona horaria');
  readonly searchPlaceholder = input<string>('Buscar ciudad, región o GMT…');

  /** Agrupa la lista por región con encabezados. Ponlo a `false` para una lista plana. */
  readonly grouped = input(true, { transform: booleanAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly errors = input<readonly TimezoneValidationError[]>([]);

  /** Estado del modal. */
  readonly open = signal(false);

  protected readonly search = signal('');
  /** Opción resaltada, señalada con `aria-activedescendant`. */
  protected readonly activeIndex = signal(0);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly searchRef = viewChild<ElementRef<HTMLInputElement>>('searchBox');

  /**
   * La lista se calcula una sola vez por instancia: recorrer las ~420 zonas
   * preguntándole el desfase a `Intl` no es gratis, y el resultado solo
   * cambiaría al cruzar un salto de horario de verano.
   */
  private readonly allZones = listTimezones();

  protected readonly filtered = computed(() => filterTimezones(this.allZones, this.search()));

  /**
   * Los grupos que se pintan. El orden de esta estructura es el orden visual, y
   * de ahí sale la lista plana que navega el teclado: si se numerase antes de
   * agrupar, las flechas saltarían de un sitio a otro.
   */
  protected readonly groups = computed<RenderGroup[]>(() => {
    const list = this.filtered();
    // Sin resultados no se devuelve un grupo vacío, para que el `@empty` de la
    // plantilla llegue a dispararse también con `grouped=false`.
    if (!list.length) return [];

    const groups: TimezoneGroup[] = this.grouped()
      ? groupByRegion(list)
      : [{ region: '', regionLabel: '', zones: list }];

    let index = 0;
    return groups.map((group) => ({
      ...group,
      items: group.zones.map((zone) => ({ zone, index: index++ })),
    }));
  });

  /** Las zonas en el mismo orden en que se ven, que es como navegan las flechas. */
  protected readonly flat = computed(() => this.groups().flatMap((g) => g.items.map((i) => i.zone)));

  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  /** La zona elegida. Si el valor no está en la lista del runtime, se deriva igual. */
  protected readonly selected = computed<TimezoneOption | null>(() => {
    const id = this.value();
    if (!id) return null;
    return this.allZones.find((zone) => zone.id === id) ?? toTimezoneOption(id);
  });

  protected readonly errorMessage = computed(() => {
    if (this.error()) return this.error();
    if (this.touched()) {
      const first = this.errors()[0];
      if (first) return first.message ?? first.kind ?? 'Campo inválido';
    }
    return '';
  });
  protected readonly hasError = computed(
    () => !!this.errorMessage() || (this.invalid() && this.touched()),
  );

  protected readonly triggerClasses = computed(() => {
    const sizeMap: Record<TimezoneSelectSize, string> = {
      sm: 'h-8 px-2.5 text-xs rounded-lg',
      md: 'h-9 px-3 text-sm rounded-[10px]',
      lg: 'h-10 px-3.5 text-base rounded-[10px]',
    };
    const base =
      'flex w-full items-center justify-between gap-2 border bg-[var(--color-background)] transition-all outline-none cursor-pointer text-left';
    const state = this.hasError()
      ? 'border-[var(--color-destructive)] focus-visible:ring-[3px] focus-visible:ring-[var(--color-destructive)]/25'
      : 'border-[var(--color-input)] focus-visible:border-[var(--color-ring)] focus-visible:ring-[3px] focus-visible:ring-[var(--color-ring)]/40';
    const disabled = this.isDisabled()
      ? 'opacity-50 cursor-not-allowed bg-[var(--color-muted)]/40'
      : '';
    return [base, sizeMap[this.size()], state, disabled].join(' ');
  });

  /** Solo apunta a un `<p>` que realmente se renderiza (error con texto o hint). */
  protected readonly describedById = computed(() =>
    this.errorMessage() || this.hint() ? `${this.id()}-desc` : null,
  );

  protected readonly listboxId = computed(() => `${this.id()}-listbox`);
  protected optionId(index: number) {
    return `${this.id()}-option-${index}`;
  }
  protected readonly activeId = computed(() => {
    const total = this.flat().length;
    const index = this.activeIndex();
    return total && index >= 0 && index < total ? this.optionId(index) : null;
  });

  protected openModal() {
    if (this.isDisabled()) return;
    this.search.set('');
    // Se arranca sobre la zona ya elegida, no sobre la primera de la lista.
    const index = this.flat().findIndex((zone) => zone.id === this.value());
    this.activeIndex.set(index === -1 ? 0 : index);
    this.open.set(true);
  }

  /**
   * El modal ya enfocó su panel al abrirse; el foco se mueve al buscador para
   * poder teclear de inmediato.
   */
  protected onOpened() {
    this.searchRef()?.nativeElement.focus();
    this.scrollActiveIntoView();
  }

  /** El modal devuelve el foco al trigger por su cuenta al cerrarse. */
  protected onClosed() {
    this.onTouched();
  }

  protected onSearch(value: string) {
    this.search.set(value);
    this.activeIndex.set(0);
    // La lista cambió entera: hay que volver arriba, o se queda mirando el
    // scroll de la búsqueda anterior.
    this.scrollActiveIntoView();
  }

  /** Elige una zona y cierra el modal. */
  choose(id: string) {
    this.value.set(id);
    this.onChange(id);
    this.onTouched();
    this.open.set(false);
  }

  /**
   * Teclado del buscador. El foco NO se mueve entre las opciones: se queda en
   * el input y la opción activa se señala con `aria-activedescendant`, para
   * poder seguir escribiendo mientras se navega. Escape no se toca: ya lo
   * gestiona el modal.
   */
  protected onSearchKeydown(event: KeyboardEvent) {
    const total = this.flat().length;

    if (event.key === 'Enter') {
      event.preventDefault();
      const zone = this.flat()[this.activeIndex()];
      if (zone) this.choose(zone.id);
      return;
    }

    if (!total) return;

    const move = (next: number) => {
      event.preventDefault();
      this.activeIndex.set(((next % total) + total) % total);
      this.scrollActiveIntoView();
    };

    switch (event.key) {
      case 'ArrowDown':
        return move(this.activeIndex() + 1);
      case 'ArrowUp':
        return move(this.activeIndex() - 1);
      case 'PageDown':
        return move(Math.min(this.activeIndex() + 10, total - 1));
      case 'PageUp':
        return move(Math.max(this.activeIndex() - 10, 0));
      case 'Home':
        return move(0);
      case 'End':
        return move(total - 1);
    }
  }

  /** Mantiene visible la opción activa, que puede estar muy abajo en la lista. */
  private scrollActiveIntoView() {
    // En un microtask: al llegar desde una tecla, la clase `data-active` aún no
    // se ha pintado en la fila nueva.
    queueMicrotask(() => {
      const root = this.el.nativeElement as HTMLElement;
      const list = root.querySelector<HTMLElement>('[data-list]');
      const active = list?.querySelector<HTMLElement>('[data-active="true"]');
      if (!list || !active) return;
      // scrollTop a mano y no scrollIntoView: este último también desplaza la
      // página por detrás del modal.
      list.scrollTop = active.offsetTop - list.clientHeight / 2 + active.offsetHeight / 2;
    });
  }

  // --- ControlValueAccessor ---
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
