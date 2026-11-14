const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={console,document:{addEventListener(){}},localStorage:{getItem(){return null},setItem(){}}};
c.window=c;c.self=c;vm.createContext(c);
for(const [,file] of fs.readFileSync('index.html','utf8').matchAll(/<script src="([^"]+)"/g)){
  if(!file.endsWith('/app.js')&&!file.endsWith('/leaflet.js')) vm.runInContext(fs.readFileSync(file,'utf8'),c,{filename:file});
}
const G=c.GL;
const cases={
  water:['ccme-wqi','source-water-design-data','contact-tank-residual-design','streeter-phelps-river-oxygen'],
  wastewater:['ptar-activated-sludge','stabilization-ponds','equalization-storage','biological-nutrient-train','water-evidence-comparison','mbr-process-membrane-sizing','wastewater-project-flows'],
  hydraulics:['retention-time','pipe-darcy-loss','rational-runoff','piping-topology-workbench'],
  membranes:['membrane-series-balance','silt-density-index','swro-energy-recovery'],
  'industrial-water':['boiler-blowdown-balance','cooling-tower-cycles','high-purity-sampling-plan'],
  waste:['landfill-sizing','landfill-biogas','waste-generation','waste-reduction-benefits'],
  energy:['solar-pv','wind-weibull','energy-savings-ipmvp','solar-energy','pump-duty-power'],
  spatial:['boundary-validator','shp-to-kml'],
  climate:['emissions','forest-carbon-stock'],
  health:['environmental-toxicology-dose','environmental-health-burden'],
  safety:['iperc-matrix','sst-indicators'],
  sustainability:['life-cycle-inventory','environmental-economic-value','finance-water-cashflows'],
  metrology:['analysis-standards','environmental-monitoring-plan'],
  population:['population-lab'],analysis:['sample-size']
};
for(const [suite,ids] of Object.entries(cases)) for(const id of ids) assert.equal(G.getTool(id).suite,suite,id);
assert.equal(G.tools.length,339);
assert.equal(new Set(G.tools.map(t=>t.id)).size,339);
assert.equal(Object.keys(G.suites).length,22);
assert.equal(G.toolsBySuite('water').length,55);
assert.equal(G.toolsBySuite('energy').length,22);
assert.equal(G.toolsBySuite('wastewater').length,31);
assert.equal(G.toolsBySuite('hydraulics').length,25);
assert.equal(G.toolsBySuite('membranes').length,13);
assert.equal(G.toolsBySuite('industrial-water').length,9);
assert.equal(G.toolsBySuite('waste').length,9);
assert.equal(G.toolsBySuite('conversion').length,2);
assert.ok(!G.toolsBySuite('water').some(t=>/^(landfill-|waste-)/.test(t.id)));
assert.ok(G.getTool('contact-tank-residual-design').relatedSuites.includes('wastewater'));
assert.ok(G.getTool('swro-energy-recovery').relatedSuites.includes('energy'));
assert.deepEqual(Array.from(G.getTool('mbr-process-membrane-sizing').relatedSuites),['membranes']);
assert.deepEqual(Array.from(G.getTool('wastewater-project-flows').relatedSuites),['hydraulics']);
for(const t of G.tools){
  assert.ok(G.suites[t.suite],t.id);
  if(t.lab) assert.equal(t.lab.suite,t.suite,t.id);
  assert.equal(new Set(t.relatedSuites).size,t.relatedSuites.length,t.id);
  for(const id of t.relatedSuites){assert.ok(G.suites[id],t.id);assert.notEqual(id,t.suite,t.id);}
}
const audit=JSON.parse(fs.readFileSync('docs/classification-audit.json','utf8'));
assert.equal(audit.changes.length,66);
assert.equal(audit.tools.length,339);
for(const entry of audit.tools){
  const tool=G.getTool(entry.id);
  assert.equal(entry.suite,tool.suite,entry.id);
  assert.deepEqual(entry.relatedSuites,Array.from(tool.relatedSuites),entry.id);
}
for(const entry of audit.summary){
  assert.equal(entry.name,G.suites[entry.id].name);
  assert.equal(entry.count,G.toolsBySuite(entry.id).length);
}
console.log('OK: 339 herramientas, 22 categorías y 66 reasignaciones sincronizadas.');
