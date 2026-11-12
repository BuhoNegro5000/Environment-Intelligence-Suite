/* Registro de métodos de agua inspirados en el catálogo público. */
(function () {
  'use strict';
  const G=GL,L=G.lab;
  const source='https://app.plutocalc.com/index-es.html';
  const mappings=new Map();
  function reg(id,anchors,suite,title,fields,method,calc,limit,refs=[]) {
    L.register({id,suite,title,fields,method,calc,limit,refs:[...refs,['Plutocalc · ficha de referencia',source+'#'+anchors[0]]],tags:['Cálculo local','Método explícito']});
    for(const anchor of anchors) {
      if(mappings.has(anchor)) throw new Error('Referencia Plutocalc duplicada: '+anchor);
      mappings.set(anchor,id);
    }
  }
  const metric=(label,value,unit='')=>[label,value,unit];
  const metrics=(...entries)=>({metrics:entries});
  const field=(key,label,unit,value,min=0,max)=>L.f(key,label,unit,value,min,max);
  const pct=(key,label,value,min=0,max=100)=>field(key,label,'%',value,min,max);
  function rows(a,count,predicate,message) {
    L.assert(a.length>0&&a.every(row=>row.length===count&&predicate(row)),message);
    return a;
  }
  G.pluto={source,mappings,reg,metric,metrics,field,pct,rows,g:9.80665,eps:1e-12};
})();
