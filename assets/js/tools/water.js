/* ==========================================================================
   Green Owl Labs · Suite Agua & Residuos (parte 1)
   10 PTAR lodos activados · 11 Lagunas de estabilización · 12 Balance hídrico ANC
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL, D = GL.data, num = GL.num, fmt = GL.fmt, esc = GL.escape, U = GL.ui;

  /* ======================================================================
     10 · PTAR — LODOS ACTIVADOS
     ====================================================================== */
  const T10 = {
    id: 'ptar-activated-sludge',
    suite: 'water',
    title: 'PTAR · Dimensionamiento de lodos activados',
    desc: 'Estime caudal, carga de DBO, reactor, edad de lodo, producción de biomasa, oxígeno, aire de soplado y área de clarificador para un sistema de lodos activados de mezcla completa.',
    tags: ['PTAR', 'Lodos activados', 'DBO', 'Oxígeno'],
    keywords: 'ptar lodos activados reactor f/m srt oxigeno soplador clarificador dbo carga organica',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Afluente y población</h2><p>La carga per cápita es un valor de diseño; contrástela con aforos y caracterización.</p></div></div>
            <div class="grid-3">
              ${U.field('asPop', 'Población servida', 'hab', '25000')}
              ${U.field('asDot', 'Dotación', 'L/hab·d', '150')}
              ${U.field('asContrib', 'Factor de contribución', 'fracción', '0.80')}
              ${U.field('asBODpc', 'Carga de DBO₅ per cápita', 'g/hab·d', '54')}
              ${U.field('asBODin', 'DBO₅ afluente medida (opcional)', 'mg/L', '0', { q: 'Si es mayor que 0, reemplaza la carga calculada desde la población.' })}
              ${U.field('asBODout', 'DBO₅ efluente objetivo', 'mg/L', '30')}
            </div>
          </section>
          <section class="panel">
            <div class="panel-title">Diseño del reactor</div>
            <div class="grid-3">
              ${U.field('asMLSS', 'MLSS en reactor', 'mg/L', '3000')}
              ${U.field('asFM', 'Relación F/M', 'kg DBO/kg MLSS·d', '0.15')}
              ${U.field('asSRT', 'Edad de lodo objetivo (SRT)', 'd', '10')}
              ${U.field('asDepth', 'Profundidad útil', 'm', '4.0')}
              ${U.field('asY', 'Coeficiente de rendimiento Y', 'kg SS/kg DBO', '0.60')}
              ${U.field('asKd', 'Coeficiente de decaimiento kd', 'd⁻¹', '0.06')}
              ${U.field('asSOTE', 'Eficiencia estándar en agua limpia (SOTE)', 'fracción', '0.18')}
              ${U.field('asO2', 'Energía de soplado', 'kWh/kg O₂', '1.10')}
              ${U.field('asTariff', 'Tarifa de energía', 'S/ /kWh', '0.55')}
            </div>
            <div class="note" style="margin-top:10px">El reactor se dimensiona por F/M. La edad de lodo se calcula en paralelo: si ambos criterios difieren más de 20 %, revise MLSS, Y o kd antes de construir.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado <span class="tag" id="asMode">MEZCLA COMPLETA</span></div>
            <div class="metrics">
              ${U.metric('asQ', 'Caudal medio', 'm³/d', true)}
              ${U.metric('asV', 'Volumen de reactor', 'm³')}
              ${U.metric('asHRT', 'Tiempo de retención', 'h')}
              ${U.metric('asRemoved', 'DBO₅ removida', 'kg/d')}
              ${U.metric('asPx', 'Producción de lodo', 'kg SS/d')}
              ${U.metric('asO2d', 'Demanda de oxígeno', 'kg O₂/d')}
              ${U.metric('asAir', 'Aire de referencia (SOTE)', 'm³/min')}
              ${U.metric('asClar', 'Área de clarificador', 'm²')}
            </div>
            <div class="chart-wrap" style="margin-top:16px"><canvas id="asChart"></canvas></div>
            <div id="asVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Memoria de cálculo</div>
            <div class="table-wrap"><table><thead><tr><th>Parámetro</th><th class="num">Valor</th><th>Unidad</th></tr></thead><tbody id="asTable"></tbody></table></div>
            <div class="note warn" style="margin-top:10px"><b>No es un diseño de detalle.</b> Falta caracterización de nitrógeno y fósforo, temperatura, cinética específica, capacidad de soplado, mezcla, sedimentabilidad (SVI) y criterios de desinfección.</div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T10;
      function update() {
        const pop = Math.max(1, num('asPop', 25000));
        const dot = Math.max(1, num('asDot', 150));
        const contrib = GL.clamp(num('asContrib', 0.8), 0.1, 1.5);
        const Q = pop * dot * contrib / 1000;
        const load = pop * Math.max(0, num('asBODpc', 54)) / 1000;
        const measured = Math.max(0, num('asBODin', 0));
        const Sin = measured > 0 ? measured : (Q ? load / Q * 1000 : 0);
        const Sout = Math.max(0, num('asBODout', 30));
        const mlss = Math.max(100, num('asMLSS', 3000)) / 1000;
        const fm = Math.max(0.01, num('asFM', 0.15));
        const srtT = Math.max(1, num('asSRT', 10));
        const depth = Math.max(1, num('asDepth', 4));
        const Y = GL.clamp(num('asY', 0.6), 0.2, 1.2);
        const kd = Math.max(0, num('asKd', 0.06));
        const sote = GL.clamp(num('asSOTE', 0.18), 0.02, 0.6);
        const eO2 = Math.max(0.2, num('asO2', 1.1));
        const tariff = Math.max(0, num('asTariff', 0.55));

        const bodMass = Q * Sin / 1000;
        const removed = Math.max(0, Q * (Sin - Sout) / 1000);
        const eff = Sin > 0 ? (Sin - Sout) / Sin * 100 : 0;
        const V = mlss > 0 ? bodMass / (fm * mlss) : 0;
        const hrt = Q ? V / Q * 24 : 0;
        const V_srt = mlss > 0 ? (srtT * Q * Y * Math.max(0, Sin - Sout) / 1000) / (mlss * (1 + kd * srtT)) : 0;
        const Px = Math.max(0, Y * removed - kd * mlss * V);
        const O2 = Math.max(0, removed - 1.42 * Px);
        const air = O2 / (1.2 * 0.232 * sote);
        const airMin = air / 1440;
        const energy = O2 * eO2;
        const cost = energy * tariff;
        const clarH = Q / 16;
        const clarS = (Q * mlss + Q * mlss * 0.6) / 120;
        const clar = Math.max(clarH, clarS);
        const footprint = V / depth + clar;
        const srtCalc = Px > 0 ? (mlss * V) / Px : 0;
        const recir = mlss < 8 ? mlss / Math.max(0.1, 8 - mlss) : 0;

        GL.out('asQ', fmt(Q, 0));
        GL.out('asV', fmt(V, 0));
        GL.out('asHRT', fmt(hrt, 1));
        GL.out('asRemoved', fmt(removed, 0));
        GL.out('asPx', fmt(Px, 0));
        GL.out('asO2d', fmt(O2, 0));
        GL.out('asAir', fmt(airMin, 1));
        GL.out('asClar', fmt(clar, 0));

        root.querySelector('#asTable').innerHTML = [
          ['DBO₅ afluente', fmt(Sin, 0), 'mg/L'],
          ['Eficiencia requerida', fmt(eff, 1), '%'],
          ['Carga másica F/M', fmt(fm, 3), 'kg DBO/kg MLSS·d'],
          ['MLSS', fmt(mlss * 1000, 0), 'mg/L'],
          ['Volumen por F/M', fmt(V, 0), 'm³'],
          ['Volumen implícito por SRT', fmt(V_srt, 0), 'm³'],
          ['SRT calculada', fmt(srtCalc, 1), 'd'],
          ['Huella reactor + clarificador', fmt(footprint, 0), 'm²'],
          ['Relación de recirculación', fmt(recir, 2), 'Q'],
          ['Potencia estimada de soplado', fmt(energy / 24, 1), 'kW'],
          ['Costo de energía', fmt(cost, 2), 'S/ /día']
        ].map(r => `<tr><td class="name">${r[0]}</td><td class="num">${r[1]}</td><td>${r[2]}</td></tr>`).join('');

        GL.chart(root.querySelector('#asChart'), {
          type: 'bar',
          series: [{ name: 'DBO₅', data: [['Afluente', Sin], ['Efluente', Sout], ['Removida', Math.max(0, Sin - Sout)]], color: '#66C7E8' }],
          y: { label: 'DBO₅ (mg/L)', zero: true, min: 0 }
        });

        const diff = V_srt ? Math.abs(V - V_srt) / Math.max(V, V_srt) * 100 : 0;
        const tone = Sin > Sout && Q > 0 ? (diff > 25 ? 'warn' : 'ok') : 'bad';
        GL.setVerdict('asVerdict', tone,
          tone === 'bad' ? 'El efluente objetivo no es alcanzable con los datos actuales' : diff > 25 ? 'Criterios F/M y SRT poco consistentes' : 'Dimensionamiento preliminar coherente',
          `Q = ${fmt(Q, 0)} m³/d · reactor ${fmt(V, 0)} m³ · HRT ${fmt(hrt, 1)} h · SRT calculada ${fmt(srtCalc, 1)} d (objetivo ${fmt(srtT, 0)} d). Diferencia entre volúmenes ${fmt(diff, 0)} %. ${diff > 25 ? 'Ajuste MLSS, Y, kd o F/M: los tres describen el mismo sistema.' : 'Verifique sedimentabilidad (SVI), oxígeno disuelto y capacidad del soplador.'}`);

        T._report = {
          title: 'Dimensionamiento de lodos activados',
          subtitle: `Población ${fmt(pop, 0)} hab · Q ${fmt(Q, 0)} m³/d · efluente ${fmt(Sout, 0)} mg/L DBO₅`,
          inputs: [
            ['Población', fmt(pop, 0) + ' hab'], ['Dotación', fmt(dot, 0) + ' L/hab·d'], ['Factor de contribución', fmt(contrib, 2)],
            ['DBO₅ afluente', fmt(Sin, 0) + ' mg/L'], ['DBO₅ efluente', fmt(Sout, 0) + ' mg/L'], ['MLSS', fmt(mlss * 1000, 0) + ' mg/L'],
            ['F/M', fmt(fm, 3) + ' d⁻¹'], ['SRT objetivo', fmt(srtT, 1) + ' d'], ['Profundidad', fmt(depth, 1) + ' m'], ['SOTE', fmt(sote * 100, 0) + ' %']
          ],
          results: [
            ['Caudal', fmt(Q, 0), 'm³/d'], ['Volumen de reactor', fmt(V, 0), 'm³'], ['HRT', fmt(hrt, 1), 'h'],
            ['DBO₅ removida', fmt(removed, 0), 'kg/d'], ['Producción de lodo', fmt(Px, 0), 'kg SS/d'], ['Oxígeno', fmt(O2, 0), 'kg O₂/d'],
            ['Aire de referencia (SOTE)', fmt(airMin, 1), 'm³/min'], ['Área de clarificador', fmt(clar, 0), 'm²'], ['SRT calculada', fmt(srtCalc, 1), 'd']
          ],
          extra: `<table><thead><tr><th>Parámetro</th><th>Valor</th><th>Unidad</th></tr></thead><tbody>${[['Huella reactor + clarificador', fmt(footprint, 0), 'm²'], ['Recirculación', fmt(recir, 2), 'Q'], ['Energía de soplado', fmt(energy, 0), 'kWh/d'], ['Costo energía', fmt(cost, 2), 'S/ /día']].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>`,
          notes: [
            'Dimensionamiento preliminar de mezcla completa sin remoción biológica de nutrientes ni nitrificación explícita.',
            'La carga per cápita y la dotación son supuestos: reemplácelas por aforos y caracterización del afluente real.',
            'La producción de lodo se expresa como sólidos suspendidos; el espesamiento, digestión y deshidratación requieren diseño aparte.',
            'El aire es una referencia en condiciones estándar. Antes de seleccionar sopladores, use demanda real y una transferencia de campo que incluya temperatura, altitud, oxígeno disuelto, α, β y ensuciamiento.',
            'EPA · transferencia estándar frente a transferencia de campo: https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1008SBM.TXT'
          ],
          method: '<p>Q = P × dotación × contribución / 1000. V = (Q·S₀/1000) / (F/M · MLSS). HRT = V/Q. Px = Y·DBO removida − kd·MLSS·V. O₂ = DBO removida − 1.42·Px. Aire = O₂/(ρ_aire · 0.232 · SOTE). Clarificador: área por tasa hidráulica (16 m³/m²·d) y carga de sólidos (120 kg/m²·d).</p>'
        };
        T._csv = [
          { parametro: 'caudal_m3_d', valor: +Q.toFixed(1) },
          { parametro: 'dbo_afluente_mg_l', valor: +Sin.toFixed(1) },
          { parametro: 'volumen_reactor_m3', valor: +V.toFixed(1) },
          { parametro: 'hrt_h', valor: +hrt.toFixed(2) },
          { parametro: 'lodo_kg_ss_d', valor: +Px.toFixed(1) },
          { parametro: 'oxigeno_kg_d', valor: +O2.toFixed(1) },
          { parametro: 'aire_m3_min', valor: +airMin.toFixed(2) },
          { parametro: 'clarificador_m2', valor: +clar.toFixed(1) }
        ];
      }
      GL.bindCalc(root, ['asPop', 'asDot', 'asContrib', 'asBODpc', 'asBODin', 'asBODout', 'asMLSS', 'asFM', 'asSRT', 'asDepth', 'asY', 'asKd', 'asSOTE', 'asO2', 'asTariff'], update);
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_ptar_lodos_activados.csv', this._csv); }
  };
  GL.tool(T10);

  /* ======================================================================
     11 · LAGUNAS DE ESTABILIZACIÓN
     ====================================================================== */
  const T11 = {
    id: 'stabilization-ponds',
    suite: 'water',
    title: 'Lagunas de estabilización y remoción de DBO',
    desc: 'Dimensione lagunas anaerobias, facultativas o aerobias con cinética de primer orden, celdas en serie, carga orgánica superficial y remoción de coliformes. Compare mezcla completa vs flujo pistón.',
    tags: ['Lagunas', 'DBO', 'Coliformes', 'Carga orgánica'],
    keywords: 'laguna estabilizacion anaerobia facultativa aerobia dbo coliformes carga organica mara',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Afluente y objetivo</h2><p>La temperatura del agua gobierna la cinética: use el mes más frío para diseño conservador.</p></div></div>
            <div class="grid-3">
              ${U.field('lpQ', 'Caudal', 'm³/d', '1200')}
              ${U.field('lpSin', 'DBO₅ afluente', 'mg/L', '420')}
              ${U.field('lpSout', 'DBO₅ efluente objetivo', 'mg/L', '50')}
              ${U.field('lpT', 'Temperatura del agua', '°C', '18')}
              ${U.field('lpN', 'Celdas en serie', 'unidades', '2')}
              ${U.field('lpDepth', 'Profundidad útil', 'm', '2.0')}
            </div>
            <div class="grid-2" style="margin-top:10px">
              ${U.select('lpType', 'Tipo de laguna', [
                { id: 'anaerobia', label: 'Anaerobia (3–5 m)' },
                { id: 'facultativa', label: 'Facultativa (1,5–2,5 m)' },
                { id: 'aerobia', label: 'Aerobia / aireada (1–2 m)' },
                { id: 'maduración', label: 'Maduración (0,8–1,5 m)' }
              ], 'facultativa')}
              ${U.select('lpModel', 'Modelo hidráulico', [
                { id: 'series', label: 'Mezcla completa en serie' },
                { id: 'plug', label: 'Flujo pistón' }
              ], 'series')}
            </div>
            <details class="acc" style="margin-top:10px"><summary>Parámetros cinéticos</summary><div class="acc-body">
              <div class="grid-3">
                ${U.field('lpK20', 'k₂₀ de remoción de DBO', 'd⁻¹', '0.15')}
                ${U.field('lpTheta', 'Coeficiente de temperatura θ', '—', '1.05')}
                ${U.field('lpKb', 'k₂₀ de coliformes', 'd⁻¹', '2.0')}
              </div>
              <p>La ley de Arrhenius se aplica como kT = k₂₀ · θ^(T−20). Los valores son referenciales; la cinética real depende de la mezcla, la luz y la carga.</p>
            </div></details>
          </section>
          <section class="panel">
            <div class="panel-title">Criterios de carga <span class="tag" id="lpRange">—</span></div>
            <div class="table-wrap"><table><thead><tr><th>Tipo</th><th class="num">Carga superficial típica</th><th class="num">Profundidad</th><th class="num">HRT típica</th></tr></thead><tbody id="lpRef"></tbody></table></div>
            <div class="note" style="margin-top:10px">La carga orgánica superficial (COS) se calcula como kg DBO/ha·d. Una laguna facultativa sobrecargada entra en condiciones anaerobias y pierde eficiencia; una subcargada desperdicia área.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado</div>
            <div class="metrics">
              ${U.metric('lpV', 'Volumen total', 'm³', true)}
              ${U.metric('lpHRT', 'Tiempo de retención', 'd')}
              ${U.metric('lpArea', 'Área superficial', 'ha')}
              ${U.metric('lpCell', 'Volumen por celda', 'm³')}
              ${U.metric('lpOLR', 'Carga orgánica', 'kg DBO/ha·d')}
              ${U.metric('lpKt', 'k a la temperatura de diseño', 'd⁻¹')}
              ${U.metric('lpColi', 'Remoción de coliformes', 'log₁₀')}
              ${U.metric('lpFoot', 'Área por celda', 'm²')}
            </div>
            <div class="chart-wrap" style="margin-top:16px"><canvas id="lpChart"></canvas></div>
            <div id="lpVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Lectura de diseño</div>
            <div class="note accent"><b>El número no basta.</b> Verifique el balance de agua (evaporación + infiltración), la impermeabilización, el retiro de lodos, los taludes y el acceso para mantenimiento.</div>
            <div class="note" style="margin-top:8px"><b>Coliformes:</b> la remoción calculada es indicativa. La desinfección final y la reconcentración por lluvia o fauna pueden cambiar el resultado.</div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T11;
      const TYPES = {
        anaerobia: { label: 'Anaerobia', depth: 3.5, range: [1000, 4000], hrt: '1–3 d', k20: 0.25, theta: 1.05 },
        facultativa: { label: 'Facultativa', depth: 2.0, range: [100, 400], hrt: '5–20 d', k20: 0.15, theta: 1.05 },
        aerobia: { label: 'Aerobia / aireada', depth: 1.5, range: [50, 250], hrt: '3–10 d', k20: 0.10, theta: 1.04 },
        maduración: { label: 'Maduración', depth: 1.0, range: [20, 100], hrt: '3–8 d', k20: 0.08, theta: 1.04 }
      };
      function syncType() {
        const t = TYPES[root.querySelector('#lpType').value] || TYPES.facultativa;
        GL.val('lpDepth', t.depth);
        GL.val('lpK20', t.k20);
        GL.val('lpTheta', t.theta);
        root.querySelector('#lpRange').textContent = t.range[0] + '–' + t.range[1] + ' kg/ha·d';
        update();
      }
      function hrtFor(Sin, Sout, k, N, model) {
        if (Sout >= Sin) return 0;
        if (model === 'plug') return Math.log(Sin / Sout) / k;
        let lo = 0, hi = 2000;
        for (let i = 0; i < 90; i++) {
          const mid = (lo + hi) / 2;
          const se = Sin / Math.pow(1 + k * mid / N, N);
          if (se > Sout) lo = mid; else hi = mid;
        }
        return (lo + hi) / 2;
      }
      function update() {
        const Q = Math.max(1, num('lpQ', 1200));
        const Sin = Math.max(1, num('lpSin', 420));
        const Sout = Math.max(1, num('lpSout', 50));
        const temp = GL.clamp(num('lpT', 18), 2, 40);
        const N = Math.max(1, Math.round(num('lpN', 2)));
        const depth = Math.max(0.4, num('lpDepth', 2));
        const type = TYPES[root.querySelector('#lpType').value] || TYPES.facultativa;
        const model = root.querySelector('#lpModel').value;
        const k20 = Math.max(0.01, num('lpK20', 0.15));
        const theta = Math.max(1, num('lpTheta', 1.05));
        const kb20 = Math.max(0.01, num('lpKb', 2));
        const kT = k20 * Math.pow(theta, temp - 20);
        const hrt = hrtFor(Sin, Sout, kT, N, model);
        const V = Q * hrt;
        const area = V / depth;
        const cellV = V / N;
        const olr = area ? Q * Sin / 1000 / area * 10000 : 0;
        const kb = kb20 * Math.pow(1.07, temp - 20);
        const ratio = model === 'plug' ? Math.exp(-kb * hrt) : Math.pow(1 / (1 + kb * hrt / N), N);
        const logRem = ratio > 0 ? -Math.log10(ratio) : 0;

        GL.out('lpV', fmt(V, 0));
        GL.out('lpHRT', fmt(hrt, 1));
        GL.out('lpArea', fmt(area / 10000, 2));
        GL.out('lpCell', fmt(cellV, 0));
        GL.out('lpOLR', fmt(olr, 0));
        GL.out('lpKt', fmt(kT, 3));
        GL.out('lpColi', fmt(logRem, 1));
        GL.out('lpFoot', fmt(area / N, 0));

        root.querySelector('#lpRef').innerHTML = Object.keys(TYPES).map(k => {
          const t = TYPES[k];
          return `<tr${k === root.querySelector('#lpType').value ? ' style="background:rgba(95,227,161,.05)"' : ''}><td class="name">${t.label}</td><td class="num">${fmt(t.range[0], 0)}–${fmt(t.range[1], 0)}</td><td class="num">${fmt(t.depth, 1)} m</td><td class="num">${t.hrt}</td></tr>`;
        }).join('');

        const curve = [];
        const maxH = Math.max(5, Math.ceil(hrt * 1.8));
        for (let h = 0.5; h <= maxH; h += Math.max(0.25, maxH / 80)) {
          const se = model === 'plug' ? Sin * Math.exp(-kT * h) : Sin / Math.pow(1 + kT * h / N, N);
          curve.push([h, se]);
        }
        GL.chart(root.querySelector('#lpChart'), {
          series: [{ name: 'DBO₅ efluente', data: curve, color: '#66C7E8', fill: true, points: false }],
          x: { label: 'Tiempo de retención (d)' }, y: { label: 'DBO₅ (mg/L)', min: 0, zero: true },
          rules: [{ y: Sout, label: 'objetivo ' + fmt(Sout, 0), color: '#F2B45A' }]
        });

        const inRange = olr >= type.range[0] && olr <= type.range[1];
        const tone = Sout < Sin ? (inRange ? 'ok' : 'warn') : 'bad';
        GL.setVerdict('lpVerdict', tone,
          tone === 'bad' ? 'Objetivo inconsistente' : inRange ? 'Carga dentro del rango típico' : 'Carga fuera del rango típico',
          `HRT ${fmt(hrt, 1)} d · volumen ${fmt(V, 0)} m³ · área ${fmt(area / 10000, 2)} ha · COS ${fmt(olr, 0)} kg DBO/ha·d (rango ${type.range[0]}–${type.range[1]}). ${inRange ? 'Confirme el balance hídrico y la impermeabilización.' : 'Ajuste profundidad, número de celdas o tipo de laguna; una carga fuera de rango anticipa olores o fallas de tratamiento.'}`);

        T._report = {
          title: 'Dimensionamiento de lagunas de estabilización',
          subtitle: `${type.label} · ${N} celda(s) en serie · ${fmt(Q, 0)} m³/d · T ${fmt(temp, 0)} °C`,
          inputs: [
            ['Caudal', fmt(Q, 0) + ' m³/d'], ['DBO₅ afluente', fmt(Sin, 0) + ' mg/L'], ['DBO₅ objetivo', fmt(Sout, 0) + ' mg/L'],
            ['Temperatura', fmt(temp, 0) + ' °C'], ['Tipo', type.label], ['Modelo', model === 'plug' ? 'Flujo pistón' : 'Mezcla completa en serie'],
            ['Profundidad', fmt(depth, 1) + ' m'], ['k₂₀', fmt(k20, 3) + ' d⁻¹'], ['θ', fmt(theta, 2)]
          ],
          results: [
            ['Volumen total', fmt(V, 0), 'm³'], ['HRT', fmt(hrt, 1), 'd'], ['Área superficial', fmt(area / 10000, 2), 'ha'],
            ['Volumen por celda', fmt(cellV, 0), 'm³'], ['Carga orgánica', fmt(olr, 0), 'kg DBO/ha·d'], ['k de diseño', fmt(kT, 3), 'd⁻¹'],
            ['Remoción de coliformes', fmt(logRem, 1), 'log₁₀'], ['Área por celda', fmt(area / N, 0), 'm²']
          ],
          notes: [
            'Modelo de primer orden con temperatura de Arrhenius; no representa cortocircuitos, estratificación ni acumulación de lodos.',
            'La carga orgánica superficial recomendada varía con el clima, la altitud y la calidad del afluente. Verifique con guías locales.',
            'La remoción de coliformes es indicativa y no sustituye el monitoreo microbiológico ni la desinfección.',
            'El balance hídrico, la impermeabilización y la gestión de lodos son parte crítica del diseño y no se calculan aquí.'
          ],
          method: '<p>kT = k₂₀ · θ^(T−20). Mezcla completa en serie: Se = S₀ / (1 + kT·HRT/N)^N. Flujo pistón: Se = S₀·exp(−kT·HRT). HRT se resuelve por bisección. Volumen = Q·HRT. COS = (Q·S₀/1000)/área. Coliformes: Chick con kb(T) = kb₂₀·1,07^(T−20).</p>'
        };
        T._csv = [{ tipo: type.label, celdas: N, caudal_m3_d: Q, dbo_afluente: Sin, dbo_objetivo: Sout, volumen_m3: +V.toFixed(0), hrt_d: +hrt.toFixed(2), area_ha: +(area / 10000).toFixed(3), carga_kg_ha_d: +olr.toFixed(0), coliformes_log: +logRem.toFixed(2) }];
      }
      root.querySelector('#lpType').addEventListener('change', syncType);
      root.querySelector('#lpModel').addEventListener('change', update);
      GL.bindCalc(root, ['lpQ', 'lpSin', 'lpSout', 'lpT', 'lpN', 'lpDepth', 'lpK20', 'lpTheta', 'lpKb'], update);
      syncType();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_lagunas_estabilizacion.csv', this._csv); }
  };
  GL.tool(T11);

  /* ======================================================================
     12 · BALANCE HÍDRICO Y AGUA NO CONTABILIZADA (IWA)
     ====================================================================== */
  const T12 = {
    id: 'water-balance-nrw',
    suite: 'water',
    title: 'Balance hídrico y agua no contabilizada (IWA)',
    desc: 'Cierre el balance de agua de una red: consumo facturado, no facturado, pérdidas aparentes y reales, indicador de fuga ILI, UARL y costo de la pérdida. Compatible con la estructura IWA/AWWA.',
    tags: ['ANC', 'IWA', 'Pérdidas', 'ILI'],
    keywords: 'agua no contabilizada anc iwa balance hidrico perdidas aparentes reales ili uarl red',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Balance del período</h2><p>Use el mismo período para todos los volúmenes. El agua no contabilizada se cierra por diferencia.</p></div></div>
            <div class="grid-3">
              ${U.field('wbInput', 'Volumen de entrada al sistema', 'm³', '480000')}
              ${U.field('wbBilled', 'Consumo autorizado facturado', 'm³', '320000')}
              ${U.field('wbUnbilled', 'Consumo autorizado no facturado', 'm³', '12000')}
              ${U.field('wbApparent', 'Pérdidas aparentes', 'm³', '18000')}
              ${U.field('wbDays', 'Días del período', 'd', '30')}
              ${U.field('wbTariff', 'Tarifa media', 'S/ /m³', '2.40')}
            </div>
            <div class="note" style="margin-top:10px">Pérdidas reales = entrada − facturado − no facturado − aparentes. Si el resultado es negativo, los componentes no cierran: revise medición y periodos.</div>
          </section>
          <section class="panel">
            <div class="panel-title">Infraestructura y presión</div>
            <div class="grid-3">
              ${U.field('wbLm', 'Longitud de red', 'km', '86')}
              ${U.field('wbNc', 'Conexiones domiciliarias', 'unidades', '9800')}
              ${U.field('wbLp', 'Longitud de acometidas', 'km', '72')}
              ${U.field('wbPressure', 'Presión media', 'm', '28')}
              ${U.field('wbCost', 'Costo de producción', 'S/ /m³', '1.10')}
              ${U.field('wbTarget', 'Meta de ANC', '%', '20')}
            </div>
            <div class="note" style="margin-top:10px">UARL = (18·Lm + 0,8·Nc + 25·Lp)·P. Es una referencia de pérdidas inevitables; el ILI = pérdidas reales / UARL.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado <span class="tag" id="wbTag">BALANCE IWA</span></div>
            <div class="metrics">
              ${U.metric('wbNrw', 'Agua no contabilizada', 'm³', true)}
              ${U.metric('wbNrwPct', 'ANC', '%')}
              ${U.metric('wbReal', 'Pérdidas reales', 'm³')}
              ${U.metric('wbRealPct', 'Pérdidas reales', '%')}
              ${U.metric('wbIli', 'Índice ILI', '—')}
              ${U.metric('wbUarl', 'UARL del período', 'm³')}
              ${U.metric('wbValue', 'Valor de la pérdida', 'S/')}
              ${U.metric('wbAuth', 'Consumo autorizado', '%')}
            </div>
            <div style="margin-top:14px">
              <div class="mini-title">Composición del volumen de entrada</div>
              <div id="wbComp"></div>
            </div>
            <div class="chart-wrap" style="margin-top:12px"><canvas id="wbChart"></canvas></div>
            <div id="wbVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Lectura de gestión</div>
            <div class="note accent"><b>Separe aparente de real.</b> La pérdida aparente se combate con micromedición, catastro y control de fraude; la real, con sectorización, control activo de fugas y gestión de presión.</div>
            <div class="note" style="margin-top:8px"><b>ILI no es ANC.</b> El ILI compara pérdidas reales con las inevitables de su red; la ANC incluye además consumo no facturado y errores de medición.</div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T12;
      function update() {
        const input = Math.max(0, num('wbInput', 480000));
        const billed = Math.max(0, num('wbBilled', 320000));
        const unbilled = Math.max(0, num('wbUnbilled', 12000));
        const apparent = Math.max(0, num('wbApparent', 18000));
        const days = Math.max(1, num('wbDays', 30));
        const tariff = Math.max(0, num('wbTariff', 2.4));
        const Lm = Math.max(0, num('wbLm', 86));
        const Nc = Math.max(0, num('wbNc', 9800));
        const Lp = Math.max(0, num('wbLp', 72));
        const P = Math.max(0, num('wbPressure', 28));
        const cost = Math.max(0, num('wbCost', 1.1));
        const target = Math.max(0, num('wbTarget', 20));

        const auth = billed + unbilled;
        const nrw = Math.max(0, input - billed);
        const real = input - billed - unbilled - apparent;
        const nrwPct = input ? nrw / input * 100 : 0;
        const realPct = input ? real / input * 100 : 0;
        const authPct = input ? auth / input * 100 : 0;
        const realLd = real * 1000 / days;
        const uarlLd = (18 * Lm + 0.8 * Nc + 25 * Lp) * P;
        const uarlPeriod = uarlLd * days / 1000;
        const ili = uarlLd > 0 ? realLd / uarlLd : 0;
        const value = nrw * tariff;
        const prodCost = Math.max(0, real) * cost;

        GL.out('wbNrw', fmt(nrw, 0));
        GL.out('wbNrwPct', fmt(nrwPct, 1));
        GL.out('wbReal', fmt(real, 0));
        GL.out('wbRealPct', fmt(realPct, 1));
        GL.out('wbIli', fmt(ili, 2));
        GL.out('wbUarl', fmt(uarlPeriod, 0));
        GL.out('wbValue', fmt(value, 0));
        GL.out('wbAuth', fmt(authPct, 1));

        root.querySelector('#wbComp').innerHTML = U.compbar([
          { label: 'Facturado', value: billed, color: '#5FE3A1' },
          { label: 'No facturado', value: unbilled, color: '#B9F46F' },
          { label: 'Aparente', value: apparent, color: '#B4A4F5' },
          { label: 'Real', value: Math.max(0, real), color: '#F07E8A' }
        ], { unit: 'm³' });

        GL.chart(root.querySelector('#wbChart'), {
          type: 'bar',
          series: [{ name: 'm³', data: [['Facturado', billed], ['No facturado', unbilled], ['Aparente', apparent], ['Real', Math.max(0, real)]], color: '#66C7E8' }],
          y: { label: 'Volumen (m³)', zero: true, min: 0 }
        });

        const consistent = real >= 0;
        const tone = !consistent ? 'bad' : nrwPct <= target ? 'ok' : nrwPct <= target * 1.5 ? 'warn' : 'bad';
        GL.setVerdict('wbVerdict', tone,
          !consistent ? 'El balance no cierra' : nrwPct <= target ? 'ANC dentro de la meta' : 'ANC por encima de la meta',
          `${fmt(nrwPct, 1)} % de agua no contabilizada (${fmt(nrw, 0)} m³). Pérdidas reales ${fmt(real, 0)} m³ (${fmt(realPct, 1)} %), aparentes ${fmt(apparent, 0)} m³. ILI ${fmt(ili, 2)}. Valorizado a tarifa: ${fmt(value, 0)} S/. ${!consistent ? 'El residual real es negativo: revise la consistencia de los volúmenes.' : ili > 4 ? 'El ILI sugiere pérdidas reales altas para la infraestructura declarada.' : 'El ILI es compatible con una red gestionada; mantenga control activo de fugas.'}`);

        T._report = {
          title: 'Balance hídrico y agua no contabilizada',
          subtitle: `Período ${fmt(days, 0)} días · entrada ${fmt(input, 0)} m³ · meta ANC ${fmt(target, 0)} %`,
          inputs: [
            ['Volumen de entrada', fmt(input, 0) + ' m³'], ['Facturado', fmt(billed, 0) + ' m³'], ['No facturado', fmt(unbilled, 0) + ' m³'],
            ['Aparentes', fmt(apparent, 0) + ' m³'], ['Red', fmt(Lm, 1) + ' km'], ['Conexiones', fmt(Nc, 0)],
            ['Acometidas', fmt(Lp, 1) + ' km'], ['Presión media', fmt(P, 0) + ' m'], ['Tarifa', fmt(tariff, 2) + ' S//m³']
          ],
          results: [
            ['Agua no contabilizada', fmt(nrw, 0), 'm³'], ['ANC', fmt(nrwPct, 1), '%'], ['Pérdidas reales', fmt(real, 0), 'm³'],
            ['Pérdidas reales', fmt(realPct, 1), '%'], ['UARL del período', fmt(uarlPeriod, 0), 'm³'], ['ILI', fmt(ili, 2), '—'],
            ['Valor de la pérdida', fmt(value, 0), 'S/'], ['Costo de producción perdida', fmt(prodCost, 0), 'S/']
          ],
          extra: `<table><thead><tr><th>Componente</th><th>Volumen (m³)</th><th>% de entrada</th></tr></thead><tbody>${[['Facturado', billed], ['No facturado', unbilled], ['Aparente', apparent], ['Real', Math.max(0, real)]].map(r => `<tr><td>${r[0]}</td><td>${fmt(r[1], 0)}</td><td>${input ? fmt(100 * r[1] / input, 1) : '0'} %</td></tr>`).join('')}</tbody></table>`,
          notes: [
            'El balance es tan confiable como la medición de entrada y del consumo facturado. Un macro-medidor descalibrado distorsiona todo el cierre.',
            'Las pérdidas aparentes incluyen errores de micromedición, submedición, fraude y consumos no autorizados.',
            'El UARL es una referencia dependiente de la longitud de red, conexiones, acometidas y presión; no es una meta regulatoria universal.',
            'El ILI se interpreta con bandas de gestión (habitualmente <2 bueno, 2–4 aceptable, >4 pobre), pero depende del contexto de la red.'
          ],
          method: '<p>ANC = entrada − consumo facturado. Pérdidas reales = entrada − facturado − no facturado − aparentes. UARL (L/d) = (18·Lm + 0,8·Nc + 25·Lp)·P. ILI = pérdidas reales (L/d) / UARL. Valorización = ANC × tarifa.</p>'
        };
        T._csv = [
          { componente: 'entrada', m3: +input.toFixed(0) },
          { componente: 'facturado', m3: +billed.toFixed(0) },
          { componente: 'no_facturado', m3: +unbilled.toFixed(0) },
          { componente: 'aparente', m3: +apparent.toFixed(0) },
          { componente: 'real', m3: +real.toFixed(0) },
          { componente: 'anc', m3: +nrw.toFixed(0), porcentaje: +nrwPct.toFixed(2), ili: +ili.toFixed(2) }
        ];
      }
      GL.bindCalc(root, ['wbInput', 'wbBilled', 'wbUnbilled', 'wbApparent', 'wbDays', 'wbTariff', 'wbLm', 'wbNc', 'wbLp', 'wbPressure', 'wbCost', 'wbTarget'], update);
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_balance_hidrico_ANC.csv', this._csv); }
  };
  GL.tool(T12);
})();
