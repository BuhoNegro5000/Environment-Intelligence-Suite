/* ==========================================================================
   Green Owl Labs · Suite Agua & Residuos (parte 2)
   13 Relleno sanitario · 14 Biogás de relleno sanitario
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL, D = GL.data, num = GL.num, fmt = GL.fmt, esc = GL.escape, U = GL.ui;

  /* ======================================================================
     13 · RELLENO SANITARIO — DIMENSIONAMIENTO
     ====================================================================== */
  const T13 = {
    id: 'landfill-sizing',
    suite: 'water',
    title: 'Relleno sanitario · capacidad, área y lixiviados',
    desc: 'Dimensione un relleno sanitario: residuos diarios y anuales, volumen compactado, área requerida, vida útil, percolación y lixiviados potenciales. Ajuste densidad, cobertura y profundidad de celda.',
    tags: ['Relleno sanitario', 'Residuos', 'Lixiviados'],
    keywords: 'relleno sanitario residuos solido celda area volumen lixiviado percolacion vida util compactacion',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Residuos y operación</h2><p>La generación per cápita debe provenir de un estudio de caracterización local.</p></div></div>
            <div class="grid-3">
              ${U.field('lfPop', 'Población atendida', 'hab', '180000')}
              ${U.field('lfGen', 'Generación per cápita', 'kg/hab·d', '0.65')}
              ${U.field('lfCoverage', 'Cobertura del servicio', '%', '92')}
              ${U.field('lfDensity', 'Densidad de residuos compactados', 't/m³', '0.90')}
              ${U.field('lfCover', 'Relación residuo : material de cobertura', 'fracción', '0.20', { q: 'Ingrese 0,20 si por cada tonelada de residuo se usan 0,20 t de cobertura.' })}
              ${U.field('lfDepth', 'Profundidad media de relleno', 'm', '18')}
              ${U.field('lfYears', 'Vida útil de diseño', 'años', '15')}
              ${U.field('lfFootprint', 'Factor de huella (taludes y vías)', '—', '1.18')}
              ${U.field('lfHour', 'Jornada de operación', 'h/d', '10')}
            </div>
            <div class="note" style="margin-top:10px">Cobertura = fracción del residuo generado que llega al relleno. El material de cobertura se ingresa como fracción del peso de residuo (0,20 = 20 %).</div>
          </section>
          <section class="panel">
            <div class="panel-title">Clima y lixiviados</div>
            <div class="grid-3">
              ${U.field('lfRain', 'Precipitación media anual', 'mm/año', '620')}
              ${U.field('lfET', 'Evapotranspiración anual', 'mm/año', '480')}
              ${U.field('lfRunoff', 'Escorrentía superficial', '%', '25')}
              ${U.field('lfOpen', 'Área de celda abierta (opcional)', 'ha', '0', { q: 'Si es 0, se estima como el área de una celda anual.' })}
              ${U.field('lfInfil', 'Fracción de infiltración en residuos', '%', '35')}
              ${U.field('lfLeachFactor', 'Producción específica de lixiviado', 'L/m²·d', '1.5', { q: 'Valor de contraste para chequear la percolación calculada.' })}
            </div>
            <div class="note" style="margin-top:10px">Percolación = (P − ET) × (1 − escorrentía) × fracción de infiltración. Es una estimación de cribado; un balance hídrico de relleno requiere humedad de residuos, capacidad de campo y cobertura.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado</div>
            <div class="metrics">
              ${U.metric('lfDaily', 'Residuo diario', 't/d', true)}
              ${U.metric('lfAnnual', 'Residuo anual', 't/año')}
              ${U.metric('lfVolYear', 'Volumen anual', 'm³/año')}
              ${U.metric('lfVolTotal', 'Volumen total', 'm³')}
              ${U.metric('lfArea', 'Área requerida', 'ha')}
              ${U.metric('lfAreaYear', 'Área por año', 'm²/año')}
              ${U.metric('lfLeach', 'Lixiviado potencial', 'm³/año')}
              ${U.metric('lfCell', 'Altura de celda diaria', 'm')}
            </div>
            <div class="chart-wrap" style="margin-top:16px"><canvas id="lfChart"></canvas></div>
            <div id="lfVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Balance de volumen <span class="tag">RESIDUO + COBERTURA</span></div>
            <div id="lfComp" style="margin-top:4px"></div>
            <div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>Concepto</th><th class="num">Valor</th><th>Unidad</th></tr></thead><tbody id="lfTable"></tbody></table></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T13;
      function update() {
        const pop = Math.max(1, num('lfPop', 180000));
        const gen = Math.max(0.05, num('lfGen', 0.65));
        const cov = GL.clamp(num('lfCoverage', 92), 0, 100) / 100;
        const dens = Math.max(0.3, num('lfDensity', 0.9));
        const coverRatio = GL.clamp(num('lfCover', 0.2), 0, 1.5);
        const depth = Math.max(2, num('lfDepth', 18));
        const years = Math.max(1, num('lfYears', 15));
        const fp = Math.max(1, num('lfFootprint', 1.18));
        const hour = Math.max(1, num('lfHour', 10));
        const rain = Math.max(0, num('lfRain', 620));
        const et = Math.max(0, num('lfET', 480));
        const runoff = GL.clamp(num('lfRunoff', 25), 0, 100) / 100;
        const infil = GL.clamp(num('lfInfil', 35), 0, 100) / 100;
        const leachFactor = Math.max(0, num('lfLeachFactor', 1.5));

        const daily = pop * gen * cov / 1000;
        const annual = daily * 365;
        const annualVol = annual * (1 + coverRatio) / dens;
        const totalVol = annualVol * years;
        const area = totalVol / depth * fp;
        const areaYear = annualVol / depth * fp;
        const openHa = Math.max(0, num('lfOpen', 0)) || areaYear / 10000;
        const openM2 = openHa * 10000;
        const netRain = Math.max(0, rain - et);
        const leach = netRain * (1 - runoff) * infil / 1000 * openM2;
        const leachCheck = leachFactor * 365 * openM2 / 1000;
        const trucks = daily / 12;
        const wasteMass = annual * years;

        GL.out('lfDaily', fmt(daily, 1));
        GL.out('lfAnnual', fmt(annual, 0));
        GL.out('lfVolYear', fmt(annualVol, 0));
        GL.out('lfVolTotal', fmt(totalVol, 0));
        GL.out('lfArea', fmt(area / 10000, 2));
        GL.out('lfAreaYear', fmt(areaYear, 0));
        GL.out('lfLeach', fmt(leach, 0));
        GL.out('lfCell', fmt(Math.max(0.2, daily / (dens * Math.max(50, areaYear / 365))), 2));

        root.querySelector('#lfComp').innerHTML = U.compbar([
          { label: 'Residuos', value: annual / dens * years, color: '#66C7E8' },
          { label: 'Material de cobertura', value: annual * coverRatio / dens * years, color: '#B9F46F' }
        ], { unit: 'm³', dec: 0 });

        GL.chart(root.querySelector('#lfChart'), {
          series: [{
            name: 'Volumen acumulado', points: false, fill: true, color: '#66C7E8',
            data: Array.from({ length: years + 1 }, (_, i) => [i, annualVol * i])
          }],
          x: { label: 'Año de operación' }, y: { label: 'Volumen acumulado (m³)', min: 0, zero: true },
          rules: [{ y: totalVol, label: 'capacidad de diseño', color: '#F2B45A' }]
        });

        const perDay = areaYear / 365;
        const tone = perDay > 2500 ? 'warn' : 'ok';
        GL.setVerdict('lfVerdict', tone,
          `Vida útil ${fmt(years, 0)} años · ${fmt(annual / 1000, 1)} kt/año`,
          `Se requieren ${fmt(totalVol, 0)} m³ y ${fmt(area / 10000, 1)} ha a ${fmt(depth, 0)} m de profundidad. Área diaria de avance ${fmt(perDay, 0)} m²/d · lixiviado potencial ${fmt(leach, 0)} m³/año (chequeo por tasa específica: ${fmt(leachCheck, 0)} m³/año). ${perDay > 2500 ? 'El frente de trabajo es extenso: evalúe celdas más pequeñas o mayor densidad.' : 'Verifique el frente de trabajo, la cobertura diaria y el manejo de lixiviados.'}`);

        root.querySelector('#lfTable').innerHTML = [
          ['Masa total de residuos', fmt(wasteMass, 0), 't'],
          ['Material de cobertura', fmt(wasteMass * coverRatio, 0), 't'],
          ['Volumen de residuos', fmt(annual / dens * years, 0), 'm³'],
          ['Volumen de cobertura', fmt(annual * coverRatio / dens * years, 0), 'm³'],
          ['Camiones/día (12 t)', fmt(trucks, 1), 'unidades'],
          ['Área de celda abierta', fmt(openHa, 2), 'ha'],
          ['Percolación neta', fmt(netRain, 0), 'mm/año'],
          ['Lixiviado por tasa específica', fmt(leachCheck, 0), 'm³/año'],
          ['Producción diaria de lixiviado', fmt(leach / 365, 1), 'm³/d']
        ].map(r => `<tr><td class="name">${r[0]}</td><td class="num">${r[1]}</td><td>${r[2]}</td></tr>`).join('');

        T._report = {
          title: 'Dimensionamiento de relleno sanitario',
          subtitle: `${fmt(pop, 0)} hab · ${fmt(daily, 1)} t/d · ${fmt(years, 0)} años de vida útil`,
          inputs: [
            ['Población', fmt(pop, 0) + ' hab'], ['Generación', fmt(gen, 2) + ' kg/hab·d'], ['Cobertura', fmt(cov * 100, 0) + ' %'],
            ['Densidad compactada', fmt(dens, 2) + ' t/m³'], ['Cobertura : residuo', '1 : ' + fmt(coverRatio, 2)], ['Profundidad', fmt(depth, 1) + ' m'],
            ['Precipitación', fmt(rain, 0) + ' mm/año'], ['Evapotranspiración', fmt(et, 0) + ' mm/año'], ['Escorrentía', fmt(runoff * 100, 0) + ' %']
          ],
          results: [
            ['Residuo diario', fmt(daily, 1), 't/d'], ['Residuo anual', fmt(annual, 0), 't/año'], ['Volumen anual', fmt(annualVol, 0), 'm³/año'],
            ['Volumen total', fmt(totalVol, 0), 'm³'], ['Área requerida', fmt(area / 10000, 2), 'ha'], ['Lixiviado potencial', fmt(leach, 0), 'm³/año'],
            ['Área por año', fmt(areaYear, 0), 'm²/año'], ['Masa total', fmt(wasteMass, 0), 't']
          ],
          notes: [
            'Dimensionamiento volumétrico de cribado; no reemplaza el diseño geotécnico, hidrogeológico, de estabilidad de taludes ni de impermeabilización.',
            'La densidad compactada depende del tipo de residuo, la compactadora y la humedad. Un valor optimista sobreestima la vida útil.',
            'La producción de lixiviado es una estimación basada en percolación; el balance real requiere humedad de residuos y comportamiento de la cobertura.',
            'Verifique la normativa local sobre ubicación, distancias a cuerpos de agua, captación de biogás y cierre.'
          ],
          method: '<p>Residuo diario = población × generación × cobertura. Volumen anual = masa × (1 + cobertura/densidad). Volumen total = volumen anual × años. Área = volumen total / profundidad × factor de huella. Percolación = (P − ET) × (1 − escorrentía) × infiltración. Lixiviado = percolación × área abierta.</p>'
        };
        T._csv = [
          { concepto: 'residuo_diario_t', valor: +daily.toFixed(2) },
          { concepto: 'residuo_anual_t', valor: +annual.toFixed(0) },
          { concepto: 'volumen_anual_m3', valor: +annualVol.toFixed(0) },
          { concepto: 'volumen_total_m3', valor: +totalVol.toFixed(0) },
          { concepto: 'area_ha', valor: +(area / 10000).toFixed(3) },
          { concepto: 'lixiviado_m3_ano', valor: +leach.toFixed(0) }
        ];
      }
      GL.bindCalc(root, ['lfPop', 'lfGen', 'lfCoverage', 'lfDensity', 'lfCover', 'lfDepth', 'lfYears', 'lfFootprint', 'lfHour', 'lfRain', 'lfET', 'lfRunoff', 'lfOpen', 'lfInfil', 'lfLeachFactor'], update);
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_relleno_sanitario.csv', this._csv); }
  };
  GL.tool(T13);

  /* ======================================================================
     14 · BIOGÁS DE RELLENO SANITARIO
     ====================================================================== */
  const T14 = {
    id: 'landfill-biogas',
    suite: 'water',
    title: 'Biogás de relleno sanitario y recuperación energética',
    desc: 'Modele la generación de metano con decaimiento de primer orden (LandGEM/IPCC FOD), estime el pico, la captura, la energía eléctrica, los ingresos y las emisiones evitadas por escenario de aprovechamiento.',
    tags: ['Biogás', 'CH₄', 'LandGEM', 'Energía'],
    keywords: 'biogas relleno sanitario metano landgem ipcc fod captura energia electrica flare gwp',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Residuos dispuestos</h2><p>El modelo supone una masa anual constante durante la operación declarada.</p></div></div>
            <div class="grid-3">
              ${U.field('bgWaste', 'Residuos dispuestos por año', 't/año', '150000')}
              ${U.field('bgYears', 'Años de operación', 'años', '15')}
              ${U.field('bgEval', 'Año de evaluación (desde inicio)', 'años', '10')}
              ${U.field('bgK', 'Constante de decaimiento k', '1/año', '0.05')}
              ${U.field('bgDOC', 'DOC · carbono orgánico degradable', 'fracción', '0.18')}
              ${U.field('bgDOCf', 'DOCf · fracción que se degrada', 'fracción', '0.55')}
              ${U.field('bgMCF', 'MCF · corrección de metano', 'fracción', '1.00')}
              ${U.field('bgF', 'F · fracción de CH₄ en biogás', 'fracción', '0.50')}
              ${U.field('bgOx', 'Factor de oxidación en cobertura', 'fracción', '0.10')}
            </div>
          </section>
          <section class="panel">
            <div class="panel-title">Aprovechamiento</div>
            <div class="grid-3">
              ${U.field('bgCapture', 'Eficiencia de captura', '%', '75')}
              ${U.field('bgDestroy', 'CH₄ captado que se destruye', '%', '100')}
              ${U.field('bgLHV', 'Poder calorífico del CH₄', 'MJ/m³', '35.8')}
              ${U.field('bgEff', 'Eficiencia eléctrica', '%', '35')}
              ${U.field('bgTariff', 'Tarifa de energía', 'S/ /kWh', '0.55')}
              ${U.field('bgGWP', 'GWP100 del CH₄', '—', '27')}
              ${U.field('bgDensity', 'Densidad del CH₄', 'kg/m³', '0.717')}
            </div>
            <div class="note" style="margin-top:10px">La captura se aplica al gas generado; el resto se emite. La oxidación en cobertura reduce una fracción adicional del metano no capturado.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado <span class="tag" id="bgYearTag">AÑO 10</span></div>
            <div class="metrics">
              ${U.metric('bgFlow', 'Generación en el año evaluado', 'm³ CH₄/h', true)}
              ${U.metric('bgPeak', 'Pico de generación', 'm³ CH₄/h')}
              ${U.metric('bgYearPeak', 'Año del pico', 'año')}
              ${U.metric('bgCap', 'CH₄ capturado', 'm³/año')}
              ${U.metric('bgEnergy', 'Energía eléctrica', 'MWh/año')}
              ${U.metric('bgRevenue', 'Ingreso por energía', 'S/ /año')}
              ${U.metric('bgAvoid', 'Emisiones evitadas', 't CO₂-e/año')}
              ${U.metric('bgLo', 'Potencial L₀', 'm³ CH₄/t')}
            </div>
            <div class="chart-wrap tall" style="margin-top:16px"><canvas id="bgChart"></canvas></div>
            <div class="chart-legend"><span><i style="background:#66C7E8"></i>Gas generado</span><span><i style="background:#5FE3A1"></i>Gas capturado</span></div>
            <div id="bgVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Escenario de emisiones</div>
            <div class="table-wrap"><table><thead><tr><th>Flujo</th><th class="num">m³ CH₄/año</th><th class="num">t CO₂-e/año</th></tr></thead><tbody id="bgTable"></tbody></table></div>
            <div class="note warn" style="margin-top:10px"><b>Modelo de cribado.</b> No sustituye un modelo de sitio calibrado con datos de captación, composición y humedad. La generación real puede variar por factores de 2 o más.</div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T14;
      function update() {
        const waste = Math.max(0, num('bgWaste', 150000));
        const opYears = Math.max(1, Math.round(num('bgYears', 15)));
        const evalYear = Math.max(1, Math.min(60, Math.round(num('bgEval', 10))));
        const k = Math.max(0.005, num('bgK', 0.05));
        const doc = GL.clamp(num('bgDOC', 0.18), 0.01, 0.6);
        const docf = GL.clamp(num('bgDOCf', 0.55), 0.1, 1);
        const mcf = GL.clamp(num('bgMCF', 1), 0.1, 1);
        const F = GL.clamp(num('bgF', 0.5), 0.3, 0.7);
        const ox = GL.clamp(num('bgOx', 0.1), 0, 1);
        const capture = GL.clamp(num('bgCapture', 75), 0, 100) / 100;
        const destruction = GL.clamp(num('bgDestroy', 100), 0, 100) / 100;
        const lhv = Math.max(1, num('bgLHV', 35.8));
        const eff = GL.clamp(num('bgEff', 35), 5, 60) / 100;
        const tariff = Math.max(0, num('bgTariff', 0.55));
        const gwp = Math.max(1, num('bgGWP', 27));
        const dens = Math.max(0.1, num('bgDensity', 0.717));

        const loT = doc * docf * mcf * F * 16 / 12;
        const loM3 = loT * 1000 / dens;
        const curve = [];
        let peak = 0, peakYear = 0;
        for (let y = 1; y <= 60; y++) {
          let gen = 0;
          const last = Math.min(y, opYears);
          for (let i = 1; i <= last; i++) {
            gen += waste * loM3 * Math.exp(-k * (y - i)) * (-Math.expm1(-k));
          }
          const cap=gen*capture, destroyed=cap*destruction, uncaptured=gen-cap;
          const oxidized=uncaptured*ox, emitted=(uncaptured-oxidized)+(cap-destroyed);
          curve.push({ y, gen, flow:gen/8760, cap, destroyed, uncaptured, oxidized, emitted });
          if (gen / 8760 > peak) { peak = gen / 8760; peakYear = y; }
        }
        const at = curve[evalYear - 1] || curve[curve.length - 1];
        const flow = at.flow;
        const capped = at.cap;
        const energy = at.destroyed * lhv / 3.6 * eff;
        const revenue = energy * tariff;
        const avoided = (at.destroyed-capped*ox)*dens/1000*gwp;
        const flows=[
          ['Generado',at.gen],['Captado',at.cap],['No captado',at.uncaptured],
          ['Destruido del captado',at.destroyed],['Oxidado en cobertura',at.oxidized],['Emitido a la atmósfera',at.emitted]
        ];



        GL.out('bgFlow', fmt(flow, 0));
        GL.out('bgPeak', fmt(peak, 0));
        GL.out('bgYearPeak', fmt(peakYear, 0));
        GL.out('bgCap', fmt(capped, 0));
        GL.out('bgEnergy', fmt(energy / 1000, 0));
        GL.out('bgRevenue', fmt(revenue, 0));
        GL.out('bgAvoid', fmt(avoided, 0));
        GL.out('bgLo', fmt(loM3, 1));
        root.querySelector('#bgYearTag').textContent = 'AÑO ' + evalYear;

        root.querySelector('#bgTable').innerHTML = flows.map(([label,volume])=>[label,volume,volume*dens/1000*gwp]).map(r => `<tr><td class="name">${r[0]}</td><td class="num">${fmt(r[1], 0)}</td><td class="num">${fmt(r[2], 0)}</td></tr>`).join('');

        GL.chart(root.querySelector('#bgChart'), {
          series: [
            { name: 'Generado', data: curve.map(c => [c.y, c.flow]), color: '#66C7E8', width: 2.2, points: false },
            { name: 'Capturado', data: curve.map(c => [c.y, c.cap / 8760]), color: '#5FE3A1', width: 2, points: false }
          ],
          x: { label: 'Año desde el inicio de la disposición' }, y: { label: 'm³ CH₄/h', min: 0, zero: true },
          rules: [{ y: flow, label: 'año ' + evalYear, color: '#F2B45A' }]
        });

        const tone = flow > 0 ? (capture >= 0.6 ? 'ok' : 'warn') : 'bad';
        GL.setVerdict('bgVerdict', tone,
          flow > 0 ? `Generación estimada: ${fmt(flow, 0)} m³ CH₄/h` : 'Sin generación calculada',
          `Pico de ${fmt(peak, 0)} m³/h en el año ${peakYear}. Con ${fmt(capture * 100, 0)} % de captura se recuperan ${fmt(capped / 1e6, 2)} millones de m³/año, equivalentes a ${fmt(energy / 1000, 0)} MWh/año. ${capture < 0.6 ? 'Una captura menor al 60 % deja una fracción importante de metano sin controlar.' : 'La captura declarada es razonable para un relleno con cobertura y red de pozos.'}`);

        T._report = {
          title: 'Generación de biogás y recuperación energética',
          subtitle: `Disposición ${fmt(waste, 0)} t/año · operación ${opYears} años · evaluación año ${evalYear}`,
          inputs: [
            ['Residuos anuales', fmt(waste, 0) + ' t/año'], ['Años de operación', opYears], ['k', fmt(k, 3) + ' 1/año'],
            ['DOC', fmt(doc, 3)], ['DOCf', fmt(docf, 2)], ['MCF', fmt(mcf, 2)], ['F', fmt(F, 2)], ['Oxidación', fmt(ox * 100, 0) + ' %'],
            ['Captura', fmt(capture * 100, 0) + ' %'], ['Destrucción del captado', fmt(destruction * 100, 0) + ' %'],
            ['Densidad de CH₄', dens+' kg/m³'], ['PCI', lhv+' MJ/m³'], ['GWP del CH₄', gwp], ['Eficiencia eléctrica', fmt(eff * 100, 0) + ' %']
          ],
          results: [
            ['Generación en el año evaluado', fmt(flow, 0), 'm³ CH₄/h'], ['Pico', fmt(peak, 0), 'm³ CH₄/h'], ['Año del pico', fmt(peakYear, 0), 'año'],
            ['CH₄ capturado', fmt(capped, 0), 'm³/año'], ['Energía eléctrica', fmt(energy / 1000, 0), 'MWh/año'],
            ['Ingreso', fmt(revenue, 0), 'S/ /año'], ['Reducción frente al escenario sin captura', fmt(avoided, 0), 't CO₂e/año'], ['L₀', fmt(loM3, 1), 'm³ CH₄/t']
          ],
          extra: `<table><thead><tr><th>Flujo</th><th>m³ CH₄/año</th><th>t CO₂-e/año</th></tr></thead><tbody>${flows.map(r => `<tr><td>${r[0]}</td><td>${fmt(r[1], 0)}</td><td>${fmt(r[1] * dens / 1000 * gwp, 0)}</td></tr>`).join('')}</tbody></table>`,
          notes: [
            'Modelo de decaimiento de primer orden con masa anual constante. Un relleno real tiene historial de disposición variable y cierre por celdas.',
            'El potencial L₀ depende de la composición de residuos y del clima; DOC, DOCf y k deben calibrarse con datos locales o de captación.',
            'La energía eléctrica supone un motor de combustión con la eficiencia declarada; no incluye consumo propio, disponibilidad ni pérdidas de red.',
            'La reducción compara la emisión de CH₄ con una línea base sin captura y con la misma oxidación. El CH₄ captado sin destruir cuenta como emitido.',
            'IPCC 2019 Refinement · vol. 5, cap. 3, ecuación 3.1: https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/5_Volume5/19R_V5_3_Ch03_SWDS.pdf'
          ],
          method: '<p>L₀ = DOC·DOCf·MCF·F·16/12 (t CH₄/t) convertido a m³ con la densidad del metano. Generación en el año T = Σᵢ W·L₀·[e^(−k(T−i)) − e^(−k(T−i+1))]. Captura = generación × eficiencia de captura. Oxidación = CH₄ no captado × factor de oxidación. CH₄ emitido = no captado menos oxidado, más captado sin destruir. Energía = CH₄ destruido × PCI / 3,6 × eficiencia eléctrica, suponiendo que todo el gas destruido se aprovecha en el motor.</p>'
        };
        T._csv = curve.map(c => ({ ano: c.y, generado_m3_ch4: +c.gen.toFixed(0), caudal_m3_h: +c.flow.toFixed(0), capturado_m3: +c.cap.toFixed(0), generado_sin_redondeo_m3: c.gen, capturado_sin_redondeo_m3: c.cap, destruido_m3: c.destroyed, oxidado_m3: c.oxidized, emitido_m3: c.emitted }));
      }
      GL.bindCalc(root, ['bgWaste', 'bgYears', 'bgEval', 'bgK', 'bgDOC', 'bgDOCf', 'bgMCF', 'bgF', 'bgOx', 'bgCapture', 'bgDestroy', 'bgLHV', 'bgEff', 'bgTariff', 'bgGWP', 'bgDensity'], update);
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_biogas_relleno.csv', this._csv); }
  };
  GL.tool(T14);
})();
