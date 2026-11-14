/* ==========================================================================
   Yupana · datos de referencia
   Factores, límites y tablas de apoyo. Revise siempre la vigencia normativa
   de su país: estos valores son referenciales y editables en cada herramienta.
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL = window.GL || {};
  const D = GL.data = {};

  D.version = '2026.1';

  /* --------------------------------------------------------- clima / gases */
  D.GWP = {
    note: 'IPCC, GWP100. El valor de CH₄ de AR6 corresponde al metano no fósil. La elección del juego de valores debe declararse en el informe.',
    sets: {
      AR6: { label: 'AR6 (2021) · CH₄ no fósil', CO2: 1, CH4: 27.0, N2O: 273 },
      AR5: { label: 'AR5 (2013) · 100 años', CO2: 1, CH4: 28, N2O: 265 },
      AR4: { label: 'AR4 (2007) · 100 años', CO2: 1, CH4: 25, N2O: 298 }
    }
  };

  D.ipcc = {
    // IPCC 2019 Refinement, valores por defecto referenciales.
    // EF1 agregado = 0.010 (0.002–0.018). Para clima húmedo se desagrega:
    // sintético 0.016 (0.013–0.019) y orgánico/residuos 0.006 (0.001–0.011).
    // Para clima seco, todos los aportes usan 0.005 (0.000–0.011).
    EF1: 0.010,          // kg N2O-N / kg N añadido (agregado, directo)
    EF1_syn_wet: 0.016,  // kg N2O-N / kg N sintético en clima húmedo
    EF1_org: 0.006,      // kg N2O-N / kg N orgánico o de residuos en clima húmedo
    EF1_dry: 0.005,      // kg N2O-N / kg N en clima seco (todos los aportes)
    EF1_range: { synWet: [0.013, 0.019], orgWet: [0.001, 0.011], dry: [0.000, 0.011], agg: [0.002, 0.018] },
    EF4: 0.010,          // kg N2O-N / kg N volatilizado
    EF5: 0.011,          // kg N2O-N / kg N lixiviado (0.010 AR5)
    FracGASF: 0.11,      // fracción de N sintético volatilizado como NH3/NOx
    FracGASM: 0.21,      // fracción de N orgánico volatilizado como NH3/NOx
    FracLEACH: 0.24,
    EF_enteric: 60,      // kg CH4 / cabeza / año (bovino lechero, referencial)
    EF_manure: 10,       // kg CH4 / cabeza / año
    Nex: 0.10,           // kg N excretado / kg N ingerido (simplificado)
    diesel: 2.68,        // kg CO2 / L
    gasoline: 2.31,      // kg CO2 / L
    electricity: 0.45,   // kg CO2e / kWh (mix referencial LATAM)
    lime: 0.44,          // kg CO2 / kg cal
    urea: 0.20           // kg CO2 / kg urea
  };

  /* ------------------------------------------------------------- aire/ruido */
  D.ecaRuido = {
    source: 'D.S. 085-2003-PCM (Perú), horario diurno 07:00–22:00.',
    zones: [
      { id: 'especial', label: 'Zona de protección especial', day: 50, night: 40 },
      { id: 'residencial', label: 'Zona residencial', day: 60, night: 50 },
      { id: 'comercial', label: 'Zona comercial', day: 70, night: 60 },
      { id: 'industrial', label: 'Zona industrial', day: 80, night: 70 }
    ]
  };

  D.ecaAire = {
    source: 'D.S. 003-2017-MINAM (Anexo) y D.S. 011-2023-MINAM (Cd, As y Cr en PM10). Cada valor corresponde al período y criterio indicados.',
    note: 'Los seis primeros identificadores conservan el período principal usado por las herramientas existentes. Los promedios anuales y los metales se añaden con identificadores propios.',
    params: [
      { id: 'pm25', label: 'PM2,5 · 24 h', limit: 50, unit: 'µg/m³', period: '24 h', criterion: 'No exceder más de 7 veces al año', group: 'partículas' },
      { id: 'pm10', label: 'PM10 · 24 h', limit: 100, unit: 'µg/m³', period: '24 h', criterion: 'No exceder más de 7 veces al año', group: 'partículas' },
      { id: 'so2', label: 'SO₂ · 24 h', limit: 250, unit: 'µg/m³', period: '24 h', criterion: 'No exceder más de 7 veces al año', group: 'gases' },
      { id: 'no2', label: 'NO₂ · 1 h', limit: 200, unit: 'µg/m³', period: '1 h', criterion: 'No exceder más de 24 veces al año', group: 'gases' },
      { id: 'o3', label: 'O₃ · 8 h', limit: 100, unit: 'µg/m³', period: '8 h', criterion: 'Máxima media diaria; no exceder más de 24 veces al año', group: 'gases' },
      { id: 'co', label: 'CO · 8 h', limit: 10000, unit: 'µg/m³', period: '8 h', criterion: 'Media aritmética móvil', group: 'gases' },
      { id: 'pm25_annual', label: 'PM2,5 · anual', limit: 25, unit: 'µg/m³', period: 'anual', criterion: 'Media aritmética anual', group: 'partículas' },
      { id: 'pm10_annual', label: 'PM10 · anual', limit: 50, unit: 'µg/m³', period: 'anual', criterion: 'Media aritmética anual', group: 'partículas' },
      { id: 'no2_annual', label: 'NO₂ · anual', limit: 100, unit: 'µg/m³', period: 'anual', criterion: 'Media aritmética anual', group: 'gases' },
      { id: 'co_1h', label: 'CO · 1 h', limit: 30000, unit: 'µg/m³', period: '1 h', criterion: 'No exceder más de 1 vez al año', group: 'gases' },
      { id: 'pb_month', label: 'Pb en PM10 · mensual', limit: 1.5, unit: 'µg/m³', period: 'mensual', criterion: 'No exceder más de 4 veces al año', group: 'metales' },
      { id: 'pb_annual', label: 'Pb en PM10 · anual', limit: 0.5, unit: 'µg/m³', period: 'anual', criterion: 'Media aritmética de los valores mensuales', group: 'metales' },
      { id: 'h2s_24h', label: 'H₂S · 24 h', limit: 150, unit: 'µg/m³', period: '24 h', criterion: 'Media aritmética', group: 'gases' },
      { id: 'c6h6_annual', label: 'Benceno (C₆H₆) · anual', limit: 2, unit: 'µg/m³', period: 'anual', criterion: 'Media aritmética anual', group: 'orgánicos' },
      { id: 'hg_24h', label: 'Mercurio gaseoso total · 24 h', limit: 2, unit: 'µg/m³', period: '24 h', criterion: 'No exceder', group: 'metales' },
      { id: 'as_24h', label: 'Arsénico en PM10 · 24 h', limit: 0.3, unit: 'µg/m³', period: '24 h', criterion: 'No exceder', group: 'metales' },
      { id: 'as_annual', label: 'Arsénico en PM10 · anual', limit: 0.023, unit: 'µg/m³', period: 'anual', criterion: 'Media aritmética anual', group: 'metales' },
      { id: 'cd_24h', label: 'Cadmio en PM10 · 24 h', limit: 0.09, unit: 'µg/m³', period: '24 h', criterion: 'No exceder', group: 'metales' },
      { id: 'cd_annual', label: 'Cadmio en PM10 · anual', limit: 0.018, unit: 'µg/m³', period: 'anual', criterion: 'Media aritmética anual', group: 'metales' },
      { id: 'cr_24h', label: 'Cromo en PM10 · 24 h', limit: 0.5, unit: 'µg/m³', period: '24 h', criterion: 'No exceder', group: 'metales' },
      { id: 'cr_annual', label: 'Cromo en PM10 · anual', limit: 0.11, unit: 'µg/m³', period: 'anual', criterion: 'Media aritmética anual', group: 'metales' }
    ]
  };

  // EPA AQI (revisión 2024) para PM2.5 24 h
  D.aqiPM25 = {
    breakpoints: [
      { cLow: 0.0, cHigh: 9.0, iLow: 0, iHigh: 50, cat: 'Buena', tone: 'ok' },
      { cLow: 9.1, cHigh: 35.4, iLow: 51, iHigh: 100, cat: 'Moderada', tone: 'warn' },
      { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150, cat: 'Dañina para grupos sensibles', tone: 'warn' },
      { cLow: 55.5, cHigh: 125.4, iLow: 151, iHigh: 200, cat: 'Dañina', tone: 'bad' },
      { cLow: 125.5, cHigh: 225.4, iLow: 201, iHigh: 300, cat: 'Muy dañina', tone: 'bad' },
      { cLow: 225.5, cHigh: 325.4, iLow: 301, iHigh: 500, cat: 'Peligrosa', tone: 'bad' }
    ],
    who24: 15,
    whoAnnual: 5
  };

  D.briggs = {
    note: 'Coeficientes rurales de Pasquill–Gifford / Briggs para x entre 100 m y 10 km. Modelo de cribado, no reemplaza AERMOD/CALPUFF.',
    sigma: {
      A: { y: x => 0.22 * x / Math.sqrt(1 + 0.0001 * x), z: x => 0.20 * x },
      B: { y: x => 0.16 * x / Math.sqrt(1 + 0.0001 * x), z: x => 0.12 * x },
      C: { y: x => 0.11 * x / Math.sqrt(1 + 0.0001 * x), z: x => 0.08 * x / Math.sqrt(1 + 0.0002 * x) },
      D: { y: x => 0.08 * x / Math.sqrt(1 + 0.0001 * x), z: x => 0.06 * x / Math.sqrt(1 + 0.0015 * x) },
      E: { y: x => 0.06 * x / Math.sqrt(1 + 0.0001 * x), z: x => 0.03 * x / (1 + 0.0003 * x) },
      F: { y: x => 0.04 * x / Math.sqrt(1 + 0.0001 * x), z: x => 0.016 * x / (1 + 0.0003 * x) }
    },
    stability: [
      { id: 'A', label: 'A · Muy inestable' },
      { id: 'B', label: 'B · Inestable' },
      { id: 'C', label: 'C · Ligeramente inestable' },
      { id: 'D', label: 'D · Neutra' },
      { id: 'E', label: 'E · Ligeramente estable' },
      { id: 'F', label: 'F · Estable' }
    ]
  };

  /* ---------------------------------------------------------------- suelos */
  D.textureBD = [
    { id: 'arena', label: 'Arena', max: 1.60, ideal: [1.40, 1.55] },
    { id: 'arena-franca', label: 'Arena franca', max: 1.60, ideal: [1.40, 1.55] },
    { id: 'franco-arenoso', label: 'Franco arenoso', max: 1.60, ideal: [1.35, 1.50] },
    { id: 'franco', label: 'Franco', max: 1.50, ideal: [1.25, 1.45] },
    { id: 'franco-limoso', label: 'Franco limoso', max: 1.50, ideal: [1.20, 1.40] },
    { id: 'limo', label: 'Limo', max: 1.40, ideal: [1.10, 1.30] },
    { id: 'franco-arcilloso', label: 'Franco arcilloso', max: 1.40, ideal: [1.10, 1.35] },
    { id: 'franco-arcillo-limoso', label: 'Franco arcillo limoso', max: 1.40, ideal: [1.05, 1.30] },
    { id: 'arcillo-limoso', label: 'Arcillo limoso', max: 1.30, ideal: [1.00, 1.25] },
    { id: 'arcilloso', label: 'Arcilloso', max: 1.20, ideal: [0.95, 1.15] }
  ];

  D.crops = {
    maiz: {
      label: 'Maíz', pH: [5.8, 7.0], p: [10, 20], k: [120, 200], om: [2.0, 4.0], cec: [10, 25], b: [0.5, 2.0], zn: [1.0, 5.0]
    },
    trigo: {
      label: 'Trigo', pH: [6.0, 7.5], p: [12, 25], k: [100, 180], om: [1.5, 3.0], cec: [10, 25], b: [0.5, 1.5], zn: [0.8, 4.0]
    },
    arroz: {
      label: 'Arroz', pH: [5.5, 6.5], p: [8, 15], k: [80, 150], om: [2.0, 4.0], cec: [12, 25], b: [0.3, 1.5], zn: [0.5, 3.0]
    },
    papa: {
      label: 'Papa', pH: [5.5, 6.5], p: [15, 25], k: [150, 250], om: [2.0, 5.0], cec: [10, 25], b: [0.5, 2.0], zn: [1.0, 5.0]
    },
    cafe: {
      label: 'Café', pH: [5.5, 6.5], p: [10, 20], k: [150, 250], om: [3.0, 5.0], cec: [12, 30], b: [0.5, 2.0], zn: [1.0, 5.0]
    },
    pastura: {
      label: 'Pastura', pH: [5.8, 7.0], p: [12, 25], k: [100, 200], om: [2.0, 4.0], cec: [10, 25], b: [0.5, 2.0], zn: [0.8, 5.0]
    },
    soja: {
      label: 'Soja', pH: [6.0, 7.0], p: [12, 25], k: [120, 200], om: [2.0, 4.0], cec: [10, 25], b: [0.5, 2.0], zn: [0.8, 4.0]
    }
  };

  D.soilVars = {
    ph: { label: 'pH', unit: '', cropKey: 'pH', better: 'range' },
    p: { label: 'Fósforo (Olsen)', unit: 'ppm', cropKey: 'p', better: 'high' },
    k: { label: 'Potasio', unit: 'ppm', cropKey: 'k', better: 'high' },
    om: { label: 'Materia orgánica', unit: '%', cropKey: 'om', better: 'high' },
    cec: { label: 'CIC', unit: 'cmol(+)/kg', cropKey: 'cec', better: 'range' },
    b: { label: 'Boro', unit: 'ppm', cropKey: 'b', better: 'range' },
    zn: { label: 'Zinc', unit: 'ppm', cropKey: 'zn', better: 'high' },
    ce: { label: 'Conductividad eléctrica', unit: 'dS/m', better: 'low', max: 2.0 },
    s: { label: 'Azufre', unit: 'ppm', better: 'high', min: 10 },
    ca: { label: 'Calcio', unit: 'ppm', better: 'high', min: 1000 },
    mg: { label: 'Magnesio', unit: 'ppm', better: 'high', min: 100 },
    na: { label: 'Sodio', unit: 'ppm', better: 'low', max: 200 }
  };

  /* --------------------------------------------------------------- agua */
  D.treatment = {
    bodPerCapita: 54, // g DBO5/hab/día (referencial LATAM)
    defaultDotacion: 150, // L/hab/día
    Y: 0.60, kd: 0.06, // lodos activados, d^-1
    SOTE: 0.18,
    O2density: 1.2, // kg aire/m3 a ~20 °C (densidad del aire; el O2 es 0.232 de la masa)
    energyPerKgO2: 1.0 // kWh/kg O2 aprox sopladores
  };

  D.landfill = {
    coverPct: 0.25,
    density: 0.9, // t/m3 residuos compactados
    docDefault: 0.18, // fracción de carbono orgánico degradable
    docf: 0.55, mcf: 1.0, fCH4: 0.5,
    methaneDensity: 0.717 // kg/m3
  };

  D.waterBalance = {
    note: 'Balance hídrico IWA/AWWA simplificado. El agua no contabilizada (ANC) incluye pérdidas reales y aparentes.'
  };

  /* --------------------------------------------------------------- SST */
  D.sst = {
    // Referencias peruanas: R.M. 050-2013-TR (indicadores) y OSHA (TRIR)
    bases: [
      { id: 'peru', label: 'R.M. 050-2013-TR · base 200 000 h', base: 200000 },
      { id: 'oit', label: 'OIT · base 1 000 000 h', base: 1000000 },
      { id: 'osha', label: 'OSHA · base 200 000 h', base: 200000 }
    ]
  };

  /*
    Multas SUNAFIL · art. 48.1 del Reglamento de la Ley 28806
    (D.S. 019-2006-TR, modificado por D.S. 008-2020-TR).
    La tabla oficial tiene tres escalas y valores fijos por tramo; no es una
    tabla única de rangos. Las tablas de micro y pequeña empresa ya incluyen
    la reducción del 50 % del art. 48.1-A.
  */
  D.safetyFines = {
    source: 'Art. 48.1 del Reglamento de la Ley 28806 (D.S. 019-2006-TR), modificado por D.S. 008-2020-TR. Tabla vigente al 11/11/2026.',
    uit: 5500,
    uitYear: 2026,
    uitSource: 'D.S. 301-2025-EF: UIT 2026 = S/ 5 500.',
    note: 'La UIT aplicable debe corresponder al año que establezca la norma vigente. La tabla de micro y pequeña empresa ya incorpora la reducción del 50 % del art. 48.1-A; no la aplique dos veces.',
    caps: {
      leve: 50,
      grave: 100,
      muyGrave: 200,
      procedure: 300,
      mypeIncomePct: 1
    },
    scales: {
      micro: {
        id: 'micro',
        label: 'Microempresa (REMYPE)',
        note: 'Hasta 10 trabajadores. La tabla oficial ya incluye la reducción del 50 %.',
        bands: [
          { min: 1, max: 1, label: '1', values: [0.045, 0.11, 0.23] },
          { min: 2, max: 2, label: '2', values: [0.05, 0.14, 0.25] },
          { min: 3, max: 3, label: '3', values: [0.07, 0.16, 0.29] },
          { min: 4, max: 4, label: '4', values: [0.08, 0.18, 0.32] },
          { min: 5, max: 5, label: '5', values: [0.09, 0.20, 0.36] },
          { min: 6, max: 6, label: '6', values: [0.11, 0.25, 0.41] },
          { min: 7, max: 7, label: '7', values: [0.14, 0.29, 0.47] },
          { min: 8, max: 8, label: '8', values: [0.16, 0.34, 0.54] },
          { min: 9, max: 9, label: '9', values: [0.18, 0.38, 0.61] },
          { min: 10, max: 10, label: '10 y más', values: [0.23, 0.45, 0.68] }
        ]
      },
      small: {
        id: 'small',
        label: 'Pequeña empresa (REMYPE)',
        note: 'La tabla oficial ya incluye la reducción del 50 %.',
        bands: [
          { min: 1, max: 5, label: '1 – 5', values: [0.09, 0.45, 0.77] },
          { min: 6, max: 10, label: '6 – 10', values: [0.14, 0.59, 0.99] },
          { min: 11, max: 20, label: '11 – 20', values: [0.18, 0.77, 1.28] },
          { min: 21, max: 30, label: '21 – 30', values: [0.23, 0.97, 1.64] },
          { min: 31, max: 40, label: '31 – 40', values: [0.32, 1.26, 2.14] },
          { min: 41, max: 50, label: '41 – 50', values: [0.45, 1.62, 2.75] },
          { min: 51, max: 60, label: '51 – 60', values: [0.61, 2.09, 3.56] },
          { min: 61, max: 70, label: '61 – 70', values: [0.83, 2.43, 4.32] },
          { min: 71, max: 99, label: '71 – 99', values: [1.01, 2.81, 4.95] },
          { min: 100, max: Infinity, label: '100 y más', values: [2.25, 4.50, 7.65] }
        ]
      },
      noMype: {
        id: 'noMype',
        label: 'No MYPE',
        note: 'Escala general del art. 48.1.',
        bands: [
          { min: 1, max: 10, label: '1 – 10', values: [0.26, 1.57, 2.63] },
          { min: 11, max: 25, label: '11 – 25', values: [0.89, 3.92, 5.25] },
          { min: 26, max: 50, label: '26 – 50', values: [1.26, 5.22, 7.88] },
          { min: 51, max: 100, label: '51 – 100', values: [2.33, 6.53, 11.56] },
          { min: 101, max: 200, label: '101 – 200', values: [3.10, 7.83, 14.18] },
          { min: 201, max: 300, label: '201 – 300', values: [3.73, 10.45, 18.39] },
          { min: 301, max: 400, label: '301 – 400', values: [5.30, 13.06, 23.64] },
          { min: 401, max: 500, label: '401 – 500', values: [7.61, 18.28, 31.52] },
          { min: 501, max: 999, label: '501 – 999', values: [10.87, 20.89, 42.03] },
          { min: 1000, max: Infinity, label: '1 000 y más', values: [15.52, 26.12, 52.53] }
        ]
      }
    }
  };

  D.holding = {
    source: 'Tiempos máximos de conservación referenciales (APHA/AWWA/WEF, Standard Methods 24th ed. y normativa nacional). Confirme con el laboratorio acreditado.',
    params: [
      { id: 'ph', label: 'pH', matrix: 'Todas', container: 'Frasco limpio', preserve: 'Ninguno (in situ)', hours: 0.25, note: 'Medir en campo.' },
      { id: 'temp', label: 'Temperatura', matrix: 'Todas', container: '—', preserve: 'In situ', hours: 0.25, note: 'In situ.' },
      { id: 'od', label: 'Oxígeno disuelto', matrix: 'Todas', container: 'Frasco DBO', preserve: 'Fijar en campo', hours: 0.25, note: 'Fijar in situ.' },
      { id: 'cloro', label: 'Cloro residual', matrix: 'Potable', container: 'Ámbar', preserve: 'Ninguno', hours: 0.25, note: 'Analizar de inmediato.' },
      { id: 'colif', label: 'Coliformes / E. coli', matrix: 'Todas', container: 'Estéril', preserve: '≤ 4 °C, tiosulfato', hours: 8, note: 'Máximo 8 h; ideal 6 h.' },
      { id: 'dbo', label: 'DBO₅', matrix: 'Residual/superficial', container: 'Ámbar o plástico', preserve: '≤ 4 °C', hours: 48, note: 'No congelar.' },
      { id: 'dqo', label: 'DQO', matrix: 'Todas', container: 'Vidrio', preserve: 'H₂SO₄ pH<2, ≤4 °C', hours: 672, note: '28 días.' },
      { id: 'sst', label: 'Sólidos suspendidos', matrix: 'Todas', container: 'Plástico', preserve: '≤ 4 °C', hours: 168, note: '7 días.' },
      { id: 'turb', label: 'Turbidez', matrix: 'Todas', container: 'Plástico', preserve: '≤ 4 °C', hours: 48, note: '48 h.' },
      { id: 'cond', label: 'Conductividad', matrix: 'Todas', container: 'Plástico', preserve: '≤ 4 °C', hours: 672, note: '28 días.' },
      { id: 'nitrato', label: 'Nitrato', matrix: 'Todas', container: 'Plástico', preserve: '≤ 4 °C', hours: 48, note: '48 h.' },
      { id: 'nitrito', label: 'Nitrito', matrix: 'Todas', container: 'Plástico', preserve: '≤ 4 °C', hours: 48, note: '48 h.' },
      { id: 'amonio', label: 'Amonio', matrix: 'Todas', container: 'Plástico', preserve: 'H₂SO₄ pH<2, ≤4 °C', hours: 672, note: '28 días.' },
      { id: 'fosforo', label: 'Fósforo total', matrix: 'Todas', container: 'Vidrio', preserve: 'H₂SO₄ pH<2, ≤4 °C', hours: 672, note: '28 días.' },
      { id: 'metales', label: 'Metales totales', matrix: 'Todas', container: 'Plástico', preserve: 'HNO₃ pH<2', hours: 4320, note: '6 meses.' },
      { id: 'aceites', label: 'Aceites y grasas', matrix: 'Residual', container: 'Vidrio ámbar', preserve: 'H₂SO₄ pH<2, ≤4 °C', hours: 672, note: '28 días.' },
      { id: 'cianuro', label: 'Cianuro', matrix: 'Residual', container: 'Plástico', preserve: 'NaOH pH>12, ≤4 °C', hours: 336, note: '14 días.' },
      { id: 'fenoles', label: 'Fenoles', matrix: 'Residual', container: 'Vidrio ámbar', preserve: 'H₂SO₄ pH<2, ≤4 °C', hours: 672, note: '28 días.' },
      { id: 'sulfuro', label: 'Sulfuros', matrix: 'Residual', container: 'Vidrio', preserve: 'Zn acetato + NaOH, ≤4 °C', hours: 168, note: '7 días.' },
      { id: 'fluoruro', label: 'Fluoruro', matrix: 'Todas', container: 'Plástico', preserve: '≤ 4 °C', hours: 672, note: '28 días.' },
      { id: 'hierro', label: 'Hierro', matrix: 'Todas', container: 'Plástico', preserve: 'HNO₃ pH<2', hours: 4320, note: '6 meses.' }
    ]
  };

  /* -------------------------------------------------------- incertidumbre */
  D.uncertainty = {
    t95: [
      [1, 12.706], [2, 4.303], [3, 3.182], [4, 2.776], [5, 2.571], [6, 2.447],
      [7, 2.365], [8, 2.306], [9, 2.262], [10, 2.228], [12, 2.179], [15, 2.131],
      [20, 2.086], [25, 2.060], [30, 2.042], [40, 2.021], [50, 2.009], [60, 2.000],
      [80, 1.990], [100, 1.984], [1000, 1.960]
    ],
    note: 'Guía EA-4/02 / GUM. La banda de guarda w = U evita declarar conformidad cuando el intervalo de incertidumbre cruza el límite.'
  };

  /* ------------------------------------------------------------ conversión */
  D.units = {
    co2PerC: 44 / 12,
    cPerCO2: 12 / 44,
    haToM2: 10000
  };

  /* --------------------------------------------- benchmark SOC sintético */
  /* Dataset reproducible de demostración (n=246). No proviene de GXLab:
     se genera con una curva de referencia ilustrativa para que la herramienta
     funcione sin conexión. Puede reemplazarse cargando un CSV propio. */
  D.buildBenchmark = function () {
    let seed = 20260214;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const gauss = () => {
      let u = 0, v = 0;
      while (u === 0) u = rnd();
      while (v === 0) v = rnd();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const mgmt = [
      { id: 'cultivo', label: 'Cultivo convencional', offset: -0.30, color: '#A57B1F' },
      { id: 'conservacion', label: 'Cultivo con conservación', offset: 0.05, color: '#5277A8' },
      { id: 'pastura', label: 'Pastura mejorada', offset: 0.42, color: '#2A8C82' },
      { id: 'nativo', label: 'Vegetación nativa', offset: 0.65, color: '#77679A' }
    ];
    const rows = [];
    mgmt.forEach(m => {
      const n = m.id === 'cultivo' ? 78 : m.id === 'pastura' ? 62 : m.id === 'nativo' ? 48 : 58;
      for (let i = 0; i < n; i++) {
        const rain = Math.round(260 + rnd() * 940);
        const base = 0.42 + 0.36 * Math.log(rain / 300) + m.offset;
        const soc = Math.max(0.16, base + gauss() * 0.16);
        rows.push({ rain, soc: +soc.toFixed(2), mgmt: m.id, mgmtLabel: m.label, color: m.color });
      }
    });
    return { rows, mgmt };
  };

  /* ------------------------------------------------ nombres de color suelo */
  D.soilColorName = function (hue, value, chroma) {
    const reddish = /R$/.test(hue) && !/YR/.test(hue);
    if (value <= 2) return 'negro';
    if (chroma <= 1.5) return value >= 7 ? 'blanco' : value >= 5 ? 'gris claro' : value >= 3 ? 'gris' : 'gris oscuro';
    if (chroma <= 2.5) return value >= 6 ? 'gris parduzco claro' : value >= 4 ? 'gris parduzco' : 'pardo grisáceo oscuro';
    if (reddish) {
      if (value <= 3) return 'rojo oscuro';
      if (value <= 5) return chroma >= 6 ? 'rojo' : 'rojo parduzco';
      return chroma >= 6 ? 'rojo claro' : 'pardo rojizo claro';
    }
    if (value <= 3) return chroma >= 6 ? 'pardo rojizo oscuro' : 'pardo muy oscuro';
    if (value <= 4) return chroma >= 6 ? 'pardo rojizo' : 'pardo oscuro';
    if (value <= 5) return chroma >= 6 ? 'pardo fuerte' : 'pardo';
    if (value <= 6) return chroma >= 6 ? 'pardo amarillento' : 'pardo claro';
    if (value <= 7) return chroma >= 5 ? 'amarillo parduzco' : 'pardo muy claro';
    return chroma >= 5 ? 'amarillo pálido' : 'pardo pálido';
  };
})();
