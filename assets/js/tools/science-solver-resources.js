/* Residuos, ecosistemas y sostenibilidad. */
(function () {
  'use strict';
  const L=GL.lab,{reg,matrix,nonnegative:nn,positive,metric:m,result:r,field:f,pct,integer}=GL.solverScience;
  const {assert:A,sum:S,table:T}=L;
  const eps=1e-10;
  const metrics=(...items)=>({metrics:items});
  function shares(values) {
    A(Math.abs(S(values)-100)<1e-6,'Las rutas de gestión deben sumar 100 %.');
  }
  function logistic(n,k,rate,time) {
    return k/(1+(k/n-1)*Math.exp(-rate*time));
  }

  reg('waste-treatment-balance','waste-management','waste','Gestión de residuos · balance por tratamiento',[
    f('pop','Población servida','personas',25000,1),f('rate','Generación per cápita','kg/(persona·día)',.75),
    T('a','Rutas de manejo','25;0.12;40\n15;0.08;50\n10;0.45;75\n50;0.42;35',
      'Columnas: participación (%); factor t CO₂e/t; costo neto moneda/t. Filas sugeridas: reciclaje, compostaje, incineración y relleno. Admite factores netos y costos negativos.')
  ],'Generación anual = población × tasa × 365. Se reparte por porcentajes que cierran al 100 %. Impacto y costo por ruta = masa × factor.',
  v=>{integer(v.pop,'Población');matrix(v.a,3,q=>q[0]>=0&&q[0]<=100,'Cada ruta requiere participación de 0 a 100 %, factor y costo.');
    shares(v.a.map(q=>q[0]));const total=v.pop*v.rate*.365;
    const rows=v.a.map(([p,e,c],i)=>{const tonnes=total*p/100;return [i+1,p,tonnes,tonnes*e,tonnes*c];});
    return r([m('Generación total',total,'t/año'),m('Emisiones netas del escenario',S(rows.map(q=>q[3])),'t CO₂e/año'),
      m('Costo neto',S(rows.map(q=>q[4])),'moneda/año')],['Ruta','%','t/año','t CO₂e/año','Costo anual'],rows);},
  'Usa factores de tratamiento con límites compatibles. Las rutas son mutuamente excluyentes en el balance.');

  reg('waste-reduction-benefits','waste-reduction','waste','Reducción de residuos · desvío, costos y emisiones evitadas',[
    f('total','Residuos generados','t/año',1200,eps),f('disposal','Costo marginal de disposición evitada','moneda/t',36),
    T('a','Materiales desviados','90;0.55;32;24\n50;0.8;55;40\n130;0.18;0;28',
      'Columnas: masa desviada (t/año); factor neto evitado (t CO₂e/t); ingreso por material (moneda/t); costo del programa (moneda/t).')
  ],'Desvío = masa recuperada/generada. Beneficio neto = masa × (disposición evitada + ingreso − costo).',
  v=>{matrix(v.a,4,q=>q[0]>=0&&q[2]>=0&&q[3]>=0,'Masa, ingresos y costos de programa no negativos.');
    const diverted=S(v.a.map(q=>q[0]));A(diverted<=v.total,'La masa desviada supera la generación.');
    const rows=v.a.map(([t,e,income,cost],i)=>[i+1,t,t*e,t*(v.disposal+income-cost)]);
    return r([m('Tasa de desvío',100*diverted/v.total,'%'),m('Masa desviada',diverted,'t/año'),m('Emisiones evitadas',S(rows.map(q=>q[2])),'t CO₂e/año'),
      m('Beneficio monetario neto',S(rows.map(q=>q[3])),'moneda/año')],['Material','t/año','t CO₂e evitadas/año','Beneficio neto/año'],rows);},
  'El factor climático debe representar el cambio completo entre la ruta base y la ruta alternativa.');

  reg('plastic-material-flow','plastic-pollution','waste','Flujo de plásticos · recuperación, gestión y fuga',[
    f('pop','Población','personas',40000,1),f('rate','Residuos plásticos per cápita','kg/(persona·año)',28),
    pct('recycled','Reciclaje efectivo sobre el total',20),pct('managed','Otros tratamientos controlados sobre el total',55),
    pct('leak','Fracción del flujo no gestionado que llega al ambiente',15)
  ],'Generación = población × tasa. Flujo no gestionado = total − reciclaje efectivo − otras rutas. Fuga = flujo no gestionado × fracción.',
  v=>{integer(v.pop,'Población');A(v.recycled+v.managed<=100,'Reciclaje y otros tratamientos no pueden superar el total.');
    const total=v.pop*v.rate/1000,recycled=total*v.recycled/100,managed=total*v.managed/100,unmanaged=Math.max(0,total-recycled-managed);
    return metrics(m('Generación total',total,'t/año'),m('Reciclado efectivo',recycled,'t/año'),m('Otros tratamientos',managed,'t/año'),
      m('Flujo no gestionado',unmanaged,'t/año'),m('Fuga estimada al ambiente',unmanaged*v.leak/100,'t/año'));},
  'La fracción de fuga se ingresa como escenario o a partir de observaciones locales. Evita contar el mismo material en varias rutas.');

  reg('desertification-indicators','desertification','soil','Desertificación · aridez, cobertura y erosión',[
    f('rain','Precipitación anual','mm/año',400),f('pet','Evapotranspiración potencial anual','mm/año',980,eps),
    pct('before','Cobertura vegetal de referencia',48),pct('after','Cobertura vegetal actual',34),
    f('erosion','Tasa de erosión estimada','t/(ha·año)',6),f('area','Área evaluada','ha',210,eps),f('years','Horizonte','años',5)
  ],'Índice de aridez = precipitación/ETP. Cambio de cobertura = actual − referencia. Pérdida acumulada = erosión × área × años.',
  v=>metrics(m('Índice de aridez P/ETP',v.rain/v.pet),m('Cambio de cobertura',v.after-v.before,'puntos porcentuales'),
    m('Pérdida de suelo acumulada',v.erosion*v.area*v.years,'t')),
  'Los indicadores se interpretan por separado. Compara coberturas equivalentes en estación y escala, y usa una tasa de erosión local.');

  reg('ecosystem-population-energy','environmental-ecology','ecology','Ecología · crecimiento logístico y transferencia trófica',[
    f('n','Población inicial','individuos',120,eps),f('k','Capacidad de carga','individuos',1000,eps),
    f('growth','Tasa intrínseca','1/año',.25),f('t','Horizonte','años',15),
    f('energy','Energía disponible en el nivel inicial','kJ/año',100000),
    pct('eff','Eficiencia por transferencia',12),f('levels','Niveles tróficos','',4,1,20)
  ],'Población logística N(t)=K/[1+(K/N₀−1)e⁻ʳᵗ]. Energía de nivel i = energía inicial × eficiencia^(i−1).',
  v=>{integer(v.levels,'Niveles');const rows=Array.from({length:v.levels},(_,i)=>[i+1,v.energy*(v.eff/100)**i]);
    return {...r([m('Población final',logistic(v.n,v.k,v.growth,v.t),'individuos'),m('Capacidad de carga',v.k,'individuos')],
      ['Nivel trófico','Energía disponible (kJ/año)'],rows),
      series:[{name:'Población',data:Array.from({length:31},(_,i)=>[i*v.t/30,logistic(v.n,v.k,v.growth,i*v.t/30)])}],xLabel:'Años',yLabel:'Población'};},
  'Los dos ejercicios son independientes. Se asumen capacidad de carga, tasa y eficiencia constantes.');

  reg('microbial-growth-biodegradation','environmental-microbiology','water','Microbiología ambiental · Monod y biodegradación',[
    f('n','Abundancia inicial','UFC/mL',500,eps),f('k','Capacidad de carga','UFC/mL',1e7,eps),
    f('mu','Tasa máxima de crecimiento','1/h',.55),f('s','Sustrato disponible','mg/L',15),
    f('ks','Constante de semisaturación','mg/L',10,eps),f('kd','Constante de biodegradación observada','1/h',.07),
    f('c','Contaminante inicial','mg/L',40),f('time','Horizonte','h',24)
  ],'Tasa efectiva Monod μ=μmáx S/(Ks+S), usada en una trayectoria logística. Biodegradación independiente C(t)=C₀e⁻ᵏᵗ.',
  v=>{const mu=v.mu*v.s/(v.ks+v.s),n=t=>logistic(v.n,v.k,mu,t),c=t=>v.c*Math.exp(-v.kd*t);
    const rows=Array.from({length:25},(_,i)=>{const t=i*v.time/24;return [t,n(t),c(t)];});
    return r([m('Abundancia final',n(v.time),'UFC/mL'),m('Tasa efectiva',mu,'1/h'),m('Contaminante residual',c(v.time),'mg/L')],
      ['Tiempo (h)','Abundancia (UFC/mL)','Contaminante (mg/L)'],rows);},
  'Modelo de sustrato constante. Para la biodegradación usa una constante calibrada a las condiciones locales.');

  reg('environmental-resource-performance','environmental-sustainability','climate','Sostenibilidad ambiental · balances e intensidades',[
    f('output','Producción o servicio anual','unidades/año',10000,eps),
    f('energy','Energía total','kWh/año',175000),pct('renew','Participación renovable',32),
    f('co2','Emisiones brutas','t CO₂e/año',110),f('removals','Remociones verificadas','t CO₂e/año',12),
    f('water','Agua consumida','m³/año',4200),f('waste','Residuos generados','t/año',28),
    f('divert','Residuos desviados','t/año',14),f('land','Superficie utilizada','ha',3,eps)
  ],'Balance de GEI = brutas − remociones. Las intensidades se calculan por unidad de producción. Desvío = masa desviada/generada.',
  v=>{A(v.divert<=v.waste,'El desvío supera los residuos generados.');
    return metrics(m('Balance de GEI',v.co2-v.removals,'t CO₂e/año'),m('Intensidad neta de GEI',1000*(v.co2-v.removals)/v.output,'kg CO₂e/unidad'),
      m('Intensidad energética',v.energy/v.output,'kWh/unidad'),m('Energía renovable',v.energy*v.renew/100,'kWh/año'),
      m('Intensidad hídrica',v.water/v.output,'m³/unidad'),m('Intensidad de residuos',1000*v.waste/v.output,'kg/unidad'),
      m('Desvío',v.waste?100*v.divert/v.waste:'Sin generación','%'),m('Productividad territorial',v.output/v.land,'unidades/(ha·año)'));},
  'Registra los límites y el periodo de cada indicador. La comparabilidad depende de la unidad de producción o servicio.');

  reg('sustainable-development-targets','sustainable-development','impact','Desarrollo sostenible · seguimiento de metas',[
    T('a','Indicadores y metas locales','65;78;95;2\n32;24;12;3\n45;50;70;1',
      'Columnas: línea base; valor actual; meta; peso. Metas mayores o menores que la línea base. Filas por indicador definido por el usuario.')
  ],'Avance = 100 × (actual−base)/(meta−base). El índice agregado pondera el avance acotado entre 0 y 100 %.',
  v=>{matrix(v.a,4,q=>q[0]!==q[2]&&q[3]>=0,'La meta debe diferir de la línea base y los pesos deben ser no negativos.');
    const weights=S(v.a.map(q=>q[3]));A(positive(weights),'La suma de pesos debe ser positiva.');
    const rows=v.a.map(([b,c,t,w],i)=>[i+1,b,c,t,w,100*(c-b)/(t-b)]);
    return r([m('Avance agregado acotado',S(rows.map(q=>q[4]/weights*Math.max(0,Math.min(100,q[5])))),'%'),
      m('Metas alcanzadas',rows.filter(q=>q[5]>=100).length),m('Indicadores',rows.length)],
      ['Indicador','Línea base','Actual','Meta','Peso','Avance sin acotar (%)'],rows);},
  'Los pesos y metas son definidos por el programa. Los retrocesos y excedentes se muestran por indicador.');
})();
