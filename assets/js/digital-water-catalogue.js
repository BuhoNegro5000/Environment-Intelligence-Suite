/* Inventario de las 50 fichas públicas de Digital Water. */
(function(){
  'use strict';
  const G=GL;
  const registry=[
    ["roi-retorno-investimento-saneamento","ROI de Projetos","improvement-project-roi"],
    ["eficiencia-operacional-oee-eta-ete","Eficiência Operacional da ETE/ETA","plant-oee-availability"],
    ["consumo-energetico-especifico-cee-agua","Consumo Energético Específico (CEE)","water-specific-energy"],
    ["eficiencia-hidraulica-bombas","Eficiência de Bombeamento","pump-measured-efficiency"],
    ["pegada-hidrica-industrial-litros-unidade","Pegada Hídrica Industrial","industrial-water-intensity"],
    ["disponibilidade-uptime-equipamentos","Uptime e Confiabilidade","plant-oee-availability"],
    ["custo-quimico-tratamento-m3","Custo Químico por m³","chemical-cost-intensity"],
    ["previsao-vida-util-membranas","Forecasting de Membranas","membrane-normalized-flux-forecast"],
    ["geracao-lodo-especifica-kg-m3","Coeficiente de Geração de Lodo","sludge-specific-generation"],
    ["performance-termica-trocadores-calor","Eficácia Térmica (HE)","heat-exchanger-effectiveness"],
    ["carregamento-hidraulico-efetivo-eta","Eficiência de Carga Hidráulica","hydraulic-capacity-utilization"],
    ["indice-custo-manutencao-uptime","Índice de Custo de Manutenção","plant-oee-availability"],
    ["indice-langelier-lsi-agua","Índice LSI","calcite-saturation-indices"],
    ["indice-ryznar-rsi-estabilidade-agua","Índice RSI","calcite-saturation-indices"],
    ["alcalinidade-p-m-fracionamento","Alcalinidade (P e M)","alkalinity-fractionation-pm"],
    ["ciclos-concentracao-torre-resfriamento","Ciclos de Concentração","cooling-tower-water-losses"],
    ["capacidade-abrandador-troca-ionica","Capacidade Abrandador","ion-exchange-softening"],
    ["purga-caldeira-tds-silica","Purga de Caldeira","boiler-blowdown-quality-limit"],
    ["evaporacao-torre-resfriamento","Evaporação Torre","cooling-tower-water-losses"],
    ["arraste-gotas-torre-resfriamento","Arraste Torre","cooling-tower-water-losses"],
    ["vazao-retrolavagem-filtros-areia","Vazão Retrolavagem","granular-filter-bank"],
    ["recuperacao-osmose-reversa-recovery","Osmose Reversa (Recovery)","membrane-observed-recovery-rejection"],
    ["sdi-silt-density-index-membranas","SDI 15","silt-density-index/sdi15"],
    ["rejeicao-sais-osmose-reversa","Rejeição de Sais","membrane-observed-recovery-rejection"],
    ["fluxo-especifico-membranas-lmh","Fluxo Específico (Flux)","filter-hydraulic-loading/membrane"],
    ["relacao-f-m-lodos-ativados","Relação F/M","activated-sludge-operations"],
    ["idade-do-lodo-tempo-retencao-celular","Idade do Lodo","activated-sludge-operations"],
    ["indice-svi-decantabilidade-lodo","Índice SVI","activated-sludge-operations"],
    ["taxa-escoamento-superficial-decantadores-tes-tas","TES / TAS (Clarificação)","overflow-rate"],
    ["relacao-dbo-dqo-biodegradabilidade","Relação DBO/DQO","bod-cod"],
    ["potencia-aerador-superficial-efluentes","Potência Aerador","aerator-surface-field-power"],
    ["velocidade-sedimentacao-flocos","Velocidade de Sedimentação","settling-column-sst-capture/column"],
    ["dosagem-produtos-quimicos-agua","Dosagem Química","chemical-dosing-stock"],
    ["potencia-bomba-hidraulica-cv-kw","Potência Bomba","pump-duty-power"],
    ["volume-tanque-cilindrico-m3","Volume Tanque","tank-geometries/vertical"],
    ["velocidade-fluido-tubulacao-m-s","Velocidade Tubo","pipe-continuity-basis"],
    ["tempo-retencao-hidraulica-trh","Tempo de Retenção","retention-time"],
    ["conversao-unidades-dureza-agua","Conv. Dureza","unit-converter/waterHardness"],
    ["conversao-tds-condutividade-agua","TDS vs Cond.","tds-conductivity-estimate"],
    ["dosagem-cloro-hipoclorito-agua","Dosagem Cloro","chlorine-active-dose"],
    ["carga-poluente-diaria-efluentes","Carga Poluente Diária","water-load"],
    ["eficiencia-nitrificacao-nh3-n","Eficiência de Nitrificação","nitrification-nitrogen-balance"],
    ["carga-organica-volumetrica-cov-ete","Carga Orgânica Volumétrica (COV)","organic-reactor-loading-pe"],
    ["necessidade-oxigenio-aor-sor-sopradores","Necessidade de Oxigênio (AOR)","aerator-surface-field-power"],
    ["fluxo-limite-solidos-decantadores","Fluxo de Sólidos (GL)","clarifier-duty-screen"],
    ["populacao-equivalente-pe-carga-industrial","População Equivalente (PE)","organic-reactor-loading-pe"],
    ["vazoes-projeto-k1-k2-harmon","Vazões de Projeto (K1, K2)","wastewater-project-flows"],
    ["eficiencia-remocao-sst-decantadores","Eficiência de Sedimentação (SST)","settling-column-sst-capture/curve"],
    ["balanco-massa-dbo-dqo-remocao","Balanço de Massa (Remoção)","pollutant-process-mass-balance"],
    ["relacao-nutrientes-esgoto-cnp","Relação Nutrientes C:N:P","biological-carbon-nutrient-ratio"]
  ];
  const presets={
    'silt-density-index':{sdi15:{duration:'15'}},
    'filter-hydraulic-loading':{membrane:{shape:'membrane'}},
    'tank-geometries':{vertical:{shape:'vertical'}},
    'settling-column-sst-capture':{column:{mode:'column'},curve:{mode:'curve'}}
  };
  for(const [id,modes] of Object.entries(presets)){
    const definition=G.getTool(id).lab;
    definition.routeInputs={...definition.routeInputs,...modes};
  }
  G.digitalWaterCatalogue=registry.map(([slug,sourceTitle,route],i)=>{
    const [id]=route.split('/'),tool=G.getTool(id);
    if(!tool)throw new Error('Falta la herramienta de Digital Water: '+slug);
    return {catalogueNumber:i+1,id,title:tool.title,sourceTitle,suite:tool.suite,relatedSuites:tool.relatedSuites,
      route:'#/tool/'+route,sourceUrl:G.dw.base+'/calculadora-'+slug+'/',
      status:G.dw.tools.has(id)?'Implementación nueva':'Herramienta existente',scope:tool.desc};
  });
})();
