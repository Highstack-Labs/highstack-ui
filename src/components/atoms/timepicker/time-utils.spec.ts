import {
  compareTimes,
  formatTimeForDisplay,
  from12Hour,
  hourOptions,
  isValidIsoTime,
  normalizeBound,
  now,
  parseIsoTime,
  parseLocalizedTime,
  resolveHourFormat,
  stepOptions,
  to12Hour,
  toIsoTime,
} from './time-utils';

describe('parseIsoTime', () => {
  it('acepta HH:mm y HH:mm:ss', () => {
    expect(parseIsoTime('09:30')).toEqual({ h: 9, m: 30, s: 0 });
    expect(parseIsoTime('21:05:07')).toEqual({ h: 21, m: 5, s: 7 });
    expect(parseIsoTime('00:00')).toEqual({ h: 0, m: 0, s: 0 });
    expect(parseIsoTime('23:59:59')).toEqual({ h: 23, m: 59, s: 59 });
  });

  it('rechaza horas fuera del reloj en vez de corregirlas', () => {
    expect(parseIsoTime('24:00')).toBeNull();
    expect(parseIsoTime('09:60')).toBeNull();
    expect(parseIsoTime('09:30:60')).toBeNull();
  });

  it('rechaza formas mal escritas', () => {
    expect(parseIsoTime('9:30')).toBeNull(); // falta el cero
    expect(parseIsoTime('0930')).toBeNull();
    expect(parseIsoTime('')).toBeNull();
    expect(parseIsoTime('abc')).toBeNull();
  });

  it('isValidIsoTime es el mismo criterio', () => {
    expect(isValidIsoTime('09:30')).toBe(true);
    expect(isValidIsoTime('24:00')).toBe(false);
  });
});

describe('toIsoTime', () => {
  it('rellena con ceros y respeta withSeconds', () => {
    expect(toIsoTime(9, 5)).toBe('09:05');
    expect(toIsoTime(9, 5, 7, true)).toBe('09:05:07');
    expect(toIsoTime(9, 5, 7, false)).toBe('09:05');
  });

  it('el orden lexicográfico coincide con el cronológico', () => {
    const horas = ['23:59', '00:00', '12:00', '09:30'];
    expect([...horas].sort()).toEqual(['00:00', '09:30', '12:00', '23:59']);
  });
});

describe('normalizeBound / compareTimes', () => {
  it('iguala la precisión antes de comparar', () => {
    expect(normalizeBound('09:30')).toBe('09:30:00');
    expect(normalizeBound('09:30:15')).toBe('09:30:15');
    expect(normalizeBound('nada')).toBe('');
  });

  it("'09:30' y '09:30:00' son la misma hora", () => {
    expect(compareTimes('09:30', '09:30:00')).toBe(0);
  });

  it('ordena correctamente mezclando precisiones', () => {
    expect(compareTimes('09:30', '09:30:15')).toBeLessThan(0);
    expect(compareTimes('10:00:00', '09:59')).toBeGreaterThan(0);
  });
});

describe('to12Hour / from12Hour', () => {
  it('trata las dos vueltas del reloj de 12', () => {
    expect(to12Hour(0)).toEqual({ hour12: 12, period: 'am' });
    expect(to12Hour(11)).toEqual({ hour12: 11, period: 'am' });
    expect(to12Hour(12)).toEqual({ hour12: 12, period: 'pm' });
    expect(to12Hour(13)).toEqual({ hour12: 1, period: 'pm' });
    expect(to12Hour(23)).toEqual({ hour12: 11, period: 'pm' });
  });

  it('es reversible en las 24 horas', () => {
    for (let h = 0; h < 24; h++) {
      const { hour12, period } = to12Hour(h);
      expect(from12Hour(hour12, period)).toBe(h);
    }
  });
});

describe('resolveHourFormat', () => {
  it('respeta el formato explícito', () => {
    expect(resolveHourFormat(12, 'en-GB')).toBe(12);
    expect(resolveHourFormat(24, 'en-US')).toBe(24);
  });

  it("'auto' sale del locale", () => {
    expect(resolveHourFormat('auto', 'en-US')).toBe(12);
    expect(resolveHourFormat('auto', 'es-ES')).toBe(24);
  });
});

describe('formatTimeForDisplay', () => {
  it('en formato 24 escribe HH:mm', () => {
    expect(formatTimeForDisplay('09:30', { locale: 'es-MX', hourFormat: 24 })).toBe('09:30');
    expect(formatTimeForDisplay('21:05', { locale: 'es-MX', hourFormat: 24 })).toBe('21:05');
  });

  it('en formato 12 añade el periodo del locale', () => {
    const es = formatTimeForDisplay('21:05', { locale: 'es-MX', hourFormat: 12 });
    expect(es).toContain('9:05');
    expect(es.toLowerCase().replace(/\W/g, '')).toContain('pm');

    const en = formatTimeForDisplay('09:05', { locale: 'en-US', hourFormat: 12 });
    expect(en).toContain('9:05');
    expect(en).toContain('AM');
  });

  it('incluye los segundos solo si se piden', () => {
    expect(
      formatTimeForDisplay('09:30:07', { locale: 'es-MX', hourFormat: 24, showSeconds: true }),
    ).toBe('09:30:07');
    expect(formatTimeForDisplay('09:30:07', { locale: 'es-MX', hourFormat: 24 })).toBe('09:30');
  });

  it('devuelve cadena vacía si no hay hora', () => {
    expect(formatTimeForDisplay('', { locale: 'es-MX', hourFormat: 12 })).toBe('');
    expect(formatTimeForDisplay('basura', { locale: 'es-MX', hourFormat: 12 })).toBe('');
  });

  it('las medianoches y los medios días no se confunden', () => {
    expect(formatTimeForDisplay('00:00', { locale: 'en-US', hourFormat: 12 })).toBe('12:00 AM');
    expect(formatTimeForDisplay('12:00', { locale: 'en-US', hourFormat: 12 })).toBe('12:00 PM');
  });
});

describe('parseLocalizedTime', () => {
  const es = { locale: 'es-MX', hourFormat: 12 } as const;
  const es24 = { locale: 'es-MX', hourFormat: 24 } as const;

  it('acepta las formas con separador', () => {
    expect(parseLocalizedTime('9:30', es)).toBe('09:30:00');
    expect(parseLocalizedTime('9.30', es)).toBe('09:30:00');
    expect(parseLocalizedTime('21:30', es24)).toBe('21:30:00');
    expect(parseLocalizedTime('9:30:15', es)).toBe('09:30:15');
  });

  it('acepta las formas sin separador', () => {
    expect(parseLocalizedTime('930', es)).toBe('09:30:00');
    expect(parseLocalizedTime('0930', es)).toBe('09:30:00');
    expect(parseLocalizedTime('2130', es24)).toBe('21:30:00');
    expect(parseLocalizedTime('9', es)).toBe('09:00:00');
  });

  it('entiende el marcador am/pm en inglés y en el locale', () => {
    expect(parseLocalizedTime('9:30 pm', es)).toBe('21:30:00');
    expect(parseLocalizedTime('9:30PM', es)).toBe('21:30:00');
    expect(parseLocalizedTime('9:30 p.m.', es)).toBe('21:30:00');
    expect(parseLocalizedTime('9 p', es)).toBe('21:00:00');
    expect(parseLocalizedTime('9:30 am', es)).toBe('09:30:00');
    expect(parseLocalizedTime('12 am', es)).toBe('00:00:00');
    expect(parseLocalizedTime('12 pm', es)).toBe('12:00:00');
  });

  it('sin marcador no adivina la tarde', () => {
    expect(parseLocalizedTime('9', es)).toBe('09:00:00');
    expect(parseLocalizedTime('9:30', es)).toBe('09:30:00');
  });

  it("rechaza combinaciones imposibles como '13 pm'", () => {
    expect(parseLocalizedTime('13 pm', es)).toBeNull();
    expect(parseLocalizedTime('0 am', es)).toBeNull();
  });

  it('rechaza lo que no se entiende', () => {
    expect(parseLocalizedTime('', es)).toBeNull();
    expect(parseLocalizedTime('   ', es)).toBeNull();
    expect(parseLocalizedTime('abc', es)).toBeNull();
    expect(parseLocalizedTime('93', es)).toBeNull(); // 93 no es una hora
    expect(parseLocalizedTime('9:99', es)).toBeNull();
    expect(parseLocalizedTime('25:00', es24)).toBeNull();
    expect(parseLocalizedTime('12345', es)).toBeNull();
    expect(parseLocalizedTime('1:2:3:4', es)).toBeNull();
  });

  it('cierra el círculo con formatTimeForDisplay', () => {
    for (const iso of ['00:00:00', '09:30:00', '12:00:00', '21:05:00', '23:59:00']) {
      const texto = formatTimeForDisplay(iso, { locale: 'en-US', hourFormat: 12 });
      expect(parseLocalizedTime(texto, { locale: 'en-US', hourFormat: 12 })).toBe(iso);
    }
  });
});

describe('now', () => {
  it('devuelve una hora válida redondeada al paso', () => {
    const iso = now(15);
    expect(isValidIsoTime(iso)).toBe(true);
    expect(parseIsoTime(iso)!.m % 15).toBe(0);
  });

  it('con paso 1 no redondea', () => {
    expect(isValidIsoTime(now(1))).toBe(true);
  });
});

describe('hourOptions', () => {
  it('formato 24: las 24 horas en orden', () => {
    expect(hourOptions(24)).toEqual(Array.from({ length: 24 }, (_, i) => i));
  });

  it('formato 12: las doce abren la vuelta', () => {
    expect(hourOptions(12)).toEqual([12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});

describe('stepOptions', () => {
  it('reparte los 60 minutos según el paso', () => {
    expect(stepOptions(15)).toEqual([0, 15, 30, 45]);
    expect(stepOptions(30)).toEqual([0, 30]);
    expect(stepOptions(5).length).toBe(12);
    expect(stepOptions(1).length).toBe(60);
  });

  it('se defiende de pasos absurdos clampeando a [1, 60]', () => {
    expect(stepOptions(0)).toEqual(stepOptions(1));
    expect(stepOptions(-5)).toEqual(stepOptions(1));
    expect(stepOptions(120)).toEqual([0]);
  });
});
