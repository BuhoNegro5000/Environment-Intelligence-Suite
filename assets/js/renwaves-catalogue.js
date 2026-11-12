/* Funciones energéticas identificadas en el directorio y las páginas de RenWaves. */
(function () {
  'use strict';
  const G=GL, base='https://renwaves.com/';
  const entries=[
    ['pv-monthly-resource','rensys','Rensys · Solar PV Yield Calculator','Publicada en RenWaves',
      'Producción anual y mensual, rendimiento específico y PR con irradiación POA importada.'],
    ['pv-roof-appliances','pv-system-design','PV System Calculator','Estimador público en una página de servicios',
      'Módulos a partir de la factura o de un inventario editable, con límite por superficie de techo.'],
    ['building-hvac-loads','renbem','RenBEM · Heating & Cooling Loads','Publicada en RenWaves',
      'Cargas sensibles y latentes, desglose por componente y perfil con 24 horas de datos climáticos editables.'],
    ['building-hvac-loads','hvac-calculation','HVAC Sizing & Load Estimator','Anunciada en el directorio · estimador público en una página de servicios',
      'Capacidad térmica de calefacción y refrigeración con margen definido por el usuario. Comparte el cálculo de cargas de diseño.'],
    ['wind-weibull','wind-turbine-calculation','Wind Energy Estimator','Anunciada en el directorio · estimador público en una página de servicios',
      'Recurso a altura de buje, curva paramétrica de potencia, producción anual, disponibilidad y pérdidas.','Herramienta existente'],
    ['building-annual-energy','building-energy-simulation','Building Energy Estimator','Anunciada en el directorio · estimador público en una página de servicios',
      'Energía anual por uso e intensidad del edificio. Compara un escenario actual y una mejora con grados-día.'],
    ['battery-backup-sizing','tools/#rwt-tools','Battery & Storage Planner','Anunciada en RenWaves',
      'Módulos, profundidad de descarga, capacidad al final de vida, límite de potencia y recarga.'],
    ['ev-charging-load','tools/#rwt-tools','EV Charging Load Planner','Anunciada en RenWaves',
      'Demanda diaria y anual, potencia simultánea y comprobación de recarga por tandas dentro de una ventana.'],
    ['building-energy-audit','energy-audit','Energy Audit · Savings Estimator','Estimador público en una página de servicios',
      'Línea base, medidas por uso final, emisiones evitadas, retorno simple y valor presente neto.'],
    ['electricity-tariff-comparison','energy-cost-estimation','Energy Cost Estimation','Estimador público en una página de servicios',
      'Comparación de dos tarifas y cambio de perfil mensual, con punta, valle, demanda, cargo fijo y costos.'],
    ['smart-building-controls','smart-home-design','Smart Home Design · Quick Scope','Estimador público en una página de servicios',
      'Inventario de sensores y actuadores. Compara el ahorro de los controles con su consumo continuo.'],
    ['energy-equipment-budget','energy-system-prices','Energy System Prices','Comparador público en RenWaves',
      'Compara cotizaciones propias por costo instalado y por capacidad con una moneda común.']
  ];
  G.renwavesCatalogue=entries.map(([id,slug,sourceTitle,sourceStatus,scope,status='Implementación nueva'],i)=>{
    const tool=G.getTool(id);
    return {catalogueNumber:i+1,id,title:tool.title,suite:tool.suite,relatedSuites:tool.relatedSuites,
      route:'#/tool/'+id,sourceUrl:base+slug,sourceTitle,sourceStatus,scope,status};
  });
})();
