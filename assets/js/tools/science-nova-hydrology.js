/* Escorrentía, almacenamiento, nieve y restauración fluvial. */
(function () {
  'use strict';
  const L=GL.lab,{register:R,f,pct,table,check,plot,nn}=GL.nova;
  R('curve-number-runoff','rainfall-runoff-scs-cn','hydraulics','Escorrentía SCS · número de curva y volumen',
    [f('rain','Precipitación del evento','mm',85),f('cn','Número de curva ajustado a humedad antecedente','',78,1,100),
      f('lambda','Abstracción inicial / retención','',.2,0,1),f('area','Área de cuenca','km²',1.8,.000001),
      f('tp','Tiempo al pico del hidrograma unitario','h',1.6,.001)],
    'S = 25 400/CN − 254. Q = (P − λS)²/(P − λS + S) si P supera λS. Pico ilustrativo del hidrograma NRCS = 0,208 × área × Q / tiempo al pico.',
    'Usa un CN calibrado para la condición de humedad. El pico supone un pulso de lluvia efectiva y un hidrograma unitario de forma estándar.',
    v=>{
      const s=25400/v.cn-254, ia=v.lambda*s;
      const runoff=p=>p>ia?(p-ia)**2/(p-ia+s):0;
      const q=runoff(v.rain), rows=Array.from({length:41},(_,i)=>[v.rain*i/40,runoff(v.rain*i/40)]);
      return {metrics:[['Lámina de escorrentía',q,'mm'],['Volumen de escorrentía',q*v.area*1000,'m³'],
        ['Pico indicativo',.208*v.area*q/v.tp,'m³/s'],['Abstracción inicial',ia,'mm'],['Retención potencial',s,'mm']],
        headers:['Lluvia (mm)','Escorrentía (mm)'],rows,series:[plot('Escorrentía',rows,0,1)],xLabel:'Lluvia (mm)',yLabel:'Escorrentía (mm)'};
    },[['NRCS · hidrología de áreas urbanas TR-55','https://www.govinfo.gov/app/details/CZIC-gb980-u73-1986']]);

  R('rational-drain-capacity','stormwater-runoff-rational','hydraulics','Drenaje pluvial · caudal racional y capacidad de tubería',
    [f('area','Área tributaria','ha',3,.000001),f('c','Coeficiente de escorrentía','',.7,0,1),
      f('rain','Intensidad para el tiempo de concentración','mm/h',85),f('diam','Diámetro interior','mm',600,1),
      pct('slope','Pendiente hidráulica',.7),f('n','Rugosidad de Manning','',.013,.001,1)],
    'Caudal racional = C i A / 360. Capacidad de la tubería circular llena por gravedad = A R^(2/3) S^(1/2) / n.',
    'La comparación supone flujo uniforme por gravedad. Para diseño revisa pérdidas en captaciones y uniones, remanso, sobrecarga y velocidades.',
    v=>{
      const d=v.diam/1000, q=v.area*v.c*v.rain/360;
      const capacity=Math.PI*d*d/4*(d/4)**(2/3)*Math.sqrt(v.slope/100)/v.n;
      return {metrics:[['Caudal pico',q,'m³/s'],['Capacidad a sección llena',capacity,'m³/s'],
        ['Margen de capacidad',capacity-q,'m³/s'],['Velocidad a sección llena',capacity/(Math.PI*d*d/4),'m/s']]};
    });

  R('bioretention-event-balance','bioretention-cell-stormwater','hydraulics','Biorretención · almacenamiento y vaciado por evento',
    [f('area','Área aportante fuera de la celda','m²',2500),f('c','Coeficiente volumétrico de escorrentía','',.8,0,1),
      f('rain','Lluvia uniforme del evento','mm',32),f('duration','Duración de lluvia','h',2,.001),
      f('cell','Área de celda','m²',140,.01),f('pond','Lámina superficial de almacenamiento','m',.18),
      f('bed','Profundidad del lecho','m',.45),pct('porosity','Porosidad drenable efectiva',22),
      f('exfil','Infiltración efectiva al subsuelo','mm/h',12),f('drain','Descarga efectiva de subdrenaje','m³/h',1.5)],
    'Aporte = lluvia × (área tributaria × coeficiente + área de celda). Capacidad = área × (lámina + profundidad × porosidad drenable). Balance con lluvia y salida uniformes, limitado por capacidad y agua disponible.',
    'Celda vacía al inicio. Usa tasas efectivas medidas o calculadas para el perfil, con infiltración y drenaje simultáneos mientras hay agua.',
    v=>{
      const inlet=v.rain/1000*(v.area*v.c+v.cell);
      const capacity=v.cell*(v.pond+v.bed*v.porosity/100);
      const outlet=v.exfil/1000*v.cell+v.drain;
      const drained=Math.min(inlet,outlet*v.duration), remaining=inlet-drained;
      const stored=Math.min(capacity,remaining), overflow=remaining-stored;
      return {metrics:[['Rebose del evento',overflow,'m³'],['Aporte de lluvia',inlet,'m³'],['Capacidad disponible',capacity,'m³'],
        ['Salida durante la lluvia',drained,'m³'],['Almacenado al finalizar',stored,'m³'],
        ['Vaciado posterior',stored===0?0:outlet>0?stored/outlet:'Sin descarga','h']]};
    });

  R('rainwater-storage-simulation','rainwater-harvesting','hydraulics','Captación pluvial · cisterna, cobertura y rebose',
    [f('area','Área captadora','m²',150,.01),pct('runoff','Coeficiente de escorrentía',85),
      pct('filter','Fracción aprovechada después de pérdidas',90),f('capacity','Capacidad de cisterna','m³',9),
      f('start','Almacenamiento inicial','m³',0),
      table('steps','Serie cronológica',['Lluvia (mm)','Demanda (m³)'],
        '15;7\n25;7\n48;7\n63;7\n103;7\n117;7\n91;7\n75;7\n52;7\n35;7\n22;7\n14;7',
        'Una fila por intervalo. El ejemplo es mensual; usa pasos diarios para estimar reboses y déficit con más detalle.')],
    'En cada intervalo entra lluvia × área × rendimiento. Se aplica el límite de cisterna y se retira demanda hasta agotar el almacenamiento.',
    'Supone que la lluvia del intervalo llega antes del consumo. Las pérdidas de primer lavado y filtración se incorporan en el rendimiento.',
    v=>{
      check(v.steps,2,nn,'Usa lluvia y demanda no negativas.');
      L.assert(v.start<=v.capacity,'El almacenamiento inicial supera la capacidad.');
      let storage=v.start;
      const rows=v.steps.map(([rain,demand],i)=>{
        const inflow=rain/1000*v.area*v.runoff*v.filter/10000;
        const available=storage+inflow, spill=Math.max(0,available-v.capacity);
        const served=Math.min(demand,available-spill);
        storage=available-spill-served;
        return [i+1,inflow,demand,served,demand-served,spill,storage];
      });
      const [inflow,demand,served,deficit,spill]=[1,2,3,4,5].map(i=>L.sum(rows.map(r=>r[i])));
      return {metrics:[['Demanda cubierta',demand>0?100*served/demand:'Sin demanda','%'],['Volumen servido',served,'m³'],
        ['Entrada aprovechable',inflow,'m³'],['Déficit',deficit,'m³'],['Rebose',spill,'m³'],['Almacenamiento final',storage,'m³']],
        headers:['Período','Entrada (m³)','Demanda (m³)','Servido (m³)','Déficit (m³)','Rebose (m³)','Almacenado (m³)'],
        rows,series:[plot('Almacenado',rows,0,6),plot('Déficit',rows,0,4)],xLabel:'Período',yLabel:'m³'};
    });

  R('snowmelt-swe-balance','snowmelt-degree-day','hydraulics','Deshielo · grados-día, caudal equivalente y reserva nival',
    [f('swe','Equivalente inicial de agua en nieve','mm',110),f('base','Temperatura umbral','°C',0,-30,15),
      f('factor','Factor grado-día','mm/(°C·día)',3.5,0,50),f('area','Área nival representada','km²',2,.000001),
      table('days','Forzamiento diario',['Temperatura media (°C)','Nieve nueva (mm de agua)'],
        '-2;8\n1;0\n3;0\n5;0\n6;0\n2;0\n-1;2','Una fila por día. Usa temperatura representativa del área nival.')],
    'Fusión diaria = mínimo entre reserva disponible y factor grado-día × max(0, T − umbral). Se resta la fusión y se suma la nieve nueva en equivalente de agua.',
    'El caudal equivale a repartir el agua fundida durante el día. La salida real depende de infiltración, retención y propagación.',
    v=>{
      check(v.days,2,([t,n])=>t>=-90&&t<=65&&n>=0,'Usa temperatura válida y nieve no negativa.');
      let snow=v.swe;
      const rows=v.days.map(([t,add],i)=>{
        snow+=add;
        const melt=Math.min(snow,v.factor*Math.max(0,t-v.base));
        snow-=melt;
        return [i+1,t,add,melt,snow,melt*v.area*1000/86400];
      });
      const total=L.sum(rows.map(r=>r[3]));
      return {metrics:[['Deshielo total',total,'mm'],['Volumen fundido',total*v.area*1000,'m³'],['Reserva final',snow,'mm'],
        ['Máximo caudal diario equivalente',Math.max(...rows.map(r=>r[5])),'m³/s']],
        headers:['Día','Temperatura (°C)','Nieve nueva (mm)','Fusión (mm)','Reserva (mm)','Caudal equivalente (m³/s)'],
        rows,series:[plot('Reserva',rows,0,4),plot('Fusión',rows,0,3)],xLabel:'Día',yLabel:'mm'};
    });

  R('bankfull-channel-screen','stream-restoration-bankful','hydraulics','Restauración fluvial · capacidad a cauce lleno',
    [f('width','Ancho del fondo','m',5,.001),f('depth','Profundidad de cauce lleno','m',1.2,.001),
      f('side','Talud lateral horizontal / vertical','',2),pct('slope','Pendiente longitudinal',.25,.0001),
      f('n','Coeficiente de Manning','',.037,.001,1),f('d50','Diámetro mediano de sedimento','mm',38,.001),
      f('rho','Densidad del sedimento','kg/m³',2650,1000.01,10000)],
    'Manning en sección trapezoidal. Esfuerzo medio = ρagua g R S. Shields = esfuerzo / [(ρsed − ρagua) g D50].',
    'Cribado hidráulico de una sección y gradiente uniformes. Compara el Shields calculado con observaciones del material y del tramo.',
    v=>{
      const area=v.depth*(v.width+v.side*v.depth);
      const radius=area/(v.width+2*v.depth*Math.hypot(1,v.side)), slope=v.slope/100;
      const speed=radius**(2/3)*Math.sqrt(slope)/v.n, shear=1000*9.80665*radius*slope;
      return {metrics:[['Caudal a cauce lleno',area*speed,'m³/s'],['Velocidad media',speed,'m/s'],
        ['Área mojada',area,'m²'],['Radio hidráulico',radius,'m'],['Esfuerzo cortante medio',shear,'Pa'],
        ['Parámetro de Shields',shear/((v.rho-1000)*9.80665*v.d50/1000),'']]};
    });
})();
