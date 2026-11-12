/* Dosificación, filtración, ensayos y desinfección de agua. */
(function(){
  'use strict';
  const L=GL.lab,{reg,m,out,table,f,p,check,nn,int,load,eps}=GL.atlas,{assert:A,sum:S,table:T,select}=L;
  const ct=[['EPA · desinfección y tiempo de contacto','https://www.epa.gov/system/files/documents/2022-02/disprof_bench_3rules_final_508.pdf']];
  const uv=[['EPA · validación de reactores UV','https://www.epa.gov/system/files/documents/2022-05/uv-toolkit-815-B-21-007_0.pdf']];
  const coa=[['EPA · coagulación y control de turbidez','https://www.epa.gov/sites/default/files/2020-06/documents/swtr_turbidity_gm_final_508.pdf']];
  const atlasCalc=(id,values)=>L.definitions.find(d=>d.id===id).calc(values);

  reg('chemical-feed-storage-duty',['chemical-feed-storage'],'water','Productos químicos · alimentación y autonomía de almacenamiento',[
    f('q','Caudal de agua','m³/h',120),f('hours','Horas por día','h/d',20,0,24),f('days','Días de autonomía','d',10),
    p('reserve','Margen de almacenamiento',15),
    T('a','Productos químicos','12;12.5;1.18;25\n6;35;1.3;12',
      'Columnas: dosis activa (mg/L); fracción activa (% m/m); densidad comercial (kg/L); capacidad de bomba por producto (L/h).')
  ],'Por químico: activo=Q·dosis/1000. Comercial=activo/fracción. Volumen=masa/densidad; inventario incluye días, horas y margen.',
  v=>{check(v.a,4,r=>nn(r)&&r[1]>0&&r[1]<=100&&r[2]>0,'Revisa dosis, riqueza, densidad y capacidad de bomba.');
    const data=v.a.map(([d,p,rho,b],i)=>{const a=load(v.q,d),mass=100*a/p,q=mass/rho;return [i+1,a,mass,q,q*v.hours*v.days*(1+v.reserve/100),b-q];});
    return table([m('Masa activa total',S(data.map(r=>r[1])),'kg/h'),m('Volumen comercial total para almacenamiento',S(data.map(r=>r[4])),'L'),
      m('Bombas por debajo del caudal',data.filter(r=>r[5]<0).length)],
      ['Producto','Activo (kg/h)','Comercial (kg/h)','Alimentación (L/h)','Inventario (L)','Margen de bomba (L/h)'],data);},
  'El volumen total suma depósitos independientes. Se verifica compatibilidad, contención y capacidad de cada producto por separado.');

  reg('jar-test-coagulation-design',['coagulation-flocculation-designer'],'water','Coagulación y floculación · ensayos de jarras y mezcla',[
    T('a','Réplicas de ensayo','8;3.5\n8;3.9\n12;1.4\n12;1.6\n16;1.0\n16;1.1',
      'Columnas: dosis (mg/L); turbidez residual (NTU). Repite dosis para añadir réplicas.'),
    f('target','Turbidez objetivo','NTU',2),f('q','Caudal de diseño','m³/h',180),
    f('rapid','Contacto mezcla rápida','s',35),f('slow','Contacto floculación','min',20),
    f('g1','Gradiente mezcla rápida','s⁻¹',650),f('g2','Gradiente floculación','s⁻¹',50),
    f('mu','Viscosidad dinámica','mPa·s',1,eps)
  ],'Agrupa réplicas por dosis. Selecciona la menor dosis cuya media cumple o interpola dentro de un tramo que cruce el objetivo. Volumen=Q·t y potencia=μVG².',
  v=>{check(v.a,2,nn,'Usa dosis y turbidez no negativas.');
    const group=new Map();for(const [d,x] of v.a){if(!group.has(d))group.set(d,[]);group.get(d).push(x);}
    const data=[...group].sort((a,b)=>a[0]-b[0]).map(([d,x])=>[d,x.length,GL.stat.mean(x),Math.max(...x)]);
    const i=data.findIndex(r=>r[2]<=v.target);
    const dose=i<0?null:i===0?data[0][0]:data[i-1][0]+(data[i][0]-data[i-1][0])*(v.target-data[i-1][2])/(data[i][2]-data[i-1][2]);
    const fast=v.q*v.rapid/3600,slow=v.q*v.slow/60;
    return table([m('Dosis de cribado',dose??'Objetivo fuera de los ensayos','mg/L'),m('Volumen de mezcla rápida',fast,'m³'),
      m('Volumen de floculación',slow,'m³'),m('Potencia de mezcla rápida',v.mu*fast*v.g1**2/1e6,'kW'),
      m('Potencia de floculación',v.mu*slow*v.g2**2/1e6,'kW'),m('G·t floculación',60*v.g2*v.slow)],
      ['Dosis (mg/L)','Réplicas','Turbidez media (NTU)','Turbidez máxima (NTU)'],data);},
  'La interpolación usa el primer cruce. Verifica dispersión de réplicas, pH, coagulante y respuesta a escala real.',coa);

  reg('industrial-pretreatment-mass',['industrial-physicochemical-pretreatment-designer'],'water','Pretratamiento industrial · dosis, remoción y sólidos',[
    f('q','Caudal','m³/d',950),f('s','Sólidos afluentes capturados por separado','mg/L',100),
    T('a','Etapas declaradas de precipitación y acondicionamiento','35;18;0.65;16\n12;7;0.45;9',
      'Columnas: dosis comercial (mg/L); concentración afluente del contaminante (mg/L); fracción removida (0–1); sólidos químicos adicionales (mg/L).'),
    L.text('basis','Ensayo, proveedor y condición de operación','Ensayo de jarras y titulación · ejemplo')
  ],'Masa retirada = caudal × concentración × fracción medida. Se suman sólidos químicos, contaminantes capturados y sólidos afluentes declarados sin doble conteo.',
  v=>{check(v.a,4,r=>nn(r)&&r[2]<=1,'Usa dosis y concentraciones no negativas; fracción removida de 0 a 1.');
    const data=v.a.map(([d,c,r,s],i)=>[i+1,load(v.q,d),load(v.q,c*r),c*(1-r),load(v.q,s)]);
    const solid=load(v.q,v.s)+S(data.map(r=>r[2]+r[4]));
    return table([m('Demanda comercial',S(data.map(r=>r[1])),'kg/d'),m('Sólidos totales estimados',solid,'kg/d')],
      ['Etapa','Producto (kg/d)','Contaminante retirado (kg/d)','Concentración residual (mg/L)','Sólidos químicos (kg/d)'],data);},
  'Declara contaminantes y aportes sin duplicarlos. Las fracciones provienen de tratabilidad o datos observados.');

  reg('granular-filter-bank',['granular-media-filter-designer','granular-media-filter-designer?mode=wastewater-tertiary'],'water','Filtros granulares · operación N−1, carga y lavado',[
    f('q','Caudal de tratamiento','m³/h',260),f('n','Filtros instalados','',4,1,100),f('area','Área por filtro','m²',12,eps),
    f('rate','Carga máxima de servicio declarada','m/h',8,eps),f('back','Tasa de retrolavado','m/h',30),
    f('min','Duración de retrolavado','min',8),f('wash','Lavados diarios del sistema','lavados/d',3),
    T('a','Capas de medio granular','0.6;0.7;42;0.85\n0.4;1.3;48;0.78','Columnas: espesor (m); diámetro (mm); porosidad (%); esfericidad (0–1).')
  ],'Carga = Q/área activa. Suma pérdidas limpias Ergun por capa. Lavado = tasa × área de una unidad × tiempo.',
  v=>{A(int(v.n),'Usa un número entero de filtros.');check(v.a,4,([h,d,p,s])=>h>0&&d>0&&p>0&&p<100&&s>0&&s<=1,'Revisa propiedades de medios.');
    const cases=[v.n,v.n-1].filter(Boolean).map(n=>{const vel=v.q/(n*v.area);
      const loss=S(v.a.map(([depth,d,porosity,shape])=>atlasCalc('granular-bed-headloss',{velocity:vel,depth,d,porosity,shape,rho:998,mu:1}).metrics[0][1]));
      return [n,vel,v.rate-vel,loss];});
    const wash=v.back*v.area*v.min/60;
    return table([m('Agua por lavado',wash,'m³'),m('Agua diaria de retrolavado',wash*v.wash,'m³/d'),
      m('Carga con N−1',cases[1]?.[1]??'Sin reserva','m/h'),m('Caudal de retrolavado por filtro',v.back*v.area,'m³/h')],
      ['Filtros en servicio','Carga (m/h)','Margen (m/h)','Pérdida limpia (m)'],cases);},
  'La pérdida corresponde a medio limpio. Se debe comprobar pérdida terminal, expansión y calidad de efluente con datos del proceso.');

  reg('contact-tank-residual-design',['chlorine-chloramine-ct-residual','chlorine-chloramine-ct-residual?mode=wastewater'],'water','Contacto con desinfectante · hidráulica, residual y decloración',[
    select('mode','Aplicación',[['potable','Agua potable · comparación CT'],['wastewater','Efluente · residual y decloración']],'potable'),
    T('a','Segmentos de contacto','120;35;0.55;0.8;65\n120;25;0.65;0.6;65',
      'Columnas: m³/h; volumen útil (m³); factor hidráulico 0–1; residual final (mg/L); CT de referencia (mg·min/L).'),
    f('target','Residual de efluente objetivo (modo efluente)','mg/L',.1),
    f('factor','Factor de agente declorante activo (modo efluente)','mg/mg de residual a retirar',1.46)
  ],'T nominal = 60 V/Q. Tiempo efectivo = T × factor hidráulico. CT = residual × tiempo efectivo. Modo efluente: masa de agente a partir del exceso residual final.',
  v=>{check(v.a,5,r=>nn(r)&&r[0]>0&&r[2]<=1&&(v.mode==='wastewater'||r[4]>0),'Usa caudal positivo, factor entre 0 y 1 y CT objetivo positivo cuando aplique.');
    const last=v.a.at(-1),rows=v.a.map(([q,vol,k,c,ref],i)=>{const t=60*vol/q,ct=t*k*c;return [i+1,t,t*k,c,ct,v.mode==='potable'?ct/ref:null];});
    const main=[m('Tiempo efectivo total',S(rows.map(r=>r[2])),'min'),m('CT calculado',S(rows.map(r=>r[4])),'mg·min/L')];
    if(v.mode==='potable')main.push(m('Razón frente al objetivo',S(rows.map(r=>r[5]))));
    else main.push(m('Declorante activo estimado',load(last[0],Math.max(0,last[3]-v.target)*v.factor),'kg/h'));
    return table(main,['Tramo','Tiempo nominal (min)','Tiempo efectivo (min)','Residual (mg/L)','CT','Razón potable'],rows);},
  'Usa T₁₀ validado o factor aceptado para los segmentos. En efluente, verifica demanda y residual con ensayo. CT de efluente no se usa para crédito de agua potable.',ct);

  reg('uv-reactor-bank-design',['uv-disinfection-designer','uv-disinfection-designer?mode=wastewater'],'water','Reactores UV · capacidad por UVT y reserva',[
    f('q','Caudal de diseño','m³/h',320),p('uvt','Transmitancia de diseño (UVT)',74,.01),
    T('a','Curva validada de capacidad por reactor','65;85\n75;115\n85;145',
      'Columnas: UVT (% a la trayectoria de validación); caudal máximo por reactor (m³/h) para la misma dosis validada.'),
    f('spare','Reactores de reserva','',1,0,40),f('power','Potencia por reactor en servicio','kW',5.8)
  ],'Interpolación de caudal validado entre puntos de UVT. Reactores en servicio = techo(caudal/capacidad).',
  v=>{check(v.a,2,r=>r[0]>0&&r[0]<=100&&r[1]>0,'Usa UVT válida y capacidad positiva.');
    A(int(v.spare)&&v.a.length>=2&&v.a.every((r,i)=>!i||r[0]>v.a[i-1][0]),'Usa reserva entera y UVT estrictamente creciente.');
    const i=v.a.findIndex((r,j)=>j>0&&v.uvt>=v.a[j-1][0]&&v.uvt<=r[0]);A(i>0,'La UVT está fuera del intervalo validado.');
    const [u,c]=v.a[i-1],[u2,c2]=v.a[i],cap=c+(c2-c)*(v.uvt-u)/(u2-u),n=Math.ceil(v.q/cap);
    return out(m('Capacidad por reactor',cap,'m³/h'),m('Reactores operativos',n),m('Reactores instalados',n+v.spare),
      m('Potencia operativa',n*v.power,'kW'),m('Margen de capacidad',n*cap-v.q,'m³/h'));},
  'Ingresa puntos para la misma dosis y condiciones de validación. La capacidad se compara dentro de la envolvente declarada.',uv);

  reg('ozone-generator-contact',['ozone-ct-calculator'],'water','Ozono · generador, transferencia y CT',[
    f('q','Caudal','m³/h',140,eps),f('dose','Dosis transferida objetivo','mg/L',2.2),p('transfer','Eficiencia de transferencia',85,.01),
    f('vol','Volumen efectivo geométrico','m³',32),f('factor','Factor hidráulico','',.6,0,1),
    f('residual','Ozono residual medido al final','mg/L',.28),f('ref','CT objetivo para condición de diseño','mg·min/L',1.4,eps)
  ],'Generación = Q·dosis/eficiencia. CT = residual × factor hidráulico × V/Q.',
  v=>{const transferred=load(v.q,v.dose),gen=100*transferred/v.transfer,t=60*v.vol/v.q*v.factor,ct=t*v.residual;
    return out(m('Capacidad de generador',gen,'kg O₃/h'),m('Masa transferida',transferred,'kg/h'),
      m('Tiempo efectivo',t,'min'),m('CT observado',ct,'mg·min/L'),m('Razón frente al objetivo',ct/v.ref));},
  'El CT objetivo se ingresa para el microorganismo y temperatura aplicables. Verifica residual por tramo, subproductos y manejo de gas.',ct);

  reg('carbonate-water-stability',['water-stability-carbonate-chemistry'],'water','Estabilidad del agua · carbonatos, LSI y RSI',[
    f('ph','pH medido','',7.9,0,14),f('temp','Temperatura','°C',20,0,80),f('tds','TDS','mg/L',380,1,10000),
    f('calcium','Dureza cálcica','mg/L como CaCO₃',140,eps),f('alk','Alcalinidad medida','mg/L como CaCO₃',155,eps),
    f('total','Carbono inorgánico disuelto medido','mmol/L',2.8),
    f('p1','pKa₁ para la muestra','',6.35,0,14),f('p2','pKa₂ para la muestra','',10.33,0,16)
  ],'Se combina la especiación de carbono inorgánico por pKa con pHs de cribado y los índices Langelier y Ryznar.',
  v=>{const index=atlasCalc('calcite-saturation-indices',v);
    const spec=atlasCalc('water-acid-speciation',{system:'carbonate',ph:v.ph,total:v.total,constants:'own',p1:v.p1,p2:v.p2});
    return {...index,headers:spec.headers,rows:spec.rows};},
  'El carbono inorgánico es un dato medido independiente. LSI y RSI son índices empíricos para cribado, no predictores directos de corrosión.');
})();
