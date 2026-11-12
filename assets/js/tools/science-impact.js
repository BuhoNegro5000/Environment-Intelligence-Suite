(function () {
  'use strict';
  const L=GL.lab,A=L.assert,S=L.sum,F=L.f,T=L.table;
  const refs=[['Pastakia y Jensen · RIAM','https://doi.org/10.1016/S0195-9255(98)00018-3'],['NASA · análisis de modos de falla','https://ntrs.nasa.gov/citations/20230009585']];
  function reg(id,title,fields,method,calc,limit){L.register({id,suite:'impact',title,fields,method,calc,limit:limit||'Escalas de juicio experto. Define alcance, receptores, escenario y criterios antes de puntuar; el resultado no determina una aprobación ambiental.',refs});}
  reg('impact-weighted','Significancia ambiental ponderada',[T('a','Valor y peso por criterio','3;0.3\n4;0.2\n2;0.2\n3;0.15\n5;0.15','Filas sugeridas: magnitud, extensión, duración, reversibilidad e importancia. Columnas: puntaje (0–5); peso ≥ 0.'),L.select('sign','Carácter del impacto',[['-1','Adverso'],['1','Beneficioso']],'-1')],'Significancia = signo × Σ(puntaje × peso)/Σpeso. Se muestran aportes; no se imponen categorías de severidad universales.',v=>{A(v.a[0].length===2&&v.a.every(r=>r[0]>=0&&r[0]<=5&&r[1]>=0),'Usa puntajes 0–5 y pesos no negativos.');const w=S(v.a.map(r=>r[1]));A(w>0,'La suma de pesos debe ser positiva.');return {metrics:[['Significancia ponderada',Number(v.sign)*S(v.a.map(r=>r[0]*r[1]))/w,'escala −5…5']],headers:['Criterio','Puntaje','Peso normalizado','Aporte'],rows:v.a.map((r,i)=>['C'+(i+1),r[0],r[1]/w,Number(v.sign)*r[0]*r[1]/w])};});
  reg('impact-riam','Evaluación rápida de impactos · RIAM',[T('a','Puntuaciones por componente ambiental','2;-2;2;2;2\n3;-1;3;2;2\n1;2;2;1;1','Columnas: A1 (0–4); A2 (−3…3); B1 (1–3); B2 (1–3); B3 (1–3). Una fila por componente.')],'ES = (A1 × A2) × (B1 + B2 + B3). Bandas: 0; |ES| 1–9, 10–18, 19–35, 36–71 y 72–108.',v=>{A(v.a[0].length===5&&v.a.every(r=>r.every(Number.isInteger)&&r[0]>=0&&r[0]<=4&&r[1]>=-3&&r[1]<=3&&r.slice(2).every(x=>x>=1&&x<=3)),'Revisa rangos enteros A1, A2 y B1–B3.');const rows=v.a.map((r,i)=>{const x=r[0]*r[1]*S(r.slice(2)),ax=Math.abs(x),band=ax===0?'N':ax<10?'A':ax<19?'B':ax<36?'C':ax<72?'D':'E';return ['Componente '+(i+1),x,band==='N'?'N':(x<0?'-':'+')+band];});return {metrics:[['Componentes con impacto adverso',rows.filter(r=>r[1]<0).length,''],['Puntaje adverso más intenso',Math.min(0,...rows.map(r=>r[1])),'ES']],headers:['Componente','ES','Banda RIAM'],rows};});
  reg('impact-iranian','Matriz de interacciones · escala −5 a +5',[T('a','Actividad × factor ambiental','-2;-4;1\n-1;-3;2\n1;-2;3','Filas = actividades; columnas = factores. Puntajes enteros desde −5 (adverso) hasta +5 (beneficioso).')],'Agregación descriptiva de juicios −5…+5: suma por actividad, por factor y media global.',v=>{A(v.a.flat().every(x=>Number.isInteger(x)&&x>=-5&&x<=5),'Los puntajes deben ser enteros entre −5 y +5.');const all=v.a.flat();return {metrics:[['Balance medio',S(all)/all.length,'−5…+5'],['Interacciones adversas',all.filter(x=>x<0).length,''],['Interacciones beneficiosas',all.filter(x=>x>0).length,'']],headers:['Actividad',...v.a[0].map((_,j)=>'Factor '+(j+1)),'Suma'],rows:v.a.map((r,i)=>['Actividad '+(i+1),...r,S(r)]).concat([['Suma por factor',...L.transpose(v.a).map(S),S(all)]]),message:'El balance puede ocultar efectos críticos: revisa cada interacción adversa. Esta tabla no reproduce un procedimiento normativo de aprobación.'};});
  reg('impact-checklist','Lista ponderada de alertas ambientales',[T('a','Respuesta, severidad y peso','1;4;2\n0;3;1\n0.5;5;3','Columnas: respuesta (0=no, 0,5=incierto, 1=sí); severidad (1–5); peso ≥ 0.')],'Aporte = respuesta × severidad × peso. Prioridad relativa = Σaportes / Σ(5×peso). Las respuestas inciertas reciben 0,5.',v=>{A(v.a[0].length===3&&v.a.every(r=>[0,.5,1].includes(r[0])&&r[1]>=1&&r[1]<=5&&r[2]>=0),'Revisa respuesta, severidad y peso.');const max=5*S(v.a.map(r=>r[2]));A(max>0,'Se necesita un peso positivo.');return {metrics:[['Prioridad relativa',100*S(v.a.map(r=>r[0]*r[1]*r[2]))/max,'%'],['Alertas inciertas',v.a.filter(r=>r[0]===.5).length,'']],headers:['Ítem','Respuesta','Severidad','Peso','Aporte'],rows:v.a.map((r,i)=>['Ítem '+(i+1),...r,r[0]*r[1]*r[2]])};});
  const riskLimit='NPR es una priorización ordinal. Define las escalas, los umbrales y cómo se verificará la eficacia de las acciones.';
  const riskSamples=[
    'Bombeo;Bomba sin caudal;Interrupción del servicio;Obstrucción;Alarma de presión;Inspección y limpieza;Operación;Por verificar;8;5;6;8;2;3\nTanque;Fuga;Pérdida de inventario;Sello desgastado;Inspección visual;Reemplazar sello;Mantenimiento;Planificada;9;3;8;9;2;4',
    'Almacenamiento;Operación;Derrame;Contaminación de suelo;Suelo;Falla de sello;Cubeto;Verificar contención;Ambiente;Planificada;Verificar permiso;1;8;5;6;8;2;3\nTransporte;Distribución;Emisión de polvo;Deterioro del aire;Población;Carga expuesta;Inspección visual;Cubrir carga;Logística;Por verificar;;0;5;4;4;5;2;2'
  ];
  function riskDefinition(environmental) {
    const columns=environmental
      ? ['Actividad','Etapa del ciclo de vida','Aspecto','Impacto','Receptor','Causa','Control actual','Acción','Responsable','Estado','Obligación','Prioridad normativa (0/1)']
      : ['Proceso','Modo de falla','Efecto','Causa','Control actual','Acción','Responsable','Estado'];
    const scores=['S','O','D','S residual','O residual','D residual'];
    const worksheet={...T('worksheet','Hoja de trabajo · una fila por elemento',riskSamples[Number(environmental)],'Columnas en orden: '+columns.concat(scores).join(' · ')+'. Separa con punto y coma. Puedes dejar vacías las tres puntuaciones residuales.'),raw:true,fixedColumns:true,columns:columns.concat(scores),textColumns:columns.length-Number(environmental)};
    const id=environmental?'risk-efmea':'risk-fmea';
    const tool=L.register({id,suite:environmental?'impact':'safety',
      title:environmental?'AMEF ambiental · aspectos y riesgo residual':'AMEF · modos de falla y riesgo residual',
      fields:[worksheet,F('severity','Umbral de severidad prioritaria','',9,1,10),F('rpn','Umbral NPR prioritario','',200,1,1000)],
      method:'NPR inicial y residual = S × O × D, en escalas enteras de 1 a 10. Mayor D indica menor detectabilidad. Se prioriza por obligación normativa, severidad o NPR según el umbral configurado.',
      limit:riskLimit,refs:[['IEC 60812 · AMEF','https://webstore.iec.ch/en/publication/26359'],...(environmental?[['ISO 14001 · aspectos ambientales','https://www.iso.org/iso-14001-environmental-management.html']]:[])],
      calc(v) {
        A(Number.isInteger(v.severity)&&Number.isInteger(v.rpn),'Usa umbrales enteros.');
        const input=v.worksheet.trim().split(/\r?\n/).filter(x=>x.trim());
        A(input.length>0&&input.length<=1000,'Usa entre 1 y 1000 filas.');
        const rows=input.map((line,i)=>{
          const cells=line.split(/[;\t]/).map(x=>x.trim());
          A(cells.length===columns.length+6,'Fila '+(i+1)+': se esperan '+(columns.length+6)+' columnas.');
          A(cells[0]&&cells[environmental?2:1],'Fila '+(i+1)+': registra la actividad y el aspecto o modo de falla.');
          const values=cells.slice(columns.length).map(x=>x===''?null:L.number(x));
          const valid=x=>Number.isInteger(x)&&x>=1&&x<=10;
          A(values.slice(0,3).every(valid)&&(values.slice(3).every(valid)||values.slice(3).every(x=>x===null)),'Fila '+(i+1)+': S/O/D de 1 a 10. Completa las tres puntuaciones residuales o deja las tres vacías.');
          if (environmental) A(['0','1'].includes(cells[11]),'Fila '+(i+1)+': indica prioridad normativa con 0 o 1.');
          const initial=values[0]*values[1]*values[2], residual=values[3]===null?null:values[3]*values[4]*values[5];
          const legal=environmental&&cells[11]==='1';
          const reason=(severity,npr)=>[legal?'Normativa':'',severity>=v.severity?'Severidad':'',npr>=v.rpn?'NPR':''].filter(Boolean).join(' + ');
          return {cells,values,initial,residual,priority:reason(values[0],initial),remaining:residual===null?null:reason(values[3],residual),legal};
        }).sort((a,b)=>Number(b.legal)-Number(a.legal)||Number(!!b.priority)-Number(!!a.priority)||b.initial-a.initial);
        const assessed=rows.filter(r=>r.residual!==null);
        return {metrics:[['Mayor NPR inicial',Math.max(...rows.map(r=>r.initial)),''],['Mayor NPR residual',assessed.length?Math.max(...assessed.map(r=>r.residual)):'Pendiente',''],
          ['Prioridades iniciales',rows.filter(r=>r.priority).length,''],['Evaluaciones residuales pendientes',rows.length-assessed.length,'']],
          headers:[...columns,...scores,'NPR inicial','Prioridad inicial','NPR residual','Prioridad residual','Variación favorable (%)'],
          rows:rows.map(r=>[...r.cells.slice(0,columns.length),...r.values,r.initial,r.priority||'Ordinaria',r.residual,r.remaining===null?'Pendiente':r.remaining||'Ordinaria',r.residual===null?null:100*(1-r.residual/r.initial)])};
      }
    });
    const mount=tool.mount;
    tool.mount=function(root){
      const saved=GL.store.get('in.'+id,{});
      if (saved['lab-'+id+'-a']&&!saved['lab-'+id+'-worksheet']) {
        try {
          const old=L.matrix(saved['lab-'+id+'-a']);
          if (old[0].length===6) {
            const context=String(saved['lab-'+id+'-context']||'').replace(/[;\t\r\n]/g,' ');
            root.querySelector('#lab-'+id+'-worksheet').value=old.map((scores,i)=>{
              const metadata=Array(columns.length).fill('');
              metadata[0]='Registro previo';
              metadata[environmental?2:1]=(environmental?'Aspecto ':'Falla ')+(i+1);
              metadata[environmental?6:4]=context;
              if (environmental) metadata[11]='0';
              return metadata.concat(scores).join(';');
            }).join('\n');
          }
        } catch (_) {
          GL.toast('Las puntuaciones previas requieren corrección antes de importar.','warn');
        }
      }
      mount.call(this,root);
    };
  }
  riskDefinition(false);
  riskDefinition(true);
})();
