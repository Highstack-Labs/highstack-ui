/**
 * Prefijos telefónicos E.164 por país.
 *
 * Es la única tabla estática de la librería, y existe porque el paquete no tiene
 * dependencias runtime: traer `libphonenumber-js` (~145 KB) para resolver un
 * prefijo sería desproporcionado. El costo aquí son ~7 KB de fuente que además
 * se van del bundle de quien nunca importe `PhoneInputComponent`.
 *
 * Lo que NO está aquí, a propósito:
 *  - Los nombres de país: salen de `Intl.DisplayNames` según el locale.
 *  - Las reglas de operadora (qué prefijos de móvil existen en cada país). Los
 *    rangos de abajo solo dicen CUÁNTOS dígitos lleva el número nacional, así
 *    que `+593000000000` pasa la validación. Para más rigor hace falta una
 *    validación de servidor.
 *  - Los NPA del plan norteamericano: US, CA, PR y el resto del NANP comparten
 *    el prefijo `1` y no se distinguen por el número. Ver `PRIMARY_BY_DIAL`.
 *
 * Fuente de los prefijos: asignaciones ITU-T E.164. Una entrada por línea y en
 * orden alfabético de ISO2 para que sea fácil de revisar y corregir.
 */

/** `[iso2, prefijo, mínDígitos, máxDígitos, agrupación?]` del número nacional. */
export type CountryCode = readonly [string, string, number, number, string?];

/**
 * Qué país gana cuando varios comparten prefijo y no hay nada más que desempate.
 * Sin esto, un `+1` que llega de fuera se resolvería al primero de la lista
 * (Antigua) en vez de a Estados Unidos.
 *
 * Solo es el desempate final: si el usuario ya eligió un país con ese mismo
 * prefijo, su elección manda (ver `parseE164` en `phone-utils.ts`).
 */
export const PRIMARY_BY_DIAL: Readonly<Record<string, string>> = {
  '1': 'US', // NANP: CA, PR, JM, BS…
  '7': 'RU', // + KZ
  '39': 'IT', // + VA
  '44': 'GB', // + JE, GG, IM
  '47': 'NO', // + SJ
  '61': 'AU', // + CC, CX
  '212': 'MA', // + EH
  '262': 'RE', // + YT
  '358': 'FI', // + AX
  '590': 'GP', // + BL, MF
  '599': 'CW', // + BQ
};

/**
 * La agrupación es un patrón de cuentas de dígitos separado por guiones
 * (`'2-3-4'` → `98 765 4321`). Solo la llevan los países donde el formato es
 * conocido y estable; el resto se muestra sin espacios, que es mejor que
 * inventarse una agrupación equivocada.
 */
export const COUNTRY_CODES: readonly CountryCode[] = [
  ['AD', '376', 6, 6],
  ['AE', '971', 9, 9, '2-3-4'],
  ['AF', '93', 9, 9],
  ['AG', '1', 10, 10, '3-3-4'],
  ['AI', '1', 10, 10, '3-3-4'],
  ['AL', '355', 9, 9],
  ['AM', '374', 8, 8],
  ['AO', '244', 9, 9],
  ['AR', '54', 10, 11],
  ['AS', '1', 10, 10, '3-3-4'],
  ['AT', '43', 4, 13],
  ['AU', '61', 9, 9, '3-3-3'],
  ['AW', '297', 7, 7],
  ['AX', '358', 9, 10],
  ['AZ', '994', 9, 9],
  ['BA', '387', 8, 9],
  ['BB', '1', 10, 10, '3-3-4'],
  ['BD', '880', 8, 10],
  ['BE', '32', 8, 9],
  ['BF', '226', 8, 8],
  ['BG', '359', 8, 9],
  ['BH', '973', 8, 8],
  ['BI', '257', 8, 8],
  ['BJ', '229', 8, 10],
  ['BL', '590', 9, 9],
  ['BM', '1', 10, 10, '3-3-4'],
  ['BN', '673', 7, 7],
  ['BO', '591', 8, 8],
  ['BQ', '599', 7, 7],
  ['BR', '55', 10, 11],
  ['BS', '1', 10, 10, '3-3-4'],
  ['BT', '975', 7, 8],
  ['BW', '267', 7, 8],
  ['BY', '375', 9, 9],
  ['BZ', '501', 7, 7],
  ['CA', '1', 10, 10, '3-3-4'],
  ['CC', '61', 9, 9, '3-3-3'],
  ['CD', '243', 9, 9],
  ['CF', '236', 8, 8],
  ['CG', '242', 9, 9],
  ['CH', '41', 9, 9, '2-3-2-2'],
  ['CI', '225', 8, 10],
  ['CK', '682', 5, 5],
  ['CL', '56', 9, 9, '1-4-4'],
  ['CM', '237', 9, 9],
  ['CN', '86', 5, 12],
  ['CO', '57', 10, 10, '3-3-4'],
  ['CR', '506', 8, 8, '4-4'],
  ['CU', '53', 6, 8],
  ['CV', '238', 7, 7],
  ['CW', '599', 7, 8],
  ['CX', '61', 9, 9, '3-3-3'],
  ['CY', '357', 8, 8],
  ['CZ', '420', 9, 9, '3-3-3'],
  ['DE', '49', 6, 11],
  ['DJ', '253', 8, 8],
  ['DK', '45', 8, 8, '2-2-2-2'],
  ['DM', '1', 10, 10, '3-3-4'],
  ['DO', '1', 10, 10, '3-3-4'],
  ['DZ', '213', 8, 9],
  ['EC', '593', 9, 9, '2-3-4'],
  ['EE', '372', 7, 8],
  ['EG', '20', 9, 10],
  ['EH', '212', 9, 9],
  ['ER', '291', 7, 7],
  ['ES', '34', 9, 9, '3-3-3'],
  ['ET', '251', 9, 9],
  ['FI', '358', 9, 10],
  ['FJ', '679', 7, 7],
  ['FK', '500', 5, 5],
  ['FM', '691', 7, 7],
  ['FO', '298', 6, 6],
  ['FR', '33', 9, 9, '1-2-2-2-2'],
  ['GA', '241', 7, 8],
  ['GB', '44', 9, 10, '4-6'],
  ['GD', '1', 10, 10, '3-3-4'],
  ['GE', '995', 9, 9],
  ['GF', '594', 9, 9],
  ['GG', '44', 10, 10, '4-6'],
  ['GH', '233', 9, 9],
  ['GI', '350', 8, 8],
  ['GL', '299', 6, 6],
  ['GM', '220', 7, 7],
  ['GN', '224', 9, 9],
  ['GP', '590', 9, 9],
  ['GQ', '240', 9, 9],
  ['GR', '30', 10, 10, '3-3-4'],
  ['GT', '502', 8, 8, '4-4'],
  ['GU', '1', 10, 10, '3-3-4'],
  ['GW', '245', 7, 9],
  ['GY', '592', 7, 7],
  ['HK', '852', 8, 8, '4-4'],
  ['HN', '504', 8, 8, '4-4'],
  ['HR', '385', 8, 9],
  ['HT', '509', 8, 8, '4-4'],
  ['HU', '36', 8, 9],
  ['ID', '62', 5, 12],
  ['IE', '353', 7, 9],
  ['IL', '972', 8, 9],
  ['IM', '44', 10, 10, '4-6'],
  ['IN', '91', 10, 10, '5-5'],
  ['IQ', '964', 9, 10],
  ['IR', '98', 10, 10],
  ['IS', '354', 7, 9],
  ['IT', '39', 6, 11],
  ['JE', '44', 10, 10, '4-6'],
  ['JM', '1', 10, 10, '3-3-4'],
  ['JO', '962', 8, 9],
  ['JP', '81', 9, 10, '2-4-4'],
  ['KE', '254', 9, 9],
  ['KG', '996', 9, 9],
  ['KH', '855', 8, 9],
  ['KI', '686', 5, 8],
  ['KM', '269', 7, 7],
  ['KN', '1', 10, 10, '3-3-4'],
  ['KP', '850', 4, 13],
  ['KR', '82', 9, 10],
  ['KW', '965', 8, 8, '4-4'],
  ['KY', '1', 10, 10, '3-3-4'],
  ['KZ', '7', 10, 10, '3-3-2-2'],
  ['LA', '856', 8, 10],
  ['LB', '961', 7, 8],
  ['LC', '1', 10, 10, '3-3-4'],
  ['LI', '423', 7, 7],
  ['LK', '94', 9, 9],
  ['LR', '231', 7, 9],
  ['LS', '266', 8, 8],
  ['LT', '370', 8, 8],
  ['LU', '352', 6, 9],
  ['LV', '371', 8, 8],
  ['LY', '218', 9, 9],
  ['MA', '212', 9, 9],
  ['MC', '377', 8, 9],
  ['MD', '373', 8, 8],
  ['ME', '382', 8, 8],
  ['MF', '590', 9, 9],
  ['MG', '261', 9, 9],
  ['MH', '692', 7, 7],
  ['MK', '389', 8, 8],
  ['ML', '223', 8, 8],
  ['MM', '95', 7, 10],
  ['MN', '976', 8, 8],
  ['MO', '853', 8, 8, '4-4'],
  ['MP', '1', 10, 10, '3-3-4'],
  ['MQ', '596', 9, 9],
  ['MR', '222', 8, 8],
  ['MS', '1', 10, 10, '3-3-4'],
  ['MT', '356', 8, 8],
  ['MU', '230', 7, 8],
  ['MV', '960', 7, 7],
  ['MW', '265', 7, 9],
  ['MX', '52', 10, 10, '2-4-4'],
  ['MY', '60', 7, 10],
  ['MZ', '258', 8, 9],
  ['NA', '264', 8, 9],
  ['NC', '687', 6, 6],
  ['NE', '227', 8, 8],
  ['NF', '672', 5, 6],
  ['NG', '234', 7, 11],
  ['NI', '505', 8, 8, '4-4'],
  ['NL', '31', 9, 9, '1-4-4'],
  ['NO', '47', 8, 8, '3-2-3'],
  ['NP', '977', 8, 10],
  ['NR', '674', 4, 7],
  ['NU', '683', 4, 4],
  ['NZ', '64', 8, 10],
  ['OM', '968', 8, 8, '4-4'],
  ['PA', '507', 7, 8],
  ['PE', '51', 8, 9],
  ['PF', '689', 6, 8],
  ['PG', '675', 7, 8],
  ['PH', '63', 8, 10],
  ['PK', '92', 9, 10],
  ['PL', '48', 9, 9, '3-3-3'],
  ['PM', '508', 6, 6],
  ['PR', '1', 10, 10, '3-3-4'],
  ['PS', '970', 8, 9],
  ['PT', '351', 9, 9, '3-3-3'],
  ['PW', '680', 7, 7],
  ['PY', '595', 9, 9],
  ['QA', '974', 7, 8],
  ['RE', '262', 9, 9],
  ['RO', '40', 9, 9, '3-3-3'],
  ['RS', '381', 8, 9],
  ['RU', '7', 10, 10, '3-3-2-2'],
  ['RW', '250', 9, 9],
  ['SA', '966', 8, 9],
  ['SB', '677', 5, 7],
  ['SC', '248', 7, 7],
  ['SD', '249', 9, 9],
  ['SE', '46', 7, 9],
  ['SG', '65', 8, 8, '4-4'],
  ['SH', '290', 4, 4],
  ['SI', '386', 8, 8],
  ['SJ', '47', 8, 8, '3-2-3'],
  ['SK', '421', 9, 9, '3-3-3'],
  ['SL', '232', 8, 8],
  ['SM', '378', 6, 10],
  ['SN', '221', 9, 9],
  ['SO', '252', 7, 9],
  ['SR', '597', 6, 7],
  ['SS', '211', 9, 9],
  ['ST', '239', 7, 7],
  ['SV', '503', 8, 8, '4-4'],
  ['SX', '1', 10, 10, '3-3-4'],
  ['SY', '963', 8, 9],
  ['SZ', '268', 8, 8],
  ['TC', '1', 10, 10, '3-3-4'],
  ['TD', '235', 8, 8],
  ['TG', '228', 8, 8],
  ['TH', '66', 8, 9],
  ['TJ', '992', 9, 9],
  ['TK', '690', 4, 5],
  ['TL', '670', 7, 8],
  ['TM', '993', 8, 8],
  ['TN', '216', 8, 8],
  ['TO', '676', 5, 7],
  ['TR', '90', 10, 10, '3-3-2-2'],
  ['TT', '1', 10, 10, '3-3-4'],
  ['TV', '688', 5, 6],
  ['TW', '886', 8, 9],
  ['TZ', '255', 9, 9],
  ['UA', '380', 9, 9, '2-3-2-2'],
  ['UG', '256', 9, 9],
  ['US', '1', 10, 10, '3-3-4'],
  ['UY', '598', 8, 9],
  ['UZ', '998', 9, 9],
  ['VA', '39', 10, 10],
  ['VC', '1', 10, 10, '3-3-4'],
  ['VE', '58', 10, 10, '3-7'],
  ['VG', '1', 10, 10, '3-3-4'],
  ['VI', '1', 10, 10, '3-3-4'],
  ['VN', '84', 9, 10],
  ['VU', '678', 5, 7],
  ['WF', '681', 6, 6],
  ['WS', '685', 5, 7],
  ['XK', '383', 8, 9],
  ['YE', '967', 7, 9],
  ['YT', '262', 9, 9],
  ['ZA', '27', 9, 9, '2-3-4'],
  ['ZM', '260', 9, 9],
  ['ZW', '263', 9, 10],
];

/** Índice por ISO2. Se construye una vez al cargar el módulo. */
export const BY_ISO2: ReadonlyMap<string, CountryCode> = new Map(
  COUNTRY_CODES.map((entry) => [entry[0], entry]),
);

/**
 * Índice por prefijo. Los candidatos de cada prefijo salen con el primario
 * primero (ver `PRIMARY_BY_DIAL`), así que `get('1')[0]` ya es Estados Unidos.
 */
export const BY_DIAL: ReadonlyMap<string, readonly CountryCode[]> = (() => {
  const map = new Map<string, CountryCode[]>();
  for (const entry of COUNTRY_CODES) {
    const list = map.get(entry[1]);
    if (list) list.push(entry);
    else map.set(entry[1], [entry]);
  }
  for (const [dial, list] of map) {
    const primary = PRIMARY_BY_DIAL[dial];
    if (!primary) continue;
    const index = list.findIndex((entry) => entry[0] === primary);
    if (index > 0) list.unshift(list.splice(index, 1)[0]);
  }
  return map;
})();

/** El prefijo más largo que existe en la tabla (`'1'` … `'1809'` no, pero sí `'998'`). */
export const MAX_DIAL_LENGTH: number = COUNTRY_CODES.reduce(
  (max, entry) => Math.max(max, entry[1].length),
  0,
);
