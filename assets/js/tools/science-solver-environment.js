/* Procesos físicos, químicos y ambientales de la colección ambiental. */
(function () {
  'use strict';
  const L=GL.lab,{reg,matrix,nonnegative:nn,positive,metric:m,result:r,field:f,pct,weighted}=GL.solverScience;
  const {assert:A,sum:S,table:T,select}=L;
  const eps=1e-12;
  const metrics=(...items)=>({metrics:items});
  const usda=[['USDA NRCS · erosión hídrica','https://www.nrcs.usda.gov/resources/tech-tools/water-erosion-rusle2']];
  const tsi=[['EPA · Nutrient Criteria Technical Guidance Manual','https://www.epa.gov/sites/default/files/2018-10/documents/nutrient-criteria-manual-lakes-reservoirs.pdf']];
  const noaa=[['NOAA · química del carbonato','https://www.ncei.noaa.gov/access/ocean-carbon-acidification-data-system/oceans/co2rprt.html']];
  const nws=[['NWS · sensación térmica por viento','https://www.weather.gov/safety/cold-wind-chill-chart']];
  const waterFootprint=[['Water Footprint Network · manual','https://www.waterfootprint.org/resources/TheWaterFootprintAssessmentManual_English.pdf']];
  const volume=([green,blue,grey],amount)=>[green*amount,blue*amount,grey*amount];
  const soilFields=()=>[f('r','Erosividad R','MJ·mm/(ha·h·año)',3800),f('k','Erodibilidad K','t·ha·h/(ha·MJ·mm)',.025),
    f('ls','Factor longitud y pendiente LS','',1.3),f('c','Factor de cobertura C','',.25,0,1),f('p','Factor de prácticas P','',.8,0,1)];
  const erosion=v=>v.r*v.k*v.ls*v.c*v.p;
  function slopeFactor(length,grade) {
    const sin=Math.sin(Math.atan(grade/100));
    const beta=(sin/.0896)/(3*sin**.8+.56);
    const steepness=grade<9?10.8*sin+.03:16.8*sin-.5;
    return (length/22.13)**(beta/(1+beta))*steepness;
  }

  reg('soil-rusle','soil-erosion','soil','Erosión hídrica · RUSLE por factores',[
    ...soilFields(),select('mode','Origen de LS',[['known','Factor conocido'],['slope','Calcular con geometría de la ladera']],'known'),
    f('length','Longitud horizontal de ladera (modo geometría)','m',35,5),
    f('grade','Pendiente uniforme (modo geometría)','%',8,0,100),f('area','Superficie','ha',12,eps)
  ],'A = R × K × LS × C × P. En modo geometría se combina longitud de referencia de 22,13 m con el factor de pendiente de McCool.',
  v=>{const ls=v.mode==='slope'?slopeFactor(v.length,v.grade):v.ls,loss=erosion({...v,ls});
    return metrics(m('Pérdida anual de suelo',loss,'t/(ha·año)'),m('Pérdida total',loss*v.area,'t/año'),m('Factor LS aplicado',ls));},
  'Estimación de erosión laminar y en surcos. La opción geométrica supone una ladera uniforme de al menos 5 m. Usa factores locales calibrados.',
  [...usda,['Agriculture and Agri-Food Canada · manual RUSLE','https://sis.agr.gc.ca/cansis/publications/manuals/2002-92/rusle-can.pdf']]);

  reg('agricultural-impact','agricultural-impact','soil','Impacto agrícola · suelo, riego y agroquímicos',[
    ...soilFields(),f('area','Superficie cultivada','ha',25,eps),f('net','Lámina neta anual de riego','mm/año',420),
    f('eff','Eficiencia del sistema de riego','%',75,eps,100),f('fert','Nitrógeno aplicado','kg N/(ha·año)',85),
    pct('leach','Fracción estimada de nitrógeno movilizado',12),f('pesticide','Ingrediente activo aplicado','kg/(ha·año)',2),
    pct('runoff','Fracción estimada de ingrediente activo movilizado',2)
  ],'RUSLE para pérdida de suelo. Volumen bruto = 10 × área × lámina neta / eficiencia. Masa movilizada = dosis × área × fracción.',
  v=>metrics(m('Pérdida anual de suelo',erosion(v)*v.area,'t/año'),m('Riego bruto',1000*v.area*v.net/v.eff,'m³/año'),
    m('Nitrógeno movilizado',v.area*v.fert*v.leach/100,'kg N/año'),m('Ingrediente activo movilizado',v.area*v.pesticide*v.runoff/100,'kg/año')),
  'Las fracciones corresponden al escenario del usuario. Para predecir concentraciones se necesitan rutas de transporte y volúmenes receptores.',usda);

  reg('water-weighted-index','water-quality-index','water','Índice de calidad del agua · subíndices ponderados',[
    T('a','Subíndices y pesos','85;0.17\n92;0.16\n72;0.11\n81;0.10\n77;0.10\n88;0.10\n75;0.10\n83;0.08\n95;0.08',
      'Columnas: subíndice de calidad de 0 a 100; peso. Ingresa subíndices de las curvas y variables del método que hayas elegido.'),
    L.text('method','Método y versión','Ejemplo sintético · promedio ponderado','Registra el protocolo que generó los subíndices.')
  ],'ICA = Σ(qᵢwᵢ)/Σwᵢ. La tabla presenta la contribución individual normalizada.',
  v=>{const q=weighted(v.a);return r([m('Índice ponderado',q.value,'0–100')],['Variable','Subíndice','Peso normalizado','Aporte'],q.rows);},
  'El significado del índice depende de las curvas, variables y pesos. El ejemplo contiene subíndices sintéticos.');

  reg('water-pollution-mixing','water-pollution','water','Contaminación hídrica · mezcla y carga',[
    f('c','Concentración aguas arriba','mg/L',4),f('q','Caudal aguas arriba','m³/s',2),
    f('load','Carga externa añadida','kg/día',160),f('dil','Caudal de dilución','m³/s',.5),
    f('dc','Concentración del agua de dilución','mg/L',.2),f('k','Constante de decaimiento','1/h',0),
    f('t','Tiempo de tránsito','h',6)
  ],'Balance de masa. Cₘ = [Q C + Qd Cd + carga/86,4]/(Q + Qd). C(t) = Cₘ exp(−kt).',
  v=>{const q=v.q+v.dil;A(positive(q),'El caudal combinado debe ser positivo.');
    const load=86.4*(v.c*v.q+v.dc*v.dil)+v.load,c=load/(86.4*q);
    return metrics(m('Concentración tras la mezcla',c,'mg/L'),m('Concentración tras el tránsito',c*Math.exp(-v.k*v.t),'mg/L'),
      m('Carga antes del decaimiento',load,'kg/día'),m('Caudal combinado',q,'m³/s'));},
  'Mezcla completa y régimen estacionario. El decaimiento representa una reacción de primer orden.');

  reg('water-footprint','water-footprint','water','Huella hídrica · verde, azul y gris',[
    f('amount','Producción','t',30,eps),f('green','Intensidad verde','m³/t',450),
    f('blue','Intensidad azul','m³/t',130),f('grey','Intensidad gris','m³/t',80)
  ],'Cada componente se obtiene multiplicando intensidad por producción. La suma conserva el detalle verde, azul y gris.',
  v=>{const amounts=volume([v.green,v.blue,v.grey],v.amount);
    return r([m('Huella total',S(amounts),'m³'),m('Intensidad total',S(amounts)/v.amount,'m³/t')],
      ['Componente','Intensidad (m³/t)','Volumen (m³)'],['Verde','Azul','Gris'].map((label,i)=>[label,[v.green,v.blue,v.grey][i],amounts[i]]));},
  'Usa intensidades comparables por lugar, periodo y producto. La huella gris es un volumen teórico de asimilación.',waterFootprint);

  reg('water-conservation','water-conservation','water','Ahorro de agua · volumen, costos y energía',[
    f('old','Consumo antes','m³/día',50),f('now','Consumo después','m³/día',38),f('days','Días de operación al año','días',365,1,366),
    f('water','Tarifa de agua','moneda/m³',1.5),f('sewer','Tarifa de saneamiento','moneda/m³',.8),
    pct('returned','Fracción del volumen facturada en saneamiento',90),
    f('energy','Intensidad energética del agua','kWh/m³',.5),f('ef','Factor eléctrico','kg CO₂e/kWh',.25)
  ],'Volumen evitado = (antes − después) × días. El ahorro monetario, eléctrico y climático se deriva de intensidades marginales suministradas.',
  v=>{const a=(v.old-v.now)*v.days;return metrics(m('Agua evitada',a,'m³/año'),
    m('Ahorro monetario',a*(v.water+v.sewer*v.returned/100),'moneda/año'),m('Electricidad evitada',a*v.energy,'kWh/año'),
    m('Emisiones evitadas',a*v.energy*v.ef/1000,'t CO₂e/año'));},
  'Las tarifas corresponden al tramo marginal. Un resultado negativo indica incremento.');

  reg('acid-deposition','acid-rain','air','Lluvia ácida · deposición y capacidad neutralizante',[
    f('ph','pH de la precipitación','',4.5,0,14),f('rain','Precipitación','mm/año',1100),
    f('so2','Deposición de azufre expresada como SO₂','kg/(ha·año)',8),
    f('nox','Deposición de nitrógeno expresada como NO₂','kg/(ha·año)',5),
    f('base','Deposición o aporte de bases','mol de carga/(ha·año)',100)
  ],'Flujo de H⁺ libre = 10⁻ᵖᴴ × precipitación × 10 000 L/(ha·mm). Potencial ácido equivalente: 2 mol de carga/mol SO₂ y 1/mol NO₂.',
  v=>{const h=10**(-v.ph),s=2*1000*v.so2/64.066,n=1000*v.nox/46.0055;
    return metrics(m('H⁺ libre en la lluvia',h,'mol/L'),m('Flujo de H⁺ libre',h*v.rain*10000,'mol/(ha·año)'),
      m('Potencial ácido de precursores',s+n,'mol de carga/(ha·año)'),m('Balance potencial frente a bases',s+n-v.base,'mol de carga/(ha·año)'));},
  'Ingresa deposición por área ya estimada o medida. El H⁺ libre y el potencial de los precursores se reportan por separado para evitar doble conteo.');

  reg('air-emission-inventory','air-emissions','air','Inventario de emisiones · fuentes y controles',[
    T('a','Fuentes del mismo contaminante','12000;0.009;92\n4200;0.014;60',
      'Columnas: actividad anual; kg del contaminante por unidad de actividad; eficiencia porcentual de control. Usa la misma unidad de actividad del factor en cada fila.'),
    L.text('pollutant','Contaminante','Material particulado')
  ],'Emisión bruta = actividad × factor. Emisión neta = bruta × (1 − control/100).',
  v=>{matrix(v.a,3,q=>nn(q)&&q[2]<=100,'Usa actividad y factor no negativos, y control de 0 a 100 %.');
    const rows=v.a.map(([a,e,c],i)=>[i+1,a*e,a*e*c/100,a*e*(1-c/100)]);
    return r([m('Emisión neta',S(rows.map(q=>q[3])),'kg/año'),m('Emisión evitada',S(rows.map(q=>q[2])),'kg/año')],
      ['Fuente','Emisión bruta (kg/año)','Retenida (kg/año)','Emitida (kg/año)'],rows);},
  'Documenta contaminante, periodo, factor y desempeño de control por fuente.');

  reg('environmental-chemistry','environmental-chemistry','metrology','Química ambiental · pH, cinética y equilibrio',[
    f('ph','pH medido','',7.2,0,14),f('a','Concentración A','mol/L',.01,eps),f('b','Concentración B','mol/L',.02,eps),
    f('n','Orden cinético A','',1,-4,6),f('m','Orden cinético B','',1,-4,6),f('k','Constante cinética k','según orden',.4),
    f('na','Coeficiente estequiométrico A','',1,eps,8),f('nb','Coeficiente estequiométrico B','',1,eps,8),
    f('ksp','Producto de solubilidad','base de concentración consistente',.0001,eps),
    f('henry','Coeficiente Hcp','mol/(L·atm)',.034),f('pressure','Presión parcial','atm',.00042)
  ],'a(H⁺)=10⁻ᵖᴴ. v=k[A]ⁿ[B]ᵐ. Cociente de saturación aproximado IAP/Ksp. Henry C=Hcp·p.',
  v=>metrics(m('Actividad relativa de H⁺',10**(-v.ph)),m('Velocidad de reacción',v.k*v.a**v.n*v.b**v.m,'mol/(L·s)'),
    m('Cociente de saturación',v.a**v.na*v.b**v.nb/v.ksp),m('Concentración disuelta en equilibrio',v.henry*v.pressure,'mol/L')),
  'Aproximación diluida para el producto iónico. Selecciona k y Ksp consistentes con la temperatura, especie y convención.');

  reg('environmental-geology','environmental-geology','soil','Geología ambiental · Darcy y resistencia al corte',[
    ...soilFields(),f('conduct','Conductividad hidráulica','m/día',1.5),f('gradient','Gradiente hidráulico','m/m',.06),
    f('section','Sección perpendicular al flujo','m²',80,eps),f('cohesion','Cohesión efectiva','kPa',12),
    f('angle','Ángulo de fricción efectiva','°',27,0,89),f('normal','Esfuerzo normal total','kPa',90),
    f('pore','Presión de poro','kPa',22)
  ],'Darcy Q=KiA. Mohr–Coulomb τ=c′+(σ−u)tanφ′. RUSLE para erosión superficial.',
  v=>{A(v.pore<=v.normal,'La presión de poro supera el esfuerzo normal total en este modelo.');
    return metrics(m('Caudal de Darcy',v.conduct*v.gradient*v.section,'m³/día'),
      m('Resistencia al corte',v.cohesion+(v.normal-v.pore)*Math.tan(v.angle*Math.PI/180),'kPa'),m('Pérdida de suelo',erosion(v),'t/(ha·año)'));},
  'Procesos separados. Usa parámetros efectivos de ensayo. La resistencia calculada requiere geometría y cargas adicionales para un análisis de estabilidad.',usda);

  reg('lake-trophic-state','environmental-limnology','water','Limnología · estado trófico de Carlson',[
    f('chl','Clorofila a','µg/L',8,eps),f('tp','Fósforo total','µg/L',25,eps),
    f('sd','Profundidad Secchi','m',2,eps),f('area','Superficie del lago','km²',4,eps),
    f('depth','Profundidad media','m',11,eps),f('q','Caudal medio de salida','m³/s',2,eps)
  ],'TSI clorofila = 9,81 ln(Chl)+30,6. TSI fósforo = 14,42 ln(TP)+4,15. TSI Secchi = 60−14,41 ln(SD).',
  v=>{const volume=v.area*1e6*v.depth;
    return metrics(m('TSI clorofila a',9.81*Math.log(v.chl)+30.6),m('TSI fósforo',14.42*Math.log(v.tp)+4.15),
      m('TSI Secchi',60-14.41*Math.log(v.sd)),m('Volumen aproximado',volume,'m³'),m('Tiempo de renovación',volume/(v.q*86400),'días'));},
  'Contrasta los tres índices por separado. El tiempo de renovación supone volumen y caudal estacionarios.',tsi);

  reg('environmental-meteorology','environmental-meteorology','climate','Meteorología · viento frío y humedad',[
    f('t','Temperatura del aire','°C',3,-80,60),f('wind','Velocidad del viento','km/h',25),
    f('rh','Humedad relativa','%',70,.01,100),f('p','Presión atmosférica','hPa',1013,eps)
  ],'Sensación por viento (NWS en SI), presión de vapor de Magnus y punto de rocío. Razón de mezcla = 622e/(p−e).',
  v=>{const b=17.62,c=243.12,g=Math.log(v.rh/100)+b*v.t/(c+v.t),e=6.112*Math.exp(g);
    A(v.p>e,'La presión atmosférica debe superar la presión de vapor.');
    const w=v.wind**.16,wc=v.t<=10&&v.wind>=4.8?13.12+.6215*v.t-11.37*w+.3965*v.t*w:'Fuera del dominio';
    return metrics(m('Sensación por viento',wc,typeof wc==='number'?'°C':''),m('Punto de rocío',c*g/(b-g),'°C'),
      m('Presión de vapor',e,'hPa'),m('Razón de mezcla',622*e/(v.p-e),'g/kg de aire seco'));},
  'La ecuación de sensación térmica se aplica con T ≤ 10 °C y viento ≥ 4,8 km/h. Magnus usa saturación respecto al agua líquida.',nws);

  reg('environmental-oceanography','environmental-oceanography','water','Oceanografía · oleaje, marea y corrientes',[
    f('period','Periodo de ola','s',8,.1,100),f('height','Altura significativa de ola','m',1.5),
    f('depth','Profundidad de agua','m',35,.1),f('amp','Amplitud de marea','m',1.2),
    f('current','Velocidad de corriente','m/s',.35),f('section','Sección transversal de corriente','m²',180),
    f('rho','Densidad del agua','kg/m³',1025,eps)
  ],'Dispersión lineal ω²=gk tanh(kh), resuelta por bisección. Potencia de oleaje aleatorio = ρgHₛ²c_g/16. Rango de marea = 2A.',
  v=>{const g=9.80665,omega=2*Math.PI/v.period,fun=k=>g*k*Math.tanh(k*v.depth)-omega**2;
    let lo=0,hi=Math.max(1,2*omega**2/g);
    while(fun(hi)<0)hi*=2;
    for(let i=0;i<65;i++){const mid=(lo+hi)/2;if(fun(mid)>0)hi=mid;else lo=mid;}
    const k=(lo+hi)/2,kh=k*v.depth,c=omega/k,cg=c*(1+(kh>350?0:2*kh/Math.sinh(2*kh)))/2;
    return metrics(m('Longitud de onda',2*Math.PI/k,'m'),m('Velocidad de grupo',cg,'m/s'),
      m('Potencia por metro de cresta',v.rho*g*v.height**2*cg/16000,'kW/m'),m('Rango de marea',2*v.amp,'m'),
      m('Caudal de corriente',v.current*v.section,'m³/s'));},
  'Oleaje lineal sin rotura ni interacción con la corriente. La marea se aproxima a una oscilación simple.');

  reg('environmental-physics','environmental-physics','energy','Física ambiental · transferencia y transporte',[
    f('dt','Diferencia de temperatura','K',18,-500),f('thickness','Espesor de la barrera','m',.15,eps),
    f('area','Área de la barrera o sección','m²',8,eps),f('k','Conductividad térmica','W/(m·K)',.6),
    f('v','Velocidad de flujo u onda','m/s',2),f('rho','Densidad del fluido','kg/m³',1000,eps),
    f('mu','Viscosidad dinámica','Pa·s',.001,eps),f('diam','Diámetro hidráulico','m',.2,eps),
    f('hz','Frecuencia de la onda','Hz',2,eps),f('mass','Masa calentada','kg',20),f('cp','Calor específico','J/(kg·K)',4184)
  ],'Fourier estacionario P=kAΔT/L. Caudal másico=ρvA. Re=ρvD/μ. λ=v/f. Calor sensible=mcΔT.',
  v=>metrics(m('Potencia conductiva',v.k*v.area*v.dt/v.thickness,'W'),m('Caudal másico',v.rho*v.v*v.area,'kg/s'),
    m('Número de Reynolds',v.rho*v.v*v.diam/v.mu),m('Longitud de onda',v.v/v.hz,'m'),m('Calor sensible',v.mass*v.cp*v.dt/1000,'kJ')),
  'Procesos independientes. La ley de Fourier supone una barrera plana y conductividad constante.');

  reg('ocean-carbonate','ocean-acidification','water','Acidificación oceánica · saturación de carbonatos',[
    f('ph','pH de la muestra','',8.05,0,14),f('base','pH de referencia comparable','',8.15,0,14),
    f('ca','Calcio disuelto','mmol/kg',10.3),f('co3','Carbonato disuelto','µmol/kg',200),
    f('arag','Ksp aparente de aragonita','(mol/kg)²',6.5e-7,eps),
    f('calc','Ksp aparente de calcita','(mol/kg)²',4.3e-7,eps)
  ],'Ω=[Ca²⁺][CO₃²⁻]/Ksp. El cambio relativo de actividad de H⁺ es 10^(pH_ref−pH)−1.',
  v=>{const q=v.ca*v.co3*1e-9;return metrics(m('Saturación de aragonita',q/v.arag),m('Saturación de calcita',q/v.calc),
    m('Variación de actividad de H⁺',100*(10**(v.base-v.ph)-1),'%'));},
  'Usa la misma escala de pH y constantes compatibles con temperatura, salinidad y presión. Ingresa carbonato medido o calculado con un modelo de especiación.',noaa);

  reg('noise-exposure-level','noise-pollution','noise','Ruido ambiental · presión sonora y Leq',[
    f('pressure','Presión acústica RMS en aire','Pa',.02,eps),
    T('a','Intervalos de exposición','70;4\n82;2\n65;2','Columnas: nivel equivalente del intervalo (dB); duración (h).')
  ],'Lp = 20 log₁₀(p/20 µPa). Leq = 10 log₁₀[Σ(tᵢ10^(Lᵢ/10))/Σtᵢ].',
  v=>{matrix(v.a,2,q=>q[0]>=-100&&q[0]<=200&&q[1]>0,'Usa niveles entre −100 y 200 dB y duraciones positivas.');
    const duration=S(v.a.map(q=>q[1])),peak=Math.max(...v.a.map(q=>q[0]));
    const leq=peak+10*Math.log10(S(v.a.map(([d,t])=>t/duration*10**((d-peak)/10))));
    return metrics(m('Nivel por presión acústica',20*Math.log10(v.pressure/2e-5),'dB re 20 µPa'),m('Leq del periodo',leq,'dB'),m('Duración',duration,'h'));},
  'Combina intervalos con la misma ponderación y configuración instrumental. Usa presión RMS en aire.');
})();
