(function(){
  'use strict';
  const G=GL,L=G.lab,base='https://atlaswts.com/es/tools',mappings=new Map();
  function reg(id,keys,suite,title,fields,method,calc,limit,refs=[]){
    L.register({id,suite,title,fields,method,calc,limit,refs:[...refs,['AtlasWTS · ficha de referencia',keys[0].startsWith('soon-')?base:base+'/'+keys[0]]],
      tags:['Cálculo local','Ingeniería de agua']});
    for(const key of keys)mappings.set(key,id);
  }
  const m=(label,value,unit='')=>[label,value,unit];
  const out=(...metrics)=>({metrics});
  const table=(metrics,headers,rows)=>({metrics,headers,rows});
  const f=(key,label,unit,value,min=0,max)=>L.f(key,label,unit,value,min,max);
  const p=(key,label,value,min=0,max=100)=>f(key,label,'%',value,min,max);
  function check(a,n,fn,msg){L.assert(a.length>0&&a.every(r=>r.length===n&&fn(r)),msg);return a;}
  const nn=r=>r.every(x=>x>=0);
  const int=x=>Number.isSafeInteger(x);
  const load=(q,c)=>q*c/1000;
  G.atlas={base,mappings,reg,m,out,table,f,p,check,nn,int,load,eps:1e-10,g:9.80665};
})();
