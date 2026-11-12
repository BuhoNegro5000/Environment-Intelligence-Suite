/* Factores SI; las unidades ambiguas se nombran con su convención. */
(function(){'use strict';const G=GL;
const defs={
length:['Longitud',{mm:.001,cm:.01,m:1,km:1000,'pulgada':.0254,'pie':.3048,'yarda':.9144,'milla terrestre':1609.344,'milla náutica':1852}],
area:['Área',{'cm²':.0001,'m²':1,'km²':1e6,ha:10000,'ft²':.09290304,acre:4046.8564224}],
volume:['Volumen',{mL:1e-6,L:.001,'m³':1,'cm³':1e-6,'ft³':.028316846592,'galón US':.003785411784,'galón imperial':.00454609}],
mass:['Masa',{mg:1e-6,g:.001,kg:1,t:1000,'libra (lb)':.45359237,'onza (oz)':.028349523125}],
density:['Densidad',{'kg/m³':1,'g/cm³':1000,'g/L':1,'kg/L':1000,'t/m³':1000,'lb/ft³':16.01846337396}],
pressure:['Presión',{Pa:1,kPa:1000,MPa:1e6,bar:1e5,mbar:100,atm:101325,'mmHg convencional':133.322387415,psi:6894.757293168}],
temperature:['Temperatura absoluta',{'°C':1,K:1,'°F':1}],
temperatureDifference:['Diferencia de temperatura',{'Δ°C':1,'ΔK':1,'Δ°F':5/9}],
flow:['Caudal volumétrico',{'m³/s':1,'m³/h':1/3600,'m³/d':1/86400,'L/s':.001,'L/min':1/60000,'L/h':1/3600000,'ft³/min (cfm)':.028316846592/60,'gal US/min':.003785411784/60}],
massFlow:['Caudal másico',{'kg/s':1,'kg/h':1/3600,'kg/d':1/86400,'g/s':.001,'t/h':1000/3600,'t/d':1000/86400,'lb/h':.45359237/3600}],
energy:['Energía',{J:1,kJ:1000,MJ:1e6,GJ:1e9,Wh:3600,kWh:3600000,MWh:3600000000,'cal termochemical':4.184,'kcal termochemical':4184,'BTU IT':1055.05585262}],
power:['Potencia',{W:1,kW:1000,MW:1e6,'hp mecánico':745.69987158227,'kcal termochemical/h':4184/3600}],
time:['Tiempo',{s:1,min:60,h:3600,'día (24 h)':86400,'semana (7 días)':604800,'año juliano (365,25 días)':31557600}],
speed:['Velocidad',{'m/s':1,'km/h':1/3.6,'ft/s':.3048,'milla/h':1609.344/3600,'nudo':1852/3600}],
concentration:['Concentración másica',{'kg/m³':1,'g/L':1,'mg/L':.001,'µg/L':1e-6,'mg/m³':1e-6,'µg/m³':1e-9}],
massFraction:['Fracción másica',{'kg/kg':1,'g/kg':.001,'mg/kg (ppm m/m)':1e-6,'µg/kg (ppb m/m)':1e-9,'% m/m':.01}],
force:['Fuerza',{N:1,kN:1000,'kgf estándar':9.80665,lbf:4.4482216152605}],
conductivity:['Conductividad eléctrica',{'S/m':1,'mS/cm':.1,'µS/cm':.0001,'dS/m':.1}],
resistivity:['Resistividad eléctrica',{'Ω·m':1,'Ω·cm':.01,'kΩ·cm':10,'MΩ·cm':10000}],
angle:['Ángulo plano',{rad:1,'°':Math.PI/180,'minuto de arco':Math.PI/10800,'segundo de arco':Math.PI/648000,'π rad':Math.PI,'vuelta':2*Math.PI}],
surfaceFlux:['Flujo superficial',{'m/s':1,'m³/(m²·h)':1/3600,'m³/(m²·día)':1/86400,'L/(m²·h)':1/3600000,'gal US/(ft²·día)':.003785411784/(.09290304*86400)}],
waterHardness:['Dureza como CaCO₃',{'mg/L como CaCO₃':1,'meq/L':50.043,'mmol/L como CaCO₃':100.086,'°fH':10,'°dH':100.086*10/56.077,'°Clark':64.79891/4.54609,'gpg (US)':64.79891/3.785411784}],
dynamicViscosity:['Viscosidad dinámica',{'Pa·s':1,'mPa·s':.001,cP:.001,P:.1}],
kinematicViscosity:['Viscosidad cinemática',{'m²/s':1,'mm²/s':1e-6,cSt:1e-6,St:1e-4}]
};
G.units={dimensions:Object.fromEntries(Object.entries(defs).map(([id,[name,factors]])=>[id,{name,factors}])),convert(id,value,from,to){const d=this.dimensions[id];G.lab.assert(d&&Object.hasOwn(d.factors,from)&&Object.hasOwn(d.factors,to),'Unidades incompatibles con la magnitud seleccionada.');G.lab.assert(Number.isFinite(value),'Se necesita un valor finito.');let x;if(id==='temperature'){const k=from==='K'?value:from==='°C'?value+273.15:(value-32)*5/9+273.15;G.lab.assert(k>=-1e-10,'Temperatura inferior al cero absoluto.');const kelvin=Math.max(0,k);x=to==='K'?kelvin:to==='°C'?kelvin-273.15:(kelvin-273.15)*9/5+32;}else x=value*d.factors[from]/d.factors[to];G.lab.assert(Number.isFinite(x),'Resultado fuera del rango numérico disponible.');return x;}};
})();
