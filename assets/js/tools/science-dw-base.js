/* Registro local de los métodos de Digital Water. */
(function(){
  'use strict';
  const G=GL,L=G.lab,base='https://www.digitalwater.com.br',tools=new Set();
  const f=(key,label,unit,value,min=0,max)=>L.f(key,label,unit,value,min,max);
  const p=(key,label,value,min=0,max=100)=>f(key,label,'%',value,min,max);
  const m=(label,value,unit='')=>[label,value,unit];
  const out=(...metrics)=>({metrics});
  function reg(id,suite,slug,title,fields,method,calc,limit,refs=[]){
    L.register({id,suite,title,fields,method,calc,limit,
      refs:[...refs,['Digital Water · ficha de referencia',base+'/calculadora-'+slug+'/']],
      tags:['Cálculo local','Operación y diseño']});
    tools.add(id);
  }
  function rows(a,n,test,message){L.assert(a.length>0&&a.every(r=>r.length===n&&test(r)),message);}
  G.dw={base,tools,f,p,m,out,reg,rows,nn:r=>r.every(x=>x>=0),eps:1e-10,g:9.80665};
})();
