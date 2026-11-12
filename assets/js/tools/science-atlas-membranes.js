/* Membranas, adsorción y energía de desalinización. */
(function(){
  'use strict';
  const L=GL.lab,{reg,m,out,table,f,p,check,nn,int,load,eps}=GL.atlas,{assert:A,sum:S,table:T,select}=L;
  const film=[['DuPont · manual técnico de RO y NF','https://www.dupont.com/content/dam/water/amer/us/en/water/public/documents/en/RO-NF-FilmTec-Manual-45-D01504-en.pdf']];
  const gac=[['EPA · tecnologías para PFAS en agua','https://www.epa.gov/system/files/documents/2024-04/2024-pfas-tech-cost_final-508.pdf']];
  reg('membrane-two-solute-design',['nf-system-designer','ro-system-designer'],'water','RO y NF · balance por etapas y mezcla de derivación',[
    f('q','Caudal total de alimentación','m³/h',120,eps),f('salt','TDS de alimentación','mg/L',1200),f('hard','Dureza de alimentación','mg/L como CaCO₃',280),
    T('a','Etapas en serie de concentrado','45;96;98\n25;96;98',
      'Columnas: recuperación (%); rechazo observado de TDS (%); rechazo observado de dureza (%). Una a tres etapas.'),
    select('mix','Mezcla de derivación',[['none','Sin derivación'],['target','Ajustar a dureza objetivo']],'none'),
    f('target','Dureza objetivo en producto','mg/L como CaCO₃',75),
    f('pressure','Presión hidráulica media neta de permeado','bar',17),f('osm','Coeficiente osmótico empírico','bar/(mg/L)',.0008)
  ],'Balance de agua y dos trazadores por etapa. La derivación mezcla permeado con parte del afluente y conserva el caudal total. Presión osmótica aproximada = coeficiente × diferencia de TDS.',
  v=>{
    check(v.a,3,r=>nn(r)&&r[0]<100&&r[1]<=100&&r[2]<=100,'Recuperación menor a 100 % y rechazos de 0 a 100 %.');
    A(v.a.length<=3,'Usa hasta tres etapas.');let q=1,cs=v.salt,ch=v.hard,p=0,ms=0,mh=0;
    const data=v.a.map(([y,rs,rh],i)=>{
      const qp=q*y/100,sp=cs*(1-rs/100),hp=ch*(1-rh/100);
      const qc=q-qp;cs=(q*cs-qp*sp)/qc;ch=(q*ch-qp*hp)/qc;
      p+=qp;ms+=qp*sp;mh+=qp*hp;q=qc;
      return [i+1,qp,sp,hp,cs,ch];
    });
    A(p>0,'Se requiere recuperación positiva.');
    const sp=ms/p,hp=mh/p;
    let b=0;
    if(v.mix==='target'){
      A(v.hard>hp&&v.target>=hp&&v.target<v.hard,'La dureza objetivo debe estar entre la del permeado y la del afluente, excluyendo el extremo de afluente.');
      b=p*(v.target-hp)/(v.hard-v.target+p*(v.target-hp));
    }
    const bypass=v.q*b,feed=v.q-bypass,perm=feed*p,product=perm+bypass;
    const delta=v.osm*Math.max(0,(v.salt+cs)/2-sp);
    return table([m('Recuperación global',100*product/v.q,'%'),m('Producto total',product,'m³/h'),m('Derivación',bypass,'m³/h'),
      m('TDS de producto',(sp*perm+v.salt*bypass)/product,'mg/L'),m('Dureza de producto',(hp*perm+v.hard*bypass)/product,'mg/L como CaCO₃'),
      m('Caudal de concentrado final',feed*q,'m³/h'),m('TDS de concentrado final',cs,'mg/L'),
      m('Dureza de concentrado final',ch,'mg/L como CaCO₃'),m('Presión motriz aproximada',v.pressure-delta,'bar')],
      ['Etapa','Permeado (m³/h)','TDS permeado','Dureza permeado','TDS concentrado','Dureza concentrado'],
      data.map(([i,qp,...rest])=>[i,qp*feed,...rest]));},
  'Balance preliminar sin precipitación ni polarización. TDS y dureza son trazadores separados. La presión osmótica requiere composición y modelo apropiados; la incrustación se valida con especiación y fabricante.',film);

  reg('ufmf-train-cycle-sizing',['uf-mf-system-designer'],'water','UF/MF · trenes, ciclo y agua neta',[
    f('q','Producción neta objetivo','m³/h',80),f('j','Flujo de filtración','L/(m²·h)',58,eps),
    f('area','Área por módulo','m²',55,eps),f('modules','Módulos por tren','',12,1,500),
    f('run','Filtración por ciclo','min',45,eps),f('back','Retrolavado por ciclo','min',2),
    f('jb','Flujo de retrolavado','L/(m²·h)',125),f('idle','Otras paradas por ciclo','min',3),
    f('spare','Trenes de reserva','',1,0,20)
  ],'Producción neta = permeado de filtración − agua de retrolavado. Se promedia sobre el ciclo y se redondean trenes al entero superior.',
  v=>{A(int(v.modules)&&int(v.spare),'Usa cantidades enteras.');const a=v.area*v.modules,filtered=a*v.j*v.run/60000,back=a*v.jb*v.back/60000,cycle=v.run+v.back+v.idle;
    const net=60*(filtered-back)/cycle;A(net>0,'El ciclo consume tanto o más que lo producido.');
    const trains=Math.ceil(v.q/net);
    return out(m('Capacidad neta por tren',net,'m³/h'),m('Trenes de operación',trains),m('Trenes instalados',trains+v.spare),
      m('Agua de lavado por tren y ciclo',back,'m³'),m('Rendimiento de permeado del ciclo',100*(1-back/filtered),'%'));},
  'Balance de ciclo. Incluye por separado pérdidas de drenajes y limpiezas químicas si afectan la producción. Verifica el flujo sostenible con datos del agua.');

  reg('swro-energy-recovery',['swro-energy-erd-screening'],'energy','SWRO · energía específica y recuperación de presión',[
    f('q','Caudal de alimentación','m³/h',180,eps),p('y','Recuperación',45,.01,99.99),
    f('p','Diferencia de presión de bombeo','bar',62),f('brine','Presión recuperable del concentrado','bar',58),
    p('pump','Eficiencia eléctrica de bombeo',81,.01),p('erd','Eficiencia de recuperación de energía hidráulica',92),
    f('aux','Potencia eléctrica auxiliar en ambos casos','kW',14)
  ],'Potencia hidráulica QΔP/36 con Q en m³/h y presión en bar. El ERD reduce la carga hidráulica de la bomba según energía transferida. SEC=potencia eléctrica/caudal de producto.',
  v=>{A(v.brine<=v.p,'La presión recuperable supera la altura de bombeo declarada.');
    const product=v.q*v.y/100,h=v.q*v.p/36,save=v.q*(1-v.y/100)*v.brine/36*v.erd/100,eta=v.pump/100;
    const base=h/eta+v.aux,net=(h-save)/eta+v.aux;
    return out(m('SEC con ERD',net/product,'kWh/m³'),m('SEC sin ERD',base/product,'kWh/m³'),
      m('Potencia evitada',base-net,'kW'),m('Energía hidráulica recuperada',save,'kW'),m('Producto',product,'m³/h'));},
  'Comparación energética estacionaria. Usa presiones efectivas en fronteras coherentes y añade pérdidas y consumos de equipos auxiliares.');

  reg('gac-bed-breakthrough',['ac-sizing','gac-breakthrough-bed-life'],'water','Carbón activado · diseño de lecho y ruptura observada',[
    f('q','Caudal de servicio','m³/h',60,eps),f('ebct','Tiempo de contacto de lecho vacío','min',12,eps),
    f('depth','Altura de lecho por recipiente','m',2.6,eps),f('n','Recipientes paralelos','',2,1,50),
    f('density','Densidad aparente del carbón','kg/m³',450,eps),f('inlet','Concentración afluente constante de referencia','µg/L',1,eps),
    f('target','Concentración de ruptura objetivo','µg/L',.2,eps),
    select('method','Método de evaluación',[['observed','Interpolación de observaciones'],['model','Interpolación y ajuste Yoon–Nelson']],'observed'),
    T('a','Observaciones de efluente','0;0.02\n500;0.07\n1000;0.15\n1500;0.28\n2000;0.44',
      'Columnas: volúmenes de lecho (BV); concentración efluente (µg/L), en orden de observación.')
  ],'Volumen=Q·EBCT. Ruptura por interpolación del primer cruce observado. Opcionalmente se ajusta logit(C/C₀)=a+b·BV para estimar Yoon–Nelson.',
  v=>{A(int(v.n)&&v.target<v.inlet,'Usa recipientes enteros y objetivo menor que afluente.');
    check(v.a,2,nn,'Usa BV y concentraciones no negativos.');
    A(v.a.every((r,i)=>!i||r[0]>v.a[i-1][0]),'Usa BV estrictamente crecientes.');
    const bed=v.q*v.ebct/60,mass=bed*v.density,d=Math.sqrt(4*bed/(v.n*v.depth*Math.PI));
    const i=v.a.findIndex(r=>r[1]>=v.target);
    const bv=i<0?null:i===0?v.a[0][0]:v.a[i-1][0]+(v.target-v.a[i-1][1])*(v.a[i][0]-v.a[i-1][0])/(v.a[i][1]-v.a[i-1][1]);
    const days=bv===null?null:bv*v.ebct/1440;
    const result=[m('Volumen total de lecho',bed,'m³'),m('Diámetro por recipiente',d,'m'),m('Masa de carbón',mass,'kg'),
      m('Carga afluente de soluto',load(v.q,v.inlet),'g/h'),m('Ruptura',bv??'Sin cruce observado','BV'),
      m('Tiempo hasta ruptura',days??'Sin cruce observado','d'),m('Carbón por agua tratada',bv>0?mass/(bv*bed):null,'kg/m³')];
    const series=[{name:'Ruptura observada',data:v.a,points:true}];
    if(v.method==='model'){
      const points=v.a.filter(([,c])=>c>0&&c<v.inlet),logit=c=>Math.log(c/(v.inlet-c));
      A(points.length>=3,'Para Yoon–Nelson usa tres o más puntos con 0 < C < C₀.');
      const fit=GL.stat.linreg(points.map(r=>r[0]),points.map(r=>logit(r[1])));
      A(fit.slope>0,'La curva Yoon–Nelson requiere pendiente positiva.');
      const modelBV=(logit(v.target)-fit.intercept)/fit.slope;
      result.push(m('Ruptura por Yoon–Nelson',modelBV>=0?modelBV:'Cruce previo al inicio','BV'),
        m('R² de logit',fit.r2),m('Cruce del ajuste respecto al rango observado',
          modelBV<points[0][0]||modelBV>points.at(-1)[0]?'Extrapolación':'Dentro del rango'));
      series.push({name:'Yoon–Nelson ajustado',data:v.a.map(([x])=>[x,v.inlet/(1+Math.exp(-fit.intercept-fit.slope*x))])});
    }
    return {...table(result,['BV','Efluente (µg/L)'],v.a),series,xLabel:'BV',yLabel:'µg/L',
      message:i===0?'El objetivo se excede desde la primera observación. El tiempo calculado es una cota superior observada.':''};},
  'Usa observaciones representativas de cada compuesto y matriz. La interpolación se restringe a observaciones; el ajuste empírico identifica cualquier extrapolación.',
  [...gac,['Yoon y Nelson · modelo de ruptura','https://pubmed.ncbi.nlm.nih.gov/6475758/']]);

  reg('adsorption-isotherm-fit',['isotherm-analyzer'],'water','Isotermas de adsorción · Freundlich, Langmuir y BET',[
    select('model','Modelo',[['freundlich','Freundlich'],['langmuir','Langmuir'],['bet','BET']],'freundlich'),
    T('a','Pares de equilibrio','1;2.6\n2;4.1\n4;6.7\n7;9\n10;11.5','Columnas: concentración de equilibrio (mg/L); masa adsorbida por masa de sólido (mg/g).'),
    f('cs','Concentración de saturación (BET)','mg/L',25,eps)
  ],'Ajustes linealizados. Freundlich: ln(q) contra ln(C); Langmuir: C/q contra C; BET: x/[q(1−x)] contra x con x=C/Cs. Se informan R² transformado y error en la escala original.',
  v=>{check(v.a,2,([c,q])=>c>0&&q>0&&(v.model!=='bet'||c<v.cs),'Usa pares positivos; para BET, C debe ser menor que Cs.');
    A(v.a.length>=3&&new Set(v.a.map(r=>r[0])).size>=3,'Se requieren tres concentraciones distintas.');
    const transformed=v.a.map(([c,q])=>v.model==='freundlich'?[Math.log(c),Math.log(q)]:v.model==='langmuir'?[c,c/q]:[c/v.cs,c/v.cs/(q*(1-c/v.cs))]);
    const fit=GL.stat.linreg(transformed.map(r=>r[0]),transformed.map(r=>r[1])),a=fit.intercept,b=fit.slope;
    const mode=v.model,k=mode==='freundlich'?Math.exp(a):mode==='langmuir'?b/a:1+b/a;
    const cap=mode==='freundlich'?b:mode==='langmuir'?1/b:1/(a+b);
    const valid=Number.isFinite(k)&&Number.isFinite(cap)&&k>0&&cap>0&&(mode==='freundlich'||a>0);
    const predict=c=>mode==='freundlich'?k*c**cap:mode==='langmuir'?cap*k*c/(1+k*c):
      cap*k*(c/v.cs)/((1-c/v.cs)*(1+(k-1)*c/v.cs));
    const data=v.a.map(([c,q])=>[c,q,valid?predict(c):null]);
    const rmse=valid?Math.sqrt(S(data.map(([,q,y])=>(q-y)**2))/data.length):null;
    return table([m('Validez física de parámetros',valid?'Parámetros positivos':'Parámetros fuera de dominio'),
      m('R² transformado',fit.r2),m('Parámetro K o C BET',valid?k:null),m('Exponente Freundlich o capacidad',valid?cap:null),
      m('Error cuadrático medio en q',rmse,'mg/g')],['C (mg/L)','q observado (mg/g)','q ajustado (mg/g)'],data);},
  'El R² transformado sirve para diagnóstico y la comparación entre modelos debe considerar el error en la escala original y el rango experimental.');
})();
