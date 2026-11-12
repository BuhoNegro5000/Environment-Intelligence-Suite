/* Inventarios climáticos, captura de carbono y balances de hielo. */
(function () {
  'use strict';
  const L=GL.lab,{register:R,f,pct,table,check,plot,nn}=GL.nova;
  const ipcc='https://www.ipcc.ch/report/ar6/wg1/downloads/report/IPCC_AR6_WGI_FGD_Chapter07_SM.pdf';
  R('greenhouse-radiative-forcing','greenhouse-effect','climate','Efecto invernadero · forzamiento de gases y albedo',
    [f('c','CO₂ del escenario','ppm',420,180,2000),f('c0','CO₂ de referencia','ppm',280,180,2000),
      f('m','CH₄ del escenario','ppb',1900,340,3500),f('m0','CH₄ de referencia','ppb',722,340,3500),
      f('n','N₂O del escenario','ppb',337,200,525),f('n0','N₂O de referencia','ppb',270,200,525),
      f('a','Albedo planetario del escenario','',.29,0,1),f('a0','Albedo planetario de referencia','',.30,0,1),
      f('solar','Irradiancia solar total','W/m²',1361,0,2000),
      f('sensitivity','Respuesta lineal de equilibrio','°C/(W/m²)',.8,0,5)],
    'Aproximaciones de Myhre et al. para CO₂, CH₄ y N₂O con solapamiento CH₄–N₂O. El albedo aporta −S(α−α₀)/4. Se multiplica el forzamiento total por la sensibilidad declarada.',
    'Modelo ilustrativo global de equilibrio. Emplea las expresiones históricas del IPCC y excluye aerosoles, forzamientos indirectos y evolución temporal. Usa cambios de albedo pequeños y evita doble conteo con la sensibilidad.',
    v=>{
      const overlap=(m,n)=>.47*Math.log1p(2.01e-5*(m*n)**.75+5.31e-15*m*(m*n)**1.52);
      const base=overlap(v.m0,v.n0);
      const rows=[
        ['CO₂',5.35*Math.log(v.c/v.c0)],
        ['CH₄',.036*(Math.sqrt(v.m)-Math.sqrt(v.m0))-overlap(v.m,v.n0)+base],
        ['N₂O',.12*(Math.sqrt(v.n)-Math.sqrt(v.n0))-overlap(v.m0,v.n)+base],
        ['Albedo',-v.solar*(v.a-v.a0)/4]
      ];
      const total=L.sum(rows.map(r=>r[1]));
      return {metrics:[['Forzamiento total estimado',total,'W/m²'],['Respuesta térmica de equilibrio',total*v.sensitivity,'°C']],
        headers:['Contribución','Forzamiento (W/m²)'],rows};
    },[['IPCC · capítulo 7, expresiones de forzamiento',ipcc]]);

  R('landfill-methane-deposition-series','landfill-gas-generation-lfg','waste','Relleno sanitario · curva de metano por cohortes de residuos',
    [f('k','Constante de generación','año⁻¹',.05,.00001,10),
      f('l0','Potencial de metano','m³ CH₄/t',115,0,1000),
      pct('ch4','Fracción volumétrica de metano en biogás',50,.01),pct('capture','Fracción captada',75),
      pct('destroy','Destrucción del metano captado',98),pct('oxidation','Oxidación del metano sin captación',10),
      f('start','Año inicial de disposición','año',2020,1,9999),f('years','Años adicionales después del último ingreso','años',30,0,100),
      table('waste','Masa anual de residuos ingresados',['Residuos (t)'],
        '38000\n42000\n45000\n49000\n53000\n57000','Una fila por año consecutivo. Ingresa cero en años intermedios sin disposición.')],
    'Decaimiento de primer orden por cohortes con disposición uniforme en cada año. Se integra la generación a lo largo del año. La captación se resta antes de oxidar el metano no captado.',
    'Aplica la estructura de primer orden usada para LandGEM. La integración anual continua da una serie conceptual y puede diferir de la discretización del programa EPA. La masa de residuos y los parámetros deben ser representativos del sitio.',
    v=>{
      check(v.waste,1,nn,'Usa una masa no negativa por año.');
      L.assert(v.waste.length<=200&&Number.isInteger(v.start)&&Number.isInteger(v.years),'Usa hasta 200 cohortes y años enteros.');
      const decay=-Math.expm1(-v.k);
      // Serie de Taylor para 1 − (1 − e^(−k))/k cerca de cero.
      const newGenerated=v.k<.001?v.k/2-v.k**2/6+v.k**3/24:1-decay/v.k;
      const newRemaining=1-newGenerated;
      let pool=0;
      const rows=Array.from({length:v.waste.length+v.years},(_,i)=>{
        const added=(v.waste[i]?.[0]||0)*v.l0;
        const generated=pool*decay+added*newGenerated;
        pool=pool*Math.exp(-v.k)+added*newRemaining;
        const captured=generated*v.capture/100, destroyed=captured*v.destroy/100;
        const uncaptured=generated-captured, oxidized=uncaptured*v.oxidation/100;
        const emitted=(captured-destroyed)+(uncaptured-oxidized);
        return [v.start+i,generated,generated/(v.ch4/100),captured,destroyed,oxidized,emitted];
      });
      const peak=rows.reduce((a,b)=>b[1]>a[1]?b:a);
      return {metrics:[['Generación anual máxima',peak[1],'m³ CH₄/año'],['Año del máximo',peak[0],'año'],
        ['Metano generado acumulado',L.sum(rows.map(r=>r[1])),'m³ CH₄'],['Metano emitido acumulado',L.sum(rows.map(r=>r[6])),'m³ CH₄']],
        headers:['Año','CH₄ generado (m³)','Biogás (m³)','CH₄ captado (m³)','CH₄ destruido (m³)','CH₄ oxidado (m³)','CH₄ emitido (m³)'],rows,
        series:[plot('Generado',rows,0,1),plot('Emitido',rows,0,6)],xLabel:'Año',yLabel:'m³ CH₄/año'};
    },[['EPA · generación de gas de relleno','https://www.epa.gov/sites/default/files/2016-09/documents/pdh_chapter2.pdf']]);

  R('net-zero-emissions-path','carbon-neutrality-calc','climate','Neutralidad de carbono · trayectoria de reducción y saldo neto',
    [f('base','Emisiones brutas del año inicial','t CO₂e/año',12000),
      pct('cut','Reducción anual de emisiones brutas',7),f('residual','Piso de emisiones residuales','t CO₂e/año',650),
      f('annualRemoval','Remociones anuales verificadas del escenario','t CO₂e/año',850),
      f('begin','Año inicial','año',2026,1,9999),f('removalStart','Primer año con remociones','año',2035,1,9999),
      f('span','Años posteriores al inicial','años',35,1,150)],
    'Las emisiones brutas bajan geométricamente hasta el piso declarado. El saldo neto anual resta las remociones desde el primer año aplicable.',
    'Escenario aritmético. Declara límites del inventario y remociones verificadas sin duplicar créditos. Las emisiones netas acumuladas cubren todos los años de la tabla.',
    v=>{
      L.assert([v.begin,v.removalStart,v.span].every(Number.isInteger)&&v.residual<=v.base,'Usa años enteros y un piso inferior o igual a la línea base.');
      const rows=Array.from({length:v.span+1},(_,i)=>{
        const y=v.begin+i, gross=Math.max(v.residual,v.base*(1-v.cut/100)**i);
        const removed=y>=v.removalStart?v.annualRemoval:0;
        return [y,gross,removed,gross-removed];
      });
      const netZero=rows.find(r=>r[3]<=0);
      return {metrics:[['Primer año con saldo neto ≤ 0',netZero?.[0]??'Fuera del horizonte','año'],
        ['Emisiones netas acumuladas',L.sum(rows.map(r=>r[3])),'t CO₂e'],['Saldo anual al final',rows.at(-1)[3],'t CO₂e/año']],
        headers:['Año','Emisiones brutas','Remociones','Saldo neto'],rows,
        series:[plot('Brutas',rows,0,1),plot('Netas',rows,0,3)],xLabel:'Año',yLabel:'t CO₂e/año'};
    });

  R('amine-co2-absorber-screen','co2-capture-amine-absorber-design','climate','Captura de CO₂ con aminas · caudal, diámetro y regeneración',
    [f('q','Caudal real de gas húmedo','m³/h',15000,.001),pct('co2','CO₂ en base húmeda',12),
      pct('target','Fracción de CO₂ capturada',90),f('temp','Temperatura del gas','°C',45,-40,300),
      f('pressure','Presión absoluta','kPa',103,.001,2000),f('velocity','Velocidad superficial de diseño','m/s',1.7,.001,20),
      f('working','Capacidad de trabajo de la solución','kg CO₂/kg solución',.055,.000001,2),
      f('steam','Calor específico de regeneración','GJ/t CO₂',3.6,0,100)],
    'La ley de gas ideal convierte caudal real a flujo molar. La captura usa concentración y objetivo. Área = caudal / velocidad superficial. El flujo de solución usa la diferencia de carga útil rica–pobre.',
    'Balance conceptual. Usa la velocidad admisible del empaque y una capacidad de trabajo coherente. La altura, inundación, cinética, corrosión y emisiones de amina requieren un diseño de transferencia de masa.',
    v=>{
      const feed=v.q*v.pressure/(8.314462618*(v.temp+273.15))*44.0095*v.co2/100;
      const captured=feed*v.target/100, area=v.q/3600/v.velocity;
      return {metrics:[['CO₂ capturado',captured,'kg/h'],['CO₂ en el gas de entrada',feed,'kg/h'],['CO₂ remanente',feed-captured,'kg/h'],
        ['Diámetro por velocidad superficial',Math.sqrt(4*area/Math.PI),'m'],
        ['Circulación de solución',captured/v.working/1000,'t/h'],['Potencia térmica de regeneración',captured*v.steam/3.6,'kW térmicos']]};
    });

  R('direct-air-capture-net','direct-air-capture-dac','climate','Captura directa de aire · flujo, energía y remoción neta',
    [f('goal','Meta de captura bruta','t CO₂/año',1000,.001),f('ppm','Concentración atmosférica de CO₂','ppm',425,.01,2000),
      pct('eta','Fracción capturada por pasada',60,.01),f('hours','Horas operativas al año','h/año',8000,.001,8784),
      f('temp','Temperatura del aire','°C',20,-60,70),f('pressure','Presión absoluta','kPa',100,.01,200),
      f('electric','Consumo eléctrico específico','kWh/t CO₂',650),f('heat','Consumo térmico específico','GJ/t CO₂',5.5),
      f('efElectric','Intensidad de la electricidad','kg CO₂e/kWh',.12),f('efHeat','Intensidad del calor','kg CO₂e/GJ',13),
      f('other','Otras emisiones de ciclo de vida','kg CO₂e/t CO₂ capturada',40),
      pct('stored','Fracción almacenada de forma duradera',98),f('tariff','Costo de electricidad','moneda/kWh',.16),
      f('heatRate','Costo del calor','moneda/GJ',8)],
    'Caudal mínimo = captura por hora / (concentración másica de CO₂ × fracción capturada). Remoción neta = CO₂ almacenado − emisiones por energía y demás fuentes declaradas.',
    'Estimación con concentraciones y consumos constantes. La remoción requiere almacenamiento duradero. El costo informado cubre energía y excluye inversión, transporte y almacenamiento.',
    v=>{
      const density=v.pressure/(8.314462618*(v.temp+273.15))*44.0095*v.ppm/1e6;
      const q=v.goal*1000/(v.hours*density*v.eta/100);
      const electric=v.goal*v.electric, heat=v.goal*v.heat, stored=v.goal*v.stored/100;
      const emitted=(electric*v.efElectric+heat*v.efHeat+v.goal*v.other)/1000;
      return {metrics:[['Remoción neta del escenario',stored-emitted,'t CO₂e/año'],['Caudal de aire requerido',q,'m³/h'],
        ['CO₂ almacenado',stored,'t CO₂/año'],['Emisiones de ciclo de vida',emitted,'t CO₂e/año'],
        ['Electricidad',electric,'kWh/año'],['Calor',heat,'GJ/año'],['Costo anual de energía',electric*v.tariff+heat*v.heatRate,'moneda/año']]};
    });

  R('glacier-elevation-mass-balance','glacier-mass-balance-equilibrium','climate','Glaciares · balance de masa por elevación y línea de equilibrio',
    [table('bands','Franjas de elevación',['Elevación (m)','Área (km²)','Acumulación (m e.a.)','Ablación (m e.a.)'],
        '2750;1.2;.3;1.9\n3050;2.5;.65;1.5\n3350;2.8;.95;1.05\n3650;1.7;1.3;.62\n3950;.8;1.5;.28',
        'Una fila por franja, acumulación y ablación anuales positivas. e.a. = equivalente de agua.'),
      pct('precip','Cambio relativo de acumulación',5,-100),
      f('delta','Cambio térmico del escenario','°C',.6,-20,20),
      f('sensitivity','Ablación adicional por aumento de temperatura','m e.a./°C',.3,0,20)],
    'Balance específico por franja = acumulación ajustada − ablación ajustada. Media ponderada por área. La línea de equilibrio se interpola en el cruce de balance negativo a positivo.',
    'Modelo estático por bandas. Interpola cruces en lugar de extrapolar la línea de equilibrio fuera del rango. La geometría y la sensibilidad deben provenir del glaciar de estudio.',
    v=>{
      check(v.bands,4,r=>r[1]>0&&r[2]>=0&&r[3]>=0,'Usa franjas con área positiva y acumulación y ablación no negativas.');
      const rows=v.bands.map(([h,a,c,m])=>[h,a,c,m,c-m,c*(1+v.precip/100)-Math.max(0,m+v.delta*v.sensitivity)]).sort((a,b)=>a[0]-b[0]);
      L.assert(rows.every((r,i)=>!i||r[0]>rows[i-1][0]),'Las elevaciones deben ser distintas.');
      const area=L.sum(rows.map(r=>r[1])), volume=i=>L.sum(rows.map(r=>r[1]*r[i]));
      const crossings=[];
      for(let i=1;i<rows.length;i++){
        const [lo,hi]=[rows[i-1],rows[i]];
        if(lo[5]<0&&hi[5]>=0)crossings.push(lo[0]+(hi[0]-lo[0])*(-lo[5])/(hi[5]-lo[5]));
      }
      const ela=crossings.length===1?crossings[0]:crossings.length?'Varios cruces':'Sin cruce dentro de las franjas';
      return {metrics:[['Balance específico del escenario',volume(5)/area,'m e.a./año'],
        ['Balance específico inicial',volume(4)/area,'m e.a./año'],['Volumen neto de agua equivalente',volume(5)*1e6,'m³/año'],
        ['Línea de equilibrio del escenario',ela,'m']],
        headers:['Elevación (m)','Área (km²)','Acumulación','Ablación','Balance inicial','Balance escenario'],rows,
        series:[plot('Balance inicial',rows,0,4),plot('Escenario',rows,0,5)],xLabel:'Elevación (m)',yLabel:'m e.a./año'};
    });
})();
