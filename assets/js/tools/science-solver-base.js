/* Registro común de las implementaciones ambientales originales. */
(function () {
  'use strict';
  const G=GL,L=G.lab;
  const sources=new Map();
  function reg(id,slug,suite,title,fields,method,calc,limit,refs=[]) {
    L.register({id,suite,title,fields,method,calc,limit,
      refs:[...refs],tags:['Cálculo local','Método explícito']});
    sources.set(slug,id);
  }
  function matrix(a,width,test,message) {
    L.assert(a.length&&a.every(r=>r.length===width&&test(r)),message);
    return a;
  }
  const nonnegative=r=>r.every(x=>x>=0);
  const positive=x=>Number.isFinite(x)&&x>0;
  const metric=(label,value,unit='')=>[label,value,unit];
  const result=(metrics,headers,rows)=>({metrics,headers,rows});
  const field=(key,label,unit,value,min=0,max)=>L.f(key,label,unit,value,min,max);
  const pct=(key,label,value)=>field(key,label,'%',value,0,100);
  const integer=(value,label)=>L.assert(Number.isInteger(value),label+' debe ser entero.');
  function weighted(a,limit=100) {
    matrix(a,2,r=>nonnegative(r)&&r[0]<=limit,'Usa puntajes de 0 a '+limit+' y pesos no negativos.');
    const total=L.sum(a.map(r=>r[1]));
    L.assert(positive(total),'La suma de pesos debe ser positiva.');
    return {value:L.sum(a.map(r=>r[0]*(r[1]/total))),rows:a.map(([score,w],i)=>[i+1,score,w/total,score*w/total])};
  }
  G.solverScience={reg,sources,matrix,nonnegative,positive,metric,result,field,pct,integer,weighted};
})();
