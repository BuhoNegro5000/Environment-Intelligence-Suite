/* Run with the same Playwright environment as tests/lab-browser.cjs. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.GREENOWL_PLAYWRIGHT||'playwright');
const base=process.env.GREENOWL_TEST_URL||'http://127.0.0.1:8876/';
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.GREENOWL_BROWSER?{executablePath:process.env.GREENOWL_BROWSER}:{})});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    const errors=[],remote=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',req=>{if(/^https?:/.test(req.url())&&new URL(req.url()).origin!==new URL(base).origin)remote.push(req.url());});
    const go=async id=>{
      await page.goto(base+'#/tool/'+id);
      await page.locator('[data-tool="'+id+'"]').waitFor();
    };
    const verifyContrast=async()=>{
      const ratios=await page.evaluate(()=>{
        const pairs=[
          ['--text','--panel'],['--muted','--panel'],['--muted','--bg-2'],
          ['--accent','--panel'],['--accent','--calc-accent-soft'],
          ['--calc-result','--calc-result-bg'],['--danger','--panel']
        ];
        const css=getComputedStyle(document.body);
        function luminance(name){
          let hex=css.getPropertyValue(name).trim().slice(1);
          if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');
          const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255)
            .map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
          return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
        }
        return pairs.map(([fg,bg])=>{
          const [a,b]=[luminance(fg),luminance(bg)].sort((x,y)=>y-x);
          return [fg,bg,(a+.05)/(b+.05)];
        });
      });
      for(const [fg,bg,ratio] of ratios)assert.ok(ratio>=4.5,fg+' '+bg+' '+ratio);
    };
    const id='mbr-process-membrane-sizing';
    await go(id);
    assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    await verifyContrast();
    assert.equal(await page.locator('.lab-banner').count(),0);
    assert.equal(await page.locator('.calc-method').getAttribute('open'),null);
    const area=page.locator('.lab-primary strong');
    assert.equal(await area.textContent(),'3.676');
    await page.locator('.calc-category').getByText('Aguas residuales y reúso',{exact:true}).waitFor();
    await page.locator('a.calc-related[href="#/suite/membranes"]').waitFor();
    await page.getByRole('button',{name:'Fijar referencia'}).click();
    await page.locator('[data-calc-comparison]').getByText(/Variación 0 m²/).waitFor();
    const input=page.locator('#lab-'+id+'-q');
    await input.fill('');
    await page.getByText('Ingresa un valor.',{exact:true}).first().waitFor();
    assert.equal(await input.getAttribute('aria-invalid'),'true');
    assert.equal(await page.locator('[data-calc-raw]').isDisabled(),true);
    await input.fill('1200');
    await page.locator('[data-calc-comparison]').getByText(/Variación \+735,3 m²/).waitFor();
    await page.getByRole('button',{name:'Quitar referencia'}).click();
    await page.locator('[data-calc-comparison]').waitFor({state:'hidden'});
    await input.fill('1000');
    await area.waitFor();
    assert.equal(await input.getAttribute('aria-invalid'),null);
    await page.locator('[data-calc-precision]').selectOption('2');
    assert.equal(await area.textContent(),'3.676,47');
    await page.getByRole('button',{name:'Abrir informe'}).click();
    await page.locator('#reportDoc').getByText('3.676,47',{exact:true}).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-act="report"]').evaluate(el=>document.activeElement===el),true);
    const collect=async button=>{
      const next=page.waitForEvent('download');
      await button.click();
      const file=await (await next).path();
      return fs.readFileSync(file,'utf8');
    };
    const formatted=await collect(page.getByRole('button',{name:'Descargar CSV',exact:true}));
    assert.match(formatted,/Fecha UTC/);
    assert.match(formatted,/Versión/);
    assert.match(formatted,/Entrada/);
    assert.match(formatted,/"3\.676,47"/);
    const raw=await collect(page.getByRole('button',{name:'CSV de datos sin redondeo'}));
    assert.match(raw,/indicador,valor,unidad/);
    assert.match(raw,/3676\.470588/);
    const favorite=page.getByRole('button',{name:'Favorito',exact:true});
    await favorite.click();
    assert.equal(await favorite.getAttribute('aria-pressed'),'true');
    await input.fill('1450');
    await page.waitForFunction(key=>GL.store.get('in.'+key,{})['lab-'+key+'-q']==='1450',id);
    await page.reload();
    await page.locator('.lab-primary strong').waitFor();
    assert.equal(await input.inputValue(),'1450');
    assert.equal(await page.locator('[data-calc-precision]').inputValue(),'2');
    await page.getByRole('button',{name:'Restablecer valores'}).click();
    await page.getByRole('button',{name:'Restablecer',exact:true}).click();
    assert.equal(await input.inputValue(),'1000');
    await page.locator('[data-calc-precision]').selectOption('auto');
    const out=path.join(__dirname,'..','artifacts');
    fs.mkdirSync(out,{recursive:true});
    await page.locator('#toastRoot .toast').last().waitFor({state:'hidden'});
    await page.screenshot({path:path.join(out,'pilot-mbr-light.png')});
    await page.locator('#themeBtn').click();
    await verifyContrast();
    await go('curve-number-runoff');
    await verifyContrast();
    await page.locator('.lab-chart canvas').waitFor();
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.calc-head h1')).color==='rgb(240, 244, 238)');
    await page.screenshot({path:path.join(out,'pilot-runoff-dark.png')});
    await page.setViewportSize({width:390,height:844});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await go('epa-air-quality-index');
    assert.equal(await page.locator('.calc-head').evaluate(el=>getComputedStyle(el).animationName),'calc-enter');
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('.calc-head').evaluate(el=>getComputedStyle(el).animationName),'none');
    await verifyContrast();
    const bar=page.locator('[data-calc-jump]');
    await bar.waitFor();
    assert.match(await bar.textContent(),/126 AQI/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.screenshot({path:path.join(out,'pilot-aqi-mobile.png')});
    await bar.click();
    assert.equal(await page.locator('[data-calc-result]').evaluate(el=>document.activeElement===el),true);
    await page.goto(base+'#/');
    await page.getByRole('heading',{name:/Cada dato en su casilla/}).waitFor();
    assert.equal(await page.locator('.sidebar .brand svg').count(),1);
    const brand=await page.locator('.sidebar .brand').boundingBox();
    const sidebar=await page.locator('.sidebar').boundingBox();
    assert.ok(brand.width<=sidebar.width);
    await page.setViewportSize({width:1080,height:740});
    await page.screenshot({path:path.join(out,'pilot-home-brand.png')});
    await go('water-load');
    assert.equal(await page.locator('.tool--pilot').count(),0);
    assert.equal(await page.locator('.lab-banner').count(),1);
    assert.deepEqual(errors,[]);
    assert.deepEqual(remote,[]);
    console.log('OK · 3 pilotos, tema claro y oscuro, contraste de tokens, móvil, validación, informes, CSV, favoritos, persistencia y restablecimiento.');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
