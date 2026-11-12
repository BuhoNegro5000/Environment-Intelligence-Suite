const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),c={console,document:{addEventListener(){}},localStorage:{getItem(){return null},setItem(){}}};c.window=c;c.self=c;vm.createContext(c);
const scripts=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]).filter(f=>!f.endsWith('/app.js')&&!f.endsWith('/leaflet.js'));
scripts.forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c,{filename:f}));
const inventory=JSON.parse(fs.readFileSync(path.join(root,'docs/catalogue-coverage.json'),'utf8'));
assert.equal(inventory.entries.length,113);assert.equal(c.GL.tools.length,inventory.totalTools);assert.equal(new Set(c.GL.tools.map(t=>t.id)).size,inventory.totalTools);assert.equal(new Set(inventory.entries.map(t=>t.id)).size,113);
for(const entry of inventory.entries){
  assert.ok(entry.status);assert.ok(entry.scope);
  const tool=c.GL.getTool(entry.id);
  if(!tool&&entry.id.startsWith('unit-')){
    const dimension=entry.route.split('/')[3];
    assert.equal(entry.route,'#/tool/unit-converter/'+dimension,entry.id);
    assert.ok(c.GL.units.dimensions[dimension],dimension);
    assert.equal(entry.suite,'conversion',entry.id);
    continue;
  }
  assert.equal(entry.route,'#/tool/'+entry.id);
  assert.ok(tool,entry.id);
  assert.equal(typeof tool.html,'function',entry.id);
  assert.equal(typeof tool.mount,'function',entry.id);
  assert.equal(entry.suite,tool.suite);
  assert.deepEqual(entry.relatedSuites,Array.from(tool.relatedSuites));
}
assert.equal(c.GL.taxonomy,undefined);
vm.runInContext(fs.readFileSync(path.join(root,'assets/data/taxonomy.js'),'utf8'),c);
assert.equal(c.GL.taxonomy.length,18093);assert.equal(c.GL.bmwpOriginal.length,85);
const solver=c.GL.solverCatalogue;
assert.equal(solver.length,51);
assert.equal(new Set(solver.map(e=>e.sourceUrl)).size,51);
assert.equal(new Set(solver.map(e=>e.id)).size,51);
assert.equal(solver.filter(e=>e.status==='Implementación nueva').length,47);
assert.equal(solver.filter(e=>e.status==='Herramienta existente').length,4);
for(const e of solver){
  const tool=c.GL.getTool(e.id);
  assert.ok(tool,e.sourceUrl);
  assert.equal(e.route,'#/tool/'+e.id);
  assert.equal(e.suite,tool.suite);
  assert.equal(typeof tool.mount,'function',e.id);
}
const pluto=c.GL.plutoCatalogue;
assert.equal(pluto.length,105);
assert.equal(new Set(pluto.map(e=>e.sourceUrl)).size,105);
assert.equal(pluto.filter(e=>e.status==='Implementación nueva').length,80);
assert.equal(new Set(c.GL.pluto.mappings.values()).size,44);
assert.equal(pluto.filter(e=>e.status==='Herramienta existente').length,19);
assert.equal(pluto.filter(e=>!e.route).length,6);
for(const e of pluto){
  if(!e.route){assert.equal(e.status,'Fuera de esta selección');assert.ok(e.scope);continue;}
  const tool=c.GL.getTool(e.id);
  assert.ok(tool,e.sourceUrl);
  assert.equal(e.suite,tool.suite);
  const dimension=e.route.split('/')[3];
  if(dimension)assert.ok(c.GL.units.dimensions[dimension],dimension);
}
const atlas=c.GL.atlasCatalogue;
assert.equal(atlas.length,58);
assert.equal(atlas.filter(e=>e.sourceStatus==='Disponible en AtlasWTS').length,50);
assert.equal(atlas.filter(e=>e.sourceStatus==='Anunciada en AtlasWTS').length,8);
assert.equal(atlas.filter(e=>e.status==='Herramienta existente').length,4);
assert.equal(new Set(c.GL.atlas.mappings.values()).size,40);
for(const e of atlas){
  const tool=c.GL.getTool(e.id);
  assert.ok(tool,e.sourceTitle);
  assert.ok(e.suite===tool.suite||tool.relatedSuites.includes(e.suite),e.sourceTitle);
  assert.ok(e.route.startsWith('#/tool/'+e.id));
  if(e.route.split('/')[3])assert.ok(tool.lab.routeInputs[e.route.split('/')[3]]);
}
assert.equal(atlas.find(e=>e.route==='#/tool/contact-tank-residual-design/wastewater').suite,'wastewater');
assert.equal(atlas.find(e=>e.route==='#/tool/contact-tank-residual-design/potable').suite,'water');
const digitalWater=c.GL.digitalWaterCatalogue;
assert.equal(digitalWater.length,50);
assert.equal(new Set(digitalWater.map(e=>e.sourceUrl)).size,50);
assert.equal(digitalWater.filter(e=>e.status==='Herramienta existente').length,19);
assert.equal(digitalWater.filter(e=>e.status==='Implementación nueva').length,31);
assert.equal(new Set(digitalWater.filter(e=>e.status==='Implementación nueva').map(e=>e.id)).size,23);
for(const e of digitalWater){
  const tool=c.GL.getTool(e.id);
  assert.ok(tool,e.sourceTitle);
  assert.equal(e.suite,tool.suite);
  assert.equal(e.route.split('/')[2],e.id);
  const mode=e.route.split('/')[3];
  if(mode&&e.id==='unit-converter')assert.ok(c.GL.units.dimensions[mode]);
  else if(mode)assert.ok(tool.lab.routeInputs[mode]);
}
const renwaves=c.GL.renwavesCatalogue;
assert.equal(renwaves.length,12);
assert.equal(new Set(renwaves.filter(e=>e.status==='Implementación nueva').map(e=>e.id)).size,10);
assert.equal(renwaves.filter(e=>e.status==='Herramienta existente').length,1);
for(const e of renwaves){
  const tool=c.GL.getTool(e.id);
  assert.ok(tool,e.sourceTitle);
  assert.ok(e.sourceStatus);
  assert.equal(e.suite,'energy');
  assert.equal(e.suite,tool.suite);
  assert.equal(e.route,'#/tool/'+tool.id);
  assert.ok(e.sourceUrl.startsWith('https://renwaves.com/'));
}
const nova=c.GL.novaCatalogue;
assert.equal(nova.length,55);
assert.equal(new Set(nova.map(e=>e.sourceUrl)).size,55);
assert.equal(nova.filter(e=>e.status==='Implementación nueva').length,42);
assert.equal(nova.filter(e=>e.status==='Herramienta existente').length,13);
for(const e of nova){
  const tool=c.GL.getTool(e.id);
  assert.ok(tool,e.sourceTitle);
  assert.ok(e.suite===tool.suite||tool.relatedSuites.includes(e.suite));
  assert.equal(e.route,'#/tool/'+e.id);
  assert.ok(e.scope);
  for(const [route,label] of e.relatedTools){
    assert.ok(c.GL.getTool(route.split('/')[2]),label);
  }
}
assert.equal(nova.find(e=>e.id==='mbr-process-membrane-sizing').suite,'wastewater');
assert.equal(nova.find(e=>e.sourceUrl.endsWith('/wastewater-uv-disinfection-fluence.html')).suite,'wastewater');
console.log('OK: 113 fichas Envix, 51 Solver360, 105 Plutocalc, 58 AtlasWTS, 50 Digital Water, 12 RenWaves, 55 NovaSolver y '+inventory.totalTools+' herramientas nativas.');
