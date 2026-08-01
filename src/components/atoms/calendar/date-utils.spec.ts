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
