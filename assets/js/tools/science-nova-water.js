/* Modelos de proceso de agua y efluentes. */
(function () {
  'use strict';
  const L=GL.lab,{register:R,f,pct,table,check,plot,nn}=GL.nova;
  R('activated-sludge-monod-cstr','activated-sludge-modeling','wastewater','Lodos activados · reactor CSTR con cinética de Monod',
    [f('s0','Sustrato biodegradable soluble de entrada','mg/L',210),f('q','Caudal','m³/d',1500,.001),
      f('volume','Volumen biológico','m³',750,.001),f('srt','Edad de lodos','d',12,.01),
      f('mu','Crecimiento específico máximo','d⁻¹',2,.001),f('ks','Constante de semisaturación','mg/L',30,.001),
      f('b','Decaimiento endógeno','d⁻¹',.1),f('yield','Rendimiento biomasa/sustrato','g/g',.6,.001,2)],
    'En equilibrio positivo μ(S) = b + 1/SRT. Se resuelve Monod para S. El balance de sustrato entrega la concentración de biomasa activa y su purga.',
    'Mezcla completa, sustrato único, biomasa entrante despreciable y SRT efectivo declarado. DBO particulada, inertes, nitrificación y oxígeno requieren balances adicionales.',
    v=>{
      const hrt=v.volume/v.q, required=v.b+1/v.srt;
      const growthAtInlet=v.mu*v.s0/(v.ks+v.s0);
      const washout=growthAtInlet<=required;
      const s=washout?v.s0:v.ks*required/(v.mu-required);
      const removed=v.q*(v.s0-s)/1000;
      const solids=removed*v.yield/(1+v.b*v.srt);
      return {metrics:[['Sustrato soluble en efluente',s,'mg/L'],['Sustrato removido',removed,'kg/d'],
        ['Biomasa activa en reactor',solids*v.srt/v.volume*1000,'mg/L'],['Purga de biomasa activa',solids,'kg/d'],
        ['Retención hidráulica',hrt*24,'h'],['SRT crítica al sustrato de entrada',growthAtInlet>v.b?1/(growthAtInlet-v.b):'Sin crecimiento neto','d']],
        message:washout?'La tasa de crecimiento a la entrada es insuficiente para sostener biomasa activa.':'El equilibrio del modelo sostiene biomasa activa.'};
    });

  R('iron-media-arsenic-adsorption','arsenic-removal-fe-oxide','water','Arsénico · lecho de óxido de hierro con capacidad de ruptura',
    [f('cin','Arsénico de entrada','µg/L',85),f('target','Umbral a la salida','µg/L',10),f('flow','Caudal','m³/h',12,.001),
      f('capacity','Capacidad útil medida hasta ruptura al umbral','mg As/g medio',.85,.00001),
      f('bulk','Densidad aparente del medio','kg/m³',670,.01),f('ebct','Contacto de lecho vacío objetivo','min',5,.001),
      f('service','Servicio deseado','d',60,.001),pct('load','Disponibilidad horaria del proceso',100,.01)],
    'La carga de diseño usa toda la masa de arsénico afluente. El volumen requerido es el mayor entre el criterio de contacto y la masa obtenida con la capacidad útil medida hasta ruptura.',
    'Usa una capacidad de columna al umbral elegido, con especiación As(III)/As(V), pH, fosfato y sílice representativos. La salida y la capacidad se verifican con ensayos. Si cin supera el umbral, usar toda la carga afluente es conservador.',
    v=>{
      const inlet=v.flow*v.cin*24*v.load/100/1000;
      const load=v.cin>v.target?inlet:0;
      const contact=v.flow*v.ebct/60, massCapacity=load*v.service/v.capacity;
      const volume=Math.max(contact,massCapacity/v.bulk), mass=volume*v.bulk;
      return {metrics:[['Volumen de medio requerido',volume,'m³'],['Masa de medio',mass,'kg'],['Contacto de lecho vacío',60*volume/v.flow,'min'],
        ['Carga afluente de arsénico',inlet,'g/d'],['Servicio conservador',load>0?mass*v.capacity/load:'Entrada en el umbral o por debajo','d']],
        message:v.cin<=v.target?'El afluente ya cumple el umbral de concentración indicado.':'Verifica el desempeño mediante ruptura en columna y seguimiento del efluente.'};
    });

  R('trickling-filter-loading','biofilter-trickling','wastewater','Filtro percolador · recirculación y cargas de diseño',
    [f('q','Caudal externo','m³/d',950,.001),f('cin','DBO de entrada','mg/L',180),f('target','DBO objetivo en el efluente','mg/L',30),
      f('recycle','Relación caudal recirculado / externo','',1.4),f('depth','Profundidad del lecho','m',2.8,.001),
      f('olr','Carga orgánica volumétrica admisible','kg DBO/m³·d',.6,.001),
      f('hlr','Carga hidráulica superficial máxima','m³/m²·d',32,.001)],
    'Dimensiona por la mayor área entre carga hidráulica total y carga orgánica aplicada. Se mezcla el retorno a la concentración objetivo para calcular la carga del lecho.',
    'Carga admisible definida por el medio, la temperatura y la evidencia de diseño. La DBO objetivo se usa como supuesto de recirculación; verificar remoción y clarificación.',
    v=>{
      L.assert(v.target<=v.cin,'La DBO objetivo supera la de entrada.');
      const recycle=v.q*v.recycle, flow=v.q+recycle, mass=(v.q*v.cin+recycle*v.target)/1000;
      const area=Math.max(flow/v.hlr,mass/(v.olr*v.depth)), volume=area*v.depth;
      return {metrics:[['Área de lecho requerida',area,'m²'],['Volumen de medio',volume,'m³'],['Caudal con recirculación',flow,'m³/d'],
        ['DBO mezclada',1000*mass/flow,'mg/L'],['Carga volumétrica',mass/volume,'kg/m³·d'],['Carga hidráulica',flow/area,'m³/m²·d'],
        ['Remoción requerida por balance externo',v.q*(v.cin-v.target)/1000,'kg/d']]};
    });

  R('treatment-wetland-area','constructed-wetland-treatment','wastewater','Humedal construido · área por cinética k–C*',
    [f('q','Caudal de diseño','m³/d',75,.001),f('cin','Concentración afluente','mg/L',110),f('target','Meta de efluente','mg/L',25),
      f('background','Concentración de fondo C*','mg/L',6),f('k20','Constante areal a 20 °C','m/d',.085,.000001),
      f('theta','Factor térmico θ','',1.06,.8,1.3),f('temp','Temperatura de operación','°C',16,0,50),
      f('depth','Profundidad saturada','m',.55,.001),pct('porosity','Porosidad efectiva',38,.01)],
    'Csalida = C* + (Centrada − C*) exp(−kT A/Q), con kT = k20 θ^(T−20). El tiempo nominal usa volumen de poros.',
    'Modelo de flujo pistón y área para un constituyente. Declara coeficientes calibrados para la tipología y verifica hidráulica, colmatación y condiciones estacionales.',
    v=>{
      L.assert(v.target>v.background&&v.cin>=v.target,'La entrada debe ser mayor o igual a la meta, y la meta superior a C*.');
      const k=v.k20*v.theta**(v.temp-20);
      const a=v.q/k*Math.log((v.cin-v.background)/(v.target-v.background));
      return {metrics:[['Área de tratamiento',a,'m²'],['Retención nominal',a*v.depth*v.porosity/100/v.q,'d'],
        ['Constante areal corregida',k,'m/d'],['Carga removida de diseño',v.q*(v.cin-v.target)/1000,'kg/d']]};
    });

  R('mbr-process-membrane-sizing','wastewater-mbr-bioreactor','wastewater','MBR · reactor biológico, sólidos y área de membrana',
    [f('q','Caudal medio neto','m³/d',1000,.001),f('peak','Factor de caudal punta','',1.65,1),f('bod','DBO afluente','mg/L',240),
      f('mlss','Sólidos suspendidos del licor mezcla','mg/L',7800,.01),pct('volatile','Fracción volátil',75,.01),
      f('fm','Carga F/M de diseño','kg DBO/kg SSV·d',.12,.0001),f('hrt','Retención hidráulica mínima a caudal medio','h',7),
      f('srt','Edad de lodos objetivo','d',22,.01),f('purge','Concentración de la purga','mg/L',9500,.01),
      f('flux','Flujo de filtración a punta','L/m²·h',22,.01),pct('duty','Fracción neta disponible para filtración',85,.01),
      f('tmp','Presión transmembrana a punta','kPa',22,.01)],
    'Volumen = máximo de Q × HRT y carga DBO/(F/M × SSV). El inventario de sólidos y SRT fijan la purga. El área de membrana usa caudal punta dividido por flujo y fracción disponible.',
    'Dimensionamiento conceptual. La purga supone sólidos despreciables en permeado. Selecciona flujo, tiempos de limpieza y reserva con datos del fabricante y verifica producción neta de sólidos.',
    v=>{
      const organic=v.q*v.bod/1000;
      const volume=Math.max(v.q*v.hrt/24,organic/(v.fm*v.mlss*v.volatile/100000));
      const solids=volume*v.mlss/1000, area=v.q*v.peak*1000/24/(v.flux*v.duty/100);
      return {metrics:[['Área de membrana a punta',area,'m²'],['Volumen biológico',volume,'m³'],['Retención a caudal medio',24*volume/v.q,'h'],
        ['Inventario de sólidos',solids,'kg'],['Purga teórica',1000*solids/v.srt/v.purge,'m³/d'],
        ['Permeabilidad aparente a punta',100*v.flux/v.tmp,'L/m²·h·bar']]};
    });

  R('streeter-phelps-river-oxygen','water-quality-do-bod','water','Ríos · curva de oxígeno disuelto Streeter–Phelps',
    [f('bod','DBO última después de mezcla','mg/L',16),f('sat','Oxígeno de saturación','mg/L',8.8,.01),
      f('do0','Oxígeno inicial después de mezcla','mg/L',7.4),f('kd','Desoxigenación a temperatura del río','d⁻¹',.27,.000001,100),
      f('kr','Reaireación a temperatura del río','d⁻¹',.53,.000001,100),
      f('u','Velocidad media','m/s',.24,.0001),f('km','Longitud evaluada','km',90,.001)],
    'Se resuelve D′ = kd L − kr D, con L = L0 e^(−kd t), y OD = ODsat − D. Para tasas iguales se usa el límite analítico t e^(−kd t).',
    'Supone mezcla inicial completa y flujo estable. Un valor negativo indica que el modelo lineal agotó el oxígeno y salió de su dominio físico.',
    v=>{
      const end=v.km/86.4/v.u, d0=v.sat-v.do0, delta=v.kr-v.kd;
      function deficit(t){
        const ea=Math.exp(-Math.min(v.kd,v.kr)*t);
        const convolution=delta===0?t*ea:ea*(-Math.expm1(-Math.abs(delta)*t))/Math.abs(delta);
        return d0*Math.exp(-v.kr*t)+v.kd*v.bod*convolution;
      }
      const slope=t=>v.kd*v.bod*Math.exp(-v.kd*t)-v.kr*deficit(t);
      let critical=slope(0)>0?end:0;
      if(slope(0)>0&&slope(end)<0){
        let lo=0,hi=end;
        for(let i=0;i<60;i++){
          const mid=(lo+hi)/2;
          if(slope(mid)>0)lo=mid;else hi=mid;
        }
        critical=(lo+hi)/2;
      }
      if(deficit(end)>deficit(critical))critical=end;
      const minimum=v.sat-deficit(critical);
      const rows=Array.from({length:61},(_,i)=>{
        const t=end*i/60;
        return [v.km*i/60,t,v.bod*Math.exp(-v.kd*t),v.sat-deficit(t)];
      });
      return {metrics:[['Oxígeno mínimo calculado',minimum,'mg/L'],['Distancia al mínimo',critical*v.u*86.4,'km'],
        ['Tiempo al mínimo',critical,'d'],['Oxígeno al final',v.sat-deficit(end),'mg/L']],
        headers:['Distancia (km)','Tiempo (d)','DBO remanente (mg/L)','Oxígeno disuelto (mg/L)'],rows,
        series:[plot('Oxígeno disuelto',rows,0,3),plot('DBO última remanente',rows,0,2)],xLabel:'Distancia (km)',yLabel:'mg/L',
        message:minimum<0?'El tramo entra en agotamiento de oxígeno. El valor negativo es una señal de invalidez del modelo en esa zona.':''};
    },[['EPA · formulación del balance de oxígeno','https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=9100HZ75.TXT']]);

  R('river-discharge-mixing-limit','river-pollutant-dilution','wastewater','Vertido a río · mezcla completa y concentración admisible',
    [f('qr','Caudal del río aguas arriba','m³/s',1.8),f('cr','Concentración aguas arriba','mg/L',2.8),
      f('qe','Caudal de descarga','m³/s',.12,.000001),f('ce','Concentración del efluente','mg/L',24),
      f('target','Meta de concentración tras mezcla','mg/L',4)],
    'Mezcla conservativa: Cm = (Qr Cr + Qe Ce)/(Qr + Qe). La concentración admisible del efluente despeja Ce para la meta de mezcla declarada.',
    'Mezcla completa e inmediata, sin transformación. Para descargas reales verifica caudal crítico, zona de mezcla y umbrales aplicables. Un resultado negativo en el balance inverso señala que ni un efluente sin contaminante alcanzaría la meta.',
    v=>{
      const total=v.qr+v.qe, mixed=(v.qr*v.cr+v.qe*v.ce)/total, permissible=(v.target*total-v.qr*v.cr)/v.qe;
      return {metrics:[['Concentración mezclada',mixed,'mg/L'],['Margen respecto a la meta',v.target-mixed,'mg/L'],
        ['Concentración máxima del efluente para la meta',permissible>=0?permissible:'Meta inalcanzable','mg/L'],
        ['Carga aportada por el efluente',86.4*v.qe*v.ce,'kg/día'],['Caudal total',total,'m³/s']]};
    });

  R('pool-chlorine-residual-decay','swimming-pool-chlorine-decay-cti','water','Piscinas · residual de cloro, HOCl y exposición integrada',
    [f('c','Cloro libre inicial','mg/L',2.2),f('ph','pH','',7.5,0,14),f('pka','pKa de HOCl a las condiciones del agua','',7.53,0,14),
      f('k','Constante de decaimiento ajustada a mediciones','h⁻¹',.24,0,100),
      f('hours','Tiempo de seguimiento','h',6,0,1000),f('threshold','Umbral operativo ingresado','mg/L',1)],
    'Cloro libre = C0 e^(−kt). Fracción HOCl = 1/[1 + 10^(pH−pKa)]. CT integrado = ∫ C(t) dt, expresado en minutos.',
    'Modelo de cloro libre con pH fijo y decaimiento empírico. La especiación excluye estabilizantes como el ácido cianúrico. El CT integrado es una exposición calculada, sin atribución de inactivación.',
    v=>{
      const fraction=1/(1+10**(v.ph-v.pka)), at=t=>v.c*Math.exp(-v.k*t);
      const ct=60*v.c*(v.k===0?v.hours:-Math.expm1(-v.k*v.hours)/v.k);
      const time=v.c<=v.threshold?0:v.k>0&&v.threshold>0?Math.log(v.c/v.threshold)/v.k:'Sin cruce finito';
      const rows=Array.from({length:41},(_,i)=>{const t=v.hours*i/40;return [t,at(t),at(t)*fraction];});
      return {metrics:[['Cloro libre final',at(v.hours),'mg/L'],['HOCl como cloro equivalente',at(v.hours)*fraction,'mg/L como Cl₂'],
        ['Fracción HOCl',100*fraction,'%'],['CT integrado de cloro libre',ct,'mg·min/L'],['Tiempo al umbral',time,'h']],
        headers:['Tiempo (h)','Cloro libre (mg/L)','HOCl (mg/L como Cl₂)'],rows,
        series:[plot('Cloro libre',rows,0,1),plot('HOCl',rows,0,2)],xLabel:'Tiempo (h)',yLabel:'mg/L como Cl₂'};
    });

  R('ozone-pilot-bromate-screen','ozone-treatment-water-cao','water','Ozonación · transferencia, CT y bromato de ensayo',
    [f('q','Caudal líquido','m³/h',120,.001),f('volume','Volumen de contacto','m³',48,.001),
      pct('transfer','Eficiencia de transferencia',85,.01),pct('t10','Fracción hidráulica T10 / TRH',55,.01),
      f('limit','Umbral de bromato para comparación','µg/L',10),
      table('pilot','Ensayos con la misma matriz y condiciones de contacto',
        ['Ozono transferido (mg/L)','Residual al T10 (mg/L)','Bromato medido (µg/L)'],
        '0.6;0.07;1.5\n1;0.15;3.1\n1.4;0.32;7.4\n1.8;0.5;13.1','Una fila por condición ensayada. Usa el residual mínimo pertinente al segmento evaluado.')],
    'Por ensayo, CT = residual × T10 y generación de ozono = caudal × dosis transferida / eficiencia. Se compara el bromato medido con el umbral declarado.',
    'El bromato se informa a partir de mediciones. Ensaya la matriz real para bromuro, pH, temperatura y dosis aplicable. El módulo evalúa opciones y no estima inactivación ni formación química fuera de los ensayos.',
    v=>{
      check(v.pilot,3,r=>nn(r)&&r[1]<=r[0],'La dosis, residual y bromato deben ser válidos. El residual no debe superar la dosis transferida.');
      const t10=60*v.volume/v.q*v.t10/100;
      const rows=v.pilot.map(([dose,residual,br])=>[dose,residual,residual*t10,v.q*dose/(v.transfer/100)/1000,br,br<=v.limit?'Dentro del umbral':'Supera el umbral']);
      const pass=rows.filter(r=>r[4]<=v.limit);
      return {metrics:[['Tiempo efectivo T10',t10,'min'],['Ensayos dentro del umbral',pass.length,'ensayos'],
        ['Mayor CT entre ensayos dentro del umbral',pass.length?Math.max(...pass.map(r=>r[2])):'Sin ensayos aptos','mg·min/L']],
        headers:['Dosis (mg/L)','Residual (mg/L)','CT (mg·min/L)','Ozono generado (kg/h)','Bromato (µg/L)','Comparación'],rows};
    });
})();
