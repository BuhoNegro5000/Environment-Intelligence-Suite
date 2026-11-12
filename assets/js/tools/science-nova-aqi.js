/* Puntos de corte de la guía EPA de mayo de 2026. */
(function () {
  'use strict';
  const L=GL.lab,{register:R}=GL.nova;
  const levels=[[0,50],[51,100],[101,150],[151,200],[201,300],[301,500]];
  const categories=['Buena','Moderada','Dañina para grupos sensibles','Dañina','Muy dañina','Peligrosa'];
  const pm25=[[0,90],[91,354],[355,554],[555,1254],[1255,2254],[2255,3254]];
  const pm10=[[0,54],[55,154],[155,254],[255,354],[355,424],[425,604]];
  const co=[[0,44],[45,94],[95,124],[125,154],[155,304],[305,504]];
  const no2=[[0,53],[54,100],[101,360],[361,649],[650,1249],[1250,2049]];
  const o8=[[0,54],[55,70],[71,85],[86,105],[106,200]];
  const o1=[null,null,[125,164],[165,204],[205,404],[405,604]];
  const so1=[[0,35],[36,75],[76,185],[186,304]];
  const so24=[null,null,null,null,[305,604],[605,1004]];
  const fields=[
    ['pm25','PM₂,₅ · promedio 24 h','µg/m³','35,9',10,pm25],
    ['pm10','PM₁₀ · promedio 24 h','µg/m³','68',1,pm10],
    ['o8','O₃ · máximo diario de 8 h','ppb','78,533',1,o8],
    ['o1','O₃ · máximo diario de 1 h','ppb','',1,o1],
    ['co','CO · máximo diario de 8 h','ppm','8,4',10,co],
    ['no2','NO₂ · máximo diario de 1 h','ppb','44',1,no2],
    ['so1','SO₂ · máximo diario de 1 h','ppb','50',1,so1],
    ['so24','SO₂ · promedio 24 h','ppb','',1,so24]
  ];
  function index(c,breaks){
    if(c===null)return null;
    const i=breaks.findIndex(r=>r&&c>=r[0]&&c<=r[1]);
    const j=i>=0?i:breaks.length===6&&c>breaks[5][1]?5:-1;
    if(j<0)return null;
    const [lo,hi]=breaks[j], [a,b]=levels[j];
    return Math.round(a+(b-a)*(c-lo)/(hi-lo));
  }
  R('epa-air-quality-index','air-quality-index-aqi','air','Calidad del aire · AQI diario EPA por contaminante',
    fields.map(([key,label,unit,value])=>L.text(key,label+' ('+unit+')',value,'Vacío si no se dispone de la medición.')),
    'Se trunca la concentración a la precisión de la guía EPA y se interpola su subíndice por tramos. El AQI es el mayor subíndice disponible. Se aplican reglas por período para O₃ y SO₂.',
    'Referencia de Estados Unidos de mayo de 2026. Ingresa concentraciones con los períodos y unidades indicados. El cálculo usa los datos disponibles y no sustituye el reporte de la red oficial.',
    v=>{
      const concentrations=Object.fromEntries(fields.map(([key,label,,,scale])=>{
        const raw=String(v[key]).trim();
        if(!raw)return [key,null];
        const c=L.number(raw);
        L.assert(c>=0&&c<=1e6,'Concentración fuera de rango para '+label+'.');
        const scaled=c*scale;
        return [key,Math.floor(scaled+Number.EPSILON*Math.max(1,scaled))];
      }));
      const c=concentrations;
      L.assert(Object.values(c).some(x=>x!==null),'Ingresa al menos una concentración.');
      L.assert(c.o1===null||c.o8===null||c.o1>=c.o8,'El máximo de O₃ de 1 h debe ser mayor o igual al máximo de 8 h.');
      L.assert(c.so1===null||c.so24===null||c.so1>=c.so24,'El máximo de SO₂ de 1 h debe ser mayor o igual al promedio de 24 h.');
      const rows=fields.map(([key,label,unit,,scale,breaks])=>{
        let value=index(c[key],breaks);
        if(key==='so1'&&c.so1>=305&&c.so24!==null&&c.so24<305)value=200;
        return [label,c[key]===null?'Sin dato':c[key]/scale,unit,value??'Sin subíndice'];
      });
      const valid=rows.filter(r=>typeof r[3]==='number');
      const highest=valid.length?Math.max(...valid.map(r=>r[3])):null;
      const level=levels.findIndex(([,hi])=>highest<=hi);
      const category=highest===null?'Sin cálculo':categories[level<0?5:level];
      const dominant=valid.filter(r=>r[3]===highest).map(r=>r[0]).join(', ');
      const incomplete=[];
      if(c.o8>200&&index(c.o1,o1)===null)incomplete.push('El O₃ de 8 h supera su escala. Verifica el máximo de 1 h.');
      if(c.so1>=305&&c.so24===null)incomplete.push('Se necesita el promedio de SO₂ de 24 h para resolver el máximo de 1 h.');
      return {metrics:[['AQI de los datos evaluables',highest??'Sin subíndice','AQI'],['Categoría',category,''],
        ['Contaminante y período dominantes',dominant||'Sin cálculo','']],
        headers:['Contaminante y período','Concentración truncada','Unidad','Subíndice AQI'],rows,message:incomplete.join(' ')};
    },[['EPA / AirNow · guía técnica de AQI diario','https://www.airnow.gov/publications/air-quality-index/technical-assistance-document-for-reporting-the-daily-aqi/']]);
})();
