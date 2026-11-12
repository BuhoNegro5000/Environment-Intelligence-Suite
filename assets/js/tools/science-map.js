/* Laboratorio espacial nativo. Leaflet visualiza, Turf analiza y Proj4js transforma. */
(function () {
  'use strict';
  const G=GL, L=G.lab, A=L.assert, E=G.escape, geo=G.geo, P=G.spatialProjects, LF=window.L;
  const fallbackCenter=[4.6,-74.1];
  const demo=()=>[{name:'Muestreo de ejemplo',visible:true,source:'EPSG:4326',features:[
    {name:'Punto A',props:{tipo:'muestreo',valor:12},geometry:{type:'Point',coordinates:[-77.04,-12.04]}},
    {name:'Punto B',props:{tipo:'muestreo',valor:18},geometry:{type:'Point',coordinates:[-77.02,-12.06]}},
    {name:'Área de estudio',props:{tipo:'área'},geometry:{type:'Polygon',coordinates:[[[-77.06,-12.08],[-77.00,-12.08],[-77.00,-12.02],[-77.06,-12.02],[-77.06,-12.08]]]}}
  ]}];
  const buttons=(id,label)=>'<button type="button" class="btn sm" id="'+id+'">'+label+'</button>';
  const stamp=(action,detail)=>({date:new Date().toISOString(),action,detail});
  const feature=f=>({type:'Feature',properties:f.props,geometry:f.geometry});
  const areas=f=>turf.area(feature(f));
  const lengths=f=>turf.length(feature(f),{units:'meters'});
  const escOption=(value,label)=>'<option value="'+E(value)+'">'+E(label)+'</option>';
  const tool={
    id:'spatial-workbench',suite:'spatial',title:'Laboratorio espacial · proyectos y análisis vectorial',
    desc:'Gestiona proyectos locales, analiza capas vectoriales y conserva la bitácora de cada resultado.',
    tags:['GeoJSON · CSV · KML · SHP','Leaflet · Turf · Proj4js','Sin conexión'],
    html(){
      return '<div class="lab-workbench spatial-workspace">'+
      '<section class="panel spatial-project"><div class="spatial-project-heading"><div><h2>Proyectos espaciales</h2><p id="mapSaveState" role="status">Abriendo almacenamiento local…</p></div><img src="assets/img/green-owl-labs-mark.png" alt="Green Owl Labs" width="48" height="48"></div>'+
      '<div class="spatial-project-fields"><label class="field"><span>Proyecto activo</span><select id="mapProject"></select></label><label class="field"><span>Nombre del proyecto</span><input id="mapProjectName" maxlength="100"></label>'+buttons('mapRename','Guardar nombre')+'</div>'+
      '<div class="lab-data-actions">'+buttons('mapNew','Nuevo proyecto')+buttons('mapDelete','Eliminar proyecto')+buttons('mapUndo','Deshacer')+buttons('mapRedo','Rehacer')+
      '<label class="btn sm">Abrir .gowl<input id="mapOpenProject" type="file" accept=".gowl,.json" hidden></label>'+buttons('mapExportProject','Exportar .gowl')+'</div></section>'+
      '<div class="spatial-main"><section class="panel spatial-stage"><div class="spatial-map-header"><div><h2>Mapa</h2><p id="mapStatus" role="status"></p></div>'+buttons('mapFit','Ajustar vista')+'</div>'+
      '<div class="spatial-map-actions"><label><input id="mapBasemap" type="checkbox" checked> Mapa base</label>'+
      buttons('mapDistance','Distancia')+buttons('mapArea','Área')+buttons('mapFinish','Finalizar')+buttons('mapClearMeasure','Borrar trazado')+'</div>'+
      '<div id="mapView" class="spatial-map" aria-label="Mapa de capas y mediciones"></div><p id="mapMeasure" role="status" class="spatial-measure">Elige Distancia o Área para medir sobre el mapa.</p><div id="mapMetrics" class="lab-metrics"></div></section>'+
      '<aside class="panel spatial-controls"><h2>Capas y análisis</h2><div class="lab-data-actions"><label class="btn sm">Importar capas<input id="mapFiles" type="file" accept=".geojson,.json,.csv,.kml,.shp,.dbf,.prj" multiple hidden></label>'+buttons('mapDemo','Cargar ejemplo')+'</div>'+
      '<details class="map-settings"><summary>Coordenadas y CRS de importación</summary><label class="field"><span>CRS de origen</span><select id="mapImportCRS"><option value="EPSG:4326">WGS84 · longitud/latitud</option><option value="EPSG:3857">Web Mercator · metros</option><option value="utmN">UTM WGS84 · norte</option><option value="utmS">UTM WGS84 · sur</option><option value="prj">Archivo .prj</option><option value="custom">Definición PROJ o WKT</option></select></label><label class="field"><span>Zona UTM · 1 a 60</span><input id="mapUTMZone" value="18" inputmode="numeric"></label><label class="field"><span>Definición PROJ/WKT propia</span><textarea id="mapCRSDefinition" rows="2"></textarea></label><label class="field"><span>Columna X del CSV (opcional)</span><input id="mapCsvX" placeholder="longitud, lon o x"></label><label class="field"><span>Columna Y del CSV (opcional)</span><input id="mapCsvY" placeholder="latitud, lat o y"></label></details>'+
      '<div id="mapLayers"></div><label class="field"><span>Filtrar por nombre o atributo</span><input id="mapFilter" type="search" placeholder="Escribe un valor o nombre"></label>'+
      '<div class="lab-data-actions">'+buttons('mapFilterLayer','Guardar filtro como capa')+buttons('mapExport','Exportar GeoJSON')+'</div>'+
      '<details class="map-settings"><summary>Entidad seleccionada</summary><label class="field"><span>Radio del buffer (m)</span><input id="mapRadius" value="500" inputmode="decimal"></label><div class="lab-data-actions">'+buttons('mapBuffer','Crear buffer')+buttons('mapCentroid','Crear centroide')+'</div></details>'+
      '<details class="map-settings"><summary>Operaciones entre capas poligonales</summary><label class="field"><span>Capa A</span><select id="mapLayerA"></select></label><label class="field"><span>Capa B</span><select id="mapLayerB"></select></label><label class="field"><span>Operación</span><select id="mapOperation"><option value="intersection">Intersección A ∩ B</option><option value="union">Unión A ∪ B</option><option value="difference">Diferencia A − B</option></select></label>'+buttons('mapOverlay','Crear capa de resultado')+'</details>'+
      '<details class="map-settings"><summary>Unión espacial de puntos con polígonos</summary><p class="map-hint">Elige arriba la capa A de puntos y la capa B de polígonos.</p>'+buttons('mapJoin','Cruzar puntos A con polígonos B')+'</details></aside></div>'+
      '<section class="panel spatial-results"><div class="lab-data-actions" aria-label="Resultados">'+buttons('mapTabTable','Tabla de datos')+buttons('mapTabChart','Gráficos')+buttons('mapTabLog','Bitácora')+'</div><div id="mapTable"></div><div id="mapCharts" hidden><label class="field"><span>Atributo numérico</span><select id="mapChartField"></select></label><div id="mapChartBody"></div></div><div id="mapLog" hidden></div></section>'+
      '<details class="lab-method panel"><summary>Método y formatos</summary><div class="lab-method-content"><p>GeoJSON, KML, SHP con sus archivos auxiliares y CSV de puntos con encabezados. El mapa usa Web Mercator y guarda las geometrías en WGS84. Las mediciones son esféricas. El centroide puede quedar fuera de polígonos cóncavos.</p><p>El mapa base Natural Earth de 1:110 millones ofrece contexto regional sin conexión. Para geometrías que cruzan el antimeridiano, divide la entidad antes de importarla. El archivo .gowl incluye capas, bitácora y preferencias. Deshacer y rehacer están disponibles durante la sesión del proyecto.</p></div></details></div>';
    },
    mount(root) {
      const el=id=>root.querySelector('#'+id);
      const layout=el('mapView');
      const map=LF.map(layout,{preferCanvas:true,minZoom:1,maxZoom:22}).setView(fallbackCenter,4);
      map.attributionControl.setPrefix(false);
      LF.control.scale({imperial:false}).addTo(map);
      const resize=new ResizeObserver(()=>map.invalidateSize({pan:false}));resize.observe(layout);
      let chart;
      const disconnect=new MutationObserver(()=>{
        if(layout.isConnected) return;
        resize.disconnect();disconnect.disconnect();chart?.destroy();map.remove();
      });
      disconnect.observe(document.body,{childList:true,subtree:true});
      map.createPane('contexto').style.zIndex=250;
      const base=LF.geoJSON({type:'MultiPolygon',coordinates:G.spatialBasemap},{
        interactive:false,pane:'contexto',attribution:'Natural Earth · 1:110m',
        style:{weight:1,color:'#829d8c',fillColor:'#779886',fillOpacity:.28}
      });
      const vectors=LF.featureGroup().addTo(map);
      const tracing=LF.featureGroup().addTo(map);
      const rowsPerPage=100;
      let project,projects=[],previous=[],next=[],visible=[],selected=null,busy=false,tab='Table',measure=null,tablePage=0;
      this._csv=null;this._report=null;

      function run(action) {
        return async event=>{
          if(busy) return;
          busy=true;root.setAttribute('aria-busy','true');
          try {await action(event);}
          catch(error){if(layout.isConnected){el('mapSaveState').textContent=error.message;G.toast(error.message,'warn');}}
          finally {busy=false;if(layout.isConnected) root.removeAttribute('aria-busy');}
        };
      }
      function records() {
        return project.layers.flatMap((layer,li)=>layer.visible?layer.features.map((f,fi)=>({f,li,key:li+':'+fi})):[]);
      }
      const matches=(record,query)=>!query||(record.f.name+' '+JSON.stringify(record.f.props)).toLowerCase().includes(query);
      function filtered() {return records().filter(record=>matches(record,el('mapFilter').value.trim().toLowerCase()));}
      function focusRecord(key) {
        selected=selected===key?null:key;
        if(selected) tablePage=Math.floor(visible.findIndex(r=>r.key===selected)/rowsPerPage);
        render(false);
      }
      function fitMap() {
        const bounds=vectors.getBounds();
        if(bounds.isValid()) map.fitBounds(bounds,{padding:[32,32],maxZoom:17,animate:false});
        else map.setView(fallbackCenter,4,{animate:false});
      }
      function updateMap(fit) {
        if(project.settings.basemap&&!map.hasLayer(base)) base.addTo(map);
        if(!project.settings.basemap&&map.hasLayer(base)) base.remove();
        vectors.clearLayers();
        const ordered=visible.slice().sort((a,b)=>Number(/Point/.test(a.f.geometry.type))-Number(/Point/.test(b.f.geometry.type)));
        for(const record of ordered) {
          const active=record.key===selected,color=active?'#f9cc77':G.palette[record.li%G.palette.length];
          const style={color,weight:active?4:2,fillColor:color,fillOpacity:active?.34:.20};
          LF.geoJSON(feature(record.f),{
            style:()=>style,pointToLayer:(_,latlng)=>LF.circleMarker(latlng,{...style,radius:active?8:5,fillOpacity:.9}),
            onEachFeature:(_,layer)=>layer.on('click',event=>{
              if(measure?.active) return;
              LF.DomEvent.stopPropagation(event);
              focusRecord(record.key);
            })
          }).addTo(vectors);
        }
        if(fit) fitMap();
      }
      function renderTable() {
        const headers=[...new Set(visible.flatMap(r=>Object.keys(r.f.props)))];
        const text=value=>value!==null&&typeof value==='object'?JSON.stringify(value):String(value??'');
        const lastPage=Math.max(0,Math.ceil(visible.length/rowsPerPage)-1);
        tablePage=Math.max(0,Math.min(tablePage,lastPage));
        const start=tablePage*rowsPerPage;
        const rows=visible.slice(start,start+rowsPerPage).map(r=>'<tr class="'+(r.key===selected?'map-selected':'')+'"><td><button type="button" class="btn sm" data-select="'+r.key+'" aria-pressed="'+(r.key===selected)+'" aria-label="Seleccionar '+E(r.f.name)+'">'+(r.key===selected?'●':'○')+'</button></td>'+
          [project.layers[r.li].name,r.f.name,r.f.geometry.type,...headers.map(h=>r.f.props[h])].map(value=>'<td>'+E(text(value))+'</td>').join('')+'</tr>').join('');
        const paging=lastPage?'<div class="lab-data-actions"><button type="button" class="btn sm" data-page="-1" '+(!tablePage?'disabled':'')+'>Anterior</button><span>Filas '+(start+1)+' a '+Math.min(start+rowsPerPage,visible.length)+' de '+visible.length+'</span><button type="button" class="btn sm" data-page="1" '+(tablePage===lastPage?'disabled':'')+'>Siguiente</button></div>':'';
        el('mapTable').innerHTML=rows?'<div class="lab-table-scroll"><table class="lab-table"><thead><tr>'+['Selección','Capa','Nombre','Geometría',...headers].map(h=>'<th>'+E(h)+'</th>').join('')+'</tr></thead><tbody>'+rows+'</tbody></table></div>'+paging:'<p>Las entidades visibles aparecerán en esta tabla.</p>';
      }
      function renderMetrics() {
        const s=visible.find(r=>r.key===selected);
        const totalArea=L.sum(visible.map(r=>areas(r.f)));
        const metrics=s?[[s.f.name,s.f.geometry.type,'Selección'],['Área',areas(s.f),'m²'],['Longitud / perímetro',lengths(s.f),'m']]:
          [['Entidades visibles',visible.length,''],['Suma de áreas',totalArea,'m²']];
        el('mapMetrics').innerHTML=metrics.map(([label,value,unit])=>'<div class="lab-metric"><span>'+E(label)+'</span><strong>'+E(typeof value==='number'?G.fmt(value,2):value)+'</strong><small>'+E(unit)+'</small></div>').join('');
        this._csv=visible.map(r=>({capa:project.layers[r.li].name,nombre:r.f.name,tipo:r.f.geometry.type,
          area_m2:areas(r.f),longitud_m:lengths(r.f),atributos:JSON.stringify(r.f.props)}));
        this._report={title:this.title,inputs:[['Proyecto',project.name],['Filtro',el('mapFilter').value]],
          results:[['Entidades visibles',String(visible.length),''],['Suma de áreas',G.fmt(totalArea,2),'m²']],
          extra:logTable(),notes:['Vista EPSG:3857. Geometrías WGS84. Mediciones esféricas. Las áreas visibles se suman incluso si se superponen.']};
      }
      const logTable=()=>L.tableHTML(['Fecha','Operación','Detalle'],project.log.slice().reverse().map(item=>
        [new Date(item.date).toLocaleString('es'),item.action,item.detail]));
      const renderMetricsBound=renderMetrics.bind(this);
      function valueOf(value) {
        if(typeof value==='number') return Number.isFinite(value)?value:null;
        if(typeof value!=='string'||!value.trim()) return null;
        try {return L.number(value);} catch (_) {return null;}
      }
      function renderChart() {
        if(tab!=='Chart') return;
        chart?.destroy();
        const select=el('mapChartField'),field=select.value;
        const fields=[...new Set(visible.flatMap(r=>Object.entries(r.f.props).filter(([,v])=>valueOf(v)!==null).map(([name])=>name)))];
        select.innerHTML=fields.map(name=>escOption(name,name)).join('');
        if(fields.includes(field)) select.value=field;
        const values=visible.map(r=>valueOf(r.f.props[select.value])).filter(v=>v!==null);
        if(!values.length){el('mapChartBody').innerHTML='<p>La vista actual no tiene atributos numéricos.</p>';return;}
        const min=Math.min(...values),max=Math.max(...values),n=min===max?1:Math.min(20,Math.ceil(Math.sqrt(values.length)));
        const width=n===1?1:(max-min)/n,counts=Array(n).fill(0);
        values.forEach(v=>counts[Math.min(n-1,Math.floor((v-min)/width))]++);
        el('mapChartBody').innerHTML='<p>'+values.length+' valores · Media '+G.fmt(G.stat.mean(values),3)+' · Mediana '+G.fmt(G.stat.median(values),3)+'</p><div class="lab-chart"><canvas aria-label="Histograma de '+E(select.value)+'" role="img"></canvas></div>';
        chart=G.chart(el('mapChartBody').querySelector('canvas'),{type:'bar',
          series:[{name:select.value,data:counts.map((count,i)=>[Number((n===1?min:min+(i+.5)*width).toPrecision(5)),count])}],
          x:{label:select.value},y:{label:'Frecuencia'}});
      }
      function render(fit=true) {
        if(!layout.isConnected) return;
        visible=filtered();
        if(!visible.some(r=>r.key===selected)) selected=null;
        el('mapLayers').innerHTML=project.layers.map((layer,i)=>'<div class="map-layer"><label><input type="checkbox" data-layer="'+i+'" '+(layer.visible?'checked':'')+'> '+E(layer.name)+' <small>'+layer.features.length+(layer.source?' · '+E(layer.source):'')+'</small></label><button type="button" class="btn sm" data-remove="'+i+'" aria-label="Quitar '+E(layer.name)+'">×</button></div>').join('')||'<p class="map-hint">Importa una capa o carga el ejemplo.</p>';
        for(const id of ['mapLayerA','mapLayerB']) {
          const select=el(id),prior=select.value;
          select.innerHTML=project.layers.map((layer,i)=>escOption(i,layer.name)).join('');
          select.value=prior!==''&&Number(prior)<project.layers.length?prior:(id==='mapLayerB'&&project.layers.length>1?'1':'0');
        }
        el('mapStatus').textContent=visible.length+' entidades · '+project.layers.filter(l=>l.visible).length+' capas visibles · EPSG:3857';
        updateMap(fit);renderTable();renderMetricsBound();renderChart();
        el('mapLog').innerHTML=project.log.length?logTable():'<p>La bitácora se completa al importar, medir o crear resultados.</p>';
      }
      function showProject() {
        if(!layout.isConnected) return;
        el('mapProject').innerHTML=projects.map(p=>escOption(p.id,p.name+' · '+p.layers.length+' capas')).join('');
        el('mapProject').value=project.id;
        el('mapProjectName').value=project.name;
        el('mapBasemap').checked=project.settings.basemap;
        el('mapUndo').disabled=!previous.length;
        el('mapRedo').disabled=!next.length;
        el('mapSaveState').textContent='Guardado en este navegador';
      }
      function remember(p) {
        projects=[p,...projects.filter(old=>old.id!==p.id)];
        G.store.set('map.active-project',p.id);
      }
      function activate(p) {
        if(!layout.isConnected) return;
        project=p;previous=[];next=[];selected=null;tablePage=0;
        el('mapFilter').value=p.settings.filter;
        el('mapLayerA').replaceChildren();el('mapLayerB').replaceChildren();
        clearMeasure();remember(p);showProject();render();
      }
      async function commit(patch,action,detail,fit=true) {
        const settings={...project.settings,filter:el('mapFilter').value,...patch.settings};
        const log=action?[...project.log,stamp(action,detail)].slice(-200):project.log;
        const saved=await P.save({...project,...patch,settings,log},project.revision);
        previous=[...previous,project].slice(-12);next=[];
        project=saved;remember(saved);showProject();render(fit);
      }
      async function travel(from,to) {
        if(!from.length) return;
        const snapshot=from.at(-1);
        const saved=await P.save(snapshot,project.revision);
        from.pop();to.push(project);project=saved;
        selected=null;el('mapFilter').value=saved.settings.filter;clearMeasure();
        remember(saved);showProject();render();
      }
      async function layerResult(name,features,action,detail,source='EPSG:4326') {
        A(project.layers.length<12,'Máximo 12 capas por proyecto.');
        P.validateFeatures(features);
        await commit({layers:[...project.layers,{name,features,visible:true,source}]},action,detail);
      }

      function sourceCRS(files,kind,config) {
        if(kind==='kml') return 'EPSG:4326';
        if(config.crs==='utmN'||config.crs==='utmS') {
          const zone=L.number(config.zone);
          A(Number.isInteger(zone)&&zone>=1&&zone<=60,'Zona UTM entera entre 1 y 60.');
          return 'EPSG:'+((config.crs==='utmS'?32700:32600)+zone);
        }
        if(config.crs==='prj') {
          const prj=files.find(f=>/\.prj$/i.test(f.name));
          A(prj,'Adjunta un .prj con el mismo nombre de la capa.');
          return prj.text();
        }
        if(config.crs==='custom') {
          A(config.definition,'Ingresa una definición PROJ o WKT.');
          return config.definition;
        }
        return config.crs;
      }
      async function importLayers(files) {
        if(!files.length) return;
        A(files.every(f=>f.size<=5_000_000),'Máximo 5 MB por archivo.');
        const mains=files.filter(f=>/\.(geojson|json|csv|kml|shp)$/i.test(f.name));
        A(mains.length&&project.layers.length+mains.length<=12,'Selecciona capas válidas. Máximo 12 por proyecto.');
        const config={crs:el('mapImportCRS').value,zone:el('mapUTMZone').value,definition:el('mapCRSDefinition').value.trim(),
          x:el('mapCsvX').value.trim(),y:el('mapCsvY').value.trim()};
        const incoming=[];
        for(const file of mains) {
          const kind=file.name.split('.').at(-1).toLowerCase(), stem=file.name.slice(0,file.name.lastIndexOf('.')).toLowerCase();
          const parts=[file,...files.filter(f=>f!==file&&f.name.slice(0,f.name.lastIndexOf('.')).toLowerCase()===stem&&/\.(dbf|prj)$/i.test(f.name))];
          let features=kind==='csv'?P.csvPoints(await file.text(),config.x,config.y):(await geo.parseFiles(parts)).features;
          const crs=(await sourceCRS(parts,kind,config)).trim();
          if(crs!=='EPSG:4326') features=G.spatialOps.reproject(features,crs);
          P.validateFeatures(features);
          incoming.push({name:file.name,visible:true,features,source:crs});
        }
        await commit({layers:[...project.layers,...incoming]},'Importar capas',incoming.map(l=>l.name+' ('+l.features.length+' entidades)').join(', '));
      }
      function pair() {
        const a=project.layers[Number(el('mapLayerA').value)],b=project.layers[Number(el('mapLayerB').value)];
        A(a&&b&&a!==b,'Elige dos capas diferentes.');
        return [a,b];
      }
      function chosen() {
        const r=visible.find(record=>record.key===selected);
        A(r,'Selecciona una entidad en el mapa o en la tabla.');
        return r.f;
      }
      function clearMeasure() {
        measure=null;tracing.clearLayers();layout.classList.remove('is-measuring');
        map.doubleClickZoom.enable();
        el('mapFinish').disabled=true;
        el('mapMeasure').textContent='Elige Distancia o Área para medir sobre el mapa.';
      }
      function measurementValue() {
        const {mode,coords}=measure;
        if(mode==='distance') return coords.length>1?lengths({props:{},geometry:{type:'LineString',coordinates:coords}}):0;
        if(coords.length<3) return 0;
        return areas({props:{},geometry:{type:'Polygon',coordinates:[[...coords,coords[0]]]}});
      }
      function drawMeasure() {
        tracing.clearLayers();
        const points=measure.coords.map(([x,y])=>[y,x]);
        const style={color:'#ffc15b',weight:3,interactive:false};
        points.forEach(point=>LF.circleMarker(point,{...style,radius:4,fillOpacity:1}).addTo(tracing));
        if(measure.mode==='area'&&points.length>2) LF.polygon(points,style).addTo(tracing);
        else if(points.length>1) LF.polyline(points,style).addTo(tracing);
        const distance=measure.mode==='distance',need=distance?2:3;
        el('mapFinish').disabled=!measure.active||points.length<need;
        el('mapMeasure').textContent=(distance?'Distancia':'Área')+' · '+points.length+' vértices · '+G.fmt(measurementValue(),2)+' '+(distance?'m':'m²')+
          (measure.active?' · Marca vértices y pulsa Finalizar.':' · Medición guardada.');
      }
      function startMeasure(mode) {
        if(busy||!project) return;
        clearMeasure();measure={mode,coords:[],active:true};layout.classList.add('is-measuring');map.doubleClickZoom.disable();drawMeasure();
      }
      map.on('click',event=>{
        if(!measure?.active||busy) return;
        const {lng,lat}=event.latlng.wrap();
        const point=[lng,lat],last=measure.coords.at(-1);
        if(last&&geo.haversine(last,point)<.01) return;
        measure.coords.push(point);drawMeasure();
      });

      const initialize=run(async()=>{
        projects=await P.list();
        let active=projects.find(p=>p.id===G.store.get('map.active-project',null))||projects[0];
        if(!active) {
          const legacy=G.store.get('map.layers',null);
          active=await P.save(P.make(legacy?'Proyecto recuperado':'Muestreo de ejemplo',legacy||demo(),
            [stamp(legacy?'Recuperar capas':'Cargar ejemplo',legacy?'Capas conservadas de la versión anterior.':'Muestra de demostración.')]));
        }
        if(layout.isConnected) activate(active);
      });
      el('mapProject').onchange=run(async e=>{
        const p=await P.get(e.target.value);
        A(p,'El proyecto seleccionado ya no está disponible.');
        activate(p);
      });
      el('mapRename').onclick=run(async()=>{
        const name=el('mapProjectName').value.trim();
        A(name,'El nombre del proyecto está vacío.');
        if(name!==project.name) await commit({name},'Renombrar proyecto',name,false);
      });
      el('mapNew').onclick=run(async()=>activate(await P.save(P.make('Proyecto nuevo'))));
      el('mapDelete').onclick=run(async()=>{
        if(!confirm('¿Eliminar el proyecto «'+project.name+'» de este navegador?')) return;
        await P.remove(project);
        projects=await P.list();
        activate(projects[0]||await P.save(P.make('Proyecto nuevo')));
      });
      el('mapUndo').onclick=run(()=>travel(previous,next));
      el('mapRedo').onclick=run(()=>travel(next,previous));
      el('mapOpenProject').onchange=run(async e=>{
        const file=e.target.files[0];e.target.value='';
        if(!file) return;
        A(file.size<=80_000_000,'El proyecto supera 80 MB.');
        activate(await P.save(P.decode(await file.text())));
      });
      el('mapExportProject').onclick=run(()=>{
        const name=project.name.replace(/[^\p{L}\p{N}_.-]+/gu,'_');
        G.download(name+'.gowl',P.encode({...project,settings:{...project.settings,filter:el('mapFilter').value}}),'application/json');
      });
      el('mapFiles').onchange=run(async e=>{
        const files=Array.from(e.target.files);e.target.value='';
        await importLayers(files);
      });
      el('mapDemo').onclick=run(()=>layerResult(demo()[0].name,demo()[0].features,'Cargar ejemplo','Muestra de demostración.'));
      el('mapLayers').onchange=run(async e=>{
        const i=Number(e.target.dataset.layer);
        if(!Number.isInteger(i)) return;
        const layers=project.layers.map((layer,j)=>j===i?{...layer,visible:e.target.checked}:layer);
        try {await commit({layers},null,null);}
        catch(error){e.target.checked=project.layers[i].visible;throw error;}
      });
      const removeLayer=run(async e=>{
        const b=e.target.closest('[data-remove]');
        if(!b) return;
        const i=Number(b.dataset.remove);
        selected=null;
        await commit({layers:project.layers.filter((_,j)=>i!==j)},'Quitar capa',project.layers[i].name);
      });
      el('mapLayers').onclick=e=>{if(e.target.closest('[data-remove]')) removeLayer(e);};
      el('mapBasemap').onchange=run(async e=>{
        try {await commit({settings:{basemap:e.target.checked}},null,null,false);}
        catch(error){e.target.checked=project.settings.basemap;throw error;}
      });
      el('mapFilter').oninput=()=>{if(project){tablePage=0;render();}};
      el('mapFilterLayer').onclick=run(()=>{
        const query=el('mapFilter').value.trim();
        A(query&&visible.length,'Ingresa un filtro con coincidencias visibles.');
        const features=visible.map(r=>({...r.f,props:{...r.f.props,capa_origen:project.layers[r.li].name}}));
        return layerResult('Filtro · '+query,features,'Filtrar entidades',query+' · '+features.length+' coincidencias');
      });
      el('mapFit').onclick=fitMap;
      el('mapTable').onclick=e=>{
        const b=e.target.closest('[data-select]');
        const page=e.target.closest('[data-page]');
        if(b) focusRecord(b.dataset.select);
        if(page){tablePage+=Number(page.dataset.page);renderTable();}
      };
      el('mapBuffer').onclick=run(()=>{
        const f=chosen(),radius=L.number(el('mapRadius').value),out=G.spatialOps.buffer(f,radius);
        return layerResult(out.name,[out],'Buffer',f.name+' · '+radius+' m');
      });
      el('mapOverlay').onclick=run(async()=>{
        const [a,b]=pair(),op=el('mapOperation').value;
        const out=G.spatialOps.overlay(a.features,b.features,op);
        const detail=op+' · '+a.name+' / '+b.name;
        if(!out.length){await commit({},'Superposición sin resultado',detail,false);return;}
        return layerResult(out[0].name,out,'Superposición poligonal',detail);
      });
      el('mapJoin').onclick=run(()=>{
        const [a,b]=pair(),out=G.spatialOps.joinPoints(a.features,b.features);
        return layerResult(a.name+' en '+b.name,out,'Unión espacial',a.name+' → '+b.name);
      });
      el('mapCentroid').onclick=run(()=>{
        const f=chosen();
        A(['Polygon','MultiPolygon'].includes(f.geometry.type),'Selecciona un polígono.');
        const parts=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
        let total=0,x=0,y=0;
        for(const rings of parts) rings.forEach((ring,i)=>{
          const weight=Math.abs(geo.signedArea(ring))*(i?-1:1),c=geo.centroid(ring);
          total+=weight;x+=c[0]*weight;y+=c[1]*weight;
        });
        A(total>1e-14,'Área degenerada o huecos incompatibles.');
        const out={name:'Centroide '+f.name,props:{origen:f.name},geometry:{type:'Point',coordinates:[x/total,y/total]}};
        return layerResult(out.name,[out],'Centroide',f.name);
      });
      el('mapExport').onclick=run(()=>{
        const items=visible.filter(r=>!selected||r.key===selected);
        A(items.length,'No hay entidades para exportar.');
        G.download('GreenOwl_capas.geojson',geo.toGeoJSON(items.map(r=>r.f)),'application/geo+json');
      });
      el('mapDistance').onclick=()=>startMeasure('distance');
      el('mapArea').onclick=()=>startMeasure('area');
      el('mapClearMeasure').onclick=()=>{if(!busy)clearMeasure();};
      el('mapFinish').onclick=run(async()=>{
        const {mode,coords}=measure, distance=mode==='distance';
        const title=distance?'Distancia':'Área',value=measurementValue(),unit=distance?'m':'m²';
        const geometry=distance?{type:'LineString',coordinates:coords}:{type:'Polygon',coordinates:[[...coords,coords[0]]]};
        const f={name:'Medición de '+title.toLowerCase(),props:{valor:value,unidad:unit},geometry};
        P.validateFeatures([f]);
        A(value>0&&(distance||(!turf.kinks(feature(f)).features.length&&turf.booleanValid(feature(f)))),
          'El trazado es degenerado o se cruza. Borra el trazado y marca el perímetro de nuevo.');
        await layerResult(f.name,[f],title,G.fmt(value,2)+' '+unit);
        if(layout.isConnected){measure.active=false;tracing.clearLayers();layout.classList.remove('is-measuring');map.doubleClickZoom.enable();drawMeasure();}
      });
      for(const name of ['Table','Chart','Log']) el('mapTab'+name).onclick=()=>{
        tab=name;
        if(name!=='Chart'){chart?.destroy();chart=null;}
        el('mapTable').hidden=name!=='Table';el('mapCharts').hidden=name!=='Chart';el('mapLog').hidden=name!=='Log';
        ['Table','Chart','Log'].forEach(key=>el('mapTab'+key).setAttribute('aria-pressed',String(key===tab)));
        if(name==='Chart'&&project) renderChart();
      };
      el('mapChartField').onchange=renderChart;
      el('mapTabTable').setAttribute('aria-pressed','true');
      clearMeasure();initialize();
    },
    report(){return this._report;},
    csv(){if(this._csv?.length) G.csvDownload('GreenOwl_espacial.csv',this._csv);}
  };
  G.tool(tool);
})();
