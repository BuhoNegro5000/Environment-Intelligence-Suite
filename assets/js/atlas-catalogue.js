/* Inventario público AtlasWTS, consultado el 10 de noviembre de 2026. */
(function(){
  'use strict';
  const G=GL;
  const registry=[
    ["plant-water-mass-balance","Balance de agua y masa de la planta","water-treatment",true],
    ["plant-water-mass-balance?mode=wastewater","Balance hídrico y de masa de planta — extensión de red de aguas residuales","wastewater-treatment",true],
    ["wastewater-influent-basis","Base de diseño del afluente de aguas residuales","wastewater-treatment",true],
    ["source-water-design-basis","Base de diseño y variabilidad del agua bruta","water-treatment",true],
    ["bnr-matrix","BNRMatrix de Eliminación Biológica de Nutrientes","wastewater-treatment",true],
    ["cooling-tower-water-balance-lsi","Calculadora de Balance Hídrico de Torre de Enfriamiento y LSI","tanks",true],
    ["chemical-dosing-calculator","Calculadora de Base de Dosificación Química","chemistry",true],
    ["pipe-friction-calculator","Calculadora de Fricción en Tuberías y Caída de Presión","hydraulics",true],
    ["pneumatic-actuator-selector","Comparador de Par de Actuadores Neumáticos","mechanical-equipment",true],
    ["unit-converter","Convertidor de Unidades","utilities",true],
    ["ac-sizing","Dimensionamiento de Carbón Activado","adsorption",true],
    ["ion-exchange-cedi-designer","Dimensionamiento preliminar de intercambio iónico","chemistry",true],
    ["clarifier-designer?mode=secondary-wastewater","Diseñador de clarificadores — modo secundario de aguas residuales","wastewater-treatment",true],
    ["chlorine-chloramine-ct-residual?mode=wastewater","Diseñador de CT y residual de cloro / cloramina — extensión para aguas residuales","wastewater-treatment",true],
    ["uv-disinfection-designer?mode=wastewater","Diseñador de desinfección UV — extensión para aguas residuales","wastewater-treatment",true],
    ["wastewater-equalization-designer","Diseñador de Ecualización de Aguas Residuales","wastewater-treatment",true],
    ["granular-media-filter-designer?mode=wastewater-tertiary","Diseñador de filtros de medio granular — modo terciario de aguas residuales","wastewater-treatment",true],
    ["activated-sludge-designer","Diseñador de lodos activados","wastewater-treatment",true],
    ["water-treatment-residuals-sludge?mode=wastewater","Diseñador de lodos y residuos de aguas residuales","wastewater-treatment",true],
    ["wastewater-preliminary-treatment-designer","Diseñador de pretratamiento de aguas residuales","wastewater-treatment",true],
    ["industrial-physicochemical-pretreatment-designer","Diseñador de pretratamiento fisicoquímico industrial","wastewater-treatment",true],
    ["nf-system-designer","Diseñador de Sistemas NF","membranes",true],
    ["ro-system-designer","Diseñador de Sistemas RO","membranes",true],
    ["uf-mf-system-designer","Diseñador de Sistemas UF/MF","membranes",true],
    ["high-strength-anaerobic-treatment-designer","Diseñador de tratamiento anaerobio de aguas residuales de alta carga","wastewater-treatment",true],
    ["wtp-hydraulic-profile?mode=wastewater","Diseñador del perfil hidráulico y bombeo de aguas residuales","wastewater-treatment",true],
    ["clarifier-designer","Diseño de clarificadores","tanks",true],
    ["coagulation-flocculation-designer","Diseño de coagulación y floculación","chemistry",true],
    ["chlorine-chloramine-ct-residual","Diseño de CT y residual de cloro/cloraminas","chemistry",true],
    ["uv-disinfection-designer","Diseño de desinfección UV","water-treatment",true],
    ["chemical-feed-storage","Diseño de dosificación y almacenamiento de productos químicos","chemistry",true],
    ["granular-media-filter-designer","Diseño de filtros de medios granulares","water-treatment",true],
    ["daf-designer","Diseño de flotación por aire disuelto (DAF)","tanks",true],
    ["water-treatment-residuals-sludge","Diseño de residuos y lodos del tratamiento de agua","water-treatment",true],
    ["clearwell-storage-turnover","Diseño del depósito de agua tratada y renovación del agua almacenada","tanks",true],
    ["ozone-ct-calculator","Dosificación de Ozono y Cribado CT","chemistry",true],
    ["water-stability-carbonate-chemistry","Estabilidad del agua y química de carbonatos","chemistry",true],
    ["swro-energy-erd-screening","Evaluación de energía y ERD para SWRO","membranes",true],
    ["air-valve-layout","Evaluación Geométrica Preliminar de Válvulas de Aire","hydraulics",true],
    ["seawater-intake-screening-assessment","Evaluación preliminar de captación y cribado de agua de mar","water-treatment",true],
    ["isotherm-analyzer","Evaluación Preliminar de Isotermas","adsorption",true],
    ["ro-pretreatment-quality-sdi-assessment","Evaluación SDI de pretratamiento de OI","membranes",true],
    ["flux-matrix","FluxMatrix — Clarificación y Separación de Sólidos","wastewater-treatment",true],
    ["nutri-matrix","NutriMatrix — Nutrientes y Dosificación Química","wastewater-treatment",true],
    ["oxy-matrix","OxyMatrix — Ingeniería de aireación y transferencia de oxígeno","wastewater-treatment",true],
    ["pcfforge","PCFforge — Entorno de Trabajo de Topología de Tuberías","hydraulics",true],
    ["wtp-hydraulic-profile","Perfil hidráulico de una planta de tratamiento de agua","hydraulics",true],
    ["hpw-quality-sampling-basis-planner","Planificador de calidad y muestreo de agua de alta pureza","water-treatment",true],
    ["wastewater-effluent-reuse-discharge-review","Revisión de efluente, reúso y descarga de aguas residuales","wastewater-treatment",true],
    ["gac-breakthrough-bed-life","Ruptura del GAC y vida útil del lecho","adsorption",true],
    ["soon-post-ro","Base de acondicionamiento y desgasificación post-ósmosis inversa","membranes",false],
    ["soon-pipe-basis","Base de carga y diseño de tubería","hydraulics",false],
    ["soon-pfas-influent","Caracterización del afluente y evidencia de laboratorio para PFAS","water-treatment",false],
    ["soon-pfas-lead-lag","Configuración de recipientes PFAS en serie lead/lag","water-treatment",false],
    ["soon-cooling-makeup","Evidencia de calidad del agua de aporte de refrigeración","water-treatment",false],
    ["soon-pfas-monitoring","Registro de monitoreo observado y cambio de medio PFAS","water-treatment",false],
    ["soon-pipe-pressure","Revisión de evidencia de clase de presión de tuberías","hydraulics",false],
    ["soon-cooling-blowdown","Revisión de evidencia de purga de enfriamiento","water-treatment",false]
  ];
  const existing={
    'chemical-dosing-calculator':'chemical-dosing-stock',
    'unit-converter':'unit-converter',
    'wastewater-equalization-designer':'equalization-storage',
    'ro-pretreatment-quality-sdi-assessment':'silt-density-index'
  };
  const modes={
    'chlorine-chloramine-ct-residual':'potable',
    'chlorine-chloramine-ct-residual?mode=wastewater':'wastewater',
    'wastewater-effluent-reuse-discharge-review':'effluent',
    'soon-cooling-makeup':'makeup',
    'soon-cooling-blowdown':'blowdown'
  };
  const contextSuites={
    'plant-water-mass-balance':'water',
    'plant-water-mass-balance?mode=wastewater':'wastewater',
    'clarifier-designer':'water',
    'clarifier-designer?mode=secondary-wastewater':'wastewater',
    'chlorine-chloramine-ct-residual':'water',
    'chlorine-chloramine-ct-residual?mode=wastewater':'wastewater',
    'uv-disinfection-designer':'water',
    'uv-disinfection-designer?mode=wastewater':'wastewater',
    'granular-media-filter-designer':'water',
    'granular-media-filter-designer?mode=wastewater-tertiary':'wastewater',
    'water-treatment-residuals-sludge':'water',
    'water-treatment-residuals-sludge?mode=wastewater':'wastewater',
    'wtp-hydraulic-profile':'hydraulics',
    'wtp-hydraulic-profile?mode=wastewater':'wastewater',
    'wastewater-preliminary-treatment-designer':'wastewater',
    'seawater-intake-screening-assessment':'membranes',
    'wastewater-effluent-reuse-discharge-review':'wastewater',
    'soon-cooling-makeup':'industrial-water',
    'soon-cooling-blowdown':'industrial-water'
  };
  G.atlasCatalogue=registry.map(([key,sourceTitle,sourceGroup,available],i)=>{
    const added=G.atlas.mappings.get(key),id=added||existing[key],tool=G.getTool(id);
    if(!tool)throw new Error('Falta la ruta de AtlasWTS: '+key);
    const contextSuite=contextSuites[key];
    return {catalogueNumber:i+1,id,title:tool.title,sourceTitle,sourceGroup,suite:contextSuite||tool.suite,
      relatedSuites:contextSuite?[]:tool.relatedSuites,
      route:'#/tool/'+id+(modes[key]?'/'+modes[key]:''),
      sourceUrl:available?G.atlas.base+'/'+key:G.atlas.base,
      sourceStatus:available?'Disponible en AtlasWTS':'Anunciada en AtlasWTS',
      status:added?'Implementación nueva':'Herramienta existente',scope:tool.desc};
  });
  G.getTool('contact-tank-residual-design').lab.routeInputs={potable:{mode:'potable'},wastewater:{mode:'wastewater'}};
  G.getTool('water-evidence-comparison').lab.routeInputs={effluent:{context:'effluent'},makeup:{context:'makeup'},blowdown:{context:'blowdown'}};
})();
