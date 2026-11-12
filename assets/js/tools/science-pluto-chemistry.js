/* Química de agua, medición y barreras de tratamiento. */
(function () {
  'use strict';
  const L=GL.lab,{reg,metric:m,metrics,field:f,pct,rows,eps}=GL.pluto;
  const {assert:A,sum:S,table:T,select}=L;
  const epaCT=[['EPA · guía de perfil de desinfección','https://www.epa.gov/system/files/documents/2022-02/disprof_bench_3rules_final_508.pdf']];
  const oxygen=[['USGS · DOTABLES','https://www.usgs.gov/tools/dotables'],
    ['EPA · AQUATOX, documentación técnica','https://www.epa.gov/sites/default/files/2014-03/documents/technical-documentation-3-1.pdf']];

  reg('conductivity-resistivity',['cond'],'conversion','Conductividad ↔ resistividad · relación recíproca',[
    select('mode','Magnitud de entrada',[['conductivity','Conductividad en µS/cm'],['resistivity','Resistividad en MΩ·cm']],'conductivity'),
    f('value','Valor de la magnitud elegida','µS/cm o MΩ·cm',1,eps)
  ],'ρ=1/κ en unidades SI. Con κ en µS/cm y ρ en MΩ·cm, los valores numéricos son recíprocos.',
  v=>{const cond=v.mode==='conductivity'?v.value:1/v.value;
    return metrics(m('Conductividad',cond,'µS/cm'),m('Conductividad en SI',cond*1e-4,'S/m'),
      m('Resistividad',1/cond,'MΩ·cm'),m('Resistividad en SI',1e4/cond,'Ω·m'));},
  'Usa valores a la misma temperatura. El cero queda fuera de la transformación recíproca.');

  reg('water-ion-balance',['ionic'],'water','Análisis iónico · balance de cargas y conductividad',[
    T('a','Iones disueltos','40;22.9898;1;50.1\n60;40.078;2;119\n20;24.305;2;106.1\n85;35.453;-1;76.3\n180;61.0168;-1;44.5\n70;96.06;-2;160',
      'Columnas: mg/L como ion; masa molar (g/mol); carga con signo; conductividad molar límite (S·cm²/mol). Filas sugeridas: Na, Ca, Mg, Cl, HCO₃ y SO₄.'),
    f('measured','Conductividad medida a la misma temperatura','µS/cm',680)
  ],'mmol/L = (mg/L)/M. Balance = 100(Σcationes−Σaniones)/(Σcationes+Σaniones), en meq/L. Conductividad límite (µS/cm) = ΣΛᵢ·mmol/Lᵢ.',
  v=>{
    rows(v.a,4,([c,m,z,k])=>c>=0&&m>0&&Number.isInteger(z)&&Math.abs(z)<=8&&z!==0&&k>=0,'Revisa las cuatro columnas y la carga entera distinta de cero.');
    const data=v.a.map(([c,m,z,k],i)=>[i+1,c/m,c*z/m,c*k/m]);
    const cat=S(data.map(r=>Math.max(0,r[2]))),an=S(data.map(r=>Math.max(0,-r[2])));
    A(cat+an>0,'La suma de cargas debe ser positiva.');
    const cond=S(data.map(r=>r[3]));
    return {metrics:[m('Error de balance iónico',100*(cat-an)/(cat+an),'%'),m('Cationes',cat,'meq/L'),m('Aniones',an,'meq/L'),
      m('Conductividad límite estimada',cond,'µS/cm'),m('Diferencia respecto a medición',cond-v.measured,'µS/cm')],
      headers:['Ion','mmol/L','Carga (meq/L)','Aporte límite (µS/cm)'],rows:data};
  },'La conductividad límite supone dilución infinita y es orientativa. Usa coeficientes a la temperatura del análisis.');

  reg('calcite-saturation-indices',['lsi','rsi'],'water','Estabilidad de carbonato cálcico · Langelier y Ryznar',[
    f('ph','pH medido','',7.8,0,14),f('temp','Temperatura','°C',20,0,80),f('tds','Sólidos disueltos totales','mg/L',350,1,10000),
    f('calcium','Dureza de calcio','mg/L como CaCO₃',120,eps),f('alk','Alcalinidad','mg/L como CaCO₃',130,eps)
  ],'pHs=9,3+(log₁₀TDS−1)/10−13,12·log₁₀(T+273)+34,55−(log₁₀Ca−0,4)−log₁₀Alk. LSI=pH−pHs; RSI=2pHs−pH.',
  v=>{const phs=9.3+(Math.log10(v.tds)-1)/10-13.12*Math.log10(v.temp+273)+34.55-(Math.log10(v.calcium)-.4)-Math.log10(v.alk);
    return metrics(m('Índice Langelier',v.ph-phs),m('Índice Ryznar',2*phs-v.ph),m('pH de saturación aproximado',phs));},
  'Método empírico de cribado para carbonato cálcico en aguas de baja a moderada salinidad. Usa dureza de calcio y alcalinidad en la base indicada.',
  [['USGS · potencial corrosivo y LSI','https://pubs.usgs.gov/sir/2024/5035/sir20245035.pdf']]);

  reg('ammonia-water-equilibrium',['ammonia'],'water','Amoníaco en agua dulce · NH₃ y NH₄⁺',[
    f('ph','pH medido','',8.2,0,14),f('t','Temperatura','°C',22,0,50),
    f('tan','Nitrógeno amoniacal total','mg N/L',3)
  ],'pKa=0,09018+2729,92/(T+273,2). Fracción NH₃=1/(1+10^(pKa−pH)).',
  v=>{const pka=.09018+2729.92/(v.t+273.2),x=1/(1+10**(pka-v.ph));
    return metrics(m('Amoníaco no ionizado',v.tan*x,'mg N/L'),m('Amonio',v.tan*(1-x),'mg N/L'),m('Amoníaco como NH₃',v.tan*x*17.031/14.007,'mg NH₃/L'),
      m('Fracción no ionizada',100*x,'%'),m('pKa de trabajo',pka));},
  'Equilibrio en agua dulce. Verifica si el resultado debe expresarse como N o como NH₃.',
  [['EPA · equilibrio del amoníaco en agua dulce','https://www.epa.gov/sites/default/files/2019-02/documents/update-wqc-ammonia-1998.pdf']]);

  const species={
    boric:['Ácido bórico',['B(OH)₃','B(OH)₄⁻'],[9.24]],
    carbonate:['Carbonatos',['CO₂*','HCO₃⁻','CO₃²⁻'],[6.35,10.33]],
    nitrous:['Ácido nitroso',['HNO₂','NO₂⁻'],[3.25]],
    phosphate:['Fosfatos',['H₃PO₄','H₂PO₄⁻','HPO₄²⁻','PO₄³⁻'],[2.15,7.20,12.35]],
    silica:['Ácido silícico',['H₄SiO₄','H₃SiO₄⁻','H₂SiO₄²⁻'],[9.8,13.2]],
    sulfate:['Bisulfato y sulfato',['HSO₄⁻','SO₄²⁻'],[1.99]],
    sulfide:['Sulfuro disuelto',['H₂S','HS⁻','S²⁻'],[7.0,14.0]]
  };
  reg('water-acid-speciation',['boric','carbonates','nitrous','phosphate','silica','sulfate','sulfide'],'water','Especiación ácido-base · siete sistemas acuosos',[
    select('system','Sistema',Object.entries(species).map(([key,[label]])=>[key,label]),'carbonate'),
    f('ph','pH','',8.1,0,14),f('total','Concentración analítica total','mmol/L',2.2),
    select('constants','Origen de pKa',[['typical','Valores orientativos a 25 °C'],['own','Constantes ingresadas']],'typical'),
    f('p1','Primer pKa (personalizado)','',6.35,-8,20),f('p2','Segundo pKa (personalizado)','',10.33,-8,20),
    f('p3','Tercer pKa (personalizado)','',12.35,-8,20)
  ],'Cada etapa cumple [Aᵢ]/[Aᵢ₋₁]=10^(pH−pKaᵢ). Se normalizan las proporciones para conservar la concentración total.',
  v=>{
    const [,names,typical]=species[v.system],pka=v.constants==='own'?[v.p1,v.p2,v.p3].slice(0,typical.length):typical;
    A(pka.every((x,i)=>i===0||x>=pka[i-1]),'Los pKa sucesivos deben estar ordenados.');
    function fractions(ph) {
      const logs=[0];for(const k of pka)logs.push(logs.at(-1)+ph-k);
      const max=Math.max(...logs),amounts=logs.map(x=>10**(x-max)),sum=S(amounts);
      return amounts.map(x=>x/sum);
    }
    const x=fractions(v.ph),domain=Array.from({length:57},(_,i)=>i/4);
    return {metrics:[m('Especie dominante',names[x.indexOf(Math.max(...x))]),m('Concentración total',v.total,'mmol/L'),m('pKa usados',pka.join(' · '))],
      headers:['Especie','Fracción','% del total','Concentración (mmol/L)'],rows:x.map((p,i)=>[names[i],p,100*p,p*v.total]),
      series:names.map((name,j)=>({name,data:domain.map(ph=>[ph,100*fractions(ph)[j]])})),xLabel:'pH',yLabel:'Fracción (%)'};
  },'Equilibrios por concentración en solución diluida. Ajusta pKa por temperatura, fuerza iónica y fuente. El segundo pKa del sulfuro es orientativo; usa el de tu modelo.');

  reg('oxygen-water-saturation',['oxsat'],'water','Oxígeno disuelto · solubilidad y saturación',[
    f('t','Temperatura','°C',20,0,40),f('s','Salinidad','‰',0,0,40),
    f('p','Presión barométrica absoluta en el sitio','kPa',101.325,50,115),
    f('od','Oxígeno disuelto medido','mg/L',7.8)
  ],'Solubilidad a 1 atm por Benson–Krause con corrección de salinidad. Corrección de presión por razón de presiones de aire seco (P−pH₂O)/(101,325−pH₂O).',
  v=>{const t=v.t+273.15,ln=-139.34411+1.575701e5/t-6.642308e7/t**2+1.2438e10/t**3-8.621949e11/t**4;
    const salt=Math.exp(-v.s*(.017674-10.754/t+2140.7/t**2));
    const vapour=.61121*Math.exp((18.678-v.t/234.5)*(v.t/(257.14+v.t)));
    const sat=Math.exp(ln)*salt*(v.p-vapour)/(101.325-vapour);
    return metrics(m('Oxígeno a saturación',sat,'mg/L'),m('Saturación de la muestra',100*v.od/sat,'%'),m('Déficit respecto al equilibrio',sat-v.od,'mg/L'));},
  'Estimación de equilibrio con aire. Usa presión del sitio, sin corregir al nivel del mar. La corrección de presión es aproximada.',oxygen);

  reg('disinfection-contact-ct',['disinfection','disinfection_chlorine'],'water','Desinfección química · CT por segmento',[
    T('a','Segmentos con el mismo desinfectante','0.8;20;65\n0.6;15;65',
      'Columnas: residual del desinfectante (mg/L); T₁₀ del segmento (min); CT de referencia para el objetivo (mg·min/L).'),
    L.text('basis','Desinfectante, microorganismo, objetivo y fuente','Ejemplo sintético · sustituir por referencia aplicable')
  ],'CT alcanzado=C residual × T₁₀. Razón por segmento=CT alcanzado/CT de referencia. Para un mismo objetivo y desinfectante se suman las razones.',
  v=>{rows(v.a,3,([c,t,target])=>c>=0&&t>=0&&target>0,'Usa residual y T₁₀ no negativos y CT de referencia positivo.');
    const data=v.a.map(([c,t,target],i)=>[i+1,c,t,c*t,target,c*t/target]);
    return {metrics:[m('CT acumulado',S(data.map(r=>r[3])),'mg·min/L'),m('Razón de inactivación acumulada',S(data.map(r=>r[5])))],
      headers:['Segmento','Residual (mg/L)','T₁₀ (min)','CT alcanzado','CT de referencia','Razón'],rows:data};},
  'Ingresa CT de la fuente aplicable al microorganismo, objetivo logarítmico, temperatura, pH y desinfectante. Usa T₁₀ medido o aprobado; los valores iniciales son sintéticos.',epaCT);

  reg('uv-disinfection-dose',['uv'],'water','Desinfección UV · dosis validada o exposición de banco',[
    select('mode','Modo',[['validated','Dosis equivalente del reactor validado'],['bench','Exposición uniforme de banco']],'validated'),
    f('red','Dosis equivalente RED del reactor','mJ/cm²',45),f('factor','Factor de validación','',1.2,1),
    f('target','Dosis objetivo del protocolo','mJ/cm²',40,eps),
    f('irradiance','Irradiancia media medida de banco','mW/cm²',2),f('time','Tiempo de exposición de banco','s',20)
  ],'Dosis validada = RED/factor de validación. En banco, fluencia nominal = irradiancia media × tiempo.',
  v=>v.mode==='bench'?metrics(m('Fluencia nominal de banco',v.irradiance*v.time,'mJ/cm²')):
    metrics(m('Dosis validada calculada',v.red/v.factor,'mJ/cm²'),m('Razón frente al objetivo',v.red/(v.factor*v.target))),
  'En reactores, RED y factor provienen de validación y del rango permitido de caudal, transmitancia y estado de lámparas. La fluencia de banco se reporta aparte.',
  [['EPA · UV Treatment Toolkit','https://www.epa.gov/system/files/documents/2022-05/uv-toolkit-815-B-21-007_0.pdf']]);

  reg('metal-oxidation-sludge',['iron','manganese','sludge'],'water','Hierro y manganeso · oxidación y producción de lodos',[
    f('q','Caudal tratado','m³/día',1500),f('fe','Fe(II) a oxidar y remover','mg Fe/L',2),
    f('mn','Mn(II) a oxidar y remover','mg Mn/L',.4),f('solids','Otros sólidos secos capturados','kg/día',12),
    pct('dry','Fracción de sólidos del lodo húmedo',4,.01)
  ],'Balance ideal con O₂: 0,25 mol O₂/mol Fe y 0,5 mol/mol Mn. Precipitados Fe(OH)₃ y MnO₂; cada mol de metal consume 2 eq de alcalinidad.',
  v=>{const fe=v.q*v.fe/1000/55.845,mn=v.q*v.mn/1000/54.938;
    const dry=fe*106.867+mn*86.936+v.solids;
    return metrics(m('Oxígeno estequiométrico',32*(.25*fe+.5*mn),'kg O₂/día'),
      m('Alcalinidad consumida',100.086*(fe+mn),'kg CaCO₃-eq/día'),
      m('Precipitado de hierro',fe*106.867,'kg/día'),m('Precipitado de manganeso',mn*86.936,'kg/día'),
      m('Sólidos secos totales',dry,'kg/día'),m('Masa de lodo húmedo',dry*100/v.dry,'kg/día'));},
  'Balance estequiométrico. La cinética, el oxidante real y el pH operativo se verifican con ensayos y las condiciones de la planta.');

  reg('water-ph-titration-dose',['phcorr'],'water','Ajuste de pH · dosis a partir de titulación',[
    T('a','Titulación de la misma agua','0;6.4\n5;6.8\n12;7.2\n20;7.7',
      'Columnas: dosis de producto comercial (mg/L); pH medido después de estabilizar. Ordena por dosis creciente.'),
    f('target','pH objetivo','',7.1,0,14),f('q','Caudal tratado','m³/h',60)
  ],'Interpolación lineal entre dos mediciones que encierran el pH objetivo. Masa comercial = caudal × dosis/1000.',
  v=>{
    rows(v.a,2,([dose,ph])=>dose>=0&&ph>=0&&ph<=14,'Ingresa dosis no negativa y pH de 0 a 14.');
    A(v.a.length>=2&&v.a.every((r,i)=>i===0||r[0]>v.a[i-1][0]),'Usa dos o más dosis estrictamente crecientes.');
    const direction=Math.sign(v.a[1][1]-v.a[0][1]);
    A(direction!==0&&v.a.every((r,i)=>i===0||direction*(r[1]-v.a[i-1][1])>0),'Usa un tramo de pH estrictamente monótono.');
    const j=v.a.findIndex((r,i)=>i>0&&direction*(v.target-v.a[i-1][1])>=0&&direction*(r[1]-v.target)>=0);
    A(j>0,'El objetivo está fuera del intervalo ensayado.');
    const [d1,p1]=v.a[j-1],[d2,p2]=v.a[j],dose=d1+(d2-d1)*(v.target-p1)/(p2-p1);
    return {...metrics(m('Dosis comercial interpolada',dose,'mg/L'),m('Consumo de producto',v.q*dose/1000,'kg/h')),
      series:[{name:'Titulación medida',data:v.a,points:true},{name:'Objetivo',data:[[dose,v.target]],type:'scatter',points:true}],
      xLabel:'Dosis comercial (mg/L)',yLabel:'pH'};
  },'Usa datos de ensayo de la misma agua, producto y condiciones. Verifica la respuesta en planta.');

  reg('ultimate-bod-estimation',['ultimatebod'],'water','DBO última · cinética de primer orden',[
    f('bod','DBO observada','mg/L',160),f('t','Tiempo de incubación observado','días',5,eps),
    f('k','Constante de reacción (base natural)','1/día',.23,eps),f('future','Tiempo de proyección','días',10)
  ],'DBO(t)=L₀(1−e⁻ᵏᵗ). L₀=DBO observada/(1−e⁻ᵏᵗ).',
  v=>{const ultimate=v.bod/(-Math.expm1(-v.k*v.t));
    return metrics(m('DBO última estimada',ultimate,'mg/L'),m('DBO al horizonte elegido',-ultimate*Math.expm1(-v.k*v.future),'mg/L'),
      m('Demanda remanente',ultimate*Math.exp(-v.k*v.future),'mg/L'));},
  'Usa una constante coherente con las condiciones de incubación. El modelo supone un solo proceso de primer orden.');
})();
