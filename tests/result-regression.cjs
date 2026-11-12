/* Raw results captured before the calculator redesign. */
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const assert=require('node:assert/strict'), {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'), fixture=path.join(__dirname,'fixtures','model-results.json');
const context={console,document:{addEventListener(){}},localStorage:{getItem(){return null},setItem(){}}};
context.window=context;context.self=context;vm.createContext(context);
for(const [,file] of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"]+)"/g)){
  if(!file.endsWith('/app.js')&&!file.endsWith('/leaflet.js')){
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  }
}
const {definitions,matrix}=context.GL.lab;
const variants={
  'mbr-process-membrane-sizing':{q:1750,peak:2,flux:16,mlss:8500},
  'curve-number-runoff':{rain:112,cn:86,area:3.8,tp:2.2},
  'epa-air-quality-index':{o1:'160',so1:'350',so24:'280'}
};
function evaluate(d,changes={}){
  const inputs=Object.fromEntries(d.fields.map(f=>[f.key,f.type==='table'&&!f.raw?matrix(f.value):f.type||f.raw?f.value:Number(f.value)]));
  Object.assign(inputs,changes);
  const {metrics,headers,rows,series}=d.calc(inputs);
  return {inputs,outputs:{metrics,headers,rows,series}};
}
const fingerprint=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const actual={defaults:Object.fromEntries(definitions.map(d=>[d.id,fingerprint(evaluate(d))])),
  pilots:Object.fromEntries(Object.entries(variants).map(([id,v])=>[id,evaluate(definitions.find(d=>d.id===id),v)]))};
if(process.argv.includes('--record')){
  fs.writeFileSync(fixture,JSON.stringify(actual,null,2)+'\n');
}else{
  assert.deepEqual(JSON.parse(JSON.stringify(actual)),JSON.parse(fs.readFileSync(fixture,'utf8')));
}
console.log('OK · '+definitions.length+' escenarios base y '+Object.keys(variants).length+' escenarios piloto con entradas y resultados brutos.');
