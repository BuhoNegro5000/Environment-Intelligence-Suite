/* ==========================================================================
   Green Owl Labs · Suite Suelo & Carbono (parte 2)
   04 Tamaño de muestra · 05 Validador de límites · 06 SHP → KML
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL, D = GL.data, num = GL.num, fmt = GL.fmt, esc = GL.escape;

  const field = (id, label, unit, val, opts) => {
    opts = opts || {};
    return `<label class="field"><span>${label}${unit ? ` <em>${unit}</em>` : ''}</span>
      <input id="${id}" type="text" inputmode="decimal" value="${val}"></label>`;
  };
  function geographicInput(features,kind,declared) {
    let converted=features;
    if(kind.startsWith('SHP')){
      const crs=declared.trim().toUpperCase();
      if(!/^EPSG:(?:4326|32[67](?:0[1-9]|[1-5][0-9]|60))$/.test(crs)){
        throw new Error('Declara el EPSG del SHP antes de cargarlo. Se admite WGS 84 (4326) y UTM WGS 84 (326xx/327xx).');
      }
      if(crs!=='EPSG:4326')converted=GL.spatialOps.reproject(features,crs);
    }
    function check(coordinates){
      if(!Array.isArray(coordinates))throw new Error('Geometría sin coordenadas válidas.');
      if(coordinates.length===0)return;
      if(Array.isArray(coordinates[0])){coordinates.forEach(check);return;}
      const [lon,lat]=coordinates;
      if(!Number.isFinite(lon)||!Number.isFinite(lat)||Math.abs(lon)>180||Math.abs(lat)>90){
        throw new Error('Coordenadas fuera de longitud ±180° o latitud ±90°. Verifica el CRS de origen.');
      }
    }
    converted.forEach(f=>check(f.geometry?.coordinates));
    return converted;
  }

  const metric = (id, label, unit, hero) => `<div class="metric ${hero ? 'hero' : ''}"><span>${label}</span><strong id="${id}">—</strong><small>${unit || ''}</small></div>`;
  const fileZone = (id, title, sub) => `<div class="dropzone" id="${id}">
      <div class="dz-ico">▤</div><b>${title}</b><small>${sub}</small>
      <input type="file" id="${id}File" accept=".shp,.dbf,.kml,.geojson,.json,.csv" hidden multiple>
    </div>`;

  /* ======================================================================
     04 · TAMAÑO DE MUESTRA
     ====================================================================== */
  const T4 = {
    id: 'sample-size',
    suite: 'soil',
    storeKeys: ['ss.strata'],
    title: 'Tamaño de muestra y diseño estratificado',
    desc: 'Estime cuántas muestras necesita para un error objetivo, asigne el esfuerzo por estrato con criterio de Neyman y obtenga la separación de la grilla de campo.',
    tags: ['Muestreo', 'Neyman', 'Carbono'],
    keywords: 'tamano muestra muestreo estratificado neyman grilla error confianza cv parcelas',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Diseño de muestreo</h2><p>El CV debe venir de un piloto o de sitios comparables, no de una suposición.</p></div><span class="mono" id="ssCount">3 estratos</span></div>
            <div class="grid-3">
              ${field('ssError', 'Error relativo objetivo', '%', '10')}
              ${field('ssCV', 'CV esperado (global)', '%', '28')}
              <label class="field"><span>Nivel de confianza</span><select id="ssConf"><option value="90">90 %</option><option value="95" selected>95 %</option><option value="99">99 %</option></select></label>
            </div>
            <div class="subhead">Estratos</div>
            <div class="table-wrap"><table><thead><tr><th>Estrato</th><th class="num">Área ha</th><th class="num">CV %</th><th class="num">Costo/muestra</th><th></th></tr></thead><tbody id="ssStrata"></tbody></table></div>
            <div class="btn-row"><button class="btn sm" id="ssAdd" type="button">+ Estrato</button><button class="btn sm" id="ssReset" type="button">Valores típicos</button></div>
            <details class="acc"><summary>Supuestos y corrección finita</summary><div class="acc-body">
              <p>El cálculo usa muestreo aleatorio simple dentro de cada estrato: n₀ = (t × CV / E)². La asignación entre estratos es proporcional a área × CV (Neyman), con un mínimo de 3 muestras por estrato para poder estimar varianza.</p>
              <p>La separación de grilla es una aproximación cuadrada: √(área × 10 000 / n). En suelos con autocorrelación espacial, la grilla sistemática suele ser más eficiente que el azar simple.</p>
              <p>Si conoce el número finito de unidades muestrales (N), aplique corrección: n = n₀ / (1 + (n₀ − 1)/N).</p>
            </div></details>
          </section>
          <section class="panel">
            <div class="panel-title">Plan por estrato <span class="tag">CAMPO</span></div>
            <div class="table-wrap"><table><thead><tr><th>Estrato</th><th class="num">Área ha</th><th class="num">CV %</th><th class="num">n</th><th class="num">Sep. grilla m</th><th class="num">Costo</th></tr></thead><tbody id="ssPlan"></tbody></table></div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado</div>
            <div class="metrics">
              ${metric('ssTotal', 'Muestras totales', 'unidades', true)}
              ${metric('ssBase', 'n₀ sin estratificar', 'unidades')}
              ${metric('ssSpacing', 'Separación media', 'm')}
              ${metric('ssDensity', 'Intensidad', 'muestras / 100 ha')}
              ${metric('ssCost', 'Costo estimado', 'unidades monetarias')}
              ${metric('ssAchieved', 'Error con el plan', '%')}
            </div>
            <div class="chart-wrap" style="margin-top:16px"><canvas id="ssChart"></canvas></div>
            <div class="chart-wrap short"><canvas id="ssCurve"></canvas></div>
            <div id="ssVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Cuándo revisar el diseño</div>
            <div class="note warn"><b>No ignore la accesibilidad.</b> El número estadístico es un piso: sume muestras de respaldo en zonas de exclusión, bordes y áreas con historial de disturbio.</div>
            <div class="note" style="margin-top:8px"><b>Error vs potencia.</b> Para detectar un cambio de stock entre campañas necesita el doble de muestras que para estimar una media si la diferencia esperada es del mismo orden que el error.</div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T4;
      const DEF = [
        { name: 'Ladera alta', area: 40, cv: 32, cost: 45 },
        { name: 'Planicie', area: 85, cv: 22, cost: 35 },
        { name: 'Zona baja', area: 25, cv: 38, cost: 50 }
      ];
      let strata = GL.store.get('ss.strata', DEF);
      if (!Array.isArray(strata) || !strata.length) strata = DEF;

      function render() {
        root.querySelector('#ssStrata').innerHTML = strata.map((s, i) => `<tr>
          <td><input class="tbl-input" style="width:130px;text-align:left" data-i="${i}" data-k="name" value="${esc(s.name)}"></td>
          <td><input class="tbl-input" data-i="${i}" data-k="area" value="${s.area}"></td>
          <td><input class="tbl-input" data-i="${i}" data-k="cv" value="${s.cv}"></td>
          <td><input class="tbl-input" data-i="${i}" data-k="cost" value="${s.cost}"></td>
          <td><button class="btn sm" data-del="${i}" ${strata.length <= 1 ? 'disabled' : ''}>✕</button></td>
        </tr>`).join('');
        root.querySelector('#ssCount').textContent = strata.length + (strata.length === 1 ? ' estrato' : ' estratos');
      }
      function read() {
        const out = [];
        root.querySelectorAll('#ssStrata input').forEach(inp => {
          const i = +inp.dataset.i, k = inp.dataset.k;
          if (!out[i]) out[i] = Object.assign({}, strata[i]);
          out[i][k] = k === 'name' ? inp.value : num(inp, 0);
        });
        return out.filter(Boolean);
      }
      root.addEventListener('input', e => {
        if (e.target.closest('#ssStrata')) { strata = read(); GL.store.set('ss.strata', strata); }
      });
      root.addEventListener('click', e => {
        const d = e.target.closest('[data-del]');
        if (d) { strata = read(); strata.splice(+d.dataset.del, 1); if (!strata.length) strata = DEF.slice(0, 1); GL.store.set('ss.strata', strata); render(); update(); }
      });
      root.querySelector('#ssAdd').addEventListener('click', () => {
        strata = read(); strata.push({ name: 'Estrato ' + (strata.length + 1), area: 20, cv: 25, cost: 40 });
        GL.store.set('ss.strata', strata); render(); update();
      });
      root.querySelector('#ssReset').addEventListener('click', () => {
        strata = DEF.map(s => Object.assign({}, s)); GL.store.set('ss.strata', strata); render(); update();
      });

      function calcN(cv, E, conf) {
        const t = conf === 90 ? 1.645 : conf === 99 ? 2.576 : 1.96;
        return Math.pow(t * cv / E, 2);
      }

      function update() {
        const E = Math.max(0.5, num('ssError', 10));
        const cvGlobal = Math.max(1, num('ssCV', 28));
        const conf = +root.querySelector('#ssConf').value;
        const n0 = calcN(cvGlobal, E, conf);
        let totalArea = 0, wsum = 0;
        strata.forEach(s => { totalArea += Math.max(0, s.area); wsum += Math.max(0, s.area) * Math.max(1, s.cv); });
        const est = strata.map(s => {
          const w = Math.max(0, s.area) * Math.max(1, s.cv) / (wsum || 1);
          const n = Math.max(3, Math.round(n0 * w));
          const spacing = n ? Math.sqrt(Math.max(0, s.area) * 10000 / n) : 0;
          return { s, w, n, spacing, cost: n * Math.max(0, s.cost) };
        });
        // rebalance to total after min per stratum
        const total = est.reduce((a, b) => a + b.n, 0);
        const totalCost = est.reduce((a, b) => a + b.cost, 0);
        const spacingMean = total ? Math.sqrt(totalArea * 10000 / total) : 0;
        const achieved = Math.sqrt(Math.pow((conf === 90 ? 1.645 : conf === 99 ? 2.576 : 1.96) * cvGlobal, 2) / total);

        GL.out('ssTotal', fmt(total, 0));
        GL.out('ssBase', fmt(Math.ceil(n0), 0));
        GL.out('ssSpacing', fmt(spacingMean, 0));
        GL.out('ssDensity', fmt(totalArea ? total / totalArea * 100 : 0, 1));
        GL.out('ssCost', fmt(totalCost, 0));
        GL.out('ssAchieved', fmt(achieved, 1));

        root.querySelector('#ssPlan').innerHTML = est.map(e => `<tr>
          <td class="name">${esc(e.s.name)}</td><td class="num">${fmt(e.s.area, 0)}</td><td class="num">${fmt(e.s.cv, 0)}</td>
          <td class="num"><b>${e.n}</b></td><td class="num">${fmt(e.spacing, 0)}</td><td class="num">${fmt(e.cost, 0)}</td></tr>`).join('') +
          `<tr><td class="name"><b>Total</b></td><td class="num"><b>${fmt(totalArea, 0)}</b></td><td class="num">—</td><td class="num"><b>${total}</b></td><td class="num"><b>${fmt(spacingMean, 0)}</b></td><td class="num"><b>${fmt(totalCost, 0)}</b></td></tr>`;

        GL.chart(root.querySelector('#ssChart'), {
          type: 'bar',
          series: [{ name: 'n', data: est.map(e => [e.s.name, e.n]), color: '#66C7E8' }],
          y: { label: 'muestras', zero: true, min: 0 }
        });
        const curve = [];
        for (let e = 2; e <= 30; e += 1) curve.push([e, Math.ceil(calcN(cvGlobal, e, conf))]);
        GL.chart(root.querySelector('#ssCurve'), {
          series: [{ name: 'n', data: curve, color: '#5FE3A1', fill: true, points: false }],
          x: { label: 'Error relativo objetivo (%)' }, y: { label: 'n', min: 0, zero: true, max: Math.max(10, n0 * 2.5) },
          rules: [{ y: total, label: 'plan actual', color: '#F2B45A' }]
        });

        const tone = E <= 10 ? 'ok' : E <= 15 ? 'info' : 'warn';
        GL.setVerdict('ssVerdict', tone, `${total} muestras para ±${fmt(E, 1)} % (${conf} %)`,
          `${totalArea ? fmt(total / totalArea * 100, 1) : 0} muestras por 100 ha · separación media ${fmt(spacingMean, 0)} m · CV de diseño ${fmt(cvGlobal, 0)} %. El plan logra un error de ±${fmt(achieved, 1)} % si el CV se mantiene.`);

        T._report = {
          title: 'Tamaño de muestra y asignación estratificada',
          subtitle: `Objetivo ±${fmt(E, 1)} % · confianza ${conf} %`,
          inputs: [['Error relativo', fmt(E, 1) + ' %'], ['CV global', fmt(cvGlobal, 1) + ' %'], ['Confianza', conf + ' %'], ['Estratos', strata.map(s => `${s.name}: ${fmt(s.area, 0)} ha, CV ${fmt(s.cv, 0)} %`).join(' | ')]],
          results: [['Muestras totales', fmt(total, 0), 'unidades'], ['n₀ simple', fmt(Math.ceil(n0), 0), 'unidades'], ['Separación media', fmt(spacingMean, 0), 'm'], ['Intensidad', fmt(totalArea ? total / totalArea * 100 : 0, 1), 'muestras/100 ha'], ['Costo', fmt(totalCost, 0), 'unidades'], ['Error logrado', fmt(achieved, 1), '%']],
          extra: `<table><thead><tr><th>Estrato</th><th>Área (ha)</th><th>CV (%)</th><th>n</th><th>Grilla (m)</th><th>Costo</th></tr></thead><tbody>${est.map(e => `<tr><td>${esc(e.s.name)}</td><td>${fmt(e.s.area, 0)}</td><td>${fmt(e.s.cv, 0)}</td><td>${e.n}</td><td>${fmt(e.spacing, 0)}</td><td>${fmt(e.cost, 0)}</td></tr>`).join('')}</tbody></table>`,
          notes: [
            'El CV debe provenir de un piloto representativo. Un CV subestimado produce un plan que no alcanza el error declarado.',
            'La asignación de Neyman minimiza la varianza para un costo fijo cuando el costo por muestra es similar entre estratos.',
            'El mínimo de 3 muestras por estrato es una regla práctica para estimar varianza; con estratos muy pequeños puede ser insuficiente.',
            'La separación de grilla asume cobertura uniforme; no considera barreras físicas, propiedades privadas ni zonas de exclusión.'
          ],
          method: '<p>n₀ = (t × CV / E)². Asignación: nᵢ = n₀ × (Aᵢ·CVᵢ)/Σ(A·CV), con mínimo 3. Separación = √(A × 10 000 / n).</p>'
        };
        T._csv = est.map(e => ({ estrato: e.s.name, area_ha: e.s.area, cv_pct: e.s.cv, n: e.n, separacion_m: +e.spacing.toFixed(1), costo: +e.cost.toFixed(0) }));
      }

      root.querySelector('#ssConf').addEventListener('change', update);
      render();
      GL.bindCalc(root, ['ssError', 'ssCV'], update);
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_tamano_muestra.csv', this._csv); }
  };
  GL.tool(T4);

  /* ======================================================================
     05 · VALIDADOR DE LÍMITES
     ====================================================================== */
  const SAMPLE = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Parcela norte' }, geometry: { type: 'Polygon', coordinates: [[[-76.10, -12.10], [-76.00, -12.10], [-76.00, -12.02], [-76.04, -12.05], [-76.00, -12.02], [-76.10, -12.02]]] } },
      { type: 'Feature', properties: { name: 'Parcela sur' }, geometry: { type: 'Polygon', coordinates: [[[-76.10, -12.20], [-76.00, -12.20], [-76.00, -12.14], [-76.04, -12.16], [-76.10, -12.14], [-76.10, -12.20]]] } }
    ]
  };

  const T5 = {
    id: 'boundary-validator',
    suite: 'soil',
    title: 'Validador de límites y geometrías',
    desc: 'Revise SHP, KML o GeoJSON antes de presentarlos: anillos abiertos, auto-intersecciones, vértices duplicados, huecos fuera de lugar, orientación y área real. Repare y exporte.',
    tags: ['SHP', 'KML', 'GeoJSON', 'Geometría'],
    keywords: 'boundary limite poligono shp kml geojson autointerseccion anillo vertices area sig',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Archivo de límites</h2><p>Para SHP seleccione el .shp y su .dbf juntos.</p></div></div>
            ${fileZone('bv', 'Arrastre o seleccione .shp + .dbf, .kml o .geojson', 'El archivo se procesa en memoria y no se sube a ningún servidor.')}
            ${field('bvCRS','CRS del SHP (obligatorio para SHP, p. ej. EPSG:32718)','','')}
            <div class="subhead" style="margin-top:14px">o pegue el contenido</div>
            <textarea id="bvPaste" placeholder='Pegue GeoJSON o KML aquí…' style="min-height:110px"></textarea>
            <div class="btn-row">
              <button class="btn sm" id="bvParse">Validar texto</button>
              <button class="btn sm" id="bvExample">Cargar ejemplo con errores</button>
              <button class="btn sm" id="bvExportKml">↓ KML limpio</button>
              <button class="btn sm" id="bvExportGeo">↓ GeoJSON</button>
            </div>
            <div class="note" style="margin-top:10px">La validación cubre geometría vectorial. No verifica exactitud posicional, datum, superposición con predios de terceros ni restricciones legales del área.</div>
          </section>
          <section class="panel">
            <div class="panel-title">Hallazgos <span class="badge-count" id="bvIssueCount">0</span></div>
            <div id="bvIssues" class="table-wrap" style="max-height:360px"><div class="empty" style="border:0">Cargue un archivo para comenzar.</div></div>
            <div class="btn-row">
              <button class="btn primary" id="bvFix">Reparar geometría</button>
              <button class="btn" id="bvClear">Limpiar</button>
            </div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resumen <span class="tag" id="bvKind">SIN ARCHIVO</span></div>
            <div class="metrics three">
              ${metric('bvFeatures', 'Entidades', '', true)}
              ${metric('bvVerts', 'Vértices', '')}
              ${metric('bvArea', 'Área', 'ha')}
              ${metric('bvErrors', 'Errores', '')}
              ${metric('bvWarns', 'Advertencias', '')}
              ${metric('bvRepairs', 'Reparaciones', '')}
            </div>
            <div class="chart-wrap tall" style="margin-top:14px"><canvas id="bvMap"></canvas></div>
            <div id="bvVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Entidades</div>
            <div class="table-wrap" style="max-height:240px"><table><thead><tr><th>Nombre</th><th>Tipo</th><th class="num">Vértices</th><th class="num">Área ha</th><th class="num">Hallazgos</th></tr></thead><tbody id="bvTable"></tbody></table></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T5;
      let features = [], kind = '—', validation = null, repairs = 0;
      const canvas = root.querySelector('#bvMap');

      function paint() {
        GL.geo.render(canvas, features);
      }
      const onResize = GL.debounce(() => { if (document.body.contains(canvas)) paint(); }, 150);
      window.addEventListener('resize', onResize);

      function featureVerts(f) {
        let n = 0;
        const walk = c => { if (typeof c[0] === 'number') n++; else c.forEach(walk); };
        if (f.geometry) walk(f.geometry.coordinates);
        return n;
      }
      function featureArea(f) {
        const g = f.geometry;
        if (!g) return 0;
        if (g.type === 'Polygon') return g.coordinates.reduce((s, r, i) => s + (i ? -1 : 1) * GL.geo.areaM2(r), 0);
        if (g.type === 'MultiPolygon') return g.coordinates.reduce((s, p) => s + p.reduce((ss, r, i) => ss + (i ? -1 : 1) * GL.geo.areaM2(r), 0), 0);
        return 0;
      }

      function validate() {
        if (!features.length) return;
        validation = GL.geo.validate(features);
        const st = validation.stats;
        const errors = validation.issues.filter(i => i.sev === 'error').length;
        const warns = validation.issues.filter(i => i.sev === 'warn').length;
        GL.out('bvFeatures', fmt(features.length, 0));
        GL.out('bvVerts', fmt(st.vertices, 0));
        GL.out('bvArea', fmt(st.area / 10000, 2));
        GL.out('bvErrors', fmt(errors, 0));
        GL.out('bvWarns', fmt(warns, 0));
        GL.out('bvRepairs', fmt(repairs, 0));
        root.querySelector('#bvKind').textContent = kind.toUpperCase();
        root.querySelector('#bvIssueCount').textContent = validation.issues.length;

        root.querySelector('#bvIssues').innerHTML = validation.issues.length ? validation.issues.slice(0, 80).map(i => `
          <div class="issue">
            <span class="sev ${i.sev}">${i.sev}</span>
            <div><b>${esc(i.msg)}</b><small>${esc(i.feature)}${i.detail ? ' · ' + esc(i.detail) : ''}</small></div>
            ${i.fixable ? '<button class="btn sm fix" data-issue-fix="1">Reparable</button>' : ''}
          </div>`).join('') : `<div class="issue"><span class="sev ok">ok</span><div><b>Sin hallazgos geométricos</b><small>La geometría pasa las comprobaciones de anillos, cierre, duplicados, auto-intersección y área.</small></div></div>`;

        root.querySelector('#bvTable').innerHTML = features.map(f => {
          const iss = validation.issues.filter(i => i.feature === f.name).length;
          return `<tr><td class="name">${esc(f.name)}</td><td>${esc((f.geometry || {}).type || '—')}</td><td class="num">${fmt(featureVerts(f), 0)}</td><td class="num">${fmt(featureArea(f) / 10000, 3)}</td><td class="num">${iss || '—'}</td></tr>`;
        }).join('');

        const tone = errors ? 'bad' : warns ? 'warn' : 'ok';
        GL.setVerdict('bvVerdict', tone,
          errors ? `${errors} error(es) bloqueantes` : warns ? `${warns} advertencia(s)` : 'Geometría consistente',
          errors ? 'Corrija los errores antes de presentar el límite. Use «Reparar geometría» para cierre, duplicados y orientación; las auto-intersecciones pueden requerir edición manual en su SIG.' : warns ? 'Las advertencias no siempre impiden el uso, pero conviene documentarlas o corregirlas.' : 'Área calculada sobre elipsoide WGS 84. Verifique el datum del archivo original.');
        paint();

        T._report = {
          title: 'Validación de límites y geometrías',
          subtitle: `Fuente ${kind} · ${features.length} entidad(es)`,
          inputs: [['Archivo', kind], ['Entidades', features.length], ['Vértices', validation.stats.vertices], ['Reparaciones aplicadas', repairs]],
          results: [['Área total', fmt(validation.stats.area / 10000, 2), 'ha'], ['Errores', errors, ''], ['Advertencias', warns, ''], ['Polígonos', validation.stats.polygons, ''], ['Huecos', validation.stats.holes || 0, '']],
          extra: `<table><thead><tr><th>Severidad</th><th>Entidad</th><th>Hallazgo</th></tr></thead><tbody>${validation.issues.slice(0, 40).map(i => `<tr><td>${i.sev}</td><td>${esc(i.feature)}</td><td>${esc(i.msg)}${i.detail ? ' — ' + esc(i.detail) : ''}</td></tr>`).join('') || '<tr><td colspan="3">Sin hallazgos</td></tr>'}</tbody></table>`,
          notes: [
            'El área se calcula con exceso esférico sobre WGS 84. Si el archivo está en otro datum o proyección, el área puede diferir.',
            'La auto-intersección se detecta por pares de segmentos; anillos con más de 2 500 vértices se omiten para evitar bloqueos y se marcan como no verificados.',
            'La reparación normaliza anillos y elimina duplicados, pero no reconstruye polígonos inválidos complejos. Revise el resultado en su SIG.',
            'Este control no sustituye la revisión catastral, legal ni la verificación de superposición con derechos de terceros.'
          ],
          method: '<p>Se comprueban cierre de anillos, mínimo de vértices, duplicados consecutivos, auto-intersecciones, orientación (RFC 7946), contención de huecos y área positiva. El área usa la fórmula de exceso esférico.</p>'
        };
        T._csv = features.map(f => ({ nombre: f.name, tipo: (f.geometry || {}).type, vertices: featureVerts(f), area_ha: +(featureArea(f) / 10000).toFixed(4), hallazgos: validation.issues.filter(i => i.feature === f.name).length }));
      }

      function load(feats, k) {
        features = feats; kind = k; repairs = 0;
        validate();
        root.querySelector('#bvPaste').value = '';
        GL.toast(`${feats.length} entidad(es) cargada(s) desde ${k}`);
      }

      async function handleFiles(files) {
        try {
          const res = await GL.geo.parseFiles(files,{requireRFC7946:true});
          load(geographicInput(res.features,res.kind,root.querySelector('#bvCRS').value), res.kind);
        } catch (err) { GL.toast(err.message, 'bad'); }
      }
      root.querySelector('#bvFile').addEventListener('change', e => { if (e.target.files.length) handleFiles(e.target.files); });
      const dz = root.querySelector('#bv');
      ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag'); }));
      ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag'); }));
      dz.addEventListener('drop', e => { if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); });

      root.querySelector('#bvParse').addEventListener('click', () => {
        const txt = root.querySelector('#bvPaste').value.trim();
        if (!txt) { GL.toast('Pegue un GeoJSON o KML', 'warn'); return; }
        try {
          if (txt[0] === '{' || txt[0] === '[') load(geographicInput(GL.geo.parseGeoJSON(txt,{requireRFC7946:true}),'GeoJSON',''), 'GeoJSON');
          else load(geographicInput(GL.geo.parseKML(txt),'KML',''), 'KML');
        } catch (e) { GL.toast('No se pudo interpretar: ' + e.message, 'bad'); }
      });
      root.querySelector('#bvExample').addEventListener('click', () => {
        load(GL.geo.parseGeoJSON(JSON.stringify(SAMPLE)), 'GeoJSON demo');
        GL.toast('Ejemplo cargado: anillo abierto, duplicado y auto-intersección');
      });
      root.querySelector('#bvFix').addEventListener('click', () => {
        if (!features.length) { GL.toast('Cargue un archivo primero', 'warn'); return; }
        const res = GL.geo.fix(features);
        features = res.features; repairs += res.changes;
        validate();
        GL.toast(res.changes ? `Se aplicaron ${res.changes} correcciones` : 'No había correcciones automáticas disponibles');
      });
      root.querySelector('#bvIssues').addEventListener('click', e => {
        const btn = e.target.closest('[data-issue-fix]');
        if (!btn) return;
        if (!features.length) return;
        const res = GL.geo.fix(features);
        features = res.features; repairs += res.changes;
        validate();
        GL.toast(res.changes ? `Se aplicaron ${res.changes} correcciones` : 'No había correcciones automáticas disponibles');
      });
      root.querySelector('#bvClear').addEventListener('click', () => {
        features = []; validation = null; repairs = 0; kind = '—';
        ['bvFeatures', 'bvVerts', 'bvArea', 'bvErrors', 'bvWarns'].forEach(id => GL.out(id, '—'));
        GL.out('bvRepairs', '0');
        root.querySelector('#bvTable').innerHTML = '';
        root.querySelector('#bvIssues').innerHTML = '<div class="empty" style="border:0">Cargue un archivo para comenzar.</div>';
        root.querySelector('#bvKind').textContent = 'SIN ARCHIVO';
        root.querySelector('#bvIssueCount').textContent = '0';
        GL.setVerdict('bvVerdict', 'info', 'Sin datos', 'Cargue un SHP, KML o GeoJSON.');
        paint();
      });
      root.querySelector('#bvExportKml').addEventListener('click', () => {
        if (!features.length) return GL.toast('Sin geometrías', 'warn');
        GL.download('GOL_limites_validados.kml', GL.geo.toKML(features, { title: 'Límites validados' }), 'application/vnd.google-earth.kml+xml');
      });
      root.querySelector('#bvExportGeo').addEventListener('click', () => {
        if (!features.length) return GL.toast('Sin geometrías', 'warn');
        GL.download('GOL_limites_validados.geojson', GL.geo.toGeoJSON(features), 'application/geo+json');
      });
      paint();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_validacion_limites.csv', this._csv); }
  };
  GL.tool(T5);

  /* ======================================================================
     06 · SHP → KML / GeoJSON
     ====================================================================== */
  const T6 = {
    id: 'shp-to-kml',
    suite: 'soil',
    title: 'Conversor SHP → KML / GeoJSON',
    desc: 'Convierta ESRI Shapefile a KML conservando atributos, elija el campo de nombre y ajuste precisión y estilo. Exporte también GeoJSON y la tabla de atributos.',
    tags: ['.shp', '.dbf', 'KML', 'GeoJSON'],
    keywords: 'shapefile convertir kml geojson dbf atributos exportar google earth',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Origen</h2><p>Seleccione .shp y .dbf juntos para conservar los atributos.</p></div></div>
            ${fileZone('sk', 'Seleccione .shp + .dbf, .kml o .geojson', 'Conversión local. Sin subida de archivos.')}
            ${field('skCRS','CRS del SHP (obligatorio para SHP, p. ej. EPSG:32718)','','')}
            <div class="file-list" id="skFiles"></div>
            <div class="grid-2" style="margin-top:14px">
              <label class="field"><span>Campo de nombre</span><select id="skNameField"><option value="__name">Nombre interno</option></select></label>
              <label class="field"><span>Precisión decimal</span><select id="skPrec"><option value="6">6 decimales (~0,1 m)</option><option value="7" selected>7 decimales (~1 cm)</option><option value="8">8 decimales</option></select></label>
              ${field('skTitle', 'Título del documento', '', 'Límites del proyecto')}
              <label class="field"><span>Color de línea / relleno</span><input type="color" id="skColor" value="#5fe3a1" style="padding:3px;height:38px"></label>
            </div>
            <div class="field-row"><span>Incluir atributos en ExtendedData</span><label class="switch"><input type="checkbox" id="skAttrs" checked><i></i></label></div>
            <div class="field-row"><span>Relleno de polígonos</span><label class="switch"><input type="checkbox" id="skFill" checked><i></i></label></div>
            <div class="btn-row">
              <button class="btn primary" id="skKml">↓ Descargar KML</button>
              <button class="btn" id="skGeo">↓ GeoJSON</button>
              <button class="btn" id="skCsv">↓ Atributos CSV</button>
            </div>
          </section>
          <section class="panel">
            <div class="panel-title">Vista previa de atributos <span class="tag" id="skFieldCount">0 campos</span></div>
            <div class="table-wrap" style="max-height:300px"><table id="skTable"><tbody><tr><td class="name" style="color:var(--faint)">Cargue un archivo para ver sus registros.</td></tr></tbody></table></div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resumen <span class="tag" id="skKind">SIN ARCHIVO</span></div>
            <div class="metrics three">
              ${metric('skFeatures', 'Entidades', '', true)}
              ${metric('skVerts', 'Vértices', '')}
              ${metric('skArea', 'Área', 'ha')}
              ${metric('skFields', 'Campos', '')}
              ${metric('skPolys', 'Polígonos', '')}
              ${metric('skLines', 'Líneas / puntos', '')}
            </div>
            <div class="chart-wrap tall" style="margin-top:14px"><canvas id="skMap"></canvas></div>
            <div id="skVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Buenas prácticas de entrega</div>
            <div class="note accent"><b>Datum.</b> El KML se escribe en WGS 84 (EPSG:4326). Para SHP declare EPSG:4326 o la zona UTM WGS 84 de origen. Para otros CRS, reproyecte en el Laboratorio espacial.</div>
            <div class="note" style="margin-top:8px"><b>Nombres.</b> Elija un campo legible para el receptor. Un KML con «FID_1» obliga a abrir la tabla de atributos para entender el mapa.</div>
            <div class="note" style="margin-top:8px"><b>Tamaño.</b> Reduzca decimales a 6–7 y simplifique vértices redundantes para visores web.</div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T6;
      let features = [], kind = '—', fields = [], loadedCRS='';
      const canvas = root.querySelector('#skMap');
      const paint = () => GL.geo.render(canvas, features);

      function stats() {
        let verts = 0, polys = 0, lines = 0, area = 0;
        features.forEach(f => {
          const g = f.geometry;
          const walk = c => { if (typeof c[0] === 'number') verts++; else c.forEach(walk); };
          if (g) walk(g.coordinates);
          if (/Polygon/.test(g.type)) polys++;
          if (/Line|Point/.test(g.type)) lines++;
          if (g.type === 'Polygon') area += g.coordinates.reduce((s, r, i) => s + (i ? -1 : 1) * GL.geo.areaM2(r), 0);
          if (g.type === 'MultiPolygon') area += g.coordinates.reduce((s, p) => s + p.reduce((ss, r, i) => ss + (i ? -1 : 1) * GL.geo.areaM2(r), 0), 0);
        });
        return { verts, polys, lines, area };
      }

      function fieldsOf() {
        const set = new Set();
        features.forEach(f => Object.keys(f.props || {}).forEach(k => set.add(k)));
        return Array.from(set);
      }

      function refresh() {
        const st = stats();
        fields = fieldsOf();
        GL.out('skFeatures', fmt(features.length, 0));
        GL.out('skVerts', fmt(st.verts, 0));
        GL.out('skArea', fmt(st.area / 10000, 2));
        GL.out('skFields', fmt(fields.length, 0));
        GL.out('skPolys', fmt(st.polys, 0));
        GL.out('skLines', fmt(st.lines, 0));
        root.querySelector('#skKind').textContent = kind.toUpperCase();
        root.querySelector('#skFieldCount').textContent = fields.length + ' campos';
        const sel = root.querySelector('#skNameField');
        const prev = sel.value;
        sel.innerHTML = `<option value="__name">Nombre interno</option>` + fields.map(f => `<option value="${esc(f)}">${esc(f)}</option>`).join('');
        if (fields.indexOf(prev) >= 0 || prev === '__name') sel.value = prev;

        if (!features.length) return;
        root.querySelector('#skTable').innerHTML = `<thead><tr>${fields.slice(0, 8).map(f => `<th>${esc(f)}</th>`).join('') || '<th>Nombre</th>'}</tr></thead><tbody>` +
          features.slice(0, 20).map(f => `<tr>${fields.length ? fields.slice(0, 8).map(k => `<td>${esc(f.props[k] === undefined ? '' : f.props[k])}</td>`).join('') : `<td>${esc(f.name)}</td>`}</tr>`).join('') + '</tbody>';
        paint();
        GL.setVerdict('skVerdict', st.verts ? 'ok' : 'warn', st.verts + ' vértices listos para exportar',
          `${features.length} entidad(es) · ${fmt(st.area / 10000, 2)} ha · ${fields.length} atributo(s). Revise que el campo de nombre elegido no esté vacío en los registros clave.`);
        T._report = {
          title: 'Conversión SHP → KML / GeoJSON',
          subtitle: `Fuente ${kind} · ${features.length} entidades`,
          inputs: [['Archivo', kind], ['CRS SHP declarado', kind.startsWith('SHP')?loadedCRS:'No aplica'], ['Campo de nombre', sel.value === '__name' ? 'Nombre interno' : sel.value], ['Precisión', root.querySelector('#skPrec').value + ' decimales'], ['Atributos', root.querySelector('#skAttrs').checked ? 'Incluidos' : 'Omitidos']],
          results: [['Entidades', fmt(features.length, 0), ''], ['Vértices', fmt(st.verts, 0), ''], ['Área', fmt(st.area / 10000, 2), 'ha'], ['Campos', fmt(fields.length, 0), ''], ['Polígonos', fmt(st.polys, 0), ''], ['Líneas / puntos', fmt(st.lines, 0), '']],
          notes: ['La salida usa coordenadas WGS 84. Las zonas UTM WGS 84 declaradas se reproyectan antes de calcular áreas o exportar. https://www.rfc-editor.org/rfc/rfc7946#section-4', 'Los atributos se escriben como ExtendedData; algunos visores ligeros no los muestran.', 'Verifique el resultado en Google Earth o QGIS antes de enviarlo a un cliente o autoridad.'],
          method: '<p>Lectura binaria del shapefile (puntos, multipuntos, líneas y polígonos) y de la tabla DBF; ensamblado de anillos exteriores e interiores; escritura KML 2.2 con estilos y ExtendedData.</p>'
        };
      }

      async function handle(files) {
        try {
          const res = await GL.geo.parseFiles(files,{requireRFC7946:true});
          const declared=root.querySelector('#skCRS').value.trim().toUpperCase();
          features=geographicInput(res.features,res.kind,declared); kind=res.kind; loadedCRS=declared;
          root.querySelector('#skFiles').innerHTML = Array.from(files).map(f => `<div class="file-item"><span class="ok">✓</span>${esc(f.name)} <span style="margin-left:auto">${fmt(f.size / 1024, 0)} KB</span></div>`).join('');
          refresh();
          GL.toast(`${features.length} entidades cargadas`);
        } catch (e) { GL.toast(e.message, 'bad'); }
      }
      root.querySelector('#skFile').addEventListener('change', e => { if (e.target.files.length) handle(e.target.files); });
      const dz = root.querySelector('#sk');
      ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag'); }));
      ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag'); }));
      dz.addEventListener('drop', e => { if (e.dataTransfer.files.length) handle(e.dataTransfer.files); });

      function kmlOpts() {
        const hex = root.querySelector('#skColor').value.replace('#', '');
        const r = hex.slice(0, 2), g = hex.slice(2, 4), b = hex.slice(4, 6);
        const field = root.querySelector('#skNameField').value;
        const feats = features.map(f => Object.assign({}, f, { name: field !== '__name' && f.props && f.props[field] ? String(f.props[field]) : f.name }));
        return {
          feats, opts: {
            title: root.querySelector('#skTitle').value || 'Límites',
            precision: +root.querySelector('#skPrec').value,
            includeAttrs: root.querySelector('#skAttrs').checked,
            fill: root.querySelector('#skFill').checked,
            color: 'ff' + b + g + r
          }
        };
      }
      root.querySelector('#skKml').addEventListener('click', () => {
        if (!features.length) return GL.toast('Cargue un archivo primero', 'warn');
        const k = kmlOpts();
        GL.download(GL.slug(root.querySelector('#skTitle').value || 'limites') + '.kml', GL.geo.toKML(k.feats, k.opts), 'application/vnd.google-earth.kml+xml');
        GL.toast('KML generado');
      });
      root.querySelector('#skGeo').addEventListener('click', () => {
        if (!features.length) return GL.toast('Cargue un archivo primero', 'warn');
        GL.download(GL.slug(root.querySelector('#skTitle').value || 'limites') + '.geojson', GL.geo.toGeoJSON(features), 'application/geo+json');
      });
      root.querySelector('#skCsv').addEventListener('click', () => {
        if (!features.length) return GL.toast('Cargue un archivo primero', 'warn');
        const rows = features.map(f => Object.assign({ _nombre: f.name }, f.props || {}));
        GL.csvDownload('GOL_atributos.csv', rows);
      });
      root.querySelector('#skNameField').addEventListener('change', refresh);
      root.querySelector('#skTitle').addEventListener('input', () => { });
      paint();
    },
    report() { return this._report; }
  };
  GL.tool(T6);
})();
