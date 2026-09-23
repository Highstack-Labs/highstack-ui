import {
  addDays,
  addMonths,
  buildMonthGrid,
  daysInMonth,
  isValidIso,
  parseIso,
  startOfMonth,
  toIso,
  today,
  weekday,
} from './date-utils';

describe('parseIso', () => {
  it('parsea una fecha válida', () => {
    expect(parseIso('2026-07-31')).toEqual({ y: 2026, m: 7, d: 31 });
  });

  it('rechaza días que no existen en ese mes', () => {
    expect(parseIso('2026-02-30')).toBeNull();
    expect(parseIso('2026-04-31')).toBeNull();
  });

  it('rechaza meses fuera de rango', () => {
    expect(parseIso('2026-13-01')).toBeNull();
    expect(parseIso('2026-00-10')).toBeNull();
  });

  it('rechaza formatos que no son YYYY-MM-DD', () => {
    expect(parseIso('2026-7-31')).toBeNull();
    expect(parseIso('31/07/2026')).toBeNull();
    expect(parseIso('')).toBeNull();
    expect(parseIso('no-soy-fecha')).toBeNull();
  });

  it('acepta el 29 de febrero solo en bisiesto', () => {
    expect(parseIso('2024-02-29')).not.toBeNull();
    expect(parseIso('2026-02-29')).toBeNull();
  });
});

describe('daysInMonth', () => {
  it('cubre la regla de los siglos', () => {
    // Divisible entre 4 -> bisiesto.
    expect(daysInMonth(2024, 2)).toBe(29);
    // Divisible entre 100 pero no entre 400 -> NO bisiesto. La que todos olvidan.
    expect(daysInMonth(2100, 2)).toBe(28);
    // Divisible entre 400 -> bisiesto.
    expect(daysInMonth(2000, 2)).toBe(29);
  });

  it('devuelve los largos normales', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
  });
});

describe('addMonths', () => {
  it('trunca el día cuando el mes destino es más corto', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
  });

  it('cruza el año en ambos sentidos', () => {
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15');
  });
});

describe('addDays', () => {
  it('cruza mes y año', () => {
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('cruza el 29 de febrero en bisiesto', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });
});

describe('weekday', () => {
  it('devuelve 0 para domingo', () => {
    // 2026-08-02 es domingo.
    expect(weekday('2026-08-02')).toBe(0);
    expect(weekday('2026-07-31')).toBe(5); // viernes
  });
});

describe('orden lexicográfico', () => {
  it('coincide con el orden cronológico', () => {
    // Esta es la propiedad de la que depende todo min/max del componente.
    expect('2026-01-05' < '2026-11-02').toBe(true);
    expect('2026-02-10' < '2026-02-09').toBe(false);
  });
});

describe('buildMonthGrid', () => {
  it('siempre devuelve 42 celdas, sin importar el mes', () => {
    // Febrero 2026 empieza en domingo y tiene 28 días: cabe en 4 semanas,
    // pero el grid debe seguir siendo de 6 para que el panel no cambie de alto.
    expect(buildMonthGrid('2026-02-01', 0)).toHaveLength(42);
    expect(buildMonthGrid('2026-08-01', 0)).toHaveLength(42);
    expect(buildMonthGrid('2026-05-01', 1)).toHaveLength(42);
  });

  it('la primera celda es el inicio de semana pedido', () => {
    // Julio 2026 empieza en miércoles.
    const domingo = buildMonthGrid('2026-07-01', 0);
    expect(weekday(domingo[0])).toBe(0);
    expect(domingo[0]).toBe('2026-06-28');

    const lunes = buildMonthGrid('2026-07-01', 1);
    expect(weekday(lunes[0])).toBe(1);
    expect(lunes[0]).toBe('2026-06-29');
  });

  it('es una secuencia continua de días sin huecos', () => {
    const grid = buildMonthGrid('2026-07-01', 0);
    for (let i = 1; i < grid.length; i++) {
      expect(grid[i]).toBe(addDays(grid[i - 1], 1));
    }
  });

  it('contiene todos los días del mes pedido', () => {
    const grid = buildMonthGrid('2026-07-01', 0);
    expect(grid).toContain('2026-07-01');
    expect(grid).toContain('2026-07-31');
  });
});

describe('helpers', () => {
  it('toIso rellena con ceros', () => {
    expect(toIso(2026, 7, 1)).toBe('2026-07-01');
  });

  it('startOfMonth normaliza al día 1', () => {
    expect(startOfMonth('2026-07-31')).toBe('2026-07-01');
  });

  it('isValidIso es consistente con parseIso', () => {
    expect(isValidIso('2026-07-31')).toBe(true);
    expect(isValidIso('2026-02-30')).toBe(false);
  });

  it('today devuelve un ISO válido', () => {
    expect(isValidIso(today())).toBe(true);
  });
});

import {
  formatForDisplay,
  fullDateLabel,
  monthLabel,
  parseLocalized,
  resolveWeekStart,
  weekdayLabels,
} from './date-utils';

describe('resolveWeekStart', () => {
  it('convierte de numeración ISO (1=lunes..7=domingo) a 0=domingo', () => {
    // es-MX arranca en domingo: Intl dice 7, nosotros usamos 0.
    expect(resolveWeekStart('es-MX')).toBe(0);
    expect(resolveWeekStart('en-US')).toBe(0);
    // es-ES arranca en lunes: Intl dice 1 y 1 también es lunes en 0-6.
    expect(resolveWeekStart('es-ES')).toBe(1);
    expect(resolveWeekStart('en-GB')).toBe(1);
  });

  it('cae en domingo si el locale es basura', () => {
    // Tiene que ser un tag malformado de verdad: uno bien formado pero
    // desconocido ('xx-YY-nonsense') Intl lo acepta y responde lunes.
    expect(resolveWeekStart('no soy locale')).toBe(0);
    expect(resolveWeekStart('@@@')).toBe(0);
  });
});

describe('monthLabel', () => {
  it('usa el idioma del locale', () => {
    expect(monthLabel('2026-07-01', 'es-MX').toLowerCase()).toContain('julio');
    expect(monthLabel('2026-07-01', 'en-US').toLowerCase()).toContain('july');
  });

  it('incluye el año', () => {
    expect(monthLabel('2026-07-01', 'es-MX')).toContain('2026');
  });
});

describe('weekdayLabels', () => {
  it('devuelve siete etiquetas', () => {
    expect(weekdayLabels('es-MX', 0)).toHaveLength(7);
  });

  it('rota según el inicio de semana', () => {
    const domingo = weekdayLabels('es-MX', 0);
    const lunes = weekdayLabels('es-MX', 1);
    // La primera del lunes es la segunda del domingo.
    expect(lunes[0]).toBe(domingo[1]);
    expect(lunes[6]).toBe(domingo[0]);
  });
});

describe('formatForDisplay', () => {
  it('respeta el orden del locale', () => {
    expect(formatForDisplay('2026-07-31', 'es-MX')).toBe('31/07/2026');
    expect(formatForDisplay('2026-07-31', 'en-US')).toBe('07/31/2026');
  });

  it('devuelve cadena vacía si no hay fecha', () => {
    expect(formatForDisplay('', 'es-MX')).toBe('');
  });
});

describe('fullDateLabel', () => {
  it('escribe la fecha en palabras para el aria-label', () => {
    // '31/07/2026' se lee como números sueltos en un lector de pantalla.
    const label = fullDateLabel('2026-07-31', 'es-MX');
    expect(label).toContain('31');
    expect(label.toLowerCase()).toContain('julio');
    expect(label).toContain('2026');
  });

  it('devuelve cadena vacía si no hay fecha', () => {
    expect(fullDateLabel('', 'es-MX')).toBe('');
  });
});

describe('parseLocalized', () => {
  it('lee el orden del locale', () => {
    expect(parseLocalized('31/07/2026', 'es-MX')).toBe('2026-07-31');
    expect(parseLocalized('07/31/2026', 'en-US')).toBe('2026-07-31');
  });

  it('acepta ceros a la izquierda opcionales', () => {
    expect(parseLocalized('1/7/2026', 'es-MX')).toBe('2026-07-01');
  });

  it('acepta separadores alternativos', () => {
    expect(parseLocalized('31-07-2026', 'es-MX')).toBe('2026-07-31');
  });

  it('rechaza años de dos dígitos por ambiguos', () => {
    expect(parseLocalized('31/07/26', 'es-MX')).toBeNull();
  });

  it('rechaza texto incompleto o basura', () => {
    expect(parseLocalized('31/0', 'es-MX')).toBeNull();
    expect(parseLocalized('abc', 'es-MX')).toBeNull();
    expect(parseLocalized('', 'es-MX')).toBeNull();
  });

  it('rechaza fechas que no existen', () => {
    expect(parseLocalized('31/02/2026', 'es-MX')).toBeNull();
  });
});
