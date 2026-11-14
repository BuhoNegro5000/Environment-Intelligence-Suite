/* ==========================================================================
   Yupana · Suite Seguridad & Higiene (parte 1)
   20 Riesgo Conesa · 21 IPERC 5×5 · 22 Línea de vida / caídas · 23 Indicadores SST
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL, D = GL.data, num = GL.num, fmt = GL.fmt, esc = GL.escape, U = GL.ui;

  /* ---------------------------------------------------------------- niveles */
  function conesaLevel(R, mode) {
    if (mode === 'full') {
      if (R <= 2) return { label: 'Trivial', tone: 'ok', cls: 'tag-ok', color: '#9fe8c2' };
      if (R <= 6) return { label: 'Tolerable', tone: 'ok', cls: 'tag-ok', color: '#c8f08a' };
      if (R <= 14) return { label: 'Moderado', tone: 'warn', cls: 'tag-warn', color: '#f5cf7a' };
      if (R <= 20) return { label: 'Importante', tone: 'bad', cls: 'tag-bad', color: '#f7a38c' };
      return { label: 'Intolerable', tone: 'bad', cls: 'tag-bad', color: '#ef8b96' };
    }
    if (R <= 2) return { label: 'Trivial', tone: 'ok', cls: 'tag-ok', color: '#9fe8c2' };
    if (R <= 4) return { label: 'Tolerable', tone: 'ok', cls: 'tag-ok', color: '#c8f08a' };
    if (R <= 6) return { label: 'Moderado', tone: 'warn', cls: 'tag-warn', color: '#f5cf7a' };
    if (R <= 8) return { label: 'Importante', tone: 'bad', cls: 'tag-bad', color: '#f7a38c' };
    return { label: 'Intolerable', tone: 'bad', cls: 'tag-bad', color: '#ef8b96' };
  }
  function ipercLevel(R) {
    if (R <= 4) return { label: 'Bajo', tone: 'ok', cls: 'tag-ok', color: '#9fe8c2' };
    if (R <= 9) return { label: 'Medio', tone: 'warn', cls: 'tag-warn', color: '#f5cf7a' };
    if (R <= 16) return { label: 'Alto', tone: 'bad', cls: 'tag-bad', color: '#f7a38c' };
    return { label: 'Muy alto', tone: 'bad', cls: 'tag-bad', color: '#ef8b96' };
  }
  const CONS = ['Trivial', 'Tolerable', 'Moderado', 'Importante', 'Intolerable'];
  const IPER = ['Bajo', 'Medio', 'Alto', 'Muy alto'];

  function selectCell(i, k, v, values) {
    return `<select class="tbl-select" data-i="${i}" data-k="${k}">${values.map(o =>
      `<option value="${o}" ${String(o) === String(v) ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  }
  function readRows(tbody, state, textKeys) {
    const rows = state.map(r => Object.assign({}, r));
    tbody.querySelectorAll('[data-i]').forEach(el => {
      const i = +el.dataset.i, k = el.dataset.k;
      if (!rows[i]) return;
      rows[i][k] = textKeys.indexOf(k) >= 0 ? el.value : +el.value;
    });
    return rows;
  }

  /* ======================================================================
     20 · EVALUACIÓN DE RIESGO — MÉTODO CONESA
     ====================================================================== */
  const T20 = {
    id: 'risk-conesa',
    suite: 'safety',
    storeKeys: ['cs.rows'],
    title: 'Evaluación de riesgo · método Conesa',
    desc: 'Valore peligros con el método Conesa (probabilidad × consecuencia × exposición) o con la variante simplificada (probabilidad × consecuencia). Registre varios peligros, obtenga el nivel de riesgo y priorice controles.',
    tags: ['Conesa', 'Riesgo', 'SST', 'IPERC'],
    keywords: 'conesa riesgo probabilidad consecuencia exposicion matriz peligro evaluacion sst iperc prioridad',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Registro de peligros</h2><p>Cada fila es un peligro. Ajuste P, C y E según la escala inferior.</p></div><span class="mono" id="csCount">0</span></div>
            <div class="grid-3">
              ${U.select('csMode', 'Modo de evaluación', [
                { id: 'full', label: 'Conesa completo · P × C × E' },
                { id: 'simple', label: 'Simplificado · P × C' }
              ], 'full')}
              ${U.field('csArea', 'Área / proceso', '—', 'Planta de tratamiento')}
              ${U.field('csEval', 'Evaluador', '—', 'Equipo SST')}
            </div>
            <div class="table-wrap" style="max-height:340px;margin-top:12px"><table><thead><tr><th>#</th><th>Peligro / situación</th><th>P</th><th>C</th><th>E</th><th class="num">R</th><th>Nivel</th><th></th></tr></thead><tbody id="csBody"></tbody></table></div>
            <div class="btn-row"><button class="btn sm" id="csAdd" type="button">+ Peligro</button><button class="btn sm" id="csDemo" type="button">Datos demo</button><button class="btn sm" id="csClear" type="button">Vaciar</button></div>
          </section>
          <section class="panel">
            <div class="panel-title">Escalas del método</div>
            <div class="grid-3" style="gap:14px">
              <div><div class="panel-title" style="font-size:10px">Probabilidad (P)</div>
                <table><tbody><tr><td class="name">1 · Baja</td><td>El daño ocurrirá raras veces</td></tr><tr><td class="name">2 · Media</td><td>El daño ocurrirá en algunas ocasiones</td></tr><tr><td class="name">3 · Alta</td><td>El daño ocurrirá siempre o casi siempre</td></tr></tbody></table></div>
              <div><div class="panel-title" style="font-size:10px">Consecuencia (C)</div>
                <table><tbody><tr><td class="name">1 · Ligeramente dañino</td><td>Lesión leve, primeros auxilios</td></tr><tr><td class="name">2 · Dañino</td><td>Lesión con incapacidad temporal</td></tr><tr><td class="name">3 · Extremadamente dañino</td><td>Incapacidad permanente o muerte</td></tr></tbody></table></div>
              <div><div class="panel-title" style="font-size:10px">Exposición (E)</div>
                <table><tbody><tr><td class="name">1 · Esporádica</td><td>Ocasional, no rutinaria</td></tr><tr><td class="name">2 · Ocasional</td><td>Parte de la jornada</td></tr><tr><td class="name">3 · Frecuente</td><td>Toda o casi toda la jornada</td></tr></tbody></table></div>
            </div>
            <div class="note" style="margin-top:10px">El modo simplificado usa R = P × C y una escala de 1 a 9. El modo completo usa R = P × C × E (1 a 27). La valoración es cualitativa y debe ser validada por personal competente.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resumen <span class="tag" id="csModeTag">P × C × E</span></div>
            <div class="metrics">
              ${U.metric('csMax', 'Riesgo máximo', 'R', true)}
              ${U.metric('csMaxLevel', 'Nivel máximo', '')}
              ${U.metric('csAvg', 'Riesgo promedio', 'R')}
              ${U.metric('csHigh', 'Peligros importantes o intolerables', 'n')}
              ${U.metric('csHighPct', 'Fracción prioritaria', '%')}
              ${U.metric('csTotal', 'Peligros registrados', 'n')}
            </div>
            <div class="chart-wrap" style="margin-top:16px"><canvas id="csChart"></canvas></div>
            <div class="chart-legend"><span><i style="background:#2A8C82"></i>Distribución por nivel de riesgo</span></div>
            <div id="csVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Priorización de controles</div>
            <div id="csRecs"></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T20;
      const demo = () => ([
        { h: 'Trabajo en altura sin línea de vida', p: 3, c: 3, e: 2 },
        { h: 'Exposición a polvo de sílice en chancado', p: 2, c: 2, e: 3 },
        { h: 'Derrame de reactivo en laboratorio', p: 1, c: 2, e: 2 },
        { h: 'Atrapamiento en faja transportadora', p: 2, c: 3, e: 2 }
      ]);
      let state = GL.store.get('cs.rows', null);
      if (!Array.isArray(state) || !state.length) state = demo();
      const body = root.querySelector('#csBody');

      function mode() { return root.querySelector('#csMode').value; }
      function riskOf(r) { return mode() === 'full' ? r.p * r.c * r.e : r.p * r.c; }

      function rowHTML(r, i) {
        const R = riskOf(r), lv = conesaLevel(R, mode());
        return `<tr>
          <td class="name">${i + 1}</td>
          <td><input class="tbl-input" style="width:210px;text-align:left" data-i="${i}" data-k="h" value="${esc(r.h)}"></td>
          <td>${selectCell(i, 'p', r.p, [1, 2, 3])}</td>
          <td>${selectCell(i, 'c', r.c, [1, 2, 3])}</td>
          <td>${selectCell(i, 'e', r.e, [1, 2, 3])}</td>
          <td class="num" data-r="${i}"><b>${R}</b></td>
          <td data-lv="${i}"><span class="tag ${lv.cls}">${lv.label}</span></td>
          <td><button class="btn sm" data-del="${i}" type="button" title="Eliminar">✕</button></td>
        </tr>`;
      }
      function render() {
        body.innerHTML = state.map(rowHTML).join('');
        root.querySelector('#csCount').textContent = state.length + ' peligros';
      }
      function read() {
        state = readRows(body, state, ['h']);
        GL.store.set('cs.rows', state);
      }
      function paint() {
        state.forEach((r, i) => {
          const R = riskOf(r), lv = conesaLevel(R, mode());
          const rc = body.querySelector(`[data-r="${i}"]`);
          const lc = body.querySelector(`[data-lv="${i}"]`);
          if (rc) rc.innerHTML = `<b>${R}</b>`;
          if (lc) lc.innerHTML = `<span class="tag ${lv.cls}">${lv.label}</span>`;
        });
      }

      function update() {
        const m = mode();
        root.querySelector('#csModeTag').textContent = m === 'full' ? 'P × C × E' : 'P × C';
        const risks = state.map(riskOf);
        const max = risks.length ? Math.max.apply(null, risks) : 0;
        const maxLv = conesaLevel(max, m);
        const avg = risks.length ? risks.reduce((s, x) => s + x, 0) / risks.length : 0;
        const high = risks.filter(R => conesaLevel(R, m).tone === 'bad').length;
        const pct = risks.length ? high / risks.length * 100 : 0;

        GL.out('csMax', fmt(max, 0));
        GL.out('csMaxLevel', maxLv.label);
        GL.out('csAvg', fmt(avg, 1));
        GL.out('csHigh', fmt(high, 0));
        GL.out('csHighPct', fmt(pct, 0) + ' %');
        GL.out('csTotal', fmt(risks.length, 0));

        const names = CONS;
        const counts = names.map(n => risks.filter(R => conesaLevel(R, m).label === n).length);
        GL.chart(root.querySelector('#csChart'), {
          type: 'bar',
          series: [{ name: 'Peligros', data: names.map((n, i) => [n, counts[i]]), color: '#A57B1F' }],
          y: { label: 'Número de peligros', zero: true, min: 0, max: Math.max(1, Math.max.apply(null, counts)) }
        });

        const tone = maxLv.tone;
        GL.setVerdict('csVerdict', tone,
          risks.length ? `Nivel máximo: ${maxLv.label} (R = ${fmt(max, 0)})` : 'Sin peligros registrados',
          risks.length
            ? `${fmt(high, 0)} de ${fmt(risks.length, 0)} peligros (${fmt(pct, 0)} %) se clasifican como importantes o intolerables. ${high ? 'No inicie la actividad sin controles de eliminación o sustitución y verificación en campo.' : 'Mantenga los controles y reevalúe ante cambios de proceso, personal o equipos.'} El promedio es ${fmt(avg, 1)}.`
            : 'Agregue al menos un peligro para evaluar.');

        const recs = [
          { lv: 'Intolerable', txt: 'No se debe iniciar ni continuar la actividad. Elimine o sustituya el peligro; si no es posible, detenga el trabajo hasta implementar controles de ingeniería y administrativos verificados.' },
          { lv: 'Importante', txt: 'Requiere acción inmediata. Aplique la jerarquía de controles, defina responsables y fechas, y verifique la eficacia antes de continuar.' },
          { lv: 'Moderado', txt: 'Implemente controles en un plazo definido, con seguimiento. Considere mejoras de ingeniería antes de confiar solo en EPP.' },
          { lv: 'Tolerable', txt: 'Mantenga los controles existentes y verifique su cumplimiento. Reevalúe si cambian las condiciones.' },
          { lv: 'Trivial', txt: 'Sin acción adicional específica; mantenga la vigilancia y las buenas prácticas.' }
        ];
        root.querySelector('#csRecs').innerHTML = recs.map(r => {
          const n = risks.filter(R => conesaLevel(R, m).label === r.lv).length;
          return `<div class="method-item"><i>${n ? '●' : '○'}</i><div><b>${r.lv} (${n})</b><br>${esc(r.txt)}</div></div>`;
        }).join('');

        T._report = {
          title: 'Evaluación de riesgo · método Conesa',
          subtitle: `${root.querySelector('#csArea').value || 'Área'} · modo ${m === 'full' ? 'P × C × E' : 'P × C'} · ${state.length} peligros`,
          inputs: [['Área / proceso', root.querySelector('#csArea').value || '—'], ['Evaluador', root.querySelector('#csEval').value || '—'],
            ['Modo', m === 'full' ? 'Conesa completo (P × C × E)' : 'Simplificado (P × C)']],
          results: [
            ['Riesgo máximo', fmt(max, 0), 'R'], ['Nivel máximo', maxLv.label, ''],
            ['Riesgo promedio', fmt(avg, 1), 'R'], ['Importantes o intolerables', fmt(high, 0), 'n'],
            ['Fracción prioritaria', fmt(pct, 0), '%'], ['Total de peligros', fmt(risks.length, 0), 'n']
          ],
          extra: `<table><thead><tr><th>#</th><th>Peligro</th><th>P</th><th>C</th><th>E</th><th>R</th><th>Nivel</th></tr></thead><tbody>${state.map((r, i) => {
            const R = riskOf(r), lv = conesaLevel(R, m);
            return `<tr><td>${i + 1}</td><td>${esc(r.h)}</td><td>${r.p}</td><td>${r.c}</td><td>${r.e}</td><td>${R}</td><td>${lv.label}</td></tr>`;
          }).join('')}</tbody></table>`,
          notes: [
            'Método cualitativo de evaluación general de riesgos. El nivel orienta la prioridad, no sustituye una evaluación específica (ruido, químico, ergonomía, psicosocial).',
            'La escala de exposición usada tiene tres niveles (esporádica, ocasional, frecuente); una exposición continua se representa con P y E máximos.',
            'La evaluación debe incluir a los trabajadores expuestos, revisarse ante cambios y registrarse en la matriz IPERC del sistema de gestión.',
            'El resultado no constituye dictamen legal ni certificación de seguridad.'
          ],
          method: '<p>Conesa completo: R = P × C × E, con P, C, E de 1 a 3. Niveles: 1–2 trivial, 3–6 tolerable, 7–14 moderado, 15–20 importante, 21–27 intolerable. Simplificado: R = P × C (1–9) con escala proporcional.</p>'
        };
        T._csv = state.map((r, i) => {
          const R = riskOf(r), lv = conesaLevel(R, m);
          return { n: i + 1, peligro: r.h, probabilidad: r.p, consecuencia: r.c, exposicion: r.e, riesgo: R, nivel: lv.label };
        });
      }

      root.addEventListener('input', e => { if (e.target.matches('[data-i]')) { read(); paint(); update(); } });
      root.addEventListener('change', e => { if (e.target.matches('[data-i]')) { read(); paint(); update(); } });
      root.addEventListener('click', e => {
        const del = e.target.closest('[data-del]');
        if (!del) return;
        read(); state.splice(+del.dataset.del, 1); GL.store.set('cs.rows', state); render(); update();
      });
      root.querySelector('#csMode').addEventListener('change', () => { render(); update(); });
      root.querySelector('#csAdd').addEventListener('click', () => { read(); state.push({ h: 'Nuevo peligro', p: 1, c: 1, e: 1 }); GL.store.set('cs.rows', state); render(); update(); });
      root.querySelector('#csDemo').addEventListener('click', () => { state = demo(); GL.store.set('cs.rows', state); render(); update(); });
      root.querySelector('#csClear').addEventListener('click', () => { state = []; GL.store.set('cs.rows', state); render(); update(); });

      render();
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_evaluacion_riesgo_conesa.csv', this._csv); }
  };
  GL.tool(T20);

  /* ======================================================================
     21 · MATRIZ IPERC 5×5
     ====================================================================== */
  const T21 = {
    id: 'iperc-matrix',
    suite: 'safety',
    storeKeys: ['ip.rows'],
    title: 'Matriz IPERC 5×5 · probabilidad × severidad',
    desc: 'Registre peligros en la matriz IPERC de 5×5: probabilidad y severidad generan un nivel de riesgo, con controles y responsables. Visualice la concentración de peligros y priorice los niveles alto y muy alto.',
    tags: ['IPERC', 'Matriz 5×5', 'SST', 'Controles'],
    keywords: 'iperc matriz 5x5 probabilidad severidad riesgo control jerarquia peligro sst peru',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Peligros y controles</h2><p>Probabilidad y severidad de 1 (muy bajo) a 5 (muy alto). El riesgo es el producto.</p></div><span class="mono" id="ipCount">0</span></div>
            <div class="table-wrap" style="max-height:360px"><table><thead><tr><th>#</th><th>Peligro / actividad</th><th>Prob.</th><th>Sev.</th><th class="num">R</th><th>Nivel</th><th>Control</th><th></th></tr></thead><tbody id="ipBody"></tbody></table></div>
            <div class="btn-row"><button class="btn sm" id="ipAdd" type="button">+ Peligro</button><button class="btn sm" id="ipDemo" type="button">Datos demo</button><button class="btn sm" id="ipClear" type="button">Vaciar</button></div>
            <div class="grid-3" style="margin-top:12px">
              ${U.field('ipArea', 'Área / proceso', '—', 'Mantenimiento mecánico')}
              ${U.field('ipResp', 'Responsable', '—', 'Supervisor de área')}
              ${U.field('ipDate', 'Fecha de evaluación', '—', '2026-11-10')}
            </div>
          </section>
          <section class="panel">
            <div class="panel-title">Criterios de valoración</div>
            <div class="table-wrap"><table><thead><tr><th>Nivel</th><th>Rango</th><th>Interpretación y acción</th></tr></thead><tbody>
              <tr><td><span class="tag tag-ok">Bajo</span></td><td class="num">1 – 4</td><td>Aceptable. Mantener controles y verificar cumplimiento.</td></tr>
              <tr><td><span class="tag tag-warn">Medio</span></td><td class="num">5 – 9</td><td>Moderado. Implementar controles con plazo y seguimiento.</td></tr>
              <tr><td><span class="tag tag-bad">Alto</span></td><td class="num">10 – 16</td><td>Acción inmediata. Controles de ingeniería y verificación en campo.</td></tr>
              <tr><td><span class="tag tag-bad">Muy alto</span></td><td class="num">17 – 25</td><td>No continuar sin eliminar o sustituir el peligro.</td></tr>
            </tbody></table></div>
            <div class="note warn" style="margin-top:10px">La matriz IPERC es una herramienta de gestión. La valoración debe ser participativa y coherente con la metodología aprobada por la organización.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Matriz de riesgo <span class="tag">5 × 5</span></div>
            <div id="ipMatrix" style="margin-top:8px"></div>
            <div class="compbar-legend" style="margin-top:8px">
              <span><i style="background:#9fe8c2"></i>Bajo (1–4)</span>
              <span><i style="background:#f5cf7a"></i>Medio (5–9)</span>
              <span><i style="background:#f7a38c"></i>Alto (10–16)</span>
              <span><i style="background:#ef8b96"></i>Muy alto (17–25)</span>
            </div>
          </section>
          <section class="panel">
            <div class="panel-title">Resumen</div>
            <div class="metrics">
              ${U.metric('ipMax', 'Riesgo máximo', 'R', true)}
              ${U.metric('ipLevel', 'Nivel máximo', '')}
              ${U.metric('ipHigh', 'Alto + muy alto', 'n')}
              ${U.metric('ipHighPct', 'Fracción prioritaria', '%')}
              ${U.metric('ipAvg', 'Riesgo promedio', 'R')}
              ${U.metric('ipTotal', 'Peligros registrados', 'n')}
            </div>
            <div class="chart-wrap" style="margin-top:16px"><canvas id="ipChart"></canvas></div>
            <div id="ipVerdict" class="verdict info"></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T21;
      const demo = () => ([
        { h: 'Trabajo en caliente cerca de material inflamable', l: 3, s: 5, ctrl: 'Permiso de trabajo en caliente y vigilancia' },
        { h: 'Manipulación manual de cargas > 25 kg', l: 3, s: 2, ctrl: 'Ayuda mecánica y capacitación' },
        { h: 'Ruido en sala de compresores', l: 4, s: 2, ctrl: 'Aislamiento y protección auditiva' },
        { h: 'Acceso a partes móviles sin guarda', l: 2, s: 4, ctrl: 'Guardas fijas y bloqueo/etiquetado' },
        { h: 'Resbalón por piso húmedo', l: 4, s: 1, ctrl: 'Señalización y limpieza programada' }
      ]);
      let state = GL.store.get('ip.rows', null);
      if (!Array.isArray(state) || !state.length) state = demo();
      const body = root.querySelector('#ipBody');

      function riskOf(r) { return r.l * r.s; }
      function rowHTML(r, i) {
        const R = riskOf(r), lv = ipercLevel(R);
        return `<tr>
          <td class="name">${i + 1}</td>
          <td><input class="tbl-input" style="width:190px;text-align:left" data-i="${i}" data-k="h" value="${esc(r.h)}"></td>
          <td>${selectCell(i, 'l', r.l, [1, 2, 3, 4, 5])}</td>
          <td>${selectCell(i, 's', r.s, [1, 2, 3, 4, 5])}</td>
          <td class="num" data-r="${i}"><b>${R}</b></td>
          <td data-lv="${i}"><span class="tag ${lv.cls}">${lv.label}</span></td>
          <td><input class="tbl-input" style="width:180px;text-align:left" data-i="${i}" data-k="ctrl" value="${esc(r.ctrl || '')}"></td>
          <td><button class="btn sm" data-del="${i}" type="button" title="Eliminar">✕</button></td>
        </tr>`;
      }
      function render() {
        body.innerHTML = state.map(rowHTML).join('');
        root.querySelector('#ipCount').textContent = state.length + ' peligros';
      }
      function read() {
        state = readRows(body, state, ['h', 'ctrl']);
        GL.store.set('ip.rows', state);
      }
      function paint() {
        state.forEach((r, i) => {
          const R = riskOf(r), lv = ipercLevel(R);
          const rc = body.querySelector(`[data-r="${i}"]`);
          const lc = body.querySelector(`[data-lv="${i}"]`);
          if (rc) rc.innerHTML = `<b>${R}</b>`;
          if (lc) lc.innerHTML = `<span class="tag ${lv.cls}">${lv.label}</span>`;
        });
      }
      function renderMatrix() {
        const counts = {};
        state.forEach(r => { const k = r.l + '-' + r.s; counts[k] = (counts[k] || 0) + 1; });
        let head = '<tr><th>Sev. \\ Prob.</th>' + [1, 2, 3, 4, 5].map(l => `<th>P${l}</th>`).join('') + '</tr>';
        let rows = '';
        for (let s = 5; s >= 1; s--) {
          rows += `<tr><th>S${s}</th>`;
          for (let l = 1; l <= 5; l++) {
            const R = l * s, lv = ipercLevel(R), c = counts[l + '-' + s] || 0;
            rows += `<td style="background:${lv.color}" title="Probabilidad ${l} · Severidad ${s} · R ${R}">${c ? c : R}</td>`;
          }
          rows += '</tr>';
        }
        root.querySelector('#ipMatrix').innerHTML = `<table class="matrix"><thead>${head}</thead><tbody>${rows}</tbody></table>`;
      }

      function update() {
        const risks = state.map(riskOf);
        const max = risks.length ? Math.max.apply(null, risks) : 0;
        const lv = ipercLevel(max);
        const high = risks.filter(R => R > 9).length;
        const pct = risks.length ? high / risks.length * 100 : 0;
        const avg = risks.length ? risks.reduce((s, x) => s + x, 0) / risks.length : 0;

        GL.out('ipMax', fmt(max, 0));
        GL.out('ipLevel', lv.label);
        GL.out('ipHigh', fmt(high, 0));
        GL.out('ipHighPct', fmt(pct, 0) + ' %');
        GL.out('ipAvg', fmt(avg, 1));
        GL.out('ipTotal', fmt(risks.length, 0));

        renderMatrix();

        const counts = IPER.map(n => risks.filter(R => ipercLevel(R).label === n).length);
        GL.chart(root.querySelector('#ipChart'), {
          type: 'bar',
          series: [{ name: 'Peligros', data: IPER.map((n, i) => [n, counts[i]]), color: '#A57B1F' }],
          y: { label: 'Número de peligros', zero: true, min: 0, max: Math.max(1, Math.max.apply(null, counts)) }
        });

        GL.setVerdict('ipVerdict', risks.length ? lv.tone : 'info',
          risks.length ? `Nivel máximo: ${lv.label} (R = ${fmt(max, 0)})` : 'Sin peligros registrados',
          risks.length
            ? `${fmt(high, 0)} de ${fmt(risks.length, 0)} peligros (${fmt(pct, 0)} %) están en nivel alto o muy alto. ${high ? 'Priorice la eliminación o sustitución del peligro; los controles administrativos y el EPP son la última barrera.' : 'Mantenga los controles y reevalúe la matriz ante cambios.'} Riesgo promedio ${fmt(avg, 1)}.`
            : 'Agregue al menos un peligro para construir la matriz.');

        T._report = {
          title: 'Matriz IPERC 5×5 · evaluación de riesgos',
          subtitle: `${root.querySelector('#ipArea').value || 'Área'} · responsable ${root.querySelector('#ipResp').value || '—'} · ${state.length} peligros`,
          inputs: [
            ['Área / proceso', root.querySelector('#ipArea').value || '—'],
            ['Responsable', root.querySelector('#ipResp').value || '—'],
            ['Fecha', root.querySelector('#ipDate').value || '—']
          ],
          results: [
            ['Riesgo máximo', fmt(max, 0), 'R'], ['Nivel máximo', lv.label, ''],
            ['Alto + muy alto', fmt(high, 0), 'n'], ['Fracción prioritaria', fmt(pct, 0), '%'],
            ['Riesgo promedio', fmt(avg, 1), 'R'], ['Total de peligros', fmt(risks.length, 0), 'n']
          ],
          extra: `<table><thead><tr><th>#</th><th>Peligro</th><th>Prob.</th><th>Sev.</th><th>R</th><th>Nivel</th><th>Control</th></tr></thead><tbody>${state.map((r, i) => {
            const R = riskOf(r), l = ipercLevel(R);
            return `<tr><td>${i + 1}</td><td>${esc(r.h)}</td><td>${r.l}</td><td>${r.s}</td><td>${R}</td><td>${l.label}</td><td>${esc(r.ctrl || '')}</td></tr>`;
          }).join('')}</tbody></table>`,
          notes: [
            'Riesgo = probabilidad × severidad, ambos de 1 a 5. Niveles: bajo 1–4, medio 5–9, alto 10–16, muy alto 17–25.',
            'La jerarquía de controles prioriza eliminación, sustitución, ingeniería, administrativos y EPP, en ese orden.',
            'La matriz debe ser participativa, estar fechada y firmada, y actualizarse ante cambios de proceso, incidentes o nuevos peligros.',
            'Los controles propuestos deben verificarse en campo; registrarlos no garantiza su implementación.'
          ],
          method: '<p>R = Probabilidad × Severidad. Probabilidad y severidad se valoran de 1 (muy bajo) a 5 (muy alto) según criterios definidos por la organización. El nivel se asigna por rangos: 1–4 bajo, 5–9 medio, 10–16 alto, 17–25 muy alto.</p>'
        };
        T._csv = state.map((r, i) => {
          const R = riskOf(r), l = ipercLevel(R);
          return { n: i + 1, peligro: r.h, probabilidad: r.l, severidad: r.s, riesgo: R, nivel: l.label, control: r.ctrl || '' };
        });
      }

      root.addEventListener('input', e => { if (e.target.matches('[data-i]')) { read(); paint(); update(); } });
      root.addEventListener('change', e => { if (e.target.matches('[data-i]')) { read(); paint(); update(); } });
      root.addEventListener('click', e => {
        const del = e.target.closest('[data-del]');
        if (!del) return;
        read(); state.splice(+del.dataset.del, 1); GL.store.set('ip.rows', state); render(); update();
      });
      root.querySelector('#ipAdd').addEventListener('click', () => { read(); state.push({ h: 'Nuevo peligro', l: 1, s: 1, ctrl: '' }); GL.store.set('ip.rows', state); render(); update(); });
      root.querySelector('#ipDemo').addEventListener('click', () => { state = demo(); GL.store.set('ip.rows', state); render(); update(); });
      root.querySelector('#ipClear').addEventListener('click', () => { state = []; GL.store.set('ip.rows', state); render(); update(); });

      render();
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_matriz_IPERC.csv', this._csv); }
  };
  GL.tool(T21);

  /* ======================================================================
     22 · SISTEMA DE PROTECCIÓN CONTRA CAÍDAS — HOLGURA
     ====================================================================== */
  const T22 = {
    id: 'fall-clearance',
    suite: 'safety',
    title: 'Protección contra caídas · holgura y distancia de detención',
    desc: 'Calcule la distancia total de caída y la holgura libre requerida bajo la superficie de trabajo: caída libre, desaceleración del absorbedor, estiramiento del arnés, altura del trabajador y margen de seguridad. Compare con la holgura disponible.',
    tags: ['Caídas', 'Línea de vida', 'Arnés', 'OSHA'],
    keywords: 'caida altura linea vida arnes absorbedor holgura distancia detencion factor caida anclaje osha',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Geometría del sistema</h2><p>Distancias medidas desde la superficie de trabajo y el punto de anclaje.</p></div></div>
            <div class="grid-3">
              ${U.field('fcAnchor', 'Altura del anclaje sobre la superficie', 'm', '3.0', { q: 'Diferencia vertical entre el punto de anclaje y el nivel donde está el trabajador.' })}
              ${U.field('fcLanyard', 'Longitud del cable / eslinga', 'm', '1.8')}
              ${U.field('fcWorker', 'Altura del trabajador (D-ring a pies)', 'm', '1.5')}
              ${U.field('fcDecel', 'Distancia de desaceleración del absorbedor', 'm', '1.0')}
              ${U.field('fcStretch', 'Estiramiento del arnés / cable', 'm', '0.3')}
              ${U.field('fcMargin', 'Margen de seguridad', 'm', '0.6')}
              ${U.field('fcSwing', 'Caída adicional por péndulo', 'm', '0', { q: 'Incremento vertical por oscilación o trabajo lateral respecto al anclaje. Use 0 si el trabajo es vertical.' })}
              ${U.field('fcAvail', 'Holgura libre disponible', 'm', '6.0', { q: 'Distancia vertical libre desde la superficie de trabajo hasta el primer obstáculo o nivel inferior.' })}
              ${U.field('fcOffset', 'Distancia horizontal al anclaje', 'm', '0')}
            </div>
            <div class="note" style="margin-top:10px">Si el anclaje está por encima del D-ring, la caída libre se reduce. La fórmula conserva un mínimo de seguridad y no considera el efecto dinámico completo de una caída con factor mayor a 1.</div>
          </section>
          <section class="panel">
            <div class="panel-title">Buenas prácticas de anclaje</div>
            <div id="fcTips"></div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado</div>
            <div class="metrics">
              ${U.metric('fcFree', 'Caída libre', 'm', true)}
              ${U.metric('fcTotal', 'Distancia total de caída', 'm')}
              ${U.metric('fcReq', 'Holgura requerida', 'm')}
              ${U.metric('fcAvailOut', 'Holgura disponible', 'm')}
              ${U.metric('fcLeft', 'Margen remanente', 'm')}
              ${U.metric('fcFactor', 'Factor de caída', '—')}
              ${U.metric('fcSwingOut', 'Caída por péndulo', 'm')}
              ${U.metric('fcAngle', 'Ángulo respecto a la vertical', '°')}
            </div>
            <div class="chart-wrap" style="margin-top:16px"><canvas id="fcChart"></canvas></div>
            <div class="chart-legend"><span><i style="background:#A57B1F"></i>Holgura requerida</span><span><i style="background:#2A8C82"></i>Holgura disponible</span></div>
            <div id="fcVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Desglose de la distancia</div>
            <div class="table-wrap"><table><thead><tr><th>Componente</th><th class="num">Valor</th><th>Unidad</th></tr></thead><tbody id="fcTable"></tbody></table></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T22;
      function update() {
        const anchor = Math.max(0, num('fcAnchor', 3));
        const lanyard = Math.max(0.1, num('fcLanyard', 1.8));
        const worker = Math.max(0.5, num('fcWorker', 1.5));
        const decel = Math.max(0, num('fcDecel', 1));
        const stretch = Math.max(0, num('fcStretch', 0.3));
        const margin = Math.max(0, num('fcMargin', 0.6));
        const swing = Math.max(0, num('fcSwing', 0));
        const avail = Math.max(0, num('fcAvail', 6));
        const offset = Math.max(0, num('fcOffset', 0));

        const free = Math.max(0, lanyard - anchor);
        const total = free + decel + stretch + worker + margin + swing;
        const left = avail - total;
        const factor = lanyard > 0 ? free / lanyard : 0;
        const angleFromVertical = offset > 0 ? Math.atan2(offset, lanyard) * 180 / Math.PI : 0;

        GL.out('fcFree', fmt(free, 2));
        GL.out('fcTotal', fmt(total, 2));
        GL.out('fcReq', fmt(total, 2));
        GL.out('fcAvailOut', fmt(avail, 2));
        GL.out('fcLeft', GL.signed(left, 2));
        GL.out('fcFactor', fmt(factor, 2));
        GL.out('fcSwingOut', fmt(swing, 2));
        GL.out('fcAngle', fmt(angleFromVertical, 0) + '°');

        root.querySelector('#fcTable').innerHTML = [
          ['Caída libre', free], ['Desaceleración del absorbedor', decel], ['Estiramiento del arnés', stretch],
          ['Altura del trabajador', worker], ['Margen de seguridad', margin], ['Péndulo / oscilación', swing]
        ].map(r => `<tr><td class="name">${r[0]}</td><td class="num">${fmt(r[1], 2)}</td><td>m</td></tr>`).join('')
          + `<tr><td class="name"><b>Total requerido</b></td><td class="num"><b>${fmt(total, 2)}</b></td><td>m</td></tr>`;

        GL.chart(root.querySelector('#fcChart'), {
          type: 'bar',
          series: [{ name: 'Holgura', data: [['Requerida', total], ['Disponible', avail]], color: '#2A8C82' }],
          y: { label: 'Distancia vertical (m)', zero: true, min: 0 },
          rules: [{ y: avail, label: 'disponible ' + fmt(avail, 2) + ' m', color: '#2A8C82' }]
        });

        const ok = left >= 0;
        GL.setVerdict('fcVerdict', ok ? 'ok' : 'bad',
          ok ? 'Holgura suficiente' : 'Holgura insuficiente — riesgo de impacto',
          `Caída libre ${fmt(free, 2)} m, distancia total de detención ${fmt(total, 2)} m y holgura disponible ${fmt(avail, 2)} m. ${ok ? 'Quedan ' + fmt(left, 2) + ' m de margen.' : 'Faltan ' + fmt(Math.abs(left), 2) + ' m: reubique el anclaje más alto, acorte la eslinga o use un sistema retráctil.'} Factor de caída ${fmt(factor, 2)}${factor > 1 ? ' (supera 1: use un sistema con absorbedor adecuado)' : ''}. ${offset > 0 ? 'Trabajo con offset horizontal: el péndulo aumenta la caída y el riesgo de impacto lateral.' : ''}`);

        const tips = [
          'Ancle por encima del hombro siempre que sea posible: reduce la caída libre y el factor de caída.',
          'Verifique que el absorbedor no haya sido activado y que el gancho cierre y bloquee correctamente.',
          'La holgura debe medirse hasta el primer obstáculo, no hasta el piso terminado.',
          'Evite el trabajo con péndulo: mantenga el anclaje dentro de un cono razonable respecto a la vertical.',
          'Inspeccione arnés, eslinga y conectores antes de cada uso y registre la inspección.',
          'Un sistema retráctil puede reducir la distancia de detención; use la ficha del fabricante.'
        ];
        root.querySelector('#fcTips').innerHTML = tips.map(t => `<div class="method-item"><i>→</i><div>${esc(t)}</div></div>`).join('');

        T._report = {
          title: 'Protección contra caídas · cálculo de holgura',
          subtitle: `Anclaje ${fmt(anchor, 2)} m · eslinga ${fmt(lanyard, 2)} m · holgura disponible ${fmt(avail, 2)} m`,
          inputs: [
            ['Altura del anclaje', fmt(anchor, 2) + ' m'], ['Longitud de eslinga', fmt(lanyard, 2) + ' m'],
            ['Altura del trabajador', fmt(worker, 2) + ' m'], ['Desaceleración', fmt(decel, 2) + ' m'],
            ['Estiramiento', fmt(stretch, 2) + ' m'], ['Margen de seguridad', fmt(margin, 2) + ' m'],
            ['Péndulo', fmt(swing, 2) + ' m'], ['Holgura disponible', fmt(avail, 2) + ' m'],
            ['Offset horizontal', fmt(offset, 2) + ' m']
          ],
          results: [
            ['Caída libre', fmt(free, 2), 'm'], ['Distancia total', fmt(total, 2), 'm'],
            ['Holgura requerida', fmt(total, 2), 'm'], ['Holgura disponible', fmt(avail, 2), 'm'],
            ['Margen remanente', GL.signed(left, 2), 'm'], ['Factor de caída', fmt(factor, 2), '—'],
            ['Ángulo respecto a la vertical', fmt(angleFromVertical, 0), '°']
          ],
          notes: [
            'La fórmula suma caída libre, desaceleración, estiramiento, altura del trabajador y margen de seguridad. Es una verificación geométrica, no un cálculo de fuerzas de impacto.',
            'Los valores de desaceleración y estiramiento deben provenir de la ficha técnica del fabricante y del estado real del equipo.',
            'La holgura disponible debe medirse en campo hasta el obstáculo más cercano, incluido el nivel inferior, equipos o estructuras.',
            'El trabajo en altura requiere planificación, permiso, personal competente, rescate y verificación de anclajes. Este cálculo no certifica el sistema.'
          ],
          method: '<p>Caída libre = máx(0, L_eslinga − H_anclaje). Distancia total = caída libre + desaceleración + estiramiento + altura del trabajador + margen + péndulo. Holgura requerida = distancia total. Factor de caída = caída libre / L_eslinga.</p>'
        };
        T._csv = [{
          anclaje_m: anchor, eslinga_m: lanyard, caida_libre_m: +free.toFixed(3), desaceleracion_m: decel,
          estiramiento_m: stretch, altura_trabajador_m: worker, margen_m: margin, pendulo_m: swing,
          total_requerido_m: +total.toFixed(3), disponible_m: avail, margen_remanente_m: +left.toFixed(3),
          factor_caida: +factor.toFixed(3), angulo_vertical_deg: +angleFromVertical.toFixed(1)
        }];
      }
      GL.bindCalc(root, ['fcAnchor', 'fcLanyard', 'fcWorker', 'fcDecel', 'fcStretch', 'fcMargin', 'fcSwing', 'fcAvail', 'fcOffset'], update);
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_holgura_caidas.csv', this._csv); }
  };
  GL.tool(T22);

  /* ======================================================================
     23 · INDICADORES DE SEGURIDAD Y SALUD EN EL TRABAJO
     ====================================================================== */
  const T23 = {
    id: 'sst-indicators',
    suite: 'safety',
    title: 'Indicadores SST · frecuencia, gravedad e intervalo de confianza',
    desc: 'Calcule índices de frecuencia, gravedad, incidencia y TRIR/LTIR a partir de horas trabajadas y casos. Añada el intervalo de confianza de Poisson y compare con una meta interna.',
    tags: ['SST', 'TRIR', 'Poisson', 'Indicadores'],
    keywords: 'sst indicadores frecuencia gravedad incidencia trir ltir poisson accidentalidad seguridad horas hombre',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Exposición y eventos</h2><p>Use el mismo período y la misma definición de caso para comparar áreas o años.</p></div></div>
            <div class="grid-3">
              ${U.select('siBase', 'Base de normalización', D.sst.bases.map(b => ({ id: b.id, label: b.label })), 'peru')}
              ${U.field('siHours', 'Horas hombre trabajadas', 'h', '480000')}
              ${U.field('siWorkers', 'Trabajadores promedio', 'personas', '260')}
              ${U.field('siRecord', 'Casos registrables', 'n', '6')}
              ${U.field('siLost', 'Casos con tiempo perdido', 'n', '3')}
              ${U.field('siDays', 'Días perdidos', 'd', '42')}
              ${U.field('siNear', 'Casi accidentes reportados', 'n', '18')}
              ${U.field('siFatal', 'Fatalidades', 'n', '0')}
              ${U.field('siTarget', 'Meta interna de TRIR', 'casos/200 000 h', '2.0')}
            </div>
            <div class="note" style="margin-top:10px">La base 200 000 h equivale a 100 trabajadores a tiempo completo durante un año (aproximadamente 2 000 h por persona). Verifique la definición de caso registrable de su sistema de gestión.</div>
          </section>
          <section class="panel">
            <div class="panel-title">Pirámide de eventos</div>
            <div id="siPyramid"></div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado <span class="tag" id="siBaseTag">BASE 200 000 h</span></div>
            <div class="metrics">
              ${U.metric('siTrir', 'TRIR / índice de frecuencia', 'por base', true)}
              ${U.metric('siLtir', 'LTIR', 'por base')}
              ${U.metric('siSev', 'Índice de gravedad', 'días / base')}
              ${U.metric('siInc', 'Incidencia', 'por 100 trabajadores')}
              ${U.metric('siCILo', 'IC 95 % inferior', 'por base')}
              ${U.metric('siCIHi', 'IC 95 % superior', 'por base')}
              ${U.metric('siFat', 'Tasa de fatalidad', 'por 100 000 trab.')}
              ${U.metric('siRatio', 'Casi accidentes / caso', '—')}
            </div>
            <div class="chart-wrap" style="margin-top:16px"><canvas id="siChart"></canvas></div>
            <div class="chart-legend"><span><i style="background:#5277A8"></i>TRIR</span><span><i style="background:#77679A"></i>LTIR</span><span><i style="background:#A57B1F"></i>Meta</span></div>
            <div id="siVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Fórmulas y lectura</div>
            <div id="siNotes"></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T23;
      function update() {
        const baseId = root.querySelector('#siBase').value;
        const baseDef = D.sst.bases.find(b => b.id === baseId) || D.sst.bases[0];
        const base = baseDef.base;
        const hours = Math.max(1, num('siHours', 480000));
        const workers = Math.max(1, num('siWorkers', 260));
        const record = Math.max(0, Math.round(num('siRecord', 6)));
        const lost = Math.max(0, Math.round(num('siLost', 3)));
        const days = Math.max(0, num('siDays', 42));
        const near = Math.max(0, Math.round(num('siNear', 18)));
        const fatal = Math.max(0, Math.round(num('siFatal', 0)));
        const target = Math.max(0, num('siTarget', 2));

        const trir = record * base / hours;
        const ltir = lost * base / hours;
        const sev = days * base / hours;
        const inc = record / workers * 100;
        const fatRate = fatal / workers * 100000;
        const factor = base / hours;
        const ci = GL.stat.poissonCI(record, 0.95);
        const ciLo = ci.lo * factor, ciHi = ci.hi * factor;
        const ratio = record > 0 ? near / record : near;

        GL.out('siTrir', fmt(trir, 2));
        GL.out('siLtir', fmt(ltir, 2));
        GL.out('siSev', fmt(sev, 1));
        GL.out('siInc', fmt(inc, 2));
        GL.out('siCILo', fmt(ciLo, 2));
        GL.out('siCIHi', fmt(ciHi, 2));
        GL.out('siFat', fmt(fatRate, 1));
        GL.out('siRatio', fmt(ratio, 1));
        root.querySelector('#siBaseTag').textContent = 'BASE ' + fmt(base, 0) + ' h';

        GL.chart(root.querySelector('#siChart'), {
          type: 'bar',
          series: [{ name: 'Tasa', data: [['TRIR', trir], ['LTIR', ltir], ['Meta', target]], color: '#5277A8' }],
          y: { label: 'Casos por base', zero: true, min: 0 },
          rules: [{ y: target, label: 'meta ' + fmt(target, 2), color: '#A57B1F' }]
        });

        const pyr = [
          { label: 'Casi accidentes', n: near, color: '#6E8F45' },
          { label: 'Casos registrables', n: record, color: '#5277A8' },
          { label: 'Con tiempo perdido', n: lost, color: '#A57B1F' },
          { label: 'Fatalidades', n: fatal, color: '#B06060' }
        ];
        const maxPyr = Math.max(1, near, record, lost, fatal);
        root.querySelector('#siPyramid').innerHTML = pyr.map(p => `
          <div style="display:flex;align-items:center;gap:10px;margin:7px 0">
            <span style="width:150px;font-size:10px;color:var(--muted)">${p.label}</span>
            <div class="progress" style="flex:1;height:12px"><i style="width:${p.n / maxPyr * 100}%;background:${p.color}"></i></div>
            <b class="mono" style="width:44px;text-align:right">${fmt(p.n, 0)}</b>
          </div>`).join('');

        const notes = [
          `TRIR = ${fmt(record, 0)} × ${fmt(base, 0)} / ${fmt(hours, 0)} = ${fmt(trir, 2)} casos por ${fmt(base, 0)} h.`,
          `LTIR = ${fmt(lost, 0)} × ${fmt(base, 0)} / ${fmt(hours, 0)} = ${fmt(ltir, 2)} casos con tiempo perdido por ${fmt(base, 0)} h.`,
          `Índice de gravedad = ${fmt(days, 0)} días × ${fmt(base, 0)} / ${fmt(hours, 0)} = ${fmt(sev, 1)} días perdidos por ${fmt(base, 0)} h.`,
          `Intervalo de confianza de Poisson al 95 % para ${fmt(record, 0)} casos: ${fmt(ci.lo, 2)} – ${fmt(ci.hi, 2)} casos, equivalente a ${fmt(ciLo, 2)} – ${fmt(ciHi, 2)} por ${fmt(base, 0)} h.`,
          'Un solo año con pocos casos produce intervalos amplios: la comparación entre años o áreas debe considerar esa incertidumbre.'
        ];
        root.querySelector('#siNotes').innerHTML = notes.map(n => `<div class="method-item"><i>→</i><div>${esc(n)}</div></div>`).join('');

        const tone = fatal > 0 ? 'bad' : trir > target ? 'warn' : trir > target * 0.75 ? 'warn' : 'ok';
        GL.setVerdict('siVerdict', tone,
          fatal > 0 ? 'Evento fatal registrado' : trir > target ? 'TRIR por encima de la meta' : 'TRIR dentro de la meta',
          `TRIR ${fmt(trir, 2)} y LTIR ${fmt(ltir, 2)} por ${fmt(base, 0)} h; índice de gravedad ${fmt(sev, 1)}. Meta interna ${fmt(target, 2)}. IC 95 % del TRIR: ${fmt(ciLo, 2)} – ${fmt(ciHi, 2)}. ${trir > target ? 'Investigue las causas raíz y refuerce los controles críticos; un TRIR alto con pocas horas puede deberse a un solo evento.' : 'Mantenga la vigilancia y el reporte de casi accidentes.'} ${fatal > 0 ? 'Active la investigación de accidente fatal y la comunicación de crisis.' : ''}`);

        T._report = {
          title: 'Indicadores de seguridad y salud en el trabajo',
          subtitle: `${baseDef.label} · ${fmt(hours, 0)} h hombre · ${fmt(record, 0)} casos registrables`,
          inputs: [
            ['Base de normalización', baseDef.label], ['Horas hombre', fmt(hours, 0) + ' h'],
            ['Trabajadores promedio', fmt(workers, 0)], ['Casos registrables', fmt(record, 0)],
            ['Casos con tiempo perdido', fmt(lost, 0)], ['Días perdidos', fmt(days, 0)],
            ['Casi accidentes', fmt(near, 0)], ['Fatalidades', fmt(fatal, 0)], ['Meta de TRIR', fmt(target, 2)]
          ],
          results: [
            ['TRIR / frecuencia', fmt(trir, 2), 'por ' + fmt(base, 0) + ' h'], ['LTIR', fmt(ltir, 2), 'por ' + fmt(base, 0) + ' h'],
            ['Índice de gravedad', fmt(sev, 1), 'días por ' + fmt(base, 0) + ' h'], ['Incidencia', fmt(inc, 2), 'por 100 trabajadores'],
            ['IC 95 % inferior', fmt(ciLo, 2), 'por ' + fmt(base, 0) + ' h'], ['IC 95 % superior', fmt(ciHi, 2), 'por ' + fmt(base, 0) + ' h'],
            ['Tasa de fatalidad', fmt(fatRate, 1), 'por 100 000 trabajadores'], ['Casi accidentes / caso', fmt(ratio, 1), '—']
          ],
          notes: [
            'Los índices normalizan los eventos por horas de exposición; comparar solo números absolutos entre áreas de distinto tamaño es engañoso.',
            'El intervalo de confianza de Poisson (Garwood) refleja la incertidumbre cuando el número de casos es pequeño.',
            'La definición de caso registrable, el tratamiento de días perdidos y las horas hombre deben ser consistentes en todas las comparaciones.',
            'Los indicadores reactivos (accidentes) no describen por sí solos el desempeño preventivo; complemente con indicadores proactivos y auditorías.'
          ],
          method: '<p>TRIR = N × base / H. LTIR = N_con_tiempo_perdido × base / H. Índice de gravedad = días perdidos × base / H. Incidencia = N / trabajadores × 100. IC 95 % de Poisson: ½χ²(α/2, 2N) a ½χ²(1−α/2, 2N+2), escalado por base/H.</p>'
        };
        T._csv = [{
          base: base, horas_hombre: hours, trabajadores: workers, casos_registrables: record,
          casos_tiempo_perdido: lost, dias_perdidos: days, casi_accidentes: near, fatalidades: fatal,
          trir: +trir.toFixed(3), ltir: +ltir.toFixed(3), indice_gravedad: +sev.toFixed(2),
          incidencia_100: +inc.toFixed(3), ic95_inferior: +ciLo.toFixed(3), ic95_superior: +ciHi.toFixed(3),
          tasa_fatalidad_100k: +fatRate.toFixed(2), meta_trir: target
        }];
      }
      root.querySelector('#siBase').addEventListener('change', update);
      GL.bindCalc(root, ['siHours', 'siWorkers', 'siRecord', 'siLost', 'siDays', 'siNear', 'siFatal', 'siTarget'], update);
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_indicadores_SST.csv', this._csv); }
  };
  GL.tool(T23);
})();
