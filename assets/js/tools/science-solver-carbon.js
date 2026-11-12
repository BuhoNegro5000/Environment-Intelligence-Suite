/* Inventarios de carbono, energía y uso de recursos. */
(function () {
  'use strict';
  const L=GL.lab,{reg,matrix,nonnegative:nn,positive,metric:m,result:r,field:f,pct,integer}=GL.solverScience;
  const {assert:A,sum:S,table:T,select}=L;
  const p=1e-10, signed=-1e12;
  const metrics=(...items)=>({metrics:items});
  const ipcc=[['IPCC · directrices de inventarios nacionales','https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol4.html']];
  const ghg=[['GHG Protocol · factores y herramientas','https://ghgprotocol.org/calculation-tools-and-guidance']];
  function carbonRows(a){
    matrix(a,2,nn,'Cada fila necesita actividad y factor no negativos.');
    return a.map(([activity,factor],i)=>[i+1,activity,factor,activity*factor]);
  }

  reg('household-carbon-footprint','carbon-footprint','climate','Huella de carbono personal · inventario anual',[
    T('a','Actividad anual por fuente','7200;0.18\n1800;0.26\n240;2.1\n60;10\n180;0.35',
      'Columnas: actividad anual; kg CO₂e por unidad. Filas sugeridas: transporte (km), electricidad (kWh), combustible (m³), alimentos (kg), residuos (kg).'),
    f('people','Personas incluidas','personas',1,1)
  ],'Por fuente: actividad anual × factor. Suma por hogar y divide por las personas incluidas para estimar la huella per cápita.',
  v=>{integer(v.people,'Personas');const rows=carbonRows(v.a),total=S(rows.map(row=>row[3]));
    return r([m('Huella anual',total/1000,'t CO₂e/año'),m('Huella per cápita',total/(1000*v.people),'t CO₂e/(persona·año)')],
      ['Fuente','Actividad','Factor','kg CO₂e/año'],rows);},
  'Los factores de ejemplo son sintéticos. Usa factores que compartan periodo, límites y enfoque de ciclo de vida.',ghg);

  reg('ecological-footprint','ecological-footprint','climate','Huella ecológica · demanda de biocapacidad',[
    T('a','Categorías de demanda','260;2200;1.0;2.5\n100;700;1.1;0.5\n50;200;0.95;1.3',
      'Columnas: demanda (unidad/año); rendimiento (unidad/ha·año); factor de rendimiento; factor de equivalencia (gha/ha). Incluye filas independientes por categoría.'),
    f('bio','Biocapacidad comparable','gha',.7)
  ],'Por categoría: demanda/rendimiento × factor de rendimiento × factor de equivalencia. Saldo = biocapacidad − huella.',
  v=>{matrix(v.a,4,q=>nn(q)&&q.slice(1).every(positive),'Usa demanda no negativa y rendimiento y factores positivos.');
    const rows=v.a.map(([d,y,yf,ef],i)=>[i+1,d/y,d/y*yf*ef]),total=S(rows.map(q=>q[2]));
    return r([m('Huella ecológica',total,'gha'),m('Saldo de biocapacidad',v.bio-total,'gha')],
      ['Categoría','Superficie física (ha)','Demanda (gha)'],rows);},
  'Ingresa factores del mismo año y marco contable. Para carbono usa un rendimiento de absorción neta consistente con ese marco.');

  reg('energy-efficiency-investment','energy-efficiency','energy','Eficiencia energética · ahorro y recuperación',[
    f('before','Consumo inicial','kWh/año',100000),f('after','Consumo mejorado','kWh/año',78000),
    f('tariff','Tarifa de electricidad','moneda/kWh',.18),f('capex','Inversión','moneda',14000),
    f('opex','Sobrecosto anual de operación','moneda/año',400,signed),f('ef','Factor de emisión eléctrica','kg CO₂e/kWh',.22),
    f('years','Vida útil','años',12,1,100),pct('discount','Tasa de descuento',7)
  ],'Ahorro = diferencia de consumo × tarifa − sobrecosto. VAN = valor actual de los ahorros anuales menos inversión.',
  v=>{integer(v.years,'Años');const a=v.before-v.after, net=a*v.tariff-v.opex, rate=v.discount/100;
    const pv=S(Array.from({length:v.years},(_,i)=>net/(1+rate)**(i+1)));
    return metrics(m('Electricidad evitada',a,'kWh/año'),m('Emisiones evitadas',a*v.ef/1000,'t CO₂e/año'),
      m('Ahorro neto',net,'moneda/año'),m('VAN',pv-v.capex,'moneda'),m('Recuperación simple',net>0?v.capex/net:'Sin recuperación',net>0?'años':''));},
  'Precios y rendimiento constantes. Usa consumos normalizados a condiciones comparables.');

  reg('climate-scenario','climate-change-impact','climate','Escenario climático · calentamiento, emisiones y nivel del mar',[
    f('co2','Concentración de CO₂','ppm',420,p),f('base','Concentración de referencia','ppm',280,p),
    f('ecs','Sensibilidad de equilibrio por duplicación','°C',3),f('annual','Emisión anual neta','Gt CO₂/año',40,signed),
    f('budget','Presupuesto remanente elegido','Gt CO₂',400),f('years','Horizonte','años',25),
    f('steric','Tasa de contribución estérica','mm/año',1.4,signed),f('ice','Tasa de aporte de hielo continental','mm/año',1.9,signed)
  ],'Respuesta de equilibrio simplificada = sensibilidad × log₂(C/C₀). Presupuesto y nivel del mar con tasas constantes.',
  v=>metrics(m('Respuesta de equilibrio relativa',v.ecs*Math.log2(v.co2/v.base),'°C'),
    m('Emisiones acumuladas',v.annual*v.years,'Gt CO₂'),m('Presupuesto restante al final',v.budget-v.annual*v.years,'Gt CO₂'),
    m('Años para agotar presupuesto',v.annual>0?v.budget/v.annual:'Sin agotamiento',v.annual>0?'años':''),
    m('Cambio de nivel del mar del escenario',(v.steric+v.ice)*v.years,'mm')),
  'Los resultados dependen de las tasas y del presupuesto suministrados. La temperatura de equilibrio y la extrapolación lineal representan escalas distintas.');

  reg('climate-anomaly-forcing','environmental-climatology','climate','Climatología · anomalías y forzamiento de CO₂',[
    T('a','Serie y normales climáticas','1990;15.4;15.3;354\n2000;15.7;15.3;370\n2010;16.0;15.3;389\n2020;16.3;15.3;414',
      'Columnas: año; temperatura observada (°C); normal climática (°C); CO₂ (ppm).'),
    f('base','CO₂ de referencia','ppm',280,p),f('s','Sensibilidad de equilibrio por duplicación','°C',3)
  ],'Anomalía = observada − normal. Forzamiento de CO₂ aproximado = 5,35 ln(C/C₀). Equilibrio relativo = sensibilidad × log₂(C/C₀).',
  v=>{matrix(v.a,4,q=>Number.isInteger(q[0])&&q[3]>0,'Usa año entero y CO₂ positivo.');
    A(new Set(v.a.map(q=>q[0])).size===v.a.length,'Usa una observación por año.');
    const rows=v.a.map(([y,t,b,c])=>[y,t-b,5.35*Math.log(c/v.base),v.s*Math.log2(c/v.base)]).sort((a,b)=>a[0]-b[0]);
    return {...r([m('Última anomalía',rows.at(-1)[1],'°C'),m('Último forzamiento aproximado',rows.at(-1)[2],'W/m²')],
      ['Año','Anomalía (°C)','Forzamiento CO₂ (W/m²)','Equilibrio relativo (°C)'],rows),
      series:[{name:'Anomalía',data:rows.map(q=>q.slice(0,2)),points:true}],xLabel:'Año',yLabel:'Anomalía (°C)'};},
  'Usa la misma normal climática en series comparables. El forzamiento aproxima solo CO₂.',
  [['IPCC AR5 · forzamiento radiativo','https://archive.ipcc.ch/pdf/assessment-report/ar5/wg1/supplementary/WG1AR5_Ch08SM_FINAL.pdf']]);

  reg('forest-carbon-stock','forest-carbon','ecology','Carbono forestal · existencias e incremento',[
    f('area','Área forestal','ha',100,p),f('volume','Volumen de fuste','m³/ha',150),
    f('grow','Incremento neto de volumen de fuste','m³/(ha·año)',4,signed),
    f('density','Densidad básica de madera','t seca/m³',.55,p),f('bef','Factor de expansión sobre fuste','',1.25,1),
    f('roots','Relación biomasa raíz/aérea','',.24),pct('carbon','Fracción de carbono de la biomasa seca',47)
  ],'Carbono = área × volumen × densidad × expansión × (1+raíz/aérea) × fracción de C. CO₂ = C × 44/12.',
  v=>{const factor=v.area*v.density*v.bef*(1+v.roots)*v.carbon/100;
    return metrics(m('Existencia de carbono en biomasa viva',v.volume*factor,'t C'),m('Existencia expresada como CO₂',v.volume*factor*44/12,'t CO₂'),
      m('Cambio anual de existencias',v.grow*factor,'t C/año'),m('Cambio anual expresado como CO₂',v.grow*factor*44/12,'t CO₂/año'));},
  'La biomasa viva se estima con factores de la especie y edad. Suelos, hojarasca y madera muerta requieren inventarios separados.',ipcc);

  reg('land-use-carbon','land-use-change','climate','Cambio de uso del suelo · balance de existencias',[
    T('a','Transiciones de cobertura','15;110;36\n12;30;70','Columnas: área (ha); carbono antes (t C/ha); carbono después (t C/ha). Usa los mismos reservorios y límites.'),
    f('years','Periodo para repartir el cambio','años',20,p),f('price','Precio de carbono','moneda/t CO₂',25)
  ],'Emisión de CO₂ por diferencia de existencias = área × (C antes − C después) × 44/12. La media anual reparte el cambio en el periodo elegido.',
  v=>{matrix(v.a,3,q=>nn(q)&&q[0]>0,'Usa áreas positivas y existencias no negativas.');
    const rows=v.a.map(([a,b,c],i)=>[i+1,a,a*(b-c),a*(b-c)*44/12]),t=S(rows.map(q=>q[3]));
    return r([m('Emisión neta del cambio',t,'t CO₂'),m('Media anual',t/v.years,'t CO₂/año'),m('Valor del cambio al precio indicado',t*v.price,'moneda')],
      ['Transición','Área (ha)','Pérdida de C (t)','Emisión de CO₂ (t)'],rows);},
  'Un valor negativo representa aumento de existencias. El valor monetario es un escenario de precio.',ipcc);

  reg('renewable-generation','renewable-energy','energy','Generación renovable · producción y emisiones evitadas',[
    f('mw','Potencia nominal','MW',2),pct('factor','Factor de planta para el periodo',27),
    f('hours','Horas del periodo de referencia','h/año',8760,1,8784),
    f('grid','Factor de la generación desplazada','kg CO₂e/kWh',.32),
    f('life','Factor de ciclo de vida de la tecnología','kg CO₂e/kWh',.045),f('years','Vida útil','años',20,1)
  ],'E = potencia × horas del periodo × factor de planta. Emisiones netas evitadas = E × diferencia de factores compatibles.',
  v=>{const a=v.mw*v.hours*v.factor/100,e=a*(v.grid-v.life);
    return metrics(m('Generación neta estimada',a,'MWh/año'),m('Generación acumulada',a*v.years,'MWh'),
      m('Emisiones netas evitadas',e,'t CO₂e/año'),m('Emisiones netas evitadas en vida útil',e*v.years,'t CO₂e'));},
  'El factor de planta ya incorpora disponibilidad y variabilidad en las horas del periodo indicadas. Escenario de producción constante.');

  reg('transport-emissions','transportation-impact','air','Transporte · energía y emisiones por pasajero',[
    f('distance','Distancia total','km',240),f('passengers','Pasajeros','personas',3,1),
    select('mode','Tipo de consumo',[['fuel','Combustible líquido'],['electric','Electricidad']],'fuel'),
    f('intensity','Consumo por 100 km','L o kWh',7),f('factor','Factor de emisiones','kg CO₂e/L o kWh',2.7),
    f('energy','Contenido energético del combustible','MJ/L',34)
  ],'Consumo = distancia × intensidad/100. Emisión = consumo × factor. Electricidad: 3,6 MJ/kWh. Normalización por pasajeros y pasajero-kilómetro.',
  v=>{integer(v.passengers,'Pasajeros');const a=v.distance*v.intensity/100,e=a*v.factor;
    return metrics(m('Consumo total',a,v.mode==='fuel'?'L':'kWh'),m('Energía final',a*(v.mode==='fuel'?v.energy:3.6),'MJ'),
      m('Emisión del viaje',e,'kg CO₂e'),m('Emisión por pasajero',e/v.passengers,'kg CO₂e/persona'),
      m('Intensidad por pasajero-km',v.distance?1000*e/(v.passengers*v.distance):0,'g CO₂e/(persona·km)'));},
  'Usa el factor correspondiente al combustible o red y al alcance de emisiones seleccionado.',ghg);

  reg('ozone-depleting-emissions','ozone-depletion','air','Agotamiento de ozono · potencial equivalente CFC-11',[
    T('a','Sustancias y factores ODP','0.5;1\n2;0.055','Columnas: emisiones (t/año); ODP relativo a CFC-11 de la tabla que adoptes.'),
    f('observed','Columna de ozono observada','DU',270),f('base','Columna de referencia comparable','DU',300,p)
  ],'Emisiones equivalentes = Σ(masa × ODP). Desviación observada = 100 × (observada/referencia − 1).',
  v=>{const rows=carbonRows(v.a);return r([m('Potencial total de agotamiento',S(rows.map(q=>q[3])),'t CFC-11-eq/año'),
    m('Desviación observada',100*(v.observed/v.base-1),'%')],['Sustancia','Emisión (t/año)','ODP','t CFC-11-eq/año'],rows);},
  'El ODP pondera emisiones. La diferencia de columna de ozono se calcula de observaciones comparables y requiere un modelo aparte para proyectar recuperación.',
  [['EPA · sustancias que agotan el ozono','https://www.epa.gov/ozone-layer-protection/ozone-depleting-substances']]);

  reg('urban-heat-island','urban-heat-island','climate','Isla de calor urbana · pares urbano y rural',[
    T('a','Observaciones emparejadas','8;24;22\n12;30;29\n16;33;30\n20;28;23','Columnas: hora; temperatura urbana (°C); temperatura rural simultánea (°C).')
  ],'ΔT por par = urbana − rural. Se informa media, mediana, máximo y fracción de observaciones con isla de calor positiva.',
  v=>{matrix(v.a,3,q=>q[0]>=0&&q[0]<24,'Usa horas entre 0 y menos de 24.');
    const rows=v.a.map(([h,u,d])=>[h,u,d,u-d]).sort((a,b)=>a[0]-b[0]),delta=rows.map(q=>q[3]);
    return {...r([m('ΔT medio',GL.stat.mean(delta),'°C'),m('ΔT mediano',GL.stat.median(delta),'°C'),
      m('Máximo observado',Math.max(...delta),'°C'),m('Pares con isla positiva',100*delta.filter(x=>x>0).length/delta.length,'%')],
      ['Hora','Urbana (°C)','Rural (°C)','ΔT (°C)'],rows),series:[{name:'Urbana − rural',data:rows.map(q=>[q[0],q[3]]),points:true}],xLabel:'Hora',yLabel:'ΔT (°C)'};},
  'Mantén hora, exposición del sensor, altura de medición y condiciones meteorológicas comparables.');

  reg('life-cycle-inventory','life-cycle-assessment','impact','Ciclo de vida · inventario multicriterio por unidad funcional',[
    T('a','Etapas del ciclo de vida','10;3;4;25\n42;0.25;0.001;0.05\n85;0.1;0.0002;0.01',
      'Columnas: cantidad; factor kg CO₂e/unidad; factor m³ de agua/unidad; factor MJ/unidad. Filas por materia prima, fabricación, transporte, uso o fin de vida. Factores negativos admitidos para créditos justificados.'),
    L.text('fu','Unidad funcional','Un equipo utilizado durante 5 años'),f('count','Unidades funcionales cubiertas por las cantidades','',1,p)
  ],'Para cada categoría se suman cantidad × factor por etapa y se divide por el número de unidades funcionales.',
  v=>{matrix(v.a,4,q=>q[0]>=0,'Usa cuatro columnas y cantidades no negativas.');
    const rows=v.a.map(([a,c,w,e],i)=>[i+1,a*c/v.count,a*w/v.count,a*e/v.count]);
    return r([m('Cambio climático',S(rows.map(q=>q[1])),'kg CO₂e/UF'),m('Consumo de agua',S(rows.map(q=>q[2])),'m³/UF'),
      m('Demanda energética',S(rows.map(q=>q[3])),'MJ/UF')],['Etapa','kg CO₂e/UF','m³/UF','MJ/UF'],rows);},
  'Usa factores compatibles, límites, asignación y escenarios documentados. El agua reportada es volumen consumido.',ghg);
})();
