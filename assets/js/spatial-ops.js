/* Motores locales Turf 7.4.0 (MIT) y Proj4js 2.22.0 (MIT). */
(function(){'use strict';const G=GL,A=G.lab.assert,O=G.spatialOps={};
for(let z=1;z<=60;z++){proj4.defs('EPSG:'+(32600+z),'+proj=utm +zone='+z+' +datum=WGS84 +units=m +no_defs');proj4.defs('EPSG:'+(32700+z),'+proj=utm +zone='+z+' +south +datum=WGS84 +units=m +no_defs');}
O.reproject=(features,source)=>features.map(f=>{const clone=JSON.parse(JSON.stringify(f));function transform(c){if(typeof c[0]==='number'){A(c.length>=2&&c.slice(0,2).every(Number.isFinite),'Coordenadas no numéricas.');const p=proj4(source,'EPSG:4326',c.slice(0,2));A(p.every(Number.isFinite),'Reproyección indefinida.');return p.concat(c.slice(2));}return c.map(transform);}clone.geometry.coordinates=transform(clone.geometry.coordinates);clone.props={...clone.props,origen_crs:source};return clone;});
const feature=f=>({type:'Feature',properties:{...f.props,name:f.name},geometry:f.geometry});
O.buffer=(f,radius)=>{A(Number.isFinite(radius)&&radius>0&&radius<=100000,'Radio entre 0 y 100 000 m.');const out=turf.buffer(feature(f),radius,{units:'meters',steps:32});A(out&&out.geometry,'No se pudo construir un buffer válido.');return {name:'Buffer '+f.name+' · '+radius+' m',props:{...out.properties,operacion:'buffer',radio_m:radius},geometry:out.geometry};};
O.overlay=(left,right,operation)=>{A(['intersection','union','difference'].includes(operation),'Operación desconocida.');A(left.length&&right.length,'Ambas capas deben contener polígonos.');const polys=features=>features.map(f=>{A(['Polygon','MultiPolygon'].includes(f.geometry.type),'Esta operación solo acepta capas poligonales.');const p=feature(f);A(turf.booleanValid(p),'Geometría inválida; corrígela antes de operar.');return p;});const collapse=features=>{const all=polys(features);return all.length===1?all[0]:turf.union(turf.featureCollection(all));},a=collapse(left),b=collapse(right),fc=turf.featureCollection([a,b]),result=operation==='intersection'?turf.intersect(fc):operation==='union'?turf.union(fc):turf.difference(fc);return result?[{name:{intersection:'Intersección',union:'Unión',difference:'Diferencia A−B'}[operation],props:{operacion:operation,metodo:'Turf 7.4.0',advertencia:'Verificar precisión y sistema de referencia.'},geometry:result.geometry}]:[];};
O.joinPoints=(points,polygons)=>{
  A(points.length&&points.every(f=>f.geometry.type==='Point'),'La capa A debe contener puntos simples.');
  A(polygons.length&&polygons.every(f=>['Polygon','MultiPolygon'].includes(f.geometry.type)),'La capa B debe contener polígonos.');
  const areas=polygons.map(f=>{
    const shape=feature(f);
    A(turf.booleanValid(shape),'La capa B contiene geometrías inválidas.');
    return {f,shape,bbox:turf.bbox(shape)};
  });
  return points.map(point=>{
    const [x,y]=point.geometry.coordinates, shape=feature(point);
    const matches=areas.filter(({bbox:[west,south,east,north],shape:polygon})=>
      x>=west&&x<=east&&y>=south&&y<=north&&turf.booleanPointInPolygon(shape,polygon));
    return {...point,props:{...point.props,union_espacial:{conteo:matches.length,
      coincidencias:matches.map(({f})=>({nombre:f.name,atributos:f.props}))}}};
  });
};
})();
