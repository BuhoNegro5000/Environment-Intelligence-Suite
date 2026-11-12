/* Numerical and route-level regression cases from the technical audit. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.GREENOWL_PLAYWRIGHT||'playwright');
const base=process.env.GREENOWL_TEST_URL||'http://127.0.0.1:8876/';
const near=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,a+' != '+b);
const file=(name,buffer,mimeType='text/plain')=>({name,mimeType,buffer:Buffer.from(buffer)});
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.GREENOWL_BROWSER?{executablePath:process.env.GREENOWL_BROWSER}:{})});
  try{
    const page=await browser.newPage(), errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base);
    const go=async id=>{
      await page.evaluate(id=>{location.hash='#/tool/'+id;},id);
      await page.locator('[data-tool="'+id+'"] #toolBody').waitFor();
    };
    const data=async id=>page.evaluate(id=>GL.getTool(id)._csv,id);
    const report=async id=>page.evaluate(id=>GL.getTool(id).report(),id);
    await go('soc-stock');
    const fixed=await data('soc-stock');
    const textToNumber=text=>Number(text.replace(/,/g,''));
    const kgM2=textToNumber(await page.locator('#socKg').textContent());
    near(kgM2,fixed.total*.1,.00501);
    const first=fixed.rows[0];
    await page.locator('#socTargetMass').fill(String(first.masa_fina_t_ha/2));
    await page.locator('#socESM').check();
    await page.waitForFunction(()=>GL.getTool('soc-stock')._csv.totalESM!==null);
    near((await data('soc-stock')).totalESM,first.stock_tC_ha/2,.001);
    await page.locator('#socTargetMass').fill('1000000');
    await page.waitForFunction(()=>GL.getTool('soc-stock')._csv.totalESM===null);
    assert.equal(await page.locator('#socStock').textContent(),'—');

    await go('air-quality-index');
    await page.locator('#aqPM10').fill('125');
    await page.locator('#aqPM25').fill('9,09');
    await page.waitForFunction(()=>GL.getTool('air-quality-index')._csv?.[1].medido===125);
    let rows=await data('air-quality-index');
    assert.equal(rows[0].ica,50);
    assert.equal(rows[1].eca,100);
    assert.equal(rows[1].porcentaje_eca,125);
    assert.equal(rows[3].eca,null);
    assert.equal(rows[4].medido,null);
    assert.equal(rows[6].eca,null);
    assert.equal(rows[7].medido,null);
    await page.locator('#aqNO2Hour').fill('210');
    await page.locator('#aqCO8Hour').fill('12');
    await page.locator('#aqPM25').fill('');
    await page.waitForFunction(()=>GL.getTool('air-quality-index')._csv?.[7].medido===12000);
    rows=await data('air-quality-index');
    assert.equal(rows[0].medido,null);
    near(rows[4].porcentaje_eca,105);
    near(rows[7].porcentaje_eca,120);
    await page.locator('#aqExceed').fill('31');
    await page.waitForFunction(()=>GL.getTool('air-quality-index')._csv===null);
    assert.equal(await report('air-quality-index'),null);

    await go('landfill-biogas');
    const initial=(await data('landfill-biogas'))[0];
    await page.locator('#bgOx').fill('0,5');
    await page.locator('#bgDestroy').fill('80');
    await page.waitForFunction(()=>{const a=GL.getTool('landfill-biogas')._csv?.[0];return a&&a.destruido_m3<a.capturado_sin_redondeo_m3;});
    const row=(await data('landfill-biogas'))[0];
    const generated=row.generado_sin_redondeo_m3;
    near(generated,initial.generado_sin_redondeo_m3);
    near(row.capturado_sin_redondeo_m3,generated*.75);
    near(row.destruido_m3,generated*.75*.8);
    near(row.oxidado_m3,generated*.25*.5);
    near(generated,row.destruido_m3+row.oxidado_m3+row.emitido_m3);

    await go('wind-weibull');
    await page.locator('#wdRho').fill('2');
    await page.locator('#wdAvail').fill('100');
    await page.locator('#wdLoss').fill('0');
    await page.locator('#wdRated').fill('100');
    await page.waitForFunction(()=>GL.getTool('wind-weibull')._csv?.every(r=>r.potencia_kw<=100.00000001));
    rows=await data('wind-weibull');
    assert.equal(rows.length,30);
    const net=rows.reduce((sum,r)=>sum+r.energia_mwh,0);
    assert.ok(net>0&&net<=876);
    assert.ok(rows.every(r=>r.intervalo_hasta_ms-r.intervalo_desde_ms===1));
    near(rows.find(r=>r.intervalo_desde_ms===12).potencia_kw,100);
    assert.equal(rows.find(r=>r.intervalo_desde_ms===25).energia_mwh,0);
    await page.locator('#wdVout').fill('10');
    await page.waitForFunction(()=>GL.getTool('wind-weibull')._csv===null);

    await go('shp-to-kml');
    const shp=Buffer.alloc(128);
    shp.writeInt32BE(9994,0);shp.writeInt32BE(64,24);
    shp.writeInt32LE(1000,28);shp.writeInt32LE(1,32);
    shp.writeInt32BE(1,100);shp.writeInt32BE(10,104);shp.writeInt32LE(1,108);
    shp.writeDoubleLE(500000,112);shp.writeDoubleLE(8660000,120);
    const fileInput=page.locator('#skFile');
    await fileInput.setInputFiles(file('punto.shp',shp,'application/octet-stream'));
    await page.getByText(/Declara el EPSG del SHP antes de cargarlo/).waitFor();
    await page.locator('#skCRS').fill('EPSG:32718');
    await fileInput.setInputFiles([]);
    await fileInput.setInputFiles(file('punto.shp',shp,'application/octet-stream'));
    await page.waitForFunction(()=>document.querySelector('#skFeatures')?.textContent==='1');
    assert.equal((await report('shp-to-kml')).inputs[1][1],'EPSG:32718');

    await go('yield-limiting');
    await page.locator('#ylSoilFile').setInputFiles(file('suelo.csv','id;x;y;p\nA;500000;8660000;5\nB;500100;8660000;6\nC;500200;8660000;7'));
    await page.locator('#ylYieldFile').setInputFiles(file('rend.csv','id;x;y;yield\nC;500200;8660000;7\nA;500000;8660000;5\nB;500100;8660000;6'));
    await page.waitForFunction(()=>document.querySelector('#ylVerdict').textContent.includes('Selecciona el método de emparejamiento'));
    assert.equal(await report('yield-limiting'),null);
    await page.locator('#ylJoin').selectOption('geo');
    await page.waitForFunction(()=>document.querySelector('#ylVerdict').textContent.includes('Las coordenadas no son válidas'));
    await page.locator('#ylJoin').selectOption('metric');
    await page.waitForFunction(()=>GL.getTool('yield-limiting')._csv?.[0].n===3);
    assert.equal((await data('yield-limiting'))[0].r,1);
    await page.locator('#ylJoin').selectOption('id');
    assert.equal((await data('yield-limiting'))[0].r,1);
    assert.deepEqual(errors,[]);
    console.log('OK · stock de carbono y ESM, ECA y AQI, balance de metano, AEP eólico, CRS de SHP y emparejamiento agronómico.');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
