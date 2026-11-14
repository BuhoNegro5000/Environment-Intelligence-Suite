/* Shared calculator presentation, enabled for three pilot routes. */
(function () {
  'use strict';
  const G=GL, E=G.escape;
  const pilotSummaries={
    'mbr-process-membrane-sizing':'Dimensiona el reactor biológico y la superficie de membrana a partir del caudal, la carga orgánica y las condiciones de filtración.',
    'curve-number-runoff':'Estima la escorrentía directa y el caudal pico de un evento de lluvia con el número de curva del NRCS.',
    'epa-air-quality-index':'Calcula el índice diario de calidad del aire de la EPA y detecta el contaminante dominante a partir de concentraciones medidas.'
  };
  const iconPaths={
    fav:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 2.9 1-6.2L3 9.6l6.2-.9Z"/>',
    report:'<path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10ZM13 3v7h7M8 14h8m-8 3h5"/>',
    csv:'<path d="M12 3v12m-4-4 4 4 4-4M5 17v3h14v-3"/>',
    reset:'<path d="M3 12a9 9 0 1 1 2.5 6.2M3 5v7h7"/>',
    next:'<path d="M12 5v14m-6-6 6 6 6-6"/>'
  };
  const icon=name=>'<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+iconPaths[name]+'</svg>';
  const labels={fav:'Favorito',report:'Abrir informe',csv:'Descargar CSV',reset:'Restablecer valores'};
  const formats=[['auto','Automática'],['0','0 decimales'],['1','1 decimal'],['2','2 decimales'],['4','4 decimales'],['6','6 decimales'],['full','Completa']];
  const numberFormats=new Map();
  const getPrecision=()=>G.store.get('calculator.precision','auto');
  function format(value,precision='auto'){
    if(typeof value!=='number')return String(value??'—');
    const magnitude=Math.abs(value);
    const automatic=precision==='auto'||!formats.some(([id])=>id===precision);
    const scientific=(automatic||precision==='full')&&magnitude>0&&(magnitude<.0001||magnitude>=1e10);
    const key=precision+(scientific?':sci':'');
    if(!numberFormats.has(key)){
      const digits=automatic?{maximumSignificantDigits:4}:precision==='full'?{maximumSignificantDigits:17}:{maximumFractionDigits:Number(precision),minimumFractionDigits:Number(precision)};
      numberFormats.set(key,new Intl.NumberFormat('es-ES',{...digits,useGrouping:'always',notation:scientific?'scientific':'standard'}));
    }
    return numberFormats.get(key).format(Object.is(value,-0)?0:value);
  }
  function header(t){
    const actions=['fav',...(t.report?['report']:[]),...(t.csv?['csv']:[]),'reset'];
    const buttons=actions.map(a=>{
      const pressed=a==='fav'?' aria-pressed="'+G.isFav(t.id)+'"':'';
      return '<span class="calc-action"><button type="button" data-act="'+a+'" aria-label="'+labels[a]+'"'+pressed+'>'+icon(a)+'</button><span class="calc-tooltip" aria-hidden="true">'+labels[a]+'</span></span>';
    }).join('');
    const category='<a class="calc-category" href="#/suite/'+t.suite+'">'+E(G.suites[t.suite].name)+'</a>';
    const related=(t.relatedSuites||[]).map(id=>'<a class="calc-related" href="#/suite/'+id+'">'+E(G.suites[id].short)+' ↗</a>').join('');
    return '<header class="calc-head"><div class="calc-head-main"><div class="calc-context">'+category+
      '<span class="calc-local"><i aria-hidden="true"></i>Cálculo local</span></div><h1>'+
      E(t.title)+'</h1><p>'+E(pilotSummaries[t.id]||t.desc)+'</p>'+related+'</div><div class="calc-actions" role="group" aria-label="Acciones de la calculadora">'+buttons+'</div></header>';
  }
  function field(f,id){
    const numeric=!f.type;
    const hint=f.hint||(!numeric?null:[f.min!==undefined?'Mínimo '+G.fmt(f.min,6):'',f.max!==undefined?'máximo '+G.fmt(f.max,6):''].filter(Boolean).join(' · '));
    return '<div class="field calc-field"><div class="calc-label"><label for="'+id+'">'+E(f.label)+'</label>'+
      (hint?'<details class="calc-help"><summary aria-label="Ayuda para '+E(f.label)+'">?</summary><p>'+E(hint)+'</p></details>':'')+
      '</div><div class="calc-control"><input id="'+id+'" type="text" '+(numeric?'inputmode="decimal" ':'')+
      'value="'+E(f.value)+'" aria-describedby="'+id+'-error">'+(f.unit?'<span class="calc-unit">'+E(f.unit)+'</span>':'')+
      '</div><small id="'+id+'-error" class="calc-field-error" hidden></small></div>';
  }
  function workbench(d,fields){
    const linkList=(d.refs||[]).map(([label,url])=>'<a href="'+E(url)+'" target="_blank" rel="noopener noreferrer">'+E(label)+' ↗</a>').join('');
    return '<div class="lab-workbench calc-workbench"><div class="lab-grid">'+
      '<section class="lab-inputs panel"><div class="calc-panel-heading"><h2>Entradas</h2><p>Edita los valores para actualizar el escenario.</p></div><div class="lab-fields">'+fields+'</div></section>'+
      '<section class="lab-results panel" aria-label="Resultados"><div class="calc-panel-heading calc-results-head"><div><h2 tabindex="-1" data-calc-result>Resultados</h2><p data-lab-status role="status">Calculando escenario…</p></div>'+
      '<label class="calc-precision">Precisión<select data-calc-precision>'+formats.map(([id,label])=>'<option value="'+id+'">'+label+'</option>').join('')+'</select></label></div>'+
      '<div data-lab-output></div><div class="calc-compare"><button class="calc-compare-btn" type="button" data-calc-compare disabled aria-controls="calc-comparison">Fijar referencia</button>'+
      '<p class="calc-comparison" id="calc-comparison" data-calc-comparison aria-live="polite" hidden></p></div><button class="calc-raw" type="button" data-calc-raw>CSV de datos sin redondeo</button></section></div>'+
      '<details class="lab-method panel calc-method"><summary>Método y supuestos</summary><div class="lab-method-content"><div><h3>Fórmula</h3><p>'+E(d.method)+'</p></div><div><h3>Alcance y referencias</h3><p>'+
      E(d.limit||'Revisa las unidades y la representatividad de tus datos.')+'</p>'+linkList+'</div></div></details>'+
      '<button class="calc-mobile-result" data-calc-jump type="button" hidden><span><span data-calc-mobile-label></span><b data-calc-mobile-value></b></span>'+icon('next')+'</button></div>';
  }
  function metric([label,value,unit],i,display){
    return '<div class="lab-metric'+(i===0?' lab-primary':'')+'"><span>'+E(label)+'</span><div class="calc-amount">'+
      '<strong>'+E(display(value))+'</strong>'+(unit?'<small>'+E(unit)+'</small>':'')+'</div></div>';
  }
  function bind(root,update){
    const select=root.querySelector('[data-calc-precision]');
    const saved=getPrecision();
    select.value=formats.some(([id])=>id===saved)?saved:'auto';
    select.addEventListener('change',()=>{
      G.store.set('calculator.precision',select.value);
      update();
    });
    const bar=root.querySelector('[data-calc-jump]');
    bar.addEventListener('click',()=>{
      const title=root.querySelector('[data-calc-result]');
      title.focus({preventScroll:true});
      title.scrollIntoView({block:'start',behavior:'instant'});
    });
    const compare=root.querySelector('[data-calc-compare]');
    const difference=root.querySelector('[data-calc-comparison]');
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    let reference=null,current=null;
    const numeric=metric=>typeof metric?.[1]==='number'&&Number.isFinite(metric[1]);
    const sameMetric=(a,b)=>a?.[0]===b?.[0]&&a?.[2]===b?.[2];
    const amount=(value,unit)=>format(value,select.value)+(unit?' '+unit:'');
    function renderComparison(){
      compare.textContent=reference?'Quitar referencia':'Fijar referencia';
      compare.disabled=!reference&&!numeric(current);
      difference.hidden=!reference;
      if(!reference){difference.textContent='';return;}
      const [label,value,unit]=reference;
      const delta=numeric(current)&&sameMetric(reference,current)?current[1]-value:null;
      const result=delta===null?'Variación no disponible.':'Variación '+(delta>0?'+':'')+amount(delta,unit)+'.';
      const text='Referencia de '+label.toLowerCase()+': '+amount(value,unit)+'. '+result;
      if(difference.textContent!==text)difference.textContent=text;
    }
    compare.addEventListener('click',()=>{
      if(reference)reference=null;
      else{
        update();
        if(numeric(current))reference=current.slice();
      }
      renderComparison();
    });
    return {
      select,
      display:value=>format(value,select.value),
      results(first){
        const changed=current&&first&&(!sameMetric(current,first)||current[1]!==first[1]);
        current=first;
        renderComparison();
        if(changed&&!motion.matches)root.querySelector('.lab-primary')?.animate([
          {transform:'translateY(3px)',opacity:.72},
          {transform:'translateY(0)',opacity:1}
        ],{duration:240,easing:'ease-out'});
        bar.hidden=!first;
        bar.querySelector('[data-calc-mobile-label]').textContent=first?.[0]||'';
        bar.querySelector('[data-calc-mobile-value]').textContent=first?format(first[1],select.value)+(first[2]?' '+first[2]:''):'';
      }
    };
  }
  function setFieldError(element,message=''){
    const hint=element.closest('.calc-field')?.querySelector('.calc-field-error');
    if(!hint)return;
    hint.hidden=!message;
    hint.textContent=message;
    if(message)element.setAttribute('aria-invalid','true');
    else element.removeAttribute('aria-invalid');
  }
  function download(id,report,detail,precision){
    const entries=[
      ['Metadatos','Herramienta',report.title,''],['Metadatos','Versión',G.version,''],
      ['Metadatos','Fecha UTC',new Date().toISOString(),''],['Metadatos','Precisión',precision,''],
      ...report.inputs.map(([name,value])=>['Entrada',name,value,'']),
      ...report.results.map(([name,value,unit])=>['Resultado',name,value,unit])
    ];
    if(detail.length&&report.hasDetail){
      for(const [i,row] of detail.entries()){
        entries.push(...Object.entries(row).map(([name,value])=>['Detalle · fila '+(i+1),name,format(value,precision),'']));
      }
    }
    const headings=['Sección','Campo','Valor','Unidad'];
    const safe=value=>typeof value==='string'&&/^[\s]*[=+@\-\t\r]/.test(value)&&!/^[-+]?\d+(?:[.,]\d+)?(?:e[-+]?\d+)?$/i.test(value.trim())?"'"+value:value;
    const rows=entries.map(row=>Object.fromEntries(headings.map((name,i)=>[name,safe(row[i])])));
    G.csvDownload('Yupana_'+id+'.csv',rows,headings);
  }
  G.calculatorUI={isPilot:id=>Object.hasOwn(pilotSummaries,id),header,field,workbench,metric,bind,setFieldError,download,getPrecision};
})();
