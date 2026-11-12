/* Clasificación por función. Los IDs de herramientas y suites previas son estables. */
(function () {
  'use strict';
  const G=GL;
  function add(id,name,short,icon,color,desc) {
    G.suites[id]={id,name,short,icon,color,desc};
  }

  add('waste','Residuos sólidos','Residuos sólidos','♲','#D5BA72','Generación, valorización, disposición final, lixiviados y biogás de relleno.');
  add('energy','Energía y renovables','Energía','ϟ','#EBCB69','Eficiencia, generación renovable y potencia de equipos.');
  add('noise','Acústica y ruido','Ruido','≋','#E8A9C9','Propagación, suma sonora, exposición y ruido ambiental.');
  add('conversion','Unidades y conversiones','Conversiones','⇄','#8BBBEF','Conversor central y equivalencias especializadas.');
  add('population','Población y demografía','Demografía','♙','#C1ACED','Indicadores demográficos, dependencia y proyecciones de población.');
  add('wastewater','Aguas residuales y reúso','Aguas residuales','◉','#B5C78D','Afluentes, PTAR, ecualización, tratamiento biológico, lodos y revisión de efluentes.');
  add('hydraulics','Hidráulica e hidrología','Hidráulica','↝','#75B9EC','Tuberías, canales, aforos, perfiles, tanques, redes y escorrentía.');
  add('membranes','Membranas y desalinización','Membranas','▤','#77D6DE','Ósmosis inversa, NF, UF/MF, ensayos de ensuciamiento y energía de desalinización.');
  add('industrial-water','Agua industrial y alta pureza','Agua industrial','◇','#8BBCE5','Calderas, torres de enfriamiento, intercambio iónico y agua de proceso de alta pureza.');
  add('sustainability','Sostenibilidad y economía ambiental','Sostenibilidad','♧','#B9D785','Ciclo de vida, valoración económica, eficiencia de recursos y seguimiento de metas.');
  add('health','Salud ambiental y toxicología','Salud ambiental','✚','#E8A6A1','Exposición a contaminantes, toxicología y carga atribuible en población.');

  Object.assign(G.suites.water,{name:'Agua, calidad y potabilización',short:'Agua y potabilización',
    desc:'Calidad y química del agua, fuentes, abastecimiento, tratamiento fisicoquímico y desinfección.'});
  Object.assign(G.suites.air,{name:'Aire y emisiones',desc:'Calidad del aire, dispersión, fuentes de emisión y preparación de insumos para AERMOD.'});
  Object.assign(G.suites.climate,{name:'Clima, meteorología y carbono',short:'Clima y carbono',
    desc:'Inventarios de GEI, carbono, aridez, meteorología y confort térmico.'});
  Object.assign(G.suites.soil,{name:'Suelos y remediación',short:'Suelos',
    desc:'Propiedades del suelo, erosión, fertilidad, geología y remediación de sitios.'});
  Object.assign(G.suites.impact,{name:'Impacto, riesgo y cumplimiento ambiental',short:'Impacto ambiental',
    desc:'Evaluación de impactos, riesgo ambiental y control de obligaciones.'});
  Object.assign(G.suites.safety,{name:'Seguridad y salud en el trabajo',short:'SST',
    desc:'Riesgos laborales, higiene ocupacional, protección, incidentes y seguridad operativa.'});
  Object.assign(G.suites.metrology,{name:'Laboratorio, monitoreo y metrología',short:'Laboratorio y monitoreo',
    desc:'Muestreo, preparación de soluciones, incertidumbre, seguimiento y comparación de resultados.'});

  const primary={
    wastewater:[
      'ptar-activated-sludge','stabilization-ponds','bod-cod','ultimate-bod-estimation','equalization-storage',
      'activated-sludge-operations','clarifier-solids-loading','biological-nutrient-train','oxygen-aeration-design',
      'nutrient-reagent-demand','settling-solids-flux','wastewater-residuals-balance','wastewater-headworks-sizing',
      'anaerobic-load-methane','influent-design-loading','industrial-pretreatment-mass','water-evidence-comparison',
      'microbial-growth-biodegradation'
    ],
    hydraulics:[
      'retention-time','rational-runoff','liquid-water-properties','tank-geometries','municipal-design-flow',
      'rain-harvest-volume','pipe-darcy-loss','open-channel-flow','orifice-flow','flume-rating-curve','pipe-continuity-basis',
      'pipe-pressure-evidence','water-plant-energy-profile','pipe-total-pressure-drop','actuator-torque-envelope',
      'air-valve-profile-screen','piping-topology-workbench'
    ],
    membranes:[
      'membrane-ro-diagnostics','modified-fouling-index','filter-hydraulic-loading','membrane-series-balance',
      'membrane-permeability','silt-density-index','membrane-two-solute-design','ufmf-train-cycle-sizing','swro-energy-recovery'
    ],
    'industrial-water':[
      'ion-exchange-softening','ion-exchange-equivalent-sizing','cooling-tower-cycles','boiler-blowdown-balance',
      'high-purity-sampling-plan','post-ro-co2-conditioning','carbonate-pure-water-co2'
    ],
    sustainability:[
      'finance-water-cashflows','ecological-footprint','environmental-resource-performance','life-cycle-inventory',
      'environmental-economic-value','environmental-policy-appraisal','green-building-leed','sustainable-development-targets'
    ],
    health:['environmental-toxicology-dose','environmental-health-burden'],
    water:['source-water-design-data'],
    waste:['landfill-sizing','landfill-biogas','waste-generation','landfill-volume','waste-diversion'],
    energy:['energy-savings-ipmvp','solar-pv','wind-weibull','solar-energy'],
    noise:['noise-dose','environmental-noise','noise-point','noise-line','noise-sum','sound-power','noise-barrier'],
    conversion:['unit-converter'],
    spatial:['boundary-validator','shp-to-kml'],
    analysis:['sample-size'],
    climate:['emissions','forest-carbon-stock'],
    population:['population-lab'],
    safety:['containment-volume','risk-fmea'],
    impact:['risk-conesa'],
    metrology:['analysis-standards','environmental-monitoring-plan']
  };

  const related={
    'landfill-biogas':['energy','climate'], 'landfill-sizing':['wastewater'], 'noise-dose':['safety'],
    'gas-ppm':['conversion'], 'gas-ppb':['conversion'], 'alkalinity':['conversion','industrial-water'],
    'soc-som':['conversion'], 'soil-moisture':['conversion'], 'carbon-co2':['conversion'],
    'geo-dd-dms':['conversion'], 'shp-to-kml':['conversion'], 'meteo-hourly':['climate','conversion'],
    'risk-efmea':['safety'], 'risk-conesa':['safety'], 'analysis-spatial':['spatial'],
    'analysis-standards':['impact','analysis'], 'sample-size':['soil','metrology'], 'soc-stock':['climate'],
    'water-balance-nrw':['hydraulics'], 'ccme-wqi':['metrology'], 'water-weighted-index':['metrology'],
    'water-load':['wastewater'], 'water-pollution-mixing':['wastewater'], 'water-footprint':['sustainability'],
    'water-conservation':['sustainability','energy'], 'lake-trophic-state':['ecology'], 'ocean-carbonate':['climate'],
    'seawater-density':['membranes'], 'environmental-oceanography':['hydraulics'],
    'retention-time':['water','wastewater'], 'tank-geometries':['water','wastewater'],
    'municipal-design-flow':['water'], 'rain-harvest-volume':['water'],
    'water-plant-energy-profile':['water','wastewater'], 'liquid-water-properties':['water','industrial-water'],
    'pump-duty-power':['hydraulics'], 'blower-duty-power':['wastewater','industrial-water'],
    'environmental-physics':['hydraulics'], 'environmental-geology':['hydraulics'], 'agricultural-impact':['water','impact'],
    'overflow-rate':['wastewater'], 'stokes-settling':['wastewater'], 'removal-efficiency':['wastewater'],
    'first-order-decay':['wastewater'], 'water-ion-balance':['industrial-water','metrology'],
    'oxygen-water-saturation':['wastewater','ecology'], 'ammonia-water-equilibrium':['wastewater'],
    'water-acid-speciation':['metrology'], 'calcite-saturation-indices':['industrial-water'],
    'carbonate-water-stability':['industrial-water','membranes'],
    'disinfection-contact-ct':['wastewater'], 'uv-disinfection-dose':['wastewater'],
    'contact-tank-residual-design':['wastewater'], 'uv-reactor-bank-design':['wastewater'],
    'clarifier-duty-screen':['wastewater'], 'clarifier-solids-loading':['water'],
    'granular-filter-bank':['wastewater'], 'granular-bed-headloss':['hydraulics'],
    'filter-backwash-expansion':['wastewater'], 'filter-hydraulic-loading':['water'],
    'wastewater-headworks-sizing':['water','hydraulics','membranes'], 'wastewater-residuals-balance':['waste','water'],
    'water-evidence-comparison':['industrial-water','metrology'], 'daf-air-solids-screen':['wastewater'],
    'source-water-design-data':['analysis','metrology'], 'high-purity-sampling-plan':['metrology'],
    'mixing-velocity-gradient':['wastewater'], 'jar-test-coagulation-design':['wastewater'],
    'chemical-dosing-stock':['wastewater','industrial-water'], 'chemical-feed-storage-duty':['industrial-water','wastewater'],
    'metal-oxidation-sludge':['wastewater'], 'water-ph-titration-dose':['wastewater','metrology'],
    'plant-network-balance':['wastewater','industrial-water'], 'stream-blending':['wastewater','industrial-water'],
    'post-ro-co2-conditioning':['membranes'], 'carbonate-pure-water-co2':['water'],
    'swro-energy-recovery':['energy'], 'membrane-two-solute-design':['industrial-water'],
    'ufmf-train-cycle-sizing':['water','wastewater'], 'ion-exchange-softening':['water'],
    'ion-exchange-equivalent-sizing':['water'], 'cooling-tower-cycles':['water','energy'],
    'boiler-blowdown-balance':['energy'], 'microbial-growth-biodegradation':['water'],
    'forest-carbon-stock':['ecology'], 'ecosystem-services-value':['sustainability'],
    'environmental-resource-performance':['climate'], 'life-cycle-inventory':['impact'],
    'environmental-policy-appraisal':['impact'], 'sustainable-development-targets':['impact'],
    'green-building-leed':['energy'], 'environmental-monitoring-plan':['analysis','impact'],
    'environmental-toxicology-dose':['impact','safety'], 'environmental-health-burden':['impact'],
    'improvement-project-roi':['energy'], 'plant-oee-availability':['water','wastewater'],
    'water-specific-energy':['water','membranes'], 'pump-measured-efficiency':['hydraulics'],
    'industrial-water-intensity':['industrial-water'], 'chemical-cost-intensity':['industrial-water','wastewater'],
    'heat-exchanger-effectiveness':['industrial-water'], 'hydraulic-capacity-utilization':['water','wastewater'],
    'alkalinity-fractionation-pm':['industrial-water','metrology'], 'cooling-tower-water-losses':['energy'],
    'boiler-blowdown-quality-limit':['energy'], 'tds-conductivity-estimate':['industrial-water','membranes'],
    'chlorine-active-dose':['wastewater'], 'aerator-surface-field-power':['energy'],
    'settling-column-sst-capture':['water'], 'wastewater-project-flows':['hydraulics'],
    'building-energy-audit':['climate','sustainability'], 'electricity-tariff-comparison':['sustainability'],
    'energy-equipment-budget':['sustainability'],
    'fishway-hydraulic-screen':['hydraulics'], 'pond-aerator-oxygen-balance':['water'],
    'cropland-nitrate-leaching':['water'], 'mbr-process-membrane-sizing':['membranes'],
    'streeter-phelps-river-oxygen':['wastewater'], 'river-discharge-mixing-limit':['water'],
    'bankfull-channel-screen':['ecology'], 'glacier-elevation-mass-balance':['hydraulics'],
    'urban-heat-island-scenario':['health'], 'landfill-methane-deposition-series':['air','energy'],
    'direct-air-capture-net':['energy'], 'amine-co2-absorber-screen':['air'],
    'seawater-desalination-technology':['energy','industrial-water'],
    'cylindrical-atmospheric-icing':['climate'], 'tsunami-solitary-wave-runup':['hydraulics'],
    'avalanche-alpha-beta-profile':['spatial']
  };

  G.classificationChanges=[];
  const assigned=new Set();
  for(const [suite,ids] of Object.entries(primary)) {
    for(const id of ids) {
      const tool=G.getTool(id);
      if(!tool||assigned.has(id))throw new Error('Clasificación inválida para '+id);
      assigned.add(id);
      if(tool.suite!==suite)G.classificationChanges.push({id,title:tool.title,from:tool.suite,to:suite});
      tool.suite=suite;
      if(tool.lab)tool.lab.suite=suite;
    }
  }
  for(const id of Object.keys(related))if(!G.getTool(id))throw new Error('Relación sin herramienta: '+id);
  for(const tool of G.tools) {
    tool.relatedSuites=related[tool.id]||[];
    if(!G.suites[tool.suite]||tool.relatedSuites.some(s=>s===tool.suite||!G.suites[s]))
      throw new Error('Categoría inválida para '+tool.id);
  }
  for(const entry of G.catalogue||[]) {
    const tool=G.getTool(entry.id);
    if(tool){entry.suite=tool.suite;entry.relatedSuites=tool.relatedSuites;}
  }

  const order=['soil','water','wastewater','hydraulics','membranes','industrial-water','waste','air','energy','climate',
    'ecology','impact','sustainability','health','safety','noise','metrology','conversion','decision','analysis','spatial','population'];
  G.suites=Object.fromEntries(order.map(id=>[id,G.suites[id]]));
})();
