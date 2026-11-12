/* Modelos de cribado físico para fenómenos naturales y envolventes. */
(function () {
  'use strict';
  const L=GL.lab,{register:R,f,pct,table,check,plot,nn}=GL.nova;
  const rad=Math.PI/180, g=9.80665;
  R('cylindrical-atmospheric-icing','saltwater-icing-power-line','impact','Engelamiento atmosférico · espesor y carga en cilindros',
    [f('diam','Diámetro exterior inicial','mm',28,.01),f('speed','Velocidad transversal de impacto','m/s',14),
      f('lwc','Contenido de agua líquida o aerosol','g/m³',.55),pct('capture','Eficiencia efectiva de impacto',65),
      pct('freeze','Fracción de agua captada que se congela',75),f('rho','Densidad del hielo depositado','kg/m³',750,50,1000),
      f('hours','Duración del episodio','h',4,0,168)],
    'Flujo de masa por longitud = contenido líquido × velocidad × diámetro proyectado × captura × congelación. Para una capa anular uniforme esto produce crecimiento radial constante igual al flujo por área proyectada dividido por πρhielo.',
    'Sección circular y depósito uniforme con parámetros constantes. Usa eficiencias y densidad observadas para el tipo de gota, temperatura y salinidad. La respuesta estructural depende de viento, vano y carga no uniforme.',
    v=>{
      const d=v.diam/1000, rate=v.lwc/1000*v.speed*v.capture*v.freeze/10000/(Math.PI*v.rho)*3600;
      const rows=Array.from({length:41},(_,i)=>{
        const t=v.hours*i/40, ice=t*rate, outer=d+2*ice;
        const load=Math.PI*(d+ice)*ice*v.rho;
        return [t,ice*1000,outer*1000,load];
      });
      const [,ice,outer,load]=rows.at(-1);
      return {metrics:[['Espesor radial de hielo',ice,'mm'],['Diámetro exterior final',outer,'mm'],
        ['Masa adicional por longitud',load,'kg/m'],['Peso adicional por longitud',load*g,'N/m']],
        headers:['Tiempo (h)','Espesor (mm)','Diámetro (mm)','Masa de hielo (kg/m)'],rows,
        series:[plot('Espesor',rows,0,1)],xLabel:'Tiempo (h)',yLabel:'mm'};
    });

  R('avalanche-alpha-beta-profile','snow-avalanche-runout-alpha-beta','impact','Aludes · alcance α–β sobre perfil topográfico',
    [f('beta','Ángulo β desde la salida hasta el punto de referencia','°',29,10,55),
      f('uncertainty','Amplitud de sensibilidad del ángulo α','°',2.3,0,15),
      table('profile','Perfil longitudinal desde la zona de salida',['Distancia horizontal (m)','Elevación (m)'],
        '0;2580\n250;2400\n500;2180\n850;1980\n1150;1930\n1500;1910\n1850;1880\n2300;1850',
        'La primera fila es la zona de salida, en x = 0. Continúa hasta cubrir la zona potencial de depósito.')],
    'Lied–Bakkehøi: α = 0,96β − 1,4°. El alcance es el cruce final del terreno con la recta de ángulo α que parte de la zona de salida. Se exploran ángulos α ± sensibilidad.',
    'La regresión fue calibrada en un conjunto de trayectorias. Determina β según el método de la referencia. El intervalo expresa sensibilidad geométrica, sin asignar períodos de retorno ni límites de seguridad.',
    v=>{
      check(v.profile,2,([x])=>x>=0,'Usa distancias no negativas y elevaciones válidas.');
      L.assert(v.profile.length>=3&&v.profile[0][0]===0&&v.profile.every((r,i)=>!i||r[0]>v.profile[i-1][0]),
        'El perfil empieza en 0 y debe tener al menos tres distancias estrictamente crecientes.');
      const alpha=.96*v.beta-1.4;
      L.assert(alpha-v.uncertainty>0,'El ángulo inferior de sensibilidad debe ser positivo.');
      const origin=v.profile[0][1];
      const ray=(a,x)=>origin-x*Math.tan(a*rad);
      function crossing(angle){
        const differences=v.profile.map(([x,z])=>z-ray(angle,x));
        if(differences.at(-1)<0)return 'Fuera del perfil';
        let cross=null;
        for(let i=1;i<differences.length;i++){
          const low=differences[i-1], high=differences[i];
          if(low<0&&high>=0){
            const [x0,x1]=[v.profile[i-1][0],v.profile[i][0]];
            cross=x0+(x1-x0)*(-low)/(high-low);
          }
        }
        return cross??'Sin cruce';
      }
      const rows=v.profile.map(([x,z])=>[x,z,ray(alpha,x),ray(alpha-v.uncertainty,x),ray(alpha+v.uncertainty,x)]);
      return {metrics:[['Alcance horizontal central',crossing(alpha),'m'],['Ángulo α estimado',alpha,'°'],
        ['Alcance con α inferior',crossing(alpha-v.uncertainty),'m'],['Alcance con α superior',crossing(alpha+v.uncertainty),'m']],
        headers:['Distancia (m)','Terreno (m)','Recta central (m)','Recta α inferior (m)','Recta α superior (m)'],rows,
        series:[plot('Terreno',rows,0,1),plot('α central',rows,0,2),plot('α inferior',rows,0,3),plot('α superior',rows,0,4)],
        xLabel:'Distancia horizontal (m)',yLabel:'Elevación (m)'};
    },[['Lied y Toppe · alcance y modelos de terreno','https://www.cambridge.org/core/services/aop-cambridge-core/content/view/49A677E49F754EAA25899960C8E6D8A9/S0260305500007825a.pdf']]);

  R('tsunami-solitary-wave-runup','tsunami-runup-height','impact','Tsunami idealizado · ascenso de onda solitaria en playa plana',
    [f('h','Altura de onda al pie de playa','m',.55,.0001,100),
      f('depth','Profundidad al pie de playa','m',25,.001,5000),
      f('slope','Pendiente de playa vertical / horizontal','',.06,.005,.5)],
    'Synolakis para una onda solitaria no rompiente: R/d = 2,831 × (H/d)^(5/4) / √pendiente. Se verifica el criterio de rotura al ascenso y se informa la proyección sobre la playa plana.',
    'Experimento idealizado para una playa de pendiente uniforme y onda solitaria. Magnitud sísmica, batimetría, marea e inundación real requieren simulación de propagación y topografía.',
    v=>{
      const ratio=v.h/v.depth, criterion=.8183*v.slope**(10/9);
      const valid=ratio<=criterion;
      const runup=valid?v.depth*2.831*ratio**1.25/Math.sqrt(v.slope):null;
      return {metrics:[['Ascenso vertical idealizado',runup??'Fuera del dominio de no rotura','m'],
        ['Proyección horizontal sobre la pendiente',runup===null?'Fuera del dominio':runup/v.slope,'m'],
        ['Relación altura/profundidad',ratio,''],['Umbral de no rotura al ascenso',criterion,'']]};
    },[['Synolakis (1987) · The runup of solitary waves','https://doi.org/10.1017/S002211208700329X']]);

  R('tornado-debris-force-screen','tornado-debris-launch-ef-rating','impact','Tornados · carga aerodinámica y energía de escombros',
    [f('wind','Velocidad relativa de la ráfaga','m/s',50,0,150),
      f('mass','Masa del objeto','kg',2.4,.000001),f('area','Área proyectada','m²',.14,.000001),
      f('rho','Densidad del aire','kg/m³',1.2,.1,2),f('drag','Coeficiente de arrastre','',1.15,.001,5),
      f('lift','Coeficiente vertical de sustentación','',.55,0,5),
      f('impact','Velocidad de impacto del escenario','m/s',25,0,200)],
    'Carga aerodinámica = ½ρ C A U². Umbral ideal de levantamiento cuando la sustentación iguala mg. Velocidad terminal de caída cuando arrastre y peso se equilibran. Energía de impacto = ½m v².',
    'Cribado para un cuerpo libre con área y coeficientes fijos. El levantamiento depende del anclaje y la orientación. La escala EF clasifica daños observados; las fuerzas calculadas corresponden a la velocidad ingresada.',
    v=>{
      const dynamic=.5*v.rho*v.wind**2*v.area, weight=v.mass*g;
      const lift=v.lift>0?Math.sqrt(2*weight/(v.rho*v.lift*v.area)):null;
      return {metrics:[['Fuerza de arrastre',dynamic*v.drag,'N'],['Fuerza vertical idealizada',dynamic*v.lift,'N'],
        ['Umbral de levantamiento de objeto libre',lift??'Sin sustentación','m/s'],
        ['Velocidad terminal idealizada de caída',Math.sqrt(2*weight/(v.rho*v.drag*v.area)),'m/s'],
        ['Energía de impacto',.5*v.mass*v.impact**2,'J']]};
    },[['NWS · escala Enhanced Fujita','https://www.weather.gov/tae/ef_scale']]);

  R('facade-wind-driven-rain','wind-driven-rain-facade','hydraulics','Lluvia batiente · exposición y absorción en fachada',
    [f('azimuth','Azimut exterior de la fachada desde norte','°',270,0,360),
      f('factor','Coeficiente local lluvia–viento','s/m',.08,0,5),
      pct('absorb','Fracción absorbida por la superficie',35),
      table('events','Intervalos de viento y lluvia',['Duración (h)','Lluvia horizontal (mm/h)','Viento (m/s)','Dirección desde (°)'],
        '1;5;4;240\n0.75;14;9;270\n0.5;25;12;280\n1.25;7;5;320','Dirección meteorológica desde la que sopla el viento, grados desde norte.')],
    'Flujo sobre fachada = lluvia horizontal × coeficiente local × componente positiva del viento normal. Se integra por intervalo y se aplica la absorción declarada.',
    'Modelo lineal con coeficiente local calibrado para altura y exposición. Efectos de bordes, salpicadura, distribución de gotas y transporte en materiales requieren un modelo más detallado.',
    v=>{
      check(v.events,4,r=>nn(r)&&r[0]>0&&r[3]<=360,'Usa duraciones positivas, lluvia y viento no negativos y dirección entre 0 y 360°.');
      const rows=v.events.map(([t,r,u,d],i)=>{
        const normal=u*Math.max(0,Math.cos((d-v.azimuth)*rad)), water=r*t*normal*v.factor;
        return [i+1,normal,r*t,water,water*v.absorb/100];
      });
      const [horizontal,wall,absorb]=[2,3,4].map(i=>L.sum(rows.map(r=>r[i])));
      return {metrics:[['Lluvia incidente en fachada',wall,'L/m²'],['Agua absorbida estimada',absorb,'L/m²'],
        ['Lluvia horizontal acumulada',horizontal,'mm'],['Agua incidente no absorbida',wall-absorb,'L/m²']],
        headers:['Intervalo','Viento normal (m/s)','Lluvia horizontal (mm)','Incidente (L/m²)','Absorbida (L/m²)'],rows};
    });
})();
