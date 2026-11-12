/* Tratamiento de aire, recuperación de partículas y emisiones. */
(function () {
  'use strict';
  const L=GL.lab,{register:R,f,pct,table,check,plot,nn}=GL.nova;
  R('cleanroom-particle-recovery','cleanroom-air-change-recovery','air','Sala limpia · tiempo de recuperación de partículas',
    [f('ach','Renovaciones de aire tratadas','h⁻¹',18,.001),pct('eta','Remoción efectiva por pasada',85,.001),
      f('initial','Concentración inicial','partículas/m³',100000,.001),
      f('target','Concentración objetivo','partículas/m³',1000,.001),
      f('floor','Concentración de equilibrio con fuentes presentes','partículas/m³',150)],
    'C(t) = Ceq + (C0 − Ceq) e^(−ACH η t). Se resuelve el tiempo para llegar al objetivo si está por encima del equilibrio.',
    'Una zona bien mezclada y tasa constante. El modelo permite una concentración de fondo. Una prueba con partículas verifica la recuperación real.',
    v=>{
      L.assert(v.initial>=v.floor,'La concentración inicial debe ser mayor o igual a la de equilibrio.');
      const k=v.ach*v.eta/100;
      const reachable=v.target>v.floor;
      const time=v.initial<=v.target?0:reachable?60/k*Math.log((v.initial-v.floor)/(v.target-v.floor)):null;
      const horizon=Math.max(time||0,180/k), rows=Array.from({length:41},(_,i)=>{
        const t=i*horizon/40;
        return [t,v.floor+(v.initial-v.floor)*Math.exp(-k*t/60)];
      });
      return {metrics:[['Tiempo de recuperación',time??'Meta inalcanzable','min'],['Tasa efectiva de remoción',k,'h⁻¹'],
        ['Semivida del exceso',60*Math.LN2/k,'min']],headers:['Tiempo (min)','Partículas/m³'],rows,
        series:[plot('Concentración',rows,0,1)],xLabel:'Tiempo (min)',yLabel:'partículas/m³'};
    });

  R('voc-biofilter-bed','biofilter-vocs-residence-time','air','Biofiltro de gases · EBRT, carga y remoción de COV',
    [f('q','Caudal real en condiciones del lecho','m³/h',3800,.001),f('cin','Concentración afluente del COV','mg/m³',70),
      f('area','Área del lecho','m²',65,.001),f('depth','Altura del lecho','m',.75,.001),
      f('k','Constante cinética calibrada','s⁻¹',.04,0,10),
      f('ec','Capacidad de eliminación medida','g/m³ de lecho·h',35)],
    'EBRT = volumen vacío/caudal. Conversión de primer orden = 1 − e^(−k EBRT). Se limita la masa removida por la capacidad de eliminación declarada.',
    'Usa parámetros de ensayo para el compuesto, medio, humedad, temperatura y carga reales. Concentración y caudal deben usar la misma base volumétrica.',
    v=>{
      const volume=v.area*v.depth, ebrt=3600*volume/v.q, inlet=v.cin*v.q/1000;
      const removed=Math.min(inlet*(-Math.expm1(-v.k*ebrt)),v.ec*volume);
      return {metrics:[['Tiempo de contacto de lecho vacío',ebrt,'s'],['Salida del COV',(inlet-removed)*1000/v.q,'mg/m³'],
        ['Eficiencia',inlet>0?100*removed/inlet:'Sin carga','%'],['Carga volumétrica de entrada',inlet/volume,'g/m³·h'],
        ['Eliminación volumétrica',removed/volume,'g/m³·h'],['Masa removida',removed/1000,'kg/h']]};
    });

  R('venturi-scrubber-grade','wet-scrubber-efficiency','air','Lavador Venturi · captura por tamaño, agua y potencia',
    [f('q','Caudal volumétrico real de gas','m³/h',12000,.001),f('inlet','Partículas totales a la entrada','mg/m³',350),
      f('throat','Velocidad en garganta','m/s',65,.01),f('lg','Líquido circulante por gas','L/m³',.8),
      f('dp','Pérdida de presión en operación','kPa',4.5),pct('eta','Eficiencia eléctrica total del ventilador',65,.01),
      table('grades','Distribución de partículas y captura',
        ['Tamaño (µm)','Masa relativa (%)','Captura del equipo (%)'],
        '.3;12;40\n1;18;70\n3;30;93\n8;40;99','Usa curvas de captura del equipo a la velocidad, relación L/G y presión indicadas. Las fracciones de masa deben sumar 100 %.')],
    'Remoción global = Σ fracción másica × eficiencia por tamaño. Potencia = caudal real × pérdida de presión / eficiencia eléctrica total.',
    'Usa eficiencias por tamaño de ensayo o curva del equipo. El líquido informado es recirculación hidráulica. El consumo de agua fresca requiere un balance de evaporación, purga y arrastre.',
    v=>{
      check(v.grades,3,([d,m,e])=>d>0&&m>=0&&m<=100&&e>=0&&e<=100,'Revisa tamaño, masa relativa y eficiencias.');
      L.assert(Math.abs(L.sum(v.grades.map(r=>r[1]))-100)<=1e-6,'Las fracciones másicas deben sumar 100 %.');
      const rows=v.grades.map(([d,m,e])=>[d,m,e,v.inlet*m/100*(1-e/100)]).sort((a,b)=>a[0]-b[0]);
      const removed=L.sum(rows.map(r=>r[1]*r[2]/100));
      return {metrics:[['Remoción másica global',removed,'%'],['Partículas a la salida',L.sum(rows.map(r=>r[3])),'mg/m³'],
        ['Potencia eléctrica del ventilador',v.q/3600*v.dp/(v.eta/100),'kW'],['Caudal de líquido',v.q*v.lg/1000,'m³/h'],
        ['Área de garganta',v.q/3600/v.throat,'m²']],headers:['Tamaño (µm)','Masa relativa (%)','Captura (%)','Salida (mg/m³)'],rows};
    });

  R('indoor-radon-ventilation','indoor-radon-mitigation-cmc','health','Radón interior · ventilación, mitigación y equilibrio',
    [f('volume','Volumen interior','m³',220,.001),f('source','Ingreso neto de radón desde el suelo y materiales','Bq/h',8400),
      f('outdoor','Radón en aire exterior','Bq/m³',12),f('initial','Concentración interior inicial','Bq/m³',180),
      f('baseline','Renovación de aire actual','h⁻¹',.35,0,100),f('proposal','Renovación de aire propuesta','h⁻¹',.6,0,100),
      pct('mitigation','Reducción de la fuente interior',60),f('hours','Horizonte','h',36,0,100000)],
    'dC/dt = fuente/volumen + ACH·Cexterior − (ACH + λ)C, con λ de la semivida de Rn-222 de 3,8235 días.',
    'Un recinto bien mezclado con fuente constante. La ventilación puede alterar el ingreso de radón en edificios reales. Mide antes y después de intervenir.',
    v=>{
      const lambda=Math.LN2/(3.8235*24);
      const equilibrium=(ach,src)=>(src/v.volume+ach*v.outdoor)/(ach+lambda);
      const baseline=equilibrium(v.baseline,v.source), after=equilibrium(v.proposal,v.source*(1-v.mitigation/100));
      const trajectory=(t,c,ach)=>c+(v.initial-c)*Math.exp(-(ach+lambda)*t);
      const rows=Array.from({length:41},(_,i)=>{const t=i*v.hours/40;return [t,trajectory(t,baseline,v.baseline),trajectory(t,after,v.proposal)];});
      return {metrics:[['Equilibrio con mitigación',after,'Bq/m³'],['Equilibrio actual',baseline,'Bq/m³'],
        ['Diferencia de equilibrio',baseline-after,'Bq/m³'],['Concentración propuesta al final',rows.at(-1)[2],'Bq/m³']],
        headers:['Tiempo (h)','Actual (Bq/m³)','Mitigación (Bq/m³)'],rows,
        series:[plot('Actual',rows,0,1),plot('Mitigación',rows,0,2)],xLabel:'Tiempo (h)',yLabel:'Bq/m³'};
    },[['EPA · radón','https://www.epa.gov/radon']]);

  R('floating-roof-rim-seal-loss','tank-roof-floating-rim-seal-emission','air','Tanque de techo flotante · pérdidas del sello perimetral',
    [f('diam','Diámetro del tanque','m',22,.001),f('wind','Viento medio pertinente al sello','m/s',3.5,0,6.7),
      f('vp','Presión verdadera de vapor del producto','kPa',20),f('atm','Presión atmosférica','kPa',101.325,.01),
      f('mv','Masa molecular del vapor','g/mol',66,.01),f('kc','Factor del producto Kc','',1),
      f('kra','Factor AP-42 KRa en unidades de la tabla','lb-mol/(ft·año)',2.3),
      f('krb','Factor AP-42 KRb en unidades de la tabla','lb-mol/(ft·año·mphⁿ)',.22),
      f('n','Exponente de velocidad n','',1.5,0,8)],
    'AP-42: Lr = (KRa + KRb v^n) D P* Mv Kc, con v en mph y D en pies. P* = (Pv/Pa)/(1 + √(1 − Pv/Pa))². Se convierte lb/año a kg/año.',
    'Se calcula la pérdida del sello en operación estable. Declara factores de la tabla apropiados para techo y sello; los valores iniciales son ilustrativos. Los accesorios, costuras, retiro de líquido y aterrizaje del techo requieren cálculos propios.',
    v=>{
      L.assert(v.vp<v.atm,'La presión de vapor debe ser inferior a la presión atmosférica.');
      const ratio=v.vp/v.atm, pstar=ratio/(1+Math.sqrt(1-ratio))**2;
      const speed=v.wind*2.2369362920544;
      const base=v.diam/.3048*pstar*v.mv*v.kc*.45359237;
      const staticLoss=base*v.kra, windLoss=base*v.krb*speed**v.n;
      return {metrics:[['Pérdida anual del sello',staticLoss+windLoss,'kg/año'],['Contribución independiente del viento',staticLoss,'kg/año'],
        ['Contribución dependiente del viento',windLoss,'kg/año'],['Función de presión de vapor',pstar,'']]};
    },[['EPA · AP-42, tanques de líquidos orgánicos','https://www.epa.gov/air-emissions-factors-and-quantification/final-revisions-ap-42-chapter-7-section-1-organic-liquid']]);
})();
