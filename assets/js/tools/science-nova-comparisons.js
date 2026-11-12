/* Comparación de procesos, contaminantes y escenarios calibrados. */
(function () {
  'use strict';
  const L=GL.lab,{register:R,f,pct,table,check,plot,nn}=GL.nova;
  R('membrane-mwco-curve','membrane-filtration-mwco','membranes','Membranas · curva de rechazo y corte molecular',
    [f('mw','Masa molar del marcador','Da',2100,.01),f('target','Rechazo objetivo','%',90,.01,99.99),
      f('area','Área de membrana','m²',50,.001),f('flux','Flujo limpio a presión de diseño','L/m²·h',45),
      f('tmp','Presión transmembrana','kPa',150,.001),pct('retained','Flujo remanente por ensuciamiento',72),
      table('markers','Curva de ensayo',['Masa molar (Da)','Rechazo (%)'],
        '500;12\n1000;33\n2000;62\n4000;88\n8000;98','Una fila por marcador del mismo tipo químico.')],
    'Interpola rechazo frente a log(masa) e invierte la misma curva para obtener el corte al rechazo objetivo. Producción = área × flujo limpio × fracción remanente.',
    'Corte específico de las condiciones de ensayo. En NF/RO importan también la carga y la matriz. En MF se suele especificar retención o tamaño de poro.',
    v=>{
      check(v.markers,2,([mw,r])=>mw>0&&r>=0&&r<=100,'Usa masas positivas y rechazos entre 0 y 100 %.');
      const rows=v.markers.slice().sort((a,b)=>a[0]-b[0]);
      L.assert(rows.length>=2&&rows.every((r,i)=>!i||r[0]>rows[i-1][0]&&r[1]>rows[i-1][1]),
        'La curva requiere al menos dos masas distintas con rechazo estrictamente creciente.');
      const transformed=rows.map(([mw,r])=>[Math.log(mw),r]);
      function interpolate(x,axis){
        const i=transformed.findIndex((r,j)=>j>0&&x>=transformed[j-1][axis]&&x<=r[axis]);
        if(i<0)return null;
        const a=transformed[i-1], b=transformed[i], other=1-axis;
        return a[other]+(b[other]-a[other])*(x-a[axis])/(b[axis]-a[axis]);
      }
      const rejection=interpolate(Math.log(v.mw),0), cutoff=interpolate(v.target,1);
      const flux=v.flux*v.retained/100;
      return {metrics:[['Corte al rechazo indicado',cutoff===null?'Fuera de la curva':Math.exp(cutoff),'Da'],
        ['Rechazo del marcador',rejection??'Fuera de la curva','%'],['Producción',v.area*flux/1000,'m³/h'],
        ['Flujo en operación',flux,'L/m²·h'],['Permeabilidad aparente',100*flux/v.tmp,'L/m²·h·bar']],
        headers:['Marcador (Da)','Rechazo (%)'],rows,series:[plot('Rechazo',rows,0,1)],xLabel:'Da',yLabel:'Rechazo (%)'};
    },[['EPA · filtración con membranas','https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=901V0500.TXT']]);

  R('seawater-desalination-technology','seawater-desalination','membranes','Desalinización marina · balance y energía de RO, MSF y MED',
    [f('product','Producción de agua','m³/d',2500,.01),f('salt','Salinidad afluente equivalente a NaCl','g/L',35,0,150),
      f('temp','Temperatura de alimentación','°C',25,0,60),f('ions','Factor osmótico efectivo','',1.85,.01,3),
      table('tech','Alternativas en orden RO, MSF y MED',
        ['Recuperación (%)','Sal producto (g/L)','Electricidad (kWh/m³)','Calor (kWh térm./m³)'],
        '45;.35;3.5;0\n25;.02;3;72\n33;.03;1.9;45','Usa energía medida o de diseño sobre la misma frontera de planta.')],
    'Balance de agua y sales por proceso. Presión osmótica de alimentación aproximada con la ecuación de Van\u0027t Hoff para NaCl equivalente. Los consumos específicos se multiplican por la producción.',
    'El calor y la electricidad se reportan por separado. El balance supone volumen aditivo y salinidad comparable. La presión de operación y la salmuera real requieren datos del proceso.',
    v=>{
      check(v.tech,4,([r,s,e,h])=>r>0&&r<100&&s>=0&&s<=v.salt&&e>=0&&h>=0,
        'Usa recuperaciones entre 0 y 100 %, salinidad de producto válida y consumos no negativos.');
      L.assert(v.tech.length===3,'Ingresa tres filas en orden RO, MSF y MED.');
      const rows=v.tech.map(([recovery,salt,e,h],i)=>{
        const feed=v.product/(recovery/100), brine=feed-v.product;
        return [['RO','MSF','MED'][i],recovery,feed,brine,(feed*v.salt-v.product*salt)/brine,e*v.product,h*v.product];
      });
      const osmotic=v.ions*v.salt/58.4428*.08314462618*(v.temp+273.15);
      return {metrics:[['Presión osmótica aproximada de alimentación',osmotic,'bar'],['Producción común',v.product,'m³/d']],
        headers:['Proceso','Recuperación (%)','Alimentación (m³/d)','Salmuera (m³/d)','Salinidad de salmuera (g/L)',
          'Electricidad (kWh/d)','Calor (kWh térm./d)'],rows};
    });

  R('ozone-depleting-stock-scenario','ozone-depletion-cfc-ods','air','Sustancias agotadoras de ozono · ODP, GEI y carga atmosférica',
    [f('horizon','Horizonte de emisión constante','años',25,0,200),
      table('substances','Inventario por sustancia',['Emisión (t/año)','ODP','GWP','Vida atmosférica (años)','Carga inicial (t)'],
        '15;1;5560;52;160\n50;.055;1960;11.9;100','Factores ilustrativos. Documenta ODP, GWP y vida atmosférica de cada sustancia.')],
    'Impactos equivalentes = masa anual × factor ODP o GWP. Carga atmosférica = inicial e^(−t/τ) + emisión × τ × [1 − e^(−t/τ)].',
    'Balance de masa simplificado. La columna de ozono y la recuperación estratosférica requieren transporte, química y escenarios de emisiones.',
    v=>{
      check(v.substances,5,r=>nn(r)&&r[3]>.00001,'Usa factores y carga no negativos y vida atmosférica positiva.');
      const rows=v.substances.map(([e,o,g,tau,b],i)=>{
        const decay=-Math.expm1(-v.horizon/tau);
        return [i+1,e*o,e*g,b*(1-decay)+e*tau*decay,e*tau];
      });
      return {metrics:[['Potencial de agotamiento anual',L.sum(rows.map(r=>r[1])),'t CFC-11-eq/año'],
        ['Emisiones climáticas ponderadas',L.sum(rows.map(r=>r[2])),'t CO₂e/año'],
        ['Carga atmosférica al final',L.sum(rows.map(r=>r[3])),'t']],
        headers:['Sustancia','t CFC-11-eq/año','t CO₂e/año','Carga final (t)','Equilibrio teórico (t)'],rows};
    },[['EPA · sustancias que agotan el ozono','https://www.epa.gov/ozone-layer-protection/ozone-depleting-substances']]);

  R('urban-heat-island-scenario','urban-heat-island-uhi','climate','Isla de calor urbana · sensibilidad a cobertura y viento',
    [f('baseline','Isla de calor de referencia observada','°C',3.8,-20,30),
      table('scenarios','Variables y coeficientes locales',['Valor inicial','Valor del escenario','Cambio de ΔT por unidad'],
        '68;60;.04\n12;22;-.05\n2;2.8;-.32',
        'Filas en orden: superficie impermeable (%), vegetación (%), viento (m/s). Usa coeficientes ajustados con datos locales.')],
    'ΔT del escenario = ΔT observado + Σ coeficiente local × (valor del escenario − valor inicial).',
    'Explora sensibilidad cerca de una línea base local. Las superficies son clases excluyentes. Verifica rango de calibración y condiciones comparables.',
    v=>{
      L.assert(v.scenarios.length===3,'Usa tres filas en orden: impermeable, vegetación y viento.');
      check(v.scenarios,3,r=>r[0]>=0&&r[1]>=0&&Math.abs(r[2])<=100,'Revisa valores de cobertura, viento y coeficientes.');
      const [impervious,green,wind]=v.scenarios;
      L.assert(impervious[0]+green[0]<=100&&impervious[1]+green[1]<=100&&wind[0]<=100&&wind[1]<=100,
        'Las coberturas suman como máximo 100 % por escenario y el viento debe estar entre 0 y 100 m/s.');
      const rows=v.scenarios.map(([a,b,c],i)=>[['Impermeable (%)','Vegetación (%)','Viento (m/s)'][i],a,b,c,(b-a)*c]);
      const delta=L.sum(rows.map(r=>r[4]));
      return {metrics:[['Isla de calor del escenario',v.baseline+delta,'°C'],['Cambio relativo a la línea base',delta,'°C']],
        headers:['Variable','Inicial','Escenario','Coeficiente local','Aporte al cambio (°C)'],rows};
    });
})();
