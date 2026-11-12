(function () {
  'use strict';
  const G=GL,E=G.escape;
  const aliases={'geo-dd-dms':'Coordinate DD DMS Converter','gas-ppm':'Gas Concentration Converter','alkalinity':'Alkalinity Unit Converter','hilsenhoff-fbi':'Hilsenhoff Family Biotic Index','bmwp-aspt':'BMWP ASPT Calculator','bioacoustics':'Bioacoustics Lab BirdNET','taxonomy':'Species Taxonomy Explorer','biotic-workbench':'Biotic Assessment Workbench','biotic-library':'Biotic Reference Library','signal2':'SIGNAL2 OCP Profile'};
  const normalize=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  G.renderCatalogue=function(root,provider) {
    const collections=[
      ['envix','Envix',G.catalogue,'Herramientas de Green Owl Labs relacionadas con el catálogo de Envix.'],
      ['solver360','Solver360',G.solverCatalogue,'Herramientas ambientales de la colección Solver360 disponibles en Green Owl Labs.'],
      ['plutocalc','Plutocalc',G.plutoCatalogue,'Métodos de agua, hidráulica y operación de plantas evaluados para Green Owl Labs.'],
      ['atlaswts','AtlasWTS',G.atlasCatalogue,'Ingeniería de tratamiento de agua, equipos y procesos de la colección AtlasWTS.'],
      ['digital-water','Digital Water',G.digitalWaterCatalogue,'Indicadores de operación y cálculos de agua, membranas y efluentes de Digital Water.'],
      ['renwaves','RenWaves',G.renwavesCatalogue,'Calculadoras de generación, almacenamiento, edificios, recarga y costos energéticos.'],
      ['novasolver','NovaSolver',G.novaCatalogue,'Simuladores ambientales de agua, aire, clima, hidrología, ecosistemas y peligros naturales.']
    ];
    const [current,,registry,intro]=collections.find(([id])=>id===provider)||collections[0];
    const external=current!=='envix';
    const statuses=external?[['all','Todas'],['new','Implementaciones nuevas'],['existing','Herramientas existentes'],
      ...(current==='plutocalc'?[['excluded','Fuera de esta selección']]:[])]:
      [['all','Todos los estados'],['available','Con herramienta'],['verified','Alcance público comprobado'],['partial','Alcance parcial'],['missing','Falta implementar']];
    const categories=Object.values(G.suites).filter(suite=>registry.some(e=>e.suite===suite.id||e.relatedSuites?.includes(suite.id)));
    let group='all',query='',state='all';
    const links='<nav class="lab-data-actions" aria-label="Colecciones de referencia">'+
      collections.map(([id,label,entries])=>'<a class="btn '+(id===current?'primary':'')+'" href="#/catalogo'+(id==='envix'?'':'/'+id)+'" '+
        (id===current?'aria-current="page"':'')+'>'+label+' · '+entries.length+'</a>').join('')+
      '<a class="btn" href="#/tool/unit-converter">Conversor de unidades</a></nav>';
    root.innerHTML='<section class="lab-banner"><div><h1>Catálogo científico</h1><p>'+
      E(intro)+
      '</p></div><img class="lab-brandmark" src="assets/img/green-owl-labs-mark.png" alt="Green Owl Labs" width="104" height="104"></section>'+links+
      '<div class="catalog-controls"><label class="field"><span>Buscar herramienta</span><input id="catalogQuery" type="search" placeholder="Nombre o método"></label>'+
      '<label class="field"><span>Categoría</span><select id="catalogGroup"><option value="all">Todas</option>'+
      categories.map(s=>'<option value="'+E(s.id)+'">'+E(s.name)+'</option>').join('')+'</select></label>'+
      '<label class="field"><span>'+(external?'Integración':'Estado de revisión')+'</span><select id="catalogState">'+
      statuses.map(([id,label])=>'<option value="'+id+'">'+E(label)+'</option>').join('')+'</select></label></div>'+
      '<p id="catalogCount" role="status"></p><div class="catalog-cards" id="catalogCards"></div>';
    function matchesState(e) {
      if(state==='all') return true;
      const flags={available:Boolean(e.route),verified:e.status==='Implementada · alcance público comprobado',
        partial:e.status==='Alcance parcial',missing:!e.route,new:e.status==='Implementación nueva',existing:e.status==='Herramienta existente',
        excluded:e.status==='Fuera de esta selección'};
      return flags[state];
    }
    function render() {
      const list=registry.filter(e=>{
        const hay=normalize([e.title,e.id,e.sourceTitle||aliases[e.id]||'',e.catalogueNumber].join(' '));
        const category=group==='all'||e.suite===group||e.relatedSuites?.includes(group);
        return category&&query.split(/\s+/).every(w=>hay.includes(w))&&matchesState(e);
      });
      root.querySelector('#catalogCount').textContent=list.length+' de '+registry.length+' herramientas';
      root.querySelector('#catalogCards').innerHTML=list.map(e=>{
        const label=e.status==='Implementada · pendiente auditoría funcional comparativa'?'Revisión comparativa pendiente':e.status;
        const subtitle=e.sourceTitle||aliases[e.id]||'';
        return '<article class="panel catalog-card"><div><span class="lab-eyebrow">'+E(G.suites[e.suite].short)+'</span><span class="pill">'+E(label)+'</span></div>'+
          '<h2>'+E(e.title)+'</h2>'+(subtitle?'<small>'+E(subtitle)+'</small>':'')+'<p>'+E(e.scope)+'</p>'+
          (e.sourceStatus?'<small>'+E(e.sourceStatus)+'</small>':'')+'<div class="lab-data-actions">'+
          (e.route?'<a class="btn" href="'+E(e.route)+'">Abrir herramienta</a>':'')+
          (e.relatedTools||[]).map(([route,label])=>'<a class="btn sm" href="'+E(route)+'">'+E(label)+'</a>').join('')+
          (e.sourceUrl?'<a class="btn sm" href="'+E(e.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Ficha original ↗</a>':'')+'</div></article>';
      }).join('')||'<div class="panel">No hay coincidencias. Ajusta la búsqueda.</div>';
    }
    root.querySelector('#catalogQuery').oninput=e=>{query=normalize(e.target.value.trim());render();};
    root.querySelector('#catalogGroup').onchange=e=>{group=e.target.value;render();};
    root.querySelector('#catalogState').onchange=e=>{state=e.target.value;render();};
    render();
  };
})();
