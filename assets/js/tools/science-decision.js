/* MCDA: algoritmos propios. Cada variante y normalización se declara en pantalla. */
(function () {
  'use strict';
  const L=GL.lab,A=L.assert,S=L.sum,F=L.f,R=L.result,T=L.table;
  const refs=[['Saaty · AHP','https://doi.org/10.1504/IJSSCI.2008.017590'],['Opricovic y Tzeng · VIKOR y TOPSIS','https://doi.org/10.1016/S0377-2217(03)00020-1'],['Brans y Vincke · PROMETHEE','https://doi.org/10.1287/mnsc.31.6.647'],['Buckley · AHP difuso','https://doi.org/10.1016/0165-0114(85)90090-9'],['Chen · TOPSIS difuso','https://doi.org/10.1016/S0165-0114(97)00377-1']];
  const limit='Los criterios, pesos y preferencias son decisiones del analista. Examina sensibilidad y empates antes de seleccionar una alternativa.';
  function reg(id,title,fields,method,calc){L.register({id,suite:'decision',title,fields,method,calc,limit,refs});}
  const matrix=()=>T('a','Matriz de alternativas × criterios','80;30;6\n65;20;9\n90;45;7','Filas = alternativas A1, A2…; columnas = criterios. Separador: punto y coma.');
  const weights=()=>T('w','Pesos de criterios','0.4;0.35;0.25','Una fila con un peso por criterio. Se normalizan para sumar 1.');
  const sense=()=>T('sense','Sentido de cada criterio','1;-1;1','Una fila: 1 = beneficio (mayor es mejor); −1 = costo (menor es mejor).');
  function prepare(v){const a=v.a,m=a[0].length,n=a.length;A(n>=2&&m>=1,'Usa al menos dos alternativas.');A(v.w.length===1&&v.w[0].length===m,'El número de pesos debe coincidir con los criterios.');A(v.sense.length===1&&v.sense[0].length===m&&v.sense[0].every(x=>x===1||x===-1),'Indica 1 o −1 para cada criterio.');const w=v.w[0];A(w.every(x=>x>=0)&&S(w)>0,'Pesos no negativos y suma positiva.');const wn=w.map(x=>x/S(w)),cols=L.transpose(a),lo=cols.map(c=>Math.min(...c)),hi=cols.map(c=>Math.max(...c));const b=a.map(row=>row.map((x,j)=>hi[j]===lo[j]?1:v.sense[0][j]===1?(x-lo[j])/(hi[j]-lo[j]):(hi[j]-x)/(hi[j]-lo[j])));return {a,m,n,w:wn,s:v.sense[0],cols,lo,hi,b};}
  function ranking(scores,low,extra){const rows=scores.map((x,i)=>[i+1,x]).sort((a,b)=>(low?1:-1)*(a[1]-b[1]));let rank=1;const ranked=rows.map((r,i)=>{if(i&&Math.abs(r[1]-rows[i-1][1])>1e-10)rank=i+1;return ['A'+r[0],r[1],rank];});return Object.assign({metrics:[['Mejor alternativa',ranked.filter(r=>r[2]===1).map(r=>r[0]).join(' · '),''],['Puntuación preferida',ranked[0][1],''],['Alternativas evaluadas',scores.length,'']],headers:['Alternativa','Puntuación','Posición'],rows:ranked},extra||{});}
  const standard=()=>[matrix(),weights(),sense()];
  reg('mcda-wlc','Combinación lineal ponderada · WLC',standard(),'Normalización min–max orientada a beneficio; Sᵢ = Σ wⱼ rᵢⱼ. Un criterio constante recibe r=1 para todas las alternativas.',v=>{const p=prepare(v);return ranking(p.b.map(r=>S(r.map((x,j)=>x*p.w[j]))));});
  reg('mcda-topsis','Priorización de alternativas · TOPSIS',standard(),'Normalización vectorial por columna, ponderación, ideales beneficio/costo; Cᵢ = d⁻/(d⁺+d⁻).',v=>{const p=prepare(v),a=p.a.map(r=>r.map((x,j)=>{const norm=Math.hypot(...p.cols[j]);return norm?x/norm*p.w[j]:0;})),c=L.transpose(a),best=c.map((r,j)=>p.s[j]===1?Math.max(...r):Math.min(...r)),worst=c.map((r,j)=>p.s[j]===1?Math.min(...r):Math.max(...r));return ranking(a.map(r=>{const dp=Math.hypot(...r.map((x,j)=>x-best[j])),dm=Math.hypot(...r.map((x,j)=>x-worst[j]));return dp+dm?dm/(dp+dm):.5;}));});
  reg('mcda-vikor','Solución de compromiso · VIKOR',[...standard(),F('v','Peso de utilidad colectiva','',.5,0,1)],'Pérdida = wⱼ(f*−f)/(f*−f−). S = suma de pérdidas; R = pérdida máxima. Q = v(S−S*)/(S−−S*) + (1−v)(R−R*)/(R−−R*). Menor Q es preferible.',v=>{const p=prepare(v),loss=p.b.map(r=>r.map((x,j)=>p.hi[j]===p.lo[j]?0:p.w[j]*(1-x))),ss=loss.map(S),rr=loss.map(r=>Math.max(...r));const norm=a=>{const lo=Math.min(...a),hi=Math.max(...a);return a.map(x=>hi>lo?(x-lo)/(hi-lo):0);},ns=norm(ss),nr=norm(rr),q=ns.map((x,i)=>v.v*x+(1-v.v)*nr[i]),sort=q.map((x,i)=>[x,i]).sort((a,b)=>a[0]-b[0]),winner=sort[0][1],adv=sort[1][0]-sort[0][0]>=1/(p.n-1)-1e-10,stable=ss[winner]<=Math.min(...ss)+1e-10||rr[winner]<=Math.min(...rr)+1e-10;return ranking(q,true,{message:'Ventaja aceptable: '+(adv?'sí':'no')+'. Estabilidad de la primera alternativa: '+(stable?'sí':'no')+'. '+(!adv||!stable?'Considera un conjunto de compromiso; el primer puesto no es una recomendación única.':'Se cumplen ambas condiciones de compromiso.'),headers:['Alternativa','Q (menor mejor)','S · utilidad perdida','R · arrepentimiento'],rows:q.map((x,i)=>['A'+(i+1),x,ss[i],rr[i]]).sort((a,b)=>a[1]-b[1])});});
  reg('mcda-waspas','Ranking combinado · WASPAS',[...standard(),F('lambda','Balance suma/producto λ','',.5,0,1)],'Normalización por razón: x/max para beneficio y min/x para costo. Q = λΣwr + (1−λ)Πr^w. Se requieren valores estrictamente positivos.',v=>{const p=prepare(v);A(p.a.flat().every(x=>x>0),'WASPAS requiere valores positivos para esta variante por razón.');return ranking(p.a.map(row=>{const r=row.map((x,j)=>p.s[j]===1?x/p.hi[j]:p.lo[j]/x);return v.lambda*S(r.map((x,j)=>x*p.w[j]))+(1-v.lambda)*Math.exp(S(r.map((x,j)=>p.w[j]*Math.log(x))));}));});
  reg('mcda-owa','Agregación ordenada · OWA',[matrix(),sense(),T('ow','Pesos por posición ordenada','0.5;0.3;0.2','Pesos desde el mejor desempeño al peor. Una fila; se normalizan.')],'Normalización min–max beneficio/costo. Se ordenan desempeños de mayor a menor dentro de cada alternativa y se ponderan por posición.',v=>{const p=prepare(Object.assign({},v,{w:[v.ow[0]]}));A(v.ow.length===1,'Usa una fila de pesos de posición.');return ranking(p.b.map(r=>S(r.slice().sort((a,b)=>b-a).map((x,j)=>x*p.w[j]))));});
  reg('mcda-promethee','Flujos de preferencia · PROMETHEE II',[...standard(),F('q','Umbral de indiferencia normalizado','',0,0,1),F('p','Umbral de preferencia normalizado','',.3,1e-9,1)],'Normalización min–max orientada; preferencia lineal: 0 si d≤q, 1 si d≥p, (d−q)/(p−q) en el intervalo. Flujo neto = flujo positivo − negativo.',v=>{const p=prepare(v);A(v.p>v.q,'El umbral p debe ser mayor que q.');const pref=(i,k)=>S(p.b[i].map((x,j)=>p.w[j]*Math.max(0,Math.min(1,(x-p.b[k][j]-v.q)/(v.p-v.q)))));const plus=p.a.map((_,i)=>S(p.a.map((__,k)=>i===k?0:pref(i,k)))/(p.n-1)),minus=p.a.map((_,i)=>S(p.a.map((__,k)=>i===k?0:pref(k,i)))/(p.n-1));return ranking(plus.map((x,i)=>x-minus[i]),false,{message:'Los umbrales se expresan en la escala normalizada 0–1, comunes a todos los criterios.'});});
  reg('mcda-electre','Relación de sobreclasificación · ELECTRE I',[...standard(),F('c','Concordancia mínima','',.65,0,1),F('d','Discordancia máxima','',.35,0,1)],'Sobreclasifica si Σ pesos de criterios con rᵢ≥rₖ alcanza c y maxⱼ(rₖⱼ−rᵢⱼ,0) no supera d. Normalización min–max; se muestra la relación, sin forzar un ranking total.',v=>{const p=prepare(v),edges=[],out=Array(p.n).fill(0),inc=Array(p.n).fill(0);for(let i=0;i<p.n;i++)for(let k=0;k<p.n;k++)if(i!==k){const c=S(p.b[i].map((x,j)=>x>=p.b[k][j]-1e-12?p.w[j]:0)),d=Math.max(0,...p.b[i].map((x,j)=>p.b[k][j]-x));if(c>=v.c&&d<=v.d){edges.push(['A'+(i+1),'A'+(k+1),c,d]);out[i]++;inc[k]++;}}const kernel=inc.map((x,i)=>x===0?'A'+(i+1):null).filter(Boolean);return {metrics:[['Alternativas sin dominación entrante',kernel.join(' · ')||'Ninguna (hay ciclos)',''],['Relaciones de sobreclasificación',edges.length,'']],headers:['Alternativa','Sobreclasifica a','Concordancia','Discordancia'],rows:edges,message:'La relación puede contener ciclos o alternativas incomparables. Los umbrales corresponden a esta variante explícita de ELECTRE I.'};});
  const pair=()=>T('a','Matriz de comparación por pares','1;3;5\n0.333333333333;1;2\n0.2;0.5;1','Matriz cuadrada recíproca positiva. Diagonal = 1. Hasta 10 criterios.');
  function checkPair(a){const n=a.length;A(n>=2&&n<=10&&a[0].length===n,'Usa una matriz cuadrada de 2 a 10 criterios.');A(a.every((r,i)=>r.every((x,j)=>x>0&&Math.abs(x*a[j][i]-1)<1e-5&&(i!==j||Math.abs(x-1)<1e-8))),'La matriz debe ser positiva, recíproca y tener diagonal 1.');}
  function ahp(a){checkPair(a);const n=a.length;let w=Array(n).fill(1/n),err=1;for(let it=0;it<2000&&err>1e-12;it++){const x=a.map(r=>S(r.map((v,j)=>v*w[j]))),nw=x.map(v=>v/S(x));err=Math.max(...nw.map((v,j)=>Math.abs(v-w[j])));w=nw;}A(err<1e-9,'AHP no converge con esta matriz.');const aw=a.map(r=>S(r.map((x,j)=>x*w[j]))),lambda=S(aw.map((x,i)=>x/w[i]))/n,ci=Math.max(0,(lambda-n)/(n-1)),ri=[0,0,0,.58,.9,1.12,1.24,1.32,1.41,1.45,1.49][n];return {w,lambda,ci,cr:ri?ci/ri:0};}
  reg('mcda-ahp','Pesos y consistencia · AHP',[pair()],'Vector propio principal por iteración de potencia. CI = (λmax−n)/(n−1); CR = CI/RI (Saaty).',v=>{const p=ahp(v.a);return {metrics:[['Razón de consistencia',p.cr,''],['Autovalor principal',p.lambda,''],['Criterios',p.w.length,'']],headers:['Criterio','Peso','Peso (%)'],rows:p.w.map((x,i)=>['C'+(i+1),x,x*100]),message:p.cr>.1?'CR > 0,10: revisa las comparaciones antes de utilizar los pesos.':'CR ≤ 0,10; la consistencia no garantiza que los juicios sean adecuados.'};});
  reg('mcda-fuzzy-ahp','Pesos triangulares · AHP difuso',[
    pair(),L.select('input','Origen de los juicios difusos',[['spread','Matriz central y amplitud'],['direct','Triángulos por comparación']],'spread'),
    F('spread','Amplitud multiplicativa de incertidumbre','',1.2,1,3),
    T('triangles','Triángulos explícitos','2;3;4\n4;5;6\n1;2;3','Una fila l;m;u por cada par superior, en orden C1–C2, C1–C3, …, C2–C3. Usa el tamaño de la matriz central.')
  ],'Método de Buckley. Usa triángulos positivos explícitos o convierte el juicio a en (a/s,a,a·s). La diagonal vale (1,1,1) y las comparaciones inversas son (1/u,1/m,1/l). Media geométrica por fila, normalización triangular y centroide. CR de los juicios modales.',v=>{
    const n=v.a.length, direct=v.input==='direct';
    A(n>=2&&n<=10&&v.a[0].length===n,'Usa una matriz cuadrada de 2 a 10 criterios.');
    if (direct) {
      A(v.triangles.length===n*(n-1)/2&&v.triangles.every(t=>t.length===3&&t[0]>0&&t[0]<=t[1]&&t[1]<=t[2]),'Ingresa un triángulo positivo y ordenado por cada comparación superior.');
    } else checkPair(v.a);
    const tri=Array.from({length:n},()=>Array.from({length:n},()=>[1,1,1]));
    let cursor=0;
    for (let i=0;i<n;i++) for(let j=i+1;j<n;j++) {
      const a=v.a[i][j], t=direct?v.triangles[cursor++]:[a/v.spread,a,a*v.spread];
      tri[i][j]=t;
      tri[j][i]=[1/t[2],1/t[1],1/t[0]];
    }
    const gm=tri.map(row=>[0,1,2].map(k=>Math.exp(S(row.map(t=>Math.log(t[k])))/n)));
    const sum=[0,1,2].map(k=>S(gm.map(t=>t[k])));
    const fw=gm.map(t=>[t[0]/sum[2],t[1]/sum[1],t[2]/sum[0]]);
    const center=fw.map(t=>S(t)/3), total=S(center);
    const cr=ahp(tri.map(row=>row.map(t=>t[1]))).cr;
    return {metrics:[['Criterios ponderados',n,''],['CR de juicios centrales',cr,'']],headers:['Criterio','Peso inferior','Peso modal','Peso superior','Peso final'],
      rows:fw.map((t,i)=>['C'+(i+1),...t,center[i]/total]),
      message:cr>.1?'CR modal superior a 0,10. Revisa los juicios centrales.':'CR modal dentro de la referencia habitual de 0,10.'};
  });
  reg('mcda-anp','Prioridades de red · ANP',[T('a','Supermatriz ya ponderada','0.5;0.2;0.3\n0.3;0.5;0.3\n0.2;0.3;0.4','Cuadrada, no negativa y estocástica por columnas (cada columna suma 1).')],'Supermatriz límite Wᵏ por multiplicación hasta que todas las columnas converjan a la misma prioridad; tolerancia 10⁻¹⁰.',v=>{const a=v.a,n=a.length;A(n>=2&&n<=20&&a[0].length===n&&a.flat().every(x=>x>=0),'Usa matriz cuadrada no negativa de 2–20 nodos.');A(L.transpose(a).every(c=>Math.abs(S(c)-1)<1e-6),'Cada columna debe sumar 1; ingresa la supermatriz ya ponderada.');let w=a.map(r=>r.slice()),err=1,it=0;for(;it<2000&&err>1e-10;it++){const nw=L.multiply(a,w);err=Math.max(...nw.flatMap((r,i)=>r.map((x,j)=>Math.abs(x-w[i][j]))));w=nw;}A(err<=1e-10,'No converge: revisa periodicidad, conectividad y ponderación.');A(w.every(r=>Math.max(...r)-Math.min(...r)<1e-7),'La red es reducible: la prioridad depende del estado inicial; no hay vector límite común.');return {metrics:[['Iteraciones hasta convergencia',it,''],['Error máximo',err,'']],headers:['Nodo','Prioridad límite'],rows:w.map((r,i)=>['N'+(i+1),r[0]])};});
  reg('mcda-swara','Ponderación escalonada · SWARA',[T('a','Importancia comparativa ordenada','0\n0.2\n0.3\n0.1','Un criterio por fila, ordenados del más importante al menos importante. Primera fila = 0; después sⱼ ≥ 0.')],'k₁=q₁=1; kⱼ=1+sⱼ; qⱼ=qⱼ₋₁/kⱼ; wⱼ=qⱼ/Σq.',v=>{A(v.a[0].length===1&&v.a.flat().every(x=>x>=0)&&v.a[0][0]===0,'Una columna no negativa con primera fila 0.');const q=[1];for(let i=1;i<v.a.length;i++)q.push(q[i-1]/(1+v.a[i][0]));const w=q.map(x=>x/S(q));return {metrics:[['Criterio prioritario','C1',''],['Peso del primer criterio',w[0]*100,'%']],headers:['Criterio','s','q','Peso'],rows:q.map((x,i)=>['C'+(i+1),v.a[i][0],x,w[i]])};});
  function dematel(a,divisor){const n=a.length;A(n>=2&&n<=20&&a[0].length===n&&a.flat().every(x=>x>=0),'Matriz cuadrada no negativa de 2–20 criterios.');A(a.every((r,i)=>r[i]===0),'La diagonal de influencias debe ser cero.');const s=divisor||Math.max(...a.map(S),...L.transpose(a).map(S));A(s>0,'La matriz de influencias está vacía.');const x=a.map(r=>r.map(v=>v/s)),im=x.map((r,i)=>r.map((v,j)=>(i===j?1:0)-v)),t=L.multiply(x,L.inverse(im));A(t.flat().every(v=>v>=-1e-8&&v<1e10),'Sistema no convergente o mal condicionado. Reduce influencias recurrentes.');return {t,d:t.map(S),r:L.transpose(t).map(S)};}
  const influence=()=>T('a','Influencia directa entre criterios','0;3;1\n1;0;2\n2;1;0','Matriz cuadrada no negativa; diagonal 0. Fila = causa, columna = efecto.');
  reg('mcda-dematel','Relaciones causa y efecto · DEMATEL',[influence()],'X = A/max(máxima suma de fila, máxima suma de columna); T = X(I−X)⁻¹. D+R = prominencia; D−R = influencia neta.',v=>{const p=dematel(v.a);return {metrics:[['Criterios causales',p.d.filter((x,i)=>x-p.r[i]>0).length,''],['Influencia total',S(p.d),'']],headers:['Criterio','D · influencia emitida','R · recibida','D+R · prominencia','D−R · neta'],rows:p.d.map((x,i)=>['C'+(i+1),x,p.r[i],x+p.r[i],x-p.r[i]])};});
  const influenceScale=[[0,0,0],[0,.25,.5],[.25,.5,.75],[.5,.75,1],[.75,1,1]];
  reg('mcda-fuzzy-dematel','Influencia incierta · DEMATEL difuso',[
    influence(),L.select('input','Escala de influencia',[['linguistic','Lingüística (0 a 4)'],['relative','Numérica con amplitud relativa']],'linguistic'),
    F('spread','Semiamplitud para escala numérica','',.2,0,.8)
  ],'Escala lingüística triangular: nula (0,0,0), baja (0,0,25,0,5), media (0,25,0,5,0,75), alta (0,5,0,75,1), muy alta (0,75,1,1). Se normaliza por la mayor suma superior por fila o columna. T = X(I−X)⁻¹ para cada componente; centroide (l+m+u)/3 para D y R.',v=>{
    const n=v.a.length, linguistic=v.input==='linguistic';
    A(n>=2&&n<=20&&v.a[0].length===n&&v.a.every((r,i)=>r[i]===0),'Usa una matriz cuadrada de 2 a 20 criterios con diagonal cero.');
    A(v.a.flat().every(x=>x>=0&&(!linguistic||(Number.isInteger(x)&&x<=4))),'Usa niveles enteros 0–4 en modo lingüístico o valores no negativos en modo numérico.');
    const tri=v.a.map(r=>r.map(x=>linguistic?influenceScale[x]:[x*(1-v.spread),x,x*(1+v.spread)]));
    const upper=tri.map(r=>r.map(t=>t[2])), scale=Math.max(...upper.map(S),...L.transpose(upper).map(S));
    A(scale>0,'Debe haber influencias positivas.');
    const parts=[0,1,2].map(k=>dematel(tri.map(r=>r.map(t=>t[k])),scale));
    const rows=parts[0].d.map((_,i)=>{
      const ds=parts.map(p=>p.d[i]),rs=parts.map(p=>p.r[i]);
      const d=S(ds)/3,r=S(rs)/3;
      return ['C'+(i+1),...ds,...rs,d+r,d-r,d-r>1e-10?'Causa':r-d>1e-10?'Efecto':'Equilibrio'];
    });
    return {metrics:[['Criterios',n,''],['Factor de normalización',scale,'']],headers:['Criterio','D inf.','D modal','D sup.','R inf.','R modal','R sup.','Prominencia D+R','Influencia neta D−R','Rol'],rows};
  });
  const ratingScale=[[0,0,.25],[0,.25,.5],[.25,.5,.75],[.5,.75,1],[.75,1,1]];
  reg('mcda-fuzzy-topsis','Alternativas con datos triangulares · TOPSIS difuso',[
    T('a','Evaluaciones por alternativa','6;8;9;20;25;30\n5;7;8;15;20;25\n7;9;10;25;30;40','Modo triangular: tres columnas l;m;u por criterio. Modo lingüístico: una columna por criterio, nivel entero de 1 a 5.'),
    L.select('input','Tipo de evaluación',[['triangular','Triángulos l;m;u'],['linguistic','Niveles lingüísticos 1 a 5']],'triangular'),
    T('w','Pesos de criterios','0.6;0.4','Una fila de pesos nítidos o tres columnas l;m;u por criterio. Se dividen por la suma modal.'),
    T('sense','Sentido de criterios','1;-1','Una fila: 1 beneficio, −1 costo.')
  ],'Normalización por razón de extremos para beneficio/costo. Niveles 1–5 de muy bajo a muy alto: (0,0,0.25), (0,0.25,0.5), (0.25,0.5,0.75), (0.5,0.75,1), (0.75,1,1). En criterios de costo la escala lingüística se desplaza una unidad para permitir la inversión. Se multiplican triángulos por componente y se suman distancias de vértices a ideales (u del peso en los tres vértices) y (0,0,0).',v=>{
    const linguistic=v.input==='linguistic', width=linguistic?1:3, m=v.a[0].length/width;
    A(v.a.length>=2&&Number.isInteger(m)&&m>0,'Usa dos alternativas o más y tres columnas por criterio en modo triangular.');
    A(v.w.length===1&&[m,3*m].includes(v.w[0].length)&&v.sense.length===1&&v.sense[0].length===m&&v.sense[0].every(x=>[1,-1].includes(x)),'Verifica número de pesos, triángulos y sentidos 1/−1.');
    const isTriangle=t=>t[0]>=0&&t[0]<=t[1]&&t[1]<=t[2];
    if (linguistic) A(v.a.flat().every(x=>Number.isInteger(x)&&x>=1&&x<=5),'Usa niveles lingüísticos enteros entre 1 y 5.');
    const a=v.a.map(r=>Array.from({length:m},(_,j)=>{
      if (!linguistic) return r.slice(j*3,j*3+3);
      const t=ratingScale[r[j]-1];
      // La escala de costos parte de 1 para que el recíproco sea definido.
      return v.sense[0][j]===-1?t.map(x=>x+1):t;
    }));
    A(a.every(r=>r.every((t,j)=>isTriangle(t)&&(v.sense[0][j]===1||t[0]>0))),'Usa triángulos ordenados no negativos, estrictamente positivos para criterios de costo.');
    const w=Array.from({length:m},(_,j)=>v.w[0].length===m?Array(3).fill(v.w[0][j]):v.w[0].slice(j*3,j*3+3));
    const total=S(w.map(t=>t[1]));
    A(w.every(isTriangle)&&total>0,'Los pesos deben ser triángulos ordenados no negativos con suma modal positiva.');
    const wn=w.map(t=>t.map(x=>x/total));
    const hi=Array.from({length:m},(_,j)=>Math.max(...a.map(r=>r[j][2]))),lo=Array.from({length:m},(_,j)=>Math.min(...a.map(r=>r[j][0])));
    const distance=(t,ideal)=>Math.sqrt(S(t.map(x=>(x-ideal)**2))/3);
    const distances=a.map(r=>{
      const b=r.map((t,j)=>t.map((x,k)=>wn[j][k]*(v.sense[0][j]===1?(hi[j]?x/hi[j]:0):lo[j]/t[2-k])));
      return [S(b.map((t,j)=>distance(t,hi[j]?wn[j][2]:0))),S(b.map(t=>distance(t,0)))];
    });
    const result=ranking(distances.map(([dp,dm])=>dp+dm?dm/(dp+dm):.5));
    result.headers.push('Distancia al ideal positivo','Distancia al ideal negativo');
    result.rows.forEach(r=>r.push(...distances[Number(r[0].slice(1))-1]));
    return result;
  });
  L.ahp=ahp;
})();
