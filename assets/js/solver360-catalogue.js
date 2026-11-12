/* Catálogo ambiental público de Solver360, consultado el 10 de noviembre de 2026. */
(function () {
  'use strict';
  const G=GL;
  const registry=[
  [
    "acid-rain-calculator",
    "Acid Rain Calculator"
  ],
  [
    "agricultural-impact-calculator",
    "Agricultural Impact Calculator"
  ],
  [
    "air-emissions-calculator",
    "Air Emissions Calculator"
  ],
  [
    "air-pollution-dispersion-calculator",
    "Air Pollution Dispersion Calculator"
  ],
  [
    "air-quality-index-calculator-environmental",
    "Air Quality Index Calculator"
  ],
  [
    "biodiversity-index-calculator",
    "Biodiversity Index Calculator"
  ],
  [
    "carbon-footprint-calculator",
    "Carbon Footprint Calculator"
  ],
  [
    "climate-change-impact-calculator",
    "Climate Change Impact Calculator"
  ],
  [
    "desertification-calculator",
    "Desertification Calculator"
  ],
  [
    "ecological-footprint-calculator",
    "Ecological Footprint Calculator"
  ],
  [
    "ecosystem-services-calculator",
    "Ecosystem Services Calculator"
  ],
  [
    "energy-efficiency-calculator",
    "Energy Efficiency Calculator"
  ],
  [
    "environmental-chemistry-calculator",
    "Environmental Chemistry Calculator"
  ],
  [
    "environmental-climatology-calculator",
    "Environmental Climatology Calculator"
  ],
  [
    "environmental-compliance-calculator",
    "Environmental Compliance Calculator"
  ],
  [
    "environmental-ecology-calculator",
    "Environmental Ecology Calculator"
  ],
  [
    "environmental-economics-calculator",
    "Environmental Economics Calculator"
  ],
  [
    "environmental-geology-calculator",
    "Environmental Geology Calculator"
  ],
  [
    "environmental-health-calculator",
    "Environmental Health Calculator"
  ],
  [
    "environmental-impact-assessment-calculator",
    "Environmental Impact Assessment Calculator"
  ],
  [
    "environmental-limnology-calculator",
    "Environmental Limnology Calculator"
  ],
  [
    "environmental-meteorology-calculator",
    "Environmental Meteorology Calculator"
  ],
  [
    "environmental-microbiology-calculator",
    "Environmental Microbiology Calculator"
  ],
  [
    "environmental-monitoring-calculator",
    "Environmental Monitoring Calculator"
  ],
  [
    "environmental-oceanography-calculator",
    "Environmental Oceanography Calculator"
  ],
  [
    "environmental-physics-calculator",
    "Environmental Physics Calculator"
  ],
  [
    "environmental-policy-impact-calculator",
    "Environmental Policy Impact Calculator"
  ],
  [
    "environmental-remediation-calculator",
    "Environmental Remediation Calculator"
  ],
  [
    "environmental-risk-assessment-calculator",
    "Environmental Risk Assessment Calculator"
  ],
  [
    "environmental-sustainability-calculator",
    "Environmental Sustainability Calculator"
  ],
  [
    "environmental-toxicology-calculator",
    "Environmental Toxicology Calculator"
  ],
  [
    "forest-carbon-calculator",
    "Forest Carbon Calculator"
  ],
  [
    "green-building-leed-calculator",
    "Green Building LEED Calculator"
  ],
  [
    "land-use-change-calculator",
    "Land Use Change Calculator"
  ],
  [
    "landfill-gas-calculator",
    "Landfill Gas Calculator"
  ],
  [
    "life-cycle-assessment-calculator",
    "Life Cycle Assessment Calculator"
  ],
  [
    "noise-pollution-calculator",
    "Noise Pollution Calculator"
  ],
  [
    "ocean-acidification-calculator",
    "Ocean Acidification Calculator"
  ],
  [
    "ozone-depletion-calculator",
    "Ozone Depletion Calculator"
  ],
  [
    "plastic-pollution-calculator",
    "Plastic Pollution Calculator"
  ],
  [
    "renewable-energy-calculator",
    "Renewable Energy Calculator"
  ],
  [
    "soil-erosion-calculator",
    "Soil Erosion Calculator"
  ],
  [
    "sustainable-development-calculator",
    "Sustainable Development Calculator"
  ],
  [
    "transportation-impact-calculator",
    "Transportation Impact Calculator"
  ],
  [
    "urban-heat-island-calculator",
    "Urban Heat Island Calculator"
  ],
  [
    "waste-management-calculator",
    "Waste Management Calculator"
  ],
  [
    "waste-reduction-calculator",
    "Waste Reduction Calculator"
  ],
  [
    "water-conservation-calculator",
    "Water Conservation Calculator"
  ],
  [
    "water-footprint-calculator",
    "Water Footprint Calculator"
  ],
  [
    "water-pollution-calculator",
    "Water Pollution Calculator"
  ],
  [
    "water-quality-index-calculator",
    "Water Quality Index Calculator"
  ]
];
  const existing={
    'air-quality-index-calculator-environmental':'air-quality-index',
    'air-pollution-dispersion-calculator':'gaussian-plume',
    'biodiversity-index-calculator':'diversity-community',
    'landfill-gas-calculator':'landfill-biogas'
  };
  G.solverCatalogue=registry.map(([slug,sourceTitle],i)=>{
    const prior=Object.hasOwn(existing,slug);
    const id=prior?existing[slug]:G.solverScience.sources.get(slug.replace(/-calculator$/,''));
    const tool=G.getTool(id);
    return {
      catalogueNumber:i+1,id,title:tool.title,sourceTitle,
      sourceUrl:'https://solver360.com/calculators/'+slug,
      suite:tool.suite,relatedSuites:tool.relatedSuites,route:'#/tool/'+id,
      status:prior?'Herramienta existente':'Implementación nueva',
      scope:tool.desc
    };
  });
})();
