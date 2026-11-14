/* Laboratorios estadísticos locales: datos explícitos, semillas reproducibles. */
(function () {
  'use strict';
  const L=GL.lab,A=L.assert,S=L.sum,F=L.f,T=L.table,st=GL.stat;
  const refs=[['NIST · métodos estadísticos','https://www.itl.nist.gov/div898/handbook/'],['R · documentación oficial','https://stat.ethz.ch/R-manual/R-devel/library/stats/html/00Index.html']];
  function reg(id,title,fields,method,calc,limit){L.register({id,suite:'analysis',title,fields,method,calc,limit:limit||'Análisis exploratorio. Revisa independencia, representatividad, unidades y supuestos; los datos de ejemplo son sintéticos.',refs});}
  function aTransform(v,cols){const means=cols.map(st.mean),sd=cols.map(st.sd),lo=cols.map(c=>Math.min(...c)),hi=cols.map(c=>Math.max(...c));return v.a.map((r,i)=>[i+1,...r.map((x,j)=>v.transform==='z'?(sd[j]?(x-means[j])/sd[j]:0):(hi[j]>lo[j]?(x-lo[j])/(hi[j]-lo[j]):0))]);}
  const dataset=()=>T('a','Observaciones × variables','10;22;3\n12;25;4\n9;20;2\n15;29;5\n13;24;4\n11;23;3','Cada fila es una observación; cada columna una variable numérica. Sin encabezados.');
  const statisticsOutput = L.select('transform','Análisis',[
    ['summary','Resumen descriptivo'],['normality','Normalidad · Jarque–Bera'],
    ['compare','Comparación · Welch y Mann–Whitney'],['correlation','Correlación · Pearson y Spearman'],
    ['z','Valores estandarizados z'],['minmax','Normalización 0–1']
  ],'summary');
  function ranks(values) {
    const order = values.map((value, index) => ({value, index})).sort((a,b)=>a.value-b.value);
    const result = Array(values.length);
    let ties = 0;
    for (let i=0; i<order.length;) {
      let j=i+1;
      while (j<order.length && order[j].value===order[i].value) j++;
      for (let k=i;k<j;k++) result[order[k].index]=(i+1+j)/2;
      ties += (j-i)**3-(j-i);
      i=j;
    }
    return {result,ties};
  }
  function correlation(a,b) {
    const x=st.mean(a), y=st.mean(b), den=(a.length-1)*st.sd(a)*st.sd(b);
    return den ? Math.max(-1,Math.min(1,S(a.map((v,i)=>(v-x)*(b[i]-y)))/den)) : null;
  }
  reg('analysis-statistics','Laboratorio de estadística descriptiva',[
    dataset(),statisticsOutput,
    T('group','Segundo grupo para Welch y Mann–Whitney','8\n9\n10\n10\n12\n9','Una columna independiente. El primer grupo es V1 de la tabla principal.')
  ],'Resumen e IC95 % de Student, cribado asintótico Jarque–Bera, t de Welch, Mann–Whitney con empates y corrección de continuidad, Pearson y Spearman con rangos medios, z y min–max.',v=>{
    const n=v.a.length, cols=L.transpose(v.a), labels=cols.map((_,i)=>'V'+(i+1));
    A(n>=2,'Usa al menos dos observaciones.');
    const metrics=[['Observaciones',n,''],['Variables',cols.length,''],['Media de V1',st.mean(cols[0]),''],['Desviación de V1',st.sd(cols[0]),'']];
    if (v.transform==='compare') {
      A(v.group[0].length===1&&v.group.length>=2,'El segundo grupo necesita dos o más observaciones en una columna.');
      const x=cols[0], y=v.group.map(r=>r[0]), m=y.length, diff=st.mean(x)-st.mean(y);
      const sx=st.sd(x)**2/n, sy=st.sd(y)**2/m;
      const t=sx+sy ? diff/Math.sqrt(sx+sy) : null;
      const df=sx+sy ? (sx+sy)**2/(sx**2/(n-1)+sy**2/(m-1)) : null;
      const rr=ranks(x.concat(y)), total=n+m;
      const u=S(rr.result.slice(0,n))-n*(n+1)/2;
      const vu=n*m/12*(total+1-rr.ties/(total*(total-1)));
      const p=vu>0 ? 2*st.normalCdf(-Math.max(0,Math.abs(u-n*m/2)-.5)/Math.sqrt(vu)) : 1;
      return {metrics:[...metrics,['Tamaño del grupo 2',m,''],['Diferencia de medias',diff,'']],headers:['Prueba','Estadístico','Grados de libertad','p bilateral'],rows:[['Welch t',t,df,t===null?null:st.tTwoSidedP(t,df)],['Mann–Whitney U₁',u,null,p]],message:'Grupos independientes. Mann–Whitney usa aproximación normal; con muestras pequeñas interpreta p con cautela. Welch queda indefinido si ambos grupos son constantes.'};
    }
    if (v.transform==='correlation') {
      A(cols.length>=2,'Ingresa al menos dos variables emparejadas.');
      const ranked=cols.map(c=>ranks(c).result);
      const rows=cols.flatMap((c,i)=>cols.slice(i+1).map((d,k)=>{
        const j=i+1+k;
        return [labels[i],labels[j],correlation(c,d),correlation(ranked[i],ranked[j])];
      }));
      return {metrics,headers:['Variable X','Variable Y','Pearson r','Spearman ρ'],rows,
        series:[{name:'Observaciones',data:v.a.map(r=>r.slice(0,2)),type:'scatter',points:true}],xLabel:'V1',yLabel:'V2'};
    }
    if (v.transform==='normality') {
      A(n>=4,'El cribado Jarque–Bera requiere al menos cuatro observaciones.');
      const rows=cols.map((c,i)=>{
        const mean=st.mean(c), sd=st.sd(c)*Math.sqrt((n-1)/n);
        if (!sd) return [labels[i],null,null,null,null];
        const z=c.map(x=>(x-mean)/sd), skew=st.mean(z.map(x=>x**3)), kurt=st.mean(z.map(x=>x**4))-3;
        const jb=n/6*(skew**2+kurt**2/4);
        return [labels[i],skew,kurt,jb,Math.exp(-jb/2)];
      });
      return {metrics,headers:['Variable','Asimetría','Exceso de curtosis','Jarque–Bera','p asintótico'],rows,
        series:[histogram(cols[0],'V1')],xLabel:'Centro del intervalo',yLabel:'Frecuencia',message:'El p asintótico es un cribado. Con muestras pequeñas, revisa el histograma y el diseño del muestreo.'};
    }
    const transformed=v.transform==='z'||v.transform==='minmax';
    const rows=transformed ? aTransform(v,cols) : cols.map((c,j)=>{
      const mean=st.mean(c), sd=st.sd(c), e=st.t95(n-1)*sd/Math.sqrt(n);
      return [labels[j],n,mean,sd,Math.min(...c),st.quantile(c,.25),st.median(c),st.quantile(c,.75),Math.max(...c),mean-e,mean+e];
    });
    return {metrics,headers:transformed?['Observación',...labels]:['Variable','n','Media','DE muestral','Mínimo','Q1','Mediana','Q3','Máximo','IC95 inferior','IC95 superior'],rows,
      series:transformed?[{name:'V1',data:rows.map(r=>r.slice(0,2)),points:true}]:[histogram(cols[0],'V1')],xLabel:transformed?'Observación':'Centro del intervalo',yLabel:transformed?'V1':'Frecuencia',
      message:transformed?'Las variables constantes se representan con cero.':'IC de la media bajo muestreo independiente y normalidad aproximada.'};
  });
  function histogram(values,name) {
    const min=Math.min(...values),max=Math.max(...values),bins=Math.min(30,Math.ceil(Math.sqrt(values.length)));
    if (min===max) return {name,data:[[min,values.length]],type:'bar'};
    const width=(max-min)/bins, counts=Array(bins).fill(0);
    values.forEach(x=>counts[Math.min(bins-1,Math.floor((x-min)/width))]++);
    return {name,data:counts.map((n,i)=>[min+(i+.5)*width,n]),type:'bar'};
  }
  reg('analysis-r-builder','Generador de análisis reproducible en R',[dataset(),L.select('mode','Análisis a generar',[['summary','Descriptivos y valores z'],['regression','Regresión · V1 como respuesta'],['pca','PCA estandarizado'],['trend','Tendencia · primera columna']],'summary')],'Generación de script R base con datos incluidos y llamadas a summary, scale, lm, prcomp o cor.test. Se descarga o ejecuta en R local dentro del navegador.',v=>{A(v.a.length>=3,'Usa al menos tres observaciones.');const m=v.a[0].length;if(['pca','regression'].includes(v.mode))A(m>=2,'Este análisis necesita al menos dos variables.');let code='# Yupana · datos y análisis reproducibles\n# Ejecutar en R; este navegador genera el script.\nx <- matrix(c('+v.a.flat().join(', ')+'), ncol = '+m+', byrow = TRUE)\ndatos <- as.data.frame(x)\n';const scripts={summary:'print(summary(datos))\nprint(sapply(datos, sd))\nprint(scale(datos))',regression:'modelo <- lm(V1 ~ ., data = datos)\nprint(summary(modelo))\npar(mfrow = c(2, 2)); plot(modelo)',pca:'modelo <- prcomp(datos, center = TRUE, scale. = TRUE)\nprint(summary(modelo))\nprint(modelo$rotation)\nbiplot(modelo)',trend:'tiempo <- seq_len(nrow(datos))\nprint(cor.test(tiempo, datos$V1, method = "kendall", exact = FALSE))\nplot(tiempo, datos$V1, type = "b")'};code+=scripts[v.mode]+'\n';return {metrics:[['Script listo','R base','sin paquetes externos'],['Observaciones incluidas',v.a.length,''],['Variables',m,'']],code,message:'El script se genera y puede ejecutarse en R WebAssembly desde esta suite. El motor y R base se sirven localmente, sin CDN.'};},'Genera y ejecuta R base en el navegador con WebR local. Revisa supuestos y errores del modelo; paquetes externos no precargados.');
  reg('analysis-timeseries','Series temporales · tendencia y anomalías',[T('a','Tiempo numérico y valor','1;12\n2;13\n3;11\n4;15\n5;16\n6;14\n7;18\n8;20','Dos columnas: tiempo creciente; valor. Hasta 500 observaciones.'),F('window','Ventana de media móvil','observaciones',3,2,100)],'Pendiente de Sen = mediana de pendientes por pares; prueba Mann–Kendall con corrección por empates; ACF1 según NIST; media móvil retrospectiva.',v=>{const a=v.a,n=a.length;A(n>=3&&n<=500&&a[0].length===2,'Usa de 3 a 500 filas con dos columnas.');A(a.every((r,i)=>!i||r[0]>a[i-1][0]),'El tiempo debe ser estrictamente creciente.');A(Number.isInteger(v.window),'La ventana debe ser entera.');const y=a.map(r=>r[1]),mean=st.mean(y),den=S(y.map(x=>(x-mean)**2));A(den>0,'La serie es constante: la tendencia y ACF no son informativas.');let mk=0;const slopes=[];for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){mk+=Math.sign(y[j]-y[i]);slopes.push((y[j]-y[i])/(a[j][0]-a[i][0]));}const ties=new Map();y.forEach(x=>ties.set(x,(ties.get(x)||0)+1));const variance=(n*(n-1)*(2*n+5)-S([...ties.values()].map(t=>t*(t-1)*(2*t+5))))/18,z=mk>0?(mk-1)/Math.sqrt(variance):mk<0?(mk+1)/Math.sqrt(variance):0,p=2*(1-st.normalCdf(Math.abs(z))),acf=S(y.slice(1).map((x,i)=>(x-mean)*(y[i]-mean)))/den,q1=st.quantile(y,.25),q3=st.quantile(y,.75),iqr=q3-q1,moving=y.map((_,i)=>i+1>=v.window?st.mean(y.slice(i-v.window+1,i+1)):null),regular=a.slice(2).every((r,i)=>Math.abs((r[0]-a[i+1][0])-(a[1][0]-a[0][0]))<1e-8);return {metrics:[['Pendiente de Sen',st.median(slopes),'valor/unidad de tiempo'],['Mann–Kendall · p bilateral',p,'aproximación normal'],['ACF de orden 1',regular?acf:'Tiempo irregular','']],headers:['Tiempo','Valor','Media móvil','Fuera de cercas IQR'],rows:a.map((r,i)=>[...r,moving[i]===null?'':moving[i],r[1]<q1-1.5*iqr||r[1]>q3+1.5*iqr?'Sí':'No']),series:[{name:'Observado',data:a,points:true},{name:'Media móvil',data:a.filter((_,i)=>moving[i]!==null).map((r,i)=>[r[0],moving[i+v.window-1]]),color:'#A57B1F'}],xLabel:'Tiempo',message:'Mann–Kendall sin corrección por autocorrelación ni estacionalidad. '+(regular?'ACF calculada con intervalos regulares.':'No se presenta ACF porque el muestreo es irregular.')};});
  reg('analysis-regression','Regresión lineal múltiple y residuos',[T('a','Respuesta y predictores','10;1;2\n13;2;1\n15;3;3\n17;4;2\n22;5;4\n24;6;3\n29;7;5','Columna 1 = respuesta y; columnas siguientes = predictores. Se incluye intercepto.')],'Mínimos cuadrados ordinarios con intercepto. Se muestran coeficientes, error estándar, t, p bilateral, R² ajustado y residuos.',v=>{const a=v.a,n=a.length,k=a[0].length-1;A(k>=1&&k<=10&&n>k+1,'Usa 1–10 predictores y más observaciones que coeficientes.');const y=a.map(r=>r[0]);A(st.sd(y)>0,'La respuesta no debe ser constante.');const model=st.ols(a.map(r=>r.slice(1)),y);A(model,'Predictores colineales o matriz singular; revisa tus datos.');return {metrics:[['R² ajustado',model.r2adj,''],['R²',model.r2,''],['Error residual',model.rmse,'unidad de y'],['Grados de libertad',model.df,'']],headers:['Término','Coeficiente','Error estándar','t','p bilateral'],rows:model.beta.map((x,i)=>[i?'X'+i:'Intercepto',x,model.se[i],model.t[i],model.p[i]]),series:[{name:'Residuos vs ajustados',data:model.yhats.map((x,i)=>[x,y[i]-x]),type:'scatter',points:true}],xLabel:'Valor ajustado',yLabel:'Residuo',message:'Supuestos: linealidad, errores independientes, varianza constante y normalidad para inferencia. La implementación usa ecuaciones normales: evita escalas extremas.'};});
  reg('analysis-pca','Componentes principales · PCA',[dataset()],'Estandarización z muestral, matriz de correlación y descomposición simétrica de Jacobi. Cargas = autovectores; scores = Z × autovectores.',v=>{const a=v.a,n=a.length,m=a[0].length;A(n>=3&&m>=2&&m<=15,'Usa al menos tres observaciones y 2–15 variables.');const cols=L.transpose(a),mean=cols.map(st.mean),sd=cols.map(st.sd);A(sd.every(x=>x>0),'PCA no admite columnas constantes.');const z=a.map(r=>r.map((x,j)=>(x-mean[j])/sd[j])),corr=L.multiply(L.transpose(z),z).map(r=>r.map(x=>x/(n-1))),eig=L.eigen(corr),total=S(eig.map(e=>e.value)),scores=z.map(r=>eig.map(e=>S(r.map((x,j)=>x*e.vector[j]))));let accum=0;return {metrics:[['Varianza explicada PC1',100*eig[0].value/total,'%'],['Varianza PC1 + PC2',100*(eig[0].value+eig[1].value)/total,'%'],['Variables',m,'']],headers:['Componente','Autovalor','Varianza (%)','Acumulada (%)',...cols.map((_,j)=>'Carga V'+(j+1))],rows:eig.map((e,i)=>{accum+=e.value;return ['PC'+(i+1),e.value,100*e.value/total,100*accum/total,...e.vector];}),series:[{name:'Observaciones · PC1/PC2',data:scores.map(s=>[s[0],s[1]]),type:'scatter',points:true}],xLabel:'PC1',yLabel:'PC2',message:'El signo de cada componente puede invertirse sin cambiar el resultado. Se muestran cargas como autovectores unitarios, no correlaciones variable–componente.'};});
  const qa=T('raw','Tabla a revisar','10;22;3\n12;;4\n10;22;3\n-5;200;2\n11;23;3','Columnas separadas por punto y coma o tabulador; se admiten celdas vacías. No uses encabezados.');qa.raw=true;
  reg('analysis-qaqc','Control de calidad de datos · QA/QC',[qa],'Detección de celdas vacías/no numéricas, registros duplicados, valores negativos y extremos con cercas de Tukey Q1−1,5 IQR y Q3+1,5 IQR.',v=>{const lines=v.raw.trim().split(/\r?\n/);A(lines.length>0&&lines.length<=1000,'Máximo 1000 filas.');const raw=lines.map(s=>s.split(/[;\t]/).map(x=>x.trim())),m=Math.max(...raw.map(r=>r.length));A(m<=30,'Máximo 30 columnas.');const values=raw.map(r=>Array.from({length:m},(_,j)=>{try{return L.number(r[j]||'');}catch(e){return null;}})),cols=L.transpose(values),bounds=cols.map(c=>{const a=c.filter(x=>x!==null),q1=st.quantile(a,.25),q3=st.quantile(a,.75);return [q1-1.5*(q3-q1),q3+1.5*(q3-q1)];}),seen=new Set(),issues=[];let missing=0,dups=0;raw.forEach((r,i)=>{const key=JSON.stringify(r);if(seen.has(key)){issues.push([i+1,'Fila','Registro duplicado']);dups++;}seen.add(key);for(let j=0;j<m;j++){const x=values[i][j];if(x===null){missing++;issues.push([i+1,j+1,r[j]?'No numérico':'Celda vacía']);}else{if(x<0)issues.push([i+1,j+1,'Valor negativo']);if(x<bounds[j][0]||x>bounds[j][1])issues.push([i+1,j+1,'Fuera de cercas IQR']);}}});return {metrics:[['Hallazgos para revisar',issues.length,''],['Celdas vacías o inválidas',missing,''],['Duplicados exactos',dups,''],['Filas revisadas',raw.length,'']],headers:['Fila','Columna','Hallazgo'],rows:issues,message:'Los hallazgos no se eliminan automáticamente. Un negativo o un extremo puede ser válido según la variable.'};});
  function seededRandom(seed) {
    let state=seed>>>0;
    return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return (state+.5)/4294967296;};
  }
  reg('analysis-sampling','Muestreo e incertidumbre · Monte Carlo',[
    F('mean','Media de la población','',100),F('sd','Desviación estándar','',15,0),
    F('error','Semiancho objetivo para la media','',5,1e-9),
    F('p','Proporción esperada','%',50,.001,99.999),
    F('margin','Margen para la proporción','puntos porcentuales',5,.001,100),
    F('confidence','Nivel de confianza','%',95,50,99.99),
    F('n','Tamaño de muestra simulado','',30,2,10000),
    F('reps','Réplicas Monte Carlo','',2000,100,10000),
    F('seed','Semilla reproducible','',42,1,4294967295)
  ],'Tamaño para una proporción = techo[z²p(1−p)/e²]. Tamaño para la media = techo[(zσ/E)²]. Las medias normales se simulan con Box–Muller y una semilla reproducible.',v=>{
    A([v.n,v.reps,v.seed].every(Number.isInteger),'n, réplicas y semilla deben ser enteros.');
    const p=v.p/100, e=v.margin/100, alpha=(1-v.confidence/100)/2;
    const z=st.invNormal(1-alpha), rng=seededRandom(v.seed), se=v.sd/Math.sqrt(v.n);
    const a=Array.from({length:v.reps},()=>v.mean+se*Math.sqrt(-2*Math.log(rng()))*Math.cos(2*Math.PI*rng()));
    return {metrics:[['Tamaño objetivo · proporción',Math.ceil(z*z*p*(1-p)/(e*e)),'observaciones'],
      ['Tamaño objetivo · media',Math.max(2,Math.ceil((z*v.sd/v.error)**2)),'observaciones'],
      ['Percentil inferior',st.quantile(a,alpha),''],['Percentil superior',st.quantile(a,1-alpha),''],
      ['Error estándar teórico',se,'']],headers:['Réplica','Media simulada'],rows:a.map((x,i)=>[i+1,x]),
      series:[histogram(a,'Medias simuladas')],xLabel:'Media de la réplica',yLabel:'Frecuencia',
      message:'Muestreo aleatorio simple. Aproximación normal para la proporción; no se aplica corrección por población finita. Semilla '+v.seed+'.'};
  });
  reg('analysis-spatial','Autocorrelación y vecindad espacial',[
    T('a','Coordenadas planas y valor','0;0;10\n100;0;12\n0;100;9\n100;100;14\n200;100;20','Columnas: x (m); y (m); valor. Usa un mismo sistema proyectado.'),
    L.select('weight','Ponderación',[['inverse','Inversa de la distancia'],['binary','Binaria por distancia']],'inverse'),
    F('dist','Umbral de vecindad','m',150,1e-9)
  ],'Moran global y local con pesos 1/d o pesos binarios dentro del umbral. Sin diagonal ni estandarización por fila. Distancia al vecino más próximo.',v=>{
    const a=v.a,n=a.length;
    A(a[0].length===3&&n>=3&&n<=500,'Usa tres columnas y de 3 a 500 puntos.');
    const mean=st.mean(a.map(r=>r[2])), z=a.map(r=>r[2]-mean),den=S(z.map(x=>x*x));
    A(den>0,'La variable debe tener variación.');
    const nearest=Array(n).fill(Infinity),lag=Array(n).fill(0),degrees=Array(n).fill(0);
    let totalWeight=0;
    for (let i=0;i<n;i++) for (let j=i+1;j<n;j++) {
      const d=Math.hypot(a[i][0]-a[j][0],a[i][1]-a[j][1]);
      A(d>0||v.weight==='binary','Las coordenadas coincidentes no admiten peso 1/d. Agrega los registros coincidentes o usa ponderación binaria.');
      nearest[i]=Math.min(nearest[i],d);
      nearest[j]=Math.min(nearest[j],d);
      if (d>v.dist) continue;
      const w=v.weight==='binary'?1:1/d;
      totalWeight+=2*w;
      lag[i]+=w*z[j];
      lag[j]+=w*z[i];
      degrees[i]++;
      degrees[j]++;
    }
    A(totalWeight>0&&Number.isFinite(totalWeight),'No hay pesos utilizables. Revisa coordenadas y umbral.');
    const local=z.map((x,i)=>n*x*lag[i]/den);
    return {metrics:[['I de Moran global',S(local)/totalWeight,''],['Esperanza bajo aleatoriedad',-1/(n-1),''],
      ['Distancia media al vecino más próximo',st.mean(nearest),'m'],['Puntos aislados',degrees.filter(x=>x===0).length,'']],
      headers:['Punto','Vecinos','Vecino más próximo (m)','Moran local Iᵢ'],
      rows:a.map((_,i)=>['P'+(i+1),degrees[i],nearest[i],degrees[i]?local[i]:null]),
      series:[{name:'Puntos de muestreo',data:a.map(r=>r.slice(0,2)),type:'scatter',points:true}],
      xLabel:'x (m)',yLabel:'y (m)',message:'Los resultados globales y locales son descriptivos. La distancia media al vecino se calcula sobre todos los puntos.'};
  });
  reg('analysis-standards','Comparador de límites ambientales',[
    T('a','Medición, límite inferior y superior','8;6.5;8.5\n60;0;50\n20;0;25','Columnas: valor medido; límite inferior; límite superior. Usa la misma unidad por fila.'),
    L.select('period','Período de promedio',[['1h','1 hora'],['8h','8 horas'],['24h','24 horas'],['month','Mensual'],['annual','Anual'],['na','No aplica']],'24h'),
    L.select('rule','Regla de decisión',[['simple','Aceptación simple · w = 0'],['guard','Banda de guarda · w = U'],['half','Banda de guarda · w = U/2']],'guard'),
    L.f('u','Incertidumbre expandida U','misma unidad',0.5,0),
    L.f('lod','LOD · límite de detección','misma unidad',0,0),
    L.f('loq','LOQ · límite de cuantificación','misma unidad',0,0),
    L.text('source','Fuente, edición y jurisdicción','Tabla de ejemplo · reemplazar por fuente aplicable','La tabla es aportada por el usuario; no hay límites regulatorios precargados.')
  ],'Estados: conforme si el intervalo con banda de guarda queda dentro de los límites; no conforme si el intervalo expandido queda completamente fuera; no concluyente si cruza el límite; no cuantificable si la medición es menor que el LOD o el LOQ. La incertidumbre y los límites deben expresarse en la misma unidad y período.',v=>{
    A(v.a[0].length===3&&v.a.every(r=>r[1]<=r[2]),'Usa tres columnas con límite inferior ≤ superior.');
    const U=Math.max(0,v.u), lod=Math.max(0,v.lod), loq=Math.max(0,v.loq);
    A(!(lod>0&&loq>0&&loq<lod),'El LOQ debe ser mayor o igual que el LOD.');
    A(U>0||v.rule==='simple','Declara la incertidumbre expandida U o usa aceptación simple.');
    const w=v.rule==='simple'?0:v.rule==='half'?U/2:U;
    const periodLabel={ '1h':'1 hora','8h':'8 horas','24h':'24 horas',month:'mensual',annual:'anual',na:'no aplica' }[v.period]||v.period;
    const states=v.a.map(r=>{
      const [x,l1,l2]=r;
      if((lod>0&&x<lod)||(loq>0&&x<loq)) return lod>0&&x<lod?'No cuantificable (< LOD)':'Detectado (< LOQ)';
      if(x+w<=l2&&x-w>=l1) return 'Conforme';
      if(x-U>l2||x+U<l1) return 'No conforme';
      return 'No concluyente';
    });
    const count=s=>states.filter(x=>x===s).length;
    const nonDetect=states.filter(x=>x.startsWith('No cuantificable')||x.startsWith('Detectado')).length;
    return {
      metrics:[['Conformes',count('Conforme'),'mediciones'],['No concluyentes',count('No concluyente'),'mediciones'],['No conformes',count('No conforme'),'mediciones'],['No cuantificables',nonDetect,'mediciones'],['Banda de guarda w',w,'unidad'],['Período',periodLabel,'']],
      headers:['Medición','Valor','Límite inferior','Límite superior','U','w','Estado'],
      rows:v.a.map((r,i)=>['M'+(i+1),...r,U,w,states[i]]),
      message:'Fuente declarada: '+v.source+'. Período de promedio: '+periodLabel+'. '+(U?'U = '+U+' y w = '+w+'. ':'Aceptación simple sin banda de guarda. ')+'La comparación es válida solo si valor, límites e incertidumbre comparten unidad, base y período; verifique además la vigencia y el criterio de excedencia de la norma.'
    };
  });
})();
