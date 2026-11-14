/* ==========================================================================
   Yupana · Suite Aire & Energía (parte 2)
   18 Dimensionamiento solar FV · 19 Recurso eólico Weibull / AEP
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL, num = GL.num, fmt = GL.fmt, esc = GL.escape, U = GL.ui;

  const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  /* ======================================================================
     18 · ENERGÍA SOLAR FOTOVOLTAICA — DIMENSIONAMIENTO Y PRODUCCIÓN
     ====================================================================== */
  const T18 = {
    id: 'solar-pv',
    suite: 'air',
    title: 'Solar fotovoltaica · producción, área y retorno',
    desc: 'Estime la generación anual de un sistema fotovoltaico a partir del recurso solar, el rendimiento global (PR), la inclinación, la degradación y el consumo evitado. Proyecte energía, área, CO₂ evitado y retorno simple.',
    tags: ['Solar', 'Fotovoltaica', 'Generación', 'CO₂'],
    keywords: 'solar fotovoltaica panel pv generacion rendimiento pr irradiancia kwh kwp area retorno lcoe co2',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Recurso solar y sistema</h2><p>La irradiancia debe corresponder a la superficie del arreglo (POA), no necesariamente a la horizontal.</p></div></div>
            <div class="grid-3">
              ${U.field('pvGhi', 'Irradiancia anual del plano', 'kWh/m²·año', '1750', { q: 'Irradiancia global anual sobre el plano inclinado del arreglo.' })}
              ${U.field('pvTilt', 'Factor de inclinación / orientación', '—', '1.00', { q: 'Multiplicador sobre la irradiancia de referencia. 1,00 = misma irradiancia; 1,08 = +8 % por inclinación óptima.' })}
              ${U.field('pvPr', 'Rendimiento global (PR)', '%', '80', { q: 'Incluye temperatura, suciedad, cableado, inversor y sombreado. Valores típicos 75–85 %.' })}
              ${U.field('pvKwp', 'Potencia instalada', 'kWp', '100')}
              ${U.field('pvAreaKwp', 'Área por kWp', 'm²/kWp', '6.5')}
              ${U.field('pvLat', 'Latitud del sitio', '°', '-12', { q: 'Se usa solo para estimar la estacionalidad mensual. Negativo = hemisferio sur.' })}
            </div>
          </section>
          <section class="panel">
            <div class="panel-title">Vida útil y economía</div>
            <div class="grid-3">
              ${U.field('pvDeg', 'Degradación anual', '%/año', '0.5')}
              ${U.field('pvYears', 'Horizonte de análisis', 'años', '25')}
              ${U.field('pvTariff', 'Tarifa evitada', 'S/ /kWh', '0.55')}
              ${U.field('pvCost', 'Costo de inversión', 'S/', '320000')}
              ${U.field('pvOm', 'O&M anual', 'S/ /año', '3200')}
              ${U.field('pvCo2', 'Factor de emisión evitado', 'kg CO₂/kWh', '0.45')}
            </div>
            <div class="note" style="margin-top:10px">El ahorro se valora con una tarifa plana. No incluye financiamiento, impuestos, degradación del precio ni curtailment. Para un caso real use datos de un año meteorológico típico del sitio.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado <span class="tag" id="pvTag">SISTEMA FV</span></div>
            <div class="metrics">
              ${U.metric('pvYield', 'Rendimiento específico', 'kWh/kWp·año', true)}
              ${U.metric('pvAnnual', 'Generación anual', 'MWh/año')}
              ${U.metric('pvMonthly', 'Generación media mensual', 'MWh/mes')}
              ${U.metric('pvCf', 'Factor de planta', '%')}
              ${U.metric('pvLife', 'Energía en el horizonte', 'MWh')}
              ${U.metric('pvArea', 'Área del arreglo', 'm²')}
              ${U.metric('pvCo2t', 'CO₂ evitado', 't CO₂/año')}
              ${U.metric('pvPay', 'Retorno simple', 'años')}
              ${U.metric('pvMoney', 'Valor anual', 'S/ /año')}
              ${U.metric('pvLcoe', 'Costo nivelado simple', 'S/ /kWh')}
            </div>
            <div class="chart-wrap tall" style="margin-top:16px"><canvas id="pvChart"></canvas></div>
            <div class="chart-legend"><span><i style="background:#A57B1F"></i>Generación mensual estimada</span></div>
            <div id="pvVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Perfil mensual</div>
            <div class="table-wrap" style="max-height:250px"><table><thead><tr><th>Mes</th><th class="num">Irradiancia</th><th class="num">Generación</th><th class="num">% del año</th></tr></thead><tbody id="pvTable"></tbody></table></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T18;
      function update() {
        const ghi = Math.max(0, num('pvGhi', 1750));
        const tilt = Math.max(0.2, num('pvTilt', 1));
        const prRaw = num('pvPr', 80);
        // Rango defendible para un PR anual de sistemas FV bien diseñados.
        const pr = GL.clamp(prRaw, 50, 90) / 100;
        const prWarn = prRaw < 50 || prRaw > 90
          ? ` PR declarado fuera de 50–90 %: se evaluó ${fmt(pr * 100, 0)} %. Un PR mayor que 90 % no es realista para un año completo; uno menor que 50 % sugiere un problema de diseño o de datos.`
          : '';
        const kwp = Math.max(0, num('pvKwp', 100));
        const areaKwp = Math.max(0.5, num('pvAreaKwp', 6.5));
        const lat = num('pvLat', -12);
        const deg = GL.clamp(num('pvDeg', 0.5), 0, 20) / 100;
        const years = Math.max(1, Math.round(num('pvYears', 25)));
        const tariff = Math.max(0, num('pvTariff', 0.55));
        const cost = Math.max(0, num('pvCost', 320000));
        const om = Math.max(0, num('pvOm', 3200));
        const co2 = Math.max(0, num('pvCo2', 0.45));

        const poa = ghi * tilt;
        const yieldKwh = poa * pr;
        const annualKwh = kwp * yieldKwh;
        const cf = annualKwh / (kwp * 8760 || 1) * 100;

        // estacionalidad sintética según latitud (media normalizada a 1)
        const amp = GL.clamp(Math.abs(lat) / 90 * 0.55, 0, 0.5);
        const phase = lat >= 0 ? 6 : 0;
        const raw = MONTHS.map((_, i) => 1 + amp * Math.cos(2 * Math.PI * ((i + 1) - phase) / 12));
        const meanRaw = raw.reduce((s, x) => s + x, 0) / 12;
        const factors = raw.map(x => x / meanRaw);
        const monthly = factors.map((f, i) => {
          const irr = poa / 12 * f;
          return { m: MONTHS[i], irr, kwh: kwp * irr * pr, pct: annualKwh ? kwp * irr * pr / annualKwh * 100 : 0 };
        });

        const lifeKwh = annualKwh * (deg > 0
          ? (1 - Math.pow(1 - deg, years)) / deg
          : years);
        const area = kwp * areaKwp;
        const co2t = annualKwh * co2 / 1000;
        const money = annualKwh * tariff;
        const netAnnual = money - om;
        const payback = netAnnual > 0 ? cost / netAnnual : Infinity;

        // LCOE simple sin descuento: (inversión + O&M·años) / energía del horizonte
        const lcoe = lifeKwh > 0 ? (cost + om * years) / lifeKwh : 0;

        GL.out('pvYield', fmt(yieldKwh, 0));
        GL.out('pvAnnual', fmt(annualKwh / 1000, 1));
        GL.out('pvMonthly', fmt(annualKwh / 1000 / 12, 1));
        GL.out('pvCf', fmt(cf, 1) + ' %');
        GL.out('pvLife', fmt(lifeKwh / 1000, 0));
        GL.out('pvArea', fmt(area, 0));
        GL.out('pvCo2t', fmt(co2t, 1));
        GL.out('pvPay', isFinite(payback) ? fmt(payback, 1) : '—');
        GL.out('pvMoney', fmt(money, 0));
        GL.out('pvLcoe', fmt(lcoe, 3));

        root.querySelector('#pvTable').innerHTML = monthly.map(r =>
          `<tr><td class="name">${r.m}</td><td class="num">${fmt(r.irr, 0)}</td><td class="num">${fmt(r.kwh / 1000, 2)}</td><td class="num">${fmt(r.pct, 1)} %</td></tr>`
        ).join('');

        GL.chart(root.querySelector('#pvChart'), {
          type: 'bar',
          series: [{ name: 'Generación', data: monthly.map(r => [r.m, r.kwh / 1000]), color: '#A57B1F' }],
          y: { label: 'Generación (MWh/mes)', zero: true, min: 0 }
        });

        const tone = pr >= 0.78 ? 'ok' : pr >= 0.7 ? 'warn' : 'bad';
        GL.setVerdict('pvVerdict', tone,
          pr >= 0.78 ? 'Rendimiento global en rango típico' : pr >= 0.7 ? 'Rendimiento global bajo' : 'Rendimiento global muy bajo',
          `Rendimiento específico ${fmt(yieldKwh, 0)} kWh/kWp·año (PR ${fmt(pr * 100, 0)} %), factor de planta ${fmt(cf, 1)} %. Generación anual ${fmt(annualKwh / 1000, 1)} MWh y ${fmt(co2t, 1)} t CO₂ evitadas. ${isFinite(payback) ? 'Retorno simple ' + fmt(payback, 1) + ' años.' : 'El valor anual no cubre el O&M: retorno no recuperable.'}${prWarn} ${pr < 0.7 ? 'Revise sombreado, temperatura, suciedad, cableado y dimensionamiento del inversor.' : 'Verifique el recurso con datos locales y el PR con mediciones reales.'}`);

        T._report = {
          title: 'Dimensionamiento y producción de energía solar fotovoltaica',
          subtitle: `${fmt(kwp, 1)} kWp · ${fmt(poa, 0)} kWh/m²·año · PR ${fmt(pr * 100, 0)} %`,
          inputs: [
            ['Irradiancia del plano', fmt(ghi, 0) + ' kWh/m²·año'], ['Factor de inclinación', fmt(tilt, 2)],
            ['Rendimiento global', fmt(pr * 100, 0) + ' %'], ['Potencia instalada', fmt(kwp, 1) + ' kWp'],
            ['Área por kWp', fmt(areaKwp, 1) + ' m²/kWp'], ['Latitud', fmt(lat, 1) + '°'],
            ['Degradación', fmt(deg * 100, 2) + ' %/año'], ['Horizonte', fmt(years, 0) + ' años'],
            ['Tarifa evitada', fmt(tariff, 2) + ' S//kWh'], ['Inversión', fmt(cost, 0) + ' S/'],
            ['O&M anual', fmt(om, 0) + ' S/'], ['Factor de emisión', fmt(co2, 2) + ' kg CO₂/kWh']
          ],
          results: [
            ['Rendimiento específico', fmt(yieldKwh, 0), 'kWh/kWp·año'], ['Generación anual', fmt(annualKwh / 1000, 1), 'MWh/año'],
            ['Generación media mensual', fmt(annualKwh / 1000 / 12, 1), 'MWh/mes'], ['Factor de planta', fmt(cf, 1), '%'],
            ['Energía del horizonte', fmt(lifeKwh / 1000, 0), 'MWh'], ['Área del arreglo', fmt(area, 0), 'm²'],
            ['CO₂ evitado', fmt(co2t, 1), 't CO₂/año'], ['Retorno simple', isFinite(payback) ? fmt(payback, 1) : '—', 'años'],
            ['Valor anual', fmt(money, 0), 'S//año'], ['LCOE simple', fmt(lcoe, 3), 'S//kWh']
          ],
          extra: `<table><thead><tr><th>Mes</th><th>Irradiancia (kWh/m²)</th><th>Generación (MWh)</th><th>% del año</th></tr></thead><tbody>${monthly.map(r => `<tr><td>${r.m}</td><td>${fmt(r.irr, 0)}</td><td>${fmt(r.kwh / 1000, 2)}</td><td>${fmt(r.pct, 1)} %</td></tr>`).join('')}</tbody></table>`,
          notes: [
            'La producción se estima con el método de rendimiento específico: E = P_kWp · POA · PR. No reemplaza una simulación horaria (PVsyst, SAM) con sombreado y climatología local.',
            'El PR se limita a 50–90 % para un año completo. Valores fuera de ese rango suelen indicar un error de entrada, un sombreado severo o una simulación incompleta; el resultado se marca como advertencia.',
            'El perfil mensual es una aproximación estacional basada en la latitud; para el diseño final use irradiancia mensual medida o satelital del sitio.',
            'El LCOE es un indicador simple sin descuento, sin reemplazo de inversores ni costos financieros. No use este valor como cotización.',
            'El factor de emisión evitado debe corresponder al sistema eléctrico y al horario de inyección; un valor anual promedio es una simplificación.'
          ],
          method: '<p>Rendimiento específico = POA · PR, donde POA = irradiancia anual del plano · factor de inclinación y PR = rendimiento global. Generación = kWp · rendimiento específico. Energía del horizonte = Σ E·(1−d)^t. LCOE simple = (inversión + O&M·años) / energía del horizonte.</p>'
        };
        T._csv = monthly.map(r => ({ mes: r.m, irradiancia_kwh_m2: +r.irr.toFixed(1), generacion_mwh: +(r.kwh / 1000).toFixed(3), porcentaje_anual: +r.pct.toFixed(2) }));
      }
      GL.bindCalc(root, ['pvGhi', 'pvTilt', 'pvPr', 'pvKwp', 'pvAreaKwp', 'pvLat', 'pvDeg', 'pvYears', 'pvTariff', 'pvCost', 'pvOm', 'pvCo2'], update);
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_solar_fotovoltaica_mensual.csv', this._csv); }
  };
  GL.tool(T18);

  /* ======================================================================
     19 · RECURSO EÓLICO — DISTRIBUCIÓN WEIBULL Y PRODUCCIÓN ANUAL
     ====================================================================== */
  function gammaFn(z) {
    const C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaFn(1 - z));
    z -= 1;
    let x = C[0];
    for (let i = 1; i < 9; i++) x += C[i] / (z + i);
    const t = z + 7.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }
  function weibullPdf(v, k, c) {
    if (v <= 0 || c <= 0) return 0;
    return (k / c) * Math.pow(v / c, k - 1) * Math.exp(-Math.pow(v / c, k));
  }
  const T19 = {
    id: 'wind-weibull',
    suite: 'air',
    title: 'Recurso eólico · Weibull, curva de potencia y AEP',
    desc: 'Ajuste una distribución Weibull al viento del sitio, extrapole la velocidad media a la altura de buje, integre una curva de potencia y estime la producción anual (AEP), el factor de capacidad y el valor de la energía.',
    tags: ['Eólico', 'Weibull', 'AEP', 'Curva de potencia'],
    keywords: 'eolico viento weibull aep produccion anual curva potencia factor capacidad altura buje rugosidad',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Recurso del sitio</h2><p>Velocidad media medida a una altura de referencia y parámetro de forma de la distribución.</p></div></div>
            <div class="grid-3">
              ${U.field('wdMean', 'Velocidad media medida', 'm/s', '6.8')}
              ${U.field('wdRef', 'Altura de medición', 'm', '10')}
              ${U.field('wdHub', 'Altura de buje', 'm', '80')}
              ${U.field('wdAlpha', 'Exponente de cortante', '—', '0.14', { q: 'Ley de potencia: v₂ = v₁·(h₂/h₁)^α. Típico 0,10–0,25; en terreno complejo use mediciones a la altura de buje.' })}
              ${U.field('wdK', 'Parámetro de forma k (Weibull)', '—', '2.0', { q: 'k ≈ 2 corresponde a Rayleigh. Valores mayores indican viento más constante.' })}
              ${U.field('wdRho', 'Densidad del aire', 'kg/m³', '1.10', { q: 'A 0 °C y nivel del mar ≈ 1,29; a 3 500 m ≈ 0,85–1,00. Corrija por altitud y temperatura.' })}
            </div>
          </section>
          <section class="panel">
            <div class="panel-title">Aerogenerador y operación</div>
            <div class="grid-3">
              ${U.field('wdRated', 'Potencia nominal', 'kW', '2000')}
              ${U.field('wdVin', 'Velocidad de conexión', 'm/s', '3')}
              ${U.field('wdVr', 'Velocidad nominal', 'm/s', '11')}
              ${U.field('wdVout', 'Velocidad de corte', 'm/s', '25')}
              ${U.field('wdDia', 'Diámetro de rotor', 'm', '90')}
              ${U.field('wdAvail', 'Disponibilidad', '%', '96')}
              ${U.field('wdLoss', 'Pérdidas totales (estela, eléctricas)', '%', '8')}
              ${U.field('wdHours', 'Horas del año', 'h', '8760')}
              ${U.field('wdTariff', 'Tarifa de energía', 'S/ /kWh', '0.30')}
              ${U.field('wdCo2', 'Factor de emisión evitado', 'kg CO₂/kWh', '0.45')}
            </div>
            <div class="note" style="margin-top:10px">Curva de potencia simplificada: cero bajo la conexión, rampa lineal hasta la nominal, meseta hasta el corte y cero por encima. Los fabricantes entregan curvas certificadas; reemplácelas cuando estén disponibles.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado <span class="tag" id="wdTag">WEIBULL</span></div>
            <div class="metrics">
              ${U.metric('wdVhub', 'Velocidad media en buje', 'm/s', true)}
              ${U.metric('wdC', 'Parámetro de escala c', 'm/s')}
              ${U.metric('wdPd', 'Densidad de potencia', 'W/m²')}
              ${U.metric('wdSwept', 'Área barrida', 'm²')}
              ${U.metric('wdAep', 'Producción anual (AEP)', 'MWh/año')}
              ${U.metric('wdCf', 'Factor de capacidad', '%')}
              ${U.metric('wdFlh', 'Horas equivalentes', 'h/año')}
              ${U.metric('wdCo2t', 'CO₂ evitado', 't CO₂/año')}
              ${U.metric('wdMoney', 'Valor anual', 'S/ /año')}
              ${U.metric('wdCapacity', 'Potencia media', 'kW')}
            </div>
            <div class="chart-wrap" style="margin-top:16px"><canvas id="wdPdf"></canvas></div>
            <div class="chart-legend"><span><i style="background:#5277A8"></i>Densidad Weibull</span><span><i style="background:#A57B1F"></i>Curva de potencia (normalizada)</span></div>
            <div class="chart-wrap" style="margin-top:10px"><canvas id="wdEnergy"></canvas></div>
            <div class="chart-legend"><span><i style="background:#2A8C82"></i>Energía por intervalo de velocidad</span></div>
            <div id="wdVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Detalle por intervalo</div>
            <div class="table-wrap" style="max-height:250px"><table><thead><tr><th>Intervalo (m/s)</th><th class="num">Probabilidad</th><th class="num">Potencia media (kW)</th><th class="num">Energía (MWh)</th></tr></thead><tbody id="wdTable"></tbody></table></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T19;
      function powerAt(v, rated, vin, vr, vout, rho) {
        if (v < vin || v >= vout) return 0;
        const ramp=Math.min(1,(v-vin)/(vr-vin));
        return Math.min(rated,rated*(rho/1.225)*ramp);
      }
      function update() {
        const mean = Math.max(0.1, num('wdMean', 6.8));
        const ref = Math.max(1, num('wdRef', 10));
        const hub = Math.max(1, num('wdHub', 80));
        const alpha = GL.clamp(num('wdAlpha', 0.14), 0, 1.5);
        const k = Math.max(0.5, num('wdK', 2));
        const rho = GL.clamp(num('wdRho', 1.1), 0.3, 2);
        const rated = Math.max(0, num('wdRated', 2000));
        const vin=num('wdVin',3), vr=num('wdVr',11), vout=num('wdVout',25);
        if(!(0<=vin&&vin<vr&&vr<vout&&vout<=100)){
          T._report=null;
          T._csv=null;
          ['wdVhub','wdC','wdPd','wdSwept','wdAep','wdCf','wdFlh','wdCo2t','wdMoney','wdCapacity'].forEach(id=>GL.out(id,'—'));
          root.querySelector('#wdTable').innerHTML='';
          root.querySelectorAll('canvas').forEach(canvas=>canvas.hidden=true);
          GL.setVerdict('wdVerdict','bad','Revisa las velocidades de la curva',
            'Ingresa velocidades en orden conexión < nominal < corte y un corte de hasta 100 m/s.');
          return;
        }
        root.querySelectorAll('canvas').forEach(canvas=>canvas.hidden=false);
        const dia = Math.max(1, num('wdDia', 90));
        const avail = GL.clamp(num('wdAvail', 96), 0, 100) / 100;
        const loss = GL.clamp(num('wdLoss', 8), 0, 100) / 100;
        const hours = Math.max(1, num('wdHours', 8760));
        const tariff = Math.max(0, num('wdTariff', 0.3));
        const co2 = Math.max(0, num('wdCo2', 0.45));

        const vHub = mean * Math.pow(hub / ref, alpha);
        const c = vHub / gammaFn(1 + 1 / k);
        const meanCube = Math.pow(c, 3) * gammaFn(1 + 3 / k);
        const pd = 0.5 * rho * meanCube; // W/m²
        const swept = Math.PI * Math.pow(dia / 2, 2);

        const vMax=Math.max(Math.ceil(vout),30);
        const rows=[];
        const probability=(lo,hi)=>{
          const a=(lo/c)**k, b=(hi/c)**k;
          return Math.exp(-a)*(-Math.expm1(a-b));
        };
        for(let lo=0;lo<vMax;lo++){
          const hi=lo+1, f=probability(lo,hi);
          let expected=0;
          const start=Math.max(lo,vin), stop=Math.min(hi,vout);
          for(let left=start;left<stop;){
            const right=Math.min(left+.125,left<vr?vr:stop,stop);
            expected+=powerAt((left+right)/2,rated,vin,vr,vout,rho)*probability(left,right);
            left=right;
          }
          rows.push({lo,hi,v:lo+.5,f,p:f>0?expected/f:0,e:expected*hours*avail*(1-loss)});
        }
        const aepKwh=rows.reduce((sum,row)=>sum+row.e,0);
        const aepMwh = aepKwh / 1000;
        const cf = rated > 0 ? aepKwh / (rated * hours) * 100 : 0;
        const flh = rated > 0 ? aepKwh / rated : 0;
        const capacityMean = aepKwh / hours; // kW
        const co2t = aepKwh * co2 / 1000;
        const money = aepKwh * tariff;

        GL.out('wdVhub', fmt(vHub, 2));
        GL.out('wdC', fmt(c, 2));
        GL.out('wdPd', fmt(pd, 0));
        GL.out('wdSwept', fmt(swept, 0));
        GL.out('wdAep', fmt(aepMwh, 0));
        GL.out('wdCf', fmt(cf, 1) + ' %');
        GL.out('wdFlh', fmt(flh, 0));
        GL.out('wdCo2t', fmt(co2t, 1));
        GL.out('wdMoney', fmt(money, 0));
        GL.out('wdCapacity', fmt(capacityMean, 0));

        root.querySelector('#wdTable').innerHTML = rows.map(r =>
          '<tr><td class="name">'+r.lo+'–'+r.hi+'</td><td class="num">'+fmt(r.f,4)+'</td><td class="num">'+fmt(r.p,0)+'</td><td class="num">'+fmt(r.e/1000,2)+'</td></tr>').join('');

        const span = Math.max(1, Math.min(vMax, 30));
        const pdfCurve = [], powerCurve = [];
        for (let v = 0.25; v <= span; v += 0.25) {
          pdfCurve.push([v, weibullPdf(v, k, c)]);
          const norm = rated > 0 ? powerAt(v, rated, vin, vr, vout, rho) / rated : 0;
          powerCurve.push([v, norm]);
        }
        GL.chart(root.querySelector('#wdPdf'), {
          series: [
            { name: 'Weibull', data: pdfCurve, color: '#5277A8', fill: true, points: false, width: 2 },
            { name: 'Potencia normalizada', data: powerCurve, color: '#A57B1F', points: false, width: 2, dash: [4, 3] }
          ],
          x: { label: 'Velocidad del viento (m/s)' }, y: { label: 'f(v)  ·  P/Pnom', zero: true, min: 0 }
        });
        GL.chart(root.querySelector('#wdEnergy'), {
          type: 'bar',
          series: [{ name: 'Energía', data: rows.map(r => [r.lo+'–'+r.hi,r.e/1000]), color: '#2A8C82' }],
          y: { label: 'Energía por 1 m/s (MWh)', zero: true, min: 0 }
        });

        const tone = cf >= 30 ? 'ok' : cf >= 22 ? 'warn' : 'bad';
        GL.setVerdict('wdVerdict', tone,
          cf >= 30 ? 'Factor de capacidad atractivo' : cf >= 22 ? 'Factor de capacidad moderado' : 'Factor de capacidad bajo',
          `Velocidad media en buje ${fmt(vHub, 2)} m/s (c = ${fmt(c, 2)} m/s, k = ${fmt(k, 2)}). AEP ${fmt(aepMwh, 0)} MWh/año, factor de capacidad ${fmt(cf, 1)} % y ${fmt(flh, 0)} horas equivalentes. ${cf < 22 ? 'Revise altura de buje, clase de turbina, pérdidas por estela y la representatividad del período de medición.' : 'Confirme con una curva de potencia certificada, estudio de estelas y análisis de incertidumbre.'} La energía se valoriza a ${fmt(tariff, 2)} S//kWh.`);

        T._report = {
          title: 'Recurso eólico · distribución Weibull y producción anual',
          subtitle: `${fmt(mean, 1)} m/s a ${fmt(ref, 0)} m · buje ${fmt(hub, 0)} m · aerogenerador ${fmt(rated, 0)} kW`,
          inputs: [
            ['Velocidad media medida', fmt(mean, 2) + ' m/s'], ['Altura de medición', fmt(ref, 0) + ' m'],
            ['Altura de buje', fmt(hub, 0) + ' m'], ['Exponente de cortante', fmt(alpha, 2)],
            ['Parámetro de forma k', fmt(k, 2)], ['Densidad del aire', fmt(rho, 2) + ' kg/m³'],
            ['Potencia nominal', fmt(rated, 0) + ' kW'], ['Conexión / nominal / corte', fmt(vin, 1) + ' / ' + fmt(vr, 1) + ' / ' + fmt(vout, 1) + ' m/s'],
            ['Diámetro de rotor', fmt(dia, 0) + ' m'], ['Disponibilidad', fmt(avail * 100, 0) + ' %'],
            ['Pérdidas', fmt(loss * 100, 0) + ' %'], ['Tarifa', fmt(tariff, 2) + ' S//kWh']
          ],
          results: [
            ['Velocidad en buje', fmt(vHub, 2), 'm/s'], ['Parámetro de escala c', fmt(c, 2), 'm/s'],
            ['Densidad de potencia', fmt(pd, 0), 'W/m²'], ['Área barrida', fmt(swept, 0), 'm²'],
            ['AEP', fmt(aepMwh, 0), 'MWh/año'], ['Factor de capacidad', fmt(cf, 1), '%'],
            ['Horas equivalentes', fmt(flh, 0), 'h/año'], ['Potencia media', fmt(capacityMean, 0), 'kW'],
            ['CO₂ evitado', fmt(co2t, 1), 't CO₂/año'], ['Valor anual', fmt(money, 0), 'S//año']
          ],
          notes: [
            'La distribución Weibull se ajusta con la velocidad media y el parámetro de forma; c = v_media / Γ(1+1/k).',
            'La extrapolación vertical usa la ley de potencia con exponente constante. En terreno complejo, use mediciones a la altura de buje o un modelo de flujo (WAsP, CFD).',
            'La curva lineal aplica una corrección aproximada por densidad con tope nominal. Usa una curva certificada del fabricante en condiciones comparables para decisiones de proyecto.',
            'U.S. DOE · Small Wind Guidebook: https://www.energy.gov/cmei/systems/windexchange/small-wind-guidebook',
            'El AEP no incluye estelas entre aerogeneradores, curtailment, hielo, disponibilidad de red ni incertidumbre de la medición. Es una estimación de prefactibilidad.'
          ],
          method: '<p>Weibull: f(v) = (k/c)·(v/c)^(k−1)·exp[−(v/c)^k]. Extrapolación: v_h = v_ref·(h/h_ref)^α. AEP = Σ P(v medio del subintervalo) × probabilidad Weibull del subintervalo × horas × disponibilidad × (1−pérdidas). Tabla, gráfico y CSV agrupan los mismos subintervalos. Factor de capacidad = AEP/(P_nom·horas). Densidad de potencia = ½·ρ·c³·Γ(1+3/k).</p>'
        };
        T._csv = rows.map(r => ({
          velocidad_ms:r.v, weibull_f:weibullPdf(r.v,k,c), potencia_kw:r.p,
          energia_mwh:r.e/1000, intervalo_desde_ms:r.lo, intervalo_hasta_ms:r.hi, probabilidad:r.f
        }));
      }
      GL.bindCalc(root, ['wdMean', 'wdRef', 'wdHub', 'wdAlpha', 'wdK', 'wdRho', 'wdRated', 'wdVin', 'wdVr', 'wdVout', 'wdDia', 'wdAvail', 'wdLoss', 'wdHours', 'wdTariff', 'wdCo2'], update);
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_recurso_eolico_weibull.csv', this._csv); }
  };
  GL.tool(T19);
})();
