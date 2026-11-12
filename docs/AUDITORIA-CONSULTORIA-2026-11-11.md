# Auditoría técnica y de consultoría · Suite de cálculo ambiental Green Owl Labs

**Fecha de corte:** 11 de noviembre de 2026  
**Alcance:** 348 rutas en el barrido inicial (339 herramientas tras consolidar las 9 fichas de conversión en el conversor central), 310 modelos declarativos y 38 herramientas especializadas (36 en el registro automatizado + 2 módulos de carga especial).  
**Método:** lectura del código real (`calc`/`mount`), arnés Node VM, barrido headless de las rutas por CDP y contraste con fuentes primarias.  
**Naturaleza:** revisión técnica independiente. No es opinión legal ni certificación de conformidad.

> **Nota de vigencia.** El barrido y los conteos de este informe describen el estado del 11/11/2026 antes de la consolidación. Después de retirar las nueve calculadoras `unit-*` duplicadas, el registro tiene 339 herramientas; las rutas antiguas (`#/tool/unit-length`, `#/tool/unit-mass-flow`, etc.) siguen funcionando y redirigen al conversor central. El estado final por hallazgo está en la sección 10.

---

## 1. Resumen ejecutivo

1. La suite es amplia y consistente: las 348 rutas renderizan, 346 quedaron en el registro automatizado y los 310 modelos declarativos pasan el arnés de regresión con escenarios de ejemplo.
2. El núcleo matemático verificado es sólido: AQI, dosis de ruido, GUM, EOS-80, oxígeno disuelto, dureza, CCME, método racional, Streeter–Phelps, SCS-CN, GWP y carbonatos coinciden con las fuentes.
3. El riesgo principal no es aritmético sino normativo: la tabla de multas SUNAFIL no corresponde al art. 48.1 del D.S. 008-2020-TR y la UIT está desactualizada (5 350 S/ frente a 5 500 S/).
4. El clasificador SEIA y el comparador de límites pueden leerse como decisiones vinculantes cuando solo son cribado; ambos requieren rediseño de mensaje y regla de decisión.
5. La tabla ECA de aire es correcta en los 6 parámetros que incluye, pero omite promedios anuales, Pb, H₂S, C₆H₆, Hg y Cd/As/Cr en PM10.
6. Varias herramientas especializadas sustituyen entradas vacías o inválidas por valores por defecto (`GL.num`), lo que rompe la trazabilidad del dato.
7. Hay brechas temáticas claras: AERMOD/AERMET, ISO 9613-2, GHG Protocol completo, ISO 14046, ACV, riesgo multipathway, hidrogeología y tendencias no paramétricas.
8. La UI genérica sirve para calculadoras simples, pero no para matrices, mapas, series, estadística, finanzas ni expedientes; ahí se necesita interfaz propia.
9. Prioridad inmediata: corregir SUNAFIL/UIT, etiquetar SEIA, añadir banda de guarda, completar ECA aire y eliminar el fallback silencioso.
10. Prioridad estructural: UI propia para unas 20 rutas, sello de informe (fecha, hash y versión) y un programa de validación con casos de referencia.

---

## 2. Alcance, método y límites

- **Auditoría de código, no de documentación.** Se leyeron las funciones `calc` de los modelos declarativos y los `mount` de las herramientas especializadas. Los valores de ejemplo se ejecutaron en un contexto Node VM con el mismo cargador de la aplicación.
- **Cobertura.** El arnés automatizado cargó 310 modelos declarativos y 36 herramientas especializadas (346). Los dos módulos restantes (`science-map.js` y `bioacoustics.js`) se excluyeron del arnés por su tamaño/dependencia externa y se revisaron en el barrido de rutas. Las 348 rutas se abrieron con `chrome-headless-shell` y CDP.
- **Verificación numérica.** Se contrastaron manualmente unas 45 fórmulas de alta prioridad. No se validaron independientemente las 346 herramientas con datos de campo.
- **Barrido de rutas.** Todas renderizan; 0 desbordamiento horizontal. Única ruta con error: `bioacoustics` (no alcanza `http://127.0.0.1:8877/api/status`). `taxonomy` aparece casi vacía a los 90 ms por carga diferida de un módulo de 27.7 MB.
- **Regresión.** `node tests/lab-models.cjs` devuelve: “OK: 310 modelos con datos de ejemplo; referencias numéricas, conservación de masa, reproducibilidad y casos inválidos verificados.”

---

## 3. Estado general

| Dimensión | Resultado | Observación |
|---|---|---|
| Rutas | 348 renderizan | 1 depende de un motor local externo |
| Modelos declarativos | 310/310 pasan | Referencias, masa, reproducibilidad y casos inválidos |
| Fórmulas verificadas | ~45 sin error aritmético | AQI, ruido, metrología, agua, hidráulica, clima |
| Unidades | Coherentes en SI | Un comentario engañoso en `data.js:157` |
| Validación de entradas | Mixta | Estricta en declarativos; `GL.num` en especializadas |
| Trazabilidad | Parcial | Informe con versión y método, sin fecha/hash/versión por modelo |
| Normativa | 2 errores confirmados y 1 omisión | SUNAFIL, UIT y ECA aire |
| Interfaz | Genérica | No apta para matrices, mapas, series, tablas ni finanzas |

---

## 4. Hallazgos

**Severidades:** *Crítica* = puede inducir una decisión regulatoria o económica incorrecta; *Alta* = afecta decisiones o disponibilidad; *Media* = riesgo de mala interpretación; *Baja* = mejora de calidad.

| Herramienta | Hallazgo | Severidad | Corrección |
|---|---|---|---|
| `safety-fines` (multas SUNAFIL) | **[Error confirmado]** La tabla no reproduce el art. 48.1 del D.S. 008-2020-TR. Usa una sola escala de rangos; el reglamento tiene tres escalas con valores fijos: microempresa (1–10 trabajadores), pequeña empresa (1–5 … 100+) y no MYPE (1–10 … 1 000+). Ejemplo: no MYPE, 1–10 trabajadores, muy grave = **2.63 UIT**; la app muestra 1.79–3.56 UIT para 1–5. Además cita el Reglamento de la Ley 29783 en vez de la Ley 28806. `data.js:183-224`, `safety2.js:540-563`. | **Crítica** | Reemplazar por las tres tablas oficiales; exigir tamaño de empresa y constancia REMYPE; citar D.S. 019-2006-TR modificado por D.S. 008-2020-TR. |
| `safety-fines` | **[Error confirmado]** UIT de 5 350 S/ (`data.js:185`, `safety2.js:496`). La UIT 2026 es **5 500 S/** (D.S. 301-2025-EF). | **Crítica** | Parametrizar por año; valor por defecto 5 500 para 2026 y mostrar la norma usada. |
| `safety-fines` | **[Riesgo]** Multiplica el rango por el número de infracciones y aplica el mismo tramo a todas. No modela concurso, topes de 200/100/50 UIT por gravedad, 300 UIT por conjunto, reducción MYPE del 50 % ni tope del 1 % de ingresos netos (art. 39 Ley 28806; art. 48.1-A). | **Alta** | Añadir topes y reglas de concurso; separar multa por infracción de multa por procedimiento. |
| `safety-fines` | **[Riesgo]** Afirma que se aplica la UIT de la fecha de la infracción (`safety2.js:541`) sin respaldo en la fuente citada; la práctica reportada usa la UIT de la resolución. | **Media** | Verificar la base legal o eliminar la afirmación; declarar el criterio. |
| `seia-classifier` | **[Riesgo alto]** Categoría I/II/III e instrumento DIA/EIA-sd/EIA-d/ITS se derivan de umbrales genéricos y suma de sensibilidades (`impact.js:165-195`). La clasificación real es sectorial y se apoya en anexos de clasificación anticipada. El badge puede leerse como vinculante. | **Alta** | Renombrar a “cribado preliminar”; quitar el badge de categoría; enlazar los anexos sectoriales; mostrar “requiere clasificación de la autoridad competente”. |
| `analysis-standards` | **[Riesgo alto]** Acepta igualdad sin banda de guarda; no pide período de promedio, incertidumbre, LOD/LOQ ni zona de mezcla; la fuente es texto libre (`science-analysis.js:152`). | **Alta** | Regla de decisión ILAC-G8 / ISO/IEC 17025; campos obligatorios; estados “conforme / no concluyente / no conforme”. |
| `eca-aire` | **[Error por omisión]** Incluye 6 parámetros con valores correctos, pero omite promedios anuales, Pb, H₂S, C₆H₆, Hg y Cd/As/Cr en PM10 (D.S. 003-2017-MINAM; D.S. 011-2023-MINAM). `data.js:52`. | **Media-Alta** | Completar el anexo; separar por período y criterio de evaluación (no exceder, media anual, etc.). |
| `ghg-agricultural` | **[Riesgo]** `EF1=0.010` se aplica a N sintético, fijado y residuos; IPCC 2019 distingue factores y usa `FracGASM=0.21`; no hay incertidumbre ni separación de pools (`data.js:23-38`, `soil3.js`). | **Media** | Separar fuentes de N; aplicar el factor por tipo; añadir incertidumbre y trazabilidad de factores. |
| `gaussian-plume` | **[Riesgo]** Declara validez 100 m–10 km pero acepta distancias desde 1 m; sin terreno, downwash, química ni deposición (`air-energy.js:13`). | **Media** | Validar el rango; declarar “cribado”; no comparar con ECA sin estudio regulatorio. |
| `noise-dose` | **[Error confirmado]** `ndShift` y `ndWarn` se leen pero no intervienen en dosis, TWA ni veredicto (`safety2.js:126-127`). El turno extendido no ajusta la exposición. | **Media** | Ajustar `T` al turno o eliminar los campos; probar turnos de 8 y 12 h. |
| Herramientas especializadas | **[Riesgo]** `GL.num` sustituye en silencio campos vacíos o inválidos por valores por defecto (`core.js:87-100`); los modelos declarativos usan validación estricta. | **Media** | Marcar el campo, bloquear el cálculo y registrar el valor usado. |
| `solar-pv` | **[Riesgo]** El PR admite hasta 120 % y el perfil mensual es sintético por latitud (`air-energy2.js:79`). | **Media** | Limitar PR a 50–90 %; usar TMY o declarar el perfil como ilustrativo. |
| `wind-weibull` | **[Riesgo]** Curva de potencia lineal por tramos (`air-energy2.js:267-271`). | **Media** | Cargar la curva del fabricante e interpolar la potencia. |
| `noise` (puntual/lineal/barrera) | **[Brecha]** Sin ISO 9613-2: no hay bandas de octava, absorción atmosférica, efecto del suelo, reflexiones ni mapa. | **Media** | Añadir módulo ISO 9613-2 y rejilla de receptores. |
| `bioacoustics` | **[Error de disponibilidad]** Dependencia dura de `http://127.0.0.1:8877/api/status`; la ruta falla si el motor no está activo. | **Alta** | Fallback, timeout y mensaje de servicio; modo demo con datos sintéticos. |
| `taxonomy` | **[Riesgo de rendimiento]** Módulo de 27.7 MB; la ruta tarda en cargar (carga diferida). | **Media** | Dividir el catálogo y cargar por demanda. |
| Informes | **[Mejora]** Guardan versión global y método, pero no fecha/hora, hash de entradas ni versión por modelo (`lab.js:167`). | **Media** | Sello de tiempo, hash SHA-256 de entradas y versión del modelo. |
| `unit-*` | **[Mejora]** Nueve rutas duplican el conversor central `unit-converter`; el registro tiene 10 rutas `unit-*`. | **Baja** | Redirigir a `unit-converter` o consolidar el registro. |
| `water-acid-speciation` / `ocean-carbonate` | **[Mejora]** Modelos de concentración con pKa/Ksp ingresados; sin coeficientes de actividad, redox, precipitación ni corrección T/S/P. | **Baja** | Integrar especiación con actividades (tipo PHREEQC) y corrección T/S/P. |
| `metrology` | **[Mejora]** Sin Welch–Satterthwaite, covarianzas ni incertidumbre del límite; `k` fijo. | **Baja** | Añadir grados de libertad efectivos y covarianzas. |
| `data.js:157` | **[Mejora]** El comentario `O2density: 1.2 // kg O2/m3 aire` confunde la densidad del aire con la del O₂; la fórmula de `water.js` es correcta. | **Baja** | Corregir el comentario. |

---

## 5. Verificaciones que pasaron

| Herramienta | Caso probado | Resultado | Referencia / nota |
|---|---|---|---|
| `epa-air-quality-index` | Escenario por defecto | AQI **126**, O₃ 8 h dominante; PM2.5 102, PM10 57, CO 90, NO₂ 42, SO₂ 69 | Breakpoints y regla SO₂ conformes al AirNow TAD (mayo 2026) |
| `noise-dose` | 95 dB/2 h + 88 dB/4 h + 82 dB/2 h | Dosis y TWA coherentes; NIOSH 85 dBA/3 dB y OSHA 90 dBA/5 dB | `T=8/2^((L−L₀)/exchange)`; TWA `85+10·log10(D/100)` / `90+16.61·log10(D/100)` |
| `measurement-uncertainty` | Presupuesto GUM con divisores | `u_c=√Σuᵢ²`, `U=k·u_c` y banda de guarda correctos | GUM / EA-4/02 |
| `seawater-density` | 20 °C, 35 PSU | **1024.763 kg/m³** | UNESCO EOS-80 |
| `oxygen-water-saturation` | 20 °C, agua dulce | **9.092 mg/L**; saturación 85.79 % | Ecuación de solubilidad implementada |
| `water-hardness` | Ca 100 mg/L, Mg 20 mg/L | **332.06 mg/L como CaCO₃** | `2.497·Ca + 4.118·Mg` |
| `ccme-wqi` | F₁=10 %, F₂=20 %, F₃=30 % | **78.4** | `100−√[(F₁²+F₂²+F₃²)/3]` |
| `rational-runoff` | C=0.6, i=50 mm/h, A=10 ha | **0.833 m³/s** | `Q=C·i·A/360` |
| `noise-point` / `noise-line` | 80 dB a 10 m y 100 m | **60 dB** y **70 dB** | Divergencia geométrica y lineal |
| `noise-barrier` | Δ=1 m, f=500 Hz, c=343 m/s | **17.88 dB** | Difracción de barrera |
| `streeter-phelps-river-oxygen` | Escenario por defecto | OD mínimo **4.367 mg/L** a **46.77 km** | Solución analítica y bisección |
| `curve-number-runoff` | Escenario por defecto | **35.10 mm** | SCS-CN |
| `ghg-co2e` | Escenario por defecto | **154.3 t CO₂e** | GWP100 |
| `water-acid-speciation` | pH 8.1, sistema carbonato | **97.69 % HCO₃⁻** | Balance de masa y pKa |
| `ocean-carbonate` | pH 8.05, Ca 10.3 mmol/kg, CO₃ 200 µmol/kg | Ω aragonita **3.169**, Ω calcita **4.791** | `Ω=[Ca²⁺][CO₃²⁻]/Ksp` |

No se encontraron errores aritméticos en las fórmulas verificadas. Los hallazgos de esta auditoría son de tabla normativa, alcance, validación, trazabilidad y UI.

---

## 6. Herramientas que requieren UI propia

El renderizador de `lab.js` resuelve bien formularios de pocos campos y resultados en tarjetas. No es adecuado cuando el dato de entrada es una matriz, un mapa, una serie, una tabla de expediente o un flujo. Conteo observado: 138 herramientas con ≤3 campos, 54 con selectores de modo, 139 generan tablas, 39 generan gráficos, 167 solo métricas, 113 rutas muestran ≥2 tablas y 279 no muestran gráfico.

| Grupo | Rutas representativas | Por qué no basta la UI genérica | Propuesta de UI | Prioridad |
|---|---|---|---|---|
| Decisión multicriterio | `mcda-ahp`, `mcda-fuzzy-ahp`, `mcda-topsis`, `mcda-fuzzy-topsis`, `mcda-electre`, `mcda-promethee`, `mcda-dematel`, `mcda-fuzzy-dematel`, `mcda-anp`, `mcda-swara`, `mcda-owa` | Matriz de comparación por pares, consistencia, pesos y relaciones de superación | Editor matricial, medidor de consistencia, barras de pesos, grafo de superación y análisis de sensibilidad | **Alta** |
| Matrices de impacto y riesgo | `leopold-matrix`, `impact-riam`, `impact-iranian`, `impact-checklist`, `risk-conesa`, `iperc-matrix`, `risk-fmea`, `risk-efmea`, `impact-weighted` | Filas × columnas, escalas de color, agregación y filtros | Rejilla editable con heatmap, filtros por componente/factor, totales y exportación | **Alta** |
| Mapas y geometría | `boundary-validator`, `shp-to-kml`, `geo-buffer`, `analysis-spatial`, `soil-texture`, `geo-dd-dms`, `sample-size` | Coordenadas, archivos, capas y sistemas de referencia | Lienzo de mapa, arrastrar y soltar archivos, control de capas y CRS | **Alta** |
| Series y curvas | `streeter-phelps-river-oxygen`, `first-order-decay`, `water-ph-titration-dose`, `equalization`, `wind-weibull`, `curve-number-runoff`, `solar-pv`, `gac-breakthrough`, `solids-flow` | El resultado es una curva, no un número | Gráfico interactivo con ejes, zoom, cursor y superposición de escenarios | **Alta** |
| Estadística y ajuste | `analysis-statistics`, `analysis-regression`, `analysis-pca`, `analysis-timeseries`, `analysis-qa`, `analysis-sampling`, `isotherms` | Diagnóstico visual, residuos, intervalos y valores atípicos | Dispersión, residuos, QQ-plot, intervalos de confianza y exportación | **Alta** |
| Tablas y expediente | `analysis-standards`, `water-evidence-comparison`, `pfas-lab-evidence`, `compliance`, `monitoring`, `high-purity` | Cada fila tiene estado, período, incertidumbre y evidencia | Tabla con estado por fila, banda de guarda, fuente obligatoria y exportación | **Alta** |
| Multi-modo / asistente | `uv-reactor-bank-design`, `water-acid-speciation`, `gas-ppm`, `open-channel`, `clarifier`, `membranes`, `rusle`, `toxicology`, `leed`, `stack-lab` | Muchos campos condicionales y cálculos encadenados | Asistente por pasos, campos condicionales y unidades por etapa | **Media** |
| Finanzas | `cashflows`, `equipment`, `chemical-cost`, `ipmvp` | Flujos editables, NPV/IRR y sensibilidad | Tabla de flujos editable, gráfico de caja y tornado | **Media** |
| Conversores y catálogo | `unit-converter`, `taxonomy`, `bioacoustics` | Búsqueda, recientes y favoritos | Catálogo buscable con filtros y estado del servicio | **Baja-Media** |

**Conclusión de UI:** unas 20 rutas son de prioridad alta, unas 40 de prioridad media y unas 30 de prioridad baja. Las calculadoras simples deben conservar el renderizador genérico: reescribirlas no aporta valor y aumenta el costo de mantenimiento.

---

## 7. Brechas y herramientas a integrar

Criterio de prioridad: exposición regulatoria, frecuencia de uso, disponibilidad de datos y costo de implementación. Complejidad: baja (formulario), media (modelo acoplado), alta (solver, datos geoespaciales o meteorología horaria).

| Herramienta propuesta | Problema que resuelve | Fórmula / modelo | Entradas | Fuente normativa | Prioridad | Complejidad | Dependencia | UI propia |
|---|---|---|---|---|---|---|---|---|
| Dispersión regulatoria AERMOD/AERMET/AERMAP | El cribado gaussiano no sustituye un estudio regulatorio: faltan terreno, downwash, meteorología horaria y receptores | Pluma gaussiana + similitud de capa límite; AERMOD; AERMET; AERMAP | Emisión, chimenea, meteorología horaria, topografía, receptores | EPA 40 CFR 51 Ap. W; AERMOD User's Guide | **Alta** | Alta | AERMET/AERMAP, datos meteorológicos, PostGIS | Sí: mapa + rejilla |
| Ruido ISO 9613-2 y mapa acústico | No hay bandas de octava, absorción, suelo, reflexiones ni rejilla | `Lp=Lw+Dc−A_div−A_atm−A_gr−A_bar−A_misc`; suma energética | Potencia, espectro, geometría, suelo, obstáculos, receptores | ISO 9613-1/2; D.S. 085-2003-PCM | **Alta** | Media | Motor de rejilla/geo | Sí: mapa + isolíneas |
| Inventario GEI corporativo (GHG Protocol) | El cálculo actual es agrícola/energético; no cubre alcances 1–3 ni verificación | `Σ actividad × factor`; alcances 1/2/3; incertidumbre | Combustible, electricidad, procesos, cadena de valor | GHG Protocol Corporate/Scope 3; IPCC 2006/2019 | **Alta** | Media | Factores por país; base de datos | Sí: asistente por alcance |
| Huella hídrica ISO 14046 | No hay balance azul/verde/gris ni evaluación de impacto | `WF=Σ flujos × factor de escasez`; balance de cuenca | Uso, vertido, calidad, cuenca | ISO 14046; Hoekstra et al. 2011 | **Alta** | Media | Datos de cuenca; AWARE | Sí: diagrama de flujo |
| Regla de decisión y conformidad | El comparador acepta igualdad y no usa incertidumbre | `y±U` frente a `L`; banda de guarda `w`; ILAC-G8 | Medición, `U`, `k`, límite, `w` | ISO/IEC 17025; ILAC-G8 | **Alta** | Baja | Ninguna | Sí: tabla de estados |
| Riesgo a la salud multipathway | La dosis actual es de una vía; falta agregación, índice de peligro y riesgo carcinogénico | `CDI=C×IR×EF×ED/(BW×AT)`; `HQ=CDI/RfD`; `Risk=CDI×CSF` | Concentraciones, tasas, exposición, parámetros | EPA RAGS; EPA RSL; OMS | **Alta** | Media | Base de RfD/CSF | Sí: asistente por vía |
| Hidrología continua y tránsito | SCS-CN estima una lámina; falta hidrograma y tránsito | SCS-CN + hidrograma unitario adimensional + Muskingum | P, CN, área, Tc, lluvia horaria, tramos | NEH-4; SCS; Chow | **Alta** | Media | Series de lluvia | Sí: hidrograma interactivo |
| Aguas subterráneas (Domenico/MT3D) | No hay advección-dispersión ni pluma | Domenico 1987; ADE; retardo `R` | K, gradiente, dispersividad, fuente, receptores | Domenico & Schwartz; USEPA | Media | Alta | Solver numérico; geo | Sí: mapa de pluma |
| Tendencias Mann–Kendall / Sen | Las series actuales no prueban tendencia no paramétrica | `S=Σsigno`; `Var(S)`; `Z`; pendiente de Sen | Serie temporal, estación | Mann 1945; Kendall 1975; Sen 1968 | Media | Baja | Ninguna | Sí: gráfico + tabla |
| Incertidumbre de inventarios (Monte Carlo) | Los inventarios son deterministas | Distribuciones por factor; 10 000 iteraciones; P5/P50/P95 | Factores, distribución, correlaciones | IPCC 2006 Vol. 1 Cap. 3 | Media | Baja | Ninguna | Sí: histograma/tornado |
| Emisiones móviles COPERT/IVE | No hay factores por flota ni velocidad | `Σ km × EF(v, tecnología, combustible)` | Flota, km, velocidad, combustible | EMEP/EEA Guidebook; COPERT | Media | Media | Base de factores | Sí: tabla por categoría |
| Red de monitoreo y kriging | No hay diseño ni interpolación espacial | Variograma; kriging ordinario; varianza de estimación | Datos geo, covariables, rejilla | Isaaks & Srivastava; EPA QA/G-5S | Media | Alta | PostGIS/geoestadística | Sí: mapa + variograma |
| Sensibilidad global (Morris/Sobol) | No hay análisis de sensibilidad | Morris; Sobol `S1/ST`; Monte Carlo | Modelo, rangos, distribuciones | Saltelli et al. 2008 | Media | Media | Motor de simulación | Sí: tornado/índices |
| Lodos activados ASM1/BSM1 | El modelo Monod-CSTR no cubre nitrificación/desnitrificación ni múltiples sustratos | ASM1 (8 procesos, 13 variables); integración ODE | Afluente, cinética, configuración | IWA ASM1; BSM1 | Media | Alta | Solver ODE | Sí: esquema de planta |
| Curva de ruptura GAC | No hay modelo de lecho fijo | Thomas; Adams–Bohart; Yoon–Nelson | C₀, caudal, masa, altura, tiempo | Thomas 1944; Yoon–Nelson 1984 | Media | Baja | Ninguna | Sí: curva + ajuste |
| Caudal ambiental (Q95/IHA) | No hay régimen ambiental ni alteración hidrológica | Q95; IHA/RVA; Tennant | Serie diaria, obra, tramo | Tennant 1976; IHA | Media | Media | Serie hidrológica | Sí: hidrograma |
| Olores (EN 13725 + AERMOD) | No hay modelado de olor ni umbral | Concentración de olor; OU/m³; AERMOD | Emisión, meteorología, receptores | EN 13725; AERMOD | Media | Alta | AERMOD | Sí: mapa |
| Economía circular y balance de residuos | No hay balance de materiales ni indicadores | `Σ entradas=Σ salidas+stock`; tasas de reciclaje | Flujos, composición, destinos | Ley 27314; Directiva 2008/98/CE | Baja | Media | Ninguna | Sí: Sankey |

---

## 8. Hoja de ruta

### Corto plazo (0–30 días)

1. **SUNAFIL:** reemplazar la tabla por las tres escalas oficiales, actualizar la UIT a 5 500 S/ (2026), añadir topes del art. 39 y reducción MYPE, y corregir la cita normativa.
2. **SEIA:** renombrar a “cribado preliminar”, retirar el badge de categoría y añadir un aviso de clasificación sectorial vinculante.
3. **Comparador de límites:** incorporar banda de guarda, período de promedio, incertidumbre, LOD/LOQ y estados de conformidad.
4. **ECA aire:** completar el anexo con anuales, Pb, H₂S, C₆H₆, Hg y Cd/As/Cr en PM10.
5. **Ruido:** conectar `ndShift` y `ndWarn` o eliminarlos; probar turnos de 8 y 12 h.
6. **Disponibilidad:** fallback para `bioacoustics` y división del catálogo de `taxonomy`.
7. **Trazabilidad:** añadir fecha/hora, hash de entradas y versión por modelo al informe.
8. **Pruebas:** crear casos de regresión para las tablas normativas (UIT, SUNAFIL, ECA, ruido).

### Medio plazo (1–3 meses)

1. **UI propia, fase 1:** decisión multicriterio, matrices de impacto/riesgo, series y estadística.
2. **Validación estricta:** eliminar el fallback silencioso de `GL.num` en herramientas especializadas.
3. **GEI agrícola:** separar fuentes de N, aplicar factores IPCC 2019 por tipo y añadir incertidumbre.
4. **Nuevas herramientas:** regla de decisión, Mann–Kendall/Sen, GAC, ASM1 y Monte Carlo de inventarios.
5. **Aire:** validar el rango del modelo gaussiano y preparar el puente a AERMOD con meteorología horaria.
6. **Ruido:** módulo ISO 9613-2 con bandas de octava y rejilla de receptores.
7. **UI propia, fase 2:** tablas de expediente, finanzas y asistentes multi-modo.

### Largo plazo (3–12 meses)

1. **AERMOD/AERMET/AERMAP** completo con topografía, downwash y receptores.
2. **Mapa acústico** con isolíneas y cumplimiento de D.S. 085-2003-PCM.
3. **GHG Protocol** alcances 1–3 con factores por país y verificación.
4. **ISO 14046 y ACV** (ISO 14040/14044) con bases de datos de inventario.
5. **Hidrogeología y kriging** con solver numérico y análisis geoestadístico.
6. **API versionada, auditoría de cálculos y certificación** con casos de referencia y trazabilidad completa.

---

## 9. Limitaciones y fuentes

### Limitaciones

- Esta revisión **no es una opinión legal** ni sustituye la clasificación de la autoridad competente.
- No se validaron independientemente las 346 herramientas con datos de campo; se verificaron unas 45 fórmulas de alta prioridad y los 310 modelos con escenarios de ejemplo.
- El motor de bioacústica (`127.0.0.1:8877`) no estaba activo durante la auditoría; la ruta se evaluó por su dependencia y mensaje de error.
- La normativa se verificó con corte al **11 de noviembre de 2026**. Las tablas de UIT, SUNAFIL y ECA deben revalidarse antes de cada publicación.
- La revisión de UI es heurística; no incluye pruebas de usabilidad con usuarios ni auditoría de accesibilidad o seguridad.

### Fuentes principales

- D.S. 301-2025-EF, UIT 2026 = S/ 5 500. El Peruano, 17/12/2025.
- D.S. 008-2020-TR, que modifica el Reglamento de la Ley 28806 (D.S. 019-2006-TR), art. 48.1 y 48.1-A.
- Ley 28806, Ley General de Inspección del Trabajo, art. 39 (topes y reducción MYPE).
- D.S. 003-2017-MINAM, ECA para aire, y D.S. 011-2023-MINAM, ECA de Cd, As y Cr en PM10.
- D.S. 004-2017-MINAM, ECA para agua.
- D.S. 085-2003-PCM, ECA para ruido.
- AirNow, *Technical Assistance Document for the Reporting of Daily Air Quality*, mayo 2026.
- IPCC, *2019 Refinement to the 2006 IPCC Guidelines*; IPCC, *2006 Guidelines*, Vol. 1 Cap. 3.
- GHG Protocol, *Corporate Standard* y *Scope 3 Standard*.
- ISO 9613-1/2; ISO 14046; ISO 14040/14044; ISO/IEC 17025; ILAC-G8.
- USEPA, *AERMOD User's Guide* y 40 CFR Part 51 Appendix W; *RAGS*.
- UNESCO, *EOS-80*; GUM / EA-4/02.

### Artefactos de la auditoría

- `C:\Users\RICARDO\AppData\Local\Temp\opencode\gaudit\registry.json` — registro completo de herramientas, campos, salidas y referencias.
- `C:\Users\RICARDO\AppData\Local\Temp\opencode\gaudit\routes.json` — resultados de las 348 rutas y conteos de UI.
- `tests/lab-models.cjs` — arnés de regresión de los modelos declarativos y de las tablas normativas.

## 10. Estado de implementación al 11/11/2026

Las correcciones se aplicaron sobre los archivos fuente existentes. El directorio no es un repositorio git, por lo que no se creó rama ni commit.

| Hallazgo | Estado | Cambio principal |
|---|---|---|
| Tabla SUNAFIL y UIT | Corregido | `D.safetyFines` usa las tres escalas del art. 48.1 (D.S. 008-2020-TR), UIT 2026 = S/ 5 500 y topes del art. 39; la herramienta permite escala, ingresos MYPE y muestra el tope aplicado. |
| Dosis de ruido | Corregido | La dosis del turno se normaliza a 8 h para el TWA; el tiempo permitido y la alerta `ndWarn` se calculan por separado. |
| Clasificador SEIA | Acotado | Se presenta como cribado no vinculante; se retiró la categoría definitiva y se identifican los instrumentos como orientativos. |
| ECA de aire | Ampliado | Se añadieron promedios anuales, Pb, H₂S, C₆H₆, Hg y Cd/As/Cr en PM10, conservando los identificadores usados por las herramientas existentes. |
| Comparador de límites | Reescrito | Añade período de promedio, incertidumbre expandida, LOD/LOQ, banda de guarda y estados conforme / no concluyente / no conforme / no cuantificable. |
| Balance GEI agrícola | Corregido | Separa N sintético, orgánico, fijado y residuos; aplica EF1 desagregado, FracGASF/FracGASM y muestra un rango por incertidumbre de EF1. |
| Pluma gaussiana | Acotado | Rango recomendado 100 m – 10 km con advertencia explícita fuera de él. |
| Solar FV | Acotado | El PR se limita a 50–90 % y los valores fuera de rango generan advertencia. |
| Trazabilidad | Añadido | Huella FNV-1a de entradas y resultados, fecha/hora de cálculo y versión del modelo en los informes; `GL.num` marca campos inválidos. |
| Incertidumbre GUM | Ampliado | Grados de libertad efectivos por Welch–Satterthwaite y uso de t de Student cuando k = 2 y ν_eff es finito. |
| Bioacústica | Robustecido | Tiempo de espera, reintentos de sondeo y límite de 45 min para evitar bloqueos del motor local. |
| Rutas `unit-*` | Consolidadas | Las rutas antiguas redirigen a `#/tool/unit-converter/<magnitud>`; se retiraron las calculadoras duplicadas. |

**Verificación ejecutada:** `node tests/lab-models.cjs` pasa con 301 modelos declarativos y comprobaciones normativas de SUNAFIL, ECA e IPCC. `node tests/routes-cdp.cjs` recorrió las 339 rutas con Chrome headless y CDP: todas montaron contenido, sin errores de consola ni desbordamiento horizontal; las nueve fichas `unit-*` abrieron el conversor con la magnitud correcta (9/9). También se hicieron pruebas dirigidas en dosis de ruido (turno de 8 h, turno de 12 h y criterio NIOSH), SUNAFIL (tope por gravedad y tope del 1 % de ingresos), solar FV, pluma gaussiana, cribado SEIA y redirección de `unit-*`. No se validaron resultados con datos de campo ni se sustituye la revisión de un profesional competente.

**Pruebas Node sin dependencias:** `tests/lab-models.cjs`, `tests/result-regression.cjs`, `tests/classification.cjs`, `tests/catalogue.cjs`, `tests/units.cjs`, `tests/spatial-ops.cjs` y `tests/biotic.cjs` pasan. Las pruebas basadas en Playwright (`lab-browser`, `audit-corrections`, `audit-inventory`, `calculator-pilot`) no se ejecutaron en este entorno porque el paquete no está instalado en la ruta de Node; el barrido CDP sin dependencias cubre la comprobación de rutas.
