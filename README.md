# Yupana · Environmental Intelligence

**Clasificación revisada:** agua y potabilización, aguas residuales y reúso, hidráulica, membranas y agua industrial tienen categorías propias. El [conversor central](http://127.0.0.1:8876/#/tool/unit-converter) reúne 24 magnitudes. Consulta [clasificación y criterios](docs/CLASIFICACION.md).

**Auditoría técnica.** Consulte el [inventario de herramientas](docs/INVENTARIO-TECNICO.md) y el [informe de hallazgos, correcciones y propuestas](docs/AUDITORIA-TECNICA.md).

**Rediseño en revisión.** Prueba la nueva interfaz en [MBR](http://127.0.0.1:8876/#/tool/mbr-process-membrane-sizing), [escorrentía SCS](http://127.0.0.1:8876/#/tool/curve-number-runoff) y [AQI diario EPA](http://127.0.0.1:8876/#/tool/epa-air-quality-index). El [plan de rediseño](docs/REDISENO-BANCO.md) documenta la regresión de resultados y las fases de publicación.

Suite de **339 herramientas técnicas ambientales en 22 categorías**, organizadas en cinco dominios: agua, suelo y residuos, aire/clima/energía, ecología y territorio, y decisión y personas. Versión **1.4.0**: cálculos en el navegador y motor acústico opcional en este equipo, sin cuentas ni CDN y sin enviar datos a servicios externos.

**Consolidación de unidades y trazabilidad.** Las nueve rutas `unit-*` (longitud, área, volumen, masa, densidad, presión, temperatura, caudal y caudal másico) se integraron en `#/tool/unit-converter/<magnitud>`; las direcciones anteriores siguen funcionando y redirigen al conversor central. Los informes incluyen huella FNV-1a de entradas y resultados, fecha y hora de cálculo y versión del modelo. El detalle de las correcciones normativas está en el [informe de consultoría](docs/AUDITORIA-CONSULTORIA-2026-11-11.md).

**Actualización 1.2:** las herramientas nuevas tienen interfaz propia en español, tablas editables, importación local, resultados en vivo, gráficos, informes y CSV. Incluye un visor vectorial con capas, selección y buffers. Consulta [el inventario y alcance de la ampliación](docs/AMPLIACION-CIENTIFICA.md). R genera y ejecuta scripts en el navegador con WebR local; las utilidades AERMOD preparan datos y parámetros, sin ejecutar el modelo. Las secciones siguientes describen la base original de 29 calculadoras; los módulos nuevos y las herramientas adicionales se documentan en la ampliación.

> **Local-first · 0 bytes enviados.** Todo el cálculo, el guardado y la exportación ocurren en tu equipo.

---

## 1. Cómo ejecutar

No requiere instalación, build ni dependencias externas.

### Opción A — abrir directamente

Abre `index.html` en un navegador moderno (Chrome, Edge, Firefox o Safari recientes). La app funciona desde `file://`, aunque algunas funciones del navegador (por ejemplo, descargas o portapapeles) pueden comportarse distinto según la configuración de seguridad.

### Opción B — servidor estático local

```bash
# desde la carpeta del proyecto
python -m http.server 8765
# luego abre http://127.0.0.1:8765/
```

También sirve cualquier host estático (Nginx, GitHub Pages, S3, Netlify, etc.). Solo hay que publicar los archivos tal como están.

### Requisitos

- Navegador con soporte para ES2017+, `localStorage`, `canvas` y `ResizeObserver`.
- No se necesita Node.js para ejecutar la app. Node solo se usa para las comprobaciones de sintaxis durante el desarrollo.

---

## 2. Estructura del proyecto

```
TOOLS FOR GOWL/
├─ index.html                  # shell de la app y orden de carga de scripts
├─ README.md
└─ assets/
   ├─ css/
   │  └─ app.css               # sistema de diseño, componentes y reglas de impresión
   └─ js/
      ├─ core.js               # registro GL, formato, estadística, gráficos, modal, informes,
      │                        # persistencia, favoritos y helpers de UI
      ├─ data.js               # datos de referencia (factores, límites, tablas)
      ├─ geo.js                # SHP/DBF, KML, GeoJSON: lectura, validación, reparación y render
      ├─ app.js                # router, navegación, páginas, ciclo de vida de herramientas, paleta
      └─ tools/
         ├─ helpers.js         # GL.ui: field, select, metric, toggle, fileZone, note, compbar, trow, dt
         ├─ safety-math.js     # funciones puras de dosis de ruido y multas SUNAFIL
         ├─ soil.js            # herramientas 1–3
         ├─ soil2.js           # herramientas 4–6
         ├─ soil3.js           # herramientas 7–9
         ├─ water.js           # herramientas 10–12
         ├─ water2.js          # herramientas 13–14
         ├─ air-energy.js      # herramientas 15–17
         ├─ air-energy2.js     # herramientas 18–19
         ├─ safety.js          # herramientas 20–23
         ├─ safety2.js         # herramientas 24–26
         └─ metrology.js       # herramientas 27–29
```

### Orden de carga

`index.html` carga en este orden:

1. `core.js` (define `window.GL`)
2. `data.js` (añade `GL.data`)
3. `tools/safety-math.js` (funciones puras de seguridad, sin interfaz)
4. `geo.js` (añade `GL.geo`)
5. `tools/helpers.js` (añade `GL.ui`)
6. los archivos de herramientas (cada uno llama a `GL.tool(...)`)
7. `app.js` (router y render)

El **orden de registro define el número visible** de cada herramienta (`def.n`). Si agregas una herramienta, colócala en el archivo y la posición que corresponda para conservar la numeración.

---

## 3. Las 29 herramientas

### Suelo & Carbono (9)

| # | id | Herramienta |
|---|---|---|
| 1 | `soc-stock` | Stock de carbono orgánico del suelo |
| 2 | `soc-benchmark` | Comparación de SOC con referencia sintética |
| 3 | `bulk-density` | Densidad aparente y corrección por textura |
| 4 | `sample-size` | Tamaño de muestra y potencia estadística |
| 5 | `boundary-validator` | Validación de límites y geometrías (SHP/KML/GeoJSON) |
| 6 | `shp-to-kml` | Conversión SHP/DBF → KML/GeoJSON |
| 7 | `soil-colour` | Color de suelo (Munsell) y nombre |
| 8 | `emissions` | Emisiones de GEI y factores de emisión |
| 9 | `yield-limiting` | Factores limitantes del rendimiento |

### Agua & Residuos (5)

| # | id | Herramienta |
|---|---|---|
| 10 | `ptar-activated-sludge` | PTAR · lodos activados |
| 11 | `stabilization-ponds` | Lagunas de estabilización |
| 12 | `water-balance-nrw` | Balance hídrico y agua no contabilizada |
| 13 | `landfill-sizing` | Relleno sanitario · capacidad y lixiviados |
| 14 | `landfill-biogas` | Biogás de relleno sanitario |

### Aire & Energía (5)

| # | id | Herramienta |
|---|---|---|
| 15 | `gaussian-plume` | Dispersión gaussiana de pluma |
| 16 | `air-quality-index` | ICA/AQI y comparación ECA/OMS |
| 17 | `energy-savings-ipmvp` | Verificación de ahorros (IPMVP C) |
| 18 | `solar-pv` | Solar fotovoltaica · producción y retorno |
| 19 | `wind-weibull` | Recurso eólico · Weibull y AEP |

### Seguridad & Higiene (7)

| # | id | Herramienta |
|---|---|---|
| 20 | `risk-conesa` | Evaluación de riesgo · método Conesa |
| 21 | `iperc-matrix` | Matriz IPERC 5×5 |
| 22 | `fall-clearance` | Protección contra caídas · holgura |
| 23 | `sst-indicators` | Indicadores SST · TRIR/LTIR y Poisson |
| 24 | `noise-dose` | Dosis de ruido · OSHA/NIOSH |
| 25 | `environmental-noise` | Ruido ambiental · ECA |
| 26 | `sunafil-fines` | Multas SUNAFIL · estimación referencial |

### Metrología & Cumplimiento (3)

| # | id | Herramienta |
|---|---|---|
| 27 | `measurement-uncertainty` | Incertidumbre GUM/EA-4/02 y regla de decisión |
| 28 | `holding-time` | Validez de muestras · tiempo de conservación |
| 29 | `containment-volume` | Contención secundaria · volumen y área |

---

## 4. Contrato de una herramienta

Cada herramienta es un objeto registrado con `GL.tool(def)`:

```js
GL.tool({
  id: 'mi-herramienta',        // único, usado en la ruta #/tool/mi-herramienta
  suite: 'water',              // soil | water | air | safety | metrology
  storeKeys: ['mi.rows'],      // claves de GL.store que "Restablecer" debe borrar
  title: 'Título visible',
  desc: 'Descripción para la tarjeta y el buscador.',
  tags: ['Etiqueta', 'Otra'],
  keywords: 'palabras clave para la paleta de comandos',

  html() { return `...markup...`; },      // se inyecta en #toolBody
  mount(root) { /* listeners, cálculo inicial, gráficos */ },

  report() { return this._report; },      // informe imprimible
  csv() { if (this._csv) GL.csvDownload('archivo.csv', this._csv); }
});
```

### Ciclo de vida

1. `app.js` navega a `#/tool/:id`.
2. Renderiza el encabezado y el contenedor `#toolBody`.
3. Inyecta `html()`.
4. Llama a `GL.restoreInputs(id, root)` para restaurar campos guardados.
5. Llama a `mount(root)`.
6. El autosave escucha `input` y `change` dentro de `#toolBody` y guarda los elementos con `id` en `localStorage`.

> Las entradas de tabla usan atributos `data-*` (no `id`), por lo que quedan fuera del autosave genérico. Si una tabla debe persistir, guárdala explícitamente con `GL.store.set(...)` y recupérala con `GL.store.get(...)`.

### Helpers principales

| Helper | Uso |
|---|---|
| `GL.ui.field(id, label, unit, value, opts)` | Campo numérico de texto |
| `GL.ui.select(id, label, options, value, opts)` | Selector |
| `GL.ui.metric(id, label, unit, hero)` | Tarjeta de resultado |
| `GL.ui.toggle`, `fileZone`, `note`, `compbar`, `trow`, `dt` | Componentes de interfaz |
| `GL.num(id, def)` | Lectura numérica tolerante (coma decimal, `%`, espacios) |
| `GL.fmt(v, d)` / `GL.fmtSmart(v)` / `GL.signed(v, d)` | Formato es-PE |
| `GL.out(id, html)` | Escribe una métrica |
| `GL.setVerdict(id, tone, title, text)` | Bloque de veredicto (`ok`/`warn`/`bad`/`info`) |
| `GL.bindCalc(root, ids, fn)` | Conecta varios inputs a una función con debounce y ejecución inicial |
| `GL.chart(canvas, cfg)` | Gráfico canvas (línea, barras, dispersión, reglas) |
| `GL.store.get/set/del` | Persistencia JSON en `localStorage` |
| `GL.openReport(report)` | Modal de informe imprimible / descargable |
| `GL.csvDownload(name, rows, headers)` | Exportación CSV con BOM UTF-8 |
| `GL.toast(msg, tone)` | Notificación |
| `GL.modal`, `GL.confirm` | Modales |

### Estadística disponible (`GL.stat`)

`mean`, `sd`, `cv`, `median`, `quantile`, `linreg`, `pearson`, `ols`, `t95`, `tCdf`, `tTwoSidedP`, `normalCdf`, `invNormal`, `chi2q`, `poissonCI`, `poissonP`, `erf`.

### Gráficos

`GL.chart` dibuja en `<canvas>` sin librerías. Acepta:

```js
GL.chart(canvas, {
  type: 'line' | 'bar',
  series: [{ name, data: [[x, y], ...], color, fill, points, type: 'scatter' }],
  x: { label, min, max, fmt },
  y: { label, min, max, zero, fmt },
  rules: [{ y, label, color }],
  bands: [{ from, to, color, label }]
});
```

---

## 5. Cómo agregar una herramienta

1. Crea o reutiliza un archivo en `assets/js/tools/`.
2. Usa el patrón de módulo IIFE y toma las utilidades:

```js
(function () {
  'use strict';
  const GL = window.GL, D = GL.data, num = GL.num, fmt = GL.fmt, esc = GL.escape, U = GL.ui;

  const T = {
    id: 'nueva-herramienta',
    suite: 'water',
    title: 'Nueva herramienta',
    desc: 'Qué calcula y para qué sirve.',
    tags: ['Agua'],
    keywords: 'agua calculo ejemplo',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Entradas</div>
            <div class="grid-3">
              ${U.field('nhQ', 'Caudal', 'm³/d', '1000')}
            </div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado</div>
            <div class="metrics">${U.metric('nhOut', 'Resultado', 'm³/año', true)}</div>
            <div id="nhVerdict" class="verdict info"></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      function update() {
        const q = Math.max(0, num('nhQ', 1000));
        const out = q * 365;
        GL.out('nhOut', fmt(out, 0));
        GL.setVerdict('nhVerdict', 'info', 'Cálculo ejecutado', `Resultado: ${fmt(out, 0)} m³/año.`);
        this._report = { title: 'Nueva herramienta', results: [['Resultado', fmt(out, 0), 'm³/año']], notes: ['Verifique los supuestos.'] };
        this._csv = [{ caudal_m3_d: q, resultado_m3_año: +out.toFixed(1) }];
      }
      GL.bindCalc(root, ['nhQ'], update.bind(this));
      update.call(this);
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_nueva_herramienta.csv', this._csv); }
  };
  GL.tool(T);
})();
```

3. Agrega el `<script>` en `index.html` antes de `app.js`.
4. Verifica la sintaxis: `node --check assets/js/tools/nuevo.js`.
5. Abre la app, navega a `#/tool/nueva-herramienta` y revisa la consola.

### Convenciones

- UI en **español (Perú)**; unidades y formato con `GL.fmt` (coma decimal).
- Cada herramienta incluye **descargo, supuestos y límites** en `report().notes`.
- Todo resultado debe poder exportarse a **CSV** y a **informe imprimible**.
- No uses cadenas no numéricas como valor por defecto de un campo numérico.
- Evita dependencias externas y llamadas de red.
- Para tablas editables, persiste con `GL.store` y usa delegación de eventos. Declara las claves usadas en `storeKeys` para que el botón **Restablecer** las elimine junto con los campos autosave.

---

## 6. Datos de referencia e IP

Este proyecto tiene interfaz e integración propias y usa la marca original **Yupana · Environmental Intelligence**. La ampliación incorpora bibliotecas locales WebR, Turf y Proj4js, el motor BirdNET y datos taxonómicos con atribuciones y licencias conservadas. Consulta assets/vendor/README.md, assets/data/ATTRIBUTION.md y docs/BIOACUSTICA.md.

- Las **tablas normativas y factores** (GWP, ECA, AQI, Briggs, SUNAFIL, tiempos de conservación, etc.) se incluyen como **referencias editables**. Provienen de fuentes públicas o de valores típicos de ingeniería; **verifique siempre la vigencia, la edición y la jurisdicción** antes de usarlas.
- Los **datasets de demostración** (por ejemplo, el benchmark sintético de SOC) son **generados localmente** con semillas reproducibles y sirven solo para que las herramientas funcionen sin conexión. No son datos reales ni de terceros.
- Los modelos son **de cribado**. No reemplazan software regulatorio validado (AERMOD, CALPUFF, PVsyst, SAM, WAsP), laboratorios acreditados, calibraciones trazables ni la firma de un profesional competente.
- Las referencias a normas (D.S. 085-2003-PCM, D.S. 003-2017-MINAM, D.S. 008-2020-TR, IPMVP, GUM/EA-4/02, OSHA/NIOSH, etc.) se usan con fines técnicos y educativos. Las tablas incluidas son **referenciales y editables**.
- No se incluyen logos, textos promocionales ni bases de datos de productos comerciales.

Si reemplazas una tabla por la de tu jurisdicción, hazlo en `assets/js/data.js` o directamente en la herramienta, y documenta la fuente y la fecha de consulta en el informe.

---

## 7. Privacidad y persistencia

- **No hay backend, analytics, cookies de terceros ni solicitudes de red.** La app no envía datos.
- Los campos con `id` se guardan en `localStorage` bajo la clave `yupana.v1.in.<toolId>`.
- Las tablas editables se guardan bajo sus propias claves (`yupana.v1.cs.rows`, `yupana.v1.ip.rows`, etc.).
- Los favoritos se guardan en `yupana.v1.favs`.
- El tema (claro/oscuro) se guarda en `localStorage`.
- Para borrar todo: usa las herramientas de desarrollo del navegador o elimina las claves que empiezan con `yupana.v1.`.

> Si usas un equipo compartido, recuerda que `localStorage` es local al navegador y al perfil, pero no está cifrado.

---

## 8. Pruebas y verificación

### Sintaxis

```bash
Get-ChildItem -Recurse -Filter *.js assets | ForEach-Object { node --check $_.FullName }
```

### Prueba de rutas en el navegador

Con la app servida en `http://127.0.0.1:8765/`:

```js
GL.tools.length            // 339
GL.tools.map(t => t.id)    // lista de ids
GL.toolsBySuite('soil').length      // 17
GL.toolsBySuite('water').length     // 55
GL.toolsBySuite('air').length       // 23
GL.toolsBySuite('safety').length    // 6
GL.toolsBySuite('metrology').length // 7
```

Recorre cada ruta `#/tool/<id>` y confirma:

- que `#toolBody` tenga contenido;
- que no haya errores en la consola;
- que el informe (`report()`) y el CSV (`csv()`) funcionen;
- que el informe muestre huella, fecha de cálculo y versión del modelo;
- que no haya desbordamiento horizontal.

> Tras editar archivos, fuerza una recarga completa (`Ctrl+F5`) o usa una URL con parámetro (`?v=2`) para evitar que el navegador reutilice scripts en caché.

### Pruebas automatizadas

```bash
node tests/lab-models.cjs        # 301 modelos declarativos y tablas normativas
node tests/result-regression.cjs # huellas de resultados base y escenarios piloto
node tests/classification.cjs    # 339 herramientas y 22 categorías
node tests/brand.cjs             # marca Yupana y ausencia de catálogos de origen
node tests/units.cjs             # 24 magnitudes y conversiones de ida/vuelta
node tests/spatial-ops.cjs       # operaciones vectoriales
node tests/biotic.cjs            # índices bióticos
```

Las pruebas de navegador (`tests/lab-browser.cjs`, `tests/audit-corrections.cjs`, `tests/audit-inventory.cjs` y `tests/calculator-pilot.cjs`) requieren Playwright y un servidor local. Defina `GREENOWL_PLAYWRIGHT` si el paquete no está en la ruta de Node.

### Barrido de rutas sin dependencias

`tests/routes-cdp.cjs` recorre las 339 herramientas con Chrome o Edge headless y el protocolo CDP, sin instalar Playwright. Comprueba que cada ruta monte contenido, no genere errores de consola y no produzca desbordamiento horizontal; además verifica que las nueve fichas `unit-*` redirijan al conversor con la magnitud correcta.

```bash
node tests/routes-cdp.cjs          # las 339 rutas
node tests/routes-cdp.cjs 0 40     # desde la ruta 0, cuarenta rutas
```

Variables: `CHROME` (ruta del ejecutable), `GREENOWL_TEST_URL` y `GREENOWL_CDP_PORT`. Requiere la suite servida en `http://127.0.0.1:8876/`.

### Comprobaciones ya realizadas

- `node --check` en los 84 archivos JS propios de `assets` (sin `vendor`), sin errores.
- `node tests/lab-models.cjs`: 301 modelos y regresión de SUNAFIL, ECA, IPCC, dosis de ruido y funciones puras de seguridad.
- `node tests/classification.cjs`, `node tests/brand.cjs`, `node tests/units.cjs`, `node tests/result-regression.cjs`, `node tests/spatial-ops.cjs` y `node tests/biotic.cjs` sin fallos.
- Barrido completo de `node tests/routes-cdp.cjs`: 339/339 rutas con contenido, sin errores de consola y sin desbordamiento horizontal.
- Barrido de humo con Chrome headless en dosis de ruido, SUNAFIL, solar FV, pluma gaussiana, cribado SEIA y rutas `unit-*`, sin errores de consola.
- Informes y CSV de las herramientas nuevas verificados; los informes incluyen huella FNV-1a, fecha y versión del modelo.
- **Restablecer** verificado de extremo a extremo: limpia los campos autosave (`in.<id>`), las tablas declaradas en `storeKeys` y vuelve a los valores de ejemplo.
- **Informe sin datos**: las herramientas que dependen de un archivo muestran un aviso en lugar de fallar al pulsar «Informe».

---

## 9. Limitaciones y descargo

Esta suite es una herramienta de apoyo técnico y educativo. Los resultados dependen de la calidad de los datos ingresados y de los supuestos de cada modelo. **No constituye certificación, dictamen legal, auditoría, calibración ni reemplazo del juicio de un profesional competente.**

Antes de usar un resultado para permisos, licitaciones, cumplimiento normativo, seguridad o inversión:

- verifica la vigencia de normas, límites y factores;
- valida los datos de entrada y la representatividad del muestreo;
- documenta supuestos, fuentes y fecha de consulta;
- revisa el resultado con un especialista y, cuando corresponda, con la autoridad competente.

---

## 10. Créditos y versión

- **Marca:** Yupana · Environmental Intelligence.
- **Versión de la app:** 1.4.0.
- **Versión de datos de referencia:** 2026.1.
- **Stack:** HTML, CSS y JavaScript clásico. Sin bundler, sin frameworks y sin CDN.

Hecho para funcionar sin conexión, con datos que no salen de tu equipo.
