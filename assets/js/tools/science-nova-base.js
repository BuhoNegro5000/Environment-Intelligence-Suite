/* Registro de modelos locales de clima, aire y recursos. */
(function () {
  'use strict';
  const L=GL.lab;
  const f=(key,label,unit,value,min=0,max=1e9)=>L.f(key,label,unit,value,min,max);
  const pct=(key,label,value,min=0)=>f(key,label,'%',value,min,100);
  function table(key,label,columns,data,hint){
    return {...L.table(key,label,data,hint),columns,fixedColumns:true};
  }
  function check(rows,n,test,message){
    L.assert(rows.length>0&&rows.every(r=>r.length===n&&r.every(x=>Math.abs(x)<=1e12)&&test(r)),message);
  }
  function register(id,slug,suite,title,fields,method,limit,calc,refs=[]){
    L.register({id,suite,title,fields,method,limit,calc,tags:['Cálculo local','Modelo explícito'],
      refs:[...refs]});
  }
  function plot(name,rows,x,y){return {name,data:rows.map(row=>[row[x],row[y]])};}
  GL.nova={f,pct,table,check,register,plot,nn:r=>r.every(x=>x>=0)};
})();
