/* Marca Yupana y coherencia del registro: sin catálogos de origen ni nombres de terceros. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const c={console,document:{addEventListener(){}},localStorage:{getItem(){return null},setItem(){}}};
c.window=c;c.self=c;vm.createContext(c);
const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]).filter(f=>!f.endsWith('/app.js')&&!f.endsWith('/leaflet.js'));
scripts.forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c,{filename:f}));
const G=c.GL;

/* Portada y shell. */
assert.match(html,/<title>Yupana · Environmental Intelligence<\/title>/);
assert.match(html,/brand-text"><strong>YUPANA<\/strong>/);
assert.match(html,/Environmental Intelligence/);
assert.doesNotMatch(html,/#\/catalogo|Catálogo científico|catálogo científico/i);
const visible=html.replace(/<script[^>]*><\/script>/g,'');
assert.doesNotMatch(visible,/Solver360|Plutocalc|AtlasWTS|Digital Water|RenWaves|NovaSolver/i);
for(const f of scripts){
  const src=fs.readFileSync(path.join(root,f),'utf8');
  assert.doesNotMatch(src,/Solver360|Plutocalc|AtlasWTS|Digital Water|RenWaves|NovaSolver/i,f);
}

/* Registro. */
assert.equal(G.tools.length,339);
assert.equal(new Set(G.tools.map(t=>t.id)).size,339);
assert.equal(Object.keys(G.suites).length,22);
for(const s of Object.values(G.suites)){
  assert.match(s.color,/^#[0-9A-F]{6}$/,s.id);
  assert.ok(s.name&&s.short&&s.desc,s.id);
}
for(const name of ['catalogue','solverCatalogue','plutoCatalogue','atlasCatalogue','digitalWaterCatalogue','renwavesCatalogue','novaCatalogue'])
  assert.equal(G[name],undefined,name);

/* Símbolo: 4 bloques de tinta, 5 de teal y un sol. */
const mark=G.brandMark();
assert.match(mark,/^<svg /);
assert.equal((mark.match(/<rect/g)||[]).length,9);
assert.equal((mark.match(/<circle/g)||[]).length,1);
assert.match(mark,/aria-label="Yupana"/);
assert.match(G.brandData,/^data:image\/svg\+xml,/);
assert.match(decodeURIComponent(G.brandData),/#1F4D3A/);
assert.match(decodeURIComponent(G.brandData),/#D9A441/);

/* Datos locales que alimentan las herramientas. */
vm.runInContext(fs.readFileSync(path.join(root,'assets/data/taxonomy.js'),'utf8'),c,{filename:'assets/data/taxonomy.js'});
assert.equal(G.taxonomy.length,18093);
assert.equal(G.bmwpOriginal.length,85);
console.log('OK: marca Yupana, 339 herramientas, 22 categorías y 0 referencias a catálogos de origen.');
