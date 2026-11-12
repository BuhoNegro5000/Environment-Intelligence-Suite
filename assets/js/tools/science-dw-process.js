/* Agua industrial, química y diagnóstico de membranas. */
(function(){
  'use strict';
  const L=GL.lab,{f,p,m,out,reg,rows,eps}=GL.dw,{assert:A,select,table:T}=L;

  reg('alkalinity-fractionation-pm','water','alcalinidade-p-m-fracionamento','Alcalinidad P y M · hidróxidos, carbonatos y bicarbonatos',[
    f('p','Alcalinidad a fenolftaleína (P)','mg/L como CaCO₃',35),
    f('total','Alcalinidad total (M)','mg/L como CaCO₃',120)
  ],'En la aproximación carbonatada, OH = máx(2P−M,0), HCO₃ = máx(M−2P,0) y CO₃ = M−OH−HCO₃. Todas son contribuciones equivalentes como CaCO₃.',
  v=>{A(v.p<=v.total,'La alcalinidad P no puede superar la alcalinidad total.');
    const oh=Math.max(0,2*v.p-v.total),b=Math.max(0,v.total-2*v.p);
    return out(m('Hidróxidos',oh,'mg/L como CaCO₃'),m('Carbonatos',v.total-oh-b,'mg/L como CaCO₃'),
      m('Bicarbonatos',b,'mg/L como CaCO₃'),m('Alcalinidad total',v.total,'mg/L como CaCO₃'));},
  'Fraccionamiento por puntos finales de titulación. La presencia de otros sistemas alcalinos puede invalidar la interpretación por especies.',
  [['EPA · definiciones de alcalinidad','https://www3.epa.gov/storet/modern/doc/ChemNamesWOPC20.pdf']]);

  reg('cooling-tower-water-losses','industrial-water','evaporacao-torre-resfriamento','Torre de enfriamiento · evaporación, arrastre y ciclos observados',[
    f('q','Caudal de circulación','m³/h',850),f('dt','Diferencia térmica del agua','K',5),
    f('cp','Calor específico del agua','kJ/(kg·K)',4.18,eps),f('latent','Calor latente de evaporación','kJ/kg',2430,eps),
    p('share','Fracción del calor evacuada por evaporación',80),p('drift','Arrastre sobre el caudal circulante',.025),
    f('makeup','Conductividad de reposición compensada','µS/cm',330,eps),
    f('circulation','Conductividad circulante compensada','µS/cm',1320)
  ],'Evaporación ≈ circulación·cp·ΔT·fracción latente/calor latente. Arrastre = circulación × fracción. Ciclos observados = conductividad circulante/de reposición.',
  v=>{const e=v.q*v.cp*v.dt*v.share/(100*v.latent),d=v.q*v.drift/100,c=v.circulation/v.makeup,blow=c>1?e/(c-1)-d:null;
    return {...out(m('Evaporación estimada',e,'m³/h'),m('Pérdida por arrastre',d,'m³/h'),m('Ciclos observados por conductividad',c),
      m('Purga compatible estimada',blow===null?null:Math.max(0,blow),'m³/h')),
      message:c<=1?'Con ciclos ≤ 1 no se estima la purga por concentración.':blow<0?'El arrastre supera la salida líquida compatible con esos ciclos.':''};},
  'La evaporación usa densidades líquidas aproximadamente iguales. Para los ciclos, usa conductividades comparables a la misma temperatura; aportes de químicos pueden sesgar la razón.',
  [['DOE · gestión de torres de enfriamiento','https://www.energy.gov/cmei/femp/best-management-practice-10-cooling-tower-management']]);

  reg('boiler-blowdown-quality-limit','industrial-water','purga-caldeira-tds-silica','Caldera · purga limitada por TDS o sílice',[
    f('steam','Producción de vapor','t/h',12),f('tdsFeed','TDS de alimentación','mg/kg',120),
    f('tdsMax','TDS máximo de caldera','mg/kg',1500,eps),f('siFeed','Sílice en alimentación','mg/kg como SiO₂',8),
    f('siMax','Sílice máxima en caldera','mg/kg como SiO₂',80,eps),
    p('return','Vapor recuperado como condensado',70)
  ],'Cada parámetro limita los ciclos a C límite/C alimentación. Se adopta el menor. Con vapor libre de soluto, purga = vapor/(ciclos−1).',
  v=>{const t=v.tdsFeed?v.tdsMax/v.tdsFeed:Infinity,s=v.siFeed?v.siMax/v.siFeed:Infinity,cycles=Math.min(t,s);
    A(cycles>1,'La alimentación alcanza o supera algún límite. Se requiere acondicionamiento previo.');
    const b=Number.isFinite(cycles)?v.steam/(cycles-1):0,feed=v.steam+b;
    return out(m('Purga mínima por balance',b,'t/h'),m('Ciclos limitantes',Number.isFinite(cycles)?cycles:'Sin aporte declarado'),
      m('Restricción activa',t===s?(Number.isFinite(t)?'TDS y sílice':'Sin aporte'):(t<s?'TDS':'Sílice')),
      m('Alimentación total',feed,'t/h'),m('Reposición neta',feed-v.steam*v.return/100,'t/h'));},
  'Usa límites de operación aplicables a la presión y al fabricante. El balance supone vapor sin arrastre de sólidos y sílice conservativa.',
  [['DOE · minimización de purga','https://www.energy.gov/sites/prod/files/2014/05/f16/steam9_blowdown.pdf']]);

  reg('membrane-observed-recovery-rejection','membranes','rejeicao-sais-osmose-reversa','Membranas · recuperación, rechazo y paso de sales medidos',[
    f('feed','Caudal de alimentación','m³/h',90,eps),f('product','Caudal de permeado','m³/h',60),
    f('area','Área activa de membrana','m²',2400,eps),
    select('basis','Base de medición',[['tds','Concentraciones TDS (mg/L)'],['ec','Conductividad compensada (µS/cm)']],'tds'),
    f('inlet','Lectura de alimentación','mg/L o µS/cm',1000,eps),f('outlet','Lectura de permeado','mg/L o µS/cm',35)
  ],'Recuperación=Qp/Qf. Rechazo aparente=1−Cp/Cf. Si se usa TDS, C concentrado=(Qf·Cf−Qp·Cp)/(Qf−Qp).',
  v=>{A(v.product<v.feed,'El permeado debe ser menor que la alimentación.');
    const c=v.feed-v.product,r=v.outlet/v.inlet,remaining=v.feed*v.inlet-v.product*v.outlet;
    A(v.basis==='ec'||remaining>=0,'El balance salino implicaría masa negativa en el concentrado.');
    return out(m('Recuperación observada',100*v.product/v.feed,'%'),m('Rechazo aparente',100*(1-r),'%'),
      m('Paso relativo',100*r,'%'),m('Concentrado por balance de agua',c,'m³/h'),
      m('Flujo de permeado',1000*v.product/v.area,'L/(m²·h)'),
      m('TDS calculado de concentrado',v.basis==='tds'?remaining/c:'Requiere concentraciones TDS',v.basis==='tds'?'mg/L':''));},
  'Para conductividad usa valores compensados a la misma temperatura. La razón de conductividad indica rechazo aparente; el balance de masa utiliza concentraciones.');

  reg('membrane-normalized-flux-forecast','membranes','previsao-vida-util-membranas','Membranas · tendencia de flujo normalizado y umbral',[
    T('a','Serie de la misma membrana y condición de referencia','0;24\n2;23.6\n4;22.8\n6;22.1',
      'Columnas: meses desde el inicio del registro; flujo normalizado (L/(m²·h)). Usa datos comparables y sin cambios de régimen.'),
    select('model','Ajuste',[['linear','Lineal'],['exponential','Exponencial']],'linear'),
    p('drop','Descenso objetivo respecto a la primera observación',15,.01,95)
  ],'Ajusta J=a+bt o ln(J)=a+bt. Proyecta el cruce del umbral elegido. Se muestra el R² en la escala del ajuste.',
  v=>{rows(v.a,2,([t,j])=>t>=0&&j>0,'Usa meses no negativos y flujo positivo.');
    A(v.a.length>=2&&v.a.every((r,i)=>!i||r[0]>v.a[i-1][0]),'Usa al menos dos tiempos estrictamente crecientes.');
    const exp=v.model==='exponential',fit=GL.stat.linreg(v.a.map(r=>r[0]),v.a.map(r=>exp?Math.log(r[1]):r[1]));
    const j0=v.a[0][1],threshold=j0*(1-v.drop/100),[now,current]=v.a.at(-1);
    const predicted=fit.slope<0?((exp?Math.log(threshold):threshold)-fit.intercept)/fit.slope:null;
    const left=current<=threshold?0:predicted===null?null:Math.max(0,predicted-now);
    const fitPoints=v.a.map(([t])=>{const y=fit.intercept+fit.slope*t;return [t,exp?Math.exp(y):y];});
    if(left>0&&predicted>now)fitPoints.push([predicted,threshold]);
    return {...out(m('Tiempo desde la última observación',left??'Sin tendencia descendente','meses'),m('Flujo objetivo',threshold,'L/(m²·h)'),
      m('Caída observada',100*(1-current/j0),'%'),m('R² del ajuste',fit.r2)),
      series:[{name:'Medido',data:v.a,points:true},{name:'Ajuste',data:fitPoints}],xLabel:'Meses',yLabel:'Flujo normalizado',
      message:current<=threshold?'La última medición ya alcanza el umbral.':left===0?'El ajuste ya cruza el umbral, aunque la última medición permanece por encima.':left>0?'El cruce estimado extrapola la tendencia observada.':''};},
  'El umbral lo define la operación. El pronóstico es condicional a la tendencia y debe reevaluarse tras limpiezas, cambios de alimentación o renovación.');

  reg('tds-conductivity-estimate','water','conversao-tds-condutividade-agua','Conductividad y TDS · estimación con factor local',[
    select('mode','Medición de entrada',[['ec','Conductividad a 25 °C'],['tds','TDS medido']],'ec'),
    f('value','Lectura (µS/cm o mg/L)','',680),f('k','Factor calibrado','(mg/L)/(µS/cm)',.65,eps)
  ],'TDS = k·conductividad a 25 °C. Conversión inversa: conductividad = TDS/k.',
  v=>{const t=v.mode==='tds'?v.value:v.value*v.k,c=v.mode==='ec'?v.value:v.value/v.k;
    return out(m('TDS',t,'mg/L'),m('Conductividad',c,'µS/cm a 25 °C'),m('Factor aplicado',v.k));},
  'La relación es empírica y depende de la composición. Determina el factor con muestras pareadas del mismo proceso.');

  reg('chlorine-active-dose','water','dosagem-cloro-hipoclorito-agua','Cloración · demanda, residual y consumo de producto',[
    f('q','Caudal tratado','m³/h',100),f('demand','Demanda de cloro medida','mg Cl₂-eq/L',1.5),
    f('residual','Residual objetivo tras contacto','mg Cl₂-eq/L',.6),
    p('assay','Cloro disponible en el producto',12.5,.001),f('density','Densidad del producto líquido','kg/L',1.19,eps)
  ],'Dosis aplicada = demanda medida + residual objetivo. Masa activa=Q·dosis/1000. Producto comercial=activo/fracción de cloro disponible.',
  v=>{const dose=v.demand+v.residual,active=v.q*dose/1000,product=100*active/v.assay;
    return out(m('Dosis aplicada estimada',dose,'mg Cl₂-eq/L'),m('Cloro activo',active,'kg/h'),
      m('Producto comercial',product,'kg/h'),m('Caudal de producto líquido',product/v.density,'L/h'));},
  'Usa cloro disponible en la base del producto. La demanda cambia con el agua y el tiempo de contacto. El residual de operación se verifica en campo.');
})();
