const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium}=require(process.env.GREENOWL_PLAYWRIGHT||'playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.GREENOWL_BROWSER?{executablePath:process.env.GREENOWL_BROWSER}:{})});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[],external=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(/^https?:/.test(r.url())&&!/^http:\/\/(127\.0\.0\.1|localhost):8876\//.test(r.url()))external.push(r.url());});
    await page.goto(process.env.GREENOWL_TEST_URL||'http://127.0.0.1:8876/');
    const open=async()=>{
      await page.evaluate(()=>{location.hash='#/tool/spatial-workbench';});
      await page.getByText('Guardado en este navegador',{exact:true}).waitFor();
    };
    await page.evaluate(()=>GL.store.set('map.layers',[
      {name:'Capa anterior',visible:true,features:[{name:'Muestra histórica',props:{valor:3},geometry:{type:'Point',coordinates:[-74,4]}}]}
    ]));
    await open();
    assert.equal(await page.locator('#mapProjectName').inputValue(),'Proyecto recuperado');
    await page.getByText('Muestra histórica',{exact:true}).waitFor();
    assert.ok(await page.locator('.leaflet-container').count());
    await page.locator('#mapNew').click();
    await page.waitForFunction(()=>document.querySelector('#mapProjectName').value==='Proyecto nuevo');
    await page.locator('#mapProjectName').fill('Campaña del río');
    await page.locator('#mapRename').click();
    await page.locator('#mapProject option').filter({hasText:'Campaña del río'}).waitFor({state:'attached'});

    const polygon={type:'Feature',properties:{name:'Área de control'},geometry:{type:'Polygon',
      coordinates:[[[-74.2,4.4],[-74.0,4.4],[-74.0,4.6],[-74.2,4.6],[-74.2,4.4]]]}};
    const files=[
      {name:'muestreo.csv',mimeType:'text/csv',buffer:Buffer.from('nombre;longitud;latitud;valor\nEstación A;-74.1;4.5;10\nEstación B;-74.09;4.48;20')},
      {name:'poligono.geojson',mimeType:'application/geo+json',buffer:Buffer.from(JSON.stringify(polygon))}
    ];
    await page.locator('#mapFiles').setInputFiles(files);
    await page.getByText('Estación A',{exact:true}).first().waitFor();
    assert.equal(await page.locator('.map-layer').count(),2);
    await page.locator('#mapTabChart').click();
    await page.locator('#mapChartField').selectOption('valor');
    await page.getByRole('img',{name:'Histograma de valor'}).waitFor();
    assert.match(await page.locator('#mapChartBody').textContent(),/Media 15/);

    await page.getByText('Operaciones entre capas poligonales',{exact:true}).click();
    await page.locator('#mapLayerA').selectOption('0');
    await page.locator('#mapLayerB').selectOption('1');
    await page.getByText('Unión espacial de puntos con polígonos',{exact:true}).click();
    await page.locator('#mapJoin').click();
    await page.locator('.map-layer').filter({hasText:'muestreo.csv en poligono.geojson'}).waitFor();
    await page.locator('#mapUndo').click();
    await page.waitForFunction(()=>document.querySelectorAll('.map-layer').length===2);
    await page.locator('#mapRedo').click();
    await page.waitForFunction(()=>document.querySelectorAll('.map-layer').length===3);

    await page.locator('#mapDistance').click();
    const map=page.locator('#mapView');
    await map.click({position:{x:145,y:105}});
    await map.click({position:{x:205,y:110}});
    await page.locator('#mapFinish').click();
    await page.locator('.map-layer').filter({hasText:'Medición de distancia'}).waitFor();
    await page.locator('#mapArea').click();
    await map.click({position:{x:145,y:105}});
    await map.click({position:{x:205,y:110}});
    await map.click({position:{x:180,y:165}});
    await page.locator('#mapFinish').click();
    await page.locator('.map-layer').filter({hasText:'Medición de área'}).waitFor();
    await page.locator('#mapTabLog').click();
    await page.locator('#mapLog').getByRole('cell',{name:'Distancia',exact:true}).waitFor();
    await page.locator('#mapLog').getByRole('cell',{name:'Área',exact:true}).waitFor();

    await page.locator('#mapBasemap').uncheck();
    await page.waitForFunction(()=>!document.querySelector('#toolBody').hasAttribute('aria-busy'));
    const download=page.waitForEvent('download');
    await page.locator('#mapExportProject').click();
    const output=await download;
    assert.match(output.suggestedFilename(),/\.gowl$/);
    const data=await fs.readFile(await output.path());
    const saved=JSON.parse(data).project;
    assert.equal(saved.layers.length,5);
    assert.equal(saved.settings.basemap,false);
    assert.ok(saved.layers[2].features.every(f=>f.props.union_espacial.conteo===1));
    const savedId=await page.locator('#mapProject').inputValue();

    await page.reload();
    await open();
    assert.equal(await page.locator('#mapProject').inputValue(),savedId);
    assert.equal(await page.locator('.map-layer').count(),5);
    assert.equal(await page.locator('#mapBasemap').isChecked(),false);
    await page.locator('#mapOpenProject').setInputFiles({name:'campaña.gowl',mimeType:'application/json',buffer:data});
    await page.waitForFunction(id=>document.querySelector('#mapProject').value!==id,savedId);
    assert.equal(await page.locator('.map-layer').count(),5);
    const before=await page.locator('#mapProject').inputValue();
    await page.locator('#mapOpenProject').setInputFiles({name:'incorrecto.gowl',mimeType:'application/json',buffer:Buffer.from('{"version":2}')});
    await page.getByText('Selecciona un proyecto Yupana Spatial v1 (.gowl).',{exact:true}).first().waitFor();
    assert.equal(await page.locator('#mapProject').inputValue(),before);

    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await mobile.goto((process.env.GREENOWL_TEST_URL||'http://127.0.0.1:8876/').split('#')[0]+'#/tool/spatial-workbench');
    await mobile.getByText('Guardado en este navegador',{exact:true}).waitFor();
    assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
    assert.deepEqual(errors,[]);
    assert.deepEqual(external,[]);
    console.log('OK: Leaflet local, proyecto anterior recuperado, CSV y GeoJSON, gráfico, cruce, deshacer/rehacer, distancia/área, bitácora, recarga, .gowl y móvil.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
