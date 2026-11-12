/* Balances, líneas de energía y revisión de equipos. */
(function(){
  'use strict';
  const L=GL.lab,{reg,m,out,table,f,p,check,nn,int,load,eps,g}=GL.atlas,{assert:A,sum:S,table:T}=L;
  const epanet=[['EPA · EPANET 2.2','https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P10113EM.txt']];
  const doe=[['DOE · balance de torre de enfriamiento','https://www.energy.gov/cmei/femp/best-management-practice-10-cooling-tower-management']];
  const area=d=>Math.PI*d*d/4;
  const calc=(id,values)=>L.definitions.find(d=>d.id===id).calc(values);
  function loss(q,d,length,rough,nu,k){
    const velocity=q/area(d),re=velocity*d/nu;
    const turbulent=n=>.25/Math.log10(rough/(3.7*d)+5.74/n**.9)**2;
    const friction=!re?0:re<=2000?64/re:re>=4000?turbulent(re):.032+(turbulent(4000)-.032)*(re-2000)/2000;
    return {velocity,re,head:(friction*length/d+k)*velocity**2/(2*g)};
  }

  reg('plant-network-balance',['plant-water-mass-balance','plant-water-mass-balance?mode=wastewater'],'water','Red de tratamiento · balance estacionario de agua y componentes',[
    T('streams','Corrientes internas y de frontera','0;1;100;120;260\n1;2;90;90;130\n1;0;10;320;1250\n2;1;20;90;130\n2;0;70;90;130',
      'Columnas: nodo origen; nodo destino; m³/h; concentración A (mg/L); concentración B (mg/L). Nodo 0 = exterior. Incluye cada recirculación una sola vez.'),
    T('terms','Términos de proceso por nodo','1;-20;-2.5;-4.4\n2;0;0;0',
      'Columnas: nodo; aporte de agua (m³/h); producción de A (kg/h); producción de B (kg/h). Signo negativo para consumo. Usa cero cuando no corresponda.'),
    L.select('mode','Modo',[['audit','Auditar concentraciones declaradas'],['solve','Resolver concentraciones con mezcla completa']],'audit'),
    L.text('basis','Componentes A y B','Soluto y sólidos suspendidos'),f('qTol','Tolerancia hidráulica','m³/h',.01),f('mTol','Tolerancia de masa','kg/h',.01)
  ],'Balance por nodo: entradas + generación − salidas. El modo de mezcla completa resuelve un sistema lineal por constituyente. Las recirculaciones internas se cancelan en el total.',
  v=>{
    check(v.streams,5,r=>nn(r)&&r.slice(0,2).every(int)&&r[0]!==r[1],'Usa nodos enteros distintos y corrientes no negativas.');
    check(v.terms,4,r=>int(r[0])&&r[0]>0,'Cada término necesita un nodo interno positivo.');
    const ids=new Set(v.streams.flatMap(r=>r.slice(0,2)).filter(Boolean));
    A(ids.size>0&&v.terms.every(r=>ids.has(r[0])),'Los términos deben corresponder a nodos con corrientes.');
    let streams=v.streams,solutions;
    if(v.mode==='solve'){
      const nodes=[...ids],order=new Map(nodes.map((id,i)=>[id,i])),n=nodes.length;
      A(n<=50,'Usa hasta 50 nodos para resolver el sistema.');
      const coefficients=Array.from({length:n},()=>Array(n).fill(0));
      const rhs=Array.from({length:n},()=>[0,0]);
      const water=Array(n).fill(0);
      for(const [from,to,q,a,b] of v.streams){
        const i=order.get(from),j=order.get(to);
        if(from){coefficients[i][i]+=q;water[i]-=q;}
        if(to){
          water[j]+=q;
          if(from)coefficients[j][i]-=q;else {rhs[j][0]+=q*a;rhs[j][1]+=q*b;}
        }
      }
      for(const [id,q,a,b] of v.terms){const i=order.get(id);water[i]+=q;rhs[i][0]+=1000*a;rhs[i][1]+=1000*b;}
      A(water.every(x=>Math.abs(x)<=v.qTol),'Cierra primero el balance hidráulico de los nodos.');
      const concentrations=L.multiply(L.inverse(coefficients),rhs);
      A(concentrations.every(r=>r.every(x=>Number.isFinite(x)&&x>=-1e-8)),'El modelo genera concentraciones negativas. Revisa términos de proceso.');
      solutions=new Map(nodes.map((id,i)=>[id,concentrations[i].map(x=>Math.max(0,x))]));
      streams=v.streams.map(([from,to,q,a,b])=>[from,to,q,...(from?solutions.get(from):[a,b])]);
    }
    const balances=new Map([...ids].map(id=>[id,[0,0,0]]));
    const boundary=[0,0,0];
    const add=(to,x,s)=>x.forEach((a,i)=>{to[i]+=s*a;});
    for(const [from,to,q,c,d] of streams){
      const x=[q,load(q,c),load(q,d)];
      if(from)add(balances.get(from),x,-1);else add(boundary,x,1);
      if(to)add(balances.get(to),x,1);else add(boundary,x,-1);
    }
    for(const [id,...x] of v.terms){add(balances.get(id),x,1);add(boundary,x,1);}
    const closed=([q,a,b])=>Math.abs(q)<=v.qTol&&Math.abs(a)<=v.mTol&&Math.abs(b)<=v.mTol;
    const data=[...balances].sort((a,b)=>a[0]-b[0]).map(([id,x])=>[id,...x,closed(x)?'Cierra':'Revisar',...(solutions?.get(id)||[])]);
    return table([m('Nodos fuera de tolerancia',data.filter(r=>r[4]==='Revisar').length),m('Residual externo de agua',boundary[0],'m³/h'),
      m('Residual externo A',boundary[1],'kg/h'),m('Residual externo B',boundary[2],'kg/h')],
      ['Nodo','Residual agua (m³/h)','Residual A (kg/h)','Residual B (kg/h)','Cierre',...(solutions?['Salida A (mg/L)','Salida B (mg/L)']:[])],data);
  },'Declara transformaciones y retornos. Al resolver por mezcla completa, todas las salidas del mismo nodo llevan igual concentración. Para separaciones con composiciones distintas, usa la auditoría.');

  reg('influent-design-loading',['wastewater-influent-basis'],'water','Afluente de PTAR · escenarios hidráulicos y cargas',[
    T('a','Escenarios de entrada','1800;230;440;42;7\n3000;190;390;36;6\n900;300;520;56;9',
      'Columnas: caudal (m³/d); DBO, DQO, nitrógeno y fósforo (mg/L). Una fila por caso de diseño.'),
    f('hour','Caudal pico horario medido','m³/h',200)
  ],'Carga diaria = caudal × concentración/1000. Se informa el máximo por variable sin mezclar filas de escenarios.',
  v=>{check(v.a,5,r=>nn(r)&&r[0]>0,'Usa caudal positivo y concentraciones no negativas.');
    const rows=v.a.map(([q,...cs],i)=>[i+1,q,...cs.map(c=>load(q,c))]);
    return table([m('Caudal diario máximo',Math.max(...v.a.map(r=>r[0])),'m³/d'),m('Pico horario declarado',v.hour,'m³/h'),
      m('Carga DBO máxima',Math.max(...rows.map(r=>r[2])),'kg/d')],
      ['Escenario','Caudal (m³/d)','DBO (kg/d)','DQO (kg/d)','N (kg/d)','P (kg/d)'],rows);},
  'Usa observaciones representativas y distingue caudal instantáneo, horario y diario.');

  reg('source-water-design-data',['source-water-design-basis'],'analysis','Agua bruta · estadística ponderada por condición',[
    T('a','Observaciones del mismo parámetro','1;5;1;0\n1;12;3;0\n2;25;2;0\n2;2;1;1',
      'Columnas: código de condición; resultado o límite de reporte; peso; censura (0 observado, 1 menor que el límite).'),
    L.select('rule','Tratamiento de censura',[['half','Mitad del límite'],['upper','Límite como cota'],['omit','Excluir observación censurada']],'half'),
    L.text('parameter','Parámetro y unidad','Turbidez · NTU')
  ],'Media ponderada y percentil 90 por distribución ponderada empírica, con regla de censura explícita y desglose por condición.',
  v=>{check(v.a,4,r=>nn(r)&&int(r[0])&&r[2]>0&&[0,1].includes(r[3]),'Usa condición entera, peso positivo y censura 0/1.');
    const groups=[null,...new Set(v.a.map(r=>r[0]))];
    const rows=groups.map(group=>{
      const raw=v.a.filter(r=>group===null||r[0]===group);
      const used=raw.filter(r=>!r[3]||v.rule!=='omit').map(r=>[r[1]*(r[3]&&v.rule==='half'?.5:1),r[2]]).sort((a,b)=>a[0]-b[0]);
      const total=S(used.map(r=>r[1]));let cumulative=0;
      const q=used.find(([,w])=>(cumulative+=w)>=.9*total)?.[0]??null;
      return [group??'Todos',raw.length,raw.filter(r=>r[3]).length,used.length,total?S(used.map(([x,w])=>x*w))/total:null,q];
    });
    return table([m('Observaciones',v.a.length),m('Media ponderada global',rows[0][4]??'Sin datos'),m('P90 global',rows[0][5]??'Sin datos')],
      ['Condición','Registros','Censurados','Usados','Media ponderada','P90'],rows);},
  'La sustitución de no detectados es un supuesto de escenario. Usa una sola variable y unidad por análisis.');

  reg('cooling-tower-cycles',['cooling-tower-water-balance-lsi'],'water','Torre de enfriamiento · balance de agua y LSI medido',[
    f('evap','Evaporación','m³/h',15),f('drift','Arrastre','m³/h',.4),f('cycles','Ciclos de concentración objetivo','',4,1.001),
    f('ph','pH circulante medido','',8,0,14),f('temp','Temperatura circulante','°C',32,0,80),f('tds','TDS circulante','mg/L',1200,1,10000),
    f('ca','Dureza cálcica circulante','mg/L como CaCO₃',220,eps),f('alk','Alcalinidad circulante','mg/L como CaCO₃',160,eps)
  ],'Purga = evaporación/(ciclos−1) − arrastre. Reposición = evaporación + arrastre + purga. LSI usa química circulante medida.',
  v=>{const blow=v.evap/(v.cycles-1)-v.drift;
    const [lsi,,phs]=calc('calcite-saturation-indices',{...v,calcium:v.ca}).metrics;
    const actual=v.drift+Math.max(0,blow);
    return {...out(m('Purga programable',Math.max(0,blow),'m³/h'),m('Reposición',v.evap+actual,'m³/h'),
      m('Ciclos resultantes',actual?1+v.evap/actual:'Sin descarga líquida'),m('LSI de agua circulante',lsi[1]),phs),
      message:blow<0?'El arrastre ya supera la salida líquida compatible con los ciclos objetivo.':''};},
  'Balance estacionario. El LSI es un indicador de saturación de CaCO₃, con parámetros circulantes medidos.',doe);

  reg('water-plant-energy-profile',['wtp-hydraulic-profile','wtp-hydraulic-profile?mode=wastewater'],'water','Perfil hidráulico · HGL, EGL y energía de bombeo',[
    f('initial','Carga total inicial (EGL)','m',120),f('nu','Viscosidad cinemática','cSt',1,eps),
    T('a','Trayectoria hidráulica','120;200;250;0.05;3;0;0;104\n120;100;200;0.05;2;12;2;110\n120;50;200;0.05;1;0;3;114',
      'Columnas: m³/h; longitud (m); diámetro interno (mm); rugosidad (mm); ΣK; altura de bomba (m); pérdida fija (m); cota de salida (m).')
  ],'EGL se propaga sumando bombeo y restando pérdidas Darcy y fijas. HGL=EGL−v²/2g. Carga de presión=HGL−cota.',
  v=>{check(v.a,8,r=>r.slice(0,7).every(x=>x>=0)&&r[2]>0&&r[3]/r[2]<=.05,'Revisa caudal, diámetro, rugosidad y pérdidas.');
    let total=v.initial;
    const rows=v.a.map(([q,len,d,e,k,pump,fixed,z],i)=>{
      const x=loss(q/3600,d/1000,len,e/1000,v.nu*1e-6,k);
      total+=pump-x.head-fixed;const hgl=total-x.velocity**2/(2*g);
      return [i+1,z,x.head+fixed,total,hgl,hgl-z,998*g*q/3600*pump/1000];
    });
    return {...table([m('EGL final',total,'m'),m('Carga de presión mínima',Math.min(...rows.map(r=>r[5])),'m'),
      m('Potencia hidráulica total',S(rows.map(r=>r[6])),'kW')],['Tramo','Cota','Pérdida','EGL','HGL','Presión (m)','Potencia hidráulica (kW)'],rows),
      series:[{name:'EGL',data:rows.map(r=>[r[0],r[3]])},{name:'HGL',data:rows.map(r=>[r[0],r[4]])},{name:'Cota',data:rows.map(r=>r.slice(0,2))}],
      xLabel:'Tramo',yLabel:'Cota (m)'};},
  'Trayectoria en serie para un caso de caudal declarado. Incluye pérdidas de estructuras como carga fija; no resuelve reparto en ramales ni transitorios.',epanet);

  reg('pipe-total-pressure-drop',['pipe-friction-calculator'],'water','Tramo de tubería · fricción, accesorios y elevación',[
    f('q','Caudal','m³/h',95),f('d','Diámetro interior','mm',200,eps),f('len','Longitud','m',240),
    f('rough','Rugosidad','mm',.045),f('k','Pérdidas locales ΣK','',4),f('dz','Desnivel final − inicial','m',6,-5000),
    f('t','Temperatura del agua','°C',20,0,40)
  ],'Darcy–Weisbach y pérdidas locales; la presión requerida añade desnivel estático. Densidad Tanaka y viscosidad IAPWS.',
  v=>{A(v.rough/v.d<=.05,'Revisa la rugosidad relativa.');
    const [rho,,nu]=calc('liquid-water-properties',{t:v.t}).metrics.map(entry=>entry[1]);
    const x=loss(v.q/3600,v.d/1000,v.len,v.rough/1000,nu*1e-6,v.k);
    return out(m('Diferencial total requerido',rho*g*(x.head+v.dz)/1000,'kPa'),m('Pérdidas dinámicas',x.head,'m'),
      m('Altura total',x.head+v.dz,'m'),m('Velocidad',x.velocity,'m/s'),m('Reynolds',x.re),m('Densidad',rho,'kg/m³'));},
  'Tubería llena y sección constante. Introduce la rugosidad representativa del material y su estado.',epanet);

  reg('actuator-torque-envelope',['pneumatic-actuator-selector'],'water','Actuador neumático · margen de par por ángulo',[
    T('a','Requisitos y curvas disponibles','0;170;100;220;170\n45;100;120;190;175\n90;100;145;180;190',
      'Columnas: ángulo (°); par requerido apertura y cierre (N·m); disponible aire y resorte (N·m).'),
    f('margin','Factor mínimo de servicio','',1.2,1)
  ],'Compara en cada punto par disponible frente a requerido × factor. Informa el margen más desfavorable de ambas carreras.',
  v=>{check(v.a,5,r=>nn(r)&&r[0]<=180,'Usa ángulo y pares no negativos.');A(v.a.length>=2&&new Set(v.a.map(r=>r[0])).size===v.a.length,'Usa ángulos distintos.');
    const data=v.a.map(([a,o,c,air,s])=>[a,air-o*v.margin,s-c*v.margin]).sort((a,b)=>a[0]-b[0]);
    const min=Math.min(...data.flatMap(r=>r.slice(1)));
    return table([m('Margen mínimo',min,'N·m'),m('Resultado en puntos evaluados',min>=0?'Cubre requisitos':'Margen insuficiente')],
      ['Ángulo (°)','Margen apertura (N·m)','Margen cierre (N·m)'],data);},
  'Introduce curvas de fabricante a la presión disponible y pares del fabricante de la válvula. Evalúa todos los puntos críticos de la carrera.');

  reg('air-valve-profile-screen',['air-valve-layout'],'water','Válvulas de aire · puntos altos y separación geométrica',[
    T('a','Perfil de la conducción','0;100\n180;121\n440;108\n800;131\n1200;115','Columnas: abscisa (m); cota (m). Abscisas crecientes.'),
    f('spacing','Separación máxima de revisión elegida','m',350,eps)
  ],'Detecta máximos locales y tramos que superan la distancia de revisión.',
  v=>{check(v.a,2,r=>r[0]>=0,'Usa abscisas no negativas.');
    A(v.a.length>=3&&v.a.every((r,i)=>!i||r[0]>v.a[i-1][0]),'Usa tres o más abscisas estrictamente crecientes.');
    const rows=v.a.map(([x,z],i)=>{const step=i?x-v.a[i-1][0]:0,high=i>0&&i<v.a.length-1&&z>v.a[i-1][1]&&z>v.a[i+1][1];return [x,z,high?'Punto alto':'',step,step>v.spacing?'Revisar intervalo':''];});
    return table([m('Puntos altos interiores',rows.filter(r=>r[2]).length),m('Intervalos por revisar',rows.filter(r=>r[4]).length)],
      ['Abscisa','Cota','Geometría','Distancia previa','Revisión'],rows);},
  'Cribado geométrico. Dimensiona admisión y expulsión con escenarios de llenado, vaciado y transitorios.');

  reg('clearwell-inventory-turnover',['clearwell-storage-turnover'],'water','Depósito de agua tratada · inventario y renovación',[
    f('start','Inventario al inicio','m³',250),f('capacity','Capacidad útil','m³',500,eps),
    T('a','Programa operativo','6;45;55\n6;75;45\n12;45;55','Columnas: horas; entrada (m³/h); demanda (m³/h).')
  ],'Inventario por balance de agua, limitado entre cero y capacidad. Se contabilizan por separado faltante y desborde. Renovación nominal = volumen medio/caudal servido medio.',
  v=>{A(v.start<=v.capacity,'El inventario inicial supera la capacidad.');check(v.a,3,r=>nn(r)&&r[0]>0,'Usa duraciones positivas y caudales no negativos.');
    let stock=v.start,t=0,served=0,weighted=0,short=0,overflow=0;
    const rows=v.a.map(([h,q,d])=>{
      const prior=stock,x=stock+(q-d)*h,missing=Math.max(0,-x),spill=Math.max(0,x-v.capacity);
      stock=Math.max(0,Math.min(v.capacity,x));t+=h;short+=missing;overflow+=spill;served+=d*h-missing;
      const active=q===d?h:Math.min(h,Math.abs(stock-prior)/(Math.abs(q-d)));
      weighted+=(prior+stock)*active/2+stock*(h-active);
      return [t,stock,missing,spill];
    });
    return table([m('Inventario final',stock,'m³'),m('Demanda no atendida',short,'m³'),m('Desborde',overflow,'m³'),
      m('Tiempo nominal de renovación',served?weighted/served:'Sin descarga','h')],
      ['Hora','Inventario (m³)','Faltante (m³)','Desborde (m³)'],rows);},
  'Mezcla y renovación nominales. El tiempo de retención efectivo de desinfección requiere una base independiente.');
})();
