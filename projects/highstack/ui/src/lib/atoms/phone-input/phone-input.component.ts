import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputComponent } from '../input/input.component';
import { positionOverlay } from '../../shared/overlay-position';
import { containsTarget } from '../../shared/overlay-container';
import { OverlayPortalDirective } from '../../shared/overlay-portal.directive';
import {
  Country,
  checkNational,
  countryList,
  digitsOnly,
  filterCountries,
  formatNational,
  isInternationalText,
  normalizeE164,
  parseE164,
  regionFromLocale,
  stripTrunkPrefix,
  toE164,
} from './phone-utils';
import { BY_ISO2 } from './country-codes';

export type PhoneInputSize = 'sm' | 'md' | 'lg';

// Los tipos que asoman en la API pública se re-exportan aquí, para que
// `phone-utils` siga siendo interno (igual que `time-utils` en timepicker).
export type { Country, E164, Iso2, PhoneProblem } from './phone-utils';

/** Forma laxa de un error de validación (Signal Forms entrega { kind, message? }). */
interface PhoneValidationError {
  kind?: string;
  message?: string;
}

/** A partir de cuántos países aparece el buscador del panel. */
const SEARCH_THRESHOLD = 8;

let nextId = 0;

/**
 * Campo de teléfono con selector de código de país: compone `ui-input` (campo,
 * label y mensaje) con un botón de bandera + prefijo en el slot `prefix` y un
 * panel portalizado con buscador.
 *
 * Dos decisiones de fondo:
 *
 *  - **El valor es un string E.164** (`'+593987654321'`), nunca un objeto ni un
 *    par de campos. Es lo que se guarda en base de datos y lo que esperan las
 *    APIs de mensajería. El país se deriva del prefijo al leer.
 *  - **Cero dependencias**: la validación es de dígitos y longitud, con la tabla
 *    de `country-codes.ts`. No sabe de prefijos de operadora, así que
 *    `+593000000000` pasa. Para más rigor, validación de servidor.
 *
 * Como el timepicker, mantiene dos fuentes de verdad sincronizadas: `value` (lo
 * que ve el formulario) y `nationalText` (lo que hay en la caja). El agrupado
 * visual se aplica al salir del campo y al elegir país, no tecla por tecla: así
 * el caret nunca salta bajo el cursor.
 */
@Component({
  selector: 'ui-phone-input',
  templateUrl: './phone-input.component.html',
  imports: [InputComponent, OverlayPortalDirective],
  host: { class: 'block' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true },
  ],
})
export class PhoneInputComponent implements ControlValueAccessor {
  /** Teléfono en E.164 (`'+593987654321'`), o `''` si no hay. */
  readonly value = model<string>('');

  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly placeholder = input<string>('');
  readonly name = input<string>('');
  readonly id = input<string>(`ui-phone-input-${nextId++}`);
  readonly size = input<PhoneInputSize>('md');

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });

  /** Mensaje de error manual (tiene prioridad sobre todo lo demás). */
  readonly error = input<string>('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly errors = input<readonly PhoneValidationError[]>([]);

  readonly locale = input<string>('es-MX');

  /** ISO2 explícito del país inicial. Gana sobre la región del `locale`. */
  readonly defaultCountry = input('', { transform: upperIso2 });
  /** Lista blanca de ISO2. `[]` = los ~240 de la tabla. */
  readonly countries = input<readonly string[], readonly string[] | undefined>([], {
    transform: upperIso2List,
  });
  /** ISO2 fijados al inicio del panel, en el orden dado. */
  readonly preferredCountries = input<readonly string[], readonly string[] | undefined>([], {
    transform: upperIso2List,
  });
  readonly searchPlaceholder = input<string>('Buscar país');

  /** ISO2 del país elegido, por si se guarda aparte del teléfono. */
  readonly countryChange = output<string>();

  /** País elegido por el usuario (o resuelto de un valor). `''` = ninguno aún. */
  private readonly country = signal<string>('');
  /** Lo que hay literalmente en la caja de texto. */
  protected readonly nationalText = signal<string>('');
  /** ¿El usuario ya editó el texto? Ver `onBlur`. */
  private dirty = false;
  private focusedField = false;
  /** Error de longitud/país, revelado solo tras blur. */
  protected readonly parseError = signal<string>('');

  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  /** `defaultCountry` si es válido; si no, la región del locale. */
  protected readonly resolvedDefaultCountry = computed(() => {
    const explicit = this.defaultCountry();
    if (explicit && BY_ISO2.has(explicit)) return explicit;
    return regionFromLocale(this.locale());
  });

  /**
   * El país con el que se opera. Se resuelve en lectura y no con un
   * `country.set()` en el constructor, para que no haya carrera con el
   * `writeValue` que llega justo después de crear el componente.
   */
  protected readonly effectiveCountry = computed(() => this.country() || this.resolvedDefaultCountry());

  constructor() {
    // El valor puede cambiar desde afuera (writeValue, [(value)], formField).
    // Reformatear mientras el campo tiene foco movería el caret, así que solo se
    // sincroniza cuando no está enfocado.
    effect(() => {
      const e164 = this.value();
      if (this.focusedField) return;
      this.syncFromValue(e164);
    });
  }

  /** Precedencia: manual > longitud/país > Signal Forms (tras touched). */
  protected readonly resolvedError = computed(() => {
    if (this.error()) return this.error();
    if (this.parseError()) return this.parseError();
    if (this.touched()) {
      const first = this.errors()[0];
      if (first) return first.message ?? first.kind ?? 'Campo inválido';
    }
    return '';
  });

  // --- Lista de países ---

  /**
   * La lista del panel: filtrada por `countries`, con los `preferredCountries`
   * arriba en el orden dado y el resto por nombre localizado.
   */
  protected readonly ordered = computed(() => {
    const all = countryList(this.locale());
    const white = this.countries();
    const base = white.length ? all.filter((c) => white.includes(c.iso2)) : all;

    const preferred = this.preferredCountries()
      .map((iso2) => base.find((c) => c.iso2 === iso2))
      .filter((c): c is Country => !!c);

    const rest = base.filter((c) => !preferred.includes(c));
    return { list: [...preferred, ...rest], preferredCount: preferred.length };
  });

  protected readonly filtered = computed(() =>
    filterCountries(this.ordered().list, this.search()),
  );

  /** Con pocos países el buscador estorba más de lo que ayuda. */
  protected readonly showSearch = computed(() => this.ordered().list.length > SEARCH_THRESHOLD);

  /** El separador solo tiene sentido con la lista completa, sin filtrar. */
  protected readonly separatorAfter = computed(() =>
    this.search() ? -1 : this.ordered().preferredCount - 1,
  );

  /** El país elegido, ya con nombre y bandera. */
  protected readonly selected = computed(() => {
    const iso2 = this.effectiveCountry();
    if (!iso2) return null;
    return countryList(this.locale()).find((c) => c.iso2 === iso2) ?? null;
  });

  protected readonly triggerLabel = computed(() => {
    const country = this.selected();
    return country
      ? `País: ${country.name} (+${country.dial}). Cambiar país`
      : 'Elegir país';
  });

  // --- Texto y valor ---

  /** Rehace la caja (y el país) a partir del valor canónico. */
  private syncFromValue(raw: string) {
    const parsed =
      typeof raw === 'string' && raw
        ? parseE164(normalizeE164(raw), [this.country(), this.resolvedDefaultCountry()])
        : null;

    if (!parsed) {
      // Sin valor no se toca el país: vaciar un formulario no debe dejar el
      // campo sin bandera y por tanto inservible.
      this.nationalText.set('');
      return;
    }

    if (parsed.iso2 !== this.country()) this.country.set(parsed.iso2);
    this.nationalText.set(formatNational(parsed.national, parsed.iso2));
  }

  protected onTextInput(next: string) {
    this.dirty = true;
    // Teclear nunca muestra error: el número siempre está a medias mientras se
    // escribe. El veredicto llega en el blur.
    this.parseError.set('');

    // Pegar un número internacional completo re-detecta el país. Es la única
    // excepción a "no reformatear con el foco dentro", y es segura porque el
    // caret acaba de quedar al final del pegado.
    if (isInternationalText(next)) {
      const parsed = parseE164(normalizeE164(next), [
        this.country(),
        this.resolvedDefaultCountry(),
      ]);
      if (parsed) {
        const previous = this.effectiveCountry();
        this.country.set(parsed.iso2);
        this.nationalText.set(formatNational(parsed.national, parsed.iso2));
        this.publish(toE164(parsed.iso2, parsed.national));
        if (parsed.iso2 !== previous) this.countryChange.emit(parsed.iso2);
        return;
      }
    }

    // El texto se guarda tal cual se teclea; el agrupado se aplica al salir.
    this.nationalText.set(next);
    const iso2 = this.effectiveCountry();
    const digits = iso2 ? stripTrunkPrefix(next, iso2) : digitsOnly(next);
    this.publish(iso2 ? toE164(iso2, digits) : '');
  }

  protected onFocus() {
    this.focusedField = true;
  }

  protected onBlur() {
    this.focusedField = false;
    this.onTouched();

    // Un campo precargado por el que solo se tabuló no se toca ni se marca en
    // error: el usuario no escribió nada.
    if (!this.dirty) {
      this.syncFromValue(this.value());
      return;
    }

    const iso2 = this.effectiveCountry();
    const digits = digitsOnly(this.nationalText());
    const problem = checkNational(digits, iso2 || null);
    this.parseError.set(this.messageFor(problem, iso2));
    if (problem === 'ok') this.nationalText.set(formatNational(digits, iso2));
  }

  private messageFor(problem: ReturnType<typeof checkNational>, iso2: string): string {
    // El campo vacío no es un error: de eso se encarga `required`.
    if (problem === 'empty' || problem === 'ok') return '';
    if (problem === 'no-country') return 'Selecciona un país';

    const entry = BY_ISO2.get(iso2);
    if (!entry) return 'Número inválido';
    const [, , min, max] = entry;
    return min === max
      ? `El número debe tener ${min} dígitos`
      : `El número debe tener entre ${min} y ${max} dígitos`;
  }

  private publish(e164: string) {
    this.value.set(e164);
    this.onChange(e164);
  }

  /** Elegir país conserva los dígitos ya tecleados y los reagrupa. */
  protected pickCountry(iso2: string) {
    const previous = this.effectiveCountry();
    const digits = digitsOnly(this.nationalText());

    this.country.set(iso2);
    this.nationalText.set(formatNational(digits, iso2));
    this.publish(digits ? toE164(iso2, digits) : '');
    // Si el número ya no encaja en el país nuevo, el aviso sale en el próximo
    // blur; interrumpir al usuario justo al elegir sería gritarle de más.
    this.parseError.set('');
    this.onTouched();
    if (iso2 !== previous) this.countryChange.emit(iso2);

    this.close(false);
    // El foco vuelve al número, no al botón: elegir país es el paso previo a
    // seguir escribiendo.
    this.textInputEl()?.focus();
  }

  // --- Panel flotante ---

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);

  readonly open = signal(false);
  /** Evita el parpadeo: el panel no se ve hasta estar posicionado. */
  protected readonly ready = signal(false);
  protected readonly panelTop = signal(0);
  protected readonly panelLeft = signal(0);
  protected readonly search = signal('');
  /** Opción resaltada del listbox (se maneja con aria-activedescendant). */
  protected readonly activeIndex = signal(0);

  protected readonly listboxId = computed(() => `${this.id()}-listbox`);
  protected optionId(index: number) {
    return `${this.id()}-option-${index}`;
  }
  protected readonly activeId = computed(() => {
    const list = this.filtered();
    const index = this.activeIndex();
    return list.length && index >= 0 && index < list.length ? this.optionId(index) : null;
  });

  /**
   * El panel está portalizado a nivel de <body>, así que ya no se puede buscar
   * con un querySelector desde el host: hay que quedarse con la referencia de la
   * plantilla.
   */
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly searchRef = viewChild<ElementRef<HTMLInputElement>>('searchBox');

  private readonly scrollTeardown = (() => {
    const onScroll = () => this.open() && this.updatePosition();
    // Captura para que también reposicione al hacer scroll en un contenedor
    // interno, no solo en la ventana.
    window.addEventListener('scroll', onScroll, true);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('scroll', onScroll, true));
  })();

  protected toggle() {
    if (this.isDisabled() || this.readonly()) return;
    this.open() ? this.close() : this.openPanel();
  }

  private openPanel() {
    this.ready.set(false);
    this.search.set('');
    // Se arranca sobre el país ya elegido, no sobre el primero de la lista.
    const index = this.ordered().list.findIndex((c) => c.iso2 === this.effectiveCountry());
    this.activeIndex.set(index === -1 ? 0 : index);
    this.open.set(true);

    // afterNextRender y no requestAnimationFrame: un rAF dispara antes de que el
    // panel esté montado y lo deja mal posicionado hasta el primer resize.
    afterNextRender(
      () => {
        this.updatePosition();
        this.ready.set(true);
        this.scrollActiveIntoView();
        // El foco va al buscador (no al panel) para poder teclear de inmediato.
        (this.searchRef()?.nativeElement ?? this.panelEl())?.focus();
      },
      { injector: this.injector },
    );
  }

  protected close(returnFocus = true) {
    if (!this.open()) return;
    this.open.set(false);
    this.ready.set(false);
    if (returnFocus) this.triggerEl()?.focus();
  }

  private panelEl(): HTMLElement | null {
    return this.panelRef()?.nativeElement ?? null;
  }
  private triggerEl(): HTMLElement | null {
    return this.el.nativeElement.querySelector('[data-trigger]');
  }
  private textInputEl(): HTMLElement | null {
    return this.el.nativeElement.querySelector('input');
  }

  protected onSearch(value: string) {
    this.search.set(value);
    this.activeIndex.set(0);
  }

  /** Mantiene visible la opción activa, que puede estar muy abajo en la lista. */
  private scrollActiveIntoView() {
    const list = this.panelEl()?.querySelector<HTMLElement>('[data-list]');
    const active = list?.querySelector<HTMLElement>('[data-active="true"]');
    if (!list || !active) return;
    // scrollTop a mano y no scrollIntoView: este último también desplaza la
    // página cuando el panel está cerca de un borde.
    list.scrollTop = active.offsetTop - list.clientHeight / 2 + active.offsetHeight / 2;
  }

  private updatePosition() {
    const panel = this.panelEl();
    const trigger = this.triggerEl();
    if (!panel || !trigger) return;

    const t = trigger.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const placement = positionOverlay(
      { top: t.top, left: t.left, width: t.width, height: t.height },
      { width: p.width, height: p.height },
      { width: window.innerWidth, height: window.innerHeight },
      'start',
    );

    this.panelTop.set(placement.top);
    this.panelLeft.set(placement.left);
  }

  @HostListener('window:resize')
  protected onResize() {
    if (this.open()) this.updatePosition();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent) {
    if (!this.open()) return;
    // El panel vive fuera del host (portalizado): hay que preguntar por los dos,
    // o cualquier clic dentro de la lista cerraría el panel.
    if (!containsTarget(event.target as Node, this.el.nativeElement, this.panelEl())) {
      this.close(false);
    }
  }

  /**
   * Teclado del panel. Va colgado del propio panel en la plantilla: al estar
   * portalizado fuera del host, un @HostListener ya no vería estas teclas.
   *
   * A diferencia del select y del timepicker, el foco NO se mueve entre las
   * opciones: se queda en el buscador y la opción activa se señala con
   * `aria-activedescendant`, para poder seguir escribiendo mientras se navega.
   * Espacio no se toca: tiene que escribir un espacio en la búsqueda.
   */
  protected onPanelKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    const total = this.filtered().length;

    if (event.key === 'Enter') {
      event.preventDefault();
      const country = this.filtered()[this.activeIndex()];
      if (country) this.pickCountry(country.iso2);
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

  /**
   * El panel no es modal: no hay trampa de foco, así que tabular fuera lo
   * cierra. `relatedTarget` es a dónde va el foco; si sigue dentro del host o
   * del propio panel no se cierra nada.
   */
  protected onPanelFocusout(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (containsTarget(next, this.el.nativeElement, this.panelEl())) return;
    this.close(false);
  }

  // --- ControlValueAccessor ---
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.value.set(this.canonicalize(value));
    this.syncFromValue(this.value());
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

  /**
   * Único embudo para lo que llega de fuera. Un número sin `+` ni prefijo de
   * salida se toma como **nacional** del país actual (los back-ends guardan
   * formato local todo el tiempo); la basura se descarta a `''` dejando la
   * bandera intacta.
   */
  private canonicalize(raw: unknown): string {
    if (typeof raw !== 'string' || !raw.trim()) return '';

    if (isInternationalText(raw)) {
      const parsed = parseE164(normalizeE164(raw), [
        this.country(),
        this.resolvedDefaultCountry(),
      ]);
      if (!parsed) return '';
      if (parsed.iso2 !== this.country()) this.country.set(parsed.iso2);
      return toE164(parsed.iso2, parsed.national);
    }

    const iso2 = this.effectiveCountry();
    if (!iso2) return '';
    return toE164(iso2, stripTrunkPrefix(raw, iso2));
  }
}

function upperIso2(value: string | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function upperIso2List(value: readonly string[] | undefined): readonly string[] {
  return (value ?? []).map(upperIso2).filter(Boolean);
}
