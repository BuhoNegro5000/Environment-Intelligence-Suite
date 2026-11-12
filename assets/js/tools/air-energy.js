/* ==========================================================================
   Green Owl Labs · Suite Aire & Energía (parte 1)
   15 Dispersión gaussiana · 16 Calidad del aire (ICA) · 17 Verificación de ahorros (IPMVP C)
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL, D = GL.data, num = GL.num, fmt = GL.fmt, esc = GL.escape, U = GL.ui;

  /* ======================================================================
     15 · DISPERSIÓN GAUSSIANA (CRIBADO)
     ====================================================================== */
  const T15 = {
    id: 'gaussian-plume',
    suite: 'air',
    title: 'Dispersión atmosférica · pluma gaussiana',
    desc: 'Estime la concentración de un contaminante desde una chimenea con el modelo gaussiano, ascenso de pluma de Briggs, clases de estabilidad Pasquill y reflexión en el suelo. Modelo de cribado.',
    tags: ['Dispersión', 'Briggs', 'Pasquill', 'Chimenea'],
    keywords: 'dispersion gaussiana pluma chimenea briggs pasquill estabilidad ascenso receptor pm10 AERMOD',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Fuente</h2><p>Datos del ducto y de la emisión. El caudal se convierte internamente a g/s.</p></div></div>
            <div class="grid-3">
              ${U.field('gpQ', 'Tasa de emisión', 'g/s', '2.5')}
              ${U.field('gpHs', 'Altura de la chimenea', 'm', '25')}
              ${U.field('gpD', 'Diámetro interno', 'm', '1.0')}
              ${U.field('gpVs', 'Velocidad de salida', 'm/s', '14')}
              ${U.field('gpTs', 'Temperatura de salida', '°C', '180')}
              ${U.field('gpTa', 'Temperatura ambiente', '°C', '18')}
            </div>
          </section>
          <section class="panel">
            <div class="panel-title">Meteorología y receptor</div>
            <div class="grid-3">
              ${U.field('gpU', 'Velocidad del viento', 'm/s', '3.0')}
              ${U.select('gpStab', 'Clase de estabilidad', D.briggs.stability, 'D')}
              ${U.field('gpZ', 'Altura del receptor', 'm', '1.5')}
              ${U.field('gpX', 'Distancia del receptor', 'm', '800')}
              ${U.field('gpMax', 'Distancia máxima evaluada', 'km', '5')}
              ${U.field('gpLimit', 'Límite de referencia', 'µg/m³', '150', { q: 'Valor normativo o de referencia para comparar la concentración máxima.' })}
            </div>
            <div class="note" style="margin-top:10px">Clases: A muy inestable (fuerte radiación, viento débil) a F estable (noche despejada). Use la clase que domine el período crítico de interés.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado <span class="tag" id="gpStabTag">CLASE D</span></div>
            <div class="metrics">
              ${U.metric('gpCmax', 'Concentración máxima', 'µg/m³', true)}
              ${U.metric('gpXmax', 'Distancia del máximo', 'm')}
              ${U.metric('gpCx', 'Concentración en el receptor', 'µg/m³')}
              ${U.metric('gpPct', 'Porcentaje del límite', '%')}
              ${U.metric('gpDh', 'Ascenso de pluma', 'm')}
              ${U.metric('gpH', 'Altura efectiva', 'm')}
              ${U.metric('gpSy', 'σy', 'm')}
              ${U.metric('gpSz', 'σz', 'm')}
            </div>
            <div class="chart-wrap tall" style="margin-top:16px"><canvas id="gpChart"></canvas></div>
            <div class="chart-legend"><span><i style="background:#66C7E8"></i>Concentración a nivel de suelo</span><span><i style="background:#F2B45A"></i>Límite de referencia</span></div>
            <div id="gpVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Limitaciones del modelo</div>
            <div class="note warn"><b>Modelo de cribado.</b> Supone flujo uniforme, terreno plano, emisión continua y estabilidad constante. Válido como referencia entre 100 m y 10 km de la fuente; fuera de ese rango la extrapolación no es defendible. No representa edificios, valles, inversiones térmicas ni química atmosférica. Para permisos use AERMOD, CALPUFF o equivalente validado.</div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T15;
      function update() {
        const Qem = Math.max(0, num('gpQ', 2.5));
        const hs = Math.max(1, num('gpHs', 25));
        const dd = Math.max(0.05, num('gpD', 1));
        const Vs = Math.max(0.1, num('gpVs', 14));
        const Ts = num('gpTs', 180) + 273.15;
        const Ta = num('gpTa', 18) + 273.15;
        const u = Math.max(0.3, num('gpU', 3));
        const stab = root.querySelector('#gpStab').value;
        const z = Math.max(0, num('gpZ', 1.5));
        const xrRaw = num('gpX', 800);
        const maxRaw = num('gpMax', 5);
        // El modelo gaussiano de cribado se limita a 100 m – 10 km.
        const xr = GL.clamp(xrRaw, 100, 10000);
        const maxKm = GL.clamp(maxRaw, 0.1, 10);
        const rangeWarn = (xrRaw < 100 || xrRaw > 10000 || maxRaw < 0.1 || maxRaw > 10)
          ? ` Distancia fuera del rango recomendado (100 m – 10 km): se evaluó ${fmt(xr, 0)} m y ${fmt(maxKm, 1)} km.`
          : '';
        const limit = Math.max(0, num('gpLimit', 150));

        const Fb = 9.81 * Vs * dd * dd * (Ts - Ta) / (4 * Ts);
        const sig = D.briggs.sigma[stab] || D.briggs.sigma.D;

        function riseAt(x) {
          if (stab === 'E' || stab === 'F') {
            const S = 9.81 / Ta * (stab === 'E' ? 0.02 : 0.035);
            return 2.6 * Math.pow(Math.max(0, Fb) / (u * S) + 1e-9, 1 / 3);
          }
          let dhB = 0;
          if (Fb > 0) {
            const xstar = Fb >= 55 ? 34 * Math.pow(Fb, 0.4) : 14 * Math.pow(Fb, 0.625);
            dhB = 1.6 * Math.pow(Fb, 1 / 3) * Math.pow(Math.min(x, xstar), 2 / 3) / u;
          }
          const dhM = 3 * Vs * dd / u;
          return Fb < 1 ? Math.max(dhB, dhM) : Math.max(dhB, dhM * 0.5);
        }
        function concAt(x) {
          const dh = riseAt(x);
          const H = hs + dh;
          const sy = Math.max(1, sig.y(x));
          const sz = Math.max(1, sig.z(x));
          const c = Qem / (2 * Math.PI * u * sy * sz) *
            (Math.exp(-Math.pow(z - H, 2) / (2 * sz * sz)) + Math.exp(-Math.pow(z + H, 2) / (2 * sz * sz)));
          return { c: c * 1e6, dh, H, sy, sz };
        }
        const atR = concAt(xr);
        let cmax = 0, xmax = 0;
        const curve = [];
        const step = Math.max(10, maxKm * 1000 / 240);
        for (let x = step; x <= maxKm * 1000 + 1; x += step) {
          const cc = concAt(x).c;
          curve.push([x / 1000, cc]);
          if (cc > cmax) { cmax = cc; xmax = x; }
        }
        const pct = limit ? cmax / limit * 100 : 0;

        GL.out('gpCmax', fmt(cmax, 2));
        GL.out('gpXmax', fmt(xmax, 0));
        GL.out('gpCx', fmt(atR.c, 2));
        GL.out('gpPct', fmt(pct, 0));
        GL.out('gpDh', fmt(atR.dh, 1));
        GL.out('gpH', fmt(atR.H, 1));
        GL.out('gpSy', fmt(atR.sy, 1));
        GL.out('gpSz', fmt(atR.sz, 1));
        root.querySelector('#gpStabTag').textContent = 'CLASE ' + stab;

        GL.chart(root.querySelector('#gpChart'), {
          series: [{ name: 'Concentración', data: curve, color: '#66C7E8', fill: true, points: false }],
          x: { label: 'Distancia a sotavento (km)' }, y: { label: 'Concentración (µg/m³)', min: 0, zero: true },
          rules: limit ? [{ y: limit, label: 'límite ' + fmt(limit, 0), color: '#F2B45A' }] : []
        });

        const tone = cmax > limit ? 'bad' : cmax > limit * 0.5 ? 'warn' : 'ok';
        GL.setVerdict('gpVerdict', tone,
          cmax > limit ? 'El máximo supera el límite de referencia' : cmax > limit * 0.5 ? 'El máximo se acerca al límite' : 'Concentraciones por debajo del límite',
          `Máximo ${fmt(cmax, 2)} µg/m³ a ${fmt(xmax, 0)} m (${fmt(pct, 0)} % del límite). En el receptor (${fmt(xr, 0)} m): ${fmt(atR.c, 2)} µg/m³. Ascenso de pluma ${fmt(atR.dh, 1)} m y altura efectiva ${fmt(atR.H, 1)} m. Clase de estabilidad ${stab}.${rangeWarn} ${tone !== 'ok' ? 'Evalúe reducción de emisión, aumento de altura o cambio de escenario meteorológico.' : 'Mantenga el control de emisiones y verifique con monitoreo.'}`);

        T._report = {
          title: 'Dispersión atmosférica de pluma gaussiana (cribado)',
          subtitle: `Emisión ${fmt(Qem, 2)} g/s · chimenea ${fmt(hs, 0)} m · clase ${stab} · u ${fmt(u, 1)} m/s`,
          inputs: [
            ['Tasa de emisión', fmt(Qem, 2) + ' g/s'], ['Altura de chimenea', fmt(hs, 1) + ' m'], ['Diámetro', fmt(dd, 2) + ' m'],
            ['Velocidad de salida', fmt(Vs, 1) + ' m/s'], ['T salida', fmt(Ts - 273.15, 0) + ' °C'], ['T ambiente', fmt(Ta - 273.15, 0) + ' °C'],
            ['Viento', fmt(u, 1) + ' m/s'], ['Estabilidad', stab], ['Receptor', fmt(xr, 0) + ' m a ' + fmt(z, 1) + ' m']
          ],
          results: [
            ['Concentración máxima', fmt(cmax, 2), 'µg/m³'], ['Distancia del máximo', fmt(xmax, 0), 'm'], ['Concentración en el receptor', fmt(atR.c, 2), 'µg/m³'],
            ['Porcentaje del límite', fmt(pct, 0), '%'], ['Ascenso de pluma', fmt(atR.dh, 1), 'm'], ['Altura efectiva', fmt(atR.H, 1), 'm'],
            ['σy en el receptor', fmt(atR.sy, 1), 'm'], ['σz en el receptor', fmt(atR.sz, 1), 'm']
          ],
          notes: [
            'Modelo gaussiano de cribado con coeficientes rurales de Pasquill–Gifford/Briggs y ascenso de pluma de Briggs.',
            'Rango recomendado: 100 m a 10 km desde la fuente. Los resultados fuera de ese rango se muestran solo como referencia y no deben usarse para decisiones de cumplimiento.',
            'Supone emisión continua, terreno plano, sin obstáculos y estabilidad homogénea. No representa edificios, valles ni química atmosférica.',
            'No reemplaza un modelo regulatorio validado (AERMOD, CALPUFF) para estudios de impacto, permisos o cumplimiento normativo.',
            'La comparación con el límite es referencial; el promedio normativo (24 h, anual) y la frecuencia de excedencia requieren modelado horario.'
          ],
          method: '<p>C(x,z) = Q/(2π·u·σy·σz) · [exp(−(z−H)²/2σz²) + exp(−(z+H)²/2σz²)]. H = hs + Δh. Δh de Briggs según estabilidad y flujo de flotación Fb = g·Vs·D²·(Ts−Ta)/(4Ts). σy, σz de Pasquill–Gifford (Briggs, rural).</p>'
        };
        T._csv = curve.map(c => ({ distancia_km: +c[0].toFixed(3), concentracion_ug_m3: +c[1].toFixed(4) }));
      }
      root.querySelector('#gpStab').addEventListener('change', update);
      GL.bindCalc(root, ['gpQ', 'gpHs', 'gpD', 'gpVs', 'gpTs', 'gpTa', 'gpU', 'gpZ', 'gpX', 'gpMax', 'gpLimit'], update);
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_dispersion_gaussiana.csv', this._csv); }
  };
  GL.tool(T15);

  /* ======================================================================
     16 · CALIDAD DEL AIRE — ICA / AQI
     ====================================================================== */
  const T16 = {
    id: 'air-quality-index',
    suite: 'air',
    title: 'Calidad del aire · ECA Perú, OMS y AQI de partículas',
    desc: 'Contrasta concentraciones con el ECA peruano y las guías OMS por período compatible. Calcula el AQI diario EPA para PM₂,₅ y PM₁₀.',
    tags: ['AQI', 'ECA Perú', 'OMS'],
    keywords: 'calidad aire ica aqi pm25 pm10 so2 no2 o3 co eca oms excedencia',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel"><div class="panel-head"><div><h2>Concentraciones medidas</h2><p>Deja en blanco los datos que no tengas. Ingresa los promedios del período indicado.</p></div></div>
            <div class="grid-3">
              ${U.field('aqPM25','PM₂,₅ (24 h)','µg/m³','38')}
              ${U.field('aqPM10','PM₁₀ (24 h)','µg/m³','72')}
              ${U.field('aqSO2','SO₂ (24 h)','µg/m³','18')}
              ${U.field('aqNO2','NO₂ (24 h) · OMS','µg/m³','34')}
              ${U.field('aqNO2Hour','NO₂ (1 h) · ECA','µg/m³','')}
              ${U.field('aqO3','O₃ (8 h)','µg/m³','62')}
              ${U.field('aqCO','CO (24 h) · OMS','mg/m³','1.8')}
              ${U.field('aqCO8Hour','CO (8 h) · ECA','mg/m³','')}
            </div>
            <div class="grid-3" style="margin-top:10px">
              ${U.field('aqDays','Días válidos de PM₂,₅','d','30')}
              ${U.field('aqExceed','Días válidos con PM₂,₅ sobre ECA','d','11')}
              ${U.field('aqAnnual','Promedio anual de PM₂,₅','µg/m³','26')}
            </div>
          </section>
          <section class="panel"><div class="panel-title">Comparación por período</div>
            <div class="table-wrap"><table><thead><tr><th>Parámetro</th><th>Medido</th><th>ECA Perú</th><th>% ECA</th><th>Guía OMS</th><th>% OMS</th></tr></thead><tbody id="aqTable"></tbody></table></div>
            <div class="note" style="margin-top:10px">Concentraciones en µg/m³ en esta tabla. Una comparación puntual requiere evaluar por separado representatividad, estadístico y frecuencia de excedencias del Anexo del D.S. 003-2017-MINAM.</div>
          </section>
        </div>
        <div class="stack"><section class="panel">
          <div class="panel-title">AQI diario EPA · partículas</div>
          <div class="metrics">
            ${U.metric('aqICA','AQI de partículas','AQI',true)}
            ${U.metric('aqCat','Categoría EPA','')}
            ${U.metric('aqDom','Partícula dominante','')}
            ${U.metric('aqP25','PM₂,₅ / ECA 24 h','%')}
            ${U.metric('aqAnnualPct','PM₂,₅ anual / guía OMS','%')}
            ${U.metric('aqExcPct','Días válidos sobre ECA PM₂,₅','%')}
          </div>
          <div class="chart-wrap" style="margin-top:16px"><canvas id="aqChart"></canvas></div>
          <div id="aqVerdict" class="verdict info"></div>
          <div class="note" style="margin-top:10px"><a href="#/tool/epa-air-quality-index">Abrir AQI EPA de todos los contaminantes →</a></div>
        </section></div>
      </div>`;
    },
    mount(root) {
      const fields=['aqPM25','aqPM10','aqSO2','aqNO2','aqNO2Hour','aqO3','aqCO','aqCO8Hour','aqDays','aqExceed','aqAnnual'];
      const standards=Object.fromEntries(D.ecaAire.params.map(p=>[p.id,p.limit]));
      const percentile=(value,reference)=>value===null||reference===null?null:100*value/reference;
      const showPercent=n=>n===null?'—':fmt(n,1)+' %';
      const sources=[
        'Perú · D.S. 003-2017-MINAM, Anexo: https://www.digesa.minsa.gob.pe/norma_consulta/DS-003-2017-MINAM.pdf',
        'OMS · Guías mundiales de calidad del aire, 2021: https://www.who.int/publications/i/item/9789240034228/',
        'EPA · AQI diario, guía técnica de mayo de 2026: https://www.airnow.gov/publications/air-quality-index/technical-assistance-document-for-reporting-the-daily-aqi/'
      ];
      function read(id,scale=1){
        const input=root.querySelector('#'+id), raw=input.value.trim();
        if(!raw)return null;
        try{
          const value=GL.lab.number(raw)*scale;
          if(!Number.isFinite(value)||value<0)throw new Error();
          return value;
        }catch{
          throw new Error((input.closest('.field')?.querySelector('label,span')?.textContent.trim()||id)+' requiere un número no negativo.');
        }
      }
      function update() {
        T16._report=null;
        T16._csv=null;
        try{
          const p25=read('aqPM25'), p10=read('aqPM10');
          const days=read('aqDays'), exceed=read('aqExceed'), annual=read('aqAnnual');
          const haveCounts=days!==null&&exceed!==null;
          if((days!==null&&(!Number.isInteger(days)||days<1))||(exceed!==null&&!Number.isInteger(exceed))||(haveCounts&&exceed>days)){
            throw new Error('Usa días enteros, al menos un día válido y un número de excedencias menor o igual a los días válidos.');
          }
          const params=[
            ['PM₂,₅ (24 h)',p25,standards.pm25,D.aqiPM25.who24],
            ['PM₁₀ (24 h)',p10,standards.pm10,45],
            ['SO₂ (24 h)',read('aqSO2'),standards.so2,40],
            ['NO₂ (24 h)',read('aqNO2'),null,25],
            ['NO₂ (1 h)',read('aqNO2Hour'),standards.no2,null],
            ['O₃ (8 h)',read('aqO3'),standards.o3,100],
            ['CO (24 h)',read('aqCO',1000),null,4000],
            ['CO (8 h)',read('aqCO8Hour',1000),standards.co,null],
            ['PM₂,₅ (anual)',annual,25,D.aqiPM25.whoAnnual]
          ].map(([label,value,eca,who])=>({label,value,eca,who,pe:percentile(value,eca),pw:percentile(value,who)}));
          const toText=n=>n===null?'':String(n);
          const inputs={pm25:toText(p25),pm10:toText(p10),o8:'',o1:'',co:'',no2:'',so1:'',so24:''};
          const index=p25===null&&p10===null?null:GL.getTool('epa-air-quality-index').lab.calc(inputs);
          const [aqi,category,dominant]=index?index.metrics.map(m=>m[1]):[null,'Sin datos','—'];
          const relative=params[0].pe, annualRelative=params.at(-1).pw, frequency=haveCounts?100*exceed/days:null;
          const metrics=[
            ['aqICA',fmt(aqi,0)],['aqCat',category],['aqDom',dominant],
            ['aqP25',showPercent(relative)],['aqAnnualPct',showPercent(annualRelative)],['aqExcPct',showPercent(frequency)]
          ];
          metrics.forEach(([id,value])=>GL.out(id,value));
          const table=params.map(p=>`<tr><td class="name">${p.label}</td><td class="num">${fmt(p.value,2)}</td><td class="num">${fmt(p.eca,0)}</td><td class="num">${showPercent(p.pe)}</td><td class="num">${fmt(p.who,0)}</td><td class="num">${showPercent(p.pw)}</td></tr>`).join('');
          root.querySelector('#aqTable').innerHTML=table;
          const chart=root.querySelector('#aqChart');
          const bars=params.filter(p=>p.pe!==null).map(p=>[p.label,p.pe]);
          chart.hidden=!bars.length;
          if(bars.length)GL.chart(chart,{type:'bar',series:[{name:'% ECA',data:bars,color:'#66C7E8'}],
            y:{label:'% del ECA',zero:true},rules:[{y:100,label:'ECA',color:'#F2B45A'}]});
          const n=params.filter(p=>p.pe!==null&&p.pe>100).length;
          GL.setVerdict('aqVerdict',n?'warn':'info',n?n+' comparaciones puntuales sobre el valor ECA':'Comparación por período',
            'El AQI EPA usa solo los datos de partículas disponibles. Evalúa los criterios de frecuencia y los métodos del Anexo para una conclusión de cumplimiento.');
          if(!params.some(p=>p.value!==null)&&!haveCounts)return;
          T16._report={
            title:'Calidad del aire · ECA Perú, OMS y AQI de partículas',
            inputs:params.map(p=>[p.label,p.value===null?'Sin dato':fmt(p.value,3)+' µg/m³']).concat([['Días válidos',fmt(days,0)],['Días sobre ECA PM₂,₅',fmt(exceed,0)]]),
            results:[['AQI diario EPA · partículas',fmt(aqi,0),''],['Categoría EPA',category,''],['Partícula dominante',dominant,''],
              ['PM₂,₅ / ECA 24 h',fmt(relative,2),'%'],['Días válidos sobre ECA PM₂,₅',fmt(frequency,2),'%']],
            extra:'<table><thead><tr><th>Parámetro</th><th>Medido (µg/m³)</th><th>ECA</th><th>% ECA</th><th>OMS</th><th>% OMS</th></tr></thead><tbody>'+table+'</tbody></table>',
            notes:[...sources,'La comparación puntual no resuelve representatividad ni frecuencia permitida. El AQI EPA es distinto del INCA peruano (R.M. 181-2016-MINAM).'],
            method:'Se divide la concentración por el valor de referencia del mismo período y se multiplica por 100. AQI EPA: máximo de los subíndices de partículas con truncamiento previo e interpolación por tramos.'
          };
          T16._csv=params.map(p=>({parametro:p.label,medido:p.value,eca:p.eca,porcentaje_eca:p.pe,oms:p.who,porcentaje_oms:p.pw,
            ica:p.label===params[0].label?index?.rows[0][3]??null:p.label===params[1].label?index?.rows[1][3]??null:null,unidad:'µg/m³'}));
        }catch(error){
          ['aqICA','aqCat','aqDom','aqP25','aqAnnualPct','aqExcPct'].forEach(id=>GL.out(id,'—'));
          root.querySelector('#aqChart').hidden=true;
          root.querySelector('#aqTable').innerHTML='';
          GL.setVerdict('aqVerdict','warn','Revisa las entradas',esc(error.message));
        }
      }
      GL.bindCalc(root,fields,update);
      update();
      T16._refresh=update;
    },
    report() { this._refresh?.(); return this._report; },
    csv() { this._refresh?.(); if (this._csv) GL.csvDownload('GOL_calidad_aire_ICA.csv', this._csv); }
  };
  GL.tool(T16);

  /* ======================================================================
     17 · VERIFICACIÓN DE AHORROS DE ENERGÍA (IPMVP OPCIÓN C)
     ====================================================================== */
  const T17 = {
    id: 'energy-savings-ipmvp',
    suite: 'air',
    storeKeys: ['ip.base', 'ip.rep'],
    title: 'Verificación de ahorros de energía (IPMVP C)',
    desc: 'Ajuste un modelo de línea base energía–producción, prediga el consumo del período de reporte, calcule el ahorro evitado y su incertidumbre estadística (CV(RMSE), t de Student).',
    tags: ['ISO 50001', 'IPMVP', 'Ahorros', 'Regresión'],
    keywords: 'iso 50001 ipmvp linea base ahorro energia regresion cv rmse incertidumbre m&v verificacion',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Período de línea base</h2><p>Producción y consumo del período anterior a la medida de eficiencia.</p></div><span class="mono" id="ipBaseCount">12 meses</span></div>
            <div class="table-wrap" style="max-height:260px"><table><thead><tr><th>Mes</th><th class="num">Producción</th><th class="num">Energía</th><th></th></tr></thead><tbody id="ipBase"></tbody></table></div>
            <div class="btn-row"><button class="btn sm" id="ipBaseAdd" type="button">+ Fila</button><button class="btn sm" id="ipBaseFill" type="button">Datos demo</button></div>
          </section>
          <section class="panel">
            <div class="panel-head"><div><h2>Período de reporte</h2><p>Mismos períodos tras la medida; idealmente misma estacionalidad.</p></div><span class="mono" id="ipRepCount">12 meses</span></div>
            <div class="table-wrap" style="max-height:260px"><table><thead><tr><th>Mes</th><th class="num">Producción</th><th class="num">Energía</th><th></th></tr></thead><tbody id="ipRep"></tbody></table></div>
            <div class="btn-row"><button class="btn sm" id="ipRepAdd" type="button">+ Fila</button><button class="btn sm" id="ipRepFill" type="button">Datos demo</button></div>
            <div class="grid-3" style="margin-top:12px">
              ${U.field('ipTariff', 'Tarifa de energía', 'S/ /kWh', '0.55')}
              ${U.field('ipCost', 'Costo de la medida (opcional)', 'S/', '0')}
              ${U.field('ipConf', 'Nivel de confianza', '%', '95')}
            </div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado <span class="tag" id="ipTag">REGRESIÓN LINEAL</span></div>
            <div class="metrics">
              ${U.metric('ipSave', 'Ahorro ajustado', 'kWh', true)}
              ${U.metric('ipSavePct', 'Ahorro relativo', '%')}
              ${U.metric('ipPred', 'Consumo predicho', 'kWh')}
              ${U.metric('ipActual', 'Consumo real', 'kWh')}
              ${U.metric('ipSlope', 'Pendiente', 'kWh / unidad')}
              ${U.metric('ipR2', 'R² del modelo base', '')}
              ${U.metric('ipCV', 'CV(RMSE)', '%')}
              ${U.metric('ipUnc', 'Incertidumbre (±)', 'kWh')}
              ${U.metric('ipFSU', 'FSU (incertidumbre/ahorro)', '%')}
              ${U.metric('ipMoney', 'Valor del ahorro', 'S/ /año')}
            </div>
            <div class="chart-wrap tall" style="margin-top:16px"><canvas id="ipChart"></canvas></div>
            <div class="chart-wrap short" style="margin-top:10px"><canvas id="ipBar"></canvas></div>
            <div id="ipVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Ahorros por período</div>
            <div class="table-wrap" style="max-height:240px"><table><thead><tr><th>Mes</th><th class="num">Predicho</th><th class="num">Real</th><th class="num">Ahorro</th></tr></thead><tbody id="ipSaves">—</tbody></table></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T17;
      function demoBase() {
        let x = 1200;
        return Array.from({ length: 12 }, () => { const p = Math.round(x); x *= 1 + (Math.random() - 0.35) * 0.05; return { p, e: Math.round(180000 + 42 * p + (Math.random() - 0.5) * 9000) }; });
      }
      function demoRep() {
        let x = 1240;
        return Array.from({ length: 12 }, () => { const p = Math.round(x); x *= 1 + (Math.random() - 0.35) * 0.05; return { p, e: Math.round(180000 + 42 * p - 26000 + (Math.random() - 0.5) * 9000) }; });
      }
      let base = GL.store.get('ip.base', null);
      let rep = GL.store.get('ip.rep', null);
      if (!Array.isArray(base) || base.length < 3) base = demoBase();
      if (!Array.isArray(rep) || rep.length < 1) rep = demoRep();

      function render() {
        root.querySelector('#ipBase').innerHTML = base.map((r, i) => U.trow([{ k: 'p', v: r.p }, { k: 'e', v: r.e }], i, base.length <= 3)).map((h, i) => h.replace('<tr>', `<tr><td class="name">${i + 1}</td>`)).join('');
        root.querySelector('#ipRep').innerHTML = rep.map((r, i) => U.trow([{ k: 'p', v: r.p }, { k: 'e', v: r.e }], i, rep.length <= 1)).map((h, i) => h.replace('<tr>', `<tr><td class="name">${i + 1}</td>`)).join('');
        root.querySelector('#ipBaseCount').textContent = base.length + ' meses';
        root.querySelector('#ipRepCount').textContent = rep.length + ' meses';
      }
      function read() {
        const rb = [], rr = [];
        root.querySelectorAll('#ipBase input').forEach(inp => { const i = +inp.dataset.i; rb[i] = rb[i] || Object.assign({}, base[i]); rb[i][inp.dataset.k] = num(inp, 0); });
        root.querySelectorAll('#ipRep input').forEach(inp => { const i = +inp.dataset.i; rr[i] = rr[i] || Object.assign({}, rep[i]); rr[i][inp.dataset.k] = num(inp, 0); });
        base = rb.filter(Boolean); rep = rr.filter(Boolean);
        GL.store.set('ip.base', base); GL.store.set('ip.rep', rep);
      }
      root.addEventListener('input', e => { if (e.target.closest('#ipBase') || e.target.closest('#ipRep')) { read(); update(); } });
      root.addEventListener('click', e => {
        const del = e.target.closest('#ipBase [data-del], #ipRep [data-del]');
        if (!del) return;
        const i = +del.dataset.del;
        if (del.closest('#ipBase')) { read(); base.splice(i, 1); } else { read(); rep.splice(i, 1); }
        GL.store.set('ip.base', base); GL.store.set('ip.rep', rep); render(); update();
      });
      root.querySelector('#ipBaseAdd').addEventListener('click', () => { read(); const l = base[base.length - 1] || { p: 1000, e: 200000 }; base.push({ p: l.p, e: l.e }); GL.store.set('ip.base', base); render(); update(); });
      root.querySelector('#ipRepAdd').addEventListener('click', () => { read(); const l = rep[rep.length - 1] || { p: 1000, e: 200000 }; rep.push({ p: l.p, e: l.e }); GL.store.set('ip.rep', rep); render(); update(); });
      root.querySelector('#ipBaseFill').addEventListener('click', () => { base = demoBase(); GL.store.set('ip.base', base); render(); update(); });
      root.querySelector('#ipRepFill').addEventListener('click', () => { rep = demoRep(); GL.store.set('ip.rep', rep); render(); update(); });

      function update() {
        const tariff = Math.max(0, num('ipTariff', 0.55));
        const cost = Math.max(0, num('ipCost', 0));
        const conf = +root.querySelector('#ipConf') ? num('ipConf', 95) : 95;
        const bx = base.map(r => r.p), by = base.map(r => r.e);
        const model = GL.stat.ols(bx.map(x => [x]), by);
        if (!model || base.length < 3) {
          GL.out('ipSave', '—'); GL.out('ipSavePct', '—'); GL.out('ipPred', '—'); GL.out('ipActual', '—');
          GL.out('ipSlope', '—'); GL.out('ipR2', '—'); GL.out('ipCV', '—'); GL.out('ipUnc', '—'); GL.out('ipFSU', '—'); GL.out('ipMoney', '—');
          GL.setVerdict('ipVerdict', 'warn', 'Datos insuficientes', 'Ingrese al menos 3 filas válidas en la línea base.');
          return;
        }
        const b0 = model.beta[0], b1 = model.beta[1];
        const rows = rep.map(r => {
          const pred = b0 + b1 * r.p;
          return { p: r.p, e: r.e, pred, save: pred - r.e };
        }).filter(r => isFinite(r.pred) && isFinite(r.e));
        const pred = rows.reduce((s, r) => s + r.pred, 0);
        const actual = rows.reduce((s, r) => s + r.e, 0);
        const save = pred - actual;
        const savePct = pred ? save / pred * 100 : 0;
        const m = rows.length;
        const rmse = model.rmse;
        const cv = model.cvrmse;
        const xbar = GL.stat.mean(bx);
        const sxx = bx.reduce((s, x) => s + (x - xbar) ** 2, 0);
        const xpr = m ? GL.stat.mean(rows.map(r => r.p)) : 0;
        const n = base.length;
        const df = n - 2;
        const t = conf >= 99 ? (df >= 60 ? 2.66 : 2.9) : conf >= 90 ? (df >= 60 ? 1.67 : 1.8) : GL.stat.t95(df);
        const varPred = m * rmse * rmse * (1 + 1 / n + (xpr - xbar) ** 2 / (sxx || 1));
        const unc = t * Math.sqrt(varPred);
        const fsu = save !== 0 ? unc / Math.abs(save) * 100 : 0;
        const money = save * tariff;

        GL.out('ipSave', fmt(save, 0));
        GL.out('ipSavePct', GL.signed(savePct, 1) + ' %');
        GL.out('ipPred', fmt(pred, 0));
        GL.out('ipActual', fmt(actual, 0));
        GL.out('ipSlope', fmt(b1, 2));
        GL.out('ipR2', fmt(model.r2, 3));
        GL.out('ipCV', fmt(cv, 1) + ' %');
        GL.out('ipUnc', fmt(unc, 0));
        GL.out('ipFSU', fmt(fsu, 0) + ' %');
        GL.out('ipMoney', fmt(money, 0));

        const lineMin = Math.min.apply(null, bx), lineMax = Math.max.apply(null, bx.concat(rows.map(r => r.p)));
        GL.chart(root.querySelector('#ipChart'), {
          series: [
            { name: 'Línea base', type: 'scatter', points: true, color: '#66C7E8', r: 3, data: bx.map((x, i) => [x, by[i]]) },
            { name: 'Modelo', data: [[lineMin, b0 + b1 * lineMin], [lineMax, b0 + b1 * lineMax]], color: '#F2B45A', points: false, width: 2 },
            { name: 'Reporte', type: 'scatter', points: true, color: '#5FE3A1', r: 3.4, data: rows.map(r => [r.p, r.e]) }
          ],
          x: { label: 'Producción del período' }, y: { label: 'Energía (kWh)', zero: true }
        });
        GL.chart(root.querySelector('#ipBar'), {
          type: 'bar',
          series: [{ name: 'kWh', data: [['Predicho', pred], ['Real', actual], ['Ahorro', Math.max(0, save)]], color: '#5FE3A1' }],
          y: { label: 'Energía (kWh)', zero: true, min: 0 }
        });

        root.querySelector('#ipSaves').innerHTML = rows.map((r, i) => `<tr><td class="name">${i + 1}</td><td class="num">${fmt(r.pred, 0)}</td><td class="num">${fmt(r.e, 0)}</td><td class="num">${GL.signed(r.save, 0)}</td></tr>`).join('');

        const sig = Math.abs(save) > unc;
        const tone = !rows.length ? 'warn' : sig ? (save > 0 ? 'ok' : 'bad') : 'warn';
        GL.setVerdict('ipVerdict', tone,
          !rows.length ? 'Sin período de reporte' : sig ? (save > 0 ? 'Ahorro estadísticamente significativo' : 'Aumento de consumo significativo') : 'Ahorro no distinguible del ruido',
          `Ahorro ajustado ${GL.signed(save, 0)} kWh (${GL.signed(savePct, 1)} %), incertidumbre ±${fmt(unc, 0)} kWh (FSU ${fmt(fsu, 0)} %). Modelo base R² = ${fmt(model.r2, 3)}, CV(RMSE) = ${fmt(cv, 1)} %. ${cv > 20 ? 'El CV(RMSE) supera el 20 %: el modelo base explica poco y el ahorro es poco confiable.' : 'Modelo base aceptable.'} ${sig ? 'El ahorro supera la incertidumbre; puede reportarse como evitado.' : 'El ahorro no supera la incertidumbre estadística; amplíe el período o mejore el modelo.'}`);

        T._report = {
          title: 'Verificación de ahorros de energía (IPMVP Opción C)',
          subtitle: `Línea base ${n} períodos · reporte ${m} períodos · regresión lineal energía–producción`,
          inputs: [
            ['Períodos de línea base', n], ['Períodos de reporte', m], ['Tarifa', fmt(tariff, 2) + ' S//kWh'],
            ['Costo de la medida', cost ? fmt(cost, 0) + ' S/' : '—'], ['Nivel de confianza', fmt(conf, 0) + ' %']
          ],
          results: [
            ['Ahorro ajustado', GL.signed(save, 0), 'kWh'], ['Ahorro relativo', GL.signed(savePct, 1), '%'],
            ['Consumo predicho', fmt(pred, 0), 'kWh'], ['Consumo real', fmt(actual, 0), 'kWh'],
            ['Pendiente', fmt(b1, 3), 'kWh/unidad'], ['R²', fmt(model.r2, 3), ''],
            ['CV(RMSE)', fmt(cv, 1), '%'], ['Incertidumbre (±)', fmt(unc, 0), 'kWh'], ['FSU', fmt(fsu, 0), '%'], ['Valor', fmt(money, 0), 'S/']
          ],
          extra: `<table><thead><tr><th>Período</th><th>Producción</th><th>Predicho</th><th>Real</th><th>Ahorro</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${fmt(r.p, 0)}</td><td>${fmt(r.pred, 0)}</td><td>${fmt(r.e, 0)}</td><td>${GL.signed(r.save, 0)}</td></tr>`).join('')}</tbody></table>`,
          notes: [
            'Modelo de regresión lineal simple con corrección por producción (variable independiente). IPMVP Opción C mide el ahorro a nivel de planta completa.',
            'La incertidumbre combina el error residual del modelo y el error de predicción; se reporta como incertidumbre de la suma del período de reporte.',
            'Un CV(RMSE) alto, la falta de factores relevantes (clima, ocupación, turnos) o cambios de límites invalidan la comparación. Documente el plan de M&V.',
            'El ahorro ajustado no es atribuible por sí solo a la medida si hubo cambios simultáneos de operación, producción o uso final.'
          ],
          method: '<p>Modelo base: E = β₀ + β₁·Producción (mínimos cuadrados). Ahorro = Σ(E_predicho − E_real) en el período de reporte. Incertidumbre = t · RMSE · √(m·(1 + 1/n + (x̄p − x̄b)²/Sxx)). CV(RMSE) = RMSE/media basal. FSU = incertidumbre/ahorro.</p>'
        };
        T._csv = rows.map((r, i) => ({ periodo: i + 1, produccion: r.p, energia_predicha: +r.pred.toFixed(1), energia_real: r.e, ahorro: +r.save.toFixed(1) }));
      }
      root.querySelector('#ipConf').addEventListener('change', update);
      render();
      GL.bindCalc(root, ['ipTariff', 'ipCost'], update);
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_ahorros_energia_IPMVP.csv', this._csv); }
  };
  GL.tool(T17);
})();
