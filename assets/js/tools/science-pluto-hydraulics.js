/* Hidráulica y geometría aplicadas a sistemas de agua. */
(function () {
  'use strict';
  const L=GL.lab,{reg,metric:m,metrics,field:f,pct,rows,g,eps}=GL.pluto;
  const {assert:A,table:T,select}=L;
  const epanet=[['EPA · manual EPANET 2.2','https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P10113EM.txt']];
  const flumes=[['USBR · medición de caudal con canaletas','https://www.usbr.gov/tsc/techreferences/mands/wmm/chap08_10.html']];
  const area=d=>Math.PI*d*d/4;
  const velocity=(q,d)=>q/area(d);
  const radians=x=>x*Math.PI/180;
  function segment(d,h) {
    const theta=2*Math.acos(Math.max(-1,Math.min(1,1-2*h/d)));
    return {area:d*d*(theta-Math.sin(theta))/8,perimeter:d*theta/2,top:2*Math.sqrt(Math.max(0,h*(d-h)))};
  }

  reg('triangle-geometry',['triangle'],'spatial','Triángulos · lados, ángulos y área',[
    select('mode','Datos conocidos',[['sss','Tres lados (LLL)'],['sas','Dos lados y ángulo comprendido (LAL)'],
      ['asa','Dos ángulos y lado opuesto a A (AAL)']],'sss'),
    f('a','Lado a','m',3,eps),f('b','Lado b','m',4,eps),f('c','Lado c','m',5,eps),
    f('alpha','Ángulo A (opuesto a a)','°',36.87,.001,179.999),f('beta','Ángulo B (opuesto a b)','°',53.13,.001,179.999),
    f('gamma','Ángulo comprendido C (modo LAL)','°',90,.001,179.999)
  ],'Ley de cosenos para LLL/LAL y ley de senos para AAL. Área = ab sen(C)/2.',
  v=>{
    let {a,b,c}=v,Adeg=v.alpha,Bdeg=v.beta,Cdeg=v.gamma;
    if(v.mode==='asa'){
      Cdeg=180-Adeg-Bdeg;A(Cdeg>0,'La suma de los ángulos conocidos debe ser menor que 180°.');
      b=a*Math.sin(radians(Bdeg))/Math.sin(radians(Adeg));
      c=a*Math.sin(radians(Cdeg))/Math.sin(radians(Adeg));
    }else{
      if(v.mode==='sas')c=Math.hypot(a-b,2*Math.sqrt(a*b)*Math.sin(radians(Cdeg/2)));
      A(a+b>c&&a+c>b&&b+c>a,'Los lados no cumplen la desigualdad triangular.');
      const angle=(op,x,y)=>Math.acos(Math.max(-1,Math.min(1,(x*x+y*y-op*op)/(2*x*y))))*180/Math.PI;
      Adeg=angle(a,b,c);Bdeg=angle(b,a,c);Cdeg=v.mode==='sas'?v.gamma:angle(c,a,b);
    }
    return metrics(m('Área',a*b*Math.sin(radians(Cdeg))/2,'m²'),m('Perímetro',a+b+c,'m'),
      m('Lado a',a,'m'),m('Lado b',b,'m'),m('Lado c',c,'m'),m('Ángulo A',Adeg,'°'),m('Ángulo B',Bdeg,'°'),m('Ángulo C',Cdeg,'°'));
  },'Geometría plana. Los ángulos se nombran por su lado opuesto.');

  reg('tank-geometries',['cylinder','cone','cube','circle','cylindricaltk'],'water','Geometría de tanques · volumen útil y nivel',[
    select('shape','Forma',[['horizontal','Cilindro horizontal'],['vertical','Cilindro vertical'],['cone','Cono con vértice inferior'],['box','Tanque rectangular'],['circle','Círculo plano']],'horizontal'),
    f('d','Diámetro (formas circulares)','m',2,eps),f('length','Longitud (cilindro horizontal o rectángulo)','m',5,eps),
    f('width','Ancho del rectángulo','m',2,eps),f('height','Altura total vertical','m',3,eps),f('h','Nivel de líquido','m',1.1)
  ],'Cilindro horizontal: área del segmento circular × longitud. Cono: fracción (h/H)³. Cilindro vertical y caja: sección × nivel.',
  v=>{
    if(v.shape==='circle')return metrics(m('Área circular',area(v.d),'m²'),m('Perímetro',Math.PI*v.d,'m'),m('Radio',v.d/2,'m'));
    const horizontal=v.shape==='horizontal',height=horizontal?v.d:v.height;
    A(v.h<=height,'El nivel supera la altura interior del tanque.');
    const base=v.shape==='box'?v.length*v.width:area(v.d);
    const total=horizontal?base*v.length:base*height/(v.shape==='cone'?3:1);
    const volume=horizontal?segment(v.d,v.h).area*v.length:total*(v.h/height)**(v.shape==='cone'?3:1);
    return metrics(m('Volumen a este nivel',volume,'m³'),m('Capacidad geométrica',total,'m³'),m('Llenado',100*volume/total,'%'),m('Volumen disponible',total-volume,'m³'));
  },'Dimensiones internas. El cálculo geométrico supone tanque nivelado y fondo de la forma elegida.');

  reg('equalization-storage',['buffertank'],'water','Tanque de ecualización · curva acumulada',[
    T('a','Perfil de entrada y salida','4;35;50\n5;62;50\n6;75;50\n9;33.3333333333333;50','Columnas: duración (h); entrada (m³/h); salida (m³/h). Filas consecutivas.'),
    pct('reserve','Reserva adicional sobre volumen útil',15)
  ],'Se acumula ΔV=(Qentrada−Qsalida)·Δt. Volumen útil = máximo − mínimo de la curva acumulada, incluyendo el arranque.',
  v=>{
    rows(v.a,3,([t,a,b])=>t>0&&a>=0&&b>=0,'Usa duraciones positivas y caudales no negativos.');
    let t=0,sum=0,lo=0,hi=0;
    const data=v.a.map(([dt,a,b])=>{t+=dt;sum+=(a-b)*dt;lo=Math.min(lo,sum);hi=Math.max(hi,sum);return [t,a,b,sum];});
    return {metrics:[m('Volumen útil mínimo',hi-lo,'m³'),m('Volumen con reserva',(hi-lo)*(1+v.reserve/100),'m³'),
      m('Volumen mínimo inicial',-lo,'m³'),m('Balance al fin del perfil',sum,'m³')],
      headers:['Hora acumulada','Entrada (m³/h)','Salida (m³/h)','Balance acumulado (m³)'],rows:data,
      series:[{name:'Balance',data:[[0,0],...data.map(r=>[r[0],r[3]])]}],xLabel:'Tiempo (h)',yLabel:'Balance (m³)',
      message:Math.abs(sum)>1e-6?'El perfil termina con balance distinto de cero. Si se repite, ajusta la descarga para evitar acumulación o vaciado.':''};
  },'Entradas y salidas constantes en cada intervalo. El volumen informado cubre el perfil ingresado.');

  reg('municipal-design-flow',['municipal'],'water','Demanda municipal · dotación y caudal de diseño',[
    f('n','Población','habitantes',24000,1),f('dot','Dotación neta','L/(hab·día)',150),
    pct('loss','Pérdidas sobre agua producida',20,0,99.9),f('peak','Factor de punta respecto a demanda media','',1.8,1)
  ],'Demanda neta = población × dotación. Producción media = demanda neta/(1−pérdidas). Punta = media × factor.',
  v=>{A(Number.isInteger(v.n),'Usa una población entera.');const net=v.n*v.dot/1000,prod=net/(1-v.loss/100);
    return metrics(m('Demanda neta',net,'m³/día'),m('Producción media',prod,'m³/día'),m('Caudal medio',prod/86.4,'L/s'),
      m('Caudal punta',v.peak*prod/86.4,'L/s'));},
  'Usa la dotación y factores de punta del estudio o norma aplicable. El modelo supone un porcentaje de pérdidas constante.');

  reg('rain-harvest-volume',['rain'],'water','Precipitación · volumen y captación aprovechable',[
    f('a','Área horizontal','m²',1500),f('p','Precipitación del evento','mm',24),pct('c','Fracción de escorrentía captada',80),
    f('initial','Pérdida inicial antes de la captación','mm',1)
  ],'Volumen precipitado = área × precipitación/1000. Volumen captado = área × máx(P−pérdida inicial,0) × fracción/1000.',
  v=>metrics(m('Volumen precipitado',v.a*v.p/1000,'m³'),m('Volumen captado',v.a*Math.max(0,v.p-v.initial)*v.c/100000,'m³')),
  'El volumen corresponde al evento completo. Usa el método racional para estimar caudal pico.');

  reg('pipe-darcy-loss',['headloss','reynolds'],'water','Tuberías · Reynolds y pérdida de carga Darcy–Weisbach',[
    f('q','Caudal','m³/h',60),f('d','Diámetro interior','mm',150,eps),f('len','Longitud','m',220),
    f('rough','Rugosidad absoluta','mm',.045),f('nu','Viscosidad cinemática','cSt',1,eps),
    f('local','Suma de coeficientes de pérdidas locales ΣK','',3),f('rho','Densidad','kg/m³',998,eps)
  ],'Re=vD/ν. f=64/Re en régimen laminar y Swamee–Jain en turbulento; interpolación lineal de f entre Re=2000 y 4000. hf=(fL/D+ΣK)v²/(2g).',
  v=>{
    const d=v.d/1000,k=v.rough/v.d,u=velocity(v.q/3600,d),re=u*d/(v.nu*1e-6);
    A(k<=.05,'Rugosidad relativa superior a 0,05. Revisa diámetro y rugosidad.');
    const turbulent=n=>.25/Math.log10(k/3.7+5.74/n**.9)**2;
    const f=re===0?0:re<=2000?64/re:re>=4000?turbulent(re):.032+(turbulent(4000)-.032)*(re-2000)/2000;
    const h=u*u/(2*g),friction=f*v.len/d*h,minor=v.local*h;
    return metrics(m('Pérdida de carga total',friction+minor,'m'),m('Pérdida por fricción',friction,'m'),
      m('Pérdidas locales',minor,'m'),m('Caída de presión equivalente',v.rho*g*(friction+minor)/1000,'kPa'),
      m('Velocidad media',u,'m/s'),m('Reynolds',re),m('Factor Darcy',f));
  },'Flujo monofásico, tubería llena y sección constante. La transición entre regímenes es aproximada.',epanet);

  reg('pump-duty-power',['pump'],'energy','Bombas · altura, potencia y energía',[
    f('q','Caudal','m³/h',120),f('static','Desnivel y presión estática equivalentes','m',18,-1000),
    f('loss','Pérdida dinámica total','m',12),f('rho','Densidad','kg/m³',998,eps),
    pct('pump','Eficiencia de bomba',75,.01),pct('motor','Eficiencia de motor',92,.01),
    f('hours','Horas anuales de operación','h/año',4000,0,8784)
  ],'Altura total = componente estático + pérdidas. Potencia hidráulica = ρgQH. Potencia eléctrica = potencia hidráulica/(ηbombaηmotor).',
  v=>{const h=v.static+v.loss;A(h>=0,'Altura total negativa: el escenario corresponde a otro modo de operación.');
    const power=v.rho*g*v.q/3600*h/1000,input=power/(v.pump*v.motor/10000);
    return metrics(m('Altura total',h,'m'),m('Potencia hidráulica',power,'kW'),m('Potencia al eje',power/(v.pump/100),'kW'),
      m('Potencia eléctrica',input,'kW'),m('Energía anual',input*v.hours,'kWh/año'));},
  'Usa eficiencias del punto de operación. Para elegir equipo comprueba la curva de bomba y el NPSH disponible.');

  reg('blower-duty-power',['blower'],'energy','Sopladores · compresión y potencia eléctrica',[
    f('q','Caudal normalizado a la densidad indicada','Nm³/h',750),f('rho','Densidad en condiciones normales','kg/Nm³',1.293,eps),
    f('pin','Presión absoluta de succión','bar(a)',1.013,eps),f('pout','Presión absoluta de descarga','bar(a)',1.55,eps),
    f('t','Temperatura de succión','°C',25,-100,150),f('gamma','Relación de calores específicos','',1.4,1.01,2),
    pct('comp','Eficiencia isentrópica',70,.01),pct('motor','Eficiencia eléctrica',92,.01)
  ],'Gas ideal (aire, R=287,05 J/kg/K). Potencia isentrópica = ṁRT·γ/(γ−1)·[(P₂/P₁)^((γ−1)/γ)−1].',
  v=>{A(v.pout>=v.pin,'La descarga debe ser igual o mayor que la succión.');
    const md=v.q*v.rho/3600,temp=v.t+273.15,k=(v.gamma-1)/v.gamma,ratio=v.pout/v.pin;
    const p=md*287.05*temp*Math.expm1(k*Math.log(ratio))/k/1000;
    return metrics(m('Potencia eléctrica',p/(v.comp*v.motor/10000),'kW'),m('Potencia isentrópica',p,'kW'),
      m('Relación de presiones',ratio),m('Caudal másico',md,'kg/s'));},
  'Modelo de una etapa y aire ideal. Introduce presiones absolutas y condiciones de referencia coherentes con Nm³.');

  reg('open-channel-flow',['openc'],'water','Canales abiertos · Manning y número de Froude',[
    select('shape','Sección',[['trapezoid','Trapecial o rectangular'],['circle','Tubería circular parcialmente llena']],'trapezoid'),
    f('b','Ancho de fondo (trapecio)','m',1.2),f('z','Talud lateral horizontal/vertical','',1),
    f('d','Diámetro de tubería (circular)','m',1.2,eps),f('h','Tirante de agua','m',.5,eps),
    f('s','Pendiente de energía','m/m',.001,0,1),f('n','Coeficiente de Manning','',.014,eps),
    f('nu','Viscosidad cinemática','cSt',1,eps)
  ],'Q=(A/n)Rʰ^(2/3)√S, con Rʰ=A/perímetro mojado. Fr=v/√(gA/T); Re=4vRʰ/ν.',
  v=>{
    let a,perimeter,top;
    if(v.shape==='circle'){A(v.h<v.d,'En canal circular el tirante debe ser menor que el diámetro.');({area:a,perimeter,top}=segment(v.d,v.h));}
    else {a=v.h*(v.b+v.z*v.h);perimeter=v.b+2*v.h*Math.hypot(1,v.z);top=v.b+2*v.z*v.h;}
    A(a>0&&top>0,'La sección debe tener área y ancho superficial positivos.');
    const rh=a/perimeter,u=rh**(2/3)*Math.sqrt(v.s)/v.n;
    return metrics(m('Caudal',a*u,'m³/s'),m('Velocidad media',u,'m/s'),m('Radio hidráulico',rh,'m'),
      m('Área mojada',a,'m²'),m('Perímetro mojado',perimeter,'m'),m('Froude',u/Math.sqrt(g*a/top)),
      m('Reynolds hidráulico',4*u*rh/(v.nu*1e-6)),m('Energía específica',v.h+u*u/(2*g),'m'));
  },'Flujo uniforme a superficie libre. El talud cero representa una sección rectangular.');

  reg('orifice-flow',['orifice'],'water','Placa de orificio · caudal por diferencial de presión',[
    f('pipe','Diámetro interior de la tubería','mm',150,eps),f('hole','Diámetro del orificio','mm',80,eps),
    f('dp','Diferencial de presión entre tomas','kPa',15),f('rho','Densidad','kg/m³',998,eps),
    f('cd','Coeficiente de descarga calibrado','',.61,eps,1)
  ],'β=d/D. Q=C_d·(πd²/4)·√[2ΔP/(ρ(1−β⁴))].',
  v=>{const beta=v.hole/v.pipe;A(beta<1,'El orificio debe ser menor que el diámetro interior.');
    const q=v.cd*area(v.hole/1000)*Math.sqrt(2000*v.dp/(v.rho*(1-beta**4)));
    return metrics(m('Caudal',q*3600,'m³/h'),m('Caudal',q*1000,'L/s'),m('Relación β',beta));},
  'Fluido incompresible, tubería llena y coeficiente correspondiente a la geometría y tomas de presión. Para metrología usa la calibración aplicable.');

  reg('flume-rating-curve',['parshall','rectflume'],'water','Canaletas Parshall y Venturi · curva de aforo',[
    f('ha','Altura de control aguas arriba','m',.25,eps),f('hb','Altura aguas abajo en el punto de calibración','m',.10),
    f('c','Coeficiente calibrado C para H en m y Q en m³/s','',.69,eps),
    f('n','Exponente calibrado n','',1.55,.1,5),f('lo','Límite inferior de la calibración','m',.07),
    f('hi','Límite superior de la calibración','m',.6,eps),
    pct('sub','Submergencia máxima para flujo libre',70,1,100)
  ],'Curva de aforo en flujo libre Q=C·Haⁿ. Se verifica el intervalo calibrado y la relación Hb/Ha.',
  v=>{A(v.lo<v.hi&&v.ha>=v.lo&&v.ha<=v.hi,'La lectura está fuera del intervalo calibrado.');
    const sub=100*v.hb/v.ha;A(sub<=v.sub,'El flujo está sumergido para la calibración indicada.');
    const q=v.c*v.ha**v.n;
    return metrics(m('Caudal',q,'m³/s'),m('Caudal',q*1000,'L/s'),m('Submergencia',sub,'%'));},
  'Ingresa la curva certificada y sus puntos de medición. Los parámetros de ejemplo son ilustrativos.',flumes);

  reg('mixing-velocity-gradient',['velg'],'water','Mezcla rápida y floculación · gradiente G y G·t',[
    f('volume','Volumen útil','m³',15,eps),f('power','Potencia disipada en el líquido','kW',.4),
    f('mu','Viscosidad dinámica','mPa·s',1,eps),f('t','Tiempo efectivo de mezcla','min',12)
  ],'G=√(P/(μV)). G·t integra el gradiente en el tiempo para un G constante.',
  v=>{const gradient=Math.sqrt(v.power*1e6/(v.mu*v.volume));
    return metrics(m('Gradiente de velocidad',gradient,'s⁻¹'),m('Número G·t',gradient*v.t*60),m('Densidad de potencia',1000*v.power/v.volume,'W/m³'));},
  'Introduce potencia disipada, después de pérdidas del motor y transmisión. Ajusta parámetros con pruebas del proceso.');
})();
