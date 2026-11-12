/* ==========================================================================
   Green Owl Labs · Suite Suelo & Carbono (parte 1)
   01 Stock de COS · 02 Benchmark por lluvia · 03 Densidad aparente
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL, D = GL.data, num = GL.num, fmt = GL.fmt, esc = GL.escape;

  const field = (id, label, unit, val, opts) => {
    opts = opts || {};
    return `<label class="field"><span>${label}${unit ? ` <em>${unit}</em>` : ''}${opts.q ? ` <span class="q" title="${esc(opts.q)}">?</span>` : ''}</span>
      <input id="${id}" type="text" inputmode="decimal" value="${val}" ${opts.readonly ? 'readonly' : ''} ${opts.ph ? `placeholder="${opts.ph}"` : ''}></label>`;
  };
  const selectField = (id, label, options, val, opts) => {
    opts = opts || {};
    return `<label class="field"><span>${label}</span><select id="${id}">
      ${options.map(o => `<option value="${esc(o.id)}" ${String(o.id) === String(val) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
    </select>${opts.hint ? `<small>${opts.hint}</small>` : ''}</label>`;
  };
  const metric = (id, label, unit, hero) => `<div class="metric ${hero ? 'hero' : ''}"><span>${label}</span><strong id="${id}">—</strong><small>${unit || ''}</small></div>`;

  /* ======================================================================
     01 · STOCK DE CARBONO ORGÁNICO DEL SUELO
     ====================================================================== */
  const T1 = {
    id: 'soc-stock',
    suite: 'soil',
    storeKeys: ['soc.layers'],
    title: 'Stock de carbono orgánico del suelo',
    desc: 'Convierte SOC %, densidad aparente y espesor en stock de carbono por hectárea. Suma capas, corrige fragmentos gruesos, compara masa fija vs masa equivalente y simula la incertidumbre.',
    tags: ['SOC', 't C/ha', 'CO₂-e', 'IPCC'],
    keywords: 'carbono suelo stock densidad aparente capas perfil masa equivalente monte carlo co2',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Perfil de muestreo</h2><p>Una capa equivale a una muestra simple. Edita profundidad, SOC, densidad y fragmentos.</p></div><span class="mono" id="socLayerCount">3 capas</span></div>
            <div class="table-wrap" style="margin-bottom:8px">
              <table><thead><tr><th>Capa</th><th class="num">Desde cm</th><th class="num">Hasta cm</th><th class="num">SOC %</th><th class="num">DA g/cm³</th><th class="num">FG %</th><th></th></tr></thead>
              <tbody id="socLayers"></tbody></table>
            </div>
            <div class="btn-row" style="margin-top:0">
              <button class="btn sm" id="socAdd" type="button">+ Añadir capa</button>
              <button class="btn sm" id="socClear" type="button">Vaciar capas</button>
              <span class="table-note" style="margin-left:auto">FG = fragmentos gruesos &gt; 2 mm</span>
            </div>
            <div class="grid-2" style="margin-top:16px">
              ${field('socArea', 'Área del proyecto', 'ha', '1.0')}
              ${field('socTargetMass','Masa fina objetivo para ESM','t/ha','',{q:'Indica una masa fina común a los perfiles comparados. Debe estar cubierta por el muestreo.'})}
            </div>
            <div class="field-row">
              <span>Corregir a masa equivalente (ESM)</span>
              <label class="switch"><input type="checkbox" id="socESM"><i></i></label>
            </div>
            <details class="acc"><summary>Incertidumbre y simulación</summary>
              <div class="acc-body">
                <div class="grid-3">
                  ${field('socU', 'u SOC', '% rel.', '12')}
                  ${field('socUBD', 'u densidad aparente', '% rel.', '8')}
                  ${field('socUD', 'u espesor', 'cm', '1.0')}
                </div>
                <p>Se ejecutan 2 500 simulaciones Monte Carlo a profundidad fija con distribución normal truncada. El intervalo mostrado es P5–P95 y no incluye sesgos de muestreo ni de laboratorio no declarados.</p>
              </div>
            </details>
            <div class="note" style="margin-top:12px">Stock (t C/ha) = SOC% ÷ 100 × DA × espesor × (1 − FG/100) × 100. CO₂-e = C × 44/12.</div>
          </section>
          <section class="panel">
            <div class="panel-title">Desglose por capa <span class="tag">MEMORIA</span></div>
            <div class="table-wrap"><table><thead><tr><th>Capa</th><th class="num">Espesor</th><th class="num">Masa fina</th><th class="num">t C/ha</th><th class="num">t CO₂-e/ha</th><th class="num">% del total</th></tr></thead><tbody id="socBreak"></tbody></table></div>
            <div id="socFlags" class="stack" style="margin-top:12px"></div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado <span class="tag" id="socModeTag">MASA EQUIVALENTE</span></div>
            <div class="metrics">
              ${metric('socStock', 'Stock de carbono', 't C/ha', true)}
              ${metric('socTotal', 'Carbono total del área', 't C')}
              ${metric('socCO2', 'Equivalente CO₂', 't CO₂-e/ha')}
              <div class="metric"><span id="socAltLbl">Método alternativo</span><strong id="socESMout">—</strong><small>t C/ha</small></div>
              ${metric('socCI', 'P5–P95 · profundidad fija', 't C/ha')}
              ${metric('socKg', 'Densidad superficial', 'kg C/m²')}
            </div>
            <div class="chart-wrap" style="margin-top:16px"><canvas id="socChart"></canvas></div>
            <div class="chart-legend"><span><i style="background:#5FE3A1"></i>Stock por capa</span><span><i style="background:#F2B45A"></i>Límite de referencia</span></div>
            <div id="socVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Lectura técnica</div>
            <div class="note accent"><b>Qué mirar:</b> la diferencia entre masa fija y masa equivalente indica cuánto del cambio de stock podría deberse solo a cambios de densidad aparente. Si supera el 10 %, reporte ambas cifras y explique el método.</div>
            <div class="note" style="margin-top:8px"><b>Fragmentos gruesos:</b> se descuentan por volumen. Si su laboratorio informa &#62; 2 mm en peso, convierta antes de ingresar el valor o documente la aproximación.</div>
            <details class="acc"><summary>Fórmulas y criterios</summary><div class="acc-body">
              <p><b>Stock por capa:</b> SOC (t C/ha) = SOC% / 100 × DA (g/cm³) × espesor (cm) × (1 − FG/100) × 100.</p>
              <p><b>Masa equivalente:</b> se calcula la masa de suelo fino de referencia (DA_ref × espesor) y se multiplica por la concentración de C de cada capa. Aísla el efecto de la compactación.</p>
              <p><b>CO₂-e:</b> 1 t C = 44/12 = 3,6667 t CO₂.</p>
              <p>Referencias: IPCC 2019 Refinement, Vol. 4; FAO GSOC-MRV; ELLIS &amp; VAN NOORDWIJK (equivalente masa).</p>
            </div></details>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T1;
      const DEF = [
        { from: 0, to: 10, soc: 2.10, bd: 1.28, cf: 5 },
        { from: 10, to: 30, soc: 1.45, bd: 1.38, cf: 8 },
        { from: 30, to: 100, soc: 0.72, bd: 1.45, cf: 12 }
      ];
      let layers = GL.store.get('soc.layers', DEF);
      if (!Array.isArray(layers) || !layers.length) layers = DEF;
      const esc2 = s => GL.escape(s);

      function renderLayers() {
        const tb = root.querySelector('#socLayers');
        tb.innerHTML = layers.map((l, i) => `<tr>
          <td class="name">${i + 1}</td>
          <td><input class="tbl-input" data-i="${i}" data-k="from" value="${l.from}"></td>
          <td><input class="tbl-input" data-i="${i}" data-k="to" value="${l.to}"></td>
          <td><input class="tbl-input" data-i="${i}" data-k="soc" value="${l.soc}"></td>
          <td><input class="tbl-input" data-i="${i}" data-k="bd" value="${l.bd}"></td>
          <td><input class="tbl-input" data-i="${i}" data-k="cf" value="${l.cf}"></td>
          <td><button class="btn sm" data-del="${i}" title="Eliminar" ${layers.length <= 1 ? 'disabled' : ''}>✕</button></td>
        </tr>`).join('');
        root.querySelector('#socLayerCount').textContent = layers.length + (layers.length === 1 ? ' capa' : ' capas');
      }

      function readLayers() {
        const out = [];
        root.querySelectorAll('#socLayers input').forEach(inp => {
          const i = +inp.dataset.i, k = inp.dataset.k;
          if (!out[i]) out[i] = Object.assign({}, layers[i]);
          out[i][k] = num(inp, 0);
        });
        return out.filter(Boolean);
      }

      function saveLayers() {
        layers = readLayers();
        GL.store.set('soc.layers', layers);
        renderLayers();
      }

      root.addEventListener('input', e => {
        if (e.target.closest('#socLayers')) { layers = readLayers(); GL.store.set('soc.layers', layers); }
      });
      root.addEventListener('click', e => {
        const del = e.target.closest('[data-del]');
        if (del) {
          layers = readLayers(); layers.splice(+del.dataset.del, 1);
          if (!layers.length) layers = [{ from: 0, to: 10, soc: 1, bd: 1.3, cf: 0 }];
          GL.store.set('soc.layers', layers); renderLayers(); update();
        }
      });
      root.querySelector('#socAdd').addEventListener('click', () => {
        layers = readLayers();
        const last = layers[layers.length - 1] || { to: 0, bd: 1.4, soc: 1, cf: 5 };
        layers.push({ from: last.to, to: last.to + 20, soc: Math.max(0.2, last.soc * 0.8), bd: last.bd, cf: last.cf });
        GL.store.set('soc.layers', layers); renderLayers(); update();
      });
      root.querySelector('#socClear').addEventListener('click', () => {
        layers = [{ from: 0, to: 10, soc: 0, bd: 1.35, cf: 0 }];
        GL.store.set('soc.layers', layers); renderLayers(); update();
      });

      function gauss(rng) {
        let u = 0, v = 0;
        while (u === 0) u = rng();
        while (v === 0) v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      }

      function update() {
        const L = readLayers();
        const area = Math.max(0, num('socArea', 1));
        const rawTarget=root.querySelector('#socTargetMass').value.trim();
        let target=null;
        if(rawTarget){
          try{target=GL.lab.number(rawTarget);}catch{}
        }
        const uS = Math.max(0, num('socU', 12)) / 100;
        const uB = Math.max(0, num('socUBD', 8)) / 100;
        const uD = Math.max(0, num('socUD', 1));
        const useESM = root.querySelector('#socESM').checked;
        let total=0,totalMass=0;
        const rows = [];
        const flags = [];
        L.forEach((l, i) => {
          const thick = Math.max(0, l.to - l.from);
          const cf = GL.clamp(l.cf, 0, 100);
          const fineMass = Math.max(0, l.bd) * thick * 100 * (1 - cf / 100);
          const stock = Math.max(0, l.soc) / 100 * fineMass;
          total+=stock;
          totalMass+=fineMass;
          rows.push({ i: i + 1, from: l.from, to: l.to, thick, soc: l.soc, bd: l.bd, cf, fineMass, stock, esm:null, co2: stock * 44 / 12 });
          if (thick <= 0) flags.push({ t: 'warn', m: `Capa ${i + 1}: espesor ≤ 0.` });
          if (l.bd < 0.8 || l.bd > 1.9) flags.push({ t: 'warn', m: `Capa ${i + 1}: densidad aparente de ${fmt(l.bd, 2)} g/cm³ fuera del rango esperado (0,8–1,9).` });
          if (l.soc > 15) flags.push({ t: 'info', m: `Capa ${i + 1}: SOC ${fmt(l.soc, 1)} % es alto; confirme si es materia orgánica o carbono orgánico.` });
          if (l.from !== 0 && i === 0) flags.push({ t: 'info', m: 'La primera capa no inicia en 0 cm; el stock no representa el perfil completo.' });
          if (i > 0 && Math.abs(L[i - 1].to - l.from) > 0.01) flags.push({ t: 'warn', m: `Discontinuidad entre capa ${i} y ${i + 1}: ${fmt(L[i - 1].to, 1)} → ${fmt(l.from, 1)} cm.` });
        });
        const co2 = total * 44 / 12;
        const contiguous=rows.every((r,i)=>r.thick>0&&r.bd>0&&
          Math.abs(r.from-(i?rows[i-1].to:0))<=1e-6);
        const canEstimate=target>0&&target<=totalMass+1e-8&&contiguous;
        let totalESM=null;
        if(canEstimate){
          let remaining=target;
          totalESM=0;
          for(const r of rows){
            const included=Math.min(remaining,r.fineMass);
            r.esm=r.fineMass>0?r.stock*included/r.fineMass:0;
            remaining-=included;
            totalESM+=r.esm;
          }
        }else if(useESM||rawTarget){
          const message=!(target>0)?'Ingresa la masa fina objetivo del perfil de referencia en t/ha.':
            !contiguous?'ESM requiere capas contiguas desde la superficie.':
            'El perfil muestreado no alcanza la masa fina objetivo. Se necesita un muestreo más profundo.';
          flags.push({t:'warn',m:message});
        }
        const mainStock=useESM?totalESM:total;
        GL.out('socStock', fmt(mainStock, 2));
        GL.out('socTotal', fmt(mainStock===null?null:mainStock*area,1));
        GL.out('socCO2', fmt(mainStock===null?null:mainStock*44/12,2));
        GL.out('socESMout', fmt(useESM ? total : totalESM, 2));
        root.querySelector('#socAltLbl').textContent = useESM ? 'Stock a profundidad fija' : 'Stock a masa equivalente';
        GL.out('socKg', fmt(mainStock===null?null:mainStock*.1,2));
        root.querySelector('#socModeTag').textContent = useESM ? 'MASA EQUIVALENTE' : 'PROFUNDIDAD FIJA';

        // Monte Carlo
        const sims = [];
        let state=20261111;
        const rng=()=>((state=(Math.imul(1664525,state)+1013904223)>>>0)+.5)/2**32;
        for (let s = 0; s < 2500; s++) {
          let t = 0;
          L.forEach(l => {
            const thick = Math.max(0, (l.to - l.from) + gauss(rng) * uD);
            const soc = Math.max(0, l.soc * (1 + gauss(rng) * uS));
            const bd = GL.clamp(l.bd * (1 + gauss(rng) * uB), 0.4, 2.4);
            t += soc / 100 * bd * thick * 100 * (1 - GL.clamp(l.cf, 0, 100) / 100);
          });
          sims.push(t);
        }
        sims.sort((a, b) => a - b);
        const p5 = sims[Math.floor(sims.length * 0.05)], p50 = sims[Math.floor(sims.length * 0.5)], p95 = sims[Math.floor(sims.length * 0.95)];
        GL.out('socCI', `${fmt(p5, 1)} – ${fmt(p95, 1)}`);

        root.querySelector('#socBreak').innerHTML = rows.map(r => `<tr>
          <td class="name">${fmt(r.from, 0)}–${fmt(r.to, 0)} cm</td>
          <td class="num">${fmt(r.thick, 0)} cm</td>
          <td class="num">${fmt(r.fineMass, 0)} t/ha</td>
          <td class="num">${fmt(r.stock, 2)}</td>
          <td class="num">${fmt(r.co2, 2)}</td>
          <td class="num">${total ? fmt(100 * r.stock / total, 1) : '0'} %</td>
        </tr>`).join('') + `<tr><td class="name"><b>Total</b></td><td class="num">—</td><td class="num"><b>${fmt(totalMass, 0)}</b></td><td class="num"><b>${fmt(total, 2)}</b></td><td class="num"><b>${fmt(co2, 2)}</b></td><td class="num"><b>100 %</b></td></tr>`;

        root.querySelector('#socFlags').innerHTML = flags.length
          ? flags.map(f => `<div class="verdict ${f.t}" style="margin-top:0"><div class="vi">${f.t === 'warn' ? '!' : 'i'}</div><div>${esc2(f.m)}</div></div>`).join('')
          : `<div class="status-line ok"><span class="sl-dot"></span>Sin alertas de rango en las capas ingresadas.</div>`;

        GL.setVerdict('socVerdict',useESM&&totalESM===null?'warn':'info',
          useESM&&totalESM===null?'Masa equivalente pendiente':'Perfil de suelo fino',
          'Profundidad fija '+fmt(total,2)+' t C/ha. '+(totalESM===null?
            'ESM requiere una masa fina objetivo cubierta por el muestreo.':
            'Stock a '+fmt(target,0)+' t de suelo fino/ha: '+fmt(totalESM,2)+' t C/ha.'));
        
        GL.chart(root.querySelector('#socChart'), {
          type: 'bar',
          series: [{ name: 't C/ha', data: rows.map(r => [`${fmt(r.from, 0)}–${fmt(r.to, 0)}`, r.stock]), color: '#5FE3A1' }],
          y: { label: 't C/ha', zero: true },
          rules: []
        });

        T._report = {
          title: 'Stock de carbono orgánico del suelo',
          subtitle: 'Perfil edáfico · método de masa fija y equivalente',
          inputs: [
            ['Área', fmt(area, 2) + ' ha'],
            ['Masa fina objetivo', target>0?fmt(target,2)+' t/ha':'Sin declarar'],
            ['Capas', rows.map(r => `${fmt(r.from, 0)}–${fmt(r.to, 0)} cm: SOC ${fmt(r.soc, 2)} %, DA ${fmt(r.bd, 2)}, FG ${fmt(r.cf, 0)} %`).join(' | ')],
            ['Incertidumbre declarada', `SOC ±${fmt(uS * 100, 0)} %, DA ±${fmt(uB * 100, 0)} %, espesor ±${fmt(uD, 2)} cm`]
          ],
          results: [
            ['Stock de carbono', fmt(mainStock, 2), 't C/ha'],
            ['Carbono total', fmt(mainStock===null?null:mainStock*area,1), 't C'],
            ['Equivalente CO₂', fmt(mainStock===null?null:mainStock*44/12,2), 't CO₂-e/ha'],
            ['Stock ESM', fmt(totalESM, 2), 't C/ha'],
            ['Intervalo P5–P95 · profundidad fija', `${fmt(p5, 1)} – ${fmt(p95, 1)}`, 't C/ha'],
            ['Mediana simulada · profundidad fija', fmt(p50, 2), 't C/ha']
          ],
          extra: `<table><thead><tr><th>Capa</th><th>Espesor (cm)</th><th>Masa fina (t/ha)</th><th>t C/ha</th><th>t CO₂-e/ha</th></tr></thead><tbody>${rows.map(r => `<tr><td>${fmt(r.from, 0)}–${fmt(r.to, 0)}</td><td>${fmt(r.thick, 0)}</td><td>${fmt(r.fineMass, 0)}</td><td>${fmt(r.stock, 2)}</td><td>${fmt(r.co2, 2)}</td></tr>`).join('')}</tbody></table>`,
          notes: [
            'El stock se calcula con la masa de suelo fino (descontando fragmentos gruesos). Si el laboratorio informa fragmentos en peso, la conversión es aproximada.',
            'La simulación Monte Carlo asume independencia entre SOC y densidad aparente y normalidad de los errores. No incorpora error de muestreo espacial.',
            'ESM requiere la misma masa fina objetivo y perfiles que cubran esa masa. El intervalo Monte Carlo se calcula solo a profundidad fija con semilla 20261111.',
            'FAO GSOC-MRV, Anexo 4: https://www.fao.org/fileadmin/user_upload/GSP/MRV/GSP_MRV_Protocol_A4_EN_002.pdf',
            'No usar este resultado como certificación de créditos de carbono sin validación de terceros y muestreo conforme al estándar aplicable.'
          ],
          method: '<p>Stock = Σ [SOC% / 100 × DA × espesor × (1 − FG/100) × 100]. CO₂-e = C × 44/12. ESM = Σ (fracción de C × masa fina incluida) hasta la masa objetivo. Se interpola linealmente dentro de la última capa, suponiendo concentración uniforme.</p><p>IPCC 2019 Refinement Vol. 4; FAO GSOC-MRV; equivalent soil mass (Ellis &amp; van Noordwijk).</p>'
        };
        T._csv = { rows: rows.map(r => ({ capa: `${r.from}-${r.to}`, espesor_cm: r.thick, soc_pct: r.soc, da_g_cm3: r.bd, fg_pct: r.cf, masa_fina_t_ha: +r.fineMass.toFixed(2), stock_tC_ha: +r.stock.toFixed(3), co2e_t_ha: +r.co2.toFixed(3), esm_tC_ha:r.esm===null?null:+r.esm.toFixed(3) })), total, totalESM, area };
      }

      root.querySelector('#socESM').addEventListener('change', update);
      renderLayers();
      GL.bindCalc(root, ['socArea', 'socTargetMass', 'socU', 'socUBD', 'socUD'], update);
      update();
    },
    report() { return this._report; },
    csv() {
      const d = this._csv;
      if (!d) return GL.toast('Calcule primero', 'warn');
      const rows = d.rows.slice();
      rows.push({ capa: 'TOTAL', stock_tC_ha: +d.total.toFixed(3), co2e_t_ha: +(d.total * 44 / 12).toFixed(3), esm_tC_ha:d.totalESM===null?null:+d.totalESM.toFixed(3) });
      GL.csvDownload('GOL_stock_COS.csv', rows);
    }
  };
  GL.tool(T1);

  /* ======================================================================
     02 · BENCHMARK DE SOC POR LLUVIA
     ====================================================================== */
  const T2 = {
    id: 'soc-benchmark',
    suite: 'soil',
    storeKeys: ['sb.mgmt'],
    title: 'Benchmark de carbono vs lluvia y manejo',
    desc: 'Compare el SOC de su sitio contra una curva de referencia por precipitación y tipo de manejo. Incluye percentil, brecha en t C/ha y carga de su propio dataset.',
    tags: ['Benchmark', 'Lluvia', 'Manejo', 'n=246'],
    keywords: 'benchmark referencia lluvia precipitacion percentil manejo pastura cultivo carbono',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Datos de su sitio</h2><p>El modelo compara contra el grupo de manejo seleccionado.</p></div></div>
            <div class="grid-2">
              ${field('sbRain', 'Precipitación media anual', 'mm', '680')}
              ${field('sbSOC', 'SOC observado (0–30 cm o capa equivalente)', '%', '1.85')}
              ${selectField('sbMgmt', 'Tipo de manejo', [], 'pastura')}
              ${field('sbBD', 'Densidad aparente', 'g/cm³', '1.35')}
              ${field('sbDepth', 'Espesor de la muestra', 'cm', '30')}
              ${field('sbArea', 'Área', 'ha', '1')}
            </div>
            <div class="dropzone" id="sbDrop" style="margin-top:14px">
              <div class="dz-ico">▤</div><b>Cargar dataset de referencia propio (CSV)</b>
              <small>Columnas: rain o lluvia, soc o soc_pct, mgmt o manejo. Sin límite de filas.</small>
              <input type="file" id="sbFile" accept=".csv,text/csv" hidden>
            </div>
            <div class="btn-row"><button class="btn sm" id="sbTemplate">↓ Plantilla CSV</button><button class="btn sm" id="sbRestore">↺ Volver al dataset demo</button><span class="table-note" id="sbDataNote" style="margin-left:auto"></span></div>
          </section>
          <section class="panel">
            <div class="panel-title">Resumen por manejo <span class="tag">REGRESIÓN ln(lluvia)</span></div>
            <div class="table-wrap"><table><thead><tr><th>Manejo</th><th class="num">n</th><th class="num">SOC medio %</th><th class="num">Pendiente</th><th class="num">R²</th></tr></thead><tbody id="sbGroups"></tbody></table></div>
            <div class="note" style="margin-top:10px">La curva es un modelo lineal de SOC contra el logaritmo de la lluvia. Con datasets pequeños (n &lt; 10) el percentil es indicativo y se muestra una advertencia.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Posición frente a la referencia</div>
            <div class="metrics">
              ${metric('sbExpected', 'SOC esperado', '%', true)}
              ${metric('sbPct', 'Percentil', 'de la referencia')}
              ${metric('sbZ', 'Desviación z', 'σ')}
              ${metric('sbGap', 'Brecha de stock', 't C/ha')}
              ${metric('sbN', 'Tamaño de referencia', 'observaciones')}
              ${metric('sbPotential', 'Brecha del área', 't C')}
            </div>
            <div class="chart-wrap tall" style="margin-top:16px"><canvas id="sbChart"></canvas></div>
            <div id="sbVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Interpretación</div>
            <div class="note accent"><b>Cómo leer el percentil.</b> Un percentil 50 significa que su sitio está en la mediana de sitios comparables. Un percentil bajo no prueba degradación: confirme con textura, historia de uso, erosión y muestreo.</div>
            <details class="acc"><summary>Metodología del benchmark</summary><div class="acc-body">
              <p>Para cada grupo se ajusta SOC = a + b·ln(lluvia). El valor esperado usa la pendiente del grupo seleccionado. La dispersión residual estima la desviación típica; el percentil se obtiene de la distribución normal de residuos.</p>
              <p>La brecha se convierte a stock con: ΔSOC% / 100 × DA × espesor × 100.</p>
              <p>El dataset demo es sintético (n = 246), reproducible y sustituible. No proviene de bases comerciales ni de terceros.</p>
            </div></details>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T2;
      let dataset = null;
      const mgmtSel = root.querySelector('#sbMgmt');

      function buildFromRows(rows) {
        const groups = {};
        rows.forEach(r => {
          const p = String(r.mgmt || 'Sin manejo');
          if (!groups[p]) groups[p] = { id: p, label: p, color: GL.palette[Object.keys(groups).length % 5], points: [] };
          groups[p].points.push({ rain: +r.rain, soc: +r.soc });
        });
        return { rows, groups: Object.keys(groups).map(k => groups[k]) };
      }

      function setDataset(ds, note) {
        dataset = ds;
        const opts = dataset.groups.map(g => ({ id: g.id, label: g.label }));
        mgmtSel.innerHTML = opts.map(o => `<option value="${esc(o.id)}">${esc(o.label)}</option>`).join('');
        const saved = GL.store.get('sb.mgmt', 'pastura');
        mgmtSel.value = dataset.groups.some(g => g.id === saved) ? saved : dataset.groups[0].id;
        root.querySelector('#sbDataNote').textContent = note || (dataset.rows.length + ' filas cargadas');
        if (mgmtSel.value === 'pastura') mgmtSel.value = dataset.groups.some(g => g.id === 'pastura') ? 'pastura' : dataset.groups[0].id;
        update();
      }

      function demo() {
        const b = D.buildBenchmark();
        const rows = b.rows.map(r => ({ rain: r.rain, soc: r.soc, mgmt: r.label }));
        setDataset(buildFromRows(rows), 'demo sintético · n=' + rows.length);
      }

      function groupStats() {
        return dataset.groups.map(g => {
          const xs = g.points.map(p => Math.log(p.rain)), ys = g.points.map(p => p.soc);
          const lr = GL.stat.linreg(xs, ys);
          const res = g.points.map(p => p.soc - (lr.intercept + lr.slope * Math.log(p.rain)));
          const sd = res.length > 2 ? Math.sqrt(res.reduce((s, e) => s + e * e, 0) / (res.length - 2)) : 0;
          return { g, lr, sd, n: g.points.length, mean: GL.stat.mean(ys) };
        });
      }

      function update() {
        const rain = Math.max(1, num('sbRain', 680));
        const soc = Math.max(0, num('sbSOC', 1.85));
        const bd = GL.clamp(num('sbBD', 1.35), 0.4, 2.5);
        const depth = Math.max(1, num('sbDepth', 30));
        const area = Math.max(0, num('sbArea', 1));
        const sel = mgmtSel.value;
        GL.store.set('sb.mgmt', sel);
        const stats = groupStats();
        const gs = stats.find(s => s.g.id === sel) || stats[0];
        const exp = gs ? gs.lr.intercept + gs.lr.slope * Math.log(rain) : soc;
        const sd = gs ? gs.sd : 0;
        const z = sd ? (soc - exp) / sd : 0;
        const pct = GL.stat.normalCdf(z) * 100;
        const gap = (soc - exp) * bd * depth;
        const expClamp = Math.max(0, exp);

        GL.out('sbExpected', fmt(expClamp, 2));
        GL.out('sbPct', fmt(pct, 0) + '°');
        GL.out('sbZ', GL.signed(z, 2));
        GL.out('sbGap', GL.signed(gap, 1));
        GL.out('sbN', fmt(dataset.rows.length, 0));
        GL.out('sbPotential', GL.signed(gap * area, 1));

        root.querySelector('#sbGroups').innerHTML = stats.map(s => {
          const isSel = s.g.id === sel;
          return `<tr${isSel ? ' style="background:rgba(95,227,161,.05)"' : ''}>
            <td class="name"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${s.g.color};margin-right:6px"></span>${esc(s.g.label)}</td>
            <td class="num">${s.n}</td><td class="num">${fmt(s.mean, 2)}</td>
            <td class="num">${GL.signed(s.lr.slope, 3)}</td><td class="num">${fmt(s.lr.r2, 2)}</td></tr>`;
        }).join('');

        const series = stats.map(s => ({
          name: s.g.label, type: 'scatter', color: s.g.color, r: 2.2, alpha: '55',
          data: s.g.points.filter((_, i) => i % Math.max(1, Math.round(s.g.points.length / 160)) === 0).map(p => [p.rain, p.soc])
        }));
        if (gs) {
          const line = [];
          for (let r = Math.max(150, dMin(stats)), i = 0; i <= 40; i++, r += Math.max(1, (dMax(stats) - Math.max(150, dMin(stats))) / 40)) line.push([r, Math.max(0, gs.lr.intercept + gs.lr.slope * Math.log(r))]);
          series.push({ name: 'Referencia ' + gs.g.label, data: line, color: gs.g.color, width: 2.4, points: false });
        }
        series.push({ name: 'Su sitio', type: 'scatter', points: true, color: '#F2B45A', r: 5.5, data: [[rain, soc]] });
        GL.chart(root.querySelector('#sbChart'), {
          series, x: { label: 'Precipitación media anual (mm)', min: Math.max(100, dMin(stats) * 0.9) }, y: { label: 'SOC (%)', min: 0, zero: true }
        });

        const tone = pct >= 70 ? 'ok' : pct >= 35 ? 'info' : 'warn';
        const label = pct >= 70 ? 'Por encima de la referencia' : pct >= 35 ? 'Dentro de la referencia' : 'Por debajo de la referencia';
        GL.setVerdict('sbVerdict', tone, `${label} · percentil ${fmt(pct, 0)}`,
          `Para ${fmt(rain, 0)} mm y ${esc(gs ? gs.g.label : '')}, el modelo estima ${fmt(expClamp, 2)} % de SOC. Su valor de ${fmt(soc, 2)} % equivale a ${GL.signed(gap, 1)} t C/ha (${GL.signed(gap * area, 0)} t C en ${fmt(area, 1)} ha). ${gs && gs.n < 10 ? 'El grupo tiene menos de 10 observaciones: interpretación indicativa.' : ''}`);

        T._report = {
          title: 'Benchmark de carbono orgánico vs lluvia y manejo',
          subtitle: `Referencia: ${dataset.rows.length} observaciones · grupo ${gs ? gs.g.label : '—'}`,
          inputs: [['Precipitación', fmt(rain, 0) + ' mm'], ['SOC observado', fmt(soc, 2) + ' %'], ['Manejo', gs ? gs.g.label : '—'], ['Densidad aparente', fmt(bd, 2) + ' g/cm³'], ['Espesor', fmt(depth, 0) + ' cm'], ['Área', fmt(area, 1) + ' ha']],
          results: [['SOC esperado', fmt(expClamp, 2), '%'], ['Percentil', fmt(pct, 0) + '°', 'de la referencia'], ['Desviación z', GL.signed(z, 2), 'σ'], ['Brecha de stock', GL.signed(gap, 1), 't C/ha'], ['Brecha del área', GL.signed(gap * area, 1), 't C']],
          notes: [
            'Un percentil bajo no demuestra degradación ni un percentil alto demuestra buen manejo: la referencia no controla textura, pendiente, historia de uso ni profundidad efectiva.',
            'El dataset de demostración es sintético y reproducible. Cargue su propia referencia regional para decisiones formales.',
            'La conversión de SOC% a stock usa densidad aparente y espesor declarados por el usuario.'
          ],
          method: '<p>Ajuste por grupo: SOC = a + b·ln(lluvia). Percentil = Φ((SOC − esperado)/s), con s la desviación residual del grupo. Brecha = (SOC − esperado)/100 × DA × espesor × 100.</p>'
        };
        T._csv = stats.map(s => ({ manejo: s.g.label, n: s.n, soc_medio_pct: +s.mean.toFixed(3), intercepto: +s.lr.intercept.toFixed(4), pendiente_ln_lluvia: +s.lr.slope.toFixed(4), r2: +s.lr.r2.toFixed(3), sd_residual: +s.sd.toFixed(3) }));
      }

      function dMin(stats) { let m = Infinity; stats.forEach(s => s.g.points.forEach(p => { m = Math.min(m, p.rain); })); return m === Infinity ? 200 : m; }
      function dMax(stats) { let m = 0; stats.forEach(s => s.g.points.forEach(p => { m = Math.max(m, p.rain); })); return m || 1200; }

      root.querySelector('#sbFile').addEventListener('change', e => {
        const f = e.target.files[0]; if (!f) return;
        GL.geo.readAsText(f).then(txt => {
          const parsed = GL.parseCSV(txt);
          const find = names => parsed.headers.find(h => names.indexOf(h.toLowerCase().trim()) >= 0);
          const hr = find(['rain', 'lluvia', 'precipitacion', 'precipitation', 'mm']);
          const hs = find(['soc', 'soc_pct', 'carbono', 'soc%', 'organic_carbon']);
          const hm = find(['mgmt', 'manejo', 'management', 'tipo', 'grupo']);
          if (!hr || !hs) { GL.toast('El CSV necesita columnas de lluvia y SOC', 'bad'); return; }
          const rows = parsed.rows.map(r => ({ rain: +String(r[hr]).replace(',', '.'), soc: +String(r[hs]).replace(',', '.'), mgmt: hm ? r[hm] : 'Referencia' })).filter(r => isFinite(r.rain) && isFinite(r.soc) && r.rain > 0);
          if (rows.length < 6) { GL.toast('Se necesitan al menos 6 filas válidas', 'bad'); return; }
          setDataset(buildFromRows(rows), f.name + ' · ' + rows.length + ' filas');
          GL.toast('Dataset cargado: ' + rows.length + ' filas');
        }).catch(err => GL.toast('No se pudo leer el CSV: ' + err.message, 'bad'));
      });
      root.querySelector('#sbTemplate').addEventListener('click', () => {
        GL.csvDownload('GOL_plantilla_benchmark.csv', [
          { rain: 420, soc: 1.1, mgmt: 'Cultivo convencional' },
          { rain: 650, soc: 1.65, mgmt: 'Cultivo convencional' },
          { rain: 780, soc: 2.1, mgmt: 'Pastura mejorada' },
          { rain: 900, soc: 2.35, mgmt: 'Pastura mejorada' }
        ]);
      });
      root.querySelector('#sbRestore').addEventListener('click', () => { demo(); GL.toast('Dataset demo restaurado'); });
      mgmtSel.addEventListener('change', update);
      demo();
      GL.bindCalc(root, ['sbRain', 'sbSOC', 'sbBD', 'sbDepth', 'sbArea'], update);
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_benchmark_SOC.csv', this._csv); }
  };
  GL.tool(T2);

  /* ======================================================================
     03 · DENSIDAD APARENTE
     ====================================================================== */
  const T3 = {
    id: 'bulk-density',
    suite: 'soil',
    title: 'Densidad aparente y compactación',
    desc: 'Calcula densidad aparente por cilindro o reconstruye la densidad a partir de un stock de COS. Añade porosidad, masa por hectárea y clasificación de compactación por textura.',
    tags: ['Densidad aparente', 'Porosidad', 'Compactación'],
    keywords: 'bulk density cilindro anillo porosidad compactacion textura masa suelo',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Método de cálculo</h2><p>El cilindro es el método directo; el inverso sirve para auditar un stock reportado.</p></div></div>
            <div class="segmented" id="bdMode">
              <button type="button" data-v="core" class="on">Cilindro / núcleo</button>
              <button type="button" data-v="reverse">Desde stock de COS</button>
            </div>
            <div id="bdCore">
              <div class="grid-2">
                ${field('bdD', 'Diámetro interno del cilindro', 'cm', '5.0')}
                ${field('bdH', 'Altura del cilindro', 'cm', '5.0')}
                ${field('bdFresh', 'Masa húmeda de suelo', 'g', '185.0')}
                ${field('bdRing', 'Masa del cilindro vacío', 'g', '0')}
                ${field('bdMoist', 'Humedad gravimétrica', '%', '12', { q: 'Agua por masa de suelo seco. Si pesó húmedo y secó a 105 °C, use la humedad medida.' })}
                ${field('bdCF', 'Fragmentos gruesos', '% volumen', '5')}
                ${selectField('bdTexture', 'Textura', D.textureBD.map(t => ({ id: t.id, label: t.label })), 'franco')}
                ${field('bdSOC', 'SOC (opcional, para stock)', '%', '1.8')}
              </div>
            </div>
            <div id="bdReverse" style="display:none">
              <div class="grid-2">
                ${field('bdStock', 'Stock de carbono reportado', 't C/ha', '45')}
                ${field('bdRSOC', 'SOC asociado', '%', '1.8')}
                ${field('bdRDepth', 'Espesor de la capa', 'cm', '30')}
                ${field('bdRCF', 'Fragmentos gruesos', '% volumen', '5')}
              </div>
              <div class="note" style="margin-top:10px">DA = stock ÷ (SOC/100 × espesor × 100 × (1 − FG/100)). Es una densidad aparente implícita: sirve para detectar inconsistencias, no sustituye una medición.</div>
            </div>
            <div class="note warn" style="margin-top:12px"><b>Control de calidad:</b> seque a 105 °C hasta masa constante, descuente la masa del cilindro y registre fragmentos &gt; 2 mm por separado.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado</div>
            <div class="metrics">
              ${metric('bdOut', 'Densidad aparente', 'g/cm³', true)}
              ${metric('bdPor', 'Porosidad total', '%')}
              ${metric('bdMass', 'Masa de suelo fino', 't/ha')}
              ${metric('bdStockOut', 'Stock de COS estimado', 't C/ha')}
              ${metric('bdVol', 'Volumen del cilindro', 'cm³')}
              ${metric('bdDry', 'Masa seca', 'g')}
            </div>
            <div class="chart-wrap short" style="margin-top:16px"><canvas id="bdChart"></canvas></div>
            <div id="bdVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Referencia por textura</div>
            <div class="table-wrap" style="max-height:260px"><table><thead><tr><th>Textura</th><th class="num">Rango ideal</th><th class="num">Umbral de alerta</th></tr></thead><tbody id="bdTable"></tbody></table></div>
            <div class="note" style="margin-top:10px">Umbrales orientativos: la compactación real depende de estructura, materia orgánica, humedad y cultivo. Un valor alto no es diagnóstico sin resistencia a la penetración ni porosidad de aireación.</div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T3;
      let mode = 'core';
      const texSel = () => root.querySelector('#bdTexture').value;
      root.querySelectorAll('#bdMode button').forEach(b => b.addEventListener('click', () => {
        root.querySelectorAll('#bdMode button').forEach(x => x.classList.remove('on'));
        b.classList.add('on'); mode = b.dataset.v;
        root.querySelector('#bdCore').style.display = mode === 'core' ? '' : 'none';
        root.querySelector('#bdReverse').style.display = mode === 'reverse' ? '' : 'none';
        update();
      }));

      function update() {
        let bd = 0, vol = 0, dry = 0, por = 0, cf = 0, soc = 0, stock = 0, mass = 0, thick = 0;
        if (mode === 'core') {
          const d = Math.max(0.1, num('bdD', 5)), h = Math.max(0.1, num('bdH', 5));
          const fresh = Math.max(0, num('bdFresh', 185)), ring = Math.max(0, num('bdRing', 0));
          const moist = GL.clamp(num('bdMoist', 12), -20, 300) / 100;
          cf = GL.clamp(num('bdCF', 5), 0, 100);
          vol = Math.PI * Math.pow(d / 2, 2) * h;
          dry = Math.max(0, (fresh - ring) / (1 + moist));
          bd = vol ? dry / vol : 0;
          por = bd ? (1 - bd / 2.65) * 100 : 0;
          soc = Math.max(0, num('bdSOC', 1.8));
          thick = h;
          stock = soc / 100 * bd * h * 100 * (1 - cf / 100);
          mass = bd * h * 100 * (1 - cf / 100);
        } else {
          stock = Math.max(0, num('bdStock', 45));
          soc = Math.max(0.01, num('bdRSOC', 1.8));
          thick = Math.max(0.1, num('bdRDepth', 30));
          cf = GL.clamp(num('bdRCF', 5), 0, 100);
          bd = stock / (soc / 100 * thick * 100 * (1 - cf / 100));
          por = bd ? (1 - bd / 2.65) * 100 : 0;
          dry = bd * vol;
          mass = bd * thick * 100 * (1 - cf / 100);
        }
        const tex = D.textureBD.find(t => t.id === texSel()) || D.textureBD[3];
        GL.out('bdOut', fmt(bd, 2));
        GL.out('bdPor', fmt(por, 1));
        GL.out('bdMass', fmt(mass, 0));
        GL.out('bdStockOut', mode === 'core' ? fmt(stock, 2) : '—');
        GL.out('bdVol', fmt(vol, 1));
        GL.out('bdDry', fmt(dry, 1));

        const over = bd > tex.max;
        const level = bd > tex.max + 0.15 ? 'bad' : over ? 'warn' : 'ok';
        GL.setVerdict('bdVerdict', level,
          over ? `Densidad por encima del umbral para ${tex.label}` : `Densidad compatible con ${tex.label}`,
          `Valor ${fmt(bd, 2)} g/cm³ · umbral ${fmt(tex.max, 2)} g/cm³ · porosidad ${fmt(por, 1)} %. ${bd > 1.9 || bd < 0.7 ? 'El valor sale del rango físico esperado: revise pesada, volumen y humedad.' : 'Confirme con resistencia a la penetración y observación de raíces.'}`);

        GL.chart(root.querySelector('#bdChart'), {
          type: 'bar',
          series: [{ name: 'DA', data: [['Densidad', bd], ['Umbral', tex.max]], color: '#5FE3A1' }],
          y: { label: 'g/cm³', zero: true, min: 0, max: Math.max(2, bd, tex.max) * 1.1 },
          rules: [{ y: tex.max, label: 'umbral ' + fmt(tex.max, 2), color: '#F2B45A' }]
        });

        root.querySelector('#bdTable').innerHTML = D.textureBD.map(t => `<tr${t.id === tex.id ? ' style="background:rgba(95,227,161,.05)"' : ''}><td class="name">${t.label}</td><td class="num">${fmt(t.ideal[0], 2)}–${fmt(t.ideal[1], 2)}</td><td class="num">${fmt(t.max, 2)}</td></tr>`).join('');

        T._report = {
          title: 'Densidad aparente del suelo',
          subtitle: mode === 'core' ? 'Método del cilindro / núcleo' : 'Reconstrucción desde stock de carbono',
          inputs: mode === 'core' ? [
            ['Diámetro', fmt(num('bdD'), 1) + ' cm'], ['Altura', fmt(num('bdH'), 1) + ' cm'],
            ['Masa húmeda', fmt(num('bdFresh'), 1) + ' g'], ['Humedad gravimétrica', fmt(num('bdMoist'), 1) + ' %'],
            ['Fragmentos gruesos', fmt(num('bdCF'), 1) + ' %'], ['Textura', tex.label]
          ] : [
            ['Stock reportado', fmt(stock, 2) + ' t C/ha'], ['SOC', fmt(soc, 2) + ' %'],
            ['Espesor', fmt(thick, 0) + ' cm'], ['Fragmentos gruesos', fmt(cf, 1) + ' %'], ['Textura', tex.label]
          ],
          results: [
            ['Densidad aparente', fmt(bd, 2), 'g/cm³'], ['Porosidad total', fmt(por, 1), '%'],
            ['Masa de suelo fino', fmt(mass, 0), 't/ha'], ['Volumen', fmt(vol, 1), 'cm³'],
            ['Masa seca', fmt(dry, 1), 'g'], ['Stock de COS', mode === 'core' ? fmt(stock, 2) : '—', 't C/ha']
          ],
          notes: [
            'La densidad aparente depende de la humedad al muestrear y del volumen exacto del cilindro. Un error de 1 mm en el diámetro cambia el resultado varios por ciento.',
            'La porosidad usa una densidad de partículas de 2,65 g/cm³; suelos orgánicos requieren un valor distinto.',
            'Los umbrales por textura son orientativos y no constituyen un diagnóstico de compactación.'
          ],
          method: '<p>DA = masa seca / volumen del cilindro. Masa seca = (masa húmeda − tara) / (1 + humedad). Volumen = π × (diámetro/2)² × altura. Porosidad = 1 − DA/2,65. Inverso: DA = stock / (SOC/100 × espesor × 100 × (1 − FG/100)).</p>'
        };
        T._csv = [{ metodo: mode, densidad_aparente: +bd.toFixed(3), porosidad_pct: +por.toFixed(2), masa_fina_t_ha: +mass.toFixed(1), stock_tC_ha: +stock.toFixed(3), textura: tex.label }];
      }
      root.querySelector('#bdTexture').addEventListener('change', update);
      GL.bindCalc(root, ['bdD', 'bdH', 'bdFresh', 'bdRing', 'bdMoist', 'bdCF', 'bdSOC', 'bdStock', 'bdRSOC', 'bdRDepth', 'bdRCF'], update);
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_densidad_aparente.csv', this._csv); }
  };
  GL.tool(T3);
})();
