import { describe, expect, it } from 'vitest';
import { BY_ISO2, COUNTRY_CODES, PRIMARY_BY_DIAL } from './country-codes';
import {
  checkNational,
  countryList,
  digitsOnly,
  filterCountries,
  flagEmoji,
  formatNational,
  isInternationalText,
  matchDialCode,
  normalizeE164,
  parseE164,
  regionFromLocale,
  stripTrunkPrefix,
  toE164,
} from './phone-utils';

describe('COUNTRY_CODES', () => {
  it('no repite países', () => {
    const isos = COUNTRY_CODES.map((c) => c[0]);
    expect(new Set(isos).size).toBe(isos.length);
  });

  it('tiene rangos de dígitos coherentes', () => {
    for (const [iso2, dial, min, max] of COUNTRY_CODES) {
      expect(/^\d{1,3}$/.test(dial), `${iso2} dial=${dial}`).toBe(true);
      expect(min, `${iso2} min`).toBeGreaterThan(0);
      expect(max, `${iso2} max`).toBeGreaterThanOrEqual(min);
    }
  });

  it('ninguna agrupación pide más dígitos de los que admite el país', () => {
    for (const [iso2, , , max, groups] of COUNTRY_CODES) {
      if (!groups) continue;
      const total = groups.split('-').reduce((sum, n) => sum + Number(n), 0);
      expect(total, `${iso2} agrupación ${groups}`).toBeLessThanOrEqual(max);
    }
  });

  it('cada prefijo compartido declara su país primario', () => {
    const byDial = new Map<string, string[]>();
    for (const [iso2, dial] of COUNTRY_CODES) {
      byDial.set(dial, [...(byDial.get(dial) ?? []), iso2]);
    }
    for (const [dial, isos] of byDial) {
      if (isos.length < 2) continue;
      expect(PRIMARY_BY_DIAL[dial], `prefijo +${dial} lo comparten ${isos.join(', ')}`).toBeTruthy();
      expect(isos).toContain(PRIMARY_BY_DIAL[dial]);
    }
  });
});

describe('digitsOnly', () => {
  it('deja solo dígitos', () => {
    expect(digitsOnly('+593 (98) 765-4321')).toBe('593987654321');
    expect(digitsOnly('abc')).toBe('');
  });
});

describe('flagEmoji', () => {
  it('compone la bandera con los indicadores regionales', () => {
    expect([...flagEmoji('EC')].map((c) => c.codePointAt(0))).toEqual([0x1f1ea, 0x1f1e8]);
  });

  it('acepta minúsculas', () => {
    expect(flagEmoji('ec')).toBe(flagEmoji('EC'));
  });

  it('devuelve vacío con basura', () => {
    expect(flagEmoji('')).toBe('');
    expect(flagEmoji('E')).toBe('');
    expect(flagEmoji('E1')).toBe('');
  });
});

describe('isInternationalText', () => {
  it('reconoce el + y los prefijos de salida', () => {
    expect(isInternationalText('+593987654321')).toBe(true);
    expect(isInternationalText('  +34 600 111 222')).toBe(true);
    expect(isInternationalText('00593987654321')).toBe(true);
    expect(isInternationalText('011593987654321')).toBe(true);
  });

  it('un número nacional no es internacional', () => {
    expect(isInternationalText('987654321')).toBe(false);
    expect(isInternationalText('0987654321')).toBe(false);
    expect(isInternationalText('')).toBe(false);
  });
});

describe('normalizeE164', () => {
  it('quita separadores, paréntesis y espacios', () => {
    expect(normalizeE164('+593 (98) 765-4321')).toBe('+593987654321');
  });

  it('resuelve los prefijos de salida 00 y 011', () => {
    expect(normalizeE164('0034600111222')).toBe('+34600111222');
    expect(normalizeE164('01134600111222')).toBe('+34600111222');
  });

  it('respeta el + explícito sin tocar los ceros que siguen', () => {
    expect(normalizeE164('+00123456')).toBe('+00123456');
  });

  it('trunca al tope de 15 dígitos de E.164', () => {
    expect(normalizeE164('+1234567890123456789')).toBe('+123456789012345');
  });

  it('devuelve vacío con basura', () => {
    expect(normalizeE164('')).toBe('');
    expect(normalizeE164('+')).toBe('');
    expect(normalizeE164('abc')).toBe('');
    expect(normalizeE164(null)).toBe('');
    expect(normalizeE164(593987654321)).toBe('');
  });
});

describe('matchDialCode', () => {
  it('elige el prefijo más largo que existe', () => {
    expect(matchDialCode('593987654321')[0][0]).toBe('EC');
    expect(matchDialCode('34600111222')[0][0]).toBe('ES');
  });

  it('devuelve todos los candidatos de un prefijo compartido, con el primario primero', () => {
    const candidates = matchDialCode('14165551234');
    expect(candidates[0][0]).toBe('US');
    expect(candidates.map((c) => c[0])).toContain('CA');
  });

  it('devuelve vacío si el prefijo no existe', () => {
    expect(matchDialCode('9995551234')).toEqual([]);
    expect(matchDialCode('')).toEqual([]);
  });
});

describe('parseE164', () => {
  it('parte el número en país y nacional', () => {
    expect(parseE164('+593987654321')).toEqual({
      iso2: 'EC',
      dial: '593',
      national: '987654321',
    });
  });

  it('respeta el país preferido cuando el prefijo es compartido', () => {
    expect(parseE164('+14165551234', ['CA'])?.iso2).toBe('CA');
    expect(parseE164('+77015551234', ['KZ'])?.iso2).toBe('KZ');
  });

  it('ignora el preferido si su prefijo ya no coincide', () => {
    expect(parseE164('+34600111222', ['CA'])?.iso2).toBe('ES');
  });

  it('sin preferencia cae en el país primario del prefijo', () => {
    expect(parseE164('+14165551234')?.iso2).toBe('US');
    expect(parseE164('+77015551234')?.iso2).toBe('RU');
  });

  it('devuelve null con un prefijo inexistente o sin dígitos', () => {
    expect(parseE164('+9995551234')).toBeNull();
    expect(parseE164('')).toBeNull();
  });

  it('cierra el círculo con toE164 para todos los países de la tabla', () => {
    for (const [iso2, dial, min] of COUNTRY_CODES) {
      const national = '1'.repeat(min);
      const e164 = toE164(iso2, national);
      expect(e164, iso2).toBe(`+${dial}${national}`);

      const parsed = parseE164(e164, [iso2]);
      expect(parsed?.iso2, `${iso2} round-trip`).toBe(iso2);
      expect(parsed?.national, `${iso2} nacional`).toBe(national);
    }
  });
});

describe('toE164', () => {
  it('arma el canónico con el prefijo del país', () => {
    expect(toE164('EC', '98 765 4321')).toBe('+593987654321');
  });

  it('devuelve vacío sin país válido o sin dígitos', () => {
    expect(toE164('XX', '987654321')).toBe('');
    expect(toE164('EC', '')).toBe('');
    expect(toE164('EC', 'abc')).toBe('');
  });
});

describe('stripTrunkPrefix', () => {
  it('quita el cero de troncal cuando sin él encaja', () => {
    expect(stripTrunkPrefix('0987654321', 'EC')).toBe('987654321');
  });

  it('no toca un número que ya encaja en el rango', () => {
    expect(stripTrunkPrefix('987654321', 'EC')).toBe('987654321');
  });

  it('no quita nada si con un solo cero menos sigue sin encajar', () => {
    // '00987654321' son 11 dígitos: quitando uno quedan 10 y Ecuador admite 9,
    // así que no se toca. Quitar dos sería adivinar.
    expect(stripTrunkPrefix('00987654321', 'EC')).toBe('00987654321');
  });

  it('no toca nada si el país no existe', () => {
    expect(stripTrunkPrefix('0987654321', 'XX')).toBe('0987654321');
  });
});

describe('formatNational', () => {
  it('agrupa según el patrón del país', () => {
    expect(formatNational('987654321', 'EC')).toBe('98 765 4321');
    expect(formatNational('4165551234', 'US')).toBe('416 555 1234');
  });

  it('deja los dígitos sobrantes en el último grupo', () => {
    expect(formatNational('98765432199', 'EC')).toBe('98 765 432199');
  });

  it('agrupa también un número a medias', () => {
    expect(formatNational('987', 'EC')).toBe('98 7');
  });

  it('sin patrón devuelve los dígitos tal cual', () => {
    expect(formatNational('123456789', 'DE')).toBe('123456789');
  });

  it('no inventa espacios con la cadena vacía', () => {
    expect(formatNational('', 'EC')).toBe('');
  });
});

describe('checkNational', () => {
  it('acepta un número dentro del rango', () => {
    expect(checkNational('987654321', 'EC')).toBe('ok');
  });

  it('detecta corto y largo', () => {
    expect(checkNational('9876', 'EC')).toBe('too-short');
    expect(checkNational('98765432199', 'EC')).toBe('too-long');
  });

  it('sin dígitos es vacío, no inválido', () => {
    expect(checkNational('', 'EC')).toBe('empty');
    expect(checkNational('', null)).toBe('empty');
  });

  it('avisa cuando falta el país', () => {
    expect(checkNational('987654321', null)).toBe('no-country');
    expect(checkNational('987654321', 'XX')).toBe('no-country');
  });
});

describe('regionFromLocale', () => {
  it('saca la región del locale', () => {
    expect(regionFromLocale('es-EC')).toBe('EC');
    expect(regionFromLocale('en-US')).toBe('US');
  });

  it('devuelve vacío sin región, con una macro-región o con basura', () => {
    expect(regionFromLocale('es')).toBe('');
    expect(regionFromLocale('es-419')).toBe('');
    expect(regionFromLocale('!!!')).toBe('');
  });
});

describe('countryList', () => {
  it('trae todos los países de la tabla con nombre localizado', () => {
    const list = countryList('es-MX');
    expect(list.length).toBe(COUNTRY_CODES.length);
    expect(list.find((c) => c.iso2 === 'EC')?.name).toBe('Ecuador');
  });

  it('los nombres cambian con el locale', () => {
    expect(countryList('es-MX').find((c) => c.iso2 === 'DE')?.name).toBe('Alemania');
    expect(countryList('en-US').find((c) => c.iso2 === 'DE')?.name).toBe('Germany');
  });

  it('viene ordenada por nombre con el collator del locale', () => {
    const names = countryList('es-MX').map((c) => c.name);
    const sorted = [...names].sort(new Intl.Collator('es-MX').compare);
    expect(names).toEqual(sorted);
  });

  it('memoiza por locale: la misma llamada devuelve la misma referencia', () => {
    expect(countryList('es-MX')).toBe(countryList('es-MX'));
  });

  it('cada país lleva su bandera y su rango', () => {
    const ec = countryList('es-MX').find((c) => c.iso2 === 'EC')!;
    expect(ec.flag).toBe(flagEmoji('EC'));
    expect([ec.min, ec.max]).toEqual([BY_ISO2.get('EC')![2], BY_ISO2.get('EC')![3]]);
  });
});

describe('filterCountries', () => {
  const list = countryList('es-MX');

  it('filtra por nombre sin acentos ni mayúsculas', () => {
    expect(filterCountries(list, 'espana').map((c) => c.iso2)).toContain('ES');
    // 'ECUA' también encuentra Guinea Ecuatorial: busca en cualquier parte del
    // nombre, no solo al principio.
    expect(filterCountries(list, 'ECUA').map((c) => c.iso2)).toEqual(['EC', 'GQ']);
  });

  it('filtra por prefijo con y sin +', () => {
    expect(filterCountries(list, '593').map((c) => c.iso2)).toEqual(['EC']);
    expect(filterCountries(list, '+593').map((c) => c.iso2)).toEqual(['EC']);
  });

  it('filtra por código ISO', () => {
    expect(filterCountries(list, 'ec').map((c) => c.iso2)).toContain('EC');
  });

  it('una consulta vacía devuelve la lista entera', () => {
    expect(filterCountries(list, '   ')).toBe(list);
  });

  it('no devuelve nada con una consulta imposible', () => {
    expect(filterCountries(list, 'zzzzz')).toEqual([]);
  });
});
