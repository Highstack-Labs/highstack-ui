# Diseño: `ui-calendar` + `ui-datepicker` (incremento 1 — fecha única)

**Fecha:** 2026-07-31
**Estado:** Aprobado (diseño)

## Problema

Falta un selector de fechas en la librería. Hoy no hay nada: el repo no tiene una sola
utilidad de fechas, ninguna dependencia (`date-fns`, `dayjs`, `luxon`), ni un solo uso de
`Intl.DateTimeFormat`. La única `Date` en `src/` y `projects/` son datos mock de la tabla.

## Alcance: este es el incremento 1 de 4

El pedido original cubría cuatro modos (fecha única, rango, fecha+hora, mes/año). Cada uno
añade un eje de complejidad distinto, así que se construyen por separado, cada uno con su
spec y su plan:

| # | Entregable | Estado |
|---|---|---|
| **1** | Calendario base + fecha única | **este documento** |
| 2 | Modo rango | pendiente |
| 3 | Modo mes/año | pendiente |
| 4 | Fecha + hora | pendiente |

El incremento 1 carga con todos los cimientos (aritmética de fechas, grid, teclado,
overlay, contrato de formularios), por lo que los siguientes son sustancialmente más
baratos. Cada incremento es publicable por sí solo.

**El tipo del valor se va a tener que revisar en los incrementos 2 y 4.** Un `string` ISO
`'YYYY-MM-DD'` no representa un rango (son dos valores) ni una fecha con hora
(`'2026-07-31T14:30'`). Esa decisión se toma cuando lleguemos ahí, con el caso base ya
resuelto — no se adivina ahora.

## No-objetivos (YAGNI)

- Los modos rango, mes/año y fecha+hora (incrementos 2-4).
- Botones de "Hoy" y "Limpiar" en el panel. El input es editable: borrar el texto ya limpia
  el valor. Un botón sería una segunda forma de hacer lo mismo.
- Selección de mes/año desde el encabezado (los dropdowns de "julio ▾ 2026 ▾"). La
  navegación es con flechas ‹ › y con PageUp/PageDown. Se puede añadir después sin romper
  la API.
- Retrofitear `ui-select`, `ui-dropdown` y `ui-popover` para que usen el nuevo util de
  posicionamiento. Ver "Deuda técnica adyacente".
- Semanas numeradas, calendarios no gregorianos, festivos precargados.

---

## Arquitectura

Composición, no un componente monolítico: el calendario no sabe nada de overlays ni de
inputs, y por eso se puede embeber suelto.

```
src/components/atoms/calendar/date-utils.ts              TS puro, sin Angular
src/components/atoms/calendar/calendar.component.ts|html    <ui-calendar>
src/components/atoms/datepicker/datepicker.component.ts|html  <ui-datepicker>
src/components/shared/overlay-position.ts                TS puro — carpeta nueva
```

`src/components/shared/` no existe todavía; se crea con este trabajo. Hoy lo único
compartido entre componentes es `LabelComponent`, importado por ruta relativa desde
`atoms/label/`.

Los cuatro se duplican en `projects/highstack/ui/src/lib/...` (ver CLAUDE.md).
`CalendarComponent` y `DatepickerComponent` se exportan en `public-api.ts`; `date-utils` y
`overlay-position` quedan **internos** — no son API pública y pueden cambiar sin ser un
breaking change.

### Por qué un util de posicionamiento

La lógica de overlay está copiada literalmente en cuatro archivos: `MARGIN = 8` está
declarado en `select.component.ts:23`, `dropdown.component.ts:22`, `popover.component.ts:35`
y `tooltip.directive.ts:16`. El flip, el click-afuera y la señal `ready` anti-parpadeo son
copy-paste en cada uno.

`overlay-position.ts` extrae solo el cálculo (entra un rect de trigger y un tamaño de panel,
sale `{ top, left, flipped }`), y **solo lo consume el datepicker por ahora**. Es una función
pura, testeable sin DOM. Retrofitear los otros tres es un cambio aparte.

---

## `date-utils.ts`

### La propiedad que hace esto simple

`'YYYY-MM-DD'` tiene orden lexicográfico idéntico al cronológico: `'2026-01-05' <
'2026-11-02'` es cierto como comparación de strings. Por lo tanto **`min`/`max`, ordenar y
"¿está en rango?" son comparaciones de strings directas** — sin parsear, sin `Date`, sin
zonas horarias.

### Superficie

```ts
type IsoDate = string; // 'YYYY-MM-DD'

parseIso(s: string): { y: number; m: number; d: number } | null
toIso(y: number, m: number, d: number): IsoDate
today(): IsoDate
addDays(iso: IsoDate, n: number): IsoDate
addMonths(iso: IsoDate, n: number): IsoDate
daysInMonth(y: number, m: number): number
weekday(iso: IsoDate): 0 | 1 | 2 | 3 | 4 | 5 | 6   // 0 = domingo
buildMonthGrid(monthIso: IsoDate, weekStartsOn: number): IsoDate[]  // 42 celdas
isValidIso(s: string): boolean
```

Reglas que no son negociables:

- **`addMonths` trunca el día.** 31 de enero + 1 mes = 28 de febrero (o 29 en bisiesto), no
  3 de marzo.
- **`parseIso` valida el día contra el mes real.** `'2026-02-30'` y `'2026-13-01'` devuelven
  `null`.
- **`new Date()` se usa en exactamente dos lugares**: `today()`, y construir la fecha que se
  le pasa a `Intl` para formatear. En el segundo caso siempre se construye con `Date.UTC()`
  y se formatea con `timeZone: 'UTC'`, para que el nombre del mes nunca se corra un día.

### El grid siempre es de 6 semanas

`buildMonthGrid` devuelve **siempre 42 celdas**, rellenando con días del mes anterior y
siguiente. Un mes de 28 días que empieza en lunes cabe en 4 semanas y otros necesitan 5 o 6;
si el grid cambia de alto, el panel salta al navegar entre meses.

---

## Localización vía `Intl`

Sin hardcodear nombres ni formatos:

| Qué | Cómo |
|---|---|
| Nombres de meses | `Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' })` |
| Nombres de días | Igual con `{ weekday: 'short' }` |
| Inicio de semana | `new Intl.Locale(locale).getWeekInfo().firstDay` |
| Orden de tecleo (dd/mm vs mm/dd) | `formatToParts()` sobre una fecha testigo |

Lo último es lo que evita escribir un parser de patrones: `formatToParts()` devuelve el
orden de los campos y el separador que usa el locale, así que el input acepta `31/07/2026`
en `es-MX` y `07/31/2026` en `en-US` sin código específico por formato.

**`getWeekInfo()` es API reciente y puede no existir.** Va con fallback a lunes
(`firstDay = 1`) y el input `weekStartsOn` permite forzarlo. Ver "Riesgos".

---

## `<ui-calendar>`

El grid puro. No tiene overlay, no tiene input de texto, no tiene label.

```html
<ui-calendar [(value)]="fecha" min="2026-01-01" />
```

| Input | Tipo | Default |
|---|---|---|
| `value` | `model<string>` — ISO o `''` | `''` |
| `month` | `model<string>` — mes visible | mes de `value`; si no, hoy |
| `locale` | `string` | `'es-MX'` |
| `weekStartsOn` | `number \| undefined` (0=domingo) | derivado del locale |
| `min` / `max` | `string` ISO | — |
| `disabledDates` | `readonly string[]` | `[]` |
| `dateDisabled` | `(iso: string) => boolean` | — |

`month` es un `model` para que el datepicker lo controle y para que el consumidor pueda
posicionar el calendario donde quiera.

### Cuándo se deshabilita un día

Si **cualquiera** de las cuatro restricciones lo dice. Se evalúan en orden — `min`, `max`,
`disabledDates`, `dateDisabled` — y se corta en la primera que aplique, para no invocar el
predicado 42 veces si `min` ya descartó el día.

---

## `<ui-datepicker>`

Compone `ui-input` + overlay + `ui-calendar`.

### Cómo compone a `ui-input` (no lo reimplementa)

`ui-datepicker` **usa** `<ui-input>` en su template y le reenvía `label`, `hint`,
`placeholder`, `size`, `disabled`, `readonly`, `required`, `name` e `id`. El botón que abre
el calendario va en el slot que ya existe para eso:

```html
<ui-input ... [error]="resolvedError()">
  <button slot="suffix" type="button" aria-haspopup="dialog">…</button>
</ui-input>
```

Esto importa por tres razones:

1. No se duplica por tercera vez el markup del wrapper (borde, focus ring, mapa de tamaños).
2. El label, el `<p>` de error/hint y el `aria-describedby` salen gratis y **ya consistentes**
   con el resto de la familia.
3. El slot `suffix` colapsa con `empty:hidden` cuando no hay contenido, así que el botón no
   introduce espaciado raro.

**El datepicker calcula el mensaje final y se lo pasa a `ui-input` por `[error]`.** Es decir,
`ui-input` no sabe nada de fechas: solo recibe un string ya resuelto. La precedencia
(manual → parseo → Signal Forms) se computa en el datepicker, que es quien tiene el contexto.

Consecuencia de diseño: `ui-datepicker` **no** reenvía `invalid`/`touched`/`errors` a
`ui-input`; los consume él mismo para producir `resolvedError()`. Reenviarlos además haría
que `ui-input` intentara resolver la precedencia por su cuenta y el resultado sería doble.

### Contrato público

Replica **exactamente** el contrato del resto de los controles de formulario: `label`,
`hint`, `error`, `placeholder`, `name`, `id`, `size` (`'sm'|'md'|'lg'`), `disabled`,
`readonly`, `required`, `invalid`, `touched`, `errors`, más `ControlValueAccessor` con
`NG_VALUE_ACCESSOR` + `forwardRef`. Reenvía al calendario `locale`, `weekStartsOn`, `min`,
`max`, `disabledDates` y `dateDisabled`.

Es el séptimo miembro de la familia de controles de formulario, no un caso especial: hereda
la tabla de precedencia `error` > `errors`+`touched` > `hint` que comparten input, textarea,
select, checkbox, radio y segmented.

---

## Sincronización texto ↔ valor

Hay **dos fuentes de verdad**: `value` (ISO, lo que ve el formulario) y `text` (lo que hay
en la caja). Mantenerlas sincronizadas sin que peleen es la parte delicada del componente.

### Reglas

1. **Al teclear** se parsea en cada tecla. Si el texto produce una fecha completa y válida
   que pasa las restricciones, se commitea a `value` y el calendario salta a ese mes.
   Cualquier otra cosa deja `value` en `''`.
2. **Nunca se muestra error mientras se teclea.** `31/0` es un estado legítimo de camino a
   `31/07/2026`.
3. **Al perder el foco o presionar Enter** se revela el error, si lo hay. Mismo criterio de
   `touched` que usa el resto de la librería.
4. **Al elegir del calendario** siempre sale una fecha válida: se formatea el texto, se
   limpia el error interno, se cierra el panel y el foco vuelve al input.
5. **El texto no se reformatea mientras el campo tiene foco.** Reformatear bajo el cursor
   mueve el caret.

### Los cuatro errores internos

No son el mismo error y no dicen lo mismo:

| Texto | Causa | Mensaje |
|---|---|---|
| `31/0`, `abc` | No parsea | "Fecha incompleta o inválida" |
| `31/02/2026` | Parsea pero no existe | "Esa fecha no existe" |
| `01/01/2020` con `min="2026-01-01"` | Fuera de rango | "La fecha debe ser posterior a {min}" |
| Un día en `disabledDates` | Bloqueada | "Esa fecha no está disponible" |

### Precedencia de errores

`error` (input manual) → error interno de parseo → `errors` de Signal Forms (tras `touched`).

El manual gana porque es una decisión explícita de quien usa el componente.

### Las restricciones no reescriben valores externos

**`min`, `max`, `disabledDates` y `dateDisabled` bloquean lo que el usuario elige; no
modifican lo que la aplicación le pasa al componente.**

Si el código hace `value = '2020-01-01'` con `min="2026-01-01"`, el datepicker lo muestra
tal cual. Un componente que cambia silenciosamente el valor que le dieron es imposible de
depurar; marcar eso como inválido es trabajo de la validación del formulario.

La única excepción es basura real (`'no-soy-fecha'` vía `writeValue`), que se normaliza a
`''` porque no hay nada que mostrar.

**Corolario:** la validación interna corre solo sobre texto que el usuario editó. El
componente lleva una bandera `dirty`; si el valor vino de afuera y nadie tecleó, enfocar y
salir del campo **no** dispara el error de restricción ni limpia el valor. De lo contrario,
un simple Tab a través de un formulario precargado borraría datos.

### Casos borde derivados

- Ceros a la izquierda opcionales: `1/7/2026` se acepta.
- **Años de 2 dígitos se rechazan.** `31/07/26` es ambiguo y adivinar el siglo produce bugs
  silenciosos.
- Pegar una fecha completa entra por el mismo camino que teclearla.
- Borrar todo el texto deja `value = ''` **sin error**. "Sin fecha" es un estado válido; que
  sea obligatorio o no lo dice `required`.
- Seguir tecleando sobre una fecha ya válida (`31/07/20261`) la vuelve inválida y limpia
  `value`.

---

## Teclado y accesibilidad

El panel es `role="dialog"` **no modal**, etiquetado con el mes visible. Adentro,
`role="grid"` con `role="gridcell"` por día, `aria-selected` en el elegido y `aria-disabled`
en los bloqueados.

**Roving tabindex**: exactamente un día tiene `tabindex="0"` y el resto `-1`. Es foco real,
no `aria-activedescendant` — consistente con `ui-select`.

| Tecla | Acción |
|---|---|
| ← → | ±1 día |
| ↑ ↓ | ±1 semana |
| Home / End | Inicio / fin de la semana |
| PageUp / PageDown | ±1 mes |
| Shift + PageUp / PageDown | ±1 año |
| Enter / Espacio | Seleccionar |
| Escape | Cerrar y devolver el foco al input |
| Tab | Sale del panel y lo cierra (no es modal; no hay trampa de foco) |

Nada de esto existe hoy en el repo para copiar: `ui-select` y `ui-dropdown` solo manejan
`ArrowUp`/`ArrowDown`, sin Home/End ni navegación bidimensional.

Tres decisiones que no son obvias:

- **Cruzar de mes con las flechas cambia el mes visible automáticamente** y el foco se queda
  en el día. Sin esto, llegar al 1° del mes siguiente obliga a usar el mouse.
- **Los días deshabilitados reciben foco** (con `aria-disabled="true"`); Enter simplemente no
  hace nada. Saltárselos se cicla infinito cuando un mes entero está bloqueado y esconde
  información de quien usa lector de pantalla.
- **Una región `aria-live="polite"` anuncia el mes al cambiar.** Sin ella, navegar con
  flechas hasta agosto no se anuncia.

Con `readonly` el panel no abre y el texto no se edita. Con `disabled`, nada responde.

---

## Tests

Vitest + `TestBed`, specs junto al código.

**`date-utils.spec.ts` es donde está el mejor retorno**: funciones puras, baratas, y es donde
viven los bugs reales. Casos obligados:

- `addMonths` truncando: 31 ene + 1 mes = 28 feb.
- Bisiestos: **2024 sí, 2100 no** (la regla de los siglos es la que se olvida).
- `buildMonthGrid` siempre con 42 celdas; primera y última perteneciendo a meses vecinos.
- `weekStartsOn` en lunes y en domingo.
- `parseIso` rechazando `'2026-02-30'` y `'2026-13-01'`.

**`calendar.component.spec.ts`**: el grid renderiza 42 celdas, precedencia de deshabilitado,
navegación por teclado incluyendo el cruce de mes, roving tabindex, la selección emite.

**`datepicker.component.spec.ts`**: cada fila de la tabla de errores como un test, la
precedencia de errores, el round-trip de CVA, y abrir/Escape/regreso de foco.

**`overlay-position.spec.ts`**: rects fabricados, porque jsdom no hace layout y
`getBoundingClientRect` devuelve ceros. Reusar el helper `rect()` que ya existe en
`popover.component.spec.ts`.

---

## Riesgos

**`Intl.Locale.prototype.getWeekInfo()` puede no existir** en el entorno de tests ni en
navegadores algo viejos. Mitigación: fallback a lunes y el input `weekStartsOn` para
forzarlo. **Verificar en la primera tarea del plan, no al final** — si no está disponible
donde importa, hay que saberlo antes de construir encima.

**`Intl` con ICU completo en el entorno de tests.** Node trae full-icu por defecto desde v14,
pero conviene confirmar que los nombres de meses en `es-MX` salen bien en Vitest y no en
inglés.

---

## Deuda técnica adyacente (fuera de alcance)

Detectado al explorar el repo, **no se arregla en este trabajo**:

- **`ui-popover` está desincronizado entre los dos árboles.** La copia publicable
  (`projects/highstack/ui/src/lib/atoms/popover/popover.component.ts`) es la versión vieja:
  sin `updatePosition`, sin flip, sin la señal `ready`. Quien instala el paquete tiene un
  popover que no se reposiciona.
- **`ui-popover` usa `position: absolute`** mientras select y dropdown usan `fixed`, así que
  no escapa de contenedores con `overflow`.
- El posicionamiento duplicado en cuatro archivos, que `overlay-position.ts` empieza a
  resolver pero no retrofitea.

---

## Entregables

1. `date-utils.ts` + spec, en ambos árboles.
2. `overlay-position.ts` + spec, en ambos árboles.
3. `ui-calendar` + spec, en ambos árboles.
4. `ui-datepicker` + spec, en ambos árboles.
5. Export en `public-api.ts`.
6. Páginas de showcase para ambos, con su ruta en `app.routes.ts`.
7. `AI-USAGE-GUIDE.md` actualizado en las dos copias.
