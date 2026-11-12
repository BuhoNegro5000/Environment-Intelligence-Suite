/* Tratamiento de aguas residuales, clarificación y balances de sólidos. */
(function(){
  'use strict';
  const L=GL.lab,{reg,m,out,table,f,p,check,nn,int,load,eps}=GL.atlas,{assert:A,sum:S,table:T,select}=L;
  const epa=[['EPA · manual de control de nutrientes','https://www.epa.gov/sites/default/files/2019-02/documents/nutrient-control-design-manual-state-tech.pdf']];
  const rows=(...metrics)=>out(...metrics);
  const nFields=()=>[f('q','Caudal','m³/d',3000,eps),f('bod','DBO removida','mg/L',170),f('nh','N amoniacal nitrificado','mg N/L',24),
    f('den','N desnitrificado','mg N/L',18),f('alk','Alcalinidad afluente disponible','mg/L como CaCO₃',210)];
  function nitrogen(v){
    A(v.den<=v.nh,'El escenario supone que el nitrato proviene de la nitrificación interna. Ajusta el N desnitrificado.');
    const n=load(v.q,v.nh),d=load(v.q,v.den);
    return {n,d,alk:7.14*n-3.57*d,o2:4.57*n-2.86*d};
  }
  reg('biological-nutrient-train',['bnr-matrix','activated-sludge-designer'],'water','Diseño biológico · lodos activados y tren A²/O',[
    ...nFields(),f('bodIn','DBO aplicada al reactor','mg/L',220),
    f('fom','Relación F/M de diseño','kg DBO/(kg MLVSS·d)',.18,eps),
    f('x','MLVSS de diseño','kg/m³',2.5,eps),p('oxic','Fracción aerobia del volumen',70,1),
    p('anoxic','Fracción anóxica del volumen',20),
    f('srt','Edad de lodo objetivo','d',12,eps),f('y','Rendimiento observado','kg SSV/kg DBO removida',.32),
    f('ras','Recirculación externa RAS / Q','',.6),f('ir','Recirculación interna / Q','',2)
  ],'Volumen por F/M sobre DBO aplicada. Distribución de compartimientos declarada. Inventario/SRT y rendimiento sobre DBO removida se reportan como estimaciones independientes.',
  v=>{A(v.oxic+v.anoxic<=100,'Las fracciones superan 100 %.');A(v.bod<=v.bodIn,'La DBO removida supera la DBO aplicada.');
    const n=nitrogen(v),bod=load(v.q,v.bod),vol=load(v.q,v.bodIn)/(v.fom*v.x);
    const fractions=[100-v.oxic-v.anoxic,v.anoxic,v.oxic];
    return table([m('Volumen biológico total',vol,'m³'),m('HRT nominal',24*vol/v.q,'h'),m('Purga por inventario y SRT',vol*v.x/v.srt,'kg SSV/d'),
      m('Producción por rendimiento',bod*v.y,'kg SSV/d'),m('Alcalinidad residual teórica',v.alk-1000*n.alk/v.q,'mg/L como CaCO₃'),
      m('Retorno RAS',v.ras*v.q,'m³/d'),m('Recirculación interna',v.ir*v.q,'m³/d')],
      ['Zona','Volumen (m³)','HRT sobre caudal afluente (h)'],fractions.map((a,i)=>[['Anaerobia','Anóxica','Aerobia'][i],vol*a/100,.24*vol*a/v.q]));},
  'Modelo de anteproyecto con fracciones declaradas. Verifica cinética, SRT mínimo, fósforo biológico, recirculaciones y sedimentabilidad con datos de planta.',epa);

  reg('oxygen-aeration-design',['oxy-matrix'],'water','Aireación · oxígeno real, aire y potencia',[
    ...nFields(),f('carbon','Oxígeno carbonáceo por DBO removida','kg/kg',1.15),
    p('transfer','Fracción real transferida en operación',16,.01),f('air','Oxígeno contenido en aire normalizado','kg O₂/Nm³',.299,eps),
    f('kw','Consumo específico de soplante','kWh/Nm³',.028),f('peak','Factor de punta','',1.3,1)
  ],'AOR = O₂ carbonáceo + 4,57·N nitrificado − 2,86·N desnitrificado. Aire = AOR/(transferencia real × O₂ por Nm³).',
  v=>{const n=nitrogen(v),a=load(v.q,v.bod)*v.carbon+n.o2;
    const air=a/(v.transfer/100*v.air*24)*v.peak;
    return rows(m('Oxígeno real medio',a,'kg O₂/d'),m('Oxígeno real de punta',a*v.peak,'kg O₂/d'),
      m('Aire de punta',air,'Nm³/h'),m('Potencia eléctrica estimada',air*v.kw,'kW'));},
  'Ingresa eficiencia real de transferencia a profundidad, carga y condiciones de operación. La potencia usa consumo específico declarado.',epa);

  reg('nutrient-reagent-demand',['nutri-matrix'],'water','Nutrientes · carbono, alcalinidad y precipitación de P',[
    ...nFields(),f('c','DQO utilizable disponible para desnitrificación','kg/d',85),f('ratio','DQO consumida por N desnitrificado','kg DQO/kg N',4),
    f('p','Fósforo a precipitar','mg P/L',3),f('fe','Relación molar Fe:P seleccionada','mol/mol',1.8),
    p('stock','Fracción másica de Fe en producto comercial',12,.01),f('price','Precio de producto férrico','moneda/kg',.55)
  ],'Carbono suplementario = máx(N desnitrificado × demanda específica − DQO disponible,0). Alcalinidad neta = 7,14 Nₙ − 3,57 N𝒹. Fe y FePO₄ por estequiometría.',
  v=>{const n=nitrogen(v),ph=load(v.q,v.p),metal=ph*v.fe*55.845/30.974,product=100*metal/v.stock;
    return rows(m('DQO suplementaria',Math.max(0,n.d*v.ratio-v.c),'kg DQO/d'),
      m('Déficit mínimo de alcalinidad biológica',Math.max(0,n.alk-load(v.q,v.alk)),'kg CaCO₃-eq/d'),
      m('Producto férrico comercial',product,'kg/d'),m('FePO₄ ideal mínimo asociado a P',ph*150.815/30.974,'kg/d'),
      m('Costo diario de producto férrico',product*v.price,'moneda/d'));},
  'La alcalinidad mostrada cubre la reacción biológica. El consumo químico y los precipitados adicionales dependen de reactivos, pH y ensayos.',epa);

  reg('clarifier-duty-screen',['clarifier-designer','clarifier-designer?mode=secondary-wastewater'],'water','Clarificación · geometría, vertedero y condición N−1',[
    f('q','Caudal neto total','m³/d',3200),f('ras','RAS total al clarificador secundario','m³/d',1600),
    f('x','Sólidos de alimentación','mg/L',3200),f('area','Área por clarificador','m²',160,eps),
    f('depth','Tirante útil','m',3.6,eps),f('weir','Longitud activa de vertedero por unidad','m',45,eps),
    f('n','Unidades instaladas','',3,1,50)
  ],'Evalúa operación normal y con una unidad fuera de servicio. Carga superficial y de vertedero sobre caudal neto; carga de sólidos sobre Q+RAS.',
  v=>{A(int(v.n),'Número de unidades entero.');
    const data=[v.n,v.n-1].filter(x=>x>0).map(n=>[n,v.q/(n*v.area),v.q/(n*v.weir),load(v.q+v.ras,v.x)/(n*v.area),v.q+v.ras?24*n*v.area*v.depth/(v.q+v.ras):null]);
    return table([m('Área total instalada',v.n*v.area,'m²'),m('Carga superficial normal',data[0][1],'m³/(m²·d)'),
      m('Carga N−1',data[1]?.[1]??'Sin reserva','m³/(m²·d)')],
      ['Unidades activas','Carga hidráulica superficial','Carga de vertedero','Carga de sólidos (kg/m²/d)','HRT (h)'],data);},
  'Las cargas requieren revisión contra criterios específicos del proceso y ensayos de sedimentación.');

  reg('settling-solids-flux',['flux-matrix'],'water','Clarificador secundario · curva de flujo de sólidos',[
    T('a','Ensayo de sedimentación zonal','1;3.5\n2;2.6\n3;1.8\n4;1.1\n6;0.5\n8;0.2',
      'Columnas: concentración (kg/m³); velocidad de sedimentación (m/h). Cubre desde la alimentación hasta la concentración de retorno.'),
    f('area','Área en servicio','m²',300,eps),f('inflow','Caudal total de alimentación','m³/h',220),
    f('influent','Concentración de alimentación','kg/m³',3,eps),f('underflow','Caudal de fondo','m³/h',75)
  ],'Flujo gravitacional = X·vₛ. Flujo de fondo = X·Qu/A. El mínimo de los puntos medidos entre alimentación y fondo se compara con la carga aplicada.',
  v=>{check(v.a,2,r=>nn(r)&&r[0]>0,'Usa concentración positiva y velocidad no negativa.');
    const data=v.a.map(([x,s])=>[x,x*s,x*v.underflow/v.area,x*(s+v.underflow/v.area)]);
    const valid=data.filter(r=>r[0]>=v.influent);A(valid.length>=2,'Incluye al menos dos puntos a partir de la concentración afluente.');
    const limiting=Math.min(...valid.map(r=>r[3])),actual=v.inflow*v.influent/v.area;
    return {...table([m('Flujo limitante medido',limiting,'kg/(m²·h)'),m('Flujo aplicado',actual,'kg/(m²·h)'),
      m('Margen',limiting-actual,'kg/(m²·h)')],['X (kg/m³)','Gravitacional','Fondo','Total'],data),
      series:[{name:'Flujo total',data:data.map(r=>[r[0],r[3]]),points:true}],xLabel:'Sólidos (kg/m³)',yLabel:'kg/(m²·h)'};},
  'El mínimo es sobre puntos medidos, con caudal de fondo declarado. Cubre el rango operativo y revisa la zona de espesamiento.');

  reg('wastewater-residuals-balance',['water-treatment-residuals-sludge','water-treatment-residuals-sludge?mode=wastewater'],'water','Residuos de planta · sólidos, torta y retornos',[
    T('a','Corrientes hacia manejo de lodos','45;2\n85;1.5\n12;4','Columnas: sólidos secos (kg/d); contenido de sólidos (% m/m). Filas para primario, purga biológica, lodo químico u otros.'),
    p('capture','Captura de sólidos en deshidratación',94),p('cake','Sólidos en torta',22,.01),
    f('rho','Densidad aparente de torta','kg/m³',1050,eps),f('days','Días de almacenamiento','d',7)
  ],'Masa húmeda = secos/fracción seca. Torta = sólidos capturados/fracción de torta. Se cierra la masa húmeda y seca hacia retorno.',
  v=>{check(v.a,2,([x,w])=>x>=0&&w>0&&w<=100,'Usa sólidos no negativos y porcentaje de 0 a 100 excluyendo cero.');
    const dry=S(v.a.map(r=>r[0])),wet=S(v.a.map(([d,p])=>100*d/p)),capt=dry*v.capture/100,cake=100*capt/v.cake;
    A(cake<=wet+1e-8,'La torta supera la masa afluente; revisa los porcentajes.');
    return rows(m('Sólidos secos afluentes',dry,'kg/d'),m('Masa de torta',cake,'kg/d'),m('Retorno húmedo',Math.max(0,wet-cake),'kg/d'),
      m('Sólidos secos en retorno',dry-capt,'kg/d'),m('Almacenamiento de torta',cake*v.days/v.rho,'m³'));},
  'Balance de masa de lodos declarados. Si hay acondicionamiento o dilución, incorpora sus aportes en las corrientes.');

  reg('wastewater-headworks-sizing',['wastewater-preliminary-treatment-designer','seawater-intake-screening-assessment'],'water','Cabecera y captación · rejas, canales y redundancia',[
    f('q','Caudal pico','m³/h',480),f('n','Canales instalados','',3,1),
    f('width','Ancho mojado por canal','m',.7,eps),f('depth','Tirante','m',.8,eps),
    p('open','Área libre de reja limpia',55,.01),p('clog','Obstrucción de área libre',25,0,99.9),
    f('length','Longitud efectiva de cámara','m',7,eps),f('capacity','Capacidad declarada por unidad','m³/h',290)
  ],'Velocidad = Q/área. Se evalúan paso libre efectivo, retención nominal y capacidad instalada para estado normal y N−1.',
  v=>{A(int(v.n),'Usa número entero de canales.');
    const data=[v.n,v.n-1].filter(Boolean).map(n=>{
      const area=n*v.width*v.depth,u=v.q/3600/area;
      return [n,u,u/(v.open/100*(1-v.clog/100)),v.q?3600*area*v.length/v.q:null,n*v.capacity-v.q];});
    return table([m('Velocidad por área libre normal',data[0][2],'m/s'),m('Margen nominal N−1',data[1]?.[4]??'Sin reserva','m³/h')],
      ['Canales','Velocidad de aproximación (m/s)','Velocidad por paso libre (m/s)','Retención (s)','Margen de caudal (m³/h)'],data);},
  'Cálculo estacionario. La velocidad admisible, el desarenado y la pérdida de carga dependen de geometría y criterios del proyecto.');

  reg('anaerobic-load-methane',['high-strength-anaerobic-treatment-designer'],'water','Tratamiento anaerobio · carga, volumen y metano',[
    f('q','Caudal','m³/d',700),f('cod','DQO afluente','mg/L',3500),
    p('degrade','Fracción de DQO removida y metanizable',65),f('olr','Carga volumétrica de diseño','kg DQO/(m³·d)',4,eps),
    f('yield','Rendimiento específico de CH₄','Nm³/kg DQO removida',.30,0,.35),p('capture','Captura de metano',90)
  ],'Volumen preliminar = carga afluente/OLR. Producción de CH₄ = DQO metanizable removida × rendimiento declarado.',
  v=>{const cod=load(v.q,v.cod),vol=cod/v.olr,methane=cod*v.degrade/100*v.yield;
    return rows(m('DQO afluente',cod,'kg/d'),m('Volumen preliminar',vol,'m³'),m('HRT nominal',v.q?24*vol/v.q:null,'h'),
      m('Metano generado',methane,'Nm³/d'),m('Metano capturado',methane*v.capture/100,'Nm³/d'));},
  'Valida biodegradabilidad, inhibidores, temperatura, rendimiento y necesidades de postratamiento.');

  reg('daf-air-solids-screen',['daf-designer'],'water','Flotación DAF · hidráulica y aire por sólidos',[
    f('q','Caudal afluente','m³/h',95),p('recycle','Recirculación respecto a afluente',12),
    f('area','Área de separación','m²',12,eps),f('contact','Volumen de zona de contacto','m³',2,eps),
    f('solids','Sólidos a separar','mg/L',180),f('air','Aire liberado por litro de recirculación','mg/L',65)
  ],'Carga hidráulica = (Q+Qr)/área. A/S = aire liberado por recirculación/masa afluente de sólidos.',
  v=>{const qr=v.q*v.recycle/100,total=v.q+qr,a=load(qr,v.air),s=load(v.q,v.solids);
    return rows(m('Carga hidráulica',total/v.area,'m³/(m²·h)'),m('Aire liberado',a,'kg/h'),m('Relación aire/sólidos',s?a/s:null,'kg/kg'),
      m('Tiempo de contacto nominal',total?60*v.contact/total:null,'min'),m('Caudal de recirculación',qr,'m³/h'));},
  'Ingresa aire liberado efectivo estimado o medido. Valida el proceso con ensayo de flotación y condiciones de presión y temperatura.');
})();
