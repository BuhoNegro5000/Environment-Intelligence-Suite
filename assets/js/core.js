/* ==========================================================================
   Yupana · core
   Registro de herramientas, utilidades numéricas, gráficos, informes y UI.
   Sin dependencias externas. Todo corre en el navegador.
   ========================================================================== */
(function () {
  'use strict';

  const GL = {};
  window.GL = GL;

  /* ---------------------------------------------------------------- suites */
  GL.suites = {
    soil: {
      id: 'soil', name: 'Suelo & Carbono', short: 'Suelo', icon: '◈', color: '#8A6A43',
      desc: 'Carbono orgánico, densidad, muestreo, geometrías y fertilidad.'
    },
    water: {
      id: 'water', name: 'Agua & Residuos', short: 'Agua', icon: '◉', color: '#3A7D96',
      desc: 'PTAR, lagunas, pérdidas de agua, rellenos y biogás.'
    },
    air: {
      id: 'air', name: 'Aire & Energía', short: 'Aire', icon: '◎', color: '#4F8A5A',
      desc: 'Dispersión, calidad del aire, eficiencia energética, solar y viento.'
    },
    impact: {
      id: 'impact', name: 'Impacto Ambiental', short: 'Impacto', icon: '❖', color: '#2A8C82',
      desc: 'Clasificación SEIA, matrices de impacto, línea base, planes de manejo y monitoreo.'
    },
    safety: {
      id: 'safety', name: 'Seguridad & Higiene', short: 'SST', icon: '◇', color: '#A5701F',
      desc: 'Conesa, IPERC, caídas, indicadores, ruido y fiscalización.'
    },
    metrology: {
      id: 'metrology', name: 'Metrología & Cumplimiento', short: 'Metro', icon: '▣', color: '#7A6AAC',
      desc: 'Incertidumbre, reglas de decisión, validez de muestras y contención.'
    }
  };

  /* ------------------------------------------------------------- registry */
  const tools = [];
  const index = Object.create(null);
  GL.tools = tools;
  GL.tool = function (def) {
    if (!def || !def.id) throw new Error('Tool sin id');
    if (index[def.id]) console.warn('Herramienta duplicada:', def.id);
    def.n = tools.length + 1;
    tools.push(def);
    index[def.id] = def;
  };
  GL.getTool = id => index[id] || null;
  GL.toolsBySuite = suite => tools.filter(t => t.suite === suite);

  /* ------------------------------------------------------------ formatting */
  const nfCache = {};
  function nf(min, max) {
    const k = min + ':' + max;
    return nfCache[k] || (nfCache[k] = new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: min, maximumFractionDigits: max
    }));
  }
  GL.fmt = function (v, d) {
    if (v === null || v === undefined || v === '' || typeof v === 'boolean') return '—';
    const n = Number(v);
    if (!isFinite(n)) return '—';
    if (n !== 0 && (Math.abs(n) < 0.001 || Math.abs(n) >= 1e9)) return n.toExponential(2).replace('.', ',');
    const dec = d === undefined ? 2 : d;
    return nf(0, dec).format(n);
  };
  GL.fmtSmart = function (v) {
    if (v === null || v === undefined) return '—';
    const n = Number(v), a = Math.abs(n);
    if (!isFinite(n)) return '—';
    if (a === 0) return '0';
    if (a >= 1000) return GL.fmt(n, 0);
    if (a >= 100) return GL.fmt(n, 1);
    if (a >= 1) return GL.fmt(n, 2);
    if (a >= 0.01) return GL.fmt(n, 3);
    return GL.fmt(n, 5);
  };
  GL.signed = function (v, d) {
    const n = Number(v);
    if (!isFinite(n)) return '—';
    return (n > 0 ? '+' : '') + GL.fmt(n, d === undefined ? 2 : d);
  };
  GL.pct = (v, d) => GL.fmt(v, d === undefined ? 1 : d) + '%';
  GL.num = function (id, def) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) return def === undefined ? 0 : def;
    let raw = String(el.value == null ? '' : el.value).trim();
    const mark = ok => {
      if (!el.classList) return;
      el.classList.toggle('is-invalid', !ok);
      if (ok) el.removeAttribute('aria-invalid'); else el.setAttribute('aria-invalid', 'true');
    };
    if (!raw) { mark(true); return def === undefined ? 0 : def; }
    raw = raw.replace(/\s/g, '').replace(/%/g, '');
    if (raw.includes(',') && raw.includes('.')) {
      raw = raw.lastIndexOf(',') > raw.lastIndexOf('.')
        ? raw.replace(/\./g, '').replace(',', '.')
        : raw.replace(/,/g, '');
    } else raw = raw.replace(',', '.');
    const n = parseFloat(raw);
    mark(isFinite(n));
    return isFinite(n) ? n : (def === undefined ? 0 : def);
  };
  // Hash determinista (FNV-1a de 32 bits) para trazabilidad de entradas.
  GL.hash = function (value) {
    const s = String(value == null ? '' : value);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return ('00000000' + (h >>> 0).toString(16)).slice(-8);
  };
  GL.str = id => {
    const el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  };
  GL.checked = id => {
    const el = document.getElementById(id);
    return !!(el && el.checked);
  };
  GL.val = function (id, v) {
    const el = document.getElementById(id);
    if (el) el.value = v;
  };
  GL.out = function (id, html, tone) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) return;
    el.innerHTML = html;
    if (tone !== undefined) {
      el.closest('.metric') && el.closest('.metric').classList.remove('tone-ok', 'tone-warn', 'tone-bad');
      if (tone) el.closest('.metric') && el.closest('.metric').classList.add('tone-' + tone);
    }
  };
  GL.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  GL.round = (v, d) => { const p = Math.pow(10, d || 0); return Math.round(v * p) / p; };

  /* --------------------------------------------------------------- helpers */
  GL.escape = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  GL.uid = (p) => (p || 'id') + '_' + Math.random().toString(36).slice(2, 8);
  GL.debounce = function (fn, ms) {
    let t;
    return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => fn.apply(c, a), ms || 200); };
  };
  GL.toast = function (msg, tone) {
    const root = document.getElementById('toastRoot');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast' + (tone ? ' ' + tone : '');
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(12px)'; setTimeout(() => el.remove(), 250); }, 3800);
  };
  GL.copy = async function (text) {
    try {
      await navigator.clipboard.writeText(text);
      GL.toast('Copiado al portapapeles');
    } catch (e) { GL.toast('No se pudo copiar', 'bad'); }
  };
  GL.download = function (filename, content, mime) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
  GL.slug = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);

  /* ------------------------------------------------------------------ csv */
  function detectDelim(line) {
    const counts = [[',', 0], [';', 0], ['\t', 0]];
    let q = false;
    for (const ch of line) {
      if (ch === '"') q = !q;
      if (!q) counts.forEach(c => { if (ch === c[0]) c[1]++; });
    }
    counts.sort((a, b) => b[1] - a[1]);
    return counts[0][1] ? counts[0][0] : ',';
  }
  GL.parseCSV = function (text) {
    const clean = String(text).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const lines = clean.split('\n').filter(l => l.trim() !== '');
    if (!lines.length) return { headers: [], rows: [] };
    const d = detectDelim(lines[0]);
    const parseLine = line => {
      const out = []; let cur = '', q = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (q) {
          if (ch === '"') {
            if (line[i + 1] === '"') { cur += '"'; i++; } else q = false;
          } else cur += ch;
        } else if (ch === '"') q = true;
        else if (ch === d) { out.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      out.push(cur.trim());
      return out;
    };
    const headers = parseLine(lines[0]).map(h => h.replace(/^\uFEFF/, ''));
    const rows = lines.slice(1).map(l => {
      const cells = parseLine(l);
      const o = {};
      headers.forEach((h, i) => { o[h] = cells[i] === undefined ? '' : cells[i]; });
      return o;
    });
    return { headers, rows, delim: d };
  };
  GL.toCSV = function (rows, headers) {
    const esc = v => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const hs = headers || (rows[0] ? Object.keys(rows[0]) : []);
    const lines = [hs.map(esc).join(',')];
    rows.forEach(r => lines.push(hs.map(h => esc(Array.isArray(r) ? r[hs] : r[h])).join(',')));
    return '\uFEFF' + lines.join('\n');
  };
  GL.csvDownload = function (filename, rows, headers) {
    GL.download(filename, GL.toCSV(rows, headers), 'text/csv;charset=utf-8');
  };

  /* --------------------------------------------------------------- statistics */
  const S = GL.stat = {};
  S.mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  S.sd = function (a) {
    if (a.length < 2) return 0;
    const m = S.mean(a);
    return Math.sqrt(a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1));
  };
  S.cv = a => { const m = S.mean(a); return m ? 100 * S.sd(a) / m : 0; };
  S.median = function (a) {
    if (!a.length) return 0;
    const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  S.quantile = function (a, q) {
    if (!a.length) return 0;
    const s = a.slice().sort((x, y) => x - y);
    const pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
    return s[lo] + (s[hi] - s[lo]) * (pos - lo);
  };

  // continued fraction for incomplete beta
  function betacf(a, b, x) {
    const MAXIT = 200, EPS = 3e-12, FPMIN = 1e-300;
    let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  function gammaln(x) {
    const cof = [76.18009172947146, -86.50532032941677, 24.01409824083091,
      -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) ser += cof[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  S.betai = function (a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  };
  S.tTwoSidedP = function (t, df) {
    if (!isFinite(t)) return 0;
    return S.betai(df / 2, 0.5, df / (df + t * t));
  };
  S.tCdf = function (t, df) {
    const p = 0.5 * S.betai(df / 2, 0.5, df / (df + t * t));
    return t > 0 ? 1 - p : p;
  };
  S.erf = function (x) {
    const sign = x < 0 ? -1 : 1; x = Math.abs(x);
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
      a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  };
  S.normalCdf = z => 0.5 * (1 + S.erf(z / Math.SQRT2));
  S.normalPdf = z => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  S.invNormal = function (p) {
    // Acklam
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
      1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
      6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
      -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
      3.754408661907416e+00];
    const pl = 0.02425, ph = 1 - pl;
    let q, r;
    if (p < pl) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p > ph) {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  };
  S.linreg = function (xs, ys) {
    const n = Math.min(xs.length, ys.length);
    if (n < 2) return { slope: 0, intercept: 0, r: 0, r2: 0, se: 0, t: 0, p: 1, n };
    const mx = S.mean(xs), my = S.mean(ys);
    let sxx = 0, sxy = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - mx, dy = ys[i] - my;
      sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
    }
    const slope = sxx ? sxy / sxx : 0;
    const intercept = my - slope * mx;
    const r = (sxx && syy) ? sxy / Math.sqrt(sxx * syy) : 0;
    let sse = 0;
    for (let i = 0; i < n; i++) { const e = ys[i] - (intercept + slope * xs[i]); sse += e * e; }
    const se = n > 2 ? Math.sqrt(sse / (n - 2)) : 0;
    const seSlope = sxx ? se / Math.sqrt(sxx) : 0;
    const t = seSlope ? slope / seSlope : 0;
    return { slope, intercept, r, r2: r * r, se, seSlope, t, p: n > 2 ? S.tTwoSidedP(t, n - 2) : 1, n, sse, mx, sxx };
  };
  S.pearson = function (xs, ys) {
    const n = Math.min(xs.length, ys.length);
    if (n < 3) return { r: 0, p: 1, n };
    const lr = S.linreg(xs, ys);
    return { r: lr.r, p: lr.p, n, slope: lr.slope, intercept: lr.intercept };
  };
  // Ordinary least squares with intercept: X = array of rows (without intercept)
  S.ols = function (X, y) {
    const n = y.length, k = X[0].length;
    const A = Array.from({ length: k + 1 }, () => new Array(k + 2).fill(0));
    for (let i = 0; i < n; i++) {
      const row = [1].concat(X[i]);
      for (let a = 0; a <= k; a++) {
        for (let b = 0; b <= k; b++) A[a][b] += row[a] * row[b];
        A[a][k + 1] += row[a] * y[i];
      }
    }
    // gauss-jordan
    for (let col = 0; col <= k; col++) {
      let piv = col;
      for (let r = col + 1; r <= k; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
      if (Math.abs(A[piv][col]) < 1e-12) return null;
      [A[col], A[piv]] = [A[piv], A[col]];
      const pv = A[col][col];
      for (let c = col; c <= k + 1; c++) A[col][c] /= pv;
      for (let r = 0; r <= k; r++) {
        if (r === col) continue;
        const f = A[r][col];
        for (let c = col; c <= k + 1; c++) A[r][c] -= f * A[col][c];
      }
    }
    const beta = A.map(row => row[k + 1]);
    // residuals & R2
    let sse = 0, my = S.mean(y);
    let sst = 0;
    for (let i = 0; i < n; i++) {
      const yhat = beta[0] + X[i].reduce((s, v, j) => s + v * beta[j + 1], 0);
      sse += (y[i] - yhat) ** 2;
      sst += (y[i] - my) ** 2;
    }
    const df = n - k - 1;
    const mse = df > 0 ? sse / df : 0;
    const r2 = sst ? 1 - sse / sst : 0;
    // invert X'X for standard errors
    const B = Array.from({ length: k + 1 }, (_, i) => {
      const row = new Array(k + 1).fill(0); row[i] = 1; return row;
    });
    // rebuild normal matrix then invert (fresh copy)
    const M = Array.from({ length: k + 1 }, () => new Array(k + 1).fill(0));
    for (let i = 0; i < n; i++) {
      const row = [1].concat(X[i]);
      for (let a = 0; a <= k; a++) for (let b = 0; b <= k; b++) M[a][b] += row[a] * row[b];
    }
    for (let col = 0; col <= k; col++) {
      let piv = col;
      for (let r = col + 1; r <= k; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
      if (Math.abs(M[piv][col]) < 1e-12) return null;
      [M[col], M[piv]] = [M[piv], M[col]];
      [B[col], B[piv]] = [B[piv], B[col]];
      const pv = M[col][col];
      for (let c = 0; c <= k; c++) { M[col][c] /= pv; B[col][c] /= pv; }
      for (let r = 0; r <= k; r++) {
        if (r === col) continue;
        const f = M[r][col];
        for (let c = 0; c <= k; c++) { M[r][c] -= f * M[col][c]; B[r][c] -= f * B[col][c]; }
      }
    }
    const se = beta.map((b, i) => Math.sqrt(Math.max(0, mse * B[i][i])));
    const tstat = beta.map((b, i) => se[i] ? b / se[i] : 0);
    const p = tstat.map(t => df > 0 ? S.tTwoSidedP(t, df) : 1);
    const yhats = y.map((_, i) => beta[0] + X[i].reduce((s, v, j) => s + v * beta[j + 1], 0));
    const rmse = Math.sqrt(mse);
    const cvrmse = my ? 100 * rmse / my : 0;
    return { beta, se, t: tstat, p, r2, r2adj: df > 0 ? 1 - (1 - r2) * (n - 1) / df : r2, sse, df, mse, rmse, cvrmse, n, yhats };
  };
  S.chi2q = function (p, k) {
    if (k <= 0) return 0;
    const z = S.invNormal(p);
    const a = 2 / (9 * k);
    return k * Math.pow(1 - a + z * Math.sqrt(a), 3);
  };
  // Garwood exact Poisson CI
  S.poissonCI = function (k, conf) {
    const alpha = 1 - (conf === undefined ? 0.95 : conf);
    const lo = k === 0 ? 0 : 0.5 * S.chi2q(alpha / 2, 2 * k);
    const hi = 0.5 * S.chi2q(1 - alpha / 2, 2 * k + 2);
    return { lo, hi };
  };
  S.poissonP = function (k, lambda) {
    // P(X >= k)
    if (lambda <= 0) return 1;
    let sum = 0, term = Math.exp(-lambda);
    for (let i = 0; i < k; i++) { sum += term; term *= lambda / (i + 1); }
    return Math.max(0, Math.min(1, 1 - sum));
  };
  const T95 = { 1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131, 16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086, 25: 2.060, 30: 2.042, 40: 2.021, 50: 2.009, 60: 2.000, 80: 1.990, 100: 1.984, 1000: 1.962 };
  S.t95 = function (df) {
    if (df >= 1000) return 1.960;
    const keys = Object.keys(T95).map(Number).sort((a, b) => a - b);
    if (T95[df]) return T95[df];
    for (let i = 0; i < keys.length - 1; i++) {
      if (df > keys[i] && df < keys[i + 1]) {
        const x0 = keys[i], x1 = keys[i + 1], y0 = T95[x0], y1 = T95[x1];
        return y0 + (y1 - y0) * (df - x0) / (x1 - x0);
      }
    }
    return 2.0;
  };

  /* ------------------------------------------------------------- charting */
  const charts = [];
  const PALETTE = ['#2A8C82', '#A57B1F', '#5277A8', '#B06060', '#77679A', '#5F8A3A', '#8A8F86'];
  GL.palette = PALETTE;

  /* color de calor para matrices: v en [-1,1] */
  GL.heat = function (v) {
    const t = Math.max(-1, Math.min(1, +v || 0));
    const a = (0.2 + Math.abs(t) * 0.72).toFixed(3);
    if (t >= 0) return { bg: `rgba(42,140,130,${a})`, fg: t > 0.52 ? '#06170F' : '#D8F0EA' };
    return { bg: `rgba(176,96,96,${a})`, fg: t < -0.52 ? '#1B0708' : '#FFE0E0' };
  };

  function niceNum(range, round) {
    if (range <= 0 || !isFinite(range)) return 1;
    const exp = Math.floor(Math.log10(range));
    const f = range / Math.pow(10, exp);
    let nf;
    if (round) nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
    else nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
    return nf * Math.pow(10, exp);
  }
  function axisTicks(min, max, count) {
    if (!isFinite(min) || !isFinite(max) || min === max) return [min || 0];
    const range = niceNum(max - min, false);
    const step = niceNum(range / (count - 1), true);
    const start = Math.ceil(min / step) * step;
    const ticks = [];
    for (let v = start; v <= max + step * 0.001; v += step) ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return ticks;
  }
  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }
  function drawChart(canvas, cfg) {
    const parent = canvas.parentElement;
    if (!parent) return;
    const W = parent.clientWidth, H = parent.clientHeight;
    if (W < 10 || H < 10) return;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const txt = cssVar('--chart-text', '#8ba79a');
    const grid = cssVar('--chart-grid', 'rgba(140,170,155,.14)');
    const axis = cssVar('--chart-axis', 'rgba(140,170,155,.4)');
    canvas._pts = [];
    const isBar = (cfg.type || 'line') === 'bar';
    const pad = Object.assign({ l: 46, r: 16, t: 16, b: 30 }, cfg.pad || {});
    const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    if (pw < 20 || ph < 20) return;

    let all = [];
    (cfg.series || []).forEach(s => (s.data || []).forEach(p => { if (Array.isArray(p) && isFinite(p[1])) all.push(p); }));
    let xmin, xmax, ymin, ymax;
    if (isBar) {
      xmin = -0.5; xmax = Math.max(0, ((cfg.series[0] || {}).data || []).length - 0.5);
      ymin = 0; ymax = Math.max.apply(null, [1].concat(((cfg.series[0] || {}).data || []).map(p => +p[1] || 0)));
    } else {
      const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
      xmin = cfg.x && cfg.x.min !== undefined ? cfg.x.min : Math.min.apply(null, xs);
      xmax = cfg.x && cfg.x.max !== undefined ? cfg.x.max : Math.max.apply(null, xs);
      ymin = cfg.y && cfg.y.min !== undefined ? cfg.y.min : Math.min.apply(null, ys);
      ymax = cfg.y && cfg.y.max !== undefined ? cfg.y.max : Math.max.apply(null, ys);
      if (!isFinite(xmin) || !isFinite(xmax)) { xmin = 0; xmax = 1; }
      if (!isFinite(ymin) || !isFinite(ymax)) { ymin = 0; ymax = 1; }
      if (xmin === xmax) { xmin -= 1; xmax += 1; }
      if (ymin === ymax) { ymin -= 1; ymax += 1; }
      if (cfg.y && cfg.y.zero) ymin = Math.min(0, ymin);
      const yPad = (ymax - ymin) * 0.06;
      if (!(cfg.y && cfg.y.min !== undefined)) ymin -= yPad;
      if (!(cfg.y && cfg.y.max !== undefined)) ymax += yPad;
      if (cfg.y && cfg.y.zero && ymin > 0) ymin = 0;
    }
    const sx = v => pad.l + (v - xmin) / (xmax - xmin) * pw;
    const sy = v => pad.t + ph - (v - ymin) / (ymax - ymin) * ph;

    // bands
    (cfg.bands || []).forEach(b => {
      ctx.fillStyle = b.color || 'rgba(95,227,161,.07)';
      const y1 = sy(Math.min(b.to, ymax)), y2 = sy(Math.max(b.from, ymin));
      ctx.fillRect(pad.l, y1, pw, Math.max(0, y2 - y1));
      if (b.label) {
        ctx.fillStyle = txt; ctx.font = '9px ' + cssVar('--mono', 'monospace');
        ctx.textAlign = 'left'; ctx.fillText(b.label, pad.l + 5, Math.max(pad.t + 9, y1 - 3));
      }
    });

    // grid + y labels
    ctx.font = '9.5px ' + cssVar('--mono', 'monospace');
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const yt = axisTicks(ymin, ymax, 5);
    yt.forEach(v => {
      if (v < ymin - 1e-9 || v > ymax + 1e-9) return;
      const y = sy(v);
      ctx.strokeStyle = grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, Math.round(y) + .5); ctx.lineTo(W - pad.r, Math.round(y) + .5); ctx.stroke();
      ctx.fillStyle = txt;
      ctx.fillText(cfg.y && cfg.y.fmt ? cfg.y.fmt(v) : GL.fmtSmart(v), pad.l - 7, y);
    });
    // x labels
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    if (isBar) {
      const data = (cfg.series[0] || {}).data || [];
      const step = Math.max(1, Math.ceil(data.length / Math.max(4, Math.floor(pw / 55))));
      data.forEach((p, i) => {
        if (i % step) return;
        const x = sx(i);
        ctx.fillStyle = txt;
        const label = String(p[0]);
        ctx.fillText(label.length > 9 ? label.slice(0, 8) + '…' : label, x, H - pad.b + 7);
      });
    } else {
      const xt = axisTicks(xmin, xmax, Math.max(3, Math.floor(pw / 80)));
      xt.forEach(v => {
        if (v < xmin - 1e-9 || v > xmax + 1e-9) return;
        ctx.fillStyle = txt;
        ctx.fillText(cfg.x && cfg.x.fmt ? cfg.x.fmt(v) : GL.fmtSmart(v), sx(v), H - pad.b + 7);
      });
    }
    // axis lines
    ctx.strokeStyle = axis; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b + .5); ctx.lineTo(W - pad.r, H - pad.b + .5); ctx.stroke();
    // zero line
    if (!isBar && ymin < 0 && ymax > 0) {
      ctx.strokeStyle = axis; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(pad.l, sy(0)); ctx.lineTo(W - pad.r, sy(0)); ctx.stroke();
      ctx.setLineDash([]);
    }

    // rules
    (cfg.rules || []).forEach(r => {
      if (r.y < ymin || r.y > ymax) return;
      const y = sy(r.y);
      ctx.strokeStyle = r.color || '#A57B1F';
      ctx.lineWidth = 1.2; ctx.setLineDash(Array.isArray(r.dash) ? r.dash : [5, 4]);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      ctx.setLineDash([]);
      if (r.label) {
        ctx.font = '9px ' + cssVar('--sans', 'sans-serif');
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        const tw = ctx.measureText(r.label).width;
        ctx.fillStyle = cssVar('--panel', '#0c1b15');
        ctx.fillRect(W - pad.r - tw - 8, y - 13, tw + 7, 11);
        ctx.fillStyle = r.color || '#A57B1F';
        ctx.fillText(r.label, W - pad.r - 2, y - 3);
        ctx.textBaseline = 'middle';
      }
    });

    // series
    (cfg.series || []).forEach((s, si) => {
      const color = s.color || PALETTE[si % PALETTE.length];
      const data = (s.data || []).filter(p => Array.isArray(p) && isFinite(p[0]) && isFinite(p[1]));
      if (isBar) {
        const bw = Math.max(2, Math.min(46, pw / Math.max(1, data.length) * 0.62));
        data.forEach((p, i) => {
          const x = sx(i), y0 = sy(0), y1 = sy(p[1]);
          const h = Math.max(1, y0 - y1);
          const g = ctx.createLinearGradient(0, y1, 0, y0);
          g.addColorStop(0, color); g.addColorStop(1, color + '33');
          ctx.fillStyle = s.color || g;
          if (!s.color) ctx.fillStyle = g;
          ctx.beginPath();
          const r = Math.min(4, bw / 3);
          roundRect(ctx, x - bw / 2, y1, bw, h, r);
          ctx.fill();
          canvas._pts.push({ x, y: y1, label: String(p[0]), value: p[1], color, si, sn: s.name || '' });
        });
      } else {
        if (s.type === 'scatter' || s.points) {
          data.forEach(p => {
            const x = sx(p[0]), y = sy(p[1]);
            ctx.beginPath(); ctx.arc(x, y, s.r || 2.6, 0, Math.PI * 2);
            ctx.fillStyle = color + (s.alpha || 'cc'); ctx.fill();
            canvas._pts.push({ x, y, label: s.name || '', value: p[1], xv: p[0], color, si });
          });
        }
        if (s.type !== 'scatter' && s.type !== 'points' && data.length > 1) {
          ctx.beginPath();
          data.forEach((p, i) => { const x = sx(p[0]), y = sy(p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
          ctx.strokeStyle = color; ctx.lineWidth = s.width || 2; ctx.lineJoin = 'round';
          if (s.dash) ctx.setLineDash(s.dash);
          ctx.stroke(); ctx.setLineDash([]);
          if (s.fill) {
            ctx.lineTo(sx(data[data.length - 1][0]), sy(Math.max(ymin, 0)));
            ctx.lineTo(sx(data[0][0]), sy(Math.max(ymin, 0)));
            ctx.closePath();
            const g = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
            g.addColorStop(0, color + '55'); g.addColorStop(1, color + '05');
            ctx.fillStyle = g; ctx.fill();
          }
          if (s.points !== false && data.length <= 40) {
            data.forEach(p => {
              const x = sx(p[0]), y = sy(p[1]);
              ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2);
              ctx.fillStyle = cssVar('--panel', '#0c1b15'); ctx.fill();
              ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.stroke();
            });
          }
          data.forEach(p => {
            canvas._pts.push({ x: sx(p[0]), y: sy(p[1]), label: s.name || '', value: p[1], xv: p[0], color, si, sn: s.name || '' });
          });
          if (s.labelLast) {
            const last = data[data.length - 1];
            ctx.fillStyle = color; ctx.font = '9.5px ' + cssVar('--mono', 'monospace');
            ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
            ctx.fillText(GL.fmtSmart(last[1]), sx(last[0]) + 4, sy(last[1]) - 4);
          }
        }
      }
    });

    // axis labels
    if (cfg.x && cfg.x.label) {
      ctx.fillStyle = txt; ctx.font = '9px ' + cssVar('--sans', 'sans-serif');
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(cfg.x.label, pad.l + pw / 2, H - 1);
    }
    if (cfg.y && cfg.y.label) {
      ctx.save(); ctx.translate(9, pad.t + ph / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = txt; ctx.font = '9px ' + cssVar('--sans', 'sans-serif');
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(cfg.y.label, 0, 0); ctx.restore();
    }
    canvas._cfg = cfg;
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  GL.chart = function (canvas, cfg) {
    if (!canvas) return;
    const entry = { canvas, cfg };
    entry.ro = new ResizeObserver(GL.debounce(() => drawChart(canvas, cfg), 60));
    entry.ro.observe(canvas.parentElement);
    charts.push(entry);
    requestAnimationFrame(() => drawChart(canvas, cfg));
    return {
      update(next) { Object.assign(cfg, next); drawChart(canvas, cfg); },
      redraw() { drawChart(canvas, cfg); },
      destroy() {
        entry.ro.disconnect();
        const index = charts.indexOf(entry);
        if (index !== -1) charts.splice(index, 1);
      }
    };
  };
  GL.clearCharts = function () {
    charts.forEach(c => { try { c.ro.disconnect(); } catch (e) { } });
    charts.length = 0;
  };
  GL.redrawCharts = function () { charts.forEach(c => drawChart(c.canvas, c.cfg)); };

  // tooltips interactivos sobre los gráficos
  (function () {
    function hideTips() { document.querySelectorAll('.gl-tip').forEach(t => t.classList.remove('on')); }
    document.addEventListener('mousemove', function (e) {
      const canvas = e.target.closest && e.target.closest('.chart-wrap canvas');
      if (!canvas || !canvas._pts || !canvas._pts.length) { hideTips(); return; }
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      let best = null, bd = 900;
      canvas._pts.forEach(p => {
        const d = (p.x - mx) ** 2 + (p.y - my) ** 2;
        if (d < bd) { bd = d; best = p; }
      });
      const wrap = canvas.parentElement;
      if (!best) { hideTips(); return; }
      let tip = wrap.querySelector('.gl-tip');
      if (!tip) { tip = document.createElement('div'); tip.className = 'gl-tip'; wrap.appendChild(tip); }
      hideTips();
      tip.classList.add('on');
      tip.style.left = best.x + 'px'; tip.style.top = best.y + 'px';
      const cfg = canvas._cfg || {};
      const xv = best.xv !== undefined ? (cfg.x && cfg.x.fmt ? cfg.x.fmt(best.xv) : GL.fmtSmart(best.xv)) : (best.label || '');
      const yl = (cfg.y && cfg.y.label) ? ' ' + cfg.y.label : '';
      tip.innerHTML = `${best.sn ? `<b>${GL.escape(best.sn)}</b>` : ''}<span class="tt-k">${GL.escape(String(xv))}</span><span class="tt-v">${GL.fmtSmart(best.value)}${GL.escape(yl)}</span>`;
    });
    document.addEventListener('mouseleave', hideTips, true);
  })();

  /* -------------------------------------------------------------- modal */
  GL.modal = function (opts) {
    const root = document.getElementById('modalRoot');
    const pilotDialog=document.querySelector('.tool--pilot')&&opts.size!=='palette-modal';
    const opener=document.activeElement;
    const close = () => {
      root.innerHTML = ''; document.body.style.overflow = '';
      if(pilotDialog&&opener?.isConnected)opener.focus();
    };
    root.innerHTML = `
      <div class="modal-back" data-close>
        <div class="modal ${opts.size || ''}" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
          <div class="modal-head">
            <div><h2>${opts.title || ''}</h2>${opts.sub ? `<p>${opts.sub}</p>` : ''}</div>
            <button class="modal-close" type="button" data-close aria-label="Cerrar">✕</button>
          </div>
          <div class="modal-body">${opts.body || ''}</div>
          ${opts.foot ? `<div class="modal-foot">${opts.foot}</div>` : ''}
        </div>
      </div>`;
    root.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
    document.body.style.overflow = 'hidden';
    root.querySelectorAll('[data-modal-close]').forEach(el => el.addEventListener('click', close));
    if(pilotDialog){
      const dialog=root.querySelector('[role="dialog"]');
      dialog.setAttribute('aria-label',opts.title||'Diálogo');
      const available=()=>[...dialog.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')]
        .filter(el=>el.getClientRects().length);
      available()[0]?.focus();
      dialog.addEventListener('keydown',event=>{
        if(event.key==='Escape'){
          event.stopPropagation(); close(); return;
        }
        if(event.key!=='Tab')return;
        const items=available(), first=items[0], last=items.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      });
    }
    return { close, root };
  };
  GL.confirm = function (msg, onYes, yesLabel) {
    const m = GL.modal({
      title: 'Confirmar', body: `<p style="font-size:12px;color:var(--text-2)">${GL.escape(msg)}</p>`,
      foot: `<button class="btn" data-x>Cancelar</button><button class="btn primary" data-yes>${yesLabel || 'Continuar'}</button>`
    });
    m.root.querySelector('[data-x]').onclick = m.close;
    m.root.querySelector('[data-yes]').onclick = () => { m.close(); onYes(); };
  };

  /* -------------------------------------------------------------- report */
  GL.openReport = function (r) {
    if (!r || (!r.title && !r.results && !r.inputs && !r.extra)) {
      GL.toast('Aún no hay resultados para el informe. Complete los datos o cargue un archivo.', 'warn');
      return;
    }
    if (!r.generated) r.generated = new Date().toISOString();
    if (!r.modelVersion) r.modelVersion = GL.version;
    if (!r.hash) r.hash = GL.hash(JSON.stringify([r.subtitle || '', r.inputs || [], r.results || []]));
    const now = new Date(r.generated);
    const date = now.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
    const time = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const inputRows = (r.inputs || []).map(([k, v]) => `<tr><td class="name">${GL.escape(k)}</td><td>${GL.escape(v)}</td></tr>`).join('');
    const resultCards = (r.results || []).map(([k, v, u]) => `<div class="r-card"><span>${GL.escape(k)}</span><b>${GL.escape(v)}</b><small>${GL.escape(u || '')}</small></div>`).join('');
    const notes = (r.notes || []).map(n => `<p style="font-size:10px;color:#5e746a;line-height:1.55;margin:0 0 6px">${GL.escape(n)}</p>`).join('');
    const method = r.method ? `<h2>Metodología</h2><div style="font-size:10px;color:#2d463a;line-height:1.6">${r.method}</div>` : '';
    const html = `<div class="report" id="reportDoc">
      <div class="report-head">
        <div>
          <div class="report-brand">${GL.brandData ? `<img src="${GL.brandData}" alt="Yupana" width="90" height="90" style="object-fit:contain;display:block;margin-bottom:12px">` : 'Yupana'}</div>
          <h1>${GL.escape(r.title || 'Informe técnico')}</h1>
          <div class="report-sub">${GL.escape(r.subtitle || '')}</div>
        </div>
        <div class="report-meta">${date}<br>${time}<br>${GL.escape(r.ref || ('YUP-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()))}${r.hash ? '<br>Huella de entradas: ' + GL.escape(r.hash) : ''}${r.modelVersion ? '<br>Modelo v' + GL.escape(r.modelVersion) : ''}${r.generated ? '<br>Calculado: ' + GL.escape(new Date(r.generated).toLocaleString('es-PE')) : ''}</div>
      </div>
      ${resultCards ? `<h2>Resultados</h2><div class="r-grid">${resultCards}</div>` : ''}
      ${inputRows ? `<h2>Datos de entrada</h2><table><tbody>${inputRows}</tbody></table>` : ''}
      ${r.extra ? `<h2>Detalle</h2><div style="font-size:10px;color:#2d463a">${r.extra}</div>` : ''}
      ${method}
      ${notes ? `<h2>Notas y limitaciones</h2>${notes}` : ''}
      <div class="report-foot">
        Generado localmente con Yupana. Los resultados dependen de la calidad de los datos ingresados.
        Este informe no constituye certificación, dictamen legal ni reemplazo del juicio de un profesional competente.
        Verifique la vigencia de normas, límites y factores de emisión aplicables a su jurisdicción.
      </div>
    </div>`;
    const m = GL.modal({
      title: 'Informe técnico', sub: r.title || '', size: 'report-modal',
      body: html,
      foot: `<button class="btn" data-print>Imprimir / PDF</button>
             <button class="btn" data-html>Descargar HTML</button>
             <button class="btn primary" data-modal-close>Cerrar</button>`
    });
    m.root.querySelector('[data-print]').onclick = () => window.print();
    m.root.querySelector('[data-html]').onclick = () => {
      const full = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${GL.escape(r.title || 'Informe')}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;max-width:820px;margin:32px auto;padding:0 20px;color:#14231b}
      table{width:100%;border-collapse:collapse;margin:8px 0}td,th{border:1px solid #dfe5dc;padding:5px 7px;font-size:11px}
      th{background:#f2f4ef;text-align:left}h1{font-size:22px;margin:4px 0}h2{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#0f8a59;border-bottom:1px solid #dfe5dc;padding-bottom:4px;margin-top:20px}
      .r-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.r-card{border:1px solid #dfe5dc;border-radius:6px;padding:8px}
      .r-card span{display:block;font-size:8px;text-transform:uppercase;color:#5e746a}.r-card b{font-size:15px}.r-card small{font-size:8px;color:#5e746a}
      .report-head{display:flex;justify-content:space-between;border-bottom:2px solid #14231b;padding-bottom:10px}
      .report-meta{text-align:right;font-size:9px;color:#5e746a}.report-brand{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#0f8a59}
      .report-sub{font-size:10px;color:#5e746a}.report-foot{margin-top:24px;border-top:1px solid #dfe5dc;padding-top:10px;font-size:8px;color:#5e746a}
      </style></head><body>${html.replace('class="report"', '')}</body></html>`;
      GL.download('GOL_informe_' + GL.slug(r.title || 'tecnico') + '.html', full, 'text/html;charset=utf-8');
    };
  };

  /* --------------------------------------------------------- persistence */
  const KEY = 'yupana.v1.';
  GL.store = {
    get(k, def) { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { } },
    del(k) { try { localStorage.removeItem(KEY + k); } catch (e) { } }
  };
  GL.saveInputs = function (toolId, root) {
    const o = {};
    root.querySelectorAll('input[id],select[id],textarea[id]').forEach(el => {
      if (el.type === 'file') return;
      o[el.id] = el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value;
    });
    GL.store.set('in.' + toolId, o);
  };
  GL.restoreInputs = function (toolId, root) {
    const o = GL.store.get('in.' + toolId, null);
    if (!o) return;
    Object.keys(o).forEach(id => {
      const el = root.querySelector('#' + CSS.escape(id));
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!o[id];
      else if (el.type !== 'file' && !el.dataset.nostore) el.value = o[id];
    });
    GL.syncRanges(root);
  };
  GL.clearInputs = function (toolId) { GL.store.del('in.' + toolId); };

  /* sincroniza el relleno y la lectura de un control deslizante */
  GL.syncRange = function (el) {
    if (!el || el.type !== 'range') return;
    const min = +el.min || 0, max = +el.max || 100;
    const pct = Math.max(0, Math.min(100, (+el.value - min) / (max - min) * 100));
    el.style.setProperty('--p', pct.toFixed(2) + '%');
    const wrap = el.closest('.slider');
    const out = wrap && wrap.querySelector('output');
    if (out) out.textContent = GL.fmtSmart(+el.value) + (out.dataset.suffix ? ' ' + out.dataset.suffix : '');
  };
  GL.syncRanges = function (root) {
    if (!root) return;
    root.querySelectorAll('input[type=range]').forEach(GL.syncRange);
  };

  /* -------------------------------------------------------------- favorites */
  GL.favs = function () { return GL.store.get('favs', []); };
  GL.isFav = id => GL.favs().indexOf(id) >= 0;
  GL.toggleFav = function (id) {
    const f = GL.favs();
    const i = f.indexOf(id);
    if (i >= 0) f.splice(i, 1); else f.push(id);
    GL.store.set('favs', f);
    return i < 0;
  };

  /* ---------------------------------------------------------------- icons */
  GL.icons = {
    arrow: '→', download: '↓', print: '⎙', reset: '↺', star: '★', starO: '☆',
    check: '✓', x: '✕', info: 'i', warn: '!', chart: '◔', file: '▤', up: '↑'
  };

  /* ---------------------------------------------------------- number input */
  GL.on = function (root, selector, event, fn) {
    root.querySelectorAll(selector).forEach(el => el.addEventListener(event, fn));
    return root.querySelectorAll(selector);
  };
  GL.bindCalc = function (root, ids, fn) {
    const run = GL.debounce(() => { if (!root.isConnected) return; try { fn(); } catch (e) { console.error(e); } }, 120);
    ids.forEach(id => {
      const el = root.querySelector('#' + CSS.escape(id));
      if (!el) return;
      el.addEventListener('input', run);
      el.addEventListener('change', run);
    });
    run();
    return run;
  };
  GL.metricHTML = function (id, label, unit, opts) {
    opts = opts || {};
    return `<div class="metric ${opts.hero ? 'hero' : ''} ${opts.cls || ''}">
      <span>${label}</span><strong id="${id}">—</strong><small>${unit || ''}</small></div>`;
  };
  GL.setVerdict = function (id, tone, title, text) {
    const el = document.getElementById(id);
    if (!el) return;
    const ico = tone === 'ok' ? '✓' : tone === 'bad' ? '✕' : tone === 'warn' ? '!' : 'i';
    el.className = 'verdict ' + (tone || 'info');
    el.innerHTML = `<div class="vi">${ico}</div><div><b>${title}</b>${text || ''}</div>`;
  };

  GL.version = '1.4.0';
})();
