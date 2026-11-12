/* Diagnóstico y dimensionamiento preliminar de equipos. */
(function () {
  'use strict';
  const L=GL.lab,{reg,metric:m,metrics,field:f,pct,rows,eps}=GL.pluto;
  const {assert:A,table:T,select}=L;
  const filmtec=[['DuPont · manual técnico de OI y NF','https://www.dupont.com/content/dam/water/amer/us/en/water/public/documents/en/RO-NF-FilmTec-Manual-45-D01504-en.pdf']];
  const net=(feed,con,perm,osm)=>.5*(feed+con)-perm-osm;

  reg('liquid-water-properties',['water'],'water','Agua pura · densidad y viscosidad',[
    f('t','Temperatura del agua líquida','°C',20,0,40)
  ],'Densidad de Tanaka (NISTIR 7383). Viscosidad dinámica según IAPWS SR6-08, ecuación 7. Viscosidad cinemática ν=μ/ρ.',
  v=>{const t=v.t,theta=(t+273.15)/300;
    const rho=999.97495*(1-(t-3.983035)**2*(t+301.797)/(522528.9*(t+69.34881)));
    const mu=1e-6*(280.68*theta**(-1.9)+511.45*theta**(-7.7)+61.131*theta**(-19.6)+.45903*theta**(-40));
    return metrics(m('Densidad',rho,'kg/m³'),m('Viscosidad dinámica',1000*mu,'mPa·s'),
      m('Viscosidad cinemática',1e6*mu/rho,'cSt'));},
  'Agua pura en fase líquida a presión cercana a 0,1 MPa, entre 0 y 40 °C.',
  [['NIST · densidad de agua','https://www.nist.gov/system/files/documents/pml/wmd/labmetrology/NISTIR_7383_20130424_20160123Rev.pdf'],
    ['IAPWS · correlaciones para agua líquida','https://iapws.org/technical-guidance/release/LiquidWater']]);

  const gases=[['air','Aire seco',28.965],['oxygen','Oxígeno',31.9988],['nitrogen','Nitrógeno',28.0134],
    ['co2','Dióxido de carbono',44.0095],['ch4','Metano',16.0425],['other','Gas o mezcla personalizada',null]];
  reg('gas-state-density',['gasprop'],'air','Propiedades de gases · densidad y volumen específico',[
    select('gas','Gas',gases.map(([key,label])=>[key,label]),'air'),
    f('mw','Masa molar para gas personalizado','g/mol',28.965,eps),
    f('t','Temperatura','°C',20,-200,1200),f('p','Presión absoluta','kPa',101.325,eps),
    f('z','Factor de compresibilidad Z (ideal=1)','',1,.05,10)
  ],'PV=ZnRT. ρ=PM/(ZRT), con R=8,314462618 J/(mol·K). Volumen específico=1/ρ.',
  v=>{const mw=gases.find(([key])=>key===v.gas)[2]??v.mw,vm=v.z*8.314462618*(v.t+273.15)/(1000*v.p);
    const rho=mw/(1000*vm);
    return metrics(m('Densidad',rho,'kg/m³'),m('Masa molar',mw,'g/mol'),
      m('Volumen molar',1000*vm,'L/mol'),m('Volumen específico',1/rho,'m³/kg'));},
  'Usa presión absoluta y Z correspondiente al gas, temperatura y presión. El gas debe permanecer monofásico.');

  reg('boiler-blowdown-balance',['boiler'],'energy','Calderas · purga y ciclos de concentración',[
    f('steam','Producción de vapor','t/h',12),f('cycles','Ciclos de concentración respecto a alimentación','',6,1.001),
    f('feed','TDS del agua de alimentación','mg/kg',100),
    pct('return','Fracción de vapor recuperada como condensado',70),
    f('dh','Entalpía de purga por encima de agua de reposición','kJ/kg',590),
    pct('recovery','Fracción recuperada del calor de purga',25)
  ],'En estado estacionario con vapor libre de sales, purga = vapor/(ciclos−1). Alimentación = vapor + purga. TDS caldera = ciclos × TDS alimentación.',
  v=>{const b=v.steam/(v.cycles-1),feed=v.steam+b;return metrics(m('Purga',b,'t/h'),m('Agua de alimentación',feed,'t/h'),
    m('Reposición neta',feed-v.steam*v.return/100,'t/h'),m('TDS estimado en caldera',v.cycles*v.feed,'mg/kg'),
    m('Pérdida térmica neta de purga',b*v.dh*(1-v.recovery/100)/3.6,'kW'));},
  'Balance estacionario. Los ciclos admitidos dependen de la presión de operación y de las especificaciones de química del agua.',
  [['DOE · minimización de la purga de calderas','https://www.energy.gov/sites/prod/files/2014/05/f16/steam9_blowdown.pdf']]);

  reg('membrane-ro-diagnostics',['ronorm','rodesign'],'water','Ósmosis inversa y NF · diagnóstico y área preliminar',[
    f('q','Permeado actual','m³/h',35),f('area','Área activa actual','m²',2100,eps),
    f('feed','Presión en alimentación','bar',16),f('con','Presión en concentrado','bar',14.5),
    f('perm','Presión de permeado','bar',.5),f('osm','Diferencia osmótica efectiva media','bar',3),
    f('ref','Presión motriz neta de referencia','bar',12,eps),
    f('tf','Factor de permeabilidad a temperatura actual respecto a referencia','',1.12,eps),
    f('target','Permeado objetivo','m³/h',45),f('flux','Flujo de diseño elegido','L/(m²·h)',16,eps),
    f('element','Área activa por elemento','m²',37,eps),pct('rec','Recuperación de diseño',55,.01,99.99)
  ],'PMN = media de presiones de alimentación y concentrado − presión de permeado − diferencia osmótica. Q normalizado = Q actual × PMNref/(PMNactual × factor térmico). Área objetivo = permeado/flujo.',
  v=>{A(v.feed>=v.con,'La presión de concentrado supera a la de alimentación.');
    const ndp=net(v.feed,v.con,v.perm,v.osm);A(ndp>0,'La presión motriz neta debe ser positiva.');
    const a=v.target*1000/v.flux;
    return metrics(m('Presión motriz neta actual',ndp,'bar'),m('Flujo específico actual',1000*v.q/v.area,'L/(m²·h)'),
      m('Permeado normalizado aproximado',v.q*v.ref/(ndp*v.tf),'m³/h'),m('Área objetivo preliminar',a,'m²'),
      m('Elementos mínimos por área',Math.ceil(a/v.element)),m('Caudal de alimentación objetivo',100*v.target/v.rec,'m³/h'));},
  'Aproximación de permeabilidad lineal. Usa diferencia osmótica y factor térmico de la membrana. Para diseño definitivo verifica arreglo, recuperación por elemento, presión, polarización e incrustación con el fabricante.',filmtec);

  reg('modified-fouling-index',['mfi'],'water','Índice MFI · ajuste del tramo de filtración',[
    T('a','Tramo lineal seleccionado del ensayo','0.1;1.15\n0.2;2.6\n0.3;4.35\n0.4;6.4',
      'Columnas: volumen acumulado (L); tiempo acumulado (s). Selecciona el tramo de formación de torta, después del arranque.'),
    f('pressure','Presión de ensayo','bar',2,eps),f('mu','Viscosidad de ensayo','mPa·s',1.002,eps),
    f('area','Área activa del disco','cm²',13.8,eps)
  ],'Se ajusta t/V=a+b·V por mínimos cuadrados. MFI normalizado = b·(P/2 bar)·(1,002/μ)·(A/13,8 cm²)².',
  v=>{
    rows(v.a,2,([x,t])=>x>0&&t>0,'Usa volúmenes y tiempos positivos.');
    A(v.a.length>=3&&v.a.every((r,i)=>i===0||r[0]>v.a[i-1][0]&&r[1]>v.a[i-1][1]),'Usa tres o más pares crecientes.');
    const x=v.a.map(r=>r[0]),y=v.a.map(([a,b])=>b/a),fit=GL.stat.linreg(x,y);
    A(fit.slope>=0,'La pendiente es negativa. Revisa la selección del tramo.');
    return {metrics:[m('MFI normalizado',fit.slope*(v.pressure/2)*(1.002/v.mu)*(v.area/13.8)**2,'s/L²'),
      m('Pendiente medida',fit.slope,'s/L²'),m('R² del ajuste',fit.r2)],headers:['Volumen (L)','Tiempo (s)','t/V (s/L)'],
      rows:v.a.map((r,i)=>[...r,y[i]]),series:[{name:'t/V medido',data:x.map((a,i)=>[a,y[i]]),type:'scatter',points:true},
      {name:'Recta',data:x.map(a=>[a,fit.intercept+a*fit.slope])}],xLabel:'Volumen (L)',yLabel:'t/V (s/L)'};
  },'La normalización corresponde al ensayo MFI 0,45 µm. La selección del tramo lineal requiere revisar la curva y el protocolo.',
  [['IHE Delft · métodos experimentales de membranas','https://ihe-delft-ihe-website-production.s3.eu-central-1.amazonaws.com/s3fs-public/2025-11/Salinas_and_Villacorte_%282024%29_-_Experimental_Methods_for_Membrane_Applications_in_Desalination_and_Water_Treatment.pdf']]);

  reg('filter-backwash-expansion',['granularexp'],'water','Retrolavado · expansión de lecho granular',[
    f('depth','Altura de lecho en reposo','m',1,eps),pct('void','Porosidad inicial',40,.01,99.99),
    f('u','Velocidad superficial ascendente','m/h',35),
    f('ut','Velocidad terminal efectiva del medio','m/h',260,eps),f('n','Exponente calibrado de Richardson–Zaki','',4.5,1,12),
    f('area','Área del filtro','m²',8,eps)
  ],'En régimen fluidizado, ε=(u/uₜ)^(1/n). Altura expandida = H₀·(1−ε₀)/(1−ε). Por debajo del inicio estimado se conserva H₀.',
  v=>{A(v.u<v.ut,'La velocidad de retrolavado debe ser menor que la terminal del medio.');
    const initial=v.void/100,expanded=Math.max(initial,(v.u/v.ut)**(1/v.n)),h=v.depth*(1-initial)/(1-expanded);
    return metrics(m('Altura estimada de lecho',h,'m'),m('Expansión',100*(h/v.depth-1),'%'),
      m('Caudal de retrolavado',v.u*v.area,'m³/h'),m('Inicio estimado de expansión',v.ut*initial**v.n,'m/h'));},
  'Modelo preliminar para un medio homogéneo fluidizado con agua. Usa parámetros medidos a la temperatura de operación y verifica el riesgo de arrastre.');

  reg('carbonate-pure-water-co2',['co2c'],'water','CO₂ en agua pura · equilibrio abierto',[
    f('pco2','Presión parcial de CO₂','µatm',420),f('kh','Constante de Henry Hcp','mol/(L·atm)',.033,eps),
    f('p1','pKa₁ aparente del CO₂*','',6.35,0,14),f('p2','pKa₂','',10.33,0,16),
    f('pkw','pKw del agua','',14,4,17)
  ],'CO₂*=Hcp·pCO₂. Se resuelve electroneutralidad: [H⁺]=[OH⁻]+[HCO₃⁻]+2[CO₃²⁻] usando las constantes introducidas.',
  v=>{
    A(v.p2>=v.p1,'Usa pKa en orden creciente.');
    const co2=v.kh*v.pco2*1e-6,k1=10**(-v.p1),k2=10**(-v.p2),kw=10**(-v.pkw);
    const charge=ph=>{const h=10**(-ph);return h-kw/h-co2*k1/h-2*co2*k1*k2/(h*h);};
    let lo=-2,hi=14;A(charge(lo)>=0&&charge(hi)<=0,'El equilibrio cae fuera del intervalo numérico.');
    for(let i=0;i<70;i++){const ph=(lo+hi)/2;if(charge(ph)>0)lo=ph;else hi=ph;}
    const ph=(lo+hi)/2,h=10**(-ph),b=co2*k1/h,c=b*k2/h;
    const cond=1000*(349.65*h+198.5*kw/h+44.5*b+138.6*c);
    return metrics(m('pH de equilibrio',ph),m('CO₂* disuelto',co2*44009.5,'mg/L'),m('Carbono inorgánico disuelto',(co2+b+c)*1000,'mmol/L'),
      m('Conductividad límite a 25 °C',cond,'µS/cm'));},
  'Agua sin alcalinidad añadida ni otras sales. La conductividad usa movilidades límite a 25 °C. Usa constantes compatibles con la temperatura.');

  reg('finance-water-cashflows',['annuity','annuityd','cagr','interest','simplerates'],'impact','Finanzas de proyectos · anualidades, tasas y crecimiento',[
    f('capital','Capital inicial','moneda',10000),f('end','Valor final observado para CAGR','moneda',14500),
    f('payment','Pago periódico constante','moneda',1800),f('periods','Número de periodos (años para CAGR)','',6,1,500),
    pct('rate','Tasa nominal anual',8,0,100),f('freq','Capitalizaciones por año','',1,1,365),
    select('timing','Momento del pago periódico',[['end','Al final del periodo'],['start','Al inicio del periodo']],'end')
  ],'Tasa periódica = tasa nominal/frecuencia. Tasa efectiva anual = (1+i)^frecuencia−1. Las anualidades usan pagos constantes; CAGR=(final/inicial)^(1/años)−1.',
  v=>{
    A(Number.isInteger(v.periods)&&Number.isInteger(v.freq),'Usa periodos y frecuencia enteros.');
    const i=v.rate/(100*v.freq),ln=Math.log1p(i),n=v.periods,when=v.timing==='start'?1+i:1;
    const pv=v.payment*when*(i?-Math.expm1(-n*ln)/i:n),fv=v.payment*when*(i?Math.expm1(n*ln)/i:n);
    const cagr=v.capital>0?100*Math.expm1(Math.log(v.end/v.capital)/n):'Base inicial debe ser positiva';
    return metrics(m('Valor presente de la anualidad',pv,'moneda'),m('Valor futuro de la anualidad',fv,'moneda'),
      m('Tasa efectiva anual',100*Math.expm1(v.freq*ln),'%'),m('Tasa periódica',100*i,'%'),
      m('Interés simple para n periodos',v.capital*i*n,'moneda'),m('Crecimiento anual compuesto',cagr,typeof cagr==='number'?'%':''));
  },'En anualidades e interés simple, n está en periodos de capitalización; para CAGR, n se interpreta como años. Los resultados son ejercicios financieros independientes.');
})();
