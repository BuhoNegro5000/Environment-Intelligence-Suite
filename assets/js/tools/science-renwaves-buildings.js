/* Balance térmico y consumo de edificios para evaluación preliminar. */
(function () {
  'use strict';
  const L=GL.lab, f=L.f, sum=L.sum;
  const eui=['ENERGY STAR · intensidad de uso energético','https://www.energystar.gov/buildings/benchmark/understand-metrics/what-eui'];
  function register(d){L.register({suite:'energy',tags:['Edificios','Energía','Cálculo local'],...d});}

  const sampleDay=Array.from({length:24},(_,h)=>{
    const solar=Math.round(650*Math.max(0,Math.sin(Math.PI*(h-6)/12)));
    const outdoor=Math.round((29+6*Math.cos(Math.PI*(h-15)/12))*10)/10;
    return [h,outdoor,solar,5].join(';');
  }).join('\n');
  register({
    id:'building-hvac-loads',title:'HVAC · cargas térmicas de diseño y perfil horario',
    intro:'Separa pérdidas de invierno y ganancias de verano. Usa condiciones de diseño y, si tienes datos horarios, sustituye el día de ejemplo.',
    fields:[
      f('floor','Área acondicionada','m²',120,.01,1e7),f('volume','Volumen acondicionado','m³',324,.01,1e8),
      f('heatSet','Consigna de calefacción','°C',20,0,50),f('coolSet','Consigna de refrigeración','°C',25,0,50),
      f('winter','Temperatura exterior de diseño en invierno','°C',-3,-100,70),
      f('summer','Temperatura exterior de diseño en verano','°C',35,-100,70),
      f('ground','Temperatura del suelo de referencia','°C',17,-40,60),
      {...L.table('envelope','Componentes de la envolvente','1;108;0.55\n1;120;0.30\n2;120;0.40\n3;22;1.8',
        'Tipo 1 = muro opaco o techo al exterior. Tipo 2 = piso en contacto con el suelo. Tipo 3 = vidrio al exterior. Ingresa áreas netas sin superposición.'),
        columns:['Tipo','Área (m²)','U (W/m²·K)'],fixedColumns:true},
      f('shgc','Fracción solar transmitida por el vidrio','%',45,0,100),
      f('shading','Fracción solar incidente tras sombreado','%',70,0,100),
      f('solar','Irradiancia de diseño sobre el vidrio','W/m²',450,0,1600),
      f('people','Ocupación de diseño','personas',5,0,1e6),
      f('sensible','Ganancia sensible por persona','W/persona',75,0,2000),
      f('latent','Ganancia latente por persona','W/persona',55,0,2000),
      f('fresh','Ventilación por persona','L/s·persona',8,0,1000),
      f('ach','Infiltración','renovaciones/h',.35,0,100),
      f('gains','Iluminación y equipos','W/m²',9,0,1000),
      f('humidity','Exceso de humedad absoluta exterior de diseño','g/kg',6,0,70),
      f('margin','Margen explícito de capacidad','%',10,0,100),
      {...L.table('weather','Día horario (24 filas)',sampleDay,
        'El ejemplo es ilustrativo. Sustitúyelo por temperaturas, irradiancia sobre vidrio y diferencia de humedad absoluta exterior menos interior. Usa horas 0 a 23.'),
        columns:['Hora','Exterior (°C)','Irradiancia (W/m²)','Δ humedad (g/kg)'],fixedColumns:true}
    ],
    method:'Conducción por componente = U × área × diferencia térmica. El aire exterior suma ventilación e infiltración y aporta calor sensible (ρ × cp × caudal × ΔT) y latente (ρ × hfg × caudal × Δw). Refrigeración incluye radiación sobre vidrio, personas y equipos. La calefacción de diseño excluye ganancias para evaluar la pérdida máxima.',
    limit:'Balance estacionario de una zona y aire bien mezclado. Usa un valor de irradiancia representativo del conjunto de vidrios. El perfil horario mantiene ocupación y equipos constantes. La capacidad de refrigeración se desglosa en sensible y latente. La selección final requiere distribución, condiciones de operación y datos de fabricante.',
    refs:[['ASHRAE · Fundamentals','https://www.ashrae.org/technical-resources/ashrae-handbook']],
    calc(v){
      L.assert(v.heatSet<=v.coolSet,'La consigna de calefacción debe ser menor o igual a la de refrigeración.');
      L.assert(v.envelope.length>0&&v.envelope.every(r=>r.length===3&&[1,2,3].includes(r[0])&&r[1]>=0&&r[1]<=1e7&&r[2]>=0&&r[2]<=100),
        'Verifica tipo de envolvente (1, 2 o 3), área y transmitancia U.');
      L.assert(v.weather.length===24&&v.weather.every(([h,t,s,w,...extra],i)=>h===i&&t>=-100&&t<=70&&
        s>=0&&s<=1600&&w>=-70&&w<=70&&!extra.length),'El perfil requiere 24 filas válidas, en orden de 0 a 23.');
      const ua=[1,2,3].map(type=>sum(v.envelope.filter(r=>r[0]===type).map(([,a,u])=>a*u)));
      const glass=sum(v.envelope.filter(r=>r[0]===3).map(r=>r[1]));
      const airflow=v.volume*v.ach/3600+v.fresh*v.people/1000;
      const massFlow=1.2*airflow, airUA=1006*massFlow;
      function heating(outdoor){
        const outsideDelta=v.heatSet-outdoor;
        return [ua[0]*outsideDelta,ua[1]*(v.heatSet-v.ground),ua[2]*outsideDelta,airUA*outsideDelta];
      }
      function cooling(outdoor,sun,humidity){
        const outsideDelta=outdoor-v.coolSet;
        return [
          (ua[0]+ua[2])*outsideDelta+ua[1]*(v.ground-v.coolSet),
          glass*sun*v.shgc/100*v.shading/100,v.people*v.sensible,v.gains*v.floor,airUA*outsideDelta,
          v.people*v.latent,massFlow*2500*humidity
        ];
      }
      const positiveKW=x=>Math.max(0,x)/1000;
      const heat=heating(v.winter), cool=cooling(v.summer,v.solar,v.humidity);
      const qHeat=positiveKW(sum(heat)), qSensible=positiveKW(sum(cool.slice(0,5))), qLatent=positiveKW(sum(cool.slice(5)));
      const qCool=qSensible+qLatent, margin=1+v.margin/100;
      const hourly=v.weather.map(([h,t,s,w])=>{
        const c=cooling(t,s,w);
        return [h,t,s,w,positiveKW(sum(heating(t))),positiveKW(sum(c.slice(0,5))),positiveKW(sum(c.slice(5)))];
      });
      const rows=[
        ...['Muros opacos y techo','Piso','Vidrio','Aire exterior'].map((label,i)=>['Diseño de calefacción',label,heat[i]/1000,'','','','','','']),
        ...['Conducción de envolvente','Radiación solar','Personas · sensible','Luces y equipos','Aire exterior · sensible',
          'Personas · latente','Aire exterior · latente'].map((label,i)=>['Diseño de refrigeración',label,cool[i]/1000,'','','','','','']),
        ...hourly.map(([h,t,s,w,qh,qs,ql])=>['Hora '+h,'','',t,s,w,qh,qs,ql])
      ];
      return {metrics:[['Calefacción · carga de diseño',qHeat,'kW térmicos'],['Refrigeración · carga total de diseño',qCool,'kW térmicos'],['Refrigeración sensible',qSensible,'kW térmicos'],
        ['Refrigeración latente',qLatent,'kW térmicos'],['Capacidad de calefacción con margen',qHeat*margin,'kW térmicos'],
        ['Capacidad de refrigeración con margen',qCool*margin,'kW térmicos'],['Aire exterior total',airflow*1000,'L/s']],
        headers:['Escenario','Componente','Aporte de diseño (kW)','Exterior (°C)','Sol (W/m²)','Δ humedad (g/kg)',
          'Calefacción (kW)','Refrig. sensible (kW)','Refrig. latente (kW)'],rows,
        series:[{name:'Calefacción',data:hourly.map(r=>[r[0],r[4]])},
          {name:'Refrigeración total',data:hourly.map(r=>[r[0],r[5]+r[6]])}],
        xLabel:'Hora',yLabel:'kW térmicos'};
    }
  });

  register({
    id:'building-annual-energy',title:'Edificios · energía anual y escenario de mejora',
    fields:[
      f('floor','Área acondicionada','m²',250,.01,1e7),
      f('hdd','Grados-día de calefacción en la base del edificio','K·día/año',1250,0,30000),
      f('cdd','Grados-día de refrigeración en la base del edificio','K·día/año',430,0,30000),
      {...L.table('scenarios','Escenario actual y escenario de mejora',
        '330;2.6;3.2;1800;7000;2200\n250;3.5;4;1450;5950;1900',
        'Primera fila actual, segunda fila mejora. Incluye aire exterior en el coeficiente térmico. Las eficiencias estacionales se expresan en kWh térmicos por kWh eléctrico.'),
        columns:['Coef. térmico (W/K)','COP calef.','COP refrig.','Latente (kWh térm./año)','Otros usos (kWh/año)','ACS (kWh/año)'],fixedColumns:true}
    ],
    method:'Demanda térmica anual sensible = coeficiente térmico × grados-día × 24 / 1 000. La refrigeración incorpora la demanda latente anual declarada. El consumo eléctrico divide demanda por COP estacional y suma agua caliente sanitaria (ACS) y otros usos.',
    limit:'Modelo anual de grados-día para un edificio electrificado. Los grados-día deben corresponder a las temperaturas base del edificio y al clima elegido. Ajusta los datos si la mejora cambia esas bases. Usa el alcance de área y energía coherente para comparar intensidades.',
    refs:[eui],
    calc(v){
      L.assert(v.scenarios.length===2&&v.scenarios.every(r=>r.length===6&&r.every(x=>x>=0&&x<=1e9)&&r[1]>=.1&&r[2]>=.1),
        'Ingresa dos escenarios con seis valores no negativos y COP de al menos 0,1.');
      const scenarios=v.scenarios.map(([ua,hcop,ccop,latent,other,water])=>{
        const heating=ua*v.hdd*24/1000/hcop;
        const cooling=(ua*v.cdd*24/1000+latent)/ccop;
        return [heating,cooling,water,other];
      });
      const [base,improved]=scenarios.map(sum), savings=base-improved;
      return {metrics:[['Consumo anual actual',base,'kWh/año'],['Consumo anual con mejora',improved,'kWh/año'],
        ['Ahorro anual',savings,'kWh/año'],['Ahorro relativo',base>0?100*savings/base:'Sin consumo base','%'],
        ['Intensidad actual',base/v.floor,'kWh/m²·año'],['Intensidad con mejora',improved/v.floor,'kWh/m²·año']],
        headers:['Uso final','Actual (kWh/año)','Mejora (kWh/año)'],
        rows:['Calefacción','Refrigeración','Agua caliente sanitaria','Otros usos'].map((name,i)=>[name,scenarios[0][i],scenarios[1][i]])};
    }
  });

  register({
    id:'smart-building-controls',title:'Automatización de edificios · puntos de control y energía',
    fields:[
      {...L.table('zones','Grupos de zonas','4;3;2;180;5;0.8\n2;2;1;650;2;1.4',
        'Una fila por tipo de zona. Registra potencia de cargas controladas por zona, horas equivalentes evitadas al día y consumo continuo total de sus sensores y actuadores.'),
        columns:['Zonas','Sensores/zona','Actuadores/zona','Carga (W/zona)','Horas evitadas/día','Control (W/zona)'],fixedColumns:true},
      f('gateway','Potencia continua de pasarelas y control central','W',5,0,1e5),
      f('days','Días al año con reducción de consumo','días',300,0,365),
      f('rate','Tarifa marginal de energía','moneda/kWh',.18,0,1e6)
    ],
    method:'Puntos = zonas × (sensores + actuadores). Ahorro bruto = carga controlada × horas evitadas × días. La energía anual del control continuo se descuenta del ahorro bruto.',
    limit:'Carga y horas deben representar reducciones reales de operación. Evita duplicar circuitos que aparecen en varias zonas. El recuento permite presupuestar puntos, con topología, capacidad de bus y cobertura de radio pendientes de diseño.',
    refs:[],
    calc(v){
      L.assert(v.zones.length>0&&v.zones.every(r=>r.length===6&&r.every(x=>x>=0&&x<=1e6)&&
        r.slice(0,3).every(Number.isInteger)&&r[4]<=24),'Usa cantidades enteras, potencias no negativas y hasta 24 horas evitadas al día.');
      const rows=v.zones.map(([n,s,a,w,h,standby],i)=>[i+1,n,n*s,n*a,n*w*h*v.days/1000,n*standby*8760/1000]);
      const sensors=sum(rows.map(r=>r[2])), actuators=sum(rows.map(r=>r[3]));
      const saved=sum(rows.map(r=>r[4]));
      const overhead=sum(rows.map(r=>r[5]))+v.gateway*8760/1000;
      const net=saved-overhead;
      return {metrics:[['Puntos de control',sensors+actuators,'puntos'],['Sensores',sensors,'unidades'],
        ['Actuadores',actuators,'unidades'],['Ahorro bruto',saved,'kWh/año'],
        ['Consumo del sistema de control',overhead,'kWh/año'],['Ahorro neto',net,'kWh/año'],
        ['Valor del ahorro neto',net*v.rate,'moneda/año']],
        headers:['Grupo','Zonas','Sensores','Actuadores','Ahorro bruto (kWh/año)','Consumo de dispositivos (kWh/año)'],rows};
    }
  });
})();
