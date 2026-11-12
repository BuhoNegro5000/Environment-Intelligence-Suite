/* Economía de operación, producción y desempeño de equipos. */
(function(){
  'use strict';
  const L=GL.lab,{f,p,m,out,reg,rows,nn,eps,g}=GL.dw,{assert:A,sum:S,table:T}=L;

  reg('improvement-project-roi','sustainability','roi-retorno-investimento-saneamento','Mejoras de planta · ROI, VAN y recuperación',[
    f('capital','Inversión inicial','moneda',85000,eps),f('savings','Ahorro bruto mensual','moneda/mes',6300),
    f('cost','Costo incremental mensual','moneda/mes',1100),f('n','Horizonte','meses',24,1,600),p('rate','Tasa efectiva anual de descuento',10)
  ],'ROI simple = (ahorro neto acumulado − inversión)/inversión. VAN descuenta flujos mensuales con tasa equivalente. Recuperación simple = inversión/ahorro neto mensual.',
  v=>{A(Number.isSafeInteger(v.n),'El horizonte se ingresa en meses enteros.');const net=v.savings-v.cost;
    const discount=Math.log1p(v.rate/100)/12,annuity=discount?-Math.expm1(-v.n*discount)/Math.expm1(discount):v.n;
    return out(m('ROI simple',100*(net*v.n/v.capital-1),'%'),m('Valor actual neto',net*annuity-v.capital,'moneda'),
      m('Ahorro mensual neto',net,'moneda/mes'),m('Recuperación simple',net>0?v.capital/net:'Sin recuperación',net>0?'meses':''));},
  'Flujos constantes al final de cada mes. Usa la misma moneda, año base y convención de descuento.');

  reg('plant-oee-availability','sustainability','eficiencia-operacional-oee-eta-ete','Operación de planta · OEE, disponibilidad y mantenimiento',[
    f('planned','Horas planificadas','h',720,eps),f('corrective','Parada correctiva','h',28),
    f('other','Otras paradas dentro del tiempo planificado','h',12),f('nominal','Producción nominal por hora de operación','m³/h',95,eps),
    f('production','Producción real en el periodo','m³',61000),f('accepted','Volumen conforme','m³',60000),
    f('cost','Costo de mantenimiento correctivo','moneda',7800)
  ],'Disponibilidad = horas operadas/planificadas. Rendimiento = producción/(horas operadas×tasa nominal). Calidad = volumen conforme/producción. OEE = disponibilidad × rendimiento × calidad.',
  v=>{const up=v.planned-v.corrective-v.other;A(up>=0&&v.accepted<=v.production,'Revisa tiempos de parada y volumen conforme.');
    A(up>0||v.production===0,'La producción debe ser cero si la planta estuvo detenida todo el periodo.');
    const availability=up/v.planned,performance=up?v.production/(up*v.nominal):null,quality=v.production?v.accepted/v.production:null;
    return {...out(m('OEE',100*v.accepted/(v.planned*v.nominal),'%'),m('Disponibilidad operativa',100*availability,'%'),
      m('Rendimiento',performance===null?null:100*performance,'%'),m('Calidad',quality===null?null:100*quality,'%'),
      m('Horas operadas',up,'h'),m('Mantenimiento por hora operada',up?v.cost/up:null,'moneda/h')),
      message:performance>1?'La producción por hora supera la referencia nominal. Revisa que las bases sean comparables.':''};},
  'Usa volúmenes y tiempos del mismo periodo. La disponibilidad y el costo por hora comparten la misma definición de tiempo operativo.');

  reg('water-specific-energy','energy','consumo-energetico-especifico-cee-agua','Producción de agua · consumo energético específico',[
    f('e','Energía eléctrica medida','kWh',12500),f('volume','Volumen producido del mismo periodo','m³',25000,eps),
    f('target','Referencia de consumo específico','kWh/m³',.45),f('tariff','Tarifa de energía','moneda/kWh',.16)
  ],'CEE = energía medida/volumen producido. Costo específico = CEE × tarifa. La diferencia absoluta se calcula frente a la referencia ingresada.',
  v=>{const cee=v.e/v.volume;
    return out(m('Consumo específico',cee,'kWh/m³'),m('Costo eléctrico específico',cee*v.tariff,'moneda/m³'),
      m('Diferencia frente a referencia',cee-v.target,'kWh/m³'),m('Diferencia de energía en el periodo',(cee-v.target)*v.volume,'kWh'));},
  'Fija el límite de equipos y el mismo periodo para energía y producción.');

  reg('pump-measured-efficiency','energy','eficiencia-hidraulica-bombas','Motobomba · rendimiento eléctrico-hidráulico medido',[
    f('q','Caudal medido','m³/h',120),f('head','Altura manométrica total medida','m',32),
    f('power','Potencia eléctrica activa medida','kW',16,eps),f('rho','Densidad del fluido','kg/m³',998,eps)
  ],'Potencia hidráulica = ρgQH. Rendimiento conjunto = potencia hidráulica/potencia eléctrica activa.',
  v=>{const h=v.rho*g*(v.q/3600)*v.head/1000,eta=100*h/v.power;
    return {...out(m('Rendimiento del conjunto',eta,'%'),m('Potencia hidráulica',h,'kW'),
      m('Consumo específico',v.q?v.power/v.q:null,'kWh/m³'),m('Diferencia eléctrica − hidráulica',v.power-h,'kW')),
      message:eta>100?'El balance excede 100 %. Revisa unidades, sincronización y altura total medida.':''};},
  'Compara medidas simultáneas del mismo punto de operación. El resultado incluye las pérdidas de motor, bomba y equipos dentro de la frontera eléctrica.');

  reg('industrial-water-intensity','sustainability','pegada-hidrica-industrial-litros-unidade','Uso industrial de agua · intensidad por unidad producida',[
    f('withdrawal','Agua captada o comprada','m³',1800),f('return','Agua devuelta a la misma cuenca','m³',550),
    f('production','Producción conforme del periodo','unidades',80000,eps),L.text('basis','Unidad de producción','Unidad terminada')
  ],'Intensidad de captación=1000·agua captada/producción. Consumo neto=agua captada menos devolución a la misma cuenca.',
  v=>{A(v.return<=v.withdrawal,'La devolución supera el agua captada. Revisa límites y periodo.');
    return out(m('Intensidad de captación',1000*v.withdrawal/v.production,'L/unidad'),
      m('Intensidad de consumo neto',1000*(v.withdrawal-v.return)/v.production,'L/unidad'),m('Consumo neto',v.withdrawal-v.return,'m³'));},
  'Indicador de la operación declarada. Usa una frontera y un periodo comparables para agua y producción.');

  reg('chemical-cost-intensity','sustainability','custo-quimico-tratamento-m3','Tratamiento de agua · costo químico por volumen',[
    T('a','Productos consumidos en el periodo','240;1.25\n65;3.60',
      'Columnas: masa comercial consumida (kg); costo unitario (moneda/kg).'),
    f('volume','Volumen tratado','m³',15000,eps),f('fixed','Costo químico adicional del periodo','moneda',90)
  ],'Costo por producto = masa comercial × precio. Costo específico = total, incluidos costos adicionales, dividido entre volumen tratado.',
  v=>{rows(v.a,2,nn,'Usa consumos y costos no negativos.');
    const data=v.a.map(([q,c],i)=>[i+1,q,c,q*c,q*c/v.volume]),total=S(data.map(r=>r[3]))+v.fixed;
    return {metrics:[m('Costo químico específico',total/v.volume,'moneda/m³'),m('Costo total',total,'moneda'),m('Costo adicional específico',v.fixed/v.volume,'moneda/m³')],
      headers:['Producto','Masa (kg)','Precio unitario','Costo','Costo/m³'],rows:data};},
  'Todos los consumos corresponden al mismo periodo y los precios a la misma moneda.');

  reg('heat-exchanger-effectiveness','energy','performance-termica-trocadores-calor','Intercambiador · balance térmico y efectividad',[
    f('hi','Entrada caliente','°C',85,-200),f('ho','Salida caliente','°C',60,-200),
    f('ci','Entrada fría','°C',20,-200),f('co','Salida fría','°C',45,-200),
    f('mh','Caudal másico caliente','kg/s',2,eps),f('mc','Caudal másico frío','kg/s',2,eps),
    f('cph','Calor específico caliente','kJ/(kg·K)',4.18,eps),f('cpc','Calor específico frío','kJ/(kg·K)',4.18,eps)
  ],'Q caliente/frío = ṁ·cp·|ΔT|. Q máximo = mín(C caliente,C frío)·(T caliente entrada − T fría entrada). Efectividad de servicio = Q frío/Q máximo.',
  v=>{A(v.hi>v.ci&&v.hi>=v.ho&&v.co>=v.ci&&v.co<=v.hi&&v.ho>=v.ci,'Temperaturas incompatibles con intercambio sensible pasivo.');
    const hot=v.mh*v.cph,cold=v.mc*v.cpc,qh=hot*(v.hi-v.ho),qc=cold*(v.co-v.ci),max=Math.min(hot,cold)*(v.hi-v.ci);
    const gap=Math.max(qh,qc)?100*Math.abs(qh-qc)/Math.max(qh,qc):0;
    return {...out(m('Efectividad por calor recibido',100*qc/max,'%'),m('Calor cedido',qh,'kW'),m('Calor recibido',qc,'kW'),
      m('Calor máximo teórico',max,'kW'),m('Desbalance relativo',gap,'%')),
      message:qh>max||qc>max?'Alguna medición supera el máximo teórico. Revisa temperaturas y caudales.':''};},
  'Modelo de calor sensible estacionario. Las pérdidas al ambiente y las diferencias instrumentales quedan reflejadas en el desbalance.');

  reg('hydraulic-capacity-utilization','hydraulics','carregamento-hidraulico-efetivo-eta','Planta de tratamiento · utilización de capacidad hidráulica',[
    f('normal','Caudal medio observado','m³/h',140),f('peak','Caudal pico observado','m³/h',205),
    f('design','Capacidad de referencia','m³/h',190,eps)
  ],'Utilización = 100·caudal/capacidad. Margen hidráulico = capacidad − caudal.',
  v=>{A(v.peak>=v.normal,'El pico debe ser igual o mayor al promedio.');
    return out(m('Utilización media',100*v.normal/v.design,'%'),m('Utilización en punta',100*v.peak/v.design,'%'),
      m('Margen medio',v.design-v.normal,'m³/h'),m('Margen en punta',v.design-v.peak,'m³/h'));},
  'Compara la capacidad efectiva y los caudales de la misma frontera. El resultado no sustituye la revisión de cada unidad de proceso.');
})();
