/* Registro de métodos de agua, química y proceso. */
(function () {
  'use strict';
  const G=GL,L=G.lab;
  const mappings=new Map();
  function reg(id,anchors,suite,title,fields,method,calc,limit,refs=[]) {
    L.register({id,suite,title,fields,method,calc,limit,refs:[...refs],tags:['Cálculo local','Método explícito']});
    for(const anchor of anchors) {
      if(mappings.has(anchor)) throw new Error('Referencia duplicada: '+anchor);
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
  G.pluto={mappings,reg,metric,metrics,field,pct,rows,g:9.80665,eps:1e-12};
})();
