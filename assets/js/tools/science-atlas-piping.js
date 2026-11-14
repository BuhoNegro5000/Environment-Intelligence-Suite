/* Importador de topología PCF y JSON; revisión local de continuidad. */
(function(){
  'use strict';
  const L=GL.lab,{reg,m,table,f,check,int,eps}=GL.atlas,{assert:A,table:T}=L;
  const sample='ISOGEN-FILES EJEMPLO.FLS\nUNITS-CO-ORDS MM\nPIPELINE-REFERENCE PTAR-01\nPIPE\n    END-POINT 0 0 0 100\n    END-POINT 1000 0 0 100\n    MATERIAL-IDENTIFIER 1\nTEE\n    END-POINT 1000 0 0 100\n    END-POINT 1200 0 0 100\n    BRANCH1-POINT 1100 100 0 80\n    MATERIAL-IDENTIFIER 2\nPIPE\n    END-POINT 1100 100 0 80\n    END-POINT 1100 900 0 80\n    MATERIAL-IDENTIFIER 1\nMATERIALS\nMATERIAL-IDENTIFIER 1\n    ITEM-CODE AC-01\nMATERIAL-IDENTIFIER 2\n    ITEM-CODE AC-TEE';
  const input={...T('source','Texto PCF o modelo JSON',sample,
    'PCF: UNITS-CO-ORDS MM o INCH, PIPELINE-REFERENCE, END-POINT y BRANCHn-POINT. JSON: components con type, pipeline, material y points en mm.'),raw:true,accept:'.pcf,.json,.txt',preview:false};
  const keyString=v=>typeof v==='string'?v:'';
  function parse(source){
    const text=source.trim();A(text&&text.length<=200000,'El archivo debe contener hasta 200 000 caracteres.');
    if(text.startsWith('{')){
      const data=JSON.parse(text);
      A(Array.isArray(data.components),'El JSON debe contener components.');
      return data.components.map(x=>{
        A(x&&typeof x.type==='string'&&x.type.trim(),'Cada componente necesita type.');
        return {type:x.type,pipeline:keyString(x.pipeline),material:keyString(x.material),points:x.points};
      });
    }
    let pipe='',component,unit,materialId,materialsMode=false;
    const components=[],materials=new Map();
    for(const row of text.split(/\r?\n/)){
      const line=row.trim();if(!line)continue;
      const [code,...tokens]=line.split(/\s+/),value=tokens.join(' ');
      if(code==='MATERIALS'){materialsMode=true;continue;}
      if(materialsMode){
        if(code==='MATERIAL-IDENTIFIER')materialId=value;
        if(code==='ITEM-CODE'&&materialId)materials.set(materialId,value);
        continue;
      }
      if(code==='UNITS-CO-ORDS'){unit=({MM:1,INCH:25.4,IN:25.4})[value];continue;}
      if(code==='PIPELINE-REFERENCE'&&!/^\s/.test(row)){pipe=value;component=null;continue;}
      if(!/^\s/.test(row)&&!tokens.length&&pipe){
        component={type:code,pipeline:pipe,material:'',points:[]};
        components.push(component);continue;
      }
      if(!component)continue;
      if(code==='END-POINT'||/^BRANCH\d+-POINT$/.test(code)){
        A(unit,'Declara UNITS-CO-ORDS MM o INCH.');
        A(tokens.length>=3&&tokens.slice(0,3).every(x=>/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(x)),'Coordenadas PCF inválidas.');
        component.points.push(tokens.slice(0,3).map(x=>Number(x)*unit));
      }
      if(code==='MATERIAL-IDENTIFIER')component.material=value;
    }
    return components.filter(c=>c.points.length).map(c=>({...c,material:materials.get(c.material)||c.material}));
  }
  function cluster(ports,tolerance){
    const parent=ports.map((_,i)=>i);
    function find(i){while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;}
    for(let i=0;i<ports.length;i++)for(let j=0;j<i;j++){
      const a=ports[i].point,b=ports[j].point;
      if(ports[i].component!==ports[j].component&&Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])<=tolerance)parent[find(i)]=find(j);
    }
    const groups=new Map();ports.forEach((p,i)=>{const k=find(i);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);});
    return [...groups.values()];
  }
  reg('piping-topology-workbench',['pcfforge'],'water','Topología de tuberías · importación PCF, continuidad y materiales',[
    input,f('tolerance','Tolerancia de coincidencia de extremos','mm',1,eps,1000),
    T('edits','Traslaciones explícitas','0;0;0;0','Columnas: número de componente; ΔX, ΔY, ΔZ (mm). Fila 0;0;0;0 indica que no hay edición.')
  ],'Agrupa extremos coincidentes dentro de la tolerancia. Las traslaciones mueven todos los puertos del componente. BOM por línea, tipo y material; longitud de tubos por distancia entre extremos.',
  v=>{
    const data=parse(v.source);
    A(data.length>0&&data.length<=500,'Usa entre 1 y 500 componentes con extremos.');
    A(data.every(c=>Array.isArray(c.points)&&c.points.length>=2&&c.points.length<=8&&c.points.every(p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite))),
      'Cada componente debe tener de dos a ocho extremos válidos.');
    check(v.edits,4,r=>int(r[0])&&r[0]>=0&&r[0]<=data.length&&(r[0]>0||r.slice(1).every(x=>x===0)),'Revisa identificador y desplazamiento.');
    for(const [id,...delta] of v.edits)if(id)data[id-1].points=data[id-1].points.map(p=>p.map((x,i)=>x+delta[i]));
    A(data.every(c=>c.points.every(p=>p.every(Number.isFinite))),'La traslación produjo coordenadas fuera de rango.');
    const groups=cluster(data.flatMap((c,i)=>c.points.map(point=>({component:i,point}))),v.tolerance);
    const opened=Array(data.length).fill(0);
    groups.filter(g=>g.length===1).forEach(g=>opened[g[0].component]++);
    const bom=new Map();
    data.forEach((c,i)=>{
      const key=JSON.stringify([c.pipeline,c.type,c.material]),row=bom.get(key)||[c.pipeline,c.type,c.material,0,0,0];
      row[3]++;if(c.type.toUpperCase()==='PIPE'&&c.points.length===2)row[4]+=Math.hypot(...c.points[0].map((x,j)=>x-c.points[1][j]))/1000;
      row[5]+=opened[i];bom.set(key,row);
    });
    return {...table([m('Componentes',data.length),m('Extremos sin enlace',groups.filter(g=>g.length===1).length),
      m('Uniones con más de dos extremos',groups.filter(g=>g.length>2).length)],
      ['Línea','Tipo','Material','Cantidad','Longitud de tubo (m)','Extremos abiertos'],[...bom.values()]),
      download:{name:'Yupana_topologia.json',text:JSON.stringify({components:data},null,2)}};
  },'Importación geométrica de componentes con dos o más puertos, sin generación de isométricos ni reconstrucción PCF. Un extremo abierto puede ser un límite intencional.',
  [['Hexagon · sintaxis pública de PCF','https://docs.hexagonppm.com/r/en-US/PCF-Reference-Guide/Version-15/242663']]);
})();
