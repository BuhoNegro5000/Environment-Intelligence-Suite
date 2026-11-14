# Suite científica Yupana · estado actual

339 herramientas en 22 categorías. 32 originales, 101 incorporaciones anteriores, 47 de Solver360, 44 de Plutocalc, 40 de AtlasWTS, 23 de Digital Water, 10 de RenWaves y 42 de NovaSolver. Las 113 entradas del catálogo de referencia tienen ruta nativa; las nueve fichas de conversión se resolvieron en el conversor central para evitar calculadoras duplicadas. **Una ruta no certifica equivalencia funcional integral**: el estado de cada entrada se mantiene explícito en el catálogo y en catalogue-coverage.json.

## Incorporaciones comprobadas

- NovaSolver. Se revisaron las 55 fichas enlazadas en el directorio ambiental y sus cinco subcategorías. La colección local reúne 42 implementaciones nuevas y 13 fichas que enlazan herramientas existentes. Incluye métodos SCS, Monod, Streeter–Phelps, producción pesquera excedente, forzamiento de gases y AQI diario EPA. Los alcances de los modelos de cribado y sus entradas calibradas se documentan en cada herramienta.
- RenWaves. La colección de 12 fichas cubre el directorio y estimadores de sus páginas de energía. Dos fichas comparten el balance térmico HVAC y la eólica utiliza Weibull. Los cálculos de recurso solar y cargas horarias usan series ingresadas localmente. El comparador de equipos utiliza cotizaciones propias. El catálogo de referencia incluye servicios profesionales y datos de mercado externos a los cálculos de la suite.
- Digital Water. Las 50 fichas públicas se registran en el inventario de correspondencias interno. 31 fichas se agrupan en 23 herramientas nuevas y 19 usan herramientas existentes. Incluye indicadores de operación, rendimiento de bombeo, consumo específico, pérdidas de torre, purga limitada por TDS o sílice, tendencia de membranas, balances de efluente y caudales de diseño. La estimación de remoción de SST interpola una curva declarada dentro de su intervalo y la proyección de membranas usa datos normalizados y un umbral elegido por el usuario.

- AtlasWTS, catálogo público en español consultado el 10 de noviembre de 2026. El inventario interno registra las 58 fichas, incluidas ocho anunciadas. 54 fichas se agrupan en 40 herramientas nuevas y cuatro apuntan a herramientas existentes. Incluye balance de planta, redes con recirculación, perfiles HGL/EGL, diseño biológico, DAF, NF/RO, UF/MF, GAC, isotermas, desinfección, planificación de muestreo y revisión PCF/JSON. Las fichas anunciadas se implementaron a partir de la descripción pública. Cada herramienta documenta su alcance, entre ellos el dimensionamiento de resina de intercambio iónico y la auditoría geométrica PCF con exportación JSON. Las hojas de evidencia operan con los datos declarados por el usuario.

- Plutocalc Water, edición pública en español consultada el 10 de noviembre de 2026. El registro de correspondencias interno recoge 105 paneles de cálculo, con 80 funciones agrupadas en 44 herramientas nuevas, 19 funciones vinculadas a herramientas existentes y seis fuera de la selección. Las calculadoras locales incluyen hidráulica, dosificación, ecualización, lodos activados, clarificación, membranas, intercambio iónico, química y desinfección. El conversor central añade ángulo, flujo superficial, dureza equivalente y resistividad. Las tablas de tuberías y tamices, la tabla periódica, las correlaciones de materia orgánica y las tablas de densidad se registran con su motivo de exclusión.

- Colección Solver360, consultada el 10 de noviembre de 2026. El listado inicial presenta 48 fichas y el catálogo interactivo añade índice de calidad del agua, contaminación hídrica y huella hídrica. Las 51 fichas se vinculan desde las herramientas locales. El registro de correspondencias interno conserva cada identificador de origen. Los cuatro módulos reutilizados cubren ICA del aire, pluma gaussiana, diversidad de comunidades y biogás de relleno. Los 47 cálculos nuevos declaran en pantalla su ecuación, unidades y alcance. Se usaron subíndices explícitos para calidad del agua, concentraciones y constantes de la muestra para saturación de carbonatos, y créditos documentados para la hoja LEED.

- Taxonomía: 18 093 registros BirdNET+ v0.5-Nov2026 locales, búsqueda multilingüe por nombres, alias e identificadores, filtros, comparación, imágenes bajo demanda con crédito y CSV.
- Bioindicación: selección común de taxones, fuentes por puntaje, H-FBI original contrastado con las páginas del documento, 85 registros BMWP originales y 33 grados SIGNAL2 OCP. Perfil de referencia y perfil local seleccionables, alias consultables y perfiles editables/importables/exportables. Los indicadores con cobertura incompleta se señalan y no se presentan como índices completos.
- Bioacústica: modelo BirdNET V3.0 ONNX fp32 real en CPU de este equipo, banda y umbral configurables, intervalos, reproducción, revisión humana, CSV y JSON con hash y parámetros. Filtro opcional de ubicación y fecha con BirdNET Geo V3. Requiere el motor Python local descrito en BIOACUSTICA.md.
- R: ejecución real R 4.6.0 dentro del navegador mediante WebR 0.6.1 local. Editor de código, texto, gráficos, errores e informe portable. Se incluye R base; no hay paquetes externos precargados ni CDN.
- GIS: proyectos locales en IndexedDB con reapertura y archivo portable .gowl. Importación GeoJSON, CSV, KML y SHP. Mapa Leaflet con cartografía regional Natural Earth sin conexión, medición de distancia y área, tabla paginada, histogramas, filtros y bitácora. Reproyección Proj4js y operaciones de buffer, centroide, superposición y unión espacial.
- Laboratorios de análisis y decisión: Jarque–Bera, Welch, Mann–Whitney, Pearson y Spearman, muestreo para proporciones, pesos de Moran por distancia, juicios triangulares AHP, relaciones triangulares DEMATEL y escalas lingüísticas TOPSIS. AMEF y AMEF ambiental con hoja editable, acciones por fila y prioridad configurable.
- Métodos numéricos: balances, gases, agua, suelo, clima, unidades, MCDA, EIA, estadística, incertidumbre, series, PCA, regresión y demografía. Fórmulas, límites y referencias en cada herramienta.

## Ejecución

Las calculadoras clásicas funcionan desde index.html. Para disponer de todos los motores y módulos, ejecuta iniciar-suite.ps1 y abre http://127.0.0.1:8876/. El motor acústico escucha únicamente en 127.0.0.1:8877. Los cálculos y grabaciones no se envían a servicios externos. Abrir una referencia o imagen en su fuente sí accede a ese sitio por una acción explícita.

## Componentes de terceros

La interfaz y la integración son propias. Se conservan las atribuciones y condiciones de los modelos, datos y bibliotecas. Consulta assets/vendor/README.md, assets/data/ATTRIBUTION.md y BIOACUSTICA.md. La aplicación ya no debe describirse como carente de dependencias: las bibliotecas se distribuyen localmente, y el audio necesita Python y el modelo.

## Verificación reproducible

- node tests/lab-models.cjs: 310 modelos numéricos, referencias y dominios inválidos.
- node tests/biotic.cjs: perfiles, cobertura, fuentes, duplicados e índices combinados.
- node tests/spatial-ops.cjs: reproyección UTM, buffers y operaciones poligonales.
- node tests/spatial-browser.cjs: migración de capas, proyecto local, archivos CSV/GeoJSON, medición, unión espacial, gráficos, bitácora, deshacer y rehacer, recarga y reapertura de .gowl.
- node tests/catalogue.cjs: correspondencia de 113 entradas de Envix, 51 de Solver360, 105 de Plutocalc e IDs únicos.
- node tests/lab-browser.cjs: rutas y diseño móvil; requiere Playwright y el servidor estático local. GREENOWL_PLAYWRIGHT y GREENOWL_BROWSER permiten indicar el paquete y Chromium.
- node tests/r-browser.cjs: R real, editor, gráfico, informe y errores; comprueba que no haya solicitudes externas.
- .venv-science/Scripts/python.exe tests/test_bioacoustics.py: inferencia BirdNET V3 real con fixture oficial, intervalos, confianza y rechazo de orígenes/parámetros inválidos. Requiere el motor en marcha.

Las pruebas son internas. La revisión cubre las funciones descritas en las fichas públicas de los módulos actualizados y el flujo vectorial propio del laboratorio espacial. La aplicabilidad de los perfiles bióticos a cada región requiere validación local.

## Correspondencia actual

Fuente de alcance: https://envix.ir/en/tools · consulta 2026-11-10.

| Nº | Herramienta nativa | Ruta | Estado |
|---|---|---|---|
| 1 | Calidad del aire · ICA y comparación con ECA/OMS | #/tool/air-quality-index | Implementada · pendiente auditoría funcional comparativa |
| 2 | Tasa de emisión de una chimenea | #/tool/mass-emission | Implementada · pendiente auditoría funcional comparativa |
| 3 | Emisiones por factor de actividad | #/tool/activity-emission | Implementada · pendiente auditoría funcional comparativa |
| 4 | Normalización de caudal de gases | #/tool/stack-flow | Implementada · pendiente auditoría funcional comparativa |
| 5 | Concentración de gases en condiciones de referencia | #/tool/stack-concentration | Implementada · pendiente auditoría funcional comparativa |
| 6 | Velocidad de salida de chimenea | #/tool/stack-velocity | Implementada · pendiente auditoría funcional comparativa |
| 7 | Antorcha · parámetros efectivos de emisión | #/tool/flare-effective | Implementada · pendiente auditoría funcional comparativa |
| 8 | Gases · ppm y mg/m³ | #/tool/gas-ppm | Implementada · pendiente auditoría funcional comparativa |
| 9 | Gases traza · ppb y µg/m³ | #/tool/gas-ppb | Implementada · pendiente auditoría funcional comparativa |
| 10 | Ruido · propagación de fuente puntual | #/tool/noise-point | Implementada · pendiente auditoría funcional comparativa |
| 11 | Ruido · propagación de fuente lineal | #/tool/noise-line | Implementada · pendiente auditoría funcional comparativa |
| 12 | Suma energética de niveles sonoros | #/tool/noise-sum | Implementada · pendiente auditoría funcional comparativa |
| 13 | Potencia sonora desde presión acústica | #/tool/sound-power | Implementada · pendiente auditoría funcional comparativa |
| 14 | Barrera acústica · difracción simplificada | #/tool/noise-barrier | Implementada · pendiente auditoría funcional comparativa |
| 15 | Índice de calidad del agua · CCME | #/tool/ccme-wqi | Implementada · pendiente auditoría funcional comparativa |
| 16 | Densidad superficial del agua de mar | #/tool/seawater-density | Implementada · pendiente auditoría funcional comparativa |
| 17 | Carga contaminante en agua | #/tool/water-load | Implementada · pendiente auditoría funcional comparativa |
| 18 | Tiempo de retención hidráulica | #/tool/retention-time | Implementada · pendiente auditoría funcional comparativa |
| 19 | Dureza total del agua | #/tool/water-hardness | Implementada · pendiente auditoría funcional comparativa |
| 20 | Biodegradabilidad · relación DBO₅/DQO | #/tool/bod-cod | Implementada · pendiente auditoría funcional comparativa |
| 21 | Huella de gases · equivalencia CO₂e | #/tool/ghg-co2e | Implementada · pendiente auditoría funcional comparativa |
| 22 | Sensación térmica · índice de calor | #/tool/heat-index | Implementada · pendiente auditoría funcional comparativa |
| 23 | Temperatura de bulbo húmedo · Stull | #/tool/wet-bulb | Implementada · pendiente auditoría funcional comparativa |
| 24 | Temperatura de punto de rocío | #/tool/dew-point | Implementada · pendiente auditoría funcional comparativa |
| 25 | Porosidad total del suelo | #/tool/soil-porosity | Implementada · pendiente auditoría funcional comparativa |
| 26 | Humedad gravimétrica y volumétrica | #/tool/soil-moisture | Implementada · pendiente auditoría funcional comparativa |
| 27 | Carbono orgánico y materia orgánica | #/tool/soc-som | Implementada · pendiente auditoría funcional comparativa |
| 28 | Generación específica de residuos | #/tool/waste-generation | Implementada · pendiente auditoría funcional comparativa |
| 29 | Volumen compactado de residuos | #/tool/landfill-volume | Implementada · pendiente auditoría funcional comparativa |
| 30 | Tasa de aprovechamiento de residuos | #/tool/waste-diversion | Implementada · pendiente auditoría funcional comparativa |
| 31 | Coordenadas · grados decimales y DMS | #/tool/geo-dd-dms | Implementada · pendiente auditoría funcional comparativa |
| 32 | Distancia entre coordenadas | #/tool/geo-distance | Implementada · pendiente auditoría funcional comparativa |
| 33 | Rumbo inicial entre coordenadas | #/tool/geo-bearing | Implementada · pendiente auditoría funcional comparativa |
| 34 | Punto medio geográfico | #/tool/geo-midpoint | Implementada · pendiente auditoría funcional comparativa |
| 35 | Área y perímetro de un buffer circular | #/tool/geo-buffer | Implementada · pendiente auditoría funcional comparativa |
| 36 | Matriz IPERC 5×5 · probabilidad × severidad | #/tool/iperc-matrix | Implementada · pendiente auditoría funcional comparativa |
| 37 | Significancia ambiental ponderada | #/tool/impact-weighted | Implementada · pendiente auditoría funcional comparativa |
| 38 | Bioacústica · reconocimiento de vocalizaciones | #/tool/bioacoustics | Implementada · alcance público comprobado |
| 39 | Explorador de especies y taxonomía | #/tool/taxonomy | Implementada · alcance público comprobado |
| 40 | Panel de diversidad de comunidades | #/tool/diversity-community | Implementada · pendiente auditoría funcional comparativa |
| 41 | Diversidad de Shannon | #/tool/diversity-shannon | Implementada · pendiente auditoría funcional comparativa |
| 42 | Diversidad y dominancia de Simpson | #/tool/diversity-simpson | Implementada · pendiente auditoría funcional comparativa |
| 43 | Equidad de Pielou | #/tool/diversity-pielou | Implementada · pendiente auditoría funcional comparativa |
| 44 | Riqueza de Margalef | #/tool/richness-margalef | Implementada · pendiente auditoría funcional comparativa |
| 45 | Riqueza de Menhinick | #/tool/richness-menhinick | Implementada · pendiente auditoría funcional comparativa |
| 46 | Dominancia de Berger–Parker | #/tool/dominance-berger | Implementada · pendiente auditoría funcional comparativa |
| 47 | Abundancia relativa por taxón | #/tool/relative-abundance | Implementada · pendiente auditoría funcional comparativa |
| 48 | Riqueza y proporción EPT | #/tool/ept-index | Implementada · pendiente auditoría funcional comparativa |
| 49 | Evaluación biótica integrada | #/tool/biotic-workbench | Implementada · alcance público comprobado |
| 50 | Biblioteca de referencias bióticas | #/tool/biotic-library | Implementada · alcance público comprobado |
| 51 | SIGNAL2 · perfil OCP | #/tool/signal2 | Implementada · pendiente auditoría funcional comparativa |
| 52 | Índice biótico de Hilsenhoff | #/tool/hilsenhoff-fbi | Implementada · alcance público comprobado |
| 53 | Bioindicación · BMWP y ASPT | #/tool/bmwp-aspt | Implementada · alcance público comprobado |
| 54 | Similitud de Jaccard | #/tool/similarity-jaccard | Implementada · pendiente auditoría funcional comparativa |
| 55 | Similitud de Sørensen–Dice | #/tool/similarity-sorensen | Implementada · pendiente auditoría funcional comparativa |
| 56 | Estimación de riqueza · Chao1 | #/tool/richness-chao1 | Implementada · pendiente auditoría funcional comparativa |
| 57 | Disimilitud de Bray–Curtis | #/tool/dissimilarity-bray | Implementada · pendiente auditoría funcional comparativa |
| 58 | Diversidad beta de Whittaker | #/tool/diversity-whittaker | Implementada · pendiente auditoría funcional comparativa |
| 59 | Conversión entre carbono y CO₂ | #/tool/carbon-co2 | Implementada · pendiente auditoría funcional comparativa |
| 60 | Conversión de alcalinidad | #/tool/alkalinity | Implementada · pendiente auditoría funcional comparativa |
| 61 | Carga superficial de sedimentación | #/tool/overflow-rate | Implementada · pendiente auditoría funcional comparativa |
| 62 | Caudal pico · método racional | #/tool/rational-runoff | Implementada · pendiente auditoría funcional comparativa |
| 63 | Eficiencia de remoción | #/tool/removal-efficiency | Implementada · pendiente auditoría funcional comparativa |
| 64 | Energía a partir de irradiancia | #/tool/solar-energy | Implementada · pendiente auditoría funcional comparativa |
| 65 | Preparación de una dilución | #/tool/dilution | Implementada · pendiente auditoría funcional comparativa |
| 66 | Decaimiento de primer orden | #/tool/first-order-decay | Implementada · pendiente auditoría funcional comparativa |
| 67 | Conversor de longitud | #/tool/unit-converter/length | Integrada en el conversor central |
| 68 | Conversor de área | #/tool/unit-converter/area | Integrada en el conversor central |
| 69 | Conversor de volumen | #/tool/unit-converter/volume | Integrada en el conversor central |
| 70 | Conversor de masa | #/tool/unit-converter/mass | Integrada en el conversor central |
| 71 | Conversor de densidad | #/tool/unit-converter/density | Integrada en el conversor central |
| 72 | Conversor de presión | #/tool/unit-converter/pressure | Integrada en el conversor central |
| 73 | Conversor de temperatura | #/tool/unit-converter/temperature | Integrada en el conversor central |
| 74 | Conversor de caudal volumétrico | #/tool/unit-converter/flow | Integrada en el conversor central |
| 75 | Conversor de caudal másico | #/tool/unit-converter/massFlow | Integrada en el conversor central |
| 76 | Triángulo textural USDA interactivo | #/tool/soil-texture | Implementada · pendiente auditoría funcional comparativa |
| 77 | Relación de adsorción de sodio · SAR | #/tool/soil-sar | Implementada · pendiente auditoría funcional comparativa |
| 78 | Índice de aridez · precipitación y PET | #/tool/aridity-unep | Implementada · pendiente auditoría funcional comparativa |
| 79 | Índice de aridez de De Martonne | #/tool/aridity-demartonne | Implementada · pendiente auditoría funcional comparativa |
| 80 | Cambio de cobertura vegetal | #/tool/vegetation-change | Implementada · pendiente auditoría funcional comparativa |
| 81 | Pesos y consistencia · AHP | #/tool/mcda-ahp | Implementada · pendiente auditoría funcional comparativa |
| 82 | Prioridades de red · ANP | #/tool/mcda-anp | Implementada · pendiente auditoría funcional comparativa |
| 83 | Pesos triangulares · AHP difuso | #/tool/mcda-fuzzy-ahp | Implementada · alcance público comprobado |
| 84 | Combinación lineal ponderada · WLC | #/tool/mcda-wlc | Implementada · pendiente auditoría funcional comparativa |
| 85 | Priorización de alternativas · TOPSIS | #/tool/mcda-topsis | Implementada · pendiente auditoría funcional comparativa |
| 86 | Evaluación rápida de impactos · RIAM | #/tool/impact-riam | Implementada · pendiente auditoría funcional comparativa |
| 87 | Matriz de Leopold interactiva | #/tool/leopold-matrix | Implementada · pendiente auditoría funcional comparativa |
| 88 | Matriz de interacciones · escala −5 a +5 | #/tool/impact-iranian | Implementada · pendiente auditoría funcional comparativa |
| 89 | Lista ponderada de alertas ambientales | #/tool/impact-checklist | Implementada · pendiente auditoría funcional comparativa |
| 90 | Relaciones causa y efecto · DEMATEL | #/tool/mcda-dematel | Implementada · pendiente auditoría funcional comparativa |
| 91 | Influencia incierta · DEMATEL difuso | #/tool/mcda-fuzzy-dematel | Implementada · alcance público comprobado |
| 92 | Solución de compromiso · VIKOR | #/tool/mcda-vikor | Implementada · pendiente auditoría funcional comparativa |
| 93 | Alternativas con datos triangulares · TOPSIS difuso | #/tool/mcda-fuzzy-topsis | Implementada · alcance público comprobado |
| 94 | Relación de sobreclasificación · ELECTRE I | #/tool/mcda-electre | Implementada · pendiente auditoría funcional comparativa |
| 95 | Flujos de preferencia · PROMETHEE II | #/tool/mcda-promethee | Implementada · pendiente auditoría funcional comparativa |
| 96 | Ponderación escalonada · SWARA | #/tool/mcda-swara | Implementada · pendiente auditoría funcional comparativa |
| 97 | Ranking combinado · WASPAS | #/tool/mcda-waspas | Implementada · pendiente auditoría funcional comparativa |
| 98 | Agregación ordenada · OWA | #/tool/mcda-owa | Implementada · pendiente auditoría funcional comparativa |
| 99 | Laboratorio de estadística descriptiva | #/tool/analysis-statistics | Implementada · alcance público comprobado |
| 100 | Generador de análisis reproducible en R | #/tool/analysis-r-builder | Implementada · pendiente auditoría funcional comparativa |
| 101 | Series temporales · tendencia y anomalías | #/tool/analysis-timeseries | Implementada · pendiente auditoría funcional comparativa |
| 102 | Regresión lineal múltiple y residuos | #/tool/analysis-regression | Implementada · pendiente auditoría funcional comparativa |
| 103 | Componentes principales · PCA | #/tool/analysis-pca | Implementada · pendiente auditoría funcional comparativa |
| 104 | Control de calidad de datos · QA/QC | #/tool/analysis-qaqc | Implementada · pendiente auditoría funcional comparativa |
| 105 | Muestreo e incertidumbre · Monte Carlo | #/tool/analysis-sampling | Implementada · alcance público comprobado |
| 106 | Autocorrelación y vecindad espacial | #/tool/analysis-spatial | Implementada · alcance público comprobado |
| 107 | Comparador de límites ambientales | #/tool/analysis-standards | Implementada · pendiente auditoría funcional comparativa |
| 108 | Meteorología · de registros trihorarios a horarios | #/tool/meteo-hourly | Implementada · pendiente auditoría funcional comparativa |
| 109 | AMEF · modos de falla y riesgo residual | #/tool/risk-fmea | Implementada · alcance público comprobado |
| 110 | AMEF ambiental · aspectos y riesgo residual | #/tool/risk-efmea | Implementada · alcance público comprobado |
| 111 | Laboratorio de emisiones industriales y fuente puntual | #/tool/industrial-stack-lab | Implementada · pendiente auditoría funcional comparativa |
| 112 | Población · indicadores y escenarios de proyección | #/tool/population-lab | Implementada · pendiente auditoría funcional comparativa |
| 113 | Laboratorio espacial · proyectos y análisis vectorial | #/tool/spatial-workbench | Implementada · flujo vectorial verificado |
