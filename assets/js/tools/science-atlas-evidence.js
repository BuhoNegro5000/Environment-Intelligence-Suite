/* Herramientas de contraste de datos y trazabilidad de proyecto. */
(function(){
  'use strict';
  const L=GL.lab,{reg,m,out,table,f,p,check,nn,int,load,eps}=GL.atlas,{assert:A,sum:S,table:T}=L;
  const raw=(id,label,value,hint)=>({...T(id,label,value,hint),raw:true,preview:false});
  const split=(text,n)=>text.trim().split(/\r?\n/).filter(x=>x.trim()).map((line,i)=>{
    const row=line.split(/[;\t]/).map(x=>x.trim());
    A(row.length===n,'Fila '+(i+1)+': se esperaban '+n+' campos.');
    return row;
  });
  const numeric=value=>value===''?null:L.number(value);

  reg('ion-exchange-equivalent-sizing',['ion-exchange-cedi-designer'],'water','Intercambio iónico · carga equivalente, resina y regenerante',[
    f('q','Caudal','m³/h',28,eps),f('t','Duración objetivo del ciclo','h',16,eps),
    T('a','Iones a intercambiar en la misma resina','80;40.078;2\n30;24.305;2',
      'Columnas: concentración a retirar (mg/L); masa molar (g/mol); magnitud de la carga del ion.'),
    f('cap','Capacidad operativa medida de resina','eq/L',1.2,eps),f('factor','Margen de capacidad','',1.15,1),
    f('regen','Regenerante por m³ de resina','kg/m³',110)
  ],'Carga por especie = Q·C·|z|/masa molar. Resina = carga × tiempo × margen/capacidad. Regenerante = volumen × dosis.',
  v=>{check(v.a,3,r=>nn(r)&&r[1]>0&&int(r[2])&&r[2]>0&&r[2]<=8,'Revisa masa molar y carga del ion.');
    const rows=v.a.map(([c,m,z],i)=>[i+1,c*z/m,v.q*c*z/m]);const demand=S(rows.map(r=>r[2])),bed=demand*v.t*v.factor/(1000*v.cap);
    return table([m('Carga equivalente total',demand,'eq/h'),m('Volumen de resina',bed,'m³'),m('Agua por ciclo',v.q*v.t,'m³'),
      m('Regenerante comercial',bed*v.regen,'kg/ciclo')],['Ion','meq/L','eq/h'],rows);},
  'Calcula una resina a partir de capacidad operativa medida. El diseño de CEDI requiere un modelo y parámetros específicos de equipo.');

  reg('high-purity-sampling-plan',['hpw-quality-sampling-basis-planner'],'metrology','Agua de alta pureza · plan de muestreo y brechas',[
    raw('a','Plan por punto y parámetro','Salida OI;TOC;µg/L;10;2;Combustión;Diaria;Operaciones\nBucle de retorno;Sílice;µg/L;2;5;Colorimetría;Semanal;Laboratorio',
      'Campos separados por punto y coma: punto; parámetro; unidad; límite máximo de proyecto; LOQ; método; frecuencia; responsable.')
  ],'Cada fila conserva la evidencia declarada. Se detectan datos incompletos y métodos cuyo límite de cuantificación supera el criterio.',
  v=>{const rows=split(v.a,8).map(r=>{const target=numeric(r[3]),loq=numeric(r[4]);
    A((target===null||target>=0)&&(loq===null||loq>=0),'Criterios y LOQ deben ser no negativos.');
    const gaps=[r.some(x=>!x)?'Ficha incompleta':'',target!==null&&loq!==null&&loq>target?'LOQ por encima del criterio':''].filter(Boolean);
    return [...r,gaps.join(' · ')||'Documentado'];});
    return table([m('Puntos y parámetros registrados',rows.length),m('Filas con brechas',rows.filter(r=>r[8]!=='Documentado').length)],
      ['Punto','Parámetro','Unidad','Máximo','LOQ','Método','Frecuencia','Responsable','Revisión'],rows);},
  'Los criterios y métodos los aporta el responsable del sistema. El plan documenta capacidad de medición.');

  function qualityReview(a,context){
    const data=split(a,8).map(([site,parameter,unit,value,min,max,evidence,observedUnit])=>{
      const x=numeric(value),lo=numeric(min),hi=numeric(max);
      A(lo===null||hi===null||lo<=hi,'El límite inferior supera al superior.');
      const status=!site||!parameter||!unit||!evidence||x===null||lo===null&&hi===null?'Falta evidencia':
        observedUnit!==unit?'Unidades distintas':lo!==null&&x<lo||hi!==null&&x>hi?'Fuera del rango':'Dentro del rango';
      return [site,parameter,x,observedUnit,lo,hi,unit,evidence,status];
    });
    return table([m('Filas evaluadas',data.length),m('Fuera de rango',data.filter(r=>r[8]==='Fuera del rango').length),
      m('Brechas de evidencia o unidad',data.filter(r=>['Falta evidencia','Unidades distintas'].includes(r[8])).length),m('Base',context)],
      ['Punto','Parámetro','Resultado','Unidad medida','Mínimo','Máximo','Unidad objetivo','Evidencia','Estado'],data);
  }
  const qualityField=example=>raw('a','Observaciones y criterios declarados',example,
    'Punto; parámetro; unidad objetivo; resultado; mínimo opcional; máximo opcional; evidencia; unidad medida. Deja vacíos los datos faltantes.');
  reg('water-evidence-comparison',['wastewater-effluent-reuse-discharge-review','soon-cooling-makeup','soon-cooling-blowdown'],'water',
    'Evidencia de calidad · efluente, reúso y agua de enfriamiento',[
    L.select('context','Escenario',[['effluent','Efluente o reúso'],['makeup','Agua de aporte de torre'],['blowdown','Purga de torre y destino']],'effluent'),
    qualityField('Descarga;SST;mg/L;24;;30;Informe A12;mg/L\nDescarga;pH;pH;7.2;6;9;Informe A12;pH')
  ],'Compara resultados declarados contra rangos del propietario. Unidades y evidencia son obligatorias para la comparación.',
  v=>qualityReview(v.a,({effluent:'Efluente o reúso',makeup:'Agua de aporte de torre',blowdown:'Purga de torre y destino'})[v.context]),
  'Evalúa límites introducidos por el responsable y documenta la procedencia. La verificación regulatoria requiere el instrumento y la muestra aplicables.');

  reg('post-ro-co2-conditioning',['soon-post-ro'],'water','Acondicionamiento post-RO · diferencia de CO₂ y carga',[
    f('q','Caudal de permeado','m³/h',80),f('before','CO₂ disuelto de entrada','mg/L',14),
    f('after','CO₂ disuelto después de desgasificar','mg/L',3),f('target','CO₂ objetivo del proyecto','mg/L',4),
    L.text('evidence','Método y procedencia','Muestreo de permeado y desgasificación')
  ],'Cambio directo = entrada − salida. Masa removida = Q × diferencia/1000.',
  v=>out(m('CO₂ removido',v.before-v.after,'mg/L'),m('Carga removida',load(v.q,v.before-v.after),'kg/h'),
    m('Margen al objetivo',v.target-v.after,'mg/L')),
  'Usa el mismo método en ambas muestras. La remoción observada no dimensiona por sí sola un desgasificador.');

  reg('pipe-continuity-basis',['soon-pipe-basis'],'water','Base de diseño de tubería · continuidad y Reynolds',[
    f('q','Caudal declarado','m³/h',80),f('d','Diámetro interno','mm',150,eps),
    f('nu','Viscosidad medida (0 si no disponible)','cSt',1),L.text('basis','Fluido, caso y fuente','Agua · caudal nominal')
  ],'V=Q/A. Reynolds solo se calcula cuando se declara viscosidad positiva.',
  v=>{const d=v.d/1000,a=Math.PI*d*d/4,u=v.q/3600/a;
    return out(m('Velocidad por continuidad',u,'m/s'),m('Área hidráulica',a,'m²'),
      m('Reynolds',v.nu>0?u*d/(v.nu*1e-6):'Sin viscosidad medida'));},
  'Define el diámetro interno y el caso de caudal. Para pérdidas y transitorios usa el módulo correspondiente.');

  reg('pipe-pressure-evidence',['soon-pipe-pressure'],'water','Tubería · contraste de presión admisible por temperatura',[
    raw('a','Casos y datos de proveedor','Normal;24;24;6;10;Ficha A\nPico;38;25;9;10;Ficha B',
      'Caso; temperatura del caso (°C); temperatura de la ficha (°C); presión de diseño (bar); presión admisible documentada (bar); referencia.')
  ],'Compara presión de diseño con admisible solo cuando la temperatura de la ficha coincide y se registra evidencia.',
  v=>{const rows=split(v.a,6).map(([name,t,r,p,cap,e])=>{
    const values=[t,r,p,cap].map(numeric),[a,b,x,y]=values;
    A((x===null||x>=0)&&(y===null||y>=0),'Presiones no negativas.');
    const complete=Boolean(name&&e&&values.every(z=>z!==null)&&a===b),margin=complete?y-x:null;
    return [name,a,b,x,y,e,margin,complete?(margin>=0?'Cubre el caso':'Excede la ficha'):'Falta evidencia equivalente'];});
    return table([m('Casos con brecha de presión o evidencia',rows.filter(r=>r[7]!=='Cubre el caso').length)],
      ['Caso','T caso','T ficha','Diseño (bar)','Admisible (bar)','Fuente','Margen (bar)','Estado'],rows);},
  'Introduce el dato admisible de proveedor para la temperatura y clase concretas. No se extrapolan curvas ni se aprueba una clase de presión.');

  reg('pfas-lab-evidence',['soon-pfas-influent','soon-pfas-monitoring'],'water','PFAS · registro de laboratorio, censura y decisiones',[
    raw('a','Observaciones por muestra y compuesto','M01;2026-11-01;Afluente;PFOA;ng/L;12;2;EPA 533;Lab A\nM02;2026-11-08;Salida;PFOA;ng/L;<2;2;EPA 533;Lab A',
      'ID de muestra; fecha ISO; punto o recipiente; compuesto; unidad; resultado (admite <); límite de reporte; método; laboratorio.'),
    L.text('basis','Inventario o campaña','Campaña de muestreo de carbón'),
    L.text('decision','Decisión documentada del responsable','Revisar observación en la próxima campaña')
  ],'Conserva el resultado original y separa detecciones, censurados y datos faltantes. Comprueba duplicados por muestra, punto y compuesto.',
  v=>{const keys=new Set(),rows=split(v.a,9).map(r=>{
    const k=[r[0],r[2],r[3]].join('|');A(!keys.has(k),'Registro duplicado: '+k);keys.add(k);
    if(r[1])A(/^\d{4}-\d{2}-\d{2}$/.test(r[1])&&Number.isFinite(Date.parse(r[1]))&&new Date(r[1]).toISOString().slice(0,10)===r[1],'Fecha inválida: '+r[1]);
    const censored=r[5].startsWith('<'),x=numeric(censored?r[5].slice(1).trim():r[5]),limit=numeric(r[6]);
    A((x===null||x>=0)&&(limit===null||limit>=0),'Resultado o límite negativo.');
    const status=r.some(x=>!x)||x===null?'Registro incompleto':censored?'Censurado':'Resultado cuantificado';
    return [...r,status];});
    return table([m('Observaciones',rows.length),m('Resultados censurados',rows.filter(r=>r[9]==='Censurado').length),
      m('Registros incompletos',rows.filter(r=>r[9]==='Registro incompleto').length),m('Decisión registrada',v.decision)],
      ['Muestra','Fecha','Punto','Compuesto','Unidad','Resultado original','Límite','Método','Laboratorio','Estado'],rows);},
  'La hoja permite importar, editar y exportar observaciones. Los datos censurados se conservan sin sustituirlos; la decisión de cambio de medio la aporta el responsable.');

  reg('pfas-lead-lag-inventory',['soon-pfas-lead-lag'],'water','PFAS · inventario lead/lag y contacto por tren',[
    T('a','Recipientes en serie por tren','1;1;30;2;2.5;450\n1;2;30;2;2.5;450\n2;1;25;2;2.5;450\n2;2;25;2;2.5;450',
      'Columnas: tren entero; posición en serie; caudal de tren (m³/h); diámetro (m); altura de lecho (m); densidad aparente (kg/m³).')
  ],'Volumen=πD²H/4. EBCT=60·volumen/Q. Suma el EBCT en serie, contabiliza una vez el caudal por tren y conserva la posición de cada recipiente.',
  v=>{check(v.a,6,r=>r.every(x=>x>0)&&r.slice(0,2).every(int),'Usa códigos enteros y dimensiones y caudal positivos.');
    const trains=new Map();
    const rows=v.a.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(([id,pos,q,d,h,rho])=>{
      const prior=trains.get(id)||{q,pos:0,ebct:0};
      A(prior.q===q&&pos===prior.pos+1,'Las posiciones deben ser consecutivas desde 1, con caudal constante por tren.');
      const vol=Math.PI*d*d*h/4,ebct=60*vol/q;
      trains.set(id,{q,pos,ebct:prior.ebct+ebct});return [id,pos,q,vol,ebct,prior.ebct+ebct,rho*vol];
    });
    return table([m('Trenes',trains.size),m('Caudal total',S([...trains.values()].map(x=>x.q)),'m³/h'),
      m('Inventario de medio',S(rows.map(r=>r[6])),'kg')],
      ['Tren','Posición','Caudal','Lecho (m³)','EBCT (min)','EBCT acumulado (min)','Medio (kg)'],rows);},
  'Los resultados documentan geometría e inventario; la ruptura se estudia con evidencia medida.');
})();
