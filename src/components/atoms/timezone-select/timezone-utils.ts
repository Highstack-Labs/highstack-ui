/**
 * Utilidades de zonas horarias para `ui-timezone-select`.
 *
 * La lista sale del runtime (`Intl.supportedValuesOf('timeZone')`), no de una
 * tabla propia: son ~420 zonas IANA que el navegador ya trae, sin peso en el
 * bundle y sin quedar desactualizadas cuando la IANA cambia.
 *
 * A cambio, las etiquetas se derivan del identificador, así que salen sin tilde
 * y sin país: `America/Bogota` es «Bogota», no «Bogotá, Colombia». Buscar
 * «colombia» no encuentra nada; buscar «bogota» sí.
 */

/** Una zona horaria lista para pintar y para filtrar. */
export interface TimezoneOption {
  /** Identificador IANA. Es el valor que emite el componente. */
  id: string;
  /** Ciudad derivada del id, ya legible: `America/Bogota` → `Bogota`. */
  city: string;
  /** Primer segmento del id, en crudo: `America`, `Europe`, `Asia`… */
  region: string;
  /** El mismo `region` traducido para mostrar: `América`, `Europa`… */
  regionLabel: string;
  /** Desfase respecto a UTC en minutos, con el horario de verano ya aplicado. */
  offsetMinutes: number;
  /** El desfase formateado: `GMT-05:00`. */
  offsetLabel: string;
  /** Lo que se muestra en el trigger: `(GMT-05:00) Bogota`. */
  label: string;
}

/** Una región con sus zonas, tal y como la pinta la lista agrupada. */
export interface TimezoneGroup {
  region: string;
  regionLabel: string;
  zones: TimezoneOption[];
}

const REGION_LABELS: Record<string, string> = {
  Africa: 'África',
  America: 'América',
  Antarctica: 'Antártida',
  Arctic: 'Ártico',
  Asia: 'Asia',
  Atlantic: 'Atlántico',
  Australia: 'Australia',
  Europe: 'Europa',
  Indian: 'Índico',
  Pacific: 'Pacífico',
};

/** Cajón de sastre para ids sin región reconocible: `UTC`, `Etc/GMT+3`, `EST5EDT`. */
const OTHER_REGION = 'Etc';
const OTHER_REGION_LABEL = 'Otras';

/** La zona del propio dispositivo, útil para preseleccionar. */
export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

/**
 * Desfase de una zona en minutos respecto a UTC, en una fecha concreta.
 *
 * Se pregunta a `Intl` en vez de calcularlo, para que el horario de verano
 * salga bien: `America/Santiago` no vale lo mismo en enero que en julio.
 * Un id inválido devuelve 0 en vez de reventar.
 */
export function getTimezoneOffsetMinutes(id: string, date: Date = new Date()): number {
  let name: string;
  try {
    name =
      new Intl.DateTimeFormat('en-US', { timeZone: id, timeZoneName: 'longOffset' })
        .formatToParts(date)
        .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  } catch {
    return 0;
  }

  // 'GMT' a secas es UTC; el resto llega como 'GMT-05:00' o 'GMT+5:30'.
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name);
  if (!match) return 0;

  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

/** Formatea un desfase en minutos como `GMT-05:00`. */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `GMT${sign}${hh}:${mm}`;
}

/**
 * Convierte un id IANA en su ciudad legible.
 *
 * Los ids de tres segmentos llevan el país en medio y se aprovecha:
 * `America/Argentina/Buenos_Aires` → `Buenos Aires, Argentina`.
 */
export function cityFromId(id: string): string {
  const segments = id.split('/');
  if (segments.length === 1) return segments[0].replace(/_/g, ' ');
  // Del más específico al más general, que es como se lee una dirección.
  return segments
    .slice(1)
    .reverse()
    .map((segment) => segment.replace(/_/g, ' '))
    .join(', ');
}

/** Construye una `TimezoneOption` a partir de su id. */
export function toTimezoneOption(id: string, now: Date = new Date()): TimezoneOption {
  const offsetMinutes = getTimezoneOffsetMinutes(id, now);
  const offsetLabel = formatOffset(offsetMinutes);
  const city = cityFromId(id);
  const region = id.includes('/') ? id.split('/')[0] : OTHER_REGION;

  return {
    id,
    city,
    region,
    regionLabel: REGION_LABELS[region] ?? OTHER_REGION_LABEL,
    offsetMinutes,
    offsetLabel,
    label: `(${offsetLabel}) ${city}`,
  };
}

/**
 * Todas las zonas del runtime, ordenadas por desfase y luego por ciudad.
 *
 * `Intl.supportedValuesOf` es de ES2022 y no está en navegadores viejos: si
 * falta, se devuelve lo mínimo utilizable (la zona local y UTC) en lugar de
 * dejar la lista vacía.
 */
export function listTimezones(now: Date = new Date()): TimezoneOption[] {
  const ids = supportedTimezoneIds();
  return ids
    .map((id) => toTimezoneOption(id, now))
    .sort((a, b) => a.offsetMinutes - b.offsetMinutes || a.city.localeCompare(b.city, 'es'));
}

function supportedTimezoneIds(): string[] {
  const supportedValuesOf = (
    Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
  ).supportedValuesOf;

  if (typeof supportedValuesOf !== 'function') {
    return [...new Set([getLocalTimezone(), 'UTC'])];
  }

  try {
    return supportedValuesOf('timeZone');
  } catch {
    return [...new Set([getLocalTimezone(), 'UTC'])];
  }
}

/** Minúsculas y sin acentos, para que «bogotá» encuentre a «Bogota». */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Filtra por id, ciudad, región (en inglés y en español) y desfase.
 *
 * Todos los términos de la consulta tienen que aparecer, en cualquier orden,
 * así que «europa madrid» sigue encontrando Madrid. Se acepta tanto `gmt-5`
 * como `gmt-05:00`.
 */
export function filterTimezones(
  zones: readonly TimezoneOption[],
  query: string,
): TimezoneOption[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [...zones];

  return zones.filter((zone) => {
    const haystack = normalize(
      `${zone.id} ${zone.city} ${zone.region} ${zone.regionLabel} ${zone.offsetLabel} ${compactOffset(zone.offsetMinutes)}`,
    );
    return terms.every((term) => haystack.includes(term));
  });
}

/** `GMT-5` además de `GMT-05:00`, que es como lo teclea la gente. */
function compactOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const mm = abs % 60;
  return `gmt${sign}${Math.floor(abs / 60)}${mm ? `:${String(mm).padStart(2, '0')}` : ''}`;
}

/**
 * Agrupa por región conservando el orden en que llegan las zonas dentro de
 * cada grupo, y ordena los grupos alfabéticamente por su etiqueta.
 */
export function groupByRegion(zones: readonly TimezoneOption[]): TimezoneGroup[] {
  const groups = new Map<string, TimezoneGroup>();

  for (const zone of zones) {
    let group = groups.get(zone.region);
    if (!group) {
      group = { region: zone.region, regionLabel: zone.regionLabel, zones: [] };
      groups.set(zone.region, group);
    }
    group.zones.push(zone);
  }

  return [...groups.values()].sort((a, b) => a.regionLabel.localeCompare(b.regionLabel, 'es'));
}
