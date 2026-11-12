/* Operación de plantas de agua y aguas residuales. */
(function () {
  'use strict';
  const L=GL.lab,{reg,metric:m,metrics,field:f,pct,rows,g,eps}=GL.pluto;
  const {assert:A,sum:S,table:T,select}=L;
  const activated=[['EPA · manual de operación y diagnóstico de PTAR','https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=2000C1E0.TXT']];
  const filmtec=[['DuPont · manual técnico de OI y NF','https://www.dupont.com/content/dam/water/amer/us/en/water/public/documents/en/RO-NF-FilmTec-Manual-45-D01504-en.pdf']];
  const circle=d=>Math.PI*d*d/4;
  const ratio=(n,d)=>d>0?n/d:'Sin denominador positivo';

  reg('chemical-dosing-stock',['dosing','ddosing','stroke'],'water','Dosificación química · solución, producto seco y bomba',[
    f('q','Caudal tratado','m³/h',100),f('dose','Dosis de ingrediente activo','mg/L',12),
    pct('purity','Concentración de activo en producto o solución',12.5,.001),
    f('rho','Densidad de solución (para caudal de bomba)','kg/L',1.18,eps),
    f('max','Capacidad calibrada de bomba a carrera máxima','L/h',25,eps),
    f('hours','Horas de dosificación por día','h/día',24,0,24)
  ],'Masa activa = Q×dosis/1000. Masa de producto = masa activa/fracción activa. Caudal de solución = masa de producto/densidad.',
  v=>{const active=v.q*v.dose/1000,product=active*100/v.purity,solution=product/v.rho,stroke=100*solution/v.max;
    return {...metrics(m('Ingrediente activo',active,'kg/h'),m('Producto comercial o seco',product,'kg/h'),
      m('Solución a dosificar',solution,'L/h'),m('Producto por día operativo',product*v.hours,'kg/día'),
      m('Carrera lineal orientativa',stroke,'%')),message:stroke>100?'La demanda supera la capacidad calibrada de la bomba.':'Comprueba la carrera y el caudal real mediante calibración.'};},
  'La carrera supone respuesta lineal y frecuencia constante. Para dosificación seca se usa la salida de masa.');

  reg('molar-solution-preparation',['molar'],'metrology','Soluciones molares · preparación y dilución',[
    f('c','Concentración molar objetivo','mol/L',.1),f('v','Volumen final','L',1,eps),
    f('mw','Masa molar del reactivo, incluida hidratación','g/mol',58.44,eps),
    pct('purity','Pureza del reactivo sólido',99.5,.001),
    f('stock','Molaridad de solución madre','mol/L',1,eps)
  ],'n=C·V, masa de sólido=n·M/pureza. Para diluir, V₁=C₂V₂/C₁.',
  v=>{const n=v.c*v.v,v1=n/v.stock;
    return metrics(m('Cantidad de sustancia',n,'mol'),m('Reactivo sólido comercial',n*v.mw*100/v.purity,'g'),
      m('Alícuota de solución madre',v1<=v.v?v1:'La madre no es suficientemente concentrada',v1<=v.v?'L':''));},
  'Completa hasta el volumen final, en vez de asumir que los volúmenes de todos los componentes se suman exactamente.');

  reg('stream-blending',['blend'],'water','Mezcla de corrientes · caudal, carga y concentración',[
    T('a','Corrientes de entrada','60;40\n25;150\n15;10','Columnas: caudal (m³/h); concentración del mismo compuesto (mg/L).')
  ],'Balance conservativo. Concentración mezclada = Σ(QᵢCᵢ)/ΣQᵢ. Carga en kg/h = Q·C/1000.',
  v=>{rows(v.a,2,([q,c])=>q>=0&&c>=0,'Usa caudales y concentraciones no negativos.');
    const q=S(v.a.map(r=>r[0])),load=S(v.a.map(([q,c])=>q*c/1000));
    A(q>0,'El caudal total debe ser positivo.');
    return {metrics:[m('Caudal mezclado',q,'m³/h'),m('Concentración de mezcla',1000*load/q,'mg/L'),m('Carga total',load,'kg/h')],
      headers:['Corriente','Caudal (m³/h)','Concentración (mg/L)','Carga (kg/h)'],rows:v.a.map(([q,c],i)=>[i+1,q,c,q*c/1000])};},
  'Conservación de masa en régimen estacionario. El pH y otros parámetros reactivos requieren su propio modelo.');

  reg('activated-sludge-operations',['svi','ftom','srt','ras','sludgemv','slage'],'water','Lodos activados · IVL, F/M, SRT y retorno',[
    f('q','Caudal afluente al reactor','m³/día',2200,eps),f('bod','DBO de entrada al reactor','mg/L',180),
    f('v','Volumen de reactor','m³',900,eps),f('mlss','Sólidos en licor mezcla (MLSS)','mg/L',3400,eps),
    f('mlvss','Sólidos volátiles (MLVSS)','mg/L',2500,eps),f('sv','Volumen sedimentado a 30 minutos','mL/L',300,0,1000),
    f('ras','Concentración de sólidos en retorno','mg/L',8500,eps),f('qw','Caudal de purga','m³/día',25),
    f('xw','Concentración en purga','mg/L',8500),f('qe','Caudal efluente','m³/día',2175),
    f('xe','Sólidos en efluente','mg/L',12),f('secondary','Inventario adicional medido','kg SST',100)
  ],'IVL=1000·V30/MLSS. F/M=Q·DBO/(V·MLVSS). SRT=inventario SST/(Qpurga·Xpurga+Qef·Xef). RAS ideal Q·X/(Xretorno−X).',
  v=>{
    A(v.mlvss<=v.mlss,'MLVSS no puede superar MLSS.');
    const mass=v.v*v.mlss/1000+v.secondary,loss=(v.qw*v.xw+v.qe*v.xe)/1000;
    const ras=v.ras>v.mlss?v.q*v.mlss/(v.ras-v.mlss):'Retorno debe superar MLSS';
    return metrics(m('IVL',1000*v.sv/v.mlss,'mL/g'),m('Relación F/M',v.q*v.bod/(v.v*v.mlvss),'kg DBO/(kg MLVSS·día)'),
      m('SRT o edad de lodo',ratio(mass,loss),loss>0?'días':''),m('Inventario de sólidos',mass,'kg SST'),
      m('Sólidos retirados',loss,'kg SST/día'),m('Caudal ideal de retorno',ras,typeof ras==='number'?'m³/día':''),
      m('Recirculación ideal',typeof ras==='number'?100*ras/v.q:'No disponible',typeof ras==='number'?'%':''));
  },'SRT usa inventario y salidas de sólidos del mismo sistema. El balance ideal de RAS desprecia purga y SST efluente en el clarificador.',activated);

  reg('clarifier-solids-loading',['cylrate','rectrate','slr','vslr'],'water','Clarificador · carga hidráulica y de sólidos',[
    select('shape','Geometría',[['circle','Circular'],['box','Rectangular']],'circle'),
    f('d','Diámetro (circular)','m',18,eps),f('len','Longitud (rectangular)','m',20,eps),
    f('width','Ancho (rectangular)','m',6,eps),f('depth','Profundidad útil media','m',3.5,eps),
    f('q','Caudal neto superficial por unidad','m³/día',2400),f('feed','Caudal total de alimentación por unidad','m³/día',3900),
    f('x','Sólidos en alimentación','mg/L',3000)
  ],'Carga hidráulica superficial = caudal neto/área. Carga de sólidos = Q de alimentación × concentración, dividida por área o volumen.',
  v=>{const a=v.shape==='circle'?circle(v.d):v.len*v.width,vol=a*v.depth,solids=v.feed*v.x/1000;
    return metrics(m('Área de clarificación',a,'m²'),m('Tasa superficial',v.q/a,'m³/(m²·día)'),m('Carga de sólidos',solids/a,'kg/(m²·día)'),
      m('Carga volumétrica',solids/vol,'kg/(m³·día)'),m('Volumen útil',vol,'m³'));},
  'En clarificación secundaria la alimentación de sólidos incluye la recirculación que entra al clarificador. Verifica cargas de punta por unidad.',activated);

  reg('stokes-settling',['stokes'],'water','Sedimentación discreta · velocidad de Stokes',[
    f('diam','Diámetro de partícula','µm',45,eps),f('particle','Densidad de partícula','kg/m³',2650,eps),
    f('fluid','Densidad del líquido','kg/m³',998,eps),f('mu','Viscosidad dinámica','mPa·s',1,eps),f('depth','Recorrido vertical','m',2)
  ],'v=g(ρp−ρf)d²/(18μ). Se comprueba el Reynolds de partícula para evaluar el dominio de Stokes.',
  v=>{A(v.particle>v.fluid,'Para sedimentación la partícula debe ser más densa que el fluido.');
    const d=v.diam*1e-6,mu=v.mu/1000,u=g*(v.particle-v.fluid)*d*d/(18*mu),re=v.fluid*u*d/mu;
    A(re<=1,'El Reynolds estimado supera 1. Usa un modelo de arrastre apropiado fuera del régimen de Stokes.');
    return metrics(m('Velocidad terminal',u*3600,'m/h'),m('Reynolds de partícula',re),m('Tiempo para el recorrido',v.depth/(u*3600),'h'));},
  'Partícula esférica aislada, suspensión diluida y fluido newtoniano. La aproximación es más fiable para Re mucho menor que 1.');

  reg('bed-contact-capacity',['sorption','ebct'],'water','Lecho de sorción · EBCT, BV/h y capacidad útil',[
    f('q','Caudal de operación','m³/h',28,eps),f('bed','Volumen aparente de lecho','m³',4.5,eps),
    f('capacity','Capacidad útil por volumen de lecho','kg soluto/m³',10),
    f('inlet','Concentración de entrada','mg/L',12),f('outlet','Concentración objetivo de salida','mg/L',2)
  ],'EBCT=volumen aparente/caudal. BV/h=caudal/volumen. Duración nominal=capacidad útil/carga retenida.',
  v=>{A(v.inlet>=v.outlet,'La salida objetivo supera a la entrada.');
    const uptake=v.q*(v.inlet-v.outlet)/1000,mass=v.capacity*v.bed;
    return metrics(m('Contacto de lecho vacío',60*v.bed/v.q,'min'),m('Tasa de servicio',v.q/v.bed,'BV/h'),
      m('Capacidad útil nominal',mass,'kg'),m('Carga retenida',uptake,'kg/h'),m('Duración teórica',ratio(mass,uptake),uptake>0?'h':''));},
  'Usa capacidad útil a la ruptura, obtenida con la misma calidad de agua y caudal. El resultado supone concentración y caudal constantes.');

  reg('ion-exchange-softening',['regeneration','softener'],'water','Ablandamiento iónico · resina, ciclo y regeneración',[
    f('q','Caudal de servicio','m³/h',16,eps),f('hardness','Dureza a retirar','mg/L como CaCO₃',225),
    f('bed','Volumen de resina','m³',1.5,eps),f('capacity','Capacidad operativa de resina','eq/L',1.1,eps),
    f('salt','Dosis de NaCl por volumen de resina','kg/m³',110),pct('brine','Fracción másica de NaCl en salmuera',10,.01),
    f('density','Densidad de salmuera','kg/L',1.075,eps)
  ],'Carga de dureza = Q·dureza/50,043. Capacidad = eq/L × litros de resina. Sal = dosis × volumen de resina. Volumen de salmuera = sal/(fracción·densidad).',
  v=>{const demand=v.q*v.hardness/50.043,capacity=1000*v.bed*v.capacity,salt=v.salt*v.bed,time=ratio(capacity,demand);
    return metrics(m('Capacidad útil',capacity,'eq'),m('Carga de dureza',demand,'eq/h'),m('Duración nominal del ciclo',time,demand>0?'h':''),
      m('Agua tratada por ciclo',typeof time==='number'?time*v.q:time,demand>0?'m³':''),m('NaCl por regeneración',salt,'kg'),
      m('Salmuera por regeneración',salt*100/(v.brine*v.density),'L'));},
  'La capacidad operativa depende de la dosis de regeneración, la resina, los iones competidores y la fuga admisible.');

  reg('filter-hydraulic-loading',['cylfilter','membrane'],'water','Filtración · tasa superficial y flujo de membrana',[
    select('shape','Área de referencia',[['bed','Lecho cilíndrico'],['membrane','Área activa de membrana']],'bed'),
    f('q','Caudal de filtración o permeado por unidad','m³/h',24),f('d','Diámetro interno del filtro','m',1.8,eps),
    f('area','Área activa de membrana','m²',100,eps)
  ],'J=Q/A. En lecho cilíndrico A=πD²/4; en membranas se usa área activa.',
  v=>{const a=v.shape==='bed'?circle(v.d):v.area,u=v.q/a;
    return metrics(m('Tasa superficial',u,'m³/(m²·h)'),m('Flujo específico',1000*u,'L/(m²·h)'),m('Área de referencia',a,'m²'));},
  'Usa caudal de cada unidad en servicio. Para membranas el caudal corresponde al permeado.');

  reg('membrane-series-balance',['recovery','serialrec','rotransp'],'water','Membranas en serie · recuperación y balance salino',[
    f('q','Caudal inicial de alimentación','m³/h',100,eps),f('c','Concentración de alimentación','mg/L',800),
    T('a','Etapas alimentadas por el concentrado anterior','45;98\n25;97','Columnas: recuperación de agua (%); rechazo observado respecto a alimentación de la etapa (%).')
  ],'Qp=Qf·recuperación. Cp=Cf·(1−rechazo). Qc=Qf−Qp y Cc=(QfCf−QpCp)/Qc. Se mezcla el permeado de las etapas.',
  v=>{
    rows(v.a,2,([y,r])=>y>=0&&y<100&&r>=0&&r<=100,'Usa recuperación de 0 a menos de 100 % y rechazo de 0 a 100 %.');
    A(v.a.length<=20,'Usa hasta 20 etapas.');
    let q=v.q,c=v.c,p=0,solute=0;
    const data=v.a.map(([y,r],i)=>{
      const qp=q*y/100,cp=c*(1-r/100),qc=q-qp;
      const cc=c*(1-(y/100)*(1-r/100))/(1-y/100);
      p+=qp;solute+=qp*cp;q=qc;c=cc;
      return [i+1,qp,cp,q,c];
    });
    return {metrics:[m('Recuperación global',100*p/v.q,'%'),m('Caudal de permeado combinado',p,'m³/h'),
      m('Concentración del permeado combinado',ratio(solute,p),p>0?'mg/L':''),m('Caudal final de concentrado',q,'m³/h'),
      m('Concentración final de concentrado',c,'mg/L')],headers:['Etapa','Permeado (m³/h)','Cp (mg/L)','Concentrado (m³/h)','Cc (mg/L)'],rows:data};
  },'Etapas en serie de concentrado, sin recirculación ni precipitación. El rechazo se introduce por etapa a condiciones comparables.',filmtec);

  reg('membrane-permeability',['permeability'],'water','MF/UF · permeabilidad y corrección de viscosidad',[
    f('q','Permeado medido','m³/h',6),f('area','Área activa','m²',120,eps),
    f('tmp','Presión transmembrana efectiva','bar',.7,eps),f('mu','Viscosidad a la temperatura de ensayo','mPa·s',.89,eps),
    f('ref','Viscosidad a la temperatura de referencia','mPa·s',1.002,eps)
  ],'Flujo = Q/A. Permeabilidad observada = flujo/TMP. Normalización por viscosidad = permeabilidad observada × μensayo/μref.',
  v=>{const j=1000*v.q/v.area,p=j/v.tmp;return metrics(m('Flujo de permeado',j,'L/(m²·h)'),
    m('Permeabilidad observada',p,'L/(m²·h·bar)'),m('Permeabilidad normalizada',p*v.mu/v.ref,'L/(m²·h·bar)'));},
  'Comparación de MF/UF a resistencia constante. Usa una TMP medida y viscosidad de la solución a cada temperatura.');

  reg('silt-density-index',['sdi'],'water','Pretratamiento de membranas · índice SDI',[
    f('initial','Tiempo inicial de recolección','s',35,eps),f('final','Tiempo final para el mismo volumen','s',70,eps),
    select('duration','Intervalo de ensayo',[['5','5 minutos'],['10','10 minutos'],['15','15 minutos']],'15')
  ],'Taponamiento = 100·(1−tᵢ/tf). SDIₜ = taponamiento/T.',
  v=>{A(v.final>=v.initial,'El tiempo final debe ser igual o mayor que el inicial.');
    const p=100*(1-v.initial/v.final);A(p<=75,'El taponamiento supera 75 %. Repite la prueba con intervalo más corto.');
    return metrics(m('SDI'+v.duration,p/Number(v.duration),'%/min'),m('Taponamiento',p,'%'));},
  'Usa el mismo volumen de ensayo y el protocolo aplicable a membrana de 0,45 µm a presión constante.',filmtec);

  reg('granular-bed-headloss',['granular'],'water','Medio granular · pérdida de carga de Ergun',[
    f('velocity','Velocidad superficial','m/h',7),f('d','Diámetro representativo de partícula','mm',.7,eps),
    f('depth','Altura de lecho','m',1.2,eps),pct('porosity','Porosidad de lecho',42,.01,99.99),
    f('shape','Esfericidad del medio','',.85,.01,1),f('rho','Densidad del fluido','kg/m³',998,eps),
    f('mu','Viscosidad dinámica','mPa·s',1,eps)
  ],'Ergun suma un término viscoso 150 μ(1−ε)²v/(ε³dₑ²) y uno inercial 1,75ρ(1−ε)v²/(ε³dₑ), con dₑ=φd.',
  v=>{const u=v.velocity/3600,d=v.d*v.shape/1000,e=v.porosity/100;
    const viscous=150*(v.mu/1000)*(1-e)**2*u/(e**3*d*d),inertial=1.75*v.rho*(1-e)*u*u/(e**3*d),dp=(viscous+inertial)*v.depth;
    return metrics(m('Pérdida de carga de lecho',dp/(v.rho*g),'m'),m('Caída de presión',dp/1000,'kPa'),
      m('Gradiente viscoso',viscous,'Pa/m'),m('Gradiente inercial',inertial,'Pa/m'));},
  'Lecho fijo de porosidad uniforme. No representa la fluidización ni la expansión del medio durante retrolavado.');
})();
