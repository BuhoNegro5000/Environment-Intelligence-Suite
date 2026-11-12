/* Balances y verificaciones operativas de aguas residuales. */
(function(){
  'use strict';
  const L=GL.lab,{f,p,m,out,reg,rows,nn,eps}=GL.dw,{assert:A,sum:S,table:T,select}=L;
  const load=(q,c)=>q*c/1000;
  const nutrients=[['EPA · manual de control de nutrientes','https://www.epa.gov/sites/default/files/2019-02/documents/nutrient-control-design-manual-state-tech.pdf']];

  reg('sludge-specific-generation','wastewater','geracao-lodo-especifica-kg-m3','Lodos · generación específica de sólidos secos',[
    f('volume','Agua tratada en el periodo','m³',5000,eps),
    select('mode','Base de masa',[['dry','Masa seca medida'],['wet','Masa húmeda y concentración de sólidos']],'dry'),
    f('dry','Masa seca acumulada','kg',720),f('wet','Masa húmeda acumulada','kg',3600),
    p('fraction','Contenido de sólidos en lodo húmedo',20)
  ],'Masa seca = masa húmeda × fracción seca cuando corresponde. Generación específica = masa seca/volumen tratado.',
  v=>{const mass=v.mode==='wet'?v.wet*v.fraction/100:v.dry;
    return out(m('Generación específica',mass/v.volume,'kg SST seca/m³'),m('Masa seca contabilizada',mass,'kg'),
      m('Volumen del periodo',v.volume,'m³'));},
  'Mide masa y volumen dentro de la misma frontera y periodo. La generación específica no equivale a rendimiento celular por DBO removida.');

  reg('aerator-surface-field-power','wastewater','potencia-aerador-superficial-efluentes','Aireación superficial · AOR, SOR y potencia',[
    f('bod','Carga de DBO removida','kg/d',480),f('factor','Oxígeno carbonáceo por DBO removida','kg/kg',1.25),
    f('n','N nitrificado','kg N/d',48),f('den','N desnitrificado a partir de esa nitrificación','kg N/d',30),
    f('alpha','Factor α de transferencia','',.75,.01,2),f('beta','Factor β de saturación','',.95,.01,2),
    f('temp','Temperatura de operación','°C',24,0,45),f('theta','Factor térmico θ','',1.024,1,1.1),
    f('sat','Saturación de agua limpia a condiciones del sitio','mg/L',8.3,eps),
    f('reference','Saturación a 20 °C y condiciones estándar','mg/L',9.09,eps),
    f('do','Oxígeno disuelto de operación','mg/L',2),f('sae','Eficiencia estándar de aireación SAE','kg O₂/kWh',1.8,eps),
    f('peak','Factor de punta de demanda','',1.25,1)
  ],'AOR = DBO·factor + 4,57·N nitrificado − 2,86·N desnitrificado. Corrección real = α·θ^(T−20)·(β·Cs−OD)/Cs₂₀. SOR = AOR/corrección; potencia = SOR horario/SAE.',
  v=>{A(v.den<=v.n,'El N desnitrificado supera el N nitrificado del escenario.');
    const a=v.bod*v.factor+4.57*v.n-2.86*v.den,correction=v.alpha*v.theta**(v.temp-20)*(v.beta*v.sat-v.do)/v.reference;
    A(correction>0,'La fuerza motriz de transferencia de oxígeno debe ser positiva.');
    const standard=a*v.peak/(24*correction);
    return out(m('Potencia eléctrica estimada de punta',standard/v.sae,'kW'),m('AOR medio',a/24,'kg O₂/h'),
      m('AOR de punta',a*v.peak/24,'kg O₂/h'),m('SOR de punta',standard,'kg O₂/h'),m('Factor real/estándar',correction));},
  'Usa SAE medida para el equipo y una corrección de transferencia representativa. La potencia se refiere a la frontera eléctrica de la SAE declarada.',nutrients);

  reg('settling-column-sst-capture','wastewater','velocidade-sedimentacao-flocos','Sedimentación · ensayo de columna y captura de SST',[
    select('mode','Método',[['column','Velocidad medida en columna'],['curve','Curva empírica de remoción de SST']],'column'),
    T('column','Descenso de interfaz en el tramo lineal','0;80\n5;64\n10;48\n15;32',
      'Columnas: tiempo (min); altura de interfaz sobre el fondo (cm).'),
    f('overflow','Tasa superficial de diseño','m³/(m²·d)',35,eps),
    T('curve','Curva medida o de diseño adoptada','20;66\n35;53\n50;43',
      'Columnas: tasa superficial (m³/(m²·d)); remoción SST (%). Sustituye los datos sintéticos por una curva representativa.')
  ],'Columna: velocidad = −pendiente altura/tiempo. La razón velocidad/TAS sirve como referencia hidráulica. Curva SST: interpolación lineal entre puntos que encierran la tasa ingresada.',
  v=>{
    if(v.mode==='curve'){
      rows(v.curve,2,([q,r])=>q>0&&r>=0&&r<=100,'Usa tasa positiva y porcentajes de 0 a 100.');
      A(v.curve.length>=2&&v.curve.every((r,i)=>!i||r[0]>v.curve[i-1][0]),'Las tasas deben ser estrictamente crecientes.');
      const j=v.curve.findIndex((r,i)=>i>0&&v.overflow>=v.curve[i-1][0]&&v.overflow<=r[0]);
      A(j>0,'La tasa está fuera del intervalo de la curva empírica.');
      const [x,y]=v.curve[j-1],[x2,y2]=v.curve[j],r=y+(v.overflow-x)*(y2-y)/(x2-x);
      return {...out(m('Remoción SST interpolada',r,'%'),m('Tasa superficial evaluada',v.overflow,'m/d')),
        series:[{name:'Curva declarada',data:v.curve,points:true},{name:'Punto evaluado',data:[[v.overflow,r]],type:'scatter',points:true}],
        xLabel:'Tasa superficial (m/d)',yLabel:'Remoción SST (%)'};
    }
    rows(v.column,2,nn,'Usa tiempos y alturas no negativos.');
    A(v.column.length>=2&&v.column.every((r,i)=>!i||r[0]>v.column[i-1][0]),'Los tiempos deben ser estrictamente crecientes.');
    const fit=GL.stat.linreg(v.column.map(r=>r[0]),v.column.map(r=>r[1]));A(fit.slope<=0,'El tramo ajustado presenta una interfaz ascendente.');
    const velocity=-fit.slope*14.4;
    return {...out(m('Velocidad de descenso',velocity,'m/d'),m('Velocidad de descenso',velocity/24,'m/h'),
      m('Razón frente a carga superficial',velocity/v.overflow),m('R²',fit.r2)),
      series:[{name:'Interfaz medida',data:v.column,points:true},{name:'Tramo ajustado',data:v.column.map(([t])=>[t,fit.intercept+fit.slope*t])}],
      xLabel:'Tiempo (min)',yLabel:'Altura (cm)'};
  },'El descenso de interfaz depende del lodo y del tramo elegido. La remoción SST requiere una curva local o un criterio documentado; los datos de ejemplo son sintéticos.');

  reg('nitrification-nitrogen-balance','wastewater','eficiencia-nitrificacao-nh3-n','Nitrificación · desaparición de amonio y ganancia de NOx',[
    f('qin','Caudal de entrada','m³/d',1800,eps),f('qout','Caudal de salida','m³/d',1770,eps),
    f('nhin','Amonio de entrada','mg N/L',35),f('nhout','Amonio de salida','mg N/L',4),
    f('noin','Nitrito + nitrato de entrada','mg N/L',1),f('noout','Nitrito + nitrato de salida','mg N/L',22)
  ],'Se comparan cargas de N amoniacal y N oxidado. La eficiencia aparente es desaparición de NH₄-N dividida por su carga de entrada.',
  v=>{const before=load(v.qin,v.nhin),after=load(v.qout,v.nhout),loss=before-after,gain=load(v.qout,v.noout)-load(v.qin,v.noin);
    return out(m('Reducción aparente de carga amoniacal',before?100*loss/before:null,'%'),m('Amonio que desaparece del balance',loss,'kg N/d'),
      m('Ganancia neta de N oxidado',gain,'kg N/d'),m('Diferencia sin asignar',loss-gain,'kg N/d'));},
  'La desaparición de amonio puede incluir asimilación y otras vías. NOx neto puede verse afectado por desnitrificación y recirculaciones.',nutrients);

  reg('organic-reactor-loading-pe','wastewater','carga-organica-volumetrica-cov-ete','Carga orgánica · COV y población equivalente',[
    f('q','Caudal afluente','m³/d',2200),f('bod','DBO₅ afluente','mg/L',230),
    f('volume','Volumen útil de reactor','m³',1000,eps),f('perCapita','Carga de referencia por habitante','g DBO₅/(hab·d)',54,eps)
  ],'Carga DBO = Q·DBO/1000. COV = carga/volumen. Habitantes equivalentes = carga en g/d dividida por carga por habitante.',
  v=>{const a=load(v.q,v.bod);
    return out(m('Carga orgánica volumétrica',a/v.volume,'kg DBO₅/(m³·d)'),m('Población equivalente',1000*a/v.perCapita,'hab-eq'),
      m('Carga afluente de DBO₅',a,'kg/d'));},
  'Declara el valor per cápita exigido por la base de diseño. El equivalente expresa carga orgánica.');

  reg('wastewater-project-flows','wastewater','vazoes-projeto-k1-k2-harmon','Alcantarillado · caudales de diseño K1, K2 y Harmon',[
    f('pop','Población de diseño','hab',28000,1),f('per','Dotación de agua','L/(hab·d)',160),
    p('return','Coeficiente de retorno sanitario',80),f('inf','Infiltración constante de diseño','L/s',12),
    f('k1','Factor de día máximo K1','',1.2,1),f('k2','Factor horario K2','',1.5,1),
    f('kmin','Factor de caudal mínimo','',.5,0,1)
  ],'Q sanitario medio=hab·dotación·retorno/86400. Se añade infiltración a cada caso. Punta por K1·K2 o por factor Harmon=1+14/(4+√P), con P en miles.',
  v=>{A(Number.isSafeInteger(v.pop),'Usa población entera.');
    const q=v.pop*v.per*v.return/8640000,h=1+14/(4+Math.sqrt(v.pop/1000));
    return out(m('Caudal medio total',q+v.inf,'L/s'),m('Caudal mínimo',q*v.kmin+v.inf,'L/s'),
      m('Día máximo K1',q*v.k1+v.inf,'L/s'),m('Punta por K1·K2',q*v.k1*v.k2+v.inf,'L/s'),
      m('Punta por Harmon',q*h+v.inf,'L/s'),m('Factor Harmon',h));},
  'K1·K2 y Harmon se presentan como escenarios separados. Verifica rangos, factores y aportes con la norma local y mediciones.',
  [['Ontario · criterios de diseño de alcantarillado','https://www.ontario.ca/document/design-guidelines-sewage-works/odour-control-and-design-sewer']]);

  reg('pollutant-process-mass-balance','wastewater','balanco-massa-dbo-dqo-remocao','Proceso de tratamiento · carga, remoción y cierre de masa',[
    f('qin','Caudal de entrada','m³/d',2500),f('cin','Concentración de entrada','mg/L',290),
    f('qout','Caudal de efluente','m³/d',2480),f('cout','Concentración de efluente','mg/L',48),
    f('product','Masa separada a lodos u otra corriente','kg/d',310),
    f('reaction','Masa transformada por reacción','kg/d',265),L.text('analyte','Parámetro y base de medición','DBO₅ · escenario sintético')
  ],'Carga=Q·C/1000. Remoción acuosa=entrada−efluente. Residual del balance=entrada−efluente−separación−reacción.',
  v=>{const a=load(v.qin,v.cin),b=load(v.qout,v.cout),d=a-b;
    return out(m('Carga de entrada',a,'kg/d'),m('Carga descargada',b,'kg/d'),m('Remoción de la fase acuosa',d,'kg/d'),
      m('Remoción relativa de carga',a?100*d/a:null,'%'),m('Residual sin asignar',d-v.product-v.reaction,'kg/d'));},
  'Un residual puede indicar acumulación, fronteras incompletas o incertidumbre de medición. Usa la misma base analítica en todas las corrientes.');

  reg('biological-carbon-nutrient-ratio','wastewater','relacao-nutrientes-esgoto-cnp','Tratamiento biológico · relación DBO:N:P y déficits',[
    f('q','Caudal','m³/d',2500),f('bod','DBO biodegradable disponible','mg/L',250,eps),
    f('n','N disponible para biomasa','mg N/L',8),f('p','P disponible para biomasa','mg P/L',1.4),
    f('targetN','N objetivo por 100 partes de DBO','mg N/100 mg DBO',5),
    f('targetP','P objetivo por 100 partes de DBO','mg P/100 mg DBO',1)
  ],'Relación normalizada = 100 : 100·N/DBO : 100·P/DBO. Déficit = máx(requerimiento − aporte,0) × caudal.',
  v=>{const needN=v.bod*v.targetN/100,needP=v.bod*v.targetP/100;
    return out(m('DBO normalizada',100),m('N por 100 de DBO',100*v.n/v.bod),m('P por 100 de DBO',100*v.p/v.bod),
      m('Déficit de N',load(v.q,Math.max(0,needN-v.n)),'kg N/d'),m('Déficit de P',load(v.q,Math.max(0,needP-v.p)),'kg P/d'));},
  'Criterio orientativo editable. Usa fracciones biodisponibles y contrasta la dosis con la respuesta biológica y las metas del efluente.',nutrients);
})();
