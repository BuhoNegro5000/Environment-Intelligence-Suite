/* ==========================================================================
   Yupana · Suite Seguridad & Higiene (parte 2)
   24 Dosis de ruido · 25 Ruido ambiental ECA · 26 Multas SUNAFIL
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL, D = GL.data, num = GL.num, fmt = GL.fmt, esc = GL.escape, U = GL.ui;

  /* ======================================================================
     24 · DOSIS DE RUIDO — OSHA / NIOSH
     ====================================================================== */
  const T24 = {
    id: 'noise-dose',
    suite: 'safety',
    storeKeys: ['nd.rows'],
    title: 'Dosis de ruido · OSHA y NIOSH',
    desc: 'Combine niveles de ruido y tiempos de exposición para calcular la dosis diaria, el TWA y el tiempo permitido por nivel. Compare los criterios OSHA (90 dBA, 5 dB) y NIOSH (85 dBA, 3 dB).',
    tags: ['Ruido', 'Dosis', 'OSHA', 'NIOSH'],
    keywords: 'ruido dosis osha niosh twa nivel exposicion auditiva decibel exchange rate conservacion',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Segmentos de exposición</h2><p>Nivel equivalente y duración de cada tarea o período del turno.</p></div><span class="mono" id="ndCount">0</span></div>
            <div class="grid-3">
              ${U.select('ndStd', 'Criterio', [
                { id: 'osha', label: 'OSHA · 90 dBA, 5 dB' },
                { id: 'niosh', label: 'NIOSH · 85 dBA, 3 dB' }
              ], 'osha')}
              ${U.field('ndShift', 'Duración del turno', 'h', '8')}
              ${U.field('ndWarn', 'Nivel de acción / alerta', 'dBA', '85')}
            </div>
            <div class="table-wrap" style="max-height:300px;margin-top:12px"><table><thead><tr><th>#</th><th>Actividad</th><th class="num">Nivel (dBA)</th><th class="num">Horas</th><th class="num">T permitido</th><th class="num">Dosis</th><th></th></tr></thead><tbody id="ndBody"></tbody></table></div>
            <div class="btn-row"><button class="btn sm" id="ndAdd" type="button">+ Segmento</button><button class="btn sm" id="ndDemo" type="button">Datos demo</button><button class="btn sm" id="ndClear" type="button">Vaciar</button></div>
          </section>
          <section class="panel">
            <div class="panel-title">Criterios de referencia</div>
            <div class="table-wrap"><table><thead><tr><th>Criterio</th><th class="num">Nivel</th><th class="num">Tasa de intercambio</th><th class="num">Dosis 100 %</th><th class="num">Tiempo a 85 dBA</th></tr></thead><tbody>
              <tr><td class="name">OSHA</td><td class="num">90 dBA</td><td class="num">5 dB</td><td class="num">8 h a 90 dBA</td><td class="num">~10.6 h</td></tr>
              <tr><td class="name">NIOSH</td><td class="num">85 dBA</td><td class="num">3 dB</td><td class="num">8 h a 85 dBA</td><td class="num">8 h</td></tr>
            </tbody></table></div>
            <div class="note" style="margin-top:10px">La dosis se calcula sumando las fracciones de tiempo permitido. Superar el 100 % implica exceder el límite del criterio seleccionado. La exposición a ruido de impacto requiere un cálculo separado.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado <span class="tag" id="ndStdTag">OSHA</span></div>
            <div class="metrics">
              ${U.metric('ndDose', 'Dosis del turno', '%', true)}
              ${U.metric('ndTwa', 'TWA equivalente 8 h', 'dBA')}
              ${U.metric('ndAllowed', 'Tiempo permitido al TWA', 'h')}
              ${U.metric('ndOver', 'Exceso de dosis', '%')}
              ${U.metric('ndSegs', 'Segmentos evaluados', 'n')}
              ${U.metric('ndPeak', 'Nivel máximo', 'dBA')}
              ${U.metric('ndWarnOut', 'Alerta de nivel', '')}
            </div>
            <div class="chart-wrap" style="margin-top:16px"><canvas id="ndChart"></canvas></div>
            <div class="chart-legend"><span><i style="background:#5277A8"></i>Dosis por segmento</span><span><i style="background:#A57B1F"></i>Dosis total</span></div>
            <div id="ndVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Detalle</div>
            <div class="table-wrap" style="max-height:220px"><table><thead><tr><th>Actividad</th><th class="num">h</th><th class="num">T permitido</th><th class="num">Dosis</th></tr></thead><tbody id="ndTable"></tbody></table></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T24;
      const demo = () => ([
        { a: 'Operación de chancadora', l: 95, h: 2 },
        { a: 'Mantenimiento en sala', l: 88, h: 4 },
        { a: 'Supervisión y recorrido', l: 82, h: 2 }
      ]);
      let state = GL.store.get('nd.rows', null);
      if (!Array.isArray(state) || !state.length) state = demo();
      const body = root.querySelector('#ndBody');

      function criterion() { return root.querySelector('#ndStd').value; }
      function shiftHours() { return Math.max(0.1, num('ndShift', 8)); }
      const math = GL.safetyMath;
      function allowedTimeFor(L, H) { return math.noiseAllowedTime(L, H, criterion()); }
      function allowedTime(L) { return allowedTimeFor(L, shiftHours()); }
      function rowHTML(r, i) {
        const Tt = allowedTime(r.l);
        const dose = Tt > 0 && isFinite(Tt) ? r.h / Tt * 100 : 0;
        return `<tr>
          <td class="name">${i + 1}</td>
          <td><input class="tbl-input" style="width:200px;text-align:left" data-i="${i}" data-k="a" value="${esc(r.a)}"></td>
          <td><input class="tbl-input" data-i="${i}" data-k="l" value="${r.l}"></td>
          <td><input class="tbl-input" data-i="${i}" data-k="h" value="${r.h}"></td>
          <td class="num" data-t="${i}">${isFinite(Tt) ? fmt(Tt, 2) : '—'}</td>
          <td class="num" data-d="${i}">${fmt(dose, 1)} %</td>
          <td><button class="btn sm" data-del="${i}" type="button" title="Eliminar">✕</button></td>
        </tr>`;
      }
      function render() {
        body.innerHTML = state.map(rowHTML).join('');
        root.querySelector('#ndCount').textContent = state.length + ' segmentos';
      }
      function read() {
        state = state.map((r, i) => Object.assign({}, r));
        body.querySelectorAll('[data-i]').forEach(el => {
          const i = +el.dataset.i, k = el.dataset.k;
          if (!state[i]) return;
          state[i][k] = k === 'a' ? el.value : num(el, 0);
        });
        GL.store.set('nd.rows', state);
      }
      function paint() {
        state.forEach((r, i) => {
          const Tt = allowedTime(r.l);
          const dose = isFinite(Tt) && Tt > 0 ? r.h / Tt * 100 : 0;
          const tc = body.querySelector(`[data-t="${i}"]`);
          const dc = body.querySelector(`[data-d="${i}"]`);
          if (tc) tc.textContent = isFinite(Tt) ? fmt(Tt, 2) : '—';
          if (dc) dc.textContent = fmt(dose, 1) + ' %';
        });
      }

      function update() {
        const result = math.noiseDose({
          criterion: criterion(),
          shiftHours: num('ndShift', 8),
          warn: num('ndWarn', 85),
          rows: state
        });
        const { rows, dose, dose8, twa, allowed, over, peak, alert, warn, shiftHours: shift } = result;
        const std = result.criterion;
        paint();

        GL.out('ndDose', fmt(dose, 1) + ' %');
        GL.out('ndTwa', fmt(twa, 1));
        GL.out('ndAllowed', isFinite(allowed) ? fmt(allowed, 2) : '—');
        GL.out('ndOver', fmt(over, 1) + ' %');
        GL.out('ndSegs', fmt(rows.length, 0));
        GL.out('ndPeak', fmt(peak, 0));
        GL.out('ndWarnOut', alert ? 'Superada (' + fmt(warn, 0) + ' dBA)' : 'No superada');
        root.querySelector('#ndStdTag').textContent = std === 'niosh' ? 'NIOSH' : 'OSHA';

        root.querySelector('#ndTable').innerHTML = rows.map(r =>
          `<tr><td class="name">${esc(r.a)}</td><td class="num">${fmt(r.h, 2)}</td><td class="num">${isFinite(r.T) ? fmt(r.T, 2) : '—'}</td><td class="num">${fmt(r.dose, 1)} %</td></tr>`
        ).join('');

        const bars = rows.map(r => [r.a.length > 10 ? r.a.slice(0, 9) + '…' : r.a, r.dose]);
        bars.push(['TOTAL', dose]);
        GL.chart(root.querySelector('#ndChart'), {
          type: 'bar',
          series: [{ name: 'Dosis', data: bars, color: '#5277A8' }],
          y: { label: 'Dosis (%)', zero: true, min: 0 },
          rules: [{ y: 100, label: '100 %', color: '#A57B1F' }]
        });

        const tone = dose8 > 100 ? 'bad' : dose8 > 50 ? 'warn' : 'ok';
        GL.setVerdict('ndVerdict', tone,
          dose8 > 100 ? 'Dosis equivalente superior al 100 %' : dose8 > 50 ? 'Dosis en zona de alerta' : 'Dosis bajo el límite',
          `Dosis del turno ${fmt(dose, 1)} % (equivalente 8 h ${fmt(dose8, 1)} %) con criterio ${std === 'niosh' ? 'NIOSH' : 'OSHA'} (${std === 'niosh' ? '85 dBA, 3 dB' : '90 dBA, 5 dB'}). TWA ${fmt(twa, 1)} dBA y tiempo permitido ${isFinite(allowed) ? fmt(allowed, 2) + ' h' : '—'} para ese nivel. ${dose8 > 100 ? 'Implemente controles de ingeniería (aislamiento, silenciadores, mantenimiento), reduzca el tiempo de exposición y refuerce la protección auditiva.' : dose8 > 50 ? 'Aumente la vigilancia, verifique la protección auditiva y programe audiometrías.' : 'Mantenga el monitoreo periódico y la señalización.'} ${peak >= 115 ? 'Hay niveles ≥ 115 dBA: evalúe también el ruido de impacto.' : ''} La alerta interna está en ${fmt(warn, 0)} dBA${alert ? ' y fue superada.' : '.'}`);

        T._report = {
          title: 'Dosis de ruido y TWA · criterio ' + (std === 'niosh' ? 'NIOSH' : 'OSHA'),
          subtitle: `${fmt(rows.length, 0)} segmentos · turno ${fmt(shift, 1)} h · dosis ${fmt(dose, 1)} %`,
          inputs: [['Criterio', std === 'niosh' ? 'NIOSH (85 dBA, 3 dB)' : 'OSHA (90 dBA, 5 dB)'],
            ['Duración del turno', fmt(shift, 1) + ' h'], ['Nivel de alerta', fmt(warn, 0) + ' dBA']],
          results: [
            ['Dosis del turno', fmt(dose, 1), '%'], ['Dosis equivalente 8 h', fmt(dose8, 1), '%'],
            ['TWA', fmt(twa, 1), 'dBA'],
            ['Tiempo permitido al TWA', isFinite(allowed) ? fmt(allowed, 2) : '—', 'h'],
            ['Exceso de dosis', fmt(over, 1), '%'], ['Nivel máximo', fmt(peak, 0), 'dBA'],
            ['Segmentos', fmt(rows.length, 0), 'n']
          ],
          extra: `<table><thead><tr><th>Actividad</th><th>Nivel (dBA)</th><th>Horas</th><th>T permitido (h)</th><th>Dosis (%)</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.a)}</td><td>${fmt(r.l, 0)}</td><td>${fmt(r.h, 2)}</td><td>${isFinite(r.T) ? fmt(r.T, 2) : '—'}</td><td>${fmt(r.dose, 1)}</td></tr>`).join('')}</tbody></table>`,
          notes: [
            'Tiempo permitido: T = H / 2^((L−90)/5) para OSHA y T = H / 2^((L−85)/3) para NIOSH, con L en dBA y H = duración del turno.',
            'La dosis del turno suma las fracciones C/T de cada segmento. Para comparar con el límite de 8 h se normaliza: D₈ = Dturno × H/8.',
            'El TWA se obtiene de D₈. Con H = 8 h coincide con el cálculo clásico; con turnos extendidos, la misma exposición produce un TWA mayor.',
            'El cálculo supone niveles equivalentes continuos y no evalúa ruido de impacto, contenido espectral ni eficacia real de la protección auditiva.',
            'La vigilancia de la salud, la señalización y los controles de ingeniería son obligaciones del empleador; este resultado es una estimación técnica.'
          ],
          method: '<p>Dturno = 100 · Σ(Ci/Ti), con Ti = H/2^((L−L₀)/exchange). D₈ = Dturno · H/8. OSHA: TWA = 90 + 16.61·log₁₀(D₈/100). NIOSH: TWA = 85 + 10·log₁₀(D₈/100).</p>'
        };
        T._csv = rows.map(r => ({ actividad: r.a, nivel_dba: r.l, horas: r.h, tiempo_permitido_h: isFinite(r.T) ? +r.T.toFixed(3) : '', dosis_pct: +r.dose.toFixed(2) })).concat([{ actividad: 'TOTAL', nivel_dba: '', horas: shift, tiempo_permitido_h: isFinite(allowed) ? +allowed.toFixed(3) : '', dosis_pct: +dose.toFixed(2) }]);
      }

      root.addEventListener('input', e => { if (e.target.matches('[data-i]')) { read(); paint(); update(); } });
      root.addEventListener('change', e => { if (e.target.matches('[data-i]')) { read(); paint(); update(); } });
      root.addEventListener('click', e => {
        const del = e.target.closest('[data-del]');
        if (!del) return;
        read(); state.splice(+del.dataset.del, 1); GL.store.set('nd.rows', state); render(); update();
      });
      root.querySelector('#ndStd').addEventListener('change', () => { render(); update(); });
      GL.bindCalc(root, ['ndShift', 'ndWarn'], update);
      root.querySelector('#ndAdd').addEventListener('click', () => { read(); state.push({ a: 'Nuevo segmento', l: 85, h: 1 }); GL.store.set('nd.rows', state); render(); update(); });
      root.querySelector('#ndDemo').addEventListener('click', () => { state = demo(); GL.store.set('nd.rows', state); render(); update(); });
      root.querySelector('#ndClear').addEventListener('click', () => { state = []; GL.store.set('nd.rows', state); render(); update(); });

      render();
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_dosis_ruido.csv', this._csv); }
  };
  GL.tool(T24);

  /* ======================================================================
     25 · RUIDO AMBIENTAL — ECA PERÚ
     ====================================================================== */
  const T25 = {
    id: 'environmental-noise',
    suite: 'safety',
    storeKeys: ['sn.rows'],
    title: 'Ruido ambiental · comparación con ECA',
    desc: 'Compare niveles de presión sonora diurnos y nocturnos con los estándares de calidad ambiental de ruido por zona (D.S. 085-2003-PCM). Estime además la atenuación por distancia y barreras hasta el receptor.',
    tags: ['Ruido ambiental', 'ECA', 'Decibelios', 'Zonificación'],
    keywords: 'ruido ambiental eca 085-2003-pcm zonificacion residencial comercial industrial diurno nocturno atenuacion distancia barrera',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Puntos de medición</h2><p>Nivel equivalente (Leq) diurno y nocturno en cada punto.</p></div><span class="mono" id="snCount">0</span></div>
            <div class="grid-3">
              ${U.select('snZone', 'Zona de aplicación', D.ecaRuido.zones.map(z => ({ id: z.id, label: z.label })), 'residencial')}
              ${U.field('snDayHours', 'Horario diurno', '—', '07:00–22:00', { ro: true })}
              ${U.field('snNightHours', 'Horario nocturno', '—', '22:00–07:00', { ro: true })}
            </div>
            <div class="table-wrap" style="max-height:280px;margin-top:12px"><table><thead><tr><th>#</th><th>Punto</th><th class="num">Leq diurno</th><th class="num">Leq nocturno</th><th>Estado</th><th></th></tr></thead><tbody id="snBody"></tbody></table></div>
            <div class="btn-row"><button class="btn sm" id="snAdd" type="button">+ Punto</button><button class="btn sm" id="snDemo" type="button">Datos demo</button><button class="btn sm" id="snClear" type="button">Vaciar</button></div>
          </section>
          <section class="panel">
            <div class="panel-title">Estimación en el receptor</div>
            <div class="grid-3">
              ${U.field('snSource', 'Nivel en la fuente', 'dBA', '95')}
              ${U.field('snR1', 'Distancia de referencia', 'm', '1')}
              ${U.field('snR2', 'Distancia al receptor', 'm', '30')}
              ${U.field('snBarrier', 'Pérdida por barrera', 'dB', '10')}
              ${U.field('snExtra', 'Atenuación adicional (aire, suelo)', 'dB', '3')}
              ${U.field('snPoints', 'N° de fuentes similares', 'n', '1', { q: 'Suma energética de fuentes incoherentes: L_total = L + 10·log₁₀(n).' })}
            </div>
            <div class="note" style="margin-top:10px">Atenuación geométrica de fuente puntual: 20·log₁₀(r₂/r₁). No incluye reflexiones, difracción ni condiciones meteorológicas. Es una estimación de cribado.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado <span class="tag" id="snZoneTag">RESIDENCIAL</span></div>
            <div class="metrics">
              ${U.metric('snDayMax', 'Máximo diurno', 'dBA', true)}
              ${U.metric('snNightMax', 'Máximo nocturno', 'dBA')}
              ${U.metric('snDayLimit', 'ECA diurno', 'dBA')}
              ${U.metric('snNightLimit', 'ECA nocturno', 'dBA')}
              ${U.metric('snDayExc', 'Exceso diurno', 'dB')}
              ${U.metric('snNightExc', 'Exceso nocturno', 'dB')}
              ${U.metric('snRecv', 'Nivel estimado en receptor', 'dBA')}
              ${U.metric('snPointsTag', 'Puntos medidos', 'n')}
            </div>
            <div class="chart-wrap" style="margin-top:16px"><canvas id="snDayChart"></canvas></div>
            <div class="chart-legend"><span><i style="background:#5277A8"></i>Leq diurno</span><span><i style="background:#A57B1F"></i>ECA diurno</span></div>
            <div class="chart-wrap" style="margin-top:10px"><canvas id="snNightChart"></canvas></div>
            <div class="chart-legend"><span><i style="background:#77679A"></i>Leq nocturno</span><span><i style="background:#A57B1F"></i>ECA nocturno</span></div>
            <div id="snVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Recomendaciones</div>
            <div id="snRecs"></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T25;
      const demo = () => ([
        { p: 'Frente al lote', d: 62, n: 52 },
        { p: 'Patio interno', d: 58, n: 48 },
        { p: 'Colindancia posterior', d: 65, n: 55 }
      ]);
      let state = GL.store.get('sn.rows', null);
      if (!Array.isArray(state) || !state.length) state = demo();
      const body = root.querySelector('#snBody');

      function zone() {
        const z = root.querySelector('#snZone').value;
        return D.ecaRuido.zones.find(x => x.id === z) || D.ecaRuido.zones[1];
      }
      function rowHTML(r, i) {
        const z = zone();
        const okDay = r.d <= z.day, okNight = r.n <= z.night;
        const cls = (!okDay || !okNight) ? 'tag-bad' : 'tag-ok';
        const txt = !okDay && !okNight ? 'Excede día y noche' : !okDay ? 'Excede de día' : !okNight ? 'Excede de noche' : 'Dentro del ECA';
        return `<tr>
          <td class="name">${i + 1}</td>
          <td><input class="tbl-input" style="width:180px;text-align:left" data-i="${i}" data-k="p" value="${esc(r.p)}"></td>
          <td><input class="tbl-input" data-i="${i}" data-k="d" value="${r.d}"></td>
          <td><input class="tbl-input" data-i="${i}" data-k="n" value="${r.n}"></td>
          <td data-st="${i}"><span class="tag ${cls}">${txt}</span></td>
          <td><button class="btn sm" data-del="${i}" type="button" title="Eliminar">✕</button></td>
        </tr>`;
      }
      function render() {
        body.innerHTML = state.map(rowHTML).join('');
        root.querySelector('#snCount').textContent = state.length + ' puntos';
      }
      function read() {
        state = state.map(r => Object.assign({}, r));
        body.querySelectorAll('[data-i]').forEach(el => {
          const i = +el.dataset.i, k = el.dataset.k;
          if (!state[i]) return;
          state[i][k] = k === 'p' ? el.value : num(el, 0);
        });
        GL.store.set('sn.rows', state);
      }
      function paint() {
        const z = zone();
        state.forEach((r, i) => {
          const okDay = r.d <= z.day, okNight = r.n <= z.night;
          const cls = (!okDay || !okNight) ? 'tag-bad' : 'tag-ok';
          const txt = !okDay && !okNight ? 'Excede día y noche' : !okDay ? 'Excede de día' : !okNight ? 'Excede de noche' : 'Dentro del ECA';
          const c = body.querySelector(`[data-st="${i}"]`);
          if (c) c.innerHTML = `<span class="tag ${cls}">${txt}</span>`;
        });
      }

      function update() {
        const z = zone();
        const dayMax = state.length ? Math.max.apply(null, state.map(r => r.d)) : 0;
        const nightMax = state.length ? Math.max.apply(null, state.map(r => r.n)) : 0;
        const dayExc = Math.max(0, dayMax - z.day);
        const nightExc = Math.max(0, nightMax - z.night);

        const src = Math.max(0, num('snSource', 95));
        const r1 = Math.max(0.1, num('snR1', 1));
        const r2 = Math.max(0.1, num('snR2', 30));
        const barrier = Math.max(0, num('snBarrier', 10));
        const extra = Math.max(0, num('snExtra', 3));
        const np = Math.max(1, Math.round(num('snPoints', 1)));
        const geom = 20 * Math.log10(Math.max(r1, r2) / Math.min(r1, r2));
        const recv = src - geom - barrier - extra + 10 * Math.log10(np);

        GL.out('snDayMax', fmt(dayMax, 0));
        GL.out('snNightMax', fmt(nightMax, 0));
        GL.out('snDayLimit', fmt(z.day, 0));
        GL.out('snNightLimit', fmt(z.night, 0));
        GL.out('snDayExc', fmt(dayExc, 0));
        GL.out('snNightExc', fmt(nightExc, 0));
        GL.out('snRecv', fmt(recv, 0));
        GL.out('snPointsTag', fmt(state.length, 0));
        root.querySelector('#snZoneTag').textContent = z.label.replace('Zona de ', '').replace('Zona ', '').toUpperCase();

        const labels = state.map((r, i) => r.p.length > 9 ? r.p.slice(0, 8) + '…' : r.p);
        GL.chart(root.querySelector('#snDayChart'), {
          type: 'bar',
          series: [{ name: 'Diurno', data: state.map((r, i) => [labels[i], r.d]), color: '#5277A8' }],
          y: { label: 'Leq diurno (dBA)', zero: false, min: Math.max(0, Math.min.apply(null, [z.day].concat(state.map(r => r.d))) - 8) },
          rules: [{ y: z.day, label: 'ECA ' + fmt(z.day, 0) + ' dBA', color: '#A57B1F' }]
        });
        GL.chart(root.querySelector('#snNightChart'), {
          type: 'bar',
          series: [{ name: 'Nocturno', data: state.map((r, i) => [labels[i], r.n]), color: '#77679A' }],
          y: { label: 'Leq nocturno (dBA)', zero: false, min: Math.max(0, Math.min.apply(null, [z.night].concat(state.map(r => r.n))) - 8) },
          rules: [{ y: z.night, label: 'ECA ' + fmt(z.night, 0) + ' dBA', color: '#A57B1F' }]
        });

        const bad = dayExc > 0 || nightExc > 0;
        const near = !bad && (dayMax >= z.day - 3 || nightMax >= z.night - 3);
        GL.setVerdict('snVerdict', bad ? 'bad' : near ? 'warn' : 'ok',
          bad ? 'Se supera el ECA de ruido' : near ? 'Niveles cercanos al ECA' : 'Niveles dentro del ECA',
          `Zona ${z.label.toLowerCase()}: ECA ${fmt(z.day, 0)} dBA diurno y ${fmt(z.night, 0)} dBA nocturno. Máximos medidos ${fmt(dayMax, 0)} dBA (día) y ${fmt(nightMax, 0)} dBA (noche). ${bad ? 'Exceso de ' + fmt(dayExc, 0) + ' dB de día y ' + fmt(nightExc, 0) + ' dB de noche en el peor punto.' : 'Sin excedencias en los puntos evaluados.'} Nivel estimado en el receptor: ${fmt(recv, 0)} dBA (atenuación geométrica ${fmt(geom, 1)} dB, barrera ${fmt(barrier, 0)} dB, adicional ${fmt(extra, 0)} dB).`);

        const recs = [];
        if (dayExc > 0) recs.push('Reduzca la emisión en la fuente: mantenimiento, silenciadores, cerramientos y cambio de equipos.');
        if (nightExc > 0) recs.push('Priorice el horario nocturno: restrinja operaciones ruidosas, use barreras acústicas y verifique la propagación a colindancias.');
        if (near) recs.push('Aplique margen preventivo: pequeños cambios de operación pueden cruzar el límite.');
        recs.push('La medición debe realizarse con sonómetro calibrado, a 1,5 m del límite y con el micrófono a 1,2–1,5 m del suelo, según el protocolo aplicable.');
        recs.push('Documente duración, condiciones meteorológicas, fuentes activas y ubicación de cada punto para que la comparación sea defendible.');
        recs.push('El ECA es un estándar de calidad ambiental; la exposición ocupacional se evalúa con criterios de higiene industrial.');
        root.querySelector('#snRecs').innerHTML = recs.map(r => `<div class="method-item"><i>→</i><div>${esc(r)}</div></div>`).join('');

        T._report = {
          title: 'Ruido ambiental y comparación con el ECA',
          subtitle: `${z.label} · ${state.length} puntos · máximos ${fmt(dayMax, 0)} / ${fmt(nightMax, 0)} dBA`,
          inputs: [
            ['Zona', z.label], ['Horario diurno', '07:00–22:00'], ['Horario nocturno', '22:00–07:00'],
            ['Nivel en la fuente', fmt(src, 0) + ' dBA'], ['Distancias', fmt(r1, 1) + ' → ' + fmt(r2, 1) + ' m'],
            ['Pérdida por barrera', fmt(barrier, 0) + ' dB'], ['Atenuación adicional', fmt(extra, 0) + ' dB'], ['N° de fuentes', fmt(np, 0)]
          ],
          results: [
            ['Máximo diurno', fmt(dayMax, 0), 'dBA'], ['ECA diurno', fmt(z.day, 0), 'dBA'],
            ['Máximo nocturno', fmt(nightMax, 0), 'dBA'], ['ECA nocturno', fmt(z.night, 0), 'dBA'],
            ['Exceso diurno', fmt(dayExc, 0), 'dB'], ['Exceso nocturno', fmt(nightExc, 0), 'dB'],
            ['Nivel estimado en receptor', fmt(recv, 0), 'dBA']
          ],
          extra: `<table><thead><tr><th>Punto</th><th>Leq día</th><th>Leq noche</th><th>ECA día</th><th>ECA noche</th><th>Estado</th></tr></thead><tbody>${state.map(r => {
            const okDay = r.d <= z.day, okNight = r.n <= z.night;
            return `<tr><td>${esc(r.p)}</td><td>${fmt(r.d, 0)}</td><td>${fmt(r.n, 0)}</td><td>${fmt(z.day, 0)}</td><td>${fmt(z.night, 0)}</td><td>${!okDay || !okNight ? 'Excede' : 'Dentro'}</td></tr>`;
          }).join('')}</tbody></table>`,
          notes: [
            'Los valores ECA por zona provienen del D.S. 085-2003-PCM y se incluyen como referencia editable; verifique la vigencia y la zonificación municipal aplicable.',
            'La comparación requiere niveles equivalentes (Leq) medidos con instrumentación calibrada y tiempos de medición representativos del período diurno y nocturno.',
            'La atenuación estimada usa divergencia geométrica de fuente puntual; no modela reflexiones, difracción, efecto del viento ni temperatura.',
            'El ruido ambiental y el ruido ocupacional tienen criterios distintos; no use este resultado como evaluación de higiene industrial.'
          ],
          method: '<p>Se compara el Leq máximo de cada período con el ECA de la zona. Atenuación: L₂ = L₁ − 20·log₁₀(r₂/r₁) − pérdida de barrera − atenuación adicional + 10·log₁₀(n).</p>'
        };
        T._csv = state.map(r => ({
          punto: r.p, leq_diurno_dba: r.d, leq_nocturno_dba: r.n,
          eca_diurno_dba: z.day, eca_nocturno_dba: z.night,
          excede_dia: r.d > z.day, excede_noche: r.n > z.night
        }));
      }

      root.addEventListener('input', e => { if (e.target.matches('[data-i]')) { read(); paint(); update(); } });
      root.addEventListener('change', e => { if (e.target.matches('[data-i]')) { read(); paint(); update(); } });
      root.addEventListener('click', e => {
        const del = e.target.closest('[data-del]');
        if (!del) return;
        read(); state.splice(+del.dataset.del, 1); GL.store.set('sn.rows', state); render(); update();
      });
      root.querySelector('#snZone').addEventListener('change', () => { render(); update(); });
      root.querySelector('#snAdd').addEventListener('click', () => { read(); state.push({ p: 'Nuevo punto', d: 50, n: 40 }); GL.store.set('sn.rows', state); render(); update(); });
      root.querySelector('#snDemo').addEventListener('click', () => { state = demo(); GL.store.set('sn.rows', state); render(); update(); });
      root.querySelector('#snClear').addEventListener('click', () => { state = []; GL.store.set('sn.rows', state); render(); update(); });

      render();
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_ruido_ambiental_ECA.csv', this._csv); }
  };
  GL.tool(T25);

  /* ======================================================================
     26 · MULTAS SUNAFIL — ESTIMACIÓN REFERENCIAL
     ====================================================================== */
  const T26 = {
    id: 'sunafil-fines',
    suite: 'safety',
    title: 'Multas SUNAFIL · estimación referencial',
    desc: 'Estime la multa por infracción de seguridad y salud en el trabajo con la tabla oficial del art. 48.1 del D.S. 008-2020-TR: escala microempresa, pequeña empresa o no MYPE, trabajadores afectados, gravedad y UIT vigente.',
    tags: ['SUNAFIL', 'Multas', 'UIT', 'Fiscalización'],
    keywords: 'sunafil multa sst infraccion leve grave muy grave uit trabajadores afectados fiscalizacion ley 28806 d.s. 008-2020-tr remype',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Datos de la infracción</h2><p>La tabla oficial se aplica por infracción y por número de trabajadores afectados.</p></div></div>
            <div class="grid-3">
              ${U.select('sfScale', 'Tamaño de empresa', [
                { id: 'micro', label: 'Microempresa (REMYPE)' },
                { id: 'small', label: 'Pequeña empresa (REMYPE)' },
                { id: 'noMype', label: 'No MYPE' }
              ], 'noMype')}
              ${U.field('sfWorkers', 'Trabajadores afectados', 'personas', '12')}
              ${U.select('sfSeverity', 'Gravedad', [
                { id: 'leve', label: 'Leve' },
                { id: 'grave', label: 'Grave' },
                { id: 'muy-grave', label: 'Muy grave' }
              ], 'grave')}
              ${U.field('sfCount', 'Número de infracciones', 'n', '1')}
              ${U.field('sfUit', 'UIT vigente', 'S/', '5500')}
              ${U.field('sfIncome', 'Ingresos netos anuales (MYPE)', 'S/', '0', { q: 'Opcional. Para micro y pequeña empresa, el total no puede superar el 1 % de los ingresos netos del ejercicio anterior al de la orden de inspección.' })}
              ${U.field('sfProb', 'Probabilidad de sanción', '%', '100', { q: 'Factor de escenario. 100 % = multa completa; úselo solo para análisis de riesgo, no como descuento legal.' })}
              ${U.field('sfNote', 'Referencia / expediente', '—', '')}
            </div>
            <div class="note" style="margin-top:10px">Use la UIT que corresponda según la norma vigente. Las tablas de micro y pequeña empresa ya incluyen la reducción del 50 % del art. 48.1-A: no vuelva a aplicarla. La estimación es referencial y no sustituye la tipificación ni la graduación de la autoridad.</div>
          </section>
          <section class="panel">
            <div class="panel-title">Tabla oficial (UIT por infracción)</div>
            <div class="table-wrap" style="max-height:360px"><table><thead><tr><th>Trabajadores</th><th class="num">Leve</th><th class="num">Grave</th><th class="num">Muy grave</th></tr></thead><tbody id="sfTable"></tbody></table></div>
            <div class="note" id="sfScaleNote" style="margin-top:8px"></div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Estimación <span class="tag" id="sfTag">GRAVE</span></div>
            <div class="metrics">
              ${U.metric('sfUnitUit', 'UIT por infracción', 'UIT', true)}
              ${U.metric('sfBaseUit', 'Subtotal antes de topes', 'UIT')}
              ${U.metric('sfBaseS', 'Subtotal antes de topes', 'S/')}
              ${U.metric('sfCapUit', 'Tope aplicable', 'UIT')}
              ${U.metric('sfFinalUit', 'Multa final', 'UIT')}
              ${U.metric('sfFinalS', 'Multa final', 'S/')}
              ${U.metric('sfTier', 'Tramo de trabajadores', '')}
              ${U.metric('sfExp', 'Valor esperado del escenario', 'S/')}
            </div>
            <div class="chart-wrap" style="margin-top:16px"><canvas id="sfChart"></canvas></div>
            <div class="chart-legend"><span><i style="background:#B06060"></i>Subtotal y multa final (S/)</span></div>
            <div id="sfVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Lectura y límites</div>
            <div id="sfRecs"></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T26;
      function update() {
        const result = GL.safetyMath.sunafilFine({
          scaleId: root.querySelector('#sfScale').value,
          workers: num('sfWorkers', 12),
          severity: root.querySelector('#sfSeverity').value,
          count: num('sfCount', 1),
          uit: num('sfUit', 5500),
          income: num('sfIncome', 0),
          probability: num('sfProb', 100)
        }, D.safetyFines);
        const {
          scale, band, bandWarn, workers: n, severity: sev, count, uit, probability: prob, income,
          unit, baseUit, baseS, effectiveCapUit, finalUit, finalS, exp, capLabel, capped
        } = result;

        GL.out('sfUnitUit', fmt(unit, 2));
        GL.out('sfBaseUit', fmt(baseUit, 2));
        GL.out('sfBaseS', fmt(baseS, 0));
        GL.out('sfCapUit', fmt(effectiveCapUit, 2));
        GL.out('sfFinalUit', fmt(finalUit, 2));
        GL.out('sfFinalS', fmt(finalS, 0));
        GL.out('sfTier', band.label + ' trabajadores');
        GL.out('sfExp', fmt(exp, 0));
        root.querySelector('#sfTag').textContent = sev === 'muy-grave' ? 'MUY GRAVE' : sev === 'leve' ? 'LEVE' : 'GRAVE';
        root.querySelector('#sfScaleNote').textContent = scale.note;

        root.querySelector('#sfTable').innerHTML = scale.bands.map(b => {
          const hl = b === band ? ' style="background:var(--panel-3)"' : '';
          return `<tr${hl}><td class="name">${b.label}</td><td class="num">${fmt(b.values[0], 2)}</td><td class="num">${fmt(b.values[1], 2)}</td><td class="num">${fmt(b.values[2], 2)}</td></tr>`;
        }).join('');

        GL.chart(root.querySelector('#sfChart'), {
          type: 'bar',
          series: [{ name: 'Multa', data: [['Subtotal', baseS], ['Multa final', finalS]], color: '#B06060' }],
          y: { label: 'Multa estimada (S/)', zero: true, min: 0 }
        });

        const tone = sev === 'muy-grave' ? 'bad' : sev === 'grave' ? 'warn' : 'info';
        GL.setVerdict('sfVerdict', tone,
          `${fmt(finalUit, 2)} UIT · ${fmt(finalS, 0)} S/`,
          `${scale.label}: ${fmt(n, 0)} trabajadores afectados (tramo ${band.label}), infracción ${sev === 'muy-grave' ? 'muy grave' : sev}${count > 1 ? ' × ' + fmt(count, 0) + ' infracciones' : ''}. Valor unitario ${fmt(unit, 2)} UIT; subtotal ${fmt(baseUit, 2)} UIT (${fmt(baseS, 0)} S/). ${capped ? 'Se aplicó el tope de ' + capLabel + '; ' : ''}UIT ${fmt(uit, 0)} S/. Valor esperado del escenario (${fmt(prob * 100, 0)} %) ${fmt(exp, 0)} S/.${bandWarn}`);

        const recs = [
          'Esta estimación es referencial y no constituye asesoría legal. Verifique la tipificación en el Reglamento de la Ley 28806 (D.S. 019-2006-TR, modificado por D.S. 008-2020-TR).',
          'La tabla de micro y pequeña empresa ya incorpora la reducción del 50 % del art. 48.1-A. Para acceder a ella debe acreditarse inscripción vigente en REMYPE.',
          'Los topes del art. 39 de la Ley 28806 son 50 UIT (leve), 100 UIT (grave), 200 UIT (muy grave) y 300 UIT por procedimiento. En MYPE, el total no puede exceder el 1 % de los ingresos netos del ejercicio anterior.',
          'La autoridad puede considerar reincidencia, número de trabajadores, gravedad del daño, intencionalidad y medidas correctivas.',
          'Una multa no reemplaza la obligación de corregir el riesgo ni la responsabilidad civil o penal que corresponda.'
        ];
        root.querySelector('#sfRecs').innerHTML = recs.map(r => `<div class="method-item"><i>→</i><div>${esc(r)}</div></div>`).join('');

        T._report = {
          title: 'Estimación referencial de multa SUNAFIL',
          subtitle: `${scale.label} · ${band.label} trabajadores · infracción ${sev} · UIT ${fmt(uit, 0)} S/`,
          inputs: [
            ['Tamaño de empresa', scale.label], ['Trabajadores afectados', fmt(n, 0)], ['Gravedad', sev === 'muy-grave' ? 'Muy grave' : sev],
            ['Número de infracciones', fmt(count, 0)], ['UIT vigente', fmt(uit, 0) + ' S/'],
            ['Ingresos netos anuales', income > 0 ? fmt(income, 0) + ' S/' : 'No declarados'],
            ['Probabilidad de sanción', fmt(prob * 100, 0) + ' %'], ['Referencia', root.querySelector('#sfNote').value || '—']
          ],
          results: [
            ['UIT por infracción', fmt(unit, 2), 'UIT'], ['Subtotal antes de topes', fmt(baseUit, 2), 'UIT'],
            ['Subtotal antes de topes', fmt(baseS, 0), 'S/'], ['Tope aplicable', capLabel, ''],
            ['Multa final', fmt(finalUit, 2), 'UIT'], ['Multa final', fmt(finalS, 0), 'S/'],
            ['Valor esperado del escenario', fmt(exp, 0), 'S/'], ['Tramo', band.label, 'trabajadores']
          ],
          notes: [
            'Tabla del art. 48.1 del Reglamento de la Ley 28806 (D.S. 019-2006-TR, modificado por D.S. 008-2020-TR), con valores fijos por tramo y escala de empresa.',
            'Las tablas de micro y pequeña empresa ya incluyen la reducción del 50 % del art. 48.1-A. No se aplica una segunda reducción.',
            'Se aplican los topes del art. 39 de la Ley 28806: 50/100/200 UIT por gravedad y 300 UIT por procedimiento. Para MYPE se aplica además el tope del 1 % de los ingresos netos cuando se declaran.',
            'La estimación no incluye multas por otras normas (laboral general, seguridad social, medio ambiente) ni responsabilidades civiles o penales.',
            'Este resultado no es un dictamen legal ni una cotización de defensa. Consulte a un abogado especializado antes de tomar decisiones.'
          ],
          method: '<p>Se elige la escala oficial según el tamaño de empresa, se ubica el tramo por trabajadores afectados y se toma el valor fijo en UIT para la gravedad. Subtotal = valor unitario × número de infracciones. Multa final = mínimo entre subtotal, tope por gravedad (50/100/200 UIT), tope por procedimiento (300 UIT) y, en MYPE con ingresos declarados, 1 % de los ingresos netos. Valor esperado = multa final × probabilidad de sanción declarada.</p>'
        };
        T._csv = [{
          empresa: scale.id, trabajadores_afectados: n, gravedad: sev, infracciones: count, uit: uit,
          tramo: band.label, uit_por_infraccion: +unit.toFixed(2), subtotal_uit: +baseUit.toFixed(2),
          tope: capLabel, multa_final_uit: +finalUit.toFixed(2), multa_final_soles: +finalS.toFixed(0),
          ingresos_netos: income || null, probabilidad_pct: +(prob * 100).toFixed(0),
          valor_esperado_soles: +exp.toFixed(0)
        }];
      }
      root.querySelector('#sfScale').addEventListener('change', update);
      root.querySelector('#sfSeverity').addEventListener('change', update);
      GL.bindCalc(root, ['sfWorkers', 'sfCount', 'sfUit', 'sfIncome', 'sfProb', 'sfNote'], update);
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_multas_SUNAFIL_referencial.csv', this._csv); }
  };
  GL.tool(T26);
})();
