/* Green Owl Labs · banco científico original, sin dependencias ni red. */
(function () {
  'use strict';
  const G = window.GL, E = G.escape;
  const L = G.lab = { definitions: [] };
  L.assert = (ok, message) => { if (!ok) throw new Error(message); };
  L.sum = a => a.reduce((s, x) => s + x, 0);
  L.range = (x, lo, hi, name) => L.assert(x >= lo && x <= hi, name + ': valor fuera de [' + lo + ', ' + hi + '].');
  L.number = raw => {
    const s = String(raw).trim().replace(',', '.');
    L.assert(s !== '' && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(s), 'Ingresa números completos; usa punto o coma decimal y no uses separadores de miles.');
    const n = Number(s); L.assert(Number.isFinite(n), 'El número debe ser finito.'); return n;
  };
  L.matrix = text => {
    const lines = String(text).trim().split(/\r?\n/).filter(s => s.trim());
    L.assert(lines.length > 0 && lines.length <= 1000, 'Usa entre 1 y 1000 filas.');
    const a = lines.map(s => s.trim().split(/[;\t]/.test(s) ? /[;\t]/ : / +/).map(L.number));
    L.assert(a[0].length <= 30 && a.every(r => r.length === a[0].length), 'Todas las filas deben tener igual número de columnas (máximo 30).'); return a;
  };
  L.transpose = a => a[0].map((_, j) => a.map(r => r[j]));
  L.identity = n => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
  L.multiply = (a, b) => a.map(r => L.transpose(b).map(c => L.sum(r.map((x, j) => x * c[j]))));
  L.inverse = a => {
    const n = a.length, m = a.map((r, i) => r.concat(L.identity(n)[i]));
    for (let j = 0; j < n; j++) {
      let p = j; for (let i = j + 1; i < n; i++) if (Math.abs(m[i][j]) > Math.abs(m[p][j])) p = i;
      L.assert(Math.abs(m[p][j]) > 1e-11, 'Matriz singular o mal condicionada; revisa independencia y escala.');
      [m[j], m[p]] = [m[p], m[j]]; const d = m[j][j]; m[j] = m[j].map(x => x / d);
      for (let i = 0; i < n; i++) if (i !== j) { const f = m[i][j]; m[i] = m[i].map((x, k) => x - f * m[j][k]); }
    } return m.map(r => r.slice(n));
  };
  L.eigen = a => {
    const n = a.length, m = a.map(r => r.slice()), v = L.identity(n);
    for (let it = 0; it < 100 * n * n; it++) {
      let p = 0, q = 1, mx = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.abs(m[i][j]) > mx) { mx = Math.abs(m[i][j]); p = i; q = j; }
      if (mx < 1e-11 || n < 2) break;
      const t = .5 * Math.atan2(2 * m[p][q], m[q][q] - m[p][p]), c = Math.cos(t), s = Math.sin(t);
      const app = m[p][p], aqq = m[q][q], apq = m[p][q];
      for (let k = 0; k < n; k++) if (k !== p && k !== q) {
        const x = m[k][p], y = m[k][q]; m[k][p] = m[p][k] = c*x-s*y; m[k][q] = m[q][k] = s*x+c*y;
      }
      m[p][p] = c*c*app-2*s*c*apq+s*s*aqq; m[q][q] = s*s*app+2*s*c*apq+c*c*aqq; m[p][q] = m[q][p] = 0;
      for (let k = 0; k < n; k++) { const x = v[k][p], y = v[k][q]; v[k][p] = c*x-s*y; v[k][q] = s*x+c*y; }
    }
    return m.map((r, i) => ({ value: Math.max(0, r[i]), vector: v.map(row => row[i]) })).sort((x,y) => y.value-x.value);
  };
  L.f = (key, label, unit, value, min, max) => ({ key, label, unit, value, min, max });
  L.text = (key, label, value, hint) => ({ key, label, value, hint, type: 'text' });
  L.table = (key, label, value, hint) => ({ key, label, value, hint, type: 'table' });
  L.select = (key, label, options, value) => ({ key, label, options, value, type: 'select' });
  L.result = (label, value, unit, extra) => Object.assign({ metrics: [[label, value, unit || '']] }, extra || {});
  const suites = {
    ecology: ['Ecología & Biodiversidad', 'Ecología', '♧', '#66D7B3', 'Diversidad, comunidades, bioindicadores y restauración.'],
    climate: ['Clima & Población', 'Clima', '☼', '#F2CC78', 'Confort térmico, aridez, carbono e indicadores demográficos.'],
    decision: ['Decisión Multicriterio', 'Decisión', '⋈', '#C5AEF5', 'Ponderación, priorización y análisis transparente de alternativas.'],
    analysis: ['Análisis & Estadística', 'Análisis', '∿', '#77C7F1', 'Series, regresión, PCA, calidad de datos y simulación.'],
    spatial: ['Geografía & Territorio', 'Geo', '⌖', '#EDB08B', 'Coordenadas, distancias, geometrías y análisis espacial.']
  };
  Object.keys(suites).forEach(id => { const s = suites[id]; G.suites[id] = { id, name:s[0], short:s[1], icon:s[2], color:s[3], desc:s[4] }; });
  const display = x => typeof x === 'number' ? G.fmt(x, 6) : String(x == null ? '—' : x);

  /* ------------------------------------------- kit visual del banco */
  const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const motionOff = () => Boolean(motionQuery && motionQuery.matches);
  let vizSeq = 0;

  /* Convierte una tabla de resultados en una lectura de barras cuando la
     estructura lo permite. Devuelve null para matrices y tablas sin eje. */
  const normHeader = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const isTimeHeader = h => ['ano', 'year', 'mes', 'month', 'dia', 'day', 'hora', 'hour', 'fecha', 'date', 'periodo', 'semana', 'week', 'trimestre', 'tiempo', 'time'].includes(normHeader(h));
  const isAxisHeader = h => isTimeHeader(h) || /^(tiempo|hora|ano|year|mes|month|dia|day|fecha|date|periodo|semana|trimestre|volumen|distancia|angulo|dosis|marcador|elevacion|tamano|lluvia|biomasa|abscisa|intervalo|longitud|profundidad|bv|x|c)\b/.test(normHeader(h));
  const headerWeight = h => {
    if (isAxisHeader(h)) return -0.6;
    const s = normHeader(h);
    if (/^(n|id|#|codigo|rank|posicion|orden|puesto|ano|mes|dia|hora)$/.test(s)) return -0.6;
    let weight = 0;
    if (/(puntuaci|score|indice|aqi|media|promedio|mean|mediana|total|suma|resultado|valor|carga|emisi|concentra|npr|caudal|dosis|riesgo|prioridad|nivel|balance)/.test(s)) weight += 0.45;
    if (/(posici|rank|orden|puesto|variaci)/.test(s)) weight -= 0.4;
    return weight;
  };
  const identityHeader = h => /^(taxon|especie|ion|corriente|alternativa|escenario|punto|segmento|etapa|hora|sistema|tren|posicion|actividad|variable|muestra|parametro|condicion|tratamiento|canal|compuesto|nombre|id|elemento|fila|periodo|fecha|dia|ano|mes|sitio|estacion|reactor|proceso|fuente|zona|categoria|clase|grupo|metodo|responsable|estado|tipo|nivel|caso|sujeto|suelo|cultivo|producto|ruta|material|sustancia|servicio|impacto|indicador|transicion|uso|tramo|nodo|marcador|angulo|distancia|tiempo|volumen|elevacion|tamano|dosis|lluvia|biomasa|abscisa|intervalo|sector|componente|tanda|filtro|aplicacion|practica|tecnologia|opcion|linea|unidad experimental|unidad)/.test(normHeader(h));

  function autoViz(r, renderValue) {
    if (!r.headers || !r.rows || r.rows.length < 2 || r.rows.length > 400) return null;
    const cols = r.headers.length;
    if (cols < 2 || cols > 30 || r.rows.some(row => !Array.isArray(row) || row.length !== cols)) return null;
    const isText = c => r.rows.filter(row => typeof row[c] === 'string' && row[c].trim()).length >= Math.ceil(r.rows.length * 0.6);
    const numericCols = [];
    for (let c = 0; c < cols; c++) {
      const nums = r.rows.map(row => row[c]).filter(v => typeof v === 'number' && Number.isFinite(v));
      if (nums.length < Math.ceil(r.rows.length * 0.6) || new Set(nums).size < 2) continue;
      if (nums.every(v => v === 0 || v === 1)) continue;
      numericCols.push(c);
    }
    if (!numericCols.length) return null;
    const textCols = [...Array(cols).keys()].filter(isText);
    const distinct = c => new Set(r.rows.map(row => String(row[c]))).size;
    let labelCol = textCols.find(c => distinct(c) >= Math.max(2, Math.ceil(r.rows.length * 0.5)));
    const timeCols = [...Array(cols).keys()].filter(c => isTimeHeader(r.headers[c]));
    if (labelCol === undefined) {
      if (timeCols.length) labelCol = undefined;
      else labelCol = [...Array(cols).keys()].find(c => (identityHeader(r.headers[c]) || isAxisHeader(r.headers[c])) && distinct(c) > 1 && numericCols.includes(c));
    }
    if (labelCol === undefined && !timeCols.length) return null;
    /* Matriz numérica: las cabeceras numéricas repiten las etiquetas de fila. */
    if (labelCol !== undefined && numericCols.length >= 3 && r.rows.length === numericCols.length) {
      const rowLabels = new Set(r.rows.map(row => normHeader(row[labelCol])));
      const isMatrix = numericCols.every(c => rowLabels.has(normHeader(r.headers[c])));
      if (isMatrix) return null;
    }
    const candidates = numericCols.filter(c => c !== labelCol && !isAxisHeader(r.headers[c]));
    if (!candidates.length) return null;
    let valueCol = candidates[0];
    candidates.forEach(c => { if (headerWeight(r.headers[c]) > headerWeight(r.headers[valueCol]) + 1e-9) valueCol = c; });
    const pad = v => String(v).padStart(2, '0');
    const timeLabel = row => {
      const at = key => timeCols.find(c => normHeader(r.headers[c]) === key);
      const y = at('ano') ?? at('year'), m = at('mes') ?? at('month'), d = at('dia') ?? at('day'), hr = at('hora') ?? at('hour');
      if (y !== undefined && m !== undefined && d !== undefined) {
        const base = `${row[y]}-${pad(row[m])}-${pad(row[d])}`;
        return hr !== undefined ? `${base} ${pad(row[hr])}:00` : base;
      }
      const date = at('fecha') ?? at('date');
      if (date !== undefined) return hr !== undefined ? `${row[date]} ${pad(row[hr])}:00` : String(row[date]);
      return timeCols.map(c => row[c]).join(' · ');
    };
    const pairs = r.rows.map((row, i) => {
      const v = row[valueCol];
      if (typeof v !== 'number' || !Number.isFinite(v)) return null;
      let label;
      if (labelCol !== undefined) {
        const cell = row[labelCol];
        label = typeof cell === 'string' && cell.trim() ? cell : String(cell == null ? 'Fila ' + (i + 1) : cell);
      } else {
        label = timeLabel(row);
      }
      return { label, value: v };
    }).filter(Boolean);
    if (pairs.length < 2) return null;
    /* Una columna de identidad que solo numera filas (1, 2, 3…) se lee mejor
       con su encabezado: «Ion 1» en vez de un «1» huérfano. */
    const labelHeader = labelCol !== undefined ? String(r.headers[labelCol] || '') : '';
    if (labelHeader && pairs.every((p, i) => p.label === String(i + 1))) {
      pairs.forEach((p, i) => { p.label = labelHeader + ' ' + (i + 1); });
    }
    const short = v => G.fmtSmart(v);
    const lo = Math.min(...pairs.map(p => p.value)), hi = Math.max(...pairs.map(p => p.value));
    if (!(hi > lo)) return null;
    const seq = ++vizSeq;
    const header = r.headers[valueCol] || 'Valor';
    const labelName = labelCol !== undefined ? (r.headers[labelCol] || 'fila') : 'período';
    /* Series y curvas: eje numérico o temporal continuo. */
    const isAxis = labelCol === undefined || isAxisHeader(r.headers[labelCol]);
    const useLine = pairs.length >= 3 && isAxis;
    if (!useLine && pairs.length > 24) return null;
    let pane;
    if (useLine) {
      const W = 620, H = 200, PX = 12, PY = 18;
      const vSpan = hi - lo, lowPad = lo - vSpan * 0.1, highPad = hi + vSpan * 0.1;
      const xAt = i => PX + (W - 2 * PX) * (i / (pairs.length - 1));
      const yAt = v => PY + (H - 2 * PY) * (1 - (v - lowPad) / (highPad - lowPad));
      const points = pairs.map((p, i) => `${xAt(i).toFixed(1)},${yAt(p.value).toFixed(1)}`);
      const linePath = `M${points.join(' L')}`;
      const areaPath = `${linePath} L${xAt(pairs.length - 1).toFixed(1)},${H - PY} L${xAt(0).toFixed(1)},${H - PY} Z`;
      const dots = pairs.map((p, i) => {
        const last = i === pairs.length - 1;
        return `<circle class="lab-line-point${last ? ' is-last' : ''}" cx="${xAt(i).toFixed(1)}" cy="${yAt(p.value).toFixed(1)}" r="${last ? 3.6 : 2.1}"><title>${E(p.label)} · ${E(renderValue(p.value))}</title></circle>`;
      }).join('');
      pane = `<div class="lab-line-wrap">
        <svg class="lab-line${pairs.length > 24 ? ' is-dense' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="lab-line-t-${seq}">
          <title id="lab-line-t-${seq}">${E(header)} frente a ${E(labelName)}: ${pairs.length} puntos, de ${E(G.fmtSmart(lo))} a ${E(G.fmtSmart(hi))}.</title>
          <line class="lab-line-grid" x1="${PX}" y1="${H / 2}" x2="${W - PX}" y2="${H / 2}"></line>
          <path class="lab-line-area" d="${areaPath}"></path>
          <path class="lab-line-path" d="${linePath}"></path>
          ${dots}
        </svg>
        <div class="lab-line-axis"><span>${E(pairs[0].label)}</span><span>${E(pairs[pairs.length - 1].label)}</span></div>
      </div>`;
    } else {
      const min = Math.min(0, lo), max = Math.max(0, hi), span = max - min;
      const zero = (0 - min) / span * 100;
      const signed = min < 0;
      const bars = pairs.map(p => {
        const pct = Math.abs(p.value) / span * 100;
        return `<li class="lab-bar" title="${E(p.label)} · ${E(short(p.value))}">
          <span class="lab-bar-label">${E(p.label)}</span>
          <span class="lab-bar-track" aria-hidden="true"><span class="lab-bar-fill${p.value < 0 ? ' neg' : ''}" data-pct="${pct.toFixed(3)}" style="--pct:${pct.toFixed(3)}"></span></span>
          <span class="lab-bar-value">${E(short(p.value))}</span>
        </li>`;
      }).join('');
      pane = `<ol class="lab-bars${signed ? ' is-signed' : ''}" style="--zero:${zero.toFixed(2)}" aria-label="${E(header)} por ${E(labelName)}">${bars}</ol>`;
    }
    const note = useLine
      ? `${pairs.length} puntos · ${E(G.fmtSmart(lo))} a ${E(G.fmtSmart(hi))}`
      : `${pairs.length} filas · ${Math.min(0, lo) < 0 ? 'escala centrada en cero' : 'escala desde cero'}`;
    return `<div class="lab-viz" data-lab-viz>
      <div class="lab-viz-head">
        <div class="lab-viz-title"><span class="lab-eyebrow">LECTURA VISUAL</span><h3>${E(header)}</h3><p>${note}</p></div>
        <div class="lab-viz-tabs" role="tablist" aria-label="Vista de resultados">
          <button type="button" role="tab" id="lab-viz-tab-${seq}-bars" aria-controls="lab-viz-pane-${seq}-bars" aria-selected="true" tabindex="0" data-viz-mode="bars">${useLine ? 'Tendencia' : 'Barras'}</button>
          <button type="button" role="tab" id="lab-viz-tab-${seq}-table" aria-controls="lab-viz-pane-${seq}-table" aria-selected="false" tabindex="-1" data-viz-mode="table">Tabla</button>
        </div>
      </div>
      <div class="lab-viz-pane" id="lab-viz-pane-${seq}-bars" role="tabpanel" aria-labelledby="lab-viz-tab-${seq}-bars" data-viz-pane="bars">${pane}</div>
      <div class="lab-viz-pane" id="lab-viz-pane-${seq}-table" role="tabpanel" aria-labelledby="lab-viz-tab-${seq}-table" data-viz-pane="table" hidden>${L.tableHTML(r.headers, r.rows, renderValue)}</div>
    </div>`;
  }

  L.autoViz = autoViz;

  function animateViz(viz) {
    if (!viz) return;
    const line = viz.querySelector('.lab-line-path');
    if (line) {
      viz.classList.remove('is-animated');
      if (!motionOff()) {
        void line.getBoundingClientRect();
        viz.classList.add('is-animated');
      }
    }
    if (motionOff()) return;
    const bars = Array.from(viz.querySelectorAll('.lab-bar-fill'));
    if (!bars.length) return;
    bars.forEach((bar, i) => {
      bar.style.setProperty('--pct', '0');
      bar.style.transitionDelay = Math.min(i * 24, 280) + 'ms';
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bars.forEach(bar => bar.style.setProperty('--pct', bar.dataset.pct));
    }));
  }

  function wireViz(output) {
    output.querySelectorAll('[data-lab-viz]').forEach(viz => {
      const tabs = Array.from(viz.querySelectorAll('[data-viz-mode]'));
      const panes = Array.from(viz.querySelectorAll('[data-viz-pane]'));
      const select = mode => {
        tabs.forEach(tab => {
          const on = tab.dataset.vizMode === mode;
          tab.setAttribute('aria-selected', String(on));
          tab.tabIndex = on ? 0 : -1;
        });
        panes.forEach(pane => { pane.hidden = pane.dataset.vizPane !== mode; });
        if (mode === 'bars') animateViz(viz);
      };
      tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => select(tab.dataset.vizMode));
        tab.addEventListener('keydown', event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          let next = i;
          if (event.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
          else if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = tabs.length - 1;
          tabs[next].focus();
          select(tabs[next].dataset.vizMode);
        });
      });
    });
  }

  L.tableHTML = (headers, rows, renderValue=display) => `<div class="lab-table-scroll"><table class="lab-table"><thead><tr>${headers.map(h => `<th>${E(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${E(renderValue(c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  L.register = function (d) {
    L.definitions.push(d);
    const fieldId = f => 'lab-' + d.id + '-' + f.key;
    const tool = {
      id:d.id, suite:d.suite, title:d.title, desc:d.desc || d.method,
      tags:d.tags || ['Método explícito', 'Código propio'], keywords:d.keywords || d.title + ' ' + d.method,
      lab:d,
      html() {
        const pilot=G.calculatorUI?.isPilot(d.id);
        const fields=d.fields.map(f=>{
          const id=fieldId(f), label=`<span>${E(f.label)}${f.unit ? `<em>${E(f.unit)}</em>` : ''}</span>`;
          if(pilot&&(!f.type||f.type==='text'))return G.calculatorUI.field(f,id);
          if(f.type==='table'){
            const editor=!f.raw||f.fixedColumns;
            return `<div class="lab-data-field"><div class="field">${label}</div>${editor ? `<div data-editor="${id}"></div><details class="lab-paste"><summary>⌘ Pegar o editar datos en bloque</summary>` : ''}<label class="field" for="${id}"><span class="lab-sr-only">${E(f.label)} · datos separados por punto y coma</span><textarea id="${id}" rows="${Math.min(8,String(f.value).split('\n').length+1)}" spellcheck="false">${E(f.value)}</textarea></label>${editor ? '</details>' : ''}<small>${E(f.hint || 'Una fila por línea; columnas separadas por punto y coma. Sin encabezados. Coma o punto decimal.')}</small><div class="lab-data-actions"><label class="btn sm">↑ Importar archivo<input type="file" data-import="${id}" accept="${E(f.accept || '.txt,.csv,.tsv')}" hidden></label>${f.preview===false ? '' : `<button type="button" class="btn sm" data-preview="${id}">Ver tabla completa</button>`}</div><div data-preview-for="${id}"></div></div>`;
          }
          if(f.type==='select')return G.ui.select(id,E(f.label),f.options.map(([id,label])=>({id,label})),f.value);
          return `<label class="field" for="${id}">${label}<input id="${id}" type="text" ${f.type==='text'?'':'inputmode="decimal"'} value="${E(f.value)}">${f.hint?`<small>${E(f.hint)}</small>`:''}</label>`;
        }).join('');
        if(pilot)return G.calculatorUI.workbench(d,fields);
        return `<div class="lab-workbench" style="--lab-color:${G.suites[d.suite].color}">
          <div class="lab-banner"><div><span class="lab-eyebrow">GREEN OWL / BANCO CIENTÍFICO</span><h2>De tus datos a una decisión clara.</h2><p>${E(d.intro || 'Ajusta los datos, revisa el método y exporta un resultado reproducible.')}</p></div><img class="lab-brandmark" src="assets/img/green-owl-labs-mark.png" alt="Green Owl Labs" width="104" height="104"></div>
          <div class="lab-grid"><section class="lab-inputs panel"><div class="lab-section-head"><span class="lab-step">01</span><div><h2>Define tu escenario</h2><p>Los cambios se calculan automáticamente.</p></div></div>
          <div class="lab-fields">${fields}</div><div class="lab-input-foot"><span>◎</span> Tus datos se quedan en este navegador.</div></section>
          <section class="lab-results panel" aria-live="polite"><div class="lab-section-head"><span class="lab-step">02</span><div><h2>Lee el resultado</h2><p data-lab-status>Calculando escenario…</p></div><span class="lab-live">EN VIVO</span></div><div data-lab-output></div></section></div>
          <details class="lab-method panel" open><summary><span class="lab-step">03</span> Entiende el cálculo <span>Fórmula, supuestos y fuente ↗</span></summary><div class="lab-method-content"><div><span class="lab-eyebrow">MÉTODO</span><p>${E(d.method)}</p></div><div><span class="lab-eyebrow">ALCANCE</span><p>${E(d.limit || 'Resultados de apoyo técnico. Revisa las unidades, la representatividad y los supuestos de tus datos.')}</p>${(d.refs || []).map(r => `<a href="${E(r[1])}" target="_blank" rel="noopener noreferrer">${E(r[0])} ↗</a>`).join('')}</div></div></details></div>`;
      },
      mount(root) {
        const output = root.querySelector('[data-lab-output]'), status = root.querySelector('[data-lab-status]');
        const preset=d.routeInputs?.[location.hash.split('/')[3]];
        if(preset)for(const [key,value] of Object.entries(preset)){
          const field=d.fields.find(f=>f.key===key),element=field&&root.querySelector('#'+fieldId(field));
          if(element)element.value=value;
        }
        const editors = {};
        root.querySelectorAll('[data-editor]').forEach(holder => {
          const id = holder.dataset.editor, raw = root.querySelector('#' + id), f = d.fields.find(f => fieldId(f) === id);
          const fixed = Boolean(f.fixedColumns);
          const readRows = () => raw.value.trim().split(/\r?\n/).map(s => s.trim().split(fixed || /[;\t]/.test(s) ? /[;\t]/ : / +/));
          function draw() {
            const rows = readRows(), cols = fixed ? f.columns.length : Math.min(30, Math.max(1, ...rows.map(r => r.length)));
            holder.innerHTML = `<div class="lab-editor-scroll"><table class="lab-editor"><thead><tr><th>#</th>${Array.from({length:cols},(_,j)=>`<th>${E(f.columns && f.columns[j] || 'C' + (j+1))}${fixed ? '' : `<button type="button" data-remove-column="${j}" aria-label="Eliminar columna ${j+1}">×</button>`}</th>`).join('')}<th></th></tr></thead><tbody>${rows.slice(0,50).map((r,i)=>`<tr><th>${i+1}</th>${Array.from({length:cols},(_,j)=>`<td><input type="text" inputmode="${fixed && j < f.textColumns ? 'text' : 'decimal'}" data-cell-row="${i}" data-cell-column="${j}" aria-label="${E(f.label)} · fila ${i+1}, columna ${j+1}" value="${E(r[j] || '')}"></td>`).join('')}<td><button type="button" data-remove-row="${i}" aria-label="Eliminar fila ${i+1}">×</button></td></tr>`).join('')}</tbody></table></div><div class="lab-editor-foot"><button type="button" data-add-row>＋ Fila</button>${fixed ? '' : '<button type="button" data-add-column>＋ Columna</button>'}<span>${rows.length} × ${cols}${rows.length>50?' · primeras 50 filas':''}</span></div>`;
          }
          holder.addEventListener('input', e => {
            if (!e.target.hasAttribute('data-cell-row')) return;
            const rows = readRows(), i = Number(e.target.dataset.cellRow), j = Number(e.target.dataset.cellColumn);
            rows[i][j] = fixed ? e.target.value.replace(/[;\t]/g, ',') : e.target.value; raw.value = rows.map(r => r.join(';')).join('\n');
          });
          holder.addEventListener('click', e => {
            const b = e.target.closest('button'); if (!b) return;
            const rows = readRows(), cols = fixed ? f.columns.length : Math.max(...rows.map(r => r.length));
            if (b.hasAttribute('data-add-row') && rows.length < 1000) rows.push(Array(cols).fill(fixed ? '' : '0'));
            else if (b.hasAttribute('data-add-column') && cols < 30) rows.forEach(r => r.push('0'));
            else if (b.hasAttribute('data-remove-row') && rows.length > 1) rows.splice(Number(b.dataset.removeRow),1);
            else if (b.hasAttribute('data-remove-column') && cols > 1) rows.forEach(r => r.splice(Number(b.dataset.removeColumn),1));
            raw.value = rows.map(r => r.join(';')).join('\n'); draw(); raw.dispatchEvent(new Event('input',{bubbles:true}));
          });
          raw.addEventListener('input',draw); editors[id] = draw; draw();
        });
        let presentation, hasRendered = false;
        const update = () => {
          this._report = null; this._csv = null;
          const renderValue=presentation?.display||display;
          try {
            const v = {}, inputs = [], errors=[];
            d.fields.forEach(f => {
              const element=root.querySelector('#' + fieldId(f)), raw=element.value;
              if(presentation)G.calculatorUI.setFieldError(element);
              try {
                const x=f.type==='table'&&!f.raw?L.matrix(raw):(f.type==='select'||f.type==='text'||f.raw?raw:L.number(raw));
                if(!f.type){
                  if(f.min!==undefined)L.assert(x>=f.min,f.label+': mínimo '+f.min+'.');
                  if(f.max!==undefined)L.assert(x<=f.max,f.label+': máximo '+f.max+'.');
                }
                v[f.key]=x;
                inputs.push([f.label+(f.unit?' ('+f.unit+')':''),raw]);
              } catch(error){
                if(!presentation)throw error;
                const message=!f.type&&!raw.trim()?'Ingresa un valor.':error.message;
                G.calculatorUI.setFieldError(element,message);
                errors.push(message);
              }
            });
            L.assert(!errors.length,errors[0]);
            const r = d.calc(v);
            L.assert(r && r.metrics && r.metrics.every(m => typeof m[1] !== 'number' || Number.isFinite(m[1])), 'Resultado indefinido; revisa los datos y denominadores.');
            L.assert(!(r.rows || []).some(row => row.some(x => typeof x === 'number' && !Number.isFinite(x))), 'El cálculo produjo un valor indefinido.');
            const table = r.headers && r.rows ? L.tableHTML(r.headers, r.rows,renderValue) : '';
            const viz = !presentation && r.headers && r.rows ? autoViz(r, renderValue) : null;
            const renderedTable=presentation&&table?`<details class="calc-results-table"><summary>Ver tabla de resultados</summary>${table}</details>`:(viz || table);
            output.innerHTML = `<div class="lab-metrics">${r.metrics.map((m,i) => presentation?G.calculatorUI.metric(m,i,renderValue):`<div class="lab-metric ${i ? '' : 'lab-primary'}"><span>${E(m[0])}</span><strong>${E(display(m[1]))}</strong><small>${E(m[2] || '')}</small></div>`).join('')}</div>${r.message ? `<div class="lab-insight"><span>↗</span><p>${E(r.message)}</p></div>` : ''}${r.series ? '<div class="lab-chart"><canvas aria-label="Evolución de resultados" role="img"></canvas></div>' : ''}${renderedTable}${r.code ? `<label class="field"><span>Script R editable · ejecución real local</span><textarea class="lab-code" data-r-editor rows="12" spellcheck="false" style="width:100%;color:var(--text)">${E(r.code)}</textarea></label><div class="lab-data-actions"><button type="button" class="btn sm" data-download-code>↓ Descargar script R</button><button type="button" class="btn primary" data-run-r>Ejecutar R aquí</button><button type="button" class="btn sm" data-stop-r>Detener y reiniciar R</button></div><p class="map-hint">R base se carga desde esta carpeta, sin CDN. Requiere abrir la suite por HTTP local. Los paquetes externos no están precargados.</p><pre class="lab-code" data-r-result aria-live="polite">Listo para ejecutar.</pre><div data-r-images></div>` : ''}`;
            presentation?.results(r.metrics[0]);
            if(r.download){
              const button=document.createElement('button');button.type='button';button.className='btn sm';button.textContent='Descargar modelo JSON';
              button.onclick=()=>G.download(r.download.name,r.download.text,'application/json');output.appendChild(button);
            }
            wireViz(output);
            if (!hasRendered) {
              const firstViz = output.querySelector('[data-lab-viz]');
              if (firstViz) { animateViz(firstViz); hasRendered = true; }
            }
            G.clearCharts();
            if (r.series) G.chart(output.querySelector('canvas'), { type:r.series.length===1&&r.series[0].type==='bar'?'bar':'line', series:r.series, x:{ label:r.xLabel || 'Escenario' }, y:{ label:r.yLabel || 'Resultado' } });
            if (r.code) {
              output.querySelector('[data-download-code]').onclick = () => G.download('GreenOwl_analisis.R', output.querySelector('[data-r-editor]').value, 'text/plain;charset=utf-8');
              const run=output.querySelector('[data-run-r]'),dest=output.querySelector('[data-r-result]');
              output.querySelector('[data-stop-r]').onclick=()=>{G.stopNativeR();run.disabled=false;dest.textContent='Motor R detenido. Puedes iniciar otra ejecución.';};
              run.onclick=async()=>{this._rExecution=null;if(this._report){this._report.extra=(this._report.extra||'').split('<h3>Ejecución R</h3>')[0];this._report.notes=this._report.notes.filter(n=>!n.startsWith('Script ejecutado:'));}run.disabled=true;dest.textContent='Cargando R local y ejecutando el script…';try{const code=output.querySelector('[data-r-editor]').value,result=await G.runNativeR(code);if(!root.isConnected)return;dest.textContent=result.version+'\n\n'+(result.text||'Ejecución finalizada sin salida de texto.');const images=output.querySelector('[data-r-images]');images.innerHTML='';result.images.forEach(bitmap=>{const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.style.maxWidth='100%';const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0);images.appendChild(canvas);bitmap.close();});this._rExecution={generated:r.code,code,text:dest.textContent,images:Array.from(images.querySelectorAll('canvas')).map(c=>c.toDataURL())};if(this._report){this._report.extra+='<h3>Ejecución R</h3><pre>'+E(dest.textContent)+'</pre>';this._report.notes.push('Script ejecutado: '+code);}}catch(e){dest.textContent='Error de R: '+e.message;this._rExecution={generated:r.code,code:output.querySelector('[data-r-editor]').value,text:dest.textContent,images:[]};}finally{run.disabled=false;}};
            }
            this._csv = r.rows && r.rows.length ? r.rows.map(row => Object.fromEntries(r.headers.map((h,i) => [h,row[i]]))) : r.metrics.map(m => ({ indicador:m[0], valor:m[1], unidad:m[2] || '' }));
            const generated = new Date().toISOString();
            const modelVersion = d.version || (G.data && G.data.version) || G.version;
            const hash = G.hash(JSON.stringify([inputs, r.metrics, r.rows || [], modelVersion]));
            this._report = { title:d.title, subtitle:'Green Owl Labs · implementación original · v'+G.version, inputs, hasDetail:Boolean(table), results:r.metrics.map(m => [m[0],renderValue(m[1]),m[2] || '']), extra:table + (r.code ? '<pre>' + E(r.code) + '</pre>' : ''), method:E(d.method), hash, generated, modelVersion, notes:[d.limit || 'Verifica unidades y supuestos.', r.message || '', 'Huella FNV-1a de entradas y resultados: '+hash+'. Modelo v'+modelVersion+'.', ...(d.refs || []).map(r => r[0] + ': ' + r[1])] };
            if(r.code&&this._rExecution&&this._rExecution.generated===r.code){const run=this._rExecution;output.querySelector('[data-r-editor]').value=run.code;output.querySelector('[data-r-result]').textContent=run.text;output.querySelector('[data-r-images]').innerHTML=run.images.map(src=>'<img src="'+src+'" alt="Gráfico producido por R" style="max-width:100%">').join('');this._report.extra+='<h3>Ejecución R</h3><pre>'+E(run.text)+'</pre>'+run.images.map(src=>'<img src="'+src+'" alt="Gráfico R" style="max-width:100%">').join('');this._report.notes.push('Script ejecutado: '+run.code);}
            status.textContent = presentation?'Listo para exportar':'Escenario actualizado · listo para exportar';
            if(presentation)presentation.rawButton.disabled=false;
          } catch (error) {
            presentation?.results(null);
            if(presentation)presentation.rawButton.disabled=true;
            G.clearCharts();
            output.innerHTML = `<div class="lab-empty"><span>↺</span><h3>Revisa tus datos</h3><p>${E(error.message)}</p></div>`;
            status.textContent = 'Faltan datos válidos para calcular';
          }
        };
        if(G.calculatorUI?.isPilot(d.id)){
          presentation=G.calculatorUI.bind(root,update);
          presentation.rawButton=root.querySelector('[data-calc-raw]');
          presentation.rawButton.addEventListener('click',()=>{
            update();
            if(this._csv)G.csvDownload('GreenOwl_'+d.id+'.csv',this._csv);
          });
        }
        const schedule = G.debounce(()=>{if(root.isConnected)update();}, 180);
        const refreshOnEdit=e=>{if(!output.contains(e.target)&&e.target!==presentation?.select)schedule();};
        root.addEventListener('input',refreshOnEdit);
        root.addEventListener('change',refreshOnEdit);
        root.querySelectorAll('[data-import]').forEach(input => input.addEventListener('change', async () => {
          const file = input.files[0]; if (!file) return;
          if (file.size > 200000) { G.toast('Máximo 200 KB por archivo.', 'warn'); return; }
          const text = (await file.text()).replace(/^\uFEFF/, '');
          root.querySelector('#' + input.dataset.import).value = text;
          if (editors[input.dataset.import]) editors[input.dataset.import]();
          update(); G.saveInputs(d.id, root);
        }));
        root.querySelectorAll('[data-preview]').forEach(btn => btn.addEventListener('click', () => {
          const dest = root.querySelector('[data-preview-for="' + btn.dataset.preview + '"]');
          if (dest.innerHTML) { dest.innerHTML = ''; return; }
          try {
            const f = d.fields.find(f => fieldId(f) === btn.dataset.preview), raw = root.querySelector('#' + btn.dataset.preview).value;
            const a = f.fixedColumns ? raw.trim().split(/\r?\n/).map(s=>s.split(/[;\t]/)) : L.matrix(raw);
            dest.innerHTML = L.tableHTML(f.columns || a[0].map((_,i) => 'C' + (i+1)), a);
          } catch (e) { G.toast(e.message, 'warn'); }
        }));
        update();
        // Exports always recompute synchronously, including an input made just before clicking.
        this._refresh = update;
      },
      report() { if (this._refresh) this._refresh(); return this._report; },
      csv() {
        if(this._refresh)this._refresh();
        if(!this._csv)return;
        if(G.calculatorUI?.isPilot(d.id)){
          G.calculatorUI.download(d.id,this._report,this._csv,G.calculatorUI.getPrecision());
        }else{
          G.csvDownload('GreenOwl_'+d.id+'.csv',this._csv);
        }
      }
    };
    G.tool(tool); return tool;
  };
})();
