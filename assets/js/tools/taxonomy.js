/* BirdNET+ Taxonomy v0.5-Nov2026 · CC BY-SA 4.0. */
(function () {
  'use strict';
  const G=GL,E=G.escape;
  const normal=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const identifiers=[
    ['BirdNET','birdnet_id'],['GBIF','gbif_id','https://www.gbif.org/species/'],
    ['iNaturalist','inat_id','https://www.inaturalist.org/taxa/'],['eBird','ebird_code','https://ebird.org/species/'],
    ['NCBI','ncbi_id','https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id='],
    ['Wikidata','wikidata_qid','https://www.wikidata.org/wiki/'],['Avibase','avibase_id','https://avibase.bsc-eoc.org/species.jsp?avibaseid='],
    ['BirdLife','birdlife_id'],['Macaulay Library','ml_taxon_code'],['Xeno-canto','xc_name'],['Observation.org','observationorg_id']
  ];
  const languageNames=new Intl.DisplayNames(['es'],{type:'language'});
  const languageLabel=key=>languageNames.of(key.slice(12).replace('_','-'));
  const commonName=(r,key)=>r[key]||r.common_name_es||r.common_name||r.scientific_name;
  const link=(label,url)=>'<a class="btn sm" href="'+E(url)+'" target="_blank" rel="noopener noreferrer">'+E(label)+' ↗</a>';
  let loading, searchIndex;
  function loadTaxonomy() {
    if (G.taxonomy) return Promise.resolve(G.taxonomy);
    loading ||= new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='assets/data/taxonomy.js';
      script.onload=()=>G.taxonomy?resolve(G.taxonomy):reject(new Error('El archivo de taxonomía está incompleto.'));
      script.onerror=()=>reject(new Error('No se pudo cargar el archivo local de taxonomía.'));
      document.head.appendChild(script);
    }).catch(error=>{loading=null;throw error;});
    return loading;
  }
  function photo(r) {
    const url=r.avicommons_image_url||r.image_url;
    if (!url) return null;
    const parsed=new URL(url);
    if (parsed.protocol!=='https:'||!['static.avicommons.org','birdnet.cornell.edu'].includes(parsed.hostname)) return null;
    return {url,credit:[r.avicommons_image_url?r.avicommons_image_author:r.image_author,
      r.avicommons_image_url?r.avicommons_image_license:r.image_license,r.avicommons_image_url?'Avicommons':r.image_source].filter(Boolean).join(' · ')};
  }
  G.tool({
    id:'taxonomy',suite:'ecology',title:'Explorador de especies y taxonomía',
    desc:'Busca y compara nombres multilingües, alias, imágenes e identificadores de biodiversidad.',
    tags:['BirdNET Taxonomy','18 093 registros locales'],
    html() {
      return '<div class="panel" role="status">Cargando taxonomía local…</div>';
    },
    workspace() {
      const groups=[...new Set(G.taxonomy.map(r=>r.taxon_group).filter(Boolean))].sort();
      const languages=[...new Set(G.taxonomy.flatMap(r=>Object.keys(r).filter(k=>k.startsWith('common_name_')&&!k.endsWith('_alt')&&!k.endsWith('_aliases'))))]
        .sort((a,b)=>languageLabel(a).localeCompare(languageLabel(b),'es'));
      return '<div class="lab-workbench"><div class="lab-banner"><div><h2>Explorador de especies</h2><p>Consulta nombres, imágenes e identificadores de BirdNET Taxonomy.</p></div><img class="lab-brandmark" src="'+G.brandData+'" alt="Yupana" width="104" height="104"></div>'+
        '<section class="panel"><div class="catalog-controls"><label class="field"><span>Nombre, alias o identificador</span><input id="taxQuery" type="search" placeholder="Ej. colibrí, Vultur gryphus, BN00001"></label>'+
        '<label class="field"><span>Grupo taxonómico</span><select id="taxGroup"><option value="">Todos</option>'+groups.map(g=>'<option>'+E(g)+'</option>').join('')+'</select></label>'+
        '<label class="field"><span>Idioma de los nombres</span><select id="taxLanguage">'+languages.map(k=>'<option value="'+E(k)+'" '+(k==='common_name_es'?'selected':'')+'>'+E(languageLabel(k))+'</option>').join('')+'</select></label></div>'+
        '<p id="taxCount" role="status"></p><div id="taxRows"></div><div class="lab-data-actions"><button class="btn" id="taxPrev">← Anterior</button><span id="taxPage"></span><button class="btn" id="taxNext">Siguiente →</button><button class="btn" id="taxCSV">↓ CSV de coincidencias</button></div></section>'+
        '<section class="panel"><h2>Comparación de especies</h2><div id="taxCompare"></div></section><section class="panel"><p>BirdNET+ Taxonomy v0.5-Nov2026 · CC BY-SA 4.0. Las imágenes se cargan desde su proveedor cuando pulsas Ver imagen.</p>'+link('Fuente de datos','https://birdnet.cornell.edu/taxonomy/download')+'</section></div>';
    },
    async mount(root) {
      this._report=null;
      this._exportTaxonomy=null;
      const loadingPanel=root.firstElementChild;
      try {await loadTaxonomy();} catch (error) {
        if (!loadingPanel.isConnected) return;
        loadingPanel.textContent=error.message+' ';
        const retry=document.createElement('button');
        retry.className='btn';retry.textContent='Reintentar';
        retry.onclick=()=>{retry.disabled=true;this.mount(root);};
        loadingPanel.appendChild(retry);
        return;
      }
      if (!loadingPanel.isConnected) return;
      root.innerHTML=this.workspace();
      G.restoreInputs(this.id,root);
      const el=id=>root.querySelector('#'+id),size=30,selected=new Map(),photos=new Set();
      searchIndex ||= G.taxonomy.map(r=>normal(Object.entries(r).filter(([k])=>!k.includes('image')).map(([,v])=>v).join(' ')));
      let page=0,filtered=[];
      const columns=()=>[['Nombre científico','scientific_name'],['Nombre en el idioma elegido',el('taxLanguage').value],
        ['Nombre original','common_name'],['Alias científicos','scientific_name_aliases'],['Alias comunes','common_name_aliases'],['Grupo','taxon_group'],...identifiers];
      const comparison=()=>{
        const records=[...selected.values()];
        return records.length?G.lab.tableHTML(['Campo',...records.map(r=>r.scientific_name)],columns().map(([label,key])=>[label,...records.map(r=>r[key]||'—')])):'<p>Selecciona hasta cuatro especies.</p>';
      };
      const render=()=>{
        const query=normal(el('taxQuery').value).trim().split(/\s+/),group=el('taxGroup').value,language=el('taxLanguage').value;
        filtered=G.taxonomy.filter((r,i)=>(!group||r.taxon_group===group)&&query.every(word=>searchIndex[i].includes(word)));
        page=Math.max(0,Math.min(page,Math.ceil(filtered.length/size)-1));
        el('taxCount').textContent=filtered.length+' coincidencias de '+G.taxonomy.length+' registros';
        el('taxPage').textContent='Página '+(page+1)+' de '+Math.max(1,Math.ceil(filtered.length/size));
        el('taxPrev').disabled=page===0;el('taxNext').disabled=(page+1)*size>=filtered.length;
        el('taxRows').innerHTML=filtered.slice(page*size,(page+1)*size).map(r=>{
          const image=photo(r),id=E(r.birdnet_id);
          const refs=identifiers.filter(([,key,url])=>url&&r[key]).map(([label,key,url])=>link(label,url+encodeURIComponent(r[key]))).join(' ');
          const imageView=image&&photos.has(r.birdnet_id)?'<figure><img data-taxon-photo src="'+E(image.url)+'" alt="'+E(r.scientific_name)+'" loading="lazy" referrerpolicy="no-referrer" style="max-width:100%;max-height:240px;border-radius:8px"><figcaption>'+E(image.credit)+' · '+link('Abrir fuente',image.url)+'</figcaption></figure>':'';
          return '<article class="panel"><small>'+E(r.taxon_group)+' · '+id+'</small><h3><i>'+E(r.scientific_name)+'</i></h3><p>'+E(commonName(r,language))+'</p>'+
            '<div class="lab-data-actions">'+refs+'<button class="btn sm" data-compare="'+id+'" aria-pressed="'+selected.has(r.birdnet_id)+'">'+(selected.has(r.birdnet_id)?'Quitar comparación':'Comparar')+'</button>'+
            (image?'<button class="btn sm" data-photo="'+id+'" aria-expanded="'+photos.has(r.birdnet_id)+'">'+(photos.has(r.birdnet_id)?'Ocultar imagen':'Ver imagen')+'</button>':'')+'</div>'+imageView+'</article>';
        }).join('')||'<div class="note">No se encontraron coincidencias.</div>';
        el('taxRows').querySelectorAll('[data-taxon-photo]').forEach(img=>img.addEventListener('error',()=>{
          const message=document.createElement('p');message.textContent='El proveedor no pudo entregar esta imagen.';img.replaceWith(message);
        }));
        el('taxCompare').innerHTML=comparison();
        this._report={title:this.title,inputs:[['Búsqueda',el('taxQuery').value],['Grupo',group||'Todos'],['Idioma',languageLabel(language)]],
          results:[['Coincidencias',String(filtered.length),'registros']],extra:comparison(),notes:['BirdNET+ Taxonomy v0.5-Nov2026 · CC BY-SA 4.0']};
      };
      el('taxRows').onclick=e=>{
        const button=e.target.closest('button');
        if (!button) return;
        const {compare,photo:id}=button.dataset;
        if (id) {
          if (photos.has(id)) photos.delete(id); else photos.add(id);
        } else if (compare) {
          if (selected.has(compare)) selected.delete(compare);
          else if (selected.size<4) selected.set(compare,filtered.find(r=>r.birdnet_id===compare));
          else {G.toast('Máximo cuatro especies en la comparación.','warn');return;}
        }
        render();
        if (id||compare) el('taxRows').querySelector('[data-'+(id?'photo':'compare')+'="'+CSS.escape(id||compare)+'"]')?.focus();
      };
      const reset=()=>{page=0;render();};
      el('taxQuery').oninput=G.debounce(reset,180);
      el('taxGroup').onchange=reset;
      el('taxLanguage').onchange=render;
      el('taxPrev').onclick=()=>{page--;render();};
      el('taxNext').onclick=()=>{page++;render();};
      this._exportTaxonomy=()=>G.csvDownload('Yupana_taxonomia_BirdNET_v0.5.csv',filtered.map(r=>
        Object.fromEntries(columns().map(([label,key])=>[label,r[key]||'']))));
      el('taxCSV').onclick=()=>this.csv();
      render();
    },
    report(){return this._report;},
    csv(){this._exportTaxonomy?.();}
  });
})();
