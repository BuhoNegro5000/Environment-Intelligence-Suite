/* Correspondencias entre las fichas ambientales de NovaSolver y las rutas locales. */
(function () {
  'use strict';
  const G=GL;
  const entries=[
    ["activated-sludge-modeling", "Activated Sludge CSTR Simulator", "activated-sludge-monod-cstr"],
    ["air-quality-dispersion", "Gaussian Plume Air Quality Dispersion Model", "gaussian-plume", "Perfil gaussiano, ascenso de Briggs, estabilidad y concentración en receptor."],
    ["air-quality-index-aqi", "Air Quality Index (AQI) Simulator", "epa-air-quality-index"],
    ["air-quality", "Air Quality Index (AQI) Calculator", "air-quality-index", "ICA de partículas y comparación de concentraciones con referencias ECA y OMS."],
    ["arsenic-removal-fe-oxide", "Arsenic Removal by Iron Oxide Adsorption Simulator", "iron-media-arsenic-adsorption"],
    ["biofilter-trickling", "Trickling Filter / Biofilter Design Simulator", "trickling-filter-loading"],
    ["biofilter-vocs-residence-time", "Biofilter VOC Removal & EBRT Residence Time Simulator", "voc-biofilter-bed"],
    ["bioretention-cell-stormwater", "Bioretention Cell Stormwater Design Simulator", "bioretention-event-balance"],
    ["carbon-footprint", "Carbon Footprint Calculator", "household-carbon-footprint", "Inventario anual por actividad y factor, con desglose por hogar y persona."],
    ["carbon-neutrality-calc", "Carbon Neutrality Calculator", "net-zero-emissions-path"],
    ["cleanroom-air-change-recovery", "Cleanroom Air Change Recovery Simulator", "cleanroom-particle-recovery"],
    ["co2-capture-amine-absorber-design", "CCS Amine CO₂ Absorber Design Simulator", "amine-co2-absorber-screen"],
    ["co2-emissions", "CO2 Emissions & Life Cycle Assessment Tool", "life-cycle-inventory", "Inventario de GEI, agua y energía por etapa y unidad funcional.", [["net-zero-emissions-path", "Abrir trayectoria de reducción"]]],
    ["coagulation-flocculation-g-value", "Coagulation Flocculation G Value Simulator", "mixing-velocity-gradient", "Gradiente de velocidad, tiempo de mezcla y parámetro G·t."],
    ["constructed-wetland-treatment", "Constructed Wetland Wastewater Treatment Simulator", "treatment-wetland-area"],
    ["desalination-energy-recovery", "Desalination Energy Recovery Simulator", "swro-energy-recovery", "Consumo específico de ósmosis inversa con recuperación de presión y balance de caudales."],
    ["direct-air-capture-dac", "Direct Air Capture (DAC) CO₂ Removal Simulator", "direct-air-capture-net"],
    ["fish-passage-velocity-barrier", "Fish Passage Velocity Barrier Simulator", "fishway-hydraulic-screen"],
    ["fish-pond-aerator-dissolved-oxygen", "Fish Pond Aerator Dissolved Oxygen Simulator", "pond-aerator-oxygen-balance"],
    ["fishery-msy-stock-assessment", "Fishery MSY Stock Assessment Simulator", "fishery-surplus-production"],
    ["forest-biomass-allometric", "Forest Biomass Allometric Equation Simulator", "forest-tree-allometry"],
    ["gaussian-plume", "Gaussian Plume Simulator — Atmospheric Dispersion Model", "gaussian-plume", "Concentración a sotavento con estabilidad, reflexión en suelo y ascenso de pluma."],
    ["glacier-mass-balance-equilibrium", "Glacier Mass Balance & ELA Simulator", "glacier-elevation-mass-balance"],
    ["greenhouse-effect", "Greenhouse Effect Simulator", "greenhouse-radiative-forcing"],
    ["greenhouse-gas", "Greenhouse Gas Emissions & CO₂ Equivalent Calculator", "ghg-co2e", "Conversión a CO₂e con factores IPCC AR6 para CO₂, CH₄, N₂O y SF₆."],
    ["indoor-radon-mitigation-cmc", "Indoor Radon Concentration & Mitigation Simulator", "indoor-radon-ventilation"],
    ["landfill-gas-generation-lfg", "LandGEM Landfill Gas Production Simulator", "landfill-methane-deposition-series"],
    ["lifecycle-assessment-lca", "Cradle-to-Grave LCA Simulator", "life-cycle-inventory", "Balance del ciclo de vida por unidad funcional y factores por etapa."],
    ["membrane-filtration-mwco", "Membrane Filtration (MF/UF/NF/RO) MWCO Simulator", "membrane-mwco-curve"],
    ["nitrogen-fertilizer-leaching", "Nitrogen Fertilizer Leaching to Groundwater Simulator", "cropland-nitrate-leaching"],
    ["ozone-depletion-cfc-ods", "Ozone Depletion & ODS Simulator", "ozone-depleting-stock-scenario"],
    ["ozone-treatment-water-cao", "Ozone Water Treatment Simulator — AOP, Bromate & CAO Contactor Sizing", "ozone-pilot-bromate-screen"],
    ["ozone-uv-disinfection", "Ozone & UV Disinfection (CT, IT) Simulator", "ozone-generator-contact", "Compara CT de ozono con un objetivo documentado. La comprobación UV usa capacidad por reactor y transmitancia validadas.", [["uv-reactor-bank-design", "Abrir reactores UV"]]],
    ["rainfall-runoff-scs-cn", "SCS Curve Number Rainfall-Runoff Simulator", "curve-number-runoff"],
    ["rainwater-harvesting", "Rainwater Harvesting Simulator", "rainwater-storage-simulation"],
    ["river-pollutant-dilution", "River Pollutant Dilution Simulator", "river-discharge-mixing-limit"],
    ["saltwater-icing-power-line", "Saltwater Atmospheric Icing on Power Lines & Ships Simulator", "cylindrical-atmospheric-icing"],
    ["seawater-desalination", "Seawater Desalination Simulator", "seawater-desalination-technology"],
    ["snow-avalanche-runout-alpha-beta", "Snow Avalanche α-β Runout Distance Simulator", "avalanche-alpha-beta-profile"],
    ["snowmelt-degree-day", "Snowmelt Degree-Day Method Simulator", "snowmelt-swe-balance"],
    ["soybean-germination-temperature-rate", "Soybean Germination Rate Temperature & Moisture Model", "soybean-emergence-thermal-time"],
    ["stormwater-runoff-rational", "Stormwater Runoff (Rational Method) Simulator", "rational-drain-capacity"],
    ["stream-restoration-bankful", "Stream Restoration & Bankfull Discharge Simulator", "bankfull-channel-screen"],
    ["swimming-pool-chlorine-decay-cti", "Swimming Pool Chlorine Decay & CT Value Simulator", "pool-chlorine-residual-decay"],
    ["tank-roof-floating-rim-seal-emission", "Floating Roof Tank Rim Seal VOC Emission Simulator", "floating-roof-rim-seal-loss"],
    ["tornado-debris-launch-ef-rating", "Tornado Debris Launch & EF Rating Simulator", "tornado-debris-force-screen"],
    ["tsunami-runup-height", "Tsunami Run-up Height Prediction Simulator", "tsunami-solitary-wave-runup"],
    ["urban-heat-island-uhi", "Urban Heat Island (UHI) Intensity Simulator", "urban-heat-island-scenario"],
    ["wastewater-mbr-bioreactor", "Membrane Bioreactor (MBR) Wastewater Design Simulator", "mbr-process-membrane-sizing"],
    ["wastewater-uv-disinfection-fluence", "Wastewater UV Disinfection Fluence Simulator", "uv-reactor-bank-design", "Dimensiona el banco con la curva validada de UVT y caudal para una fluencia objetivo, con reserva y potencia."],
    ["water-quality-do-bod", "River DO/BOD Water Quality Simulator", "streeter-phelps-river-oxygen"],
    ["water-treatment", "Water Treatment Calculator", "jar-test-coagulation-design", "Dosificación a partir de ensayos, filtración granular y verificación del contacto con desinfectante en módulos enlazados.", [["granular-filter-bank", "Abrir filtros granulares"], ["contact-tank-residual-design", "Abrir contacto con desinfectante"]]],
    ["wet-scrubber-efficiency", "Wet Venturi Scrubber Particle Removal Simulator", "venturi-scrubber-grade"],
    ["wind-chill-calculator", "Wind Chill Calculator", "environmental-meteorology", "Sensación por viento con los límites de la ecuación NWS, más humedad y punto de rocío."],
    ["wind-driven-rain-facade", "Wind-Driven Rain Facade Loading Simulator", "facade-wind-driven-rain"]
  ];
  G.novaCatalogue=entries.map(([slug,sourceTitle,id,existingScope,links=[]],i)=>{
    const tool=G.getTool(id);
    const suite=slug==='wastewater-uv-disinfection-fluence'?'wastewater':tool.suite;
    const relatedTools=links.map(([relatedId,label])=>['#/tool/'+relatedId,label]);
    const relatedSuites=[...new Set([
      ...tool.relatedSuites,
      ...links.map(([relatedId])=>G.getTool(relatedId).suite),
      tool.suite
    ])].filter(id=>id!==suite);
    return {catalogueNumber:i+1,id,title:tool.title,suite,relatedSuites,
      route:'#/tool/'+id,sourceUrl:G.nova.base+slug+'.html',sourceTitle,relatedTools,
      status:existingScope?'Herramienta existente':'Implementación nueva',scope:existingScope||tool.lab.method};
  });
})();
