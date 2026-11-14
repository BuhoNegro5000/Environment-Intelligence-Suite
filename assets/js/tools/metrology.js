/* ==========================================================================
   Yupana · Suite Metrología & Cumplimiento
   27 Incertidumbre GUM / EA-4/02 y regla de decisión
   28 Validez de muestras y tiempos de conservación
   29 Volumen de contención secundaria
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL, D = GL.data, num = GL.num, fmt = GL.fmt, esc = GL.escape, U = GL.ui;

  function dtLocal(date) {
    const p = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
  }

  /* ======================================================================
     27 · INCERTIDUMBRE DE MEDICIÓN — GUM / EA-4/02
     ====================================================================== */
  const T27 = {
    id: 'measurement-uncertainty',
    suite: 'metrology',
    storeKeys: ['un.rows'],
    title: 'Incertidumbre de medición y regla de decisión',
    desc: 'Construya un presupuesto de incertidumbre por componentes, calcule la incertidumbre estándar combinada y expandida (GUM / EA-4/02), y aplique una regla de decisión con banda de guarda frente a un límite.',
    tags: ['GUM', 'EA-4/02', 'Incertidumbre', 'Conformidad'],
    keywords: 'incertidumbre gum ea-4/02 presupuesto combinada expandida banda guarda conformidad decision calibracion metrologia',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Presupuesto de incertidumbre</h2><p>Contribuciones en las unidades del mensurando. El coeficiente de sensibilidad convierte cada aporte a esa unidad.</p></div><span class="mono" id="unCount">0</span></div>
            <div class="grid-3">
              ${U.field('unValue', 'Valor medido', '—', '10.00')}
              ${U.field('unUnit', 'Unidad', '—', 'mg/L')}
              ${U.field('unK', 'Factor de cobertura k', '—', '2', { q: 'k = 2 aproxima 95 % de confianza para una distribución normal. Para grados de libertad efectivos bajos use t de Student.' })}
            </div>
            <div class="table-wrap" style="max-height:320px;margin-top:12px"><table><thead><tr><th>#</th><th>Componente</th><th class="num">Valor</th><th>Distribución</th><th class="num">Divisor</th><th class="num">c</th><th class="num">uᵢ</th><th class="num">gl (ν)</th><th></th></tr></thead><tbody id="unBody"></tbody></table></div>
            <div class="btn-row"><button class="btn sm" id="unAdd" type="button">+ Componente</button><button class="btn sm" id="unDemo" type="button">Datos demo</button><button class="btn sm" id="unClear" type="button">Vaciar</button></div>
          </section>
          <section class="panel">
            <div class="panel-title">Límite y regla de decisión</div>
            <div class="grid-3">
              ${U.select('unLimitType', 'Tipo de límite', [
                { id: 'upper', label: 'Límite superior' },
                { id: 'lower', label: 'Límite inferior' },
                { id: 'two', label: 'Dos límites (intervalo)' }
              ], 'upper')}
              ${U.field('unL1', 'Límite inferior / superior', '—', '10.50')}
              ${U.field('unL2', 'Límite superior (solo dos límites)', '—', '', { q: 'Deje vacío si usa un solo límite.' })}
              ${U.select('unRule', 'Regla de decisión', [
                { id: 'simple', label: 'Aceptación simple · w = 0' },
                { id: 'guardU', label: 'Banda de guarda · w = U' },
                { id: 'guardHalf', label: 'Banda de guarda · w = U/2' }
              ], 'guardU')}
            </div>
            <div class="note" style="margin-top:10px">Con banda de guarda se declara conformidad solo si el intervalo de incertidumbre no cruza el límite. Si lo cruza, el resultado es indeterminado y requiere otra medición o un acuerdo de riesgo compartido.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado</div>
            <div class="metrics">
              ${U.metric('unUc', 'Incertidumbre estándar combinada', 'u_c', true)}
              ${U.metric('unU', 'Incertidumbre expandida', 'U')}
              ${U.metric('unRel', 'Incertidumbre relativa', '%')}
              ${U.metric('unLow', 'Intervalo inferior', '')}
              ${U.metric('unHigh', 'Intervalo superior', '')}
              ${U.metric('unGuard', 'Banda de guarda', 'w')}
              ${U.metric('unVerdictM', 'Resultado de conformidad', '')}
              ${U.metric('unDofEff', 'Grados de libertad efectivos', 'ν_eff')}
              ${U.metric('unKUsed', 'Factor de cobertura aplicado', 'k / t')}
              ${U.metric('unDof', 'Componentes', 'n')}
            </div>
            <div id="unGauge" style="margin-top:14px"></div>
            <div id="unVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Contribuciones <span class="tag">uᵢ² / u_c²</span></div>
            <div id="unComp"></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T27;
      const demo = () => ([
        { n: 'Repetibilidad (desviación estándar)', v: 0.15, dist: 'normal', c: 1, dof: 9 },
        { n: 'Certificado del patrón (U, k = 2)', v: 0.20, dist: 'k2', c: 1, dof: '' },
        { n: 'Resolución del instrumento', v: 0.05, dist: 'rect', c: 1, dof: '' },
        { n: 'Deriva entre calibraciones', v: 0.10, dist: 'rect', c: 1, dof: '' }
      ]);
      let state = GL.store.get('un.rows', null);
      if (!Array.isArray(state) || !state.length) state = demo();
      const body = root.querySelector('#unBody');
      const DISTS = [
        { id: 'normal', label: 'Normal (u estándar)' },
        { id: 'k2', label: 'Normal U, k = 2' },
        { id: 'k3', label: 'Normal U, k = 3' },
        { id: 'rect', label: 'Rectangular' },
        { id: 'tri', label: 'Triangular' }
      ];
      function divisorOf(d) {
        return d === 'k2' ? 2 : d === 'k3' ? 3 : d === 'rect' ? Math.sqrt(3) : d === 'tri' ? Math.sqrt(6) : 1;
      }
      function distSelect(i, v) {
        return `<select class="tbl-select" data-i="${i}" data-k="dist">${DISTS.map(d => `<option value="${d.id}" ${d.id === v ? 'selected' : ''}>${d.label}</option>`).join('')}</select>`;
      }
      function rowHTML(r, i) {
        const div = divisorOf(r.dist), ui = Math.abs(r.v / div * r.c);
        return `<tr>
          <td class="name">${i + 1}</td>
          <td><input class="tbl-input" style="width:190px;text-align:left" data-i="${i}" data-k="n" value="${esc(r.n)}"></td>
          <td><input class="tbl-input" data-i="${i}" data-k="v" value="${r.v}"></td>
          <td>${distSelect(i, r.dist)}</td>
          <td class="num" data-div="${i}">${fmt(div, 3)}</td>
          <td><input class="tbl-input" data-i="${i}" data-k="c" value="${r.c}" style="width:60px"></td>
          <td class="num" data-ui="${i}">${fmt(ui, 4)}</td>
          <td><input class="tbl-input" data-i="${i}" data-k="dof" value="${r.dof == null ? '' : esc(r.dof)}" placeholder="∞" style="width:58px"></td>
          <td><button class="btn sm" data-del="${i}" type="button" title="Eliminar">✕</button></td>
        </tr>`;
      }
      function render() {
        body.innerHTML = state.map(rowHTML).join('');
        root.querySelector('#unCount').textContent = state.length + ' componentes';
      }
      function read() {
        state = state.map(r => Object.assign({}, r));
        body.querySelectorAll('[data-i]').forEach(el => {
          const i = +el.dataset.i, k = el.dataset.k;
          if (!state[i]) return;
          state[i][k] = (k === 'n' || k === 'dist' || k === 'dof') ? el.value : num(el, 0);
        });
        GL.store.set('un.rows', state);
      }
      function paint() {
        state.forEach((r, i) => {
          const div = divisorOf(r.dist), ui = Math.abs(r.v / div * r.c);
          const dc = body.querySelector(`[data-div="${i}"]`);
          const uc = body.querySelector(`[data-ui="${i}"]`);
          if (dc) dc.textContent = fmt(div, 3);
          if (uc) uc.textContent = fmt(ui, 4);
        });
      }

      function gaugeHTML(x, Uv, w, type, L1, L2) {
        const pts = [x - Uv, x + Uv];
        if (type === 'two') { pts.push(L1, L2); } else pts.push(L1);
        let lo = Math.min.apply(null, pts), hi = Math.max.apply(null, pts);
        if (!isFinite(lo) || !isFinite(hi) || lo === hi) { lo -= 1; hi += 1; }
        const pad = (hi - lo) * 0.14;
        lo -= pad; hi += pad;
        const pos = v => GL.clamp((v - lo) / (hi - lo) * 100, 0, 100);
        let bands = '';
        if (type === 'upper') {
          bands += `<div class="gauge-band" style="left:0%;width:${pos(L1)}%"></div>`;
          bands += `<div class="gauge-band bad" style="left:${pos(L1)}%;width:${100 - pos(L1)}%"></div>`;
          bands += `<div class="gauge-band amb" style="left:${pos(L1 - w)}%;width:${pos(L1) - pos(L1 - w)}%"></div>`;
        } else if (type === 'lower') {
          bands += `<div class="gauge-band bad" style="left:0%;width:${pos(L1)}%"></div>`;
          bands += `<div class="gauge-band" style="left:${pos(L1)}%;width:${100 - pos(L1)}%"></div>`;
          bands += `<div class="gauge-band amb" style="left:${pos(L1)}%;width:${pos(L1 + w) - pos(L1)}%"></div>`;
        } else {
          bands += `<div class="gauge-band bad" style="left:0%;width:${pos(L1)}%"></div>`;
          bands += `<div class="gauge-band" style="left:${pos(L1)}%;width:${pos(L2) - pos(L1)}%"></div>`;
          bands += `<div class="gauge-band bad" style="left:${pos(L2)}%;width:${100 - pos(L2)}%"></div>`;
          bands += `<div class="gauge-band amb" style="left:${pos(L1)}%;width:${pos(L1 + w) - pos(L1)}%"></div>`;
          bands += `<div class="gauge-band amb" style="left:${pos(L2 - w)}%;width:${pos(L2) - pos(L2 - w)}%"></div>`;
        }
        let marks = `<div class="gauge-mark meas" style="left:${pos(x)}%"></div>`;
        if (type === 'two') {
          marks += `<div class="gauge-mark lim" style="left:${pos(L1)}%"></div><div class="gauge-mark lim" style="left:${pos(L2)}%"></div>`;
          marks += `<div class="gauge-lab" style="left:${pos(L1)}%">${fmt(L1, 2)}</div><div class="gauge-lab" style="left:${pos(L2)}%">${fmt(L2, 2)}</div>`;
        } else {
          marks += `<div class="gauge-mark lim" style="left:${pos(L1)}%"></div><div class="gauge-lab" style="left:${pos(L1)}%">límite ${fmt(L1, 2)}</div>`;
        }
        marks += `<div class="gauge-lab" style="left:${pos(x)}%;top:28px">${fmt(x, 2)}</div>`;
        return `<div class="gauge">${bands}${marks}</div>
          <div class="gauge-foot"><span>${fmt(lo, 2)}</span><span>medido ${fmt(x, 2)} ± ${fmt(Uv, 2)}</span><span>${fmt(hi, 2)}</span></div>`;
      }

      function update() {
        const x = num('unValue', 10);
        const unit = root.querySelector('#unUnit').value || '';
        const k = Math.max(0.1, num('unK', 2));
        const type = root.querySelector('#unLimitType').value;
        const L1 = num('unL1', 10.5);
        const L2raw = root.querySelector('#unL2').value;
        const L2 = L2raw === '' ? NaN : num('unL2', 0);
        const rule = root.querySelector('#unRule').value;

        const comps = state.map(r => {
          const div = divisorOf(r.dist);
          const dof = Number(r.dof) > 0 ? Number(r.dof) : Infinity;
          return { n: r.n, v: r.v, dist: r.dist, c: r.c, div, dof, u: Math.abs(r.v / div * r.c) };
        });
        const uc = Math.sqrt(comps.reduce((s, c) => s + c.u * c.u, 0));
        // Welch–Satterthwaite: ν_eff = u_c^4 / Σ(u_i^4/ν_i); las type B sin gl aportan ν = ∞.
        const denomDof = comps.reduce((s, c) => s + (isFinite(c.dof) && c.u > 0 ? Math.pow(c.u, 4) / c.dof : 0), 0);
        const dofEff = denomDof > 0 && uc > 0 ? Math.pow(uc, 4) / denomDof : Infinity;
        const useStudent = isFinite(dofEff) && Math.abs(k - 2) < 1e-9;
        const kUsed = useStudent ? GL.stat.t95(Math.max(1, dofEff)) : k;
        const Uexp = kUsed * uc;
        const rel = x !== 0 ? Uexp / Math.abs(x) * 100 : 0;
        const w = rule === 'simple' ? 0 : rule === 'guardHalf' ? Uexp / 2 : Uexp;

        let verdict = 'indeterminado', vTone = 'warn', vTitle = 'Resultado indeterminado';
        if (type === 'upper') {
          if (x + w <= L1) { verdict = 'conforme'; vTone = 'ok'; vTitle = 'Conforme con el límite superior'; }
          else if (x - Uexp > L1) { verdict = 'no conforme'; vTone = 'bad'; vTitle = 'No conforme con el límite superior'; }
        } else if (type === 'lower') {
          if (x - w >= L1) { verdict = 'conforme'; vTone = 'ok'; vTitle = 'Conforme con el límite inferior'; }
          else if (x + Uexp < L1) { verdict = 'no conforme'; vTone = 'bad'; vTitle = 'No conforme con el límite inferior'; }
        } else {
          const hi = isFinite(L2) ? L2 : num('unL1', 10.5);
          if (x - w >= L1 && x + w <= hi) { verdict = 'conforme'; vTone = 'ok'; vTitle = 'Conforme dentro del intervalo'; }
          else if (x - Uexp < L1 || x + Uexp > hi) { verdict = 'no conforme'; vTone = 'bad'; vTitle = 'No conforme con el intervalo'; }
        }

        GL.out('unUc', fmt(uc, 4) + (unit ? ' ' + unit : ''));
        GL.out('unU', fmt(Uexp, 4) + (unit ? ' ' + unit : ''));
        GL.out('unRel', fmt(rel, 2) + ' %');
        GL.out('unLow', fmt(x - Uexp, 3) + (unit ? ' ' + unit : ''));
        GL.out('unHigh', fmt(x + Uexp, 3) + (unit ? ' ' + unit : ''));
        GL.out('unGuard', fmt(w, 4) + (unit ? ' ' + unit : ''));
        GL.out('unVerdictM', verdict.toUpperCase());
        GL.out('unDofEff', isFinite(dofEff) ? fmt(dofEff, 1) : '∞');
        GL.out('unKUsed', fmt(kUsed, 3) + (useStudent ? ' (t)' : ' (k)'));
        GL.out('unDof', fmt(comps.length, 0));

        const maxU = Math.max.apply(null, [0.000001].concat(comps.map(c => c.u)));
        root.querySelector('#unComp').innerHTML = comps.length ? comps.map(c => `
          <div style="display:flex;align-items:center;gap:10px;margin:7px 0">
            <span style="width:180px;font-size:10px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.n)}</span>
            <div class="progress" style="flex:1;height:10px"><i style="width:${uc ? (c.u * c.u) / (uc * uc) * 100 : 0}%"></i></div>
            <b class="mono" style="width:76px;text-align:right">${fmt(c.u, 4)}</b>
            <span class="mono" style="width:48px;text-align:right;font-size:9px;color:var(--faint)">${fmt(uc ? (c.u * c.u) / (uc * uc) * 100 : 0, 1)} %</span>
          </div>`).join('') : '<div class="note">Agregue componentes para construir el presupuesto.</div>';

        const hiLim = type === 'two' && isFinite(L2) ? L2 : L1;
        root.querySelector('#unGauge').innerHTML = gaugeHTML(x, Uexp, w, type, type === 'two' ? Math.min(L1, hiLim) : L1, Math.max(L1, hiLim));

        GL.setVerdict('unVerdict', vTone, vTitle,
          `Valor ${fmt(x, 3)} ± ${fmt(Uexp, 3)} ${unit} (${useStudent ? 't = ' + fmt(kUsed, 3) + ', ν_eff = ' + fmt(dofEff, 1) : 'k = ' + fmt(k, 2)}, u_c = ${fmt(uc, 4)} ${unit}). ${type === 'upper' ? 'Límite superior' : type === 'lower' ? 'Límite inferior' : 'Intervalo'} ${type === 'two' ? fmt(Math.min(L1, hiLim), 2) + ' – ' + fmt(Math.max(L1, hiLim), 2) : fmt(L1, 2)}. Regla ${rule === 'simple' ? 'de aceptación simple (w = 0)' : rule === 'guardHalf' ? 'de banda de guarda w = U/2' : 'de banda de guarda w = U'}. ${verdict === 'conforme' ? 'El intervalo de incertidumbre no cruza el límite en el sentido desfavorable.' : verdict === 'no conforme' ? 'El valor está fuera del límite incluso considerando la incertidumbre.' : 'El intervalo cruza el límite: no puede declararse conformidad ni no conformidad con esta evidencia.'}`);

        T._report = {
          title: 'Incertidumbre de medición y decisión de conformidad',
          subtitle: `${fmt(x, 3)} ± ${fmt(Uexp, 3)} ${unit} · ${useStudent ? 't = ' + fmt(kUsed, 2) + ' (ν_eff = ' + fmt(dofEff, 1) + ')' : 'k = ' + fmt(k, 2)} · ${verdict}`,
          inputs: [
            ['Valor medido', fmt(x, 3) + ' ' + unit], ['Factor de cobertura solicitado', fmt(k, 2)],
            ['Tipo de límite', type === 'upper' ? 'Superior' : type === 'lower' ? 'Inferior' : 'Dos límites'],
            ['Límite', type === 'two' ? fmt(Math.min(L1, hiLim), 2) + ' – ' + fmt(Math.max(L1, hiLim), 2) : fmt(L1, 2)],
            ['Regla de decisión', rule === 'simple' ? 'Aceptación simple' : rule === 'guardHalf' ? 'Guarda w = U/2' : 'Guarda w = U'],
            ['Banda de guarda', fmt(w, 3) + ' ' + unit]
          ],
          results: [
            ['Incertidumbre estándar combinada', fmt(uc, 4), unit], ['Incertidumbre expandida', fmt(Uexp, 4), unit],
            ['Factor de cobertura aplicado', fmt(kUsed, 3), useStudent ? 't de Student' : 'k declarado'],
            ['Grados de libertad efectivos', isFinite(dofEff) ? fmt(dofEff, 1) : '∞', 'ν_eff'],
            ['Incertidumbre relativa', fmt(rel, 2), '%'], ['Intervalo inferior', fmt(x - Uexp, 3), unit],
            ['Intervalo superior', fmt(x + Uexp, 3), unit], ['Resultado', verdict.toUpperCase(), '']
          ],
          extra: `<table><thead><tr><th>Componente</th><th>Valor</th><th>Distribución</th><th>Divisor</th><th>c</th><th>uᵢ</th><th>gl (ν)</th><th>% varianza</th></tr></thead><tbody>${comps.map(c => `<tr><td>${esc(c.n)}</td><td>${fmt(c.v, 3)}</td><td>${c.dist}</td><td>${fmt(c.div, 3)}</td><td>${fmt(c.c, 2)}</td><td>${fmt(c.u, 4)}</td><td>${isFinite(c.dof) ? fmt(c.dof, 0) : '∞'}</td><td>${fmt(uc ? c.u * c.u / (uc * uc) * 100 : 0, 1)} %</td></tr>`).join('')}</tbody></table>`,
          notes: [
            'Presupuesto conforme a GUM y EA-4/02: cada componente se convierte a incertidumbre estándar dividiendo por el divisor de su distribución y multiplicando por el coeficiente de sensibilidad.',
            'Las componentes se combinan en cuadratura suponiendo independencia. Si hay correlación, debe incluirse la covarianza.',
            'Los grados de libertad efectivos se calculan por Welch–Satterthwaite: ν_eff = u_c⁴ / Σ(uᵢ⁴/νᵢ). Las componentes tipo B sin grados de libertad declarados aportan ν = ∞.',
            'Cuando se solicita k = 2 y ν_eff es finito, se usa t de Student al 95 % en lugar de 2. Para ν_eff grande, t se aproxima a 1,96.',
            'La regla de decisión debe acordarse antes de medir. Declarar conformidad con banda de guarda reduce el riesgo de aceptar un valor fuera de límite.',
            'Este cálculo no reemplaza la calibración trazable ni la revisión de un metrólogo competente.'
          ],
          method: '<p>u_c = √(Σ uᵢ²), con uᵢ = (valor / divisor) · c. Divisor: 1 (u estándar), 2 o 3 (U con k), √3 (rectangular), √6 (triangular). ν_eff = u_c⁴ / Σ(uᵢ⁴/νᵢ). Si k = 2 y ν_eff es finito, U = t₀,₉₅,ν_eff · u_c; en otro caso U = k · u_c. Con banda de guarda w: conforme si el intervalo [x−w, x+w] queda dentro del límite; no conforme si [x−U, x+U] queda fuera; en otro caso, indeterminado.</p>'
        };
        T._csv = comps.map(c => ({
          componente: c.n, valor: c.v, distribucion: c.dist, divisor: +c.div.toFixed(4),
          grados_libertad: isFinite(c.dof) ? c.dof : null,
          sensibilidad: c.c, incertidumbre_estandar: +c.u.toFixed(5),
          porcentaje_varianza: +(uc ? c.u * c.u / (uc * uc) * 100 : 0).toFixed(2)
        })).concat([{ componente: 'COMBINADA', valor: '', distribucion: '', divisor: '', grados_libertad: isFinite(dofEff) ? +dofEff.toFixed(2) : null, sensibilidad: '', incertidumbre_estandar: +uc.toFixed(5), porcentaje_varianza: 100 }]);
      }

      root.addEventListener('input', e => { if (e.target.matches('[data-i]')) { read(); paint(); update(); } });
      root.addEventListener('change', e => { if (e.target.matches('[data-i]')) { read(); paint(); update(); } });
      root.addEventListener('click', e => {
        const del = e.target.closest('[data-del]');
        if (!del) return;
        read(); state.splice(+del.dataset.del, 1); GL.store.set('un.rows', state); render(); update();
      });
      ['#unLimitType', '#unRule'].forEach(sel => root.querySelector(sel).addEventListener('change', update));
      root.querySelector('#unAdd').addEventListener('click', () => { read(); state.push({ n: 'Nuevo componente', v: 0.1, dist: 'rect', c: 1, dof: '' }); GL.store.set('un.rows', state); render(); update(); });
      root.querySelector('#unDemo').addEventListener('click', () => { state = demo(); GL.store.set('un.rows', state); render(); update(); });
      root.querySelector('#unClear').addEventListener('click', () => { state = []; GL.store.set('un.rows', state); render(); update(); });

      render();
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_incertidumbre_GUM.csv', this._csv); }
  };
  GL.tool(T27);

  /* ======================================================================
     28 · VALIDEZ DE MUESTRAS — TIEMPO DE CONSERVACIÓN
     ====================================================================== */
  const T28 = {
    id: 'holding-time',
    suite: 'metrology',
    title: 'Validez de muestras · tiempo de conservación',
    desc: 'Verifique si una muestra llegó al laboratorio dentro del tiempo máximo de conservación. Consulte recipiente, preservación y tiempo límite por parámetro y registre el incumplimiento.',
    tags: ['Muestreo', 'Conservación', 'Cadena de custodia', 'Laboratorio'],
    keywords: 'muestra conservacion holding time cadena custodia laboratorio recipiente preservacion refrigeracion validez',
    html() {
      const now = new Date();
      const sample = new Date(now.getTime() - 6 * 3600 * 1000);
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Datos de la muestra</h2><p>Registre la hora de toma y la hora de recepción o análisis en el laboratorio.</p></div></div>
            <div class="grid-3">
              ${U.select('htParam', 'Parámetro', D.holding.params.map(p => ({ id: p.id, label: p.label })), 'dbo')}
              <label class="field"><span>Fecha y hora de muestreo</span><input id="htSample" type="datetime-local" value="${dtLocal(sample)}"></label>
              <label class="field"><span>Fecha y hora de análisis / recepción</span><input id="htAnalysis" type="datetime-local" value="${dtLocal(now)}"></label>
              ${U.field('htTemp', 'Temperatura de conservación', '°C', '4')}
              ${U.field('htId', 'Código de muestra', '—', 'M-2026-001')}
              ${U.field('htResp', 'Responsable', '—', 'Laboratorio')}
            </div>
            <div class="note" style="margin-top:10px">El tiempo de conservación se cuenta desde la toma hasta el inicio del análisis. La refrigeración a ≤ 4 °C no extiende un plazo ya vencido.</div>
          </section>
          <section class="panel">
            <div class="panel-title">Referencia del parámetro</div>
            <div class="table-wrap"><table><tbody id="htRef"></tbody></table></div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado <span class="tag" id="htTag">VÁLIDA</span></div>
            <div class="metrics">
              ${U.metric('htElapsed', 'Tiempo transcurrido', 'h', true)}
              ${U.metric('htMax', 'Tiempo máximo', 'h')}
              ${U.metric('htLeft', 'Margen restante', 'h')}
              ${U.metric('htPct', 'Consumo del plazo', '%')}
              ${U.metric('htPctLeft', 'Fracción restante', '%')}
              ${U.metric('htContainer', 'Recipiente', '')}
            </div>
            <div style="margin-top:14px">
              <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:5px"><span>Toma</span><span>Límite</span></div>
              <div class="progress" style="height:12px"><i id="htBar" style="width:0%"></i></div>
            </div>
            <div id="htVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Tabla de conservación <span class="tag">REFERENCIAL</span></div>
            <div class="table-wrap" style="max-height:330px"><table><thead><tr><th>Parámetro</th><th>Recipiente</th><th>Preservación</th><th class="num">Máx. (h)</th></tr></thead><tbody id="htTable"></tbody></table></div>
            <div class="note" style="margin-top:10px">Tiempos referenciales de Standard Methods y normativa nacional. Confirme con el método acreditado y el laboratorio contratado.</div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T28;
      function param() {
        const id = root.querySelector('#htParam').value;
        return D.holding.params.find(p => p.id === id) || D.holding.params[0];
      }
      function update() {
        const p = param();
        const s = root.querySelector('#htSample').value;
        const a = root.querySelector('#htAnalysis').value;
        const t0 = s ? new Date(s) : new Date();
        const t1 = a ? new Date(a) : new Date();
        let elapsed = (t1 - t0) / 3600000;
        if (!isFinite(elapsed)) elapsed = 0;
        const max = p.hours;
        const left = max - elapsed;
        const pct = max > 0 ? elapsed / max * 100 : 0;

        GL.out('htElapsed', fmt(elapsed, 2));
        GL.out('htMax', fmt(max, 2));
        GL.out('htLeft', GL.signed(left, 2));
        GL.out('htPct', fmt(pct, 0) + ' %');
        GL.out('htPctLeft', fmt(Math.max(0, 100 - pct), 0) + ' %');
        GL.out('htContainer', p.container);
        root.querySelector('#htTag').textContent = left >= 0 ? 'VÁLIDA' : 'VENCIDA';
        const bar = root.querySelector('#htBar');
        bar.style.width = Math.min(100, pct) + '%';
        bar.className = pct > 100 ? 'bad' : pct > 80 ? 'warn' : '';

        root.querySelector('#htRef').innerHTML = `
          <tr><td class="name">Parámetro</td><td>${esc(p.label)}</td></tr>
          <tr><td class="name">Matriz</td><td>${esc(p.matrix)}</td></tr>
          <tr><td class="name">Recipiente</td><td>${esc(p.container)}</td></tr>
          <tr><td class="name">Preservación</td><td>${esc(p.preserve)}</td></tr>
          <tr><td class="name">Tiempo máximo</td><td><b>${fmt(p.hours, 2)} h</b> (${fmt(p.hours / 24, 2)} días)</td></tr>
          <tr><td class="name">Observación</td><td>${esc(p.note)}</td></tr>`;

        root.querySelector('#htTable').innerHTML = D.holding.params.map(x =>
          `<tr${x.id === p.id ? ' style="background:var(--panel-3)"' : ''}><td class="name">${esc(x.label)}</td><td>${esc(x.container)}</td><td>${esc(x.preserve)}</td><td class="num">${fmt(x.hours, 2)}</td></tr>`
        ).join('');

        const tone = left >= 0 ? (pct > 80 ? 'warn' : 'ok') : 'bad';
        GL.setVerdict('htVerdict', tone,
          left >= 0 ? (pct > 80 ? 'Dentro del plazo, con margen reducido' : 'Muestra dentro del tiempo de conservación') : 'Tiempo de conservación excedido',
          `${p.label}: transcurrieron ${fmt(elapsed, 2)} h de un máximo de ${fmt(max, 2)} h (${fmt(p.hours / 24, 2)} días). ${left >= 0 ? 'Quedan ' + fmt(left, 2) + ' h de margen; mantenga la cadena de frío y documente la recepción.' : 'El exceso es de ' + fmt(Math.abs(left), 2) + ' h. El resultado puede no ser válido: registre la no conformidad, solicite una nueva muestra y evalúe el impacto en el informe.'} Temperatura declarada ${fmt(num('htTemp', 4), 1)} °C; el tiempo no se reinicia por refrigeración.`);

        T._report = {
          title: 'Verificación del tiempo de conservación de muestras',
          subtitle: `${p.label} · ${fmt(elapsed, 2)} h de ${fmt(max, 2)} h · ${left >= 0 ? 'válida' : 'vencida'}`,
          inputs: [
            ['Parámetro', p.label], ['Código de muestra', root.querySelector('#htId').value || '—'],
            ['Muestreo', s || '—'], ['Análisis / recepción', a || '—'],
            ['Temperatura', fmt(num('htTemp', 4), 1) + ' °C'], ['Responsable', root.querySelector('#htResp').value || '—']
          ],
          results: [
            ['Tiempo transcurrido', fmt(elapsed, 2), 'h'], ['Tiempo máximo', fmt(max, 2), 'h'],
            ['Margen restante', GL.signed(left, 2), 'h'], ['Consumo del plazo', fmt(pct, 0), '%'],
            ['Recipiente', p.container, ''], ['Preservación', p.preserve, '']
          ],
          notes: [
            'Los tiempos máximos son referenciales (Standard Methods / normativa nacional) y pueden variar según el método, la matriz y el laboratorio.',
            'El plazo se cuenta desde la toma hasta el inicio del análisis; la recepción en laboratorio no detiene el reloj.',
            'La cadena de custodia, la temperatura de transporte y la integridad del recipiente son parte de la validez de la muestra.',
            'Una muestra vencida no necesariamente invalida todos los parámetros: evalúe cada analito y documente la decisión.'
          ],
          method: '<p>Tiempo transcurrido = hora de análisis − hora de muestreo. La muestra es válida si el tiempo transcurrido no supera el máximo de conservación del parámetro. El consumo del plazo se expresa como porcentaje del máximo.</p>'
        };
        T._csv = [{
          parametro: p.label, codigo: root.querySelector('#htId').value || '', muestreo: s, analisis: a,
          horas_transcurridas: +elapsed.toFixed(3), horas_maximas: max,
          margen_horas: +left.toFixed(3), consumo_pct: +pct.toFixed(1),
          valida: left >= 0, recipiente: p.container, preservacion: p.preserve
        }];
      }
      ['#htSample', '#htAnalysis', '#htParam', '#htTemp', '#htId', '#htResp'].forEach(sel => {
        const el = root.querySelector(sel);
        if (el) { el.addEventListener('input', update); el.addEventListener('change', update); }
      });
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_validez_muestras.csv', this._csv); }
  };
  GL.tool(T28);

  /* ======================================================================
     29 · CONTENCIÓN SECUNDARIA — VOLUMEN Y ÁREA
     ====================================================================== */
  const T29 = {
    id: 'containment-volume',
    suite: 'metrology',
    title: 'Contención secundaria · volumen, área y muro',
    desc: 'Dimensione una contención secundaria para tanques: volumen del tanque mayor, volumen total, factor de seguridad, lluvia, bordo libre, capacidad útil y déficit. Verifique el área y la altura de muro requeridas.',
    tags: ['Contención', 'Tanques', 'Derrames', 'Dique'],
    keywords: 'contencion secundaria tanque derrame dique volumen area muro bordo libre lluvia 110 por ciento',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Tanques</h2><p>Todos los tanques se suponen cilíndricos y de igual diámetro y altura.</p></div></div>
            <div class="grid-3">
              ${U.field('ctTanks', 'Número de tanques', 'n', '2')}
              ${U.field('ctDia', 'Diámetro del tanque', 'm', '6')}
              ${U.field('ctHeight', 'Altura del tanque', 'm', '5')}
              ${U.field('ctFill', 'Fracción de llenado', '%', '90')}
              ${U.field('ctSf', 'Factor sobre el tanque mayor', '%', '110', { q: 'Criterio habitual: 110 % del tanque mayor o 10 % del volumen total, el mayor.' })}
              ${U.field('ctDisp', 'Volumen desplazado (estructuras)', 'm³', '0')}
            </div>
          </section>
          <section class="panel">
            <div class="panel-title">Geometría de la contención</div>
            <div class="grid-3">
              ${U.select('ctType', 'Tipo de área', [
                { id: 'rect', label: 'Rectangular' },
                { id: 'circ', label: 'Circular' }
              ], 'rect')}
              ${U.field('ctL', 'Largo (rectangular)', 'm', '14')}
              ${U.field('ctW', 'Ancho (rectangular)', 'm', '9')}
              ${U.field('ctCd', 'Diámetro (circular)', 'm', '13')}
              ${U.field('ctWall', 'Altura de muro', 'm', '1.2')}
              ${U.field('ctFree', 'Bordo libre', 'm', '0.20')}
              ${U.field('ctRain', 'Lluvia de diseño', 'mm', '50')}
            </div>
            <div class="note" style="margin-top:10px">La capacidad útil descuenta el bordo libre y la lluvia de diseño. Para el tipo seleccionado se usan largo y ancho o el diámetro circular.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado</div>
            <div class="metrics">
              ${U.metric('ctVtank', 'Volumen del tanque mayor', 'm³', true)}
              ${U.metric('ctVtotal', 'Volumen total de tanques', 'm³')}
              ${U.metric('ctReq', 'Contención requerida', 'm³')}
              ${U.metric('ctCap', 'Capacidad útil', 'm³')}
              ${U.metric('ctDef', 'Déficit / excedente', 'm³')}
              ${U.metric('ctArea', 'Área de contención', 'm²')}
              ${U.metric('ctReqArea', 'Área requerida a la altura actual', 'm²')}
              ${U.metric('ctReqWall', 'Altura de muro requerida', 'm')}
            </div>
            <div class="chart-wrap" style="margin-top:16px"><canvas id="ctChart"></canvas></div>
            <div class="chart-legend"><span><i style="background:#B06060"></i>Requerido</span><span><i style="background:#2A8C82"></i>Capacidad útil</span></div>
            <div id="ctVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Memoria de cálculo</div>
            <div class="table-wrap"><table><thead><tr><th>Concepto</th><th class="num">Valor</th><th>Unidad</th></tr></thead><tbody id="ctTable"></tbody></table></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T29;
      function update() {
        const tanks = Math.max(1, Math.round(num('ctTanks', 2)));
        const dia = Math.max(0.1, num('ctDia', 6));
        const height = Math.max(0.1, num('ctHeight', 5));
        const fill = GL.clamp(num('ctFill', 90), 0, 100) / 100;
        const sf = Math.max(100, num('ctSf', 110)) / 100;
        const disp = Math.max(0, num('ctDisp', 0));
        const type = root.querySelector('#ctType').value;
        const L = Math.max(0.1, num('ctL', 14));
        const W = Math.max(0.1, num('ctW', 9));
        const Cd = Math.max(0.1, num('ctCd', 13));
        const wall = Math.max(0.1, num('ctWall', 1.2));
        const free = Math.max(0, num('ctFree', 0.2));
        const rain = Math.max(0, num('ctRain', 50)) / 1000;

        const area = type === 'circ' ? Math.PI * Math.pow(Cd / 2, 2) : L * W;
        const vtank = Math.PI * Math.pow(dia / 2, 2) * height * fill;
        const vtotal = vtank * tanks;
        const req = Math.max(sf * vtank, 0.10 * vtotal) + disp;
        const usable = Math.max(0, wall - free - rain);
        const cap = area * usable;
        const def = cap - req;
        const reqArea = usable > 0 ? req / usable : Infinity;
        const reqWall = area > 0 ? req / area + free + rain : Infinity;

        GL.out('ctVtank', fmt(vtank, 1));
        GL.out('ctVtotal', fmt(vtotal, 1));
        GL.out('ctReq', fmt(req, 1));
        GL.out('ctCap', fmt(cap, 1));
        GL.out('ctDef', GL.signed(def, 1));
        GL.out('ctArea', fmt(area, 1));
        GL.out('ctReqArea', isFinite(reqArea) ? fmt(reqArea, 1) : '—');
        GL.out('ctReqWall', isFinite(reqWall) ? fmt(reqWall, 2) : '—');

        root.querySelector('#ctTable').innerHTML = [
          ['Volumen del tanque mayor', vtank, 'm³'], ['Volumen total de tanques', vtotal, 'm³'],
          ['Factor sobre el tanque mayor', sf * vtank, 'm³'], ['10 % del volumen total', 0.10 * vtotal, 'm³'],
          ['Volumen desplazado', disp, 'm³'], ['Contención requerida', req, 'm³'],
          ['Área de contención', area, 'm²'], ['Altura de muro', wall, 'm'],
          ['Bordo libre', free, 'm'], ['Lluvia de diseño', rain, 'm'],
          ['Profundidad útil', usable, 'm'], ['Capacidad útil', cap, 'm³'],
          ['Déficit / excedente', def, 'm³'], ['Altura de muro requerida', reqWall, 'm']
        ].map(r => `<tr><td class="name">${r[0]}</td><td class="num">${isFinite(r[1]) ? fmt(r[1], r[0].indexOf('Altura') === 0 ? 2 : 1) : '—'}</td><td>${r[2]}</td></tr>`).join('');

        GL.chart(root.querySelector('#ctChart'), {
          type: 'bar',
          series: [{ name: 'Volumen', data: [['Requerido', req], ['Capacidad', cap]], color: '#2A8C82' }],
          y: { label: 'Volumen (m³)', zero: true, min: 0 },
          rules: [{ y: req, label: 'requerido ' + fmt(req, 1) + ' m³', color: '#B06060' }]
        });

        const ok = def >= 0;
        GL.setVerdict('ctVerdict', ok ? 'ok' : 'bad',
          ok ? 'Capacidad de contención suficiente' : 'Capacidad de contención insuficiente',
          `Contención requerida ${fmt(req, 1)} m³ (${fmt(sf * 100, 0)} % del tanque mayor o 10 % del total, el mayor, más desplazamiento). Capacidad útil ${fmt(cap, 1)} m³ con ${fmt(area, 1)} m² y profundidad útil ${fmt(usable, 2)} m. ${ok ? 'Excedente de ' + fmt(def, 1) + ' m³.' : 'Déficit de ' + fmt(Math.abs(def), 1) + ' m³: requiere al menos ' + (isFinite(reqArea) ? fmt(reqArea, 1) + ' m²' : 'más área') + ' a la altura actual o un muro de ' + (isFinite(reqWall) ? fmt(reqWall, 2) + ' m' : 'mayor altura') + '.'} Verifique también la impermeabilización, el drenaje y el acceso para emergencias.`);

        T._report = {
          title: 'Contención secundaria · volumen, área y altura de muro',
          subtitle: `${tanks} tanque(s) de ${fmt(dia, 1)} × ${fmt(height, 1)} m · ${ok ? 'capacidad suficiente' : 'déficit'}`,
          inputs: [
            ['Número de tanques', fmt(tanks, 0)], ['Diámetro / altura', fmt(dia, 1) + ' / ' + fmt(height, 1) + ' m'],
            ['Fracción de llenado', fmt(fill * 100, 0) + ' %'], ['Factor sobre el mayor', fmt(sf * 100, 0) + ' %'],
            ['Volumen desplazado', fmt(disp, 1) + ' m³'], ['Tipo de área', type === 'circ' ? 'Circular' : 'Rectangular'],
            ['Área', fmt(area, 1) + ' m²'], ['Altura de muro', fmt(wall, 2) + ' m'],
            ['Bordo libre', fmt(free, 2) + ' m'], ['Lluvia de diseño', fmt(rain * 1000, 0) + ' mm']
          ],
          results: [
            ['Volumen del tanque mayor', fmt(vtank, 1), 'm³'], ['Volumen total', fmt(vtotal, 1), 'm³'],
            ['Contención requerida', fmt(req, 1), 'm³'], ['Capacidad útil', fmt(cap, 1), 'm³'],
            ['Déficit / excedente', GL.signed(def, 1), 'm³'], ['Área de contención', fmt(area, 1), 'm²'],
            ['Área requerida', isFinite(reqArea) ? fmt(reqArea, 1) : '—', 'm²'], ['Altura de muro requerida', isFinite(reqWall) ? fmt(reqWall, 2) : '—', 'm']
          ],
          notes: [
            'Criterio de referencia: 110 % del volumen del tanque mayor o 10 % del volumen total, el que sea mayor. Confirme el criterio aplicable en su normativa local.',
            'La capacidad útil descuenta bordo libre y lluvia de diseño. No incluye el volumen de espuma, agua de extinción ni derrames simultáneos.',
            'La contención debe ser impermeable, resistente a los productos almacenados y contar con drenaje controlado; el diseño estructural requiere ingeniería.',
            'Este cálculo es volumétrico y de cribado; no reemplaza el diseño civil, mecánico ni el estudio de riesgos del almacenamiento.'
          ],
          method: '<p>V_tanque = π·(D/2)²·H·f. V_requerido = máx(1,10·V_mayor, 0,10·V_total) + V_desplazado. Capacidad útil = A·(H_muro − bordo libre − lluvia). Área requerida = V_requerido / profundidad útil. Altura requerida = V_requerido / A + bordo libre + lluvia.</p>'
        };
        T._csv = [{
          tanques: tanks, diametro_m: dia, altura_m: height, llenado_pct: fill * 100,
          volumen_tanque_m3: +vtank.toFixed(2), volumen_total_m3: +vtotal.toFixed(2),
          contencion_requerida_m3: +req.toFixed(2), area_m2: +area.toFixed(2),
          altura_muro_m: wall, bordo_libre_m: free, lluvia_mm: rain * 1000,
          capacidad_util_m3: +cap.toFixed(2), deficit_m3: +def.toFixed(2),
          area_requerida_m2: isFinite(reqArea) ? +reqArea.toFixed(2) : '', altura_requerida_m: isFinite(reqWall) ? +reqWall.toFixed(3) : ''
        }];
      }
      ['#ctType'].forEach(sel => root.querySelector(sel).addEventListener('change', update));
      GL.bindCalc(root, ['ctTanks', 'ctDia', 'ctHeight', 'ctFill', 'ctSf', 'ctDisp', 'ctL', 'ctW', 'ctCd', 'ctWall', 'ctFree', 'ctRain'], update);
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_contencion_secundaria.csv', this._csv); }
  };
  GL.tool(T29);
})();
