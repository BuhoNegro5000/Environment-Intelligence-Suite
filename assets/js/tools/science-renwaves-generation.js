/* Modelos locales de generación, almacenamiento y recarga. */
(function () {
  'use strict';
  const L=GL.lab, f=L.f, sum=L.sum;
  const pvRef=['PVWatts · irradiación mensual en el plano','https://developer.nlr.gov/docs/solar/pvwatts/v8/'];
  const batteryRef=['SAM · almacenamiento eléctrico','https://sam.nlr.gov/battery-storage.html'];
  function register(d){L.register({suite:'energy',tags:['Energía','Cálculo local'],...d});}

  register({
    id:'pv-monthly-resource',title:'Solar FV · producción con recurso mensual',
    intro:'Importa o edita los 12 valores de irradiación sobre los módulos. Compara la producción de cada mes con el recurso disponible.',
    fields:[
      f('power','Potencia nominal DC','kWp',10,.001,1e7),
      f('inverter','Eficiencia del inversor','%',97.5,.1,100),
      f('loss','Otras pérdidas DC equivalentes','%',14,0,100),
      {...L.table('months','Recurso de enero a diciembre',
        '105\n111\n133\n144\n156\n161\n169\n159\n144\n126\n106\n99',
        '12 filas sin encabezado, en orden de enero a diciembre. Ejemplo ilustrativo. Usa irradiación mensual sobre el plano del arreglo (POA).'),
        columns:['Irradiación POA (kWh/m²)'],fixedColumns:true}
    ],
    method:'Producción AC mensual = potencia nominal DC × irradiación POA del mes / 1 kW/m² × eficiencia del inversor × (1 − otras pérdidas). PR = producción AC / producción de referencia sin pérdidas.',
    limit:'Usa la irradiación del plano con la inclinación y el azimut del arreglo ya incorporados. Importa la serie de una fuente local o de un modelo solar como PVWatts o PVGIS. Aplica pérdidas agregadas constantes. El perfil mensual requiere datos de entrada y el cálculo se ejecuta sin conexión.',
    refs:[pvRef,['RenWaves · Rensys','https://renwaves.com/rensys/']],
    calc(v){
      L.assert(v.months.length===12&&v.months.every(r=>r.length===1&&r[0]>=0&&r[0]<=1000),
        'Usa 12 valores mensuales de irradiación POA entre 0 y 1 000 kWh/m².');
      const pr=v.inverter/100*(1-v.loss/100);
      const rows=v.months.map(([poa],i)=>[i+1,poa,v.power*poa*pr]);
      const annual=sum(rows.map(r=>r[2]));
      const resource=sum(rows.map(r=>r[1]));
      return {metrics:[['Generación anual AC',annual,'kWh/año'],['Generación diaria media',annual/365,'kWh/día'],
        ['Rendimiento específico',annual/v.power,'kWh/kWp·año'],['Relación de rendimiento',resource>0?pr*100:'Sin recurso','%'],
        ['Factor de capacidad respecto a potencia DC',100*annual/(v.power*8760),'%']],
        headers:['Mes','Irradiación POA (kWh/m²)','Energía AC (kWh)'],rows,
        series:[{name:'Energía AC',data:rows.map(r=>[r[0],r[2]]),type:'bar'}],xLabel:'Mes',yLabel:'kWh'};
    }
  });

  register({
    id:'pv-roof-appliances',title:'Solar FV · módulos por consumo y área de techo',
    fields:[
      L.select('mode','Origen de la demanda',[['bill','Consumo mensual facturado'],['loads','Inventario diario de equipos']],'bill'),
      f('monthly','Consumo mensual medio facturado','kWh/mes',500,0,1e8),
      {...L.table('loads','Equipos eléctricos','1;150;8\n10;9;5\n1;90;4\n1;65;8\n1;750;4',
        'Usa potencia eléctrica de entrada y horas equivalentes de uso por día. Una fila por tipo de equipo.'),
        columns:['Cantidad','Potencia (W)','Horas/día'],fixedColumns:true},
      f('coverage','Objetivo de producción sobre la demanda','%',100,0,100),
      f('sun','Horas solares pico del plano','h/día',4,.01,12),
      f('pr','Relación de rendimiento global','%',82,.01,100),
      f('module','Potencia de un módulo','W',450,1,2000),
      f('area','Área de un módulo','m²',2,.01,20),
      f('roof','Área útil de techo','m²',40,0,1e7),
      f('packing','Fracción ocupable por módulos','%',85,.1,100)
    ],
    method:'Demanda diaria por equipos = Σ cantidad × W × horas / 1 000. Producción por módulo = W/1 000 × horas solares pico × PR. El número requerido redondea hacia arriba y el máximo por área redondea hacia abajo.',
    limit:'Balance de energía media. La cobertura anual representa energía producida respecto a demanda y puede incluir excedentes. El montaje requiere verificar geometría, sombras, estructura, separación, tensión, corriente y protecciones.',
    refs:[pvRef,['RenWaves · diseño FV','https://renwaves.com/pv-system-design/']],
    calc(v){
      const fromLoads=v.mode==='loads';
      if(fromLoads)L.assert(v.loads.length>0&&v.loads.every(r=>r.length===3&&Number.isInteger(r[0])&&r[0]>=0&&
        r[1]>=0&&r[2]>=0&&r[2]<=24),'Cada equipo requiere cantidad entera, potencia no negativa y entre 0 y 24 h/día.');
      const daily=fromLoads?sum(v.loads.map(([n,w,h])=>n*w*h/1000)):v.monthly*12/365;
      const target=daily*v.coverage/100;
      const moduleKW=v.module/1000, unitYield=moduleKW*v.sun*v.pr/100;
      const required=Math.ceil(target/unitYield), roofFraction=v.packing/100;
      const maxModules=Math.floor(v.roof*roofFraction/v.area);
      const installed=Math.min(required,maxModules), annual=installed*unitYield*365;
      return {metrics:[['Módulos instalables para el objetivo',installed,'módulos'],
        ['Potencia instalable',installed*moduleKW,'kWp'],['Módulos requeridos',required,'módulos'],
        ['Máximo estimado por área',maxModules,'módulos'],['Área de techo para cumplir objetivo',required*v.area/roofFraction,'m²'],
        ['Generación con los módulos instalables',annual,'kWh/año'],['Demanda',daily*365,'kWh/año'],
        ['Cobertura energética anual',daily>0?100*annual/(daily*365):'Sin demanda','%']],
        message:installed<required?'El área útil limita la potencia. Faltan '+(required-installed)+' módulos para el objetivo.':'La cantidad requerida cabe según el criterio de área ingresado.'};
    }
  });

  register({
    id:'battery-backup-sizing',title:'Batería · capacidad útil, autonomía y recarga',
    fields:[
      f('load','Carga crítica media','kW',1.2,.001,1e6),f('peak','Pico de carga crítica','kW',3,.001,1e6),
      f('hours','Autonomía objetivo','h',8,0,8760),f('module','Capacidad nominal por módulo','kWh',5,.01,1e6),
      f('moduleKW','Potencia continua DC por módulo','kW',2.5,.01,1e6),
      f('dod','Profundidad de descarga admisible','%',80,.1,100),
      f('retained','Capacidad remanente de diseño','%',85,.1,100),
      f('discharge','Eficiencia batería → cargas AC','%',94,.1,100),
      f('charge','Eficiencia fuente AC → batería','%',93,.1,100),
      f('inverter','Potencia AC continua del inversor','kW',4,.001,1e6),
      f('recharge','Potencia AC efectiva disponible para recarga','kW',2,.001,1e6)
    ],
    method:'Energía AC útil por módulo = capacidad nominal × profundidad de descarga × retención × eficiencia de descarga. Se redondean los módulos necesarios por energía y por potencia DC y se toma el mayor valor. La recarga incorpora las dos eficiencias.',
    limit:'La recarga usa potencia AC efectiva, ya limitada por la fuente, cargador y batería. Verifica potencia de arranque, BMS, compatibilidad, límites de carga, temperaturas y curvas del fabricante.',
    refs:[batteryRef],
    calc(v){
      L.assert(v.peak>=v.load,'El pico de carga debe ser al menos igual a la carga media.');
      const eta=v.discharge/100, usable=v.module*v.dod/100*v.retained/100*eta;
      const demand=v.load*v.hours;
      const nEnergy=Math.ceil(demand/usable), nPower=Math.ceil(v.peak/(v.moduleKW*eta));
      const n=Math.max(nEnergy,nPower), energyAC=n*usable;
      const peakAC=Math.min(v.inverter,n*v.moduleKW*eta);
      const chargeEnergy=demand/(eta*v.charge/100);
      return {metrics:[['Módulos requeridos',n,'módulos'],['Capacidad nominal instalada',n*v.module,'kWh'],
        ['Capacidad útil a cargas AC',energyAC,'kWh'],['Autonomía por energía',energyAC/v.load,'h'],
        ['Potencia AC disponible',peakAC,'kW'],['Energía de recarga para la autonomía objetivo',chargeEnergy,'kWh'],
        ['Tiempo de recarga para la autonomía objetivo',chargeEnergy/v.recharge,'h']],
        headers:['Criterio','Módulos'],rows:[['Energía',nEnergy],['Potencia',nPower]],
        message:peakAC<v.peak?'La potencia AC disponible es inferior al pico requerido.':'La capacidad calculada cubre los criterios ingresados de energía y potencia continua.'};
    }
  });

  register({
    id:'ev-charging-load',title:'Movilidad eléctrica · energía y potencia de recarga',
    fields:[
      f('vehicles','Vehículos que cargan por jornada','vehículos',12,1,1e5),
      f('distance','Distancia diaria por vehículo','km',100,0,3000),
      f('use','Consumo en la batería','kWh/100 km',19,0,300),
      f('eta','Eficiencia desde el tablero a la batería','%',90,.1,100),
      f('ports','Puertos independientes','puertos',4,1,1e5),
      f('portKW','Potencia AC efectiva por puerto (lado red)','kW',11,.001,1000),
      f('window','Ventana común para recarga','h',8,.01,24),
      f('headroom','Potencia disponible sobre la carga base','kW',35,0,1e6),
      f('days','Jornadas por año','días',260,0,366)
    ],
    method:'Energía de red = distancia × consumo específico × vehículos / eficiencia. Se agrupan vehículos iguales en tandas con un puerto cada uno. Cada tanda usa la menor potencia por vehículo entre el límite del puerto y el reparto equitativo de la capacidad disponible.',
    limit:'El escenario supone que todos los vehículos están disponibles desde el inicio. Representa carga a potencia constante en tandas completas o parciales, con potencia por puerto ya limitada por el vehículo. Usa la capacidad disponible después de descontar la carga base. Las curvas de carga y los horarios individuales requieren un perfil medido.',
    refs:[['DOE · integración vehículo-red','https://www.energy.gov/sites/default/files/2025-01/Vehicle_Grid_Integration_Asseessment_Report_01162025.pdf']],
    calc(v){
      L.assert(Number.isInteger(v.vehicles)&&Number.isInteger(v.ports),'Vehículos y puertos deben ser números enteros.');
      const each=v.distance*v.use/100/(v.eta/100), daily=each*v.vehicles;
      const simultaneous=Math.min(v.ports,v.vehicles);
      const full=Math.floor(v.vehicles/simultaneous), remainder=v.vehicles%simultaneous;
      const batches=remainder?[[full,simultaneous],[1,remainder]]:[[full,simultaneous]];
      const totalHours=daily===0?0:v.headroom>0?sum(batches.map(([n,k])=>n*each/Math.min(v.portKW,v.headroom/k))):null;
      const unmanaged=daily>0?simultaneous*v.portKW:0;
      const feasible=totalHours!==null&&totalHours<=v.window+1e-9;
      return {metrics:[['Energía diaria de red',daily,'kWh/día'],['Energía anual de red',daily*v.days,'kWh/año'],
        ['Energía de red por vehículo',each,'kWh'],['Pico de recarga sin control',unmanaged,'kW'],
        ['Pico de recarga con límite',Math.min(unmanaged,v.headroom),'kW'],
        ['Duración total de las tandas',totalHours??'Sin potencia disponible','h'],
        ['Potencia media mínima en la ventana',daily/v.window,'kW']],
        headers:['Tandas','Vehículos por tanda','Potencia por vehículo (kW)'],
        rows:batches.map(([n,k])=>[n,k,daily>0?Math.min(v.portKW,v.headroom/k):0]),
        message:feasible?'Las tandas completan la recarga dentro de la ventana indicada.':'La recarga por tandas excede la ventana con la potencia disponible.'};
    }
  });
})();
