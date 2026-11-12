/* Evaluación, monitoreo, exposición y economía ambiental. */
(function () {
  'use strict';
  const L=GL.lab,{reg,matrix,nonnegative:nn,positive,metric:m,result:r,field:f,pct,integer,weighted}=GL.solverScience;
  const {assert:A,sum:S,table:T,select}=L;
  const eps=1e-10;
  const metrics=(...items)=>({metrics:items});
  const epa=[['EPA · evaluación de exposición y riesgo','https://www.epa.gov/risk/superfund-risk-assessment-human-health-topics'],
    ['EPA · riesgo inhalatorio (RAGS Parte F)','https://www.epa.gov/risk/risk-assessment-guidance-superfund-rags-part-f']];
  const compare=(a,b)=>a?100*(1-b/a):null;

  reg('ecosystem-services-value','ecosystem-services','ecology','Servicios ecosistémicos · valoración por contribución',[
    T('a','Servicios de la misma área','120;0.8;35\n85;1;180\n2100;1;6',
      'Columnas: cantidad física anual; fracción atribuible (0 a 1); valor monetario por unidad. Filas por servicio como agua, polinización o recreación.'),
    f('area','Área del ecosistema','ha',120,eps),L.text('currency','Moneda y año base','Moneda local, año base del estudio')
  ],'Valor por servicio = cantidad × fracción atribuible × valor unitario. Total y valor por hectárea.',
  v=>{matrix(v.a,3,q=>nn(q)&&q[1]<=1,'Usa cantidades y valores no negativos, y fracción entre 0 y 1.');
    const rows=v.a.map(([q,a,u],i)=>[i+1,q,a,u,q*a*u]),total=S(rows.map(x=>x[4]));
    return r([m('Valor total anual',total,'moneda/año'),m('Valor por superficie',total/v.area,'moneda/(ha·año)')],
      ['Servicio','Cantidad','Fracción atribuible','Valor unitario','Valor anual'],rows);},
  'Utiliza valores marginales o unitarios justificados, mismo año base y servicios sin doble conteo.');

  reg('environmental-economic-value','environmental-economics','impact','Economía ambiental · valor económico total y daño esperado',[
    f('direct','Valor de uso directo','moneda/año',60000),f('indirect','Valor de uso indirecto','moneda/año',43000),
    f('option','Valor de opción','moneda/año',10000),f('nonuse','Valor de no uso','moneda/año',18000),
    f('loss','Daño por evento y persona afectada','moneda/persona',60),f('people','Personas afectadas por evento','personas',400),
    pct('prob','Probabilidad anual del escenario',15)
  ],'Valor económico total = uso directo + indirecto + opción + no uso. Daño anual esperado = daño por persona × población × probabilidad anual.',
  v=>{integer(v.people,'Población');const total=v.direct+v.indirect+v.option+v.nonuse,loss=v.loss*v.people*v.prob/100;
    return metrics(m('Valor económico total',total,'moneda/año'),m('Daño esperado del escenario',loss,'moneda/año'));},
  'Usa estimaciones comparables en moneda, año base, alcance y población. Evita solapamiento entre categorías de valor.');

  reg('environmental-policy-appraisal','environmental-policy-impact','impact','Política ambiental · evaluación costo-beneficio',[
    T('a','Flujos incrementales de la política','0;0;50000\n1;30000;13000\n2;42000;13000\n3;42000;13000',
      'Columnas: año desde la implementación; beneficios monetizados; costos. Incluye los costos de inversión, ejecución y cumplimiento relevantes.'),
    pct('d','Tasa de descuento anual',6)
  ],'Cada flujo se divide por (1+r)^año. VAN = beneficios actuales − costos actuales. B/C usa sus valores actuales.',
  v=>{matrix(v.a,3,q=>nn(q)&&Number.isInteger(q[0]),'Año entero no negativo. Beneficios y costos no negativos.');
    const rows=v.a.map(([year,b,c])=>[year,b/(1+v.d/100)**year,c/(1+v.d/100)**year]).sort((a,b)=>a[0]-b[0]);
    const b=S(rows.map(q=>q[1])),c=S(rows.map(q=>q[2]));
    return r([m('Valor actual neto',b-c,'moneda'),m('Razón beneficio/costo',c?b/c:'Sin costos'),m('Valor actual de beneficios',b,'moneda'),
      m('Valor actual de costos',c,'moneda')],['Año','Beneficio descontado','Costo descontado'],rows);},
  'Ingresa flujos incrementales respecto a una línea base. Trata los efectos distributivos y no monetizados por separado.');

  reg('environmental-compliance-check','environmental-compliance','impact','Cumplimiento ambiental · obligaciones y evidencias',[
    T('a','Obligaciones del instrumento aplicable','1;1;0;500\n1;0;0;1200\n0;2;0;0\n1;2;1;800',
      'Columnas: aplica (0/1); estado (0 incumplida, 1 cumplida, 2 pendiente de evidencia); criticidad (0/1); costo pendiente de acción.'),
    L.text('scope','Instrumento, instalación y periodo','Permiso y matriz de obligaciones del periodo')
  ],'Cumplimiento confirmado = cumplidas/aplicables. Los estados pendientes se cuentan como aplicables y se muestran aparte.',
  v=>{matrix(v.a,4,q=>[0,1].includes(q[0])&&[0,1,2].includes(q[1])&&[0,1].includes(q[2])&&q[3]>=0,'Usa los códigos indicados y costos no negativos.');
    const included=v.a.filter(q=>q[0]),done=included.filter(q=>q[1]===1).length;
    return r([m('Cumplimiento confirmado',included.length?100*done/included.length:'Sin obligaciones aplicables','%'),
      m('Incumplidas',included.filter(q=>q[1]===0).length),m('Pendientes de evidencia',included.filter(q=>q[1]===2).length),
      m('Críticas sin cierre confirmado',included.filter(q=>q[1]!==1&&q[2]).length),
      m('Costo pendiente',S(included.filter(q=>q[1]!==1).map(q=>q[3])),'moneda')],
      ['Obligación','Aplicabilidad','Estado','Crítica','Costo informado'],v.a.map(([a,s,c,cost],i)=>[i+1,a?'Aplica':'No aplica',a?['Incumplida','Cumplida','Pendiente'][s]:'—',c?'Sí':'No',cost]));},
  'El inventario de obligaciones y la evidencia deben provenir del instrumento vigente. El porcentaje es un control interno.');

  reg('environmental-monitoring-plan','environmental-monitoring','analysis','Monitoreo ambiental · cobertura y calidad de datos',[
    T('a','Estaciones o grupos de monitoreo','12;10;9;8;8\n6;6;5;5;6',
      'Columnas: muestras planificadas; recibidas; válidas; recibidas a tiempo; esperadas según obligación o protocolo (mínimo).'),
    f('budget','Presupuesto','moneda',3500),f('cost','Costo unitario por muestra','moneda',180)
  ],'Cobertura válida = válidas/planificadas. Oportunidad = recibidas a tiempo/recibidas. Brecha mínima = máx(0,mínimo−válidas) por grupo.',
  v=>{matrix(v.a,5,q=>nn(q)&&q.every(Number.isInteger)&&q[2]<=q[1]&&q[3]<=q[1],'Usa conteos enteros no negativos. Válidas y puntuales no pueden superar recibidas.');
    const totals=[0,1,2,3].map(i=>S(v.a.map(q=>q[i]))),gaps=v.a.map(q=>Math.max(0,q[4]-q[2]));
    return r([m('Cobertura válida',totals[0]?100*totals[2]/totals[0]:'Sin plan','%'),m('Oportunidad',totals[1]?100*totals[3]/totals[1]:'Sin muestras','%'),
      m('Muestras válidas faltantes',S(gaps)),m('Saldo estimado del plan',v.budget-totals[0]*v.cost,'moneda')],
      ['Grupo','Planificadas','Recibidas','Válidas','Puntuales','Mínimo','Brecha'],
      v.a.map((q,i)=>[i+1,...q,gaps[i]]));},
  'El mínimo y la frecuencia se definen por el protocolo. El costo presupuestado usa la cantidad planificada.');

  reg('environmental-impact-scenarios','environmental-impact-assessment','impact','Evaluación de impactos · escenarios y mitigación',[
    T('a','Impactos antes y después','85;55;3\n60;20;2\n35;30;1',
      'Columnas: significancia antes (0 a 100); significancia residual (0 a 100); peso no negativo. Una fila por impacto.'),
    L.text('context','Proyecto, fase y matriz de significancia','Escenario de construcción · ejemplo sintético')
  ],'Se comparan impactos con la misma escala y pesos. Eficacia relativa = 1 − significancia residual/inicial.',
  v=>{matrix(v.a,3,q=>nn(q)&&q[0]<=100&&q[1]<=100,'Usa significancias 0 a 100 y pesos no negativos.');
    const total=S(v.a.map(q=>q[2]));A(positive(total),'La suma de pesos debe ser positiva.');
    const b=S(v.a.map(q=>q[0]*q[2]/total)),a=S(v.a.map(q=>q[1]*q[2]/total));
    return r([m('Significancia inicial ponderada',b),m('Significancia residual ponderada',a),m('Reducción relativa',compare(b,a),'%')],
      ['Impacto','Inicial','Residual','Peso normalizado','Reducción (%)'],v.a.map(([x,y,w],i)=>[i+1,x,y,w/total,compare(x,y)]));},
  'Ingresa calificaciones generadas con el mismo método de significancia. Documenta medidas, receptores y efectos residuales por impacto.');

  reg('environmental-risk-scenarios','environmental-risk-assessment','impact','Riesgo ambiental · frecuencia y consecuencia por escenario',[
    T('a','Escenarios de riesgo','0.10;70;0.03;45\n0.02;400;0.008;220',
      'Columnas: frecuencia inicial (eventos/año); consecuencia inicial por evento; frecuencia residual; consecuencia residual.'),
    L.text('unit','Unidad común de consecuencia','m³ afectados por evento')
  ],'Consecuencia anual esperada = frecuencia × consecuencia. Cada escenario se compara con su condición residual.',
  v=>{matrix(v.a,4,nn,'Usa frecuencias y consecuencias no negativas.');
    const rows=v.a.map(([p,c,q,d],i)=>[i+1,p,c,p*c,q,d,q*d]),base=S(rows.map(q=>q[3])),end=S(rows.map(q=>q[6]));
    return r([m('Consecuencia anual inicial',base,'unidad/año'),m('Consecuencia anual residual',end,'unidad/año'),
      m('Reducción relativa',compare(base,end),'%')],['Escenario','Frecuencia inicial','Consecuencia inicial','Esperada inicial','Frecuencia residual','Consecuencia residual','Esperada residual'],rows);},
  'La suma requiere consecuencias de la misma unidad y escenarios sin doble conteo. La esperanza y la magnitud extrema se interpretan por separado.');

  reg('environmental-remediation-plan','environmental-remediation','soil','Remediación · masa, plazo y costo del tratamiento',[
    f('area','Área del sitio','ha',1.2,eps),f('depth','Espesor tratado','m',.6,eps),f('rho','Densidad seca','t/m³',1.55,eps),
    f('c','Concentración inicial','mg/kg',460,eps),f('target','Concentración objetivo aplicable','mg/kg',100,eps),
    f('k','Constante de reducción de campo','1/mes',.18,eps),
    f('fixed','Costo fijo','moneda',26000),f('unit','Costo variable por tonelada tratada','moneda/t',24),f('monthly','Monitoreo mensual','moneda/mes',1800)
  ],'Volumen = área × espesor. Masa de contaminante = masa seca × concentración. Plazo de primer orden = ln(C₀/C_obj)/k cuando C₀>C_obj.',
  v=>{const soil=1e4*v.area*v.depth*v.rho,time=Math.max(0,Math.log(v.c/v.target)/v.k);
    return metrics(m('Suelo en el escenario',soil,'t seca'),m('Contaminante inicial',soil*v.c/1000,'kg'),
      m('Masa a reducir',soil*Math.max(0,v.c-v.target)/1000,'kg'),m('Plazo modelado',time,'meses'),
      m('Costo del escenario',time>0?v.fixed+soil*v.unit+time*v.monthly:0,'moneda'));},
  'Utiliza una constante derivada de datos de tratabilidad. El plazo presupone una masa de suelo homogénea y cinética constante.');

  reg('environmental-toxicology-dose','environmental-toxicology','safety','Toxicología ambiental · dosis y cociente de peligro',[
    select('route','Matriz de exposición',[['water','Ingesta de agua'],['soil','Ingesta de suelo'],['air','Inhalación con RfC']],'water'),
    f('c','Concentración (mg/L, mg/kg o mg/m³ según matriz)','mg por unidad',.025),
    f('ir','Ingesta diaria de agua o suelo','L/día o mg/día',2),f('bw','Masa corporal','kg',70,eps),
    f('hours','Exposición en aire','h/día',24,0,24),f('freq','Frecuencia','días/año',350,0,365),
    f('years','Duración','años',20,eps,120),f('life','Vida para promedio cancerígeno','años',70,eps,120),
    f('ref','Dosis o concentración de referencia (RfD/RfC)','según vía',.003,eps),
    f('slope','Pendiente oral o riesgo unitario inhalatorio por mg/m³','inverso de exposición',0)
  ],'Exposición crónica oral = C × ingesta × frecuencia/(365 × masa). Para aire: C × horas/24 × frecuencia/365. HQ = exposición/RfD o RfC. Riesgo incremental = exposición media vitalicia × factor.',
  v=>{A(v.years<=v.life,'La duración no puede superar el horizonte de vida.');
    const air=v.route==='air',amount=v.route==='soil'?v.ir/1e6:v.ir,ex=v.c*(air?v.hours/24:amount/v.bw)*v.freq/365;
    const lifetime=ex*v.years/v.life,unit=air?'mg/m³':'mg/(kg·día)';
    return metrics(m('Exposición crónica media',ex,unit),m('Cociente de peligro',ex/v.ref),
      m('Exposición media de por vida',lifetime,unit),m('Riesgo cancerígeno incremental',v.slope>0?lifetime*v.slope:'Sin factor ingresado'));},
  'Ingresa RfD, RfC y factores de la misma sustancia, vía y unidad. El HQ es una métrica de cribado y no equivale a probabilidad.',epa);

  reg('environmental-health-burden','environmental-health','safety','Salud ambiental · carga atribuible a una exposición',[
    f('pop','Población del escenario','personas',85000,1),
    f('rate','Incidencia observada en la población','casos/(100 000·año)',220),
    pct('exposed','Proporción expuesta',45),f('rr','Riesgo relativo frente al contrafactual','',1.15,eps)
  ],'Fracción atribuible poblacional = Pₑ(RR−1)/[1+Pₑ(RR−1)]. Casos atribuibles = incidencia poblacional × población × fracción.',
  v=>{integer(v.pop,'Población');const x=v.exposed/100*(v.rr-1),paf=x/(1+x),cases=v.pop*v.rate/1e5;
    return metrics(m('Fracción atribuible poblacional',100*paf,'%'),m('Casos anuales en el escenario',cases,'casos/año'),
      m('Casos atribuibles estimados',cases*paf,'casos/año'));},
  'Usa un riesgo relativo ajustado y transferible, una definición de exposición consistente y la incidencia observada en la población objetivo.',
  [['OMS · carga atribuible de enfermedad','https://www.who.int/news-room/questions-and-answers/item/environmental-health-estimations-of-attributable-burden-of-disease-due-to-a-risk-factor']]);

  reg('green-building-leed','green-building-leed','impact','Edificación sostenible · hoja de créditos LEED',[
    T('a','Créditos del sistema y versión','12;16\n8;11\n24;33\n8;13\n10;16\n4;6',
      'Columnas: puntos documentados; máximo para el crédito o categoría del scorecard.'),
    select('prereq','Estado de prerrequisitos',[['pending','Pendientes de verificación'],['met','Verificados para el escenario']],'pending'),
    L.text('version','Sistema y versión elegidos','LEED BD+C · indicar versión y tipología')
  ],'Suma de créditos ingresados. Umbrales generales del esquema de 110 puntos: 40, 50, 60 y 80 puntos.',
  v=>{matrix(v.a,2,q=>nn(q)&&q.every(Number.isInteger)&&q[0]<=q[1],'Los puntos deben ser enteros y no superar el máximo de cada fila.');
    const pts=S(v.a.map(q=>q[0])),max=S(v.a.map(q=>q[1]));A(max<=110,'Este esquema usa hasta 110 puntos.');
    const band=pts>=80?'Platino':pts>=60?'Oro':pts>=50?'Plata':pts>=40?'Certificado':'Por debajo de 40';
    return r([m('Puntos documentados',pts,'/ 110'),m('Nivel indicativo',v.prereq==='met'?band:'Prerrequisitos pendientes')],
      ['Crédito o categoría','Puntos','Máximo informado'],v.a.map((q,i)=>[i+1,...q]));},
  'Usa la hoja oficial del sistema y versión. El organismo certificador verifica prerrequisitos y créditos.',
  [['USGBC · niveles de certificación','https://www.usgbc.org/leed']]);
})();
