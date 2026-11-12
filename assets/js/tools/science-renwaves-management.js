/* Diagnóstico energético y comparación de costos con entradas declaradas. */
(function () {
  'use strict';
  const L=GL.lab, f=L.f, sum=L.sum;
  const ren='https://renwaves.com/';
  function register(d){L.register({suite:'energy',tags:['Gestión energética','Cálculo local'],...d});}
  const months='Ene Feb Mar Abr May Jun Jul Ago Sep Oct Nov Dic'.split(' ');

  register({
    id:'building-energy-audit',title:'Auditoría energética · línea base, medidas y retorno',
    fields:[
      f('floor','Área de referencia','m²',400,.01,1e7),
      {...L.table('uses','Usos finales de electricidad','32000;16;3700;80\n10500;32;1500;25\n18000;8;800;40\n6000;0;0;0',
        'Una fila por uso final (por ejemplo HVAC, iluminación, equipos y ACS). Cada kWh aparece en una sola fila. Costo anual adicional puede ser negativo si la medida reduce gastos de operación.'),
        columns:['Línea base (kWh/año)','Ahorro previsto (%)','Inversión (moneda)','Costo anual adicional (moneda)'],fixedColumns:true},
      f('rate','Valor marginal de la energía','moneda/kWh',.18,0,1e6),
      f('carbon','Factor de emisiones eléctricas','kg CO₂e/kWh',.34,0,100),
      f('horizon','Horizonte de evaluación','años',12,1,100),
      f('discount','Tasa de descuento','%',8,0,100)
    ],
    method:'El ahorro por uso aplica el porcentaje declarado a la línea base. El flujo neto anual valora el ahorro eléctrico y descuenta el costo recurrente adicional. El valor presente neto (VPN) descuenta los flujos constantes y resta la inversión.',
    limit:'Preauditoría con medidas y factores documentados por el usuario. Trata cada uso como independiente. Asegura que el total concilie con la facturación del período y valida ahorros en operación. No incluye cargos por demanda, impuestos, reposiciones ni escalamiento de tarifas.',
    refs:[['ENERGY STAR · intensidad energética','https://www.energystar.gov/buildings/benchmark/understand-metrics/what-eui'],
      ['RenWaves · estimación de auditoría energética',ren+'energy-audit/']],
    calc(v){
      L.assert(v.uses.length>0&&v.uses.every(r=>r.length===4&&r.every(x=>Math.abs(x)<=1e9)&&
        r[0]>=0&&r[1]>=0&&r[1]<=100&&r[2]>=0),'Revisa consumo, ahorro entre 0 y 100 %, inversión y costos de cada uso final.');
      L.assert(Number.isInteger(v.horizon),'El horizonte debe expresarse en años enteros.');
      const discount=v.discount/100;
      const annuity=discount===0?v.horizon:-Math.expm1(-v.horizon*Math.log1p(discount))/discount;
      const rows=v.uses.map(([base,pct,cost,om],i)=>{
        const savings=base*pct/100, annual=savings*v.rate-om;
        return [i+1,base,savings,cost,annual,annual*annuity-cost];
      });
      const totals=[1,2,3,4,5].map(i=>sum(rows.map(r=>r[i])));
      const [baseline,saved,capex,annual,npv]=totals;
      return {metrics:[['Ahorro anual de electricidad',saved,'kWh/año'],['Línea base',baseline,'kWh/año'],
        ['Intensidad eléctrica de línea base',baseline/v.floor,'kWh/m²·año'],
        ['Ahorro neto anual',annual,'moneda/año'],['Emisiones evitadas',saved*v.carbon/1000,'t CO₂e/año'],
        ['Inversión total',capex,'moneda'],['Retorno simple',annual>0?capex/annual:'Sin recuperación','años'],
        ['Valor presente neto',npv,'moneda']],
        headers:['Uso','Línea base (kWh/año)','Ahorro (kWh/año)','Inversión','Ahorro neto anual','VPN'],rows};
    }
  });

  register({
    id:'energy-equipment-budget',title:'Equipos energéticos · comparación de cotizaciones',
    intro:'Compara precios instalados y costos por unidad de capacidad con cotizaciones locales en la misma moneda.',
    fields:[
      L.select('unit','Capacidad usada para comparar',[['kW','Potencia (kW)'],['kWh','Capacidad útil (kWh)'],['ud','Unidades funcionales']],'kW'),
      f('contingency','Contingencia sobre equipo e instalación','%',10,0,100),
      {...L.table('offers','Alternativas de una misma clase',
        '5;1;3100;760;120\n5.5;1;3450;630;100\n3;2;1900;450;120',
        'Una fila por cotización alternativa. Precio y costos adicionales por equipo. Usa la misma unidad funcional, moneda y alcance en todas las filas.'),
        columns:['Capacidad por equipo','Cantidad','Precio por equipo','Instalación por equipo','Otros por equipo'],fixedColumns:true}
    ],
    method:'Costo instalado = cantidad × (precio del equipo + instalación + otros) × (1 + contingencia). El costo unitario divide ese total entre la capacidad conjunta.',
    limit:'Compara cotizaciones ingresadas por el usuario en la misma moneda. Usa costos, impuestos y capacidades equivalentes en alcance. El comparador trabaja sin un listado de precios de mercado ni cotizaciones bursátiles.',
    refs:[['RenWaves · referencia de precios de equipos',ren+'energy-system-prices/']],
    calc(v){
      L.assert(v.offers.length>0&&v.offers.every(r=>r.length===5&&r.every(x=>x>=0&&x<=1e9)&&r[0]>=.001&&
        Number.isInteger(r[1])&&r[1]>0),'Ingresa capacidad positiva, cantidad entera positiva y costos no negativos.');
      const rows=v.offers.map(([capacity,n,price,install,other],i)=>{
        const total=n*(price+install+other)*(1+v.contingency/100);
        return [i+1,capacity*n,n,total,total/(capacity*n)];
      });
      const best=rows.reduce((a,b)=>b[4]<a[4]?b:a);
      const lowestTotal=rows.reduce((a,b)=>b[3]<a[3]?b:a);
      const unit=v.unit;
      return {metrics:[['Menor costo por capacidad',best[4],'moneda/'+unit],['Alternativa de menor costo por capacidad',best[0],'fila'],
        ['Menor costo instalado',lowestTotal[3],'moneda'],['Alternativa de menor costo instalado',lowestTotal[0],'fila']],
        headers:['Alternativa','Capacidad ('+unit+')','Cantidad','Costo instalado','Costo por '+unit],rows};
    }
  });

  register({
    id:'electricity-tariff-comparison',title:'Tarifas eléctricas · punta, valle y demanda',
    fields:[
      {...L.table('profile','Consumo y demanda mensuales',
        Array.from({length:12},(_,i)=>[3100+90*i,4600+110*i,33+i,29+i,600].join(';')).join('\n'),
        '12 filas de enero a diciembre. El traslado conserva energía y mueve consumo de punta a valle. Declara la demanda facturable de cada escenario según su contrato.'),
        columns:['Punta (kWh)','Valle (kWh)','Demanda actual (kW)','Demanda propuesta (kW)','Traslado (kWh)'],fixedColumns:true},
      {...L.table('tariffs','Tarifa actual y tarifa propuesta','0.18;0.18;8;15\n0.24;0.105;7.5;20',
        'Primera fila tarifa actual, segunda fila tarifa propuesta. Usa una misma moneda en ambas. Una tarifa plana usa el mismo precio en punta y valle.'),
        columns:['Punta (moneda/kWh)','Valle (moneda/kWh)','Demanda (moneda/kW·mes)','Fijo (moneda/mes)'],fixedColumns:true},
      f('investment','Inversión inicial para aplicar el cambio','moneda',1600,0,1e12),
      f('recurring','Costo recurrente adicional','moneda/año',50,0,1e12)
    ],
    method:'Factura mensual = cargo fijo + kWh punta × precio punta + kWh valle × precio valle + kW de demanda facturable × precio de demanda. La comparación separa el cambio de tarifa con el perfil inicial y el efecto adicional de trasladar carga.',
    limit:'Modelo de dos períodos constantes y un cargo de demanda mensual. Usa la demanda facturable ya calculada para cada escenario. Los bloques, impuestos, cargos mínimos, exportación, penalizaciones y ajustes de contrato quedan fuera de este modelo.',
    refs:[['SAM · estructura tarifaria','https://samrepo.nlr.gov/help/electricity_rates.html'],
      ['RenWaves · estimación de costos',ren+'energy-cost-estimation/']],
    calc(v){
      L.assert(v.profile.length===12&&v.profile.every(r=>r.length===5&&r.every(x=>x>=0&&x<=1e9)&&r[4]<=r[0]),
        'Usa 12 filas válidas. El traslado de cada mes debe ser menor o igual al consumo de punta.');
      L.assert(v.tariffs.length===2&&v.tariffs.every(r=>r.length===4&&r.every(x=>x>=0&&x<=1e6)),
        'Ingresa las dos tarifas con cuatro cargos no negativos cada una.');
      function bill([rp,rv,rd,fixed],peak,off,demand){return fixed+rp*peak+rv*off+rd*demand;}
      const [current,proposed]=v.tariffs;
      const rows=v.profile.map(([p,o,d0,d1,shift],i)=>{
        const before=bill(current,p,o,d0);
        const onlyRate=bill(proposed,p,o,d0);
        const after=bill(proposed,p-shift,o+shift,d1);
        return [months[i],p+o,shift,before,onlyRate,after,before-after];
      });
      const [base,rateOnly,after]=[3,4,5].map(i=>sum(rows.map(r=>r[i])));
      const net=base-after-v.recurring;
      return {metrics:[['Ahorro neto anual',net,'moneda/año'],['Factura anual actual',base,'moneda/año'],
        ['Factura anual propuesta',after,'moneda/año'],['Efecto del cambio de tarifa',base-rateOnly,'moneda/año'],
        ['Efecto adicional del perfil y demanda',rateOnly-after,'moneda/año'],
        ['Retorno simple',net>0?v.investment/net:'Sin recuperación','años']],
        headers:['Mes','Consumo (kWh)','Traslado (kWh)','Factura actual','Solo cambio de tarifa','Tarifa y operación propuestas','Ahorro bruto'],rows};
    }
  });
})();
