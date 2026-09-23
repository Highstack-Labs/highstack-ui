import {
  cityFromId,
  filterTimezones,
  formatOffset,
  getLocalTimezone,
  getTimezoneOffsetMinutes,
  groupByRegion,
  listTimezones,
  toTimezoneOption,
} from './timezone-utils';

/** Una fecha fija: en enero Bogotá y Madrid están en horario estándar. */
const ENERO = new Date('2026-01-15T12:00:00Z');
/** En julio el hemisferio norte está en horario de verano. */
const JULIO = new Date('2026-07-15T12:00:00Z');

describe('formatOffset', () => {
  it('formatea con dos dígitos y signo', () => {
    expect(formatOffset(0)).toBe('GMT+00:00');
    expect(formatOffset(-300)).toBe('GMT-05:00');
    expect(formatOffset(330)).toBe('GMT+05:30');
    expect(formatOffset(-570)).toBe('GMT-09:30');
    expect(formatOffset(840)).toBe('GMT+14:00');
  });
});

describe('getTimezoneOffsetMinutes', () => {
  it('devuelve el desfase de una zona sin horario de verano', () => {
    expect(getTimezoneOffsetMinutes('America/Bogota', ENERO)).toBe(-300);
    expect(getTimezoneOffsetMinutes('UTC', ENERO)).toBe(0);
  });

  it('aplica el horario de verano según la fecha', () => {
    expect(getTimezoneOffsetMinutes('Europe/Madrid', ENERO)).toBe(60);
    expect(getTimezoneOffsetMinutes('Europe/Madrid', JULIO)).toBe(120);
  });

  it('maneja desfases con minutos', () => {
    expect(getTimezoneOffsetMinutes('Asia/Kolkata', ENERO)).toBe(330);
  });

  it('devuelve 0 ante un id inválido en vez de reventar', () => {
    expect(getTimezoneOffsetMinutes('No/Existe', ENERO)).toBe(0);
  });
});

describe('cityFromId', () => {
  it('limpia los guiones bajos', () => {
    expect(cityFromId('America/New_York')).toBe('New York');
  });

  it('aprovecha el país de los ids de tres segmentos', () => {
    expect(cityFromId('America/Argentina/Buenos_Aires')).toBe('Buenos Aires, Argentina');
  });

  it('acepta ids de un solo segmento', () => {
    expect(cityFromId('UTC')).toBe('UTC');
  });
});

describe('toTimezoneOption', () => {
  it('compone la etiqueta con el desfase y la ciudad', () => {
    const zona = toTimezoneOption('America/Bogota', ENERO);
    expect(zona).toMatchObject({
      id: 'America/Bogota',
      city: 'Bogota',
      region: 'America',
      regionLabel: 'América',
      offsetMinutes: -300,
      offsetLabel: 'GMT-05:00',
      label: '(GMT-05:00) Bogota',
    });
  });

  it('manda los ids sin región al cajón de sastre', () => {
    expect(toTimezoneOption('UTC', ENERO)).toMatchObject({ region: 'Etc', regionLabel: 'Otras' });
  });
});

describe('listTimezones', () => {
  it('trae las zonas del runtime ordenadas por desfase', () => {
    const zonas = listTimezones(ENERO);
    expect(zonas.length).toBeGreaterThan(100);

    const desfases = zonas.map((z) => z.offsetMinutes);
    expect(desfases).toEqual([...desfases].sort((a, b) => a - b));
  });

  it('incluye zonas conocidas', () => {
    const ids = listTimezones(ENERO).map((z) => z.id);
    expect(ids).toContain('America/Bogota');
    expect(ids).toContain('Europe/Madrid');
  });
});

describe('filterTimezones', () => {
  const zonas = listTimezones(ENERO);

  it('sin consulta devuelve la lista completa', () => {
    expect(filterTimezones(zonas, '').length).toBe(zonas.length);
    expect(filterTimezones(zonas, '   ').length).toBe(zonas.length);
  });

  it('encuentra por ciudad ignorando acentos y mayúsculas', () => {
    const ids = filterTimezones(zonas, 'BOGOTÁ').map((z) => z.id);
    expect(ids).toContain('America/Bogota');
  });

  it('encuentra por región en español', () => {
    const resultado = filterTimezones(zonas, 'europa');
    expect(resultado.length).toBeGreaterThan(10);
    expect(resultado.every((z) => z.region === 'Europe')).toBe(true);
  });

  it('exige todos los términos, en cualquier orden', () => {
    const ids = filterTimezones(zonas, 'madrid europa').map((z) => z.id);
    expect(ids).toEqual(['Europe/Madrid']);
  });

  it('acepta el desfase escrito corto o largo', () => {
    expect(filterTimezones(zonas, 'gmt-5').map((z) => z.id)).toContain('America/Bogota');
    expect(filterTimezones(zonas, 'gmt-05:00').map((z) => z.id)).toContain('America/Bogota');
  });

  it('devuelve vacío cuando nada coincide', () => {
    expect(filterTimezones(zonas, 'xyzxyz')).toEqual([]);
  });
});

describe('groupByRegion', () => {
  it('agrupa y ordena los grupos por su etiqueta en español', () => {
    const grupos = groupByRegion(listTimezones(ENERO));
    const etiquetas = grupos.map((g) => g.regionLabel);
    expect(etiquetas).toEqual([...etiquetas].sort((a, b) => a.localeCompare(b, 'es')));
    expect(etiquetas).toContain('América');
  });

  it('conserva el orden de entrada dentro de cada grupo', () => {
    const zonas = [
      toTimezoneOption('Europe/Madrid', ENERO),
      toTimezoneOption('America/Bogota', ENERO),
      toTimezoneOption('Europe/Lisbon', ENERO),
    ];
    const europa = groupByRegion(zonas).find((g) => g.region === 'Europe')!;
    expect(europa.zones.map((z) => z.id)).toEqual(['Europe/Madrid', 'Europe/Lisbon']);
  });

  it('no pierde ninguna zona', () => {
    const zonas = listTimezones(ENERO);
    const total = groupByRegion(zonas).reduce((suma, g) => suma + g.zones.length, 0);
    expect(total).toBe(zonas.length);
  });
});

describe('getLocalTimezone', () => {
  it('devuelve un id IANA usable', () => {
    const id = getLocalTimezone();
    expect(id).toBeTruthy();
    expect(() => new Intl.DateTimeFormat('en-US', { timeZone: id })).not.toThrow();
  });
});
