/* Archivo portable e inventario IndexedDB del laboratorio espacial. */
(function () {
  'use strict';
  const G=GL,A=G.lab.assert;
  const format='green-owl-spatial';
  const defaults={filter:'',basemap:true};
  const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const types={Point:0,MultiPoint:1,LineString:1,MultiLineString:2,Polygon:2,MultiPolygon:3};
  let database;

  function validateFeatures(features) {
    A(Array.isArray(features)&&features.length>0&&features.length<=1000,'Usa de 1 a 1000 entidades por capa.');
    let count=0;
    function coordinates(value,depth) {
      A(Array.isArray(value)&&value.length>0,'La geometría está vacía o es inválida.');
      if (depth) {value.forEach(part=>coordinates(part,depth-1));return;}
      A(value.length>=2&&value.every(Number.isFinite)&&Math.abs(value[0])<=180&&Math.abs(value[1])<=90,
        'Se requieren coordenadas WGS84 [longitud, latitud] válidas.');
      A(++count<=30000,'Máximo 30 000 vértices por capa.');
    }
    function line(coords) {
      A(coords.length>=2,'Una línea necesita al menos dos vértices.');
    }
    function polygon(rings) {
      for (const ring of rings) {
        const first=ring[0],last=ring.at(-1);
        A(ring.length>=4&&first[0]===last[0]&&first[1]===last[1],'Los anillos de un polígono deben estar cerrados.');
      }
    }
    for (const f of features) {
      A(isObject(f)&&typeof f.name==='string'&&isObject(f.props)&&isObject(f.geometry),'Entidad inválida.');
      const {type,coordinates:coords}=f.geometry;
      A(Object.hasOwn(types,type),'Geometría no compatible.');
      coordinates(coords,types[type]);
      if(type==='LineString') line(coords);
      if(type==='MultiLineString') coords.forEach(line);
      if(type==='Polygon') polygon(coords);
      if(type==='MultiPolygon') coords.forEach(polygon);
      const b=G.geo.bbox(coords);
      A(b[2]-b[0]<=180,'Divide las geometrías que cruzan el antimeridiano antes de importarlas.');
    }
  }

  function make(name,layers=[],log=[],settings=defaults) {
    return {id:crypto.randomUUID(),name,layers,log,settings:{...defaults,...settings},updated:new Date().toISOString(),revision:0};
  }

  function decode(text) {
    const data=JSON.parse(text);
    A(data?.format===format&&data.version===1,'Selecciona un proyecto Green Owl Spatial v1 (.gowl).');
    const {name,layers,log,settings}=data.project||{};
    A(typeof name==='string'&&name.trim()&&name.length<=100&&Array.isArray(layers)&&layers.length<=12,'Nombre o capas de proyecto inválidos.');
    for (const layer of layers) {
      A(isObject(layer)&&typeof layer.name==='string'&&typeof layer.visible==='boolean','Capa de proyecto inválida.');
      validateFeatures(layer.features);
    }
    A(Array.isArray(log)&&log.length<=200&&log.every(item=>isObject(item)&&typeof item.action==='string'&&
      typeof item.detail==='string'&&typeof item.date==='string'&&Number.isFinite(Date.parse(item.date))),'Bitácora inválida.');
    A(isObject(settings)&&typeof settings.filter==='string'&&typeof settings.basemap==='boolean','Preferencias de proyecto inválidas.');
    return make(name.trim(),layers,log,{filter:settings.filter,basemap:settings.basemap});
  }

  function openDatabase() {
    database ||= new Promise((resolve,reject)=>{
      const request=indexedDB.open('green-owl-spatial',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('projects',{keyPath:'id'});
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
      request.onblocked=()=>reject(new Error('Cierra la otra pestaña que está actualizando el almacén de proyectos.'));
    }).catch(error=>{database=null;throw error;});
    return database;
  }

  async function transact(mode,operation) {
    const db=await openDatabase();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('projects',mode),store=tx.objectStore('projects');
      let result, failure;
      tx.oncomplete=()=>resolve(result);
      tx.onabort=()=>reject(failure||tx.error||new Error('La operación de almacenamiento se canceló.'));
      operation(store,value=>{result=value;},error=>{failure=error;tx.abort();});
    });
  }

  const list=()=>transact('readonly',(store,done)=>{
    const request=store.getAll();
    request.onsuccess=()=>done(request.result.sort((a,b)=>b.updated.localeCompare(a.updated)));
  });
  const get=id=>transact('readonly',(store,done)=>{
    const request=store.get(id);
    request.onsuccess=()=>done(request.result);
  });
  function save(project,previousRevision) {
    return transact('readwrite',(store,done,fail)=>{
      const read=store.get(project.id);
      read.onsuccess=()=>{
        if (read.result?.revision!==previousRevision) {
          fail(new Error('El proyecto cambió en otra pestaña. Vuelve a abrirlo para trabajar sobre la versión guardada.'));
          return;
        }
        const next={...project,updated:new Date().toISOString(),revision:(previousRevision??0)+1};
        store.put(next);
        done(next);
      };
    });
  }
  function remove(project) {
    return transact('readwrite',(store,done,fail)=>{
      const read=store.get(project.id);
      read.onsuccess=()=>{
        if (read.result?.revision!==project.revision) {
          fail(new Error('El proyecto cambió en otra pestaña. Vuelve a abrirlo antes de eliminarlo.'));
          return;
        }
        store.delete(project.id);
        done();
      };
    });
  }
  function csvPoints(text,xLabel,yLabel) {
    const {headers,rows}=G.parseCSV(text);
    A(new Set(headers).size===headers.length&&headers.every(Boolean),'El CSV necesita encabezados únicos.');
    const find=(label,aliases)=>label?headers.find(h=>h.toLowerCase()===label.toLowerCase()):
      headers.find(h=>aliases.includes(h.toLowerCase()));
    const x=find(xLabel,['longitud','longitude','lon','lng','x']);
    const y=find(yLabel,['latitud','latitude','lat','y']);
    A(x&&y&&x!==y,'Indica dos encabezados de coordenadas. Ejemplo: longitud y latitud.');
    A(rows.length>0&&rows.length<=1000,'El CSV debe tener de 1 a 1000 filas.');
    return rows.map((row,i)=>{
      try {
        const coords=[G.lab.number(row[x]),G.lab.number(row[y])];
        return {name:row.nombre||row.name||row.id||'Punto '+(i+1),props:row,geometry:{type:'Point',coordinates:coords}};
      } catch (_) {throw new Error('Fila de datos '+(i+1)+': coordenadas inválidas.');}
    });
  }

  G.spatialProjects={validateFeatures,make,decode,list,get,save,remove,csvPoints,
    encode:project=>JSON.stringify({format,version:1,project:{name:project.name,layers:project.layers,log:project.log,settings:project.settings}},null,2)};
})();
