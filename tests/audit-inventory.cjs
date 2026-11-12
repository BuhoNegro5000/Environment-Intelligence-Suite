/* Rebuild the source-backed inventory with the suite running on localhost. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require(process.env.GREENOWL_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'..');
const pageUrl=process.env.GREENOWL_TEST_URL||'http://127.0.0.1:8876/';
const sandbox={console,document:{addEventListener(){}},localStorage:{getItem(){return null},setItem(){}}};
sandbox.window=sandbox;sandbox.self=sandbox;vm.createContext(sandbox);
const origins=new Map();
for(const [,file] of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"]+)"/g)){
  if(file.endsWith('/app.js')||file.endsWith('/leaflet.js'))continue;
  const first=sandbox.GL?.tools?.length||0;
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
  for(const t of sandbox.GL?.tools?.slice(first)||[])origins.set(t.id,file);
}
const clean=x=>String(x??'').replace(/\s+/g,' ').trim();
const cell=x=>clean(x).replaceAll('|','\\|');
function field(f){
  const bounds=[f.min===undefined?'':'mín. '+f.min,f.max===undefined?'':'máx. '+f.max].filter(Boolean);
  const suffix=[f.unit,...bounds].filter(Boolean).join(', ');
  const description=[f.hint, f.options?.map(o=>o[1]).join(' / ')].filter(Boolean).join(' ');
  return f.label+(suffix?' ('+suffix+')':'')+(description?' — '+description:'');
}
function mdLinks(refs){
  return [...new Map(refs.map(([name,url])=>[url,name])).entries()].map(([url,name])=>'['+cell(name)+'](<'+url+'>)').join(' · ');
}
async function main(){
  const G=sandbox.GL;
  const browser=await chromium.launch({headless:true,...(process.env.GREENOWL_BROWSER?{executablePath:process.env.GREENOWL_BROWSER}:{})});
  try{
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pageUrl);
    await page.waitForFunction(()=>!!window.GL?.getTool('unit-converter'));
    const items=[];
    const bounds={tested:0,finite:0,rejected:0};
    for(const t of G.tools){
      let inputs=[],outputs=[],method='',limit='',refs=t.lab?.refs||[];
      if(t.lab){
        const d=t.lab;
        const values=Object.fromEntries(d.fields.map(f=>[f.key,f.type==='table'&&!f.raw?G.lab.matrix(f.value):f.type||f.raw?f.value:Number(f.value)]));
        const result=d.calc(values);
        inputs=d.fields.map(field);
        outputs=result.metrics.map(([label,,unit])=>label+(unit?' ('+unit+')':''));
        if(result.headers?.length)outputs.push('Tabla: '+result.headers.join(' / '));
        for(const f of d.fields){
          for(const x of new Set([f.min,f.max].filter(Number.isFinite))){
            if(f.type||x===values[f.key])continue;
            bounds.tested++;
            let edge;
            try{edge=d.calc({...values,[f.key]:x});}catch{bounds.rejected++;continue;}
            const numbers=[...edge.metrics.map(row=>row[1]),...(edge.rows||[]).flat()].filter(v=>typeof v==='number');
            assert.ok(numbers.every(Number.isFinite),d.id+' · '+f.key+' = '+x);
            bounds.finite++;
          }
        }
        method=d.method;
        limit=d.limit;
      }else{
        await page.evaluate(id=>{location.hash='#/tool/'+id;},t.id);
        await page.locator('[data-tool="'+t.id+'"] #toolBody').waitFor();
        const legacy=await page.evaluate(id=>{
          const t=GL.getTool(id), root=document.getElementById('toolBody');
          function plain(s){
            const el=document.createElement('div');
            el.innerHTML=(s||'').replace(/<\/(p|div)>|<br\s*\/?\s*>/gi,' ');
            return el.textContent||'';
          }
          const labels=[...root.querySelectorAll('input,select,textarea')].map(el=>{
            const own=el.closest('label');
            const linked=el.labels?.[0];
            const near=el.closest('.field')?.querySelector('label,span');
            return (own||linked||near)?.textContent||el.getAttribute('aria-label')||el.placeholder||el.id||el.name||'archivo';
          });
          let report=null;
          try{report=t.report?.()||null;}catch{}
          const results=report?.results?.map(([label,,unit])=>label+(unit?' ('+unit+')':''))||[];
          const display=[...root.querySelectorAll('.metric')].map(el=>el.firstElementChild?.textContent||'');
          const notes=(report?.notes||[]).map(plain);
          const urls=notes.flatMap(note=>[...note.matchAll(/https?:\/\/[^\s<]+/g)].map(x=>x[0]));
          return {labels,results,display,method:plain(report?.method),notes,urls};
        },t.id);
        inputs=legacy.labels;
        outputs=[...new Set(legacy.results.length?legacy.results:legacy.display)];
        method=legacy.method;
        limit=legacy.notes.filter(x=>!x.includes('https://')).join(' ');
        refs=legacy.urls.map(url=>['Referencia del informe',url]);
      }
      const source=origins.get(t.id);
      assert.ok(source,t.id);
      items.push({id:t.id,title:t.title,suite:t.suite,purpose:t.desc,inputs,outputs,method,limit,refs,source});
    }
    assert.equal(items.length,G.tools.length);
    assert.deepEqual(errors,[]);
    const missing=items.filter(t=>!clean(t.method)).map(t=>t.id);
    const intro=[
      '# Inventario técnico de Green Owl Labs','',
      'Corte de la auditoría: 11 de noviembre de 2026. '+items.length+' herramientas, '+G.lab.definitions.length+' modelos declarativos.',
      'Las entradas incluyen las restricciones declaradas en el código cuando existen. Las salidas corresponden al escenario de ejemplo; los modos condicionales pueden añadir otras. En pantallas especializadas se indican los controles o el flujo de trabajo. El enlace al archivo identifica la implementación y las referencias científicas se listan cuando están declaradas o fueron verificadas en esta auditoría.',
      'La documentación del método y una prueba reproducible son evidencias distintas de la validación científica. Consulte el [informe de auditoría](AUDITORIA-TECNICA.md) para el alcance y los hallazgos.',''
    ];
    const missingDocumentation={
      'boundary-validator':'Chequea cierre, duplicados, cruces, orientación y huecos. Área exterior menos huecos. SHP exige CRS declarado y se transforma a WGS 84 cuando corresponde.',
      'shp-to-kml':'Lectura binaria de SHP/DBF y reproyección según EPSG declarado. Exporta KML 2.2 con ExtendedData o GeoJSON WGS 84.',
      'soil-colour':'Linealiza sRGB y transforma RGB a XYZ D65 y XYZ a CIELAB. Tono por atan2(b*,a*), croma CIELAB por √(a*²+b*²), notación Munsell aproximada.',
      'yield-limiting':'Une por identificador único o vecino más cercano. Haversine en WGS 84 o distancia euclidiana en un CRS métrico común. Pearson r y OLS por variable.',
      'biotic-workbench':'H-FBI = Σ nᵢtᵢ/N; BMWP = suma de puntajes; ASPT = BMWP/n; EPT = 100 N_EPT/N; SIGNAL2 OCP = media ponderada por clase de abundancia agrupada por orden; Shannon = −Σ pᵢln(pᵢ); Simpson = 1−Σpᵢ².',
      'unit-converter':'Transformación vía unidad base: xbase = factor × x + desplazamiento; se invierte la transformación destino. Las unidades no lineales usan sus transformaciones explícitas.',
      'spatial-workbench':'Operaciones geométricas por acción con Turf/Leaflet/Proj4 según el módulo. Usa la salida de la operación y la bitácora del proyecto para identificar parámetros y CRS.',
      'taxonomy':'Consulta y filtrado de la taxonomía local BirdNET. La búsqueda es por taxón o nombre y el comparador devuelve sus registros.',
      'biotic-library':'Consulta local de taxones y puntajes publicados. La salida es el registro de referencia asociado al filtro.',
      'bioacoustics':'Inferencia BirdNET mediante el motor local. La confianza del modelo se usa como filtro de detección, sin interpretación como abundancia.'
    };
    const extraRefs={
      'shp-to-kml':[['RFC 7946 · CRS de GeoJSON','https://www.rfc-editor.org/rfc/rfc7946#section-4']],
      'boundary-validator':[['RFC 7946 · geometrías y CRS','https://www.rfc-editor.org/rfc/rfc7946']],
      'soil-colour':[['W3C · conversiones sRGB y Lab','https://www.w3.org/TR/css-color-4/#color-conversion-code']],
      'yield-limiting':[['NIST · correlación','https://www.itl.nist.gov/div898/software/dataplot/refman2/ch2/correlat.pdf']]
    };
    const extraOutputs={
      'unit-converter':'Valor convertido, unidad y factor.',
      'spatial-workbench':'Capas, atributos, resultados geométricos y bitácora.',
      'taxonomy':'Registros taxonómicos y comparación.',
      'biotic-library':'Taxones, puntajes y fuente.',
      'bioacoustics':'Segmentos, especies, confianza y exportaciones.'
    };
    const lines=[...intro];
    for(const suite of Object.values(G.suites)){
      lines.push('## '+suite.name,'','| Herramienta | Propósito | Entradas | Salidas de ejemplo | Fórmula o método y límites | Implementación y fuentes |','| --- | --- | --- | --- | --- | --- |');
      for(const t of items.filter(x=>x.suite===suite.id)){
        const method=clean(t.method)||missingDocumentation[t.id]||'Fórmula no expuesta en el informe de ejemplo. Véase la implementación enlazada.';
        const refs=mdLinks([...t.refs,...(extraRefs[t.id]||[])]);
        const columns=[
          '['+cell(t.title)+'](http://127.0.0.1:8876/#/tool/'+t.id+')',
          cell(t.purpose),
          cell([...new Set(t.inputs.map(clean).filter(Boolean))].join(' · '))||'Controles de la ruta y archivos de entrada según la operación.',
          cell(t.outputs.filter(Boolean).join(' · ')||extraOutputs[t.id])||'Resultados condicionados al archivo, datos u operación.',
          cell([method,clean(t.limit)&&'Alcance: '+clean(t.limit)].filter(Boolean).join(' ')),
          '[Código](../'+t.source+')'+(refs?' · '+refs:' · Fuente primaria sin verificar')
        ];
        lines.push('| '+columns.join(' | ')+' |');
      }
      lines.push('');
    }
    fs.writeFileSync(path.join(root,'docs/INVENTARIO-TECNICO.md'),lines.join('\n'),'utf8');
    console.log(JSON.stringify({herramientas:items.length,modelos:G.lab.definitions.length,bordes:bounds,metodoNoExpuesto:missing}));
  }finally{
    await browser.close();
  }
}
main().catch(err=>{console.error(err);process.exitCode=1;});
