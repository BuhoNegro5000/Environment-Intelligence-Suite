/* ==========================================================================
   Yupana · funciones puras de seguridad e higiene
   Dosis de ruido (OSHA/NIOSH) y multas SUNAFIL.
   Se separan de la interfaz para poder verificarlas con pruebas de regresión.
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL;
  const M = GL.safetyMath = {};

  const NOISE = {
    osha: { id: 'osha', label: 'OSHA', base: 90, exchange: 5 },
    niosh: { id: 'niosh', label: 'NIOSH', base: 85, exchange: 3 }
  };

  /** Tiempo permitido (h) para un nivel L (dBA) dentro de un turno de H horas. */
  M.noiseAllowedTime = function (level, hours, criterion) {
    const c = NOISE[criterion] || NOISE.osha;
    const h = Number(hours);
    if (!isFinite(h) || h <= 0) return 0;
    if (!(level > 0)) return Infinity;
    return h / Math.pow(2, (level - c.base) / c.exchange);
  };

  /** TWA equivalente a 8 h a partir de la dosis normalizada D8 (%). */
  M.noiseTwa = function (dose8, criterion) {
    const d = Number(dose8);
    if (!isFinite(d) || d <= 0) return 0;
    return criterion === 'niosh'
      ? 85 + 10 * Math.log10(d / 100)
      : 90 + 16.61 * Math.log10(d / 100);
  };

  /**
   * Calcula la dosis de un turno y su equivalente a 8 h.
   * rows: [{ a, l, h }]; shiftHours: duración total del turno (h).
   */
  M.noiseDose = function (options) {
    const opt = options || {};
    const criterion = opt.criterion === 'niosh' ? 'niosh' : 'osha';
    const rawShift = Number(opt.shiftHours);
    const rawWarn = Number(opt.warn);
    const shift = Math.max(0.1, isFinite(rawShift) ? rawShift : 8);
    const warn = Math.max(0, isFinite(rawWarn) ? rawWarn : 0);
    const rows = (opt.rows || []).map(r => {
      const level = Number(r.l) || 0;
      const hours = Number(r.h) || 0;
      const allowed = M.noiseAllowedTime(level, shift, criterion);
      const dose = isFinite(allowed) && allowed > 0 ? hours / allowed * 100 : 0;
      return { a: r.a, l: level, h: hours, T: allowed, dose };
    });
    const dose = rows.reduce((sum, r) => sum + r.dose, 0);
    // Dosis relativa al turno declarado; se normaliza a 8 h para el TWA.
    const dose8 = dose * shift / 8;
    const twa = M.noiseTwa(dose8, criterion);
    const allowed = M.noiseAllowedTime(twa, 8, criterion);
    const over = Math.max(0, dose8 - 100);
    const peak = rows.length ? Math.max.apply(null, rows.map(r => r.l)) : 0;
    const alert = peak >= warn || twa >= warn;
    return {
      criterion, criterionLabel: NOISE[criterion].label, shiftHours: shift, warn,
      rows, dose, dose8, twa, allowed, over, peak, alert
    };
  };

  const SEVERITY = { leve: 0, grave: 1, 'muy-grave': 2 };
  const SEVERITY_LABEL = ['leve', 'grave', 'muy grave'];

  /**
   * Estima la multa SUNAFIL con la tabla del art. 48.1 y los topes del art. 39.
   * fines: GL.data.safetyFines.
   */
  M.sunafilFine = function (options, fines) {
    const opt = options || {};
    const F = fines || (GL.data && GL.data.safetyFines);
    if (!F) throw new Error('Faltan las tablas de multas SUNAFIL.');
    const scaleId = opt.scaleId || 'noMype';
    const scale = F.scales[scaleId] || F.scales.noMype;
    const sev = Object.hasOwn(SEVERITY, opt.severity) ? opt.severity : 'grave';
    const sevIdx = SEVERITY[sev];
    const n = Math.max(1, Math.round(Number(opt.workers) || 1));
    const count = Math.max(1, Math.round(Number(opt.count) || 1));
    const rawUit = Number(opt.uit);
    const uit = Math.max(1, isFinite(rawUit) ? rawUit : (F.uit || 5500));
    const rawProb = Number(opt.probability);
    const prob = GL.clamp(isFinite(rawProb) ? rawProb : 100, 0, 100) / 100;
    const income = Math.max(0, Number(opt.income) || 0);

    let band = scale.bands.find(b => n >= b.min && n <= b.max);
    let bandWarn = '';
    if (!band) {
      band = scale.bands[scale.bands.length - 1];
      bandWarn = scale.id === 'micro'
        ? ' Una microempresa no puede superar 10 trabajadores: revise el tamaño de empresa.'
        : ' El número de trabajadores supera el último tramo; se usa el tramo superior.';
    }

    const unit = band.values[sevIdx];
    const baseUit = unit * count;
    const gravityCap = sevIdx === 0 ? F.caps.leve : sevIdx === 1 ? F.caps.grave : F.caps.muyGrave;
    const procedureCap = F.caps.procedure;
    const incomeCapUit = (scale.id === 'micro' || scale.id === 'small') && income > 0
      ? income * F.caps.mypeIncomePct / 100 / uit
      : null;
    const effectiveCapUit = Math.min(gravityCap, procedureCap, incomeCapUit === null ? Infinity : incomeCapUit);
    const finalUit = Math.min(baseUit, effectiveCapUit);
    const baseS = baseUit * uit;
    const finalS = finalUit * uit;
    const exp = finalS * prob;
    const capLabel = incomeCapUit !== null && incomeCapUit <= Math.min(gravityCap, procedureCap)
      ? '1 % de ingresos netos'
      : gravityCap <= procedureCap
        ? gravityCap + ' UIT (' + SEVERITY_LABEL[sevIdx] + ')'
        : procedureCap + ' UIT (procedimiento)';

    return {
      scale, scaleId: scale.id, severity: sev, severityLabel: SEVERITY_LABEL[sevIdx], severityIndex: sevIdx,
      workers: n, count, uit, probability: prob, income,
      band, bandWarn, unit, baseUit, baseS, gravityCap, procedureCap, incomeCapUit,
      effectiveCapUit, finalUit, finalS, exp, capLabel, capped: finalUit < baseUit - 1e-9
    };
  };
})();
