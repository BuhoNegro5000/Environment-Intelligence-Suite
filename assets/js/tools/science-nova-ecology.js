/* Modelos de ecología aplicada, acuicultura y suelo. */
(function () {
  'use strict';
  const L=GL.lab,{register:R,f,pct,table,check,plot,nn}=GL.nova;
  R('fishway-hydraulic-screen','fish-passage-velocity-barrier','ecology','Paso de peces · velocidad, potencia disipada y descansos',
    [f('drop','Desnivel por estanque','m',.16,.001),f('pools','Cantidad de escalones','',12,1,1000),
      f('flow','Caudal de paso','m³/s',.28,.001),f('volume','Volumen útil por estanque','m³',5.5,.001),
      f('opening','Sección mojada del paso','m²',.21,.001),f('velocity','Umbral de velocidad para especie y talla','m/s',1.7,.001),
      f('power','Umbral de potencia disipada por volumen','W/m³',120,.001)],
    'Se comparan Q/A y la velocidad ideal de chorro √(2gΔh). Potencia volumétrica por estanque = ρgQΔh/V.',
    'Usa umbrales sustentados para especie, talla, temperatura y duración del paso. Chorro ideal y velocidad media son indicadores distintos. Valida turbulencia, profundidad, caudal de atracción y refugios.',
    v=>{
      L.assert(Number.isInteger(v.pools),'La cantidad de escalones debe ser entera.');
      const g=9.80665, jet=Math.sqrt(2*g*v.drop), bulk=v.flow/v.opening, density=1000*g*v.flow*v.drop/v.volume;
      return {metrics:[['Velocidad ideal del chorro',jet,'m/s'],['Velocidad media en la abertura',bulk,'m/s'],
        ['Potencia disipada por volumen',density,'W/m³'],['Desnivel acumulado',v.pools*v.drop,'m'],
        ['Mayor velocidad respecto al umbral',100*Math.max(jet,bulk)/v.velocity,'%'],['Potencia respecto al umbral',100*density/v.power,'%']],
        message:Math.max(jet,bulk)>v.velocity||density>v.power?'Se supera al menos un umbral de cribado.':'Los indicadores calculados se encuentran dentro de los umbrales ingresados.'};
    });

  R('pond-aerator-oxygen-balance','fish-pond-aerator-dissolved-oxygen','ecology','Estanque acuícola · balance de oxígeno y potencia de aireación',
    [f('area','Área del estanque','m²',800,.01),f('depth','Profundidad media','m',1.4,.01),
      f('biomass','Biomasa de peces','kg',1800),f('respiration','Consumo específico de peces','g O₂/kg·h',.32),
      f('background','Demanda de sedimento y otros procesos','kg O₂/h',.5),
      f('initial','Oxígeno disuelto al inicio','mg/L',6.2),f('target','Oxígeno mínimo objetivo','mg/L',4.8),
      f('power','Potencia eléctrica instalada','kW',1.1),
      f('transfer','Transferencia neta a condiciones de campo','kg O₂/kWh',.8,.001),
      f('hours','Horas del período evaluado','h',9,.01,168)],
    'Demanda = biomasa × respiración + demanda de fondo. Transferencia = potencia × eficiencia de campo. El cambio de OD deriva de la diferencia acumulada y el volumen.',
    'Balance nocturno de tasa constante para un estanque mezclado. Usa transferencia a OD y temperatura representativos. Si la recta predice agotamiento, el balance deja de describir el estado real.',
    v=>{
      const volume=v.area*v.depth, demand=v.biomass*v.respiration/1000+v.background;
      const transferred=v.power*v.transfer, rate=1000*(transferred-demand)/volume;
      const predicted=v.initial+rate*v.hours;
      const need=Math.max(0,(demand+(v.target-v.initial)*volume/1000/v.hours)/v.transfer);
      const rows=Array.from({length:41},(_,i)=>{const h=v.hours*i/40;return [h,v.initial+rate*h];});
      return {metrics:[['OD calculado al final',predicted,'mg/L'],['Potencia para alcanzar meta al final',need,'kW'],
        ['Potencia para mantener OD constante',demand/v.transfer,'kW'],['Demanda de oxígeno',demand,'kg O₂/h'],['Aporte de aireadores',transferred,'kg O₂/h']],
        headers:['Tiempo (h)','OD lineal (mg/L)'],rows,series:[plot('OD',rows,0,1)],xLabel:'Tiempo (h)',yLabel:'mg/L',
        message:predicted<0?'El balance indica agotamiento antes de terminar el período.':''};
    });

  R('fishery-surplus-production','fishery-msy-stock-assessment','ecology','Pesquerías · producción excedente, RMS y mortalidad',
    [L.select('model','Modelo',[['schaefer','Schaefer logístico'],['fox','Fox de Gompertz']],'schaefer'),
      f('k','Capacidad de carga K','t',65000,.001),f('r','Tasa de crecimiento r','año⁻¹',.36,.000001,5),
      f('b','Biomasa actual','t',26500,.000001),f('mort','Mortalidad por pesca F','año⁻¹',.25,0,10)],
    'Schaefer: G = rB(1−B/K), BRMS = K/2, FRMS = r/2. Fox: G = rB ln(K/B), BRMS = K/e, FRMS = r. La captura instantánea es F·B.',
    'Supone un stock agregado con parámetros calibrados. El resultado es un punto biológico de referencia, sujeto a incertidumbre y a evaluación del stock.',
    v=>{
      const fox=v.model==='fox', bmsy=v.k/(fox?Math.E:2), fmsy=v.r/(fox?1:2);
      const growth=b=>b===0?0:v.r*b*(fox?Math.log(v.k/b):1-b/v.k);
      const net=growth(v.b)-v.mort*v.b, rows=Array.from({length:41},(_,i)=>{
        const b=v.k*i/40;return [b,growth(b),v.mort*b];
      });
      return {metrics:[['Rendimiento máximo sostenible',bmsy*fmsy,'t/año'],['Biomasa en el RMS',bmsy,'t'],
        ['Mortalidad en el RMS',fmsy,'año⁻¹'],['B / BRMS',v.b/bmsy,''],['F / FRMS',v.mort/fmsy,''],
        ['Captura instantánea anualizada',v.mort*v.b,'t/año'],['Cambio instantáneo neto',net,'t/año']],
        headers:['Biomasa (t)','Producción (t/año)','Captura a F actual (t/año)'],rows,
        series:[plot('Producción',rows,0,1),plot('Captura a F actual',rows,0,2)],xLabel:'Biomasa (t)',yLabel:'t/año'};
    },[['FAO · modelos de producción excedente','https://www.fao.org/4/w5449e/w5449e10.pdf']]);

  R('forest-tree-allometry','forest-biomass-allometric','ecology','Bosque tropical · biomasa alométrica por árbol y parcela',
    [f('area','Área de parcela','ha',.25,.0001),pct('carbon','Fracción de carbono en biomasa seca',47),
      f('root','Relación biomasa de raíces / aérea','',.24,0,3),
      table('trees','Árboles o clases de tamaño',
        ['DAP (cm)','Altura (m)','Densidad madera (g/cm³)','Árboles'],
        '22;16;.62;12\n33;22;.58;9\n47;27;.65;5\n60;31;.56;2',
        'Una fila por árbol o grupo representativo. Usa mediciones y densidades apropiadas de bosque tropical.')],
    'Chave et al. (2014): biomasa aérea seca (kg) = 0,0673 × (ρ D² H)^0,976. Se escala por número de árboles y área de parcela.',
    'Usa la ecuación para árboles tropicales dentro del rango de calibración. Raíces se estiman por proporción ingresada. El CO₂ equivalente corresponde a existencias, sin convertirlas en captura anual.',
    v=>{
      check(v.trees,4,([d,h,r,n])=>d>=5&&d<=300&&h>0&&h<=100&&r>0&&r<=1.5&&Number.isInteger(n)&&n>0,'Usa DAP de 5 a 300 cm, altura y densidad válidas y cantidad entera positiva.');
      const rows=v.trees.map(([d,h,r,n],i)=>{
        const individual=.0673*(r*d*d*h)**.976, aerial=individual*n/1000, below=aerial*v.root;
        return [i+1,n,individual,aerial,below,(aerial+below)*v.carbon/100];
      });
      const [a,b,c]=[3,4,5].map(j=>L.sum(rows.map(r=>r[j]))/v.area);
      return {metrics:[['Biomasa aérea seca',a,'t/ha'],['Biomasa de raíces',b,'t/ha'],['Existencias de carbono',c,'t C/ha'],
        ['Equivalente de CO₂ almacenado',c*44/12,'t CO₂/ha']],
        headers:['Fila','Árboles','Biomasa aérea (kg/árbol)','Aérea en parcela (t)','Raíces en parcela (t)','Carbono en parcela (t C)'],rows};
    },[['Chave et al. (2014) · modelos alométricos','https://doi.org/10.1111/gcb.12629']]);

  R('cropland-nitrate-leaching','nitrogen-fertilizer-leaching','soil','Nitrógeno agrícola · excedente y concentración de lixiviado',
    [f('area','Área cultivada','ha',24,.001),f('inputs','Entradas de N por fertilización y otras fuentes','kg N/ha·año',170),
      f('uptake','Extracción de N por cosecha','kg N/ha·año',105),f('air','Pérdidas gaseosas y otras salidas medidas','kg N/ha·año',18),
      f('storage','Incremento anual de N retenido en suelo','kg N/ha·año',5,-1000,1000),
      pct('leach','Fracción de excedente que se lixivia como nitrato',65),
      f('drain','Drenaje profundo anual','mm/año',270,0,10000)],
    'Excedente = entradas − cosecha − otras salidas − acumulación. Pérdida modelada = excedente positivo × fracción lixiviada. mg N/L = 100 × kg N/ha divididos por mm de drenaje.',
    'La fracción lixiviada y el drenaje deben estar sustentados para suelo, clima y manejo. El resultado corresponde al drenaje de la parcela y excluye transformación y mezcla en el acuífero.',
    v=>{
      const surplus=v.inputs-v.uptake-v.air-v.storage;
      const mass=Math.max(0,surplus)*v.leach/100;
      L.assert(v.drain>0||mass===0,'Un escenario con lixiviación positiva requiere drenaje profundo positivo.');
      const concentration=v.drain>0?100*mass/v.drain:null;
      return {metrics:[['Carga de N lixiviada',mass,'kg N/ha·año'],['Excedente de N',surplus,'kg N/ha·año'],
        ['Carga total de N lixiviada',mass*v.area,'kg N/año'],['Concentración como N',concentration??'Sin drenaje','mg N/L'],
        ['Concentración como nitrato',concentration===null?'Sin drenaje':concentration*62/14,'mg NO₃/L']]};
    });

  R('soybean-emergence-thermal-time','soybean-germination-temperature-rate','soil','Soja · tiempo térmico y progreso de emergencia',
    [f('base','Temperatura base de la variedad','°C',9,0,30),
      f('cap','Temperatura máxima para acumular grados-día','°C',28,0,45),
      f('goal','Tiempo térmico requerido para emergencia','°C·día',85,.001,5000),
      table('days','Condiciones diarias de la cama de siembra',['Temperatura media suelo (°C)','Factor hídrico medido (0–1)'],
        '16;.7\n18;.75\n20;.8\n21;.9\n19;.9\n22;1\n24;1\n23;1\n24;1',
        'Una fila por día. El factor 1 representa humedad sin restricción; calibra factores con ensayos de emergencia de la variedad.')],
    'Grados-día efectivos = max(0, min(T, límite superior) − temperatura base) × factor hídrico. La emergencia se estima al alcanzar el requerimiento térmico.',
    'Modelo de avance térmico, sin extrapolar la respuesta a estrés por calor extremo. La profundidad, compactación y calidad de semilla requieren calibración. El progreso térmico no representa porcentaje de plantas emergidas.',
    v=>{
      L.assert(v.cap>v.base,'El límite superior debe ser mayor que la temperatura base.');
      check(v.days,2,([t,m])=>t>=-30&&t<=60&&m>=0&&m<=1,'Usa temperatura de suelo válida y factor hídrico entre 0 y 1.');
      let accum=0;
      const rows=v.days.map(([t,m],i)=>{
        const gdd=Math.max(0,Math.min(t,v.cap)-v.base)*m;
        accum+=gdd;
        return [i+1,gdd,accum,Math.min(100,100*accum/v.goal)];
      });
      const crossing=rows.find(r=>r[2]>=v.goal);
      return {metrics:[['Día en que se alcanza el requerimiento',crossing?.[0]??'Fuera de la serie','día'],
        ['Tiempo térmico acumulado',accum,'°C·día'],['Progreso térmico final',rows.at(-1)[3],'%']],
        headers:['Día','Grados-día efectivos','Grados-día acumulados','Progreso térmico (%)'],rows,
        series:[plot('Progreso',rows,0,3)],xLabel:'Día',yLabel:'%'};
    });
})();
