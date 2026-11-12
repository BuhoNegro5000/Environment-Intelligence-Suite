/* ==========================================================================
   Green Owl Labs · Suite Suelo & Carbono (parte 3)
   07 Color de suelo y Munsell · 08 Emisiones · 09 Factores limitantes
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL, D = GL.data, num = GL.num, fmt = GL.fmt, esc = GL.escape;

  const field = (id, label, unit, val) => `<label class="field"><span>${label}${unit ? ` <em>${unit}</em>` : ''}</span>
    <input id="${id}" type="text" inputmode="decimal" value="${val}"></label>`;
  const selectField = (id, label, options, val) => `<label class="field"><span>${label}</span><select id="${id}">
    ${options.map(o => `<option value="${esc(o.id)}" ${String(o.id) === String(val) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></label>`;
  const metric = (id, label, unit, hero) => `<div class="metric ${hero ? 'hero' : ''}"><span>${label}</span><strong id="${id}">—</strong><small>${unit || ''}</small></div>`;

  /* ------------------------------------------------------------ color math */
  function srgb2lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lin2srgb(c) { const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.round(GL.clamp(v * 255, 0, 255)); }
  function rgb2lab(r, g, b) {
    const R = srgb2lin(r), G = srgb2lin(g), B = srgb2lin(b);
    let X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
    let Y = (R * 0.2126 + G * 0.7152 + B * 0.0722);
    let Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    const f = t => t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16 / 116);
    const fx = f(X), fy = f(Y), fz = f(Z);
    return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
  }
  function lab2rgb(L, a, b) {
    const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
    const inv = t => t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787;
    const X = inv(fx) * 0.95047, Y = inv(fy), Z = inv(fz) * 1.08883;
    const R = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
    const G = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
    const B = X * 0.0557 + Y * -0.2040 + Z * 1.0570;
    return { r: lin2srgb(R), g: lin2srgb(G), b: lin2srgb(B) };
  }
  const hex = (r, g, b) => '#' + [r, g, b].map(v => GL.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  function munsellFromLab(L, a, b) {
    const C = Math.sqrt(a * a + b * b);
    const h = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
    const Ypct = (L > 8 ? Math.pow((L + 16) / 116, 3) : L / 903.3) * 100;
    let lo = 0, hi = 10;
    for (let i = 0; i < 40; i++) {
      const v = (lo + hi) / 2;
      const y = 1.1914 * v - 0.22533 * v * v + 0.23352 * v ** 3 - 0.020484 * v ** 4 + 0.00081939 * v ** 5;
      if (y < Ypct) lo = v; else hi = v;
    }
    const V = Math.round((lo + hi) / 2 * 2) / 2;
    const anchors = [
      { h: 18, label: '10R' }, { h: 30, label: '2.5YR' }, { h: 43, label: '5YR' },
      { h: 57, label: '7.5YR' }, { h: 72, label: '10YR' }, { h: 87, label: '2.5Y' }, { h: 100, label: '5Y' }
    ];
    let best = anchors[0];
    anchors.forEach(x => { if (Math.abs(x.h - h) < Math.abs(best.h - h)) best = x; });
    const chromaRaw = C / 5.5;
    const valid = [1, 2, 3, 4, 5, 6, 8, 10, 12];
    let chroma = valid.reduce((p, c) => Math.abs(c - chromaRaw) < Math.abs(p - chromaRaw) ? c : p, 1);
    if (V >= 8 && chroma > 8) chroma = 8;
    return { hue: best.label, value: V, chroma, hueAngle: h, C, Ypct };
  }

  /* ======================================================================
     07 · COLOR DE SUELO
     ====================================================================== */
  const T7 = {
    id: 'soil-colour',
    suite: 'soil',
    title: 'Analizador de color de suelo y Munsell',
    desc: 'Suba una foto de campo, recorte una zona y obtenga color dominante, notación Munsell estimada, RGB/Lab y una lectura de drenaje y materia orgánica. Sin enviar la imagen a internet.',
    tags: ['Munsell', 'Color', 'Drenaje', 'Foto'],
    keywords: 'munsell color suelo foto drenaje hierro materia organica lab rgb textura',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Imagen de campo</h2><p>Luz difusa, suelo húmedo o seco según corresponda y una tarjeta gris si es posible.</p></div></div>
            <div class="dropzone" id="sc">
              <div class="dz-ico">◉</div><b>Seleccione o arrastre una foto del suelo</b>
              <small>JPG, PNG o WEBP · se analiza localmente · máximo sugerido 12 MB</small>
              <input type="file" id="scFile" accept="image/*" hidden>
            </div>
            <div style="margin-top:12px;position:relative">
              <canvas id="scPreview" style="width:100%;height:250px;border-radius:10px;border:1px solid var(--line);background:#0a0f0c;cursor:crosshair"></canvas>
              <div id="scHint" style="position:absolute;left:10px;bottom:8px;font-size:9.5px;color:#cfd8d2;background:rgba(0,0,0,.55);padding:3px 7px;border-radius:5px;pointer-events:none">Arrastre un rectángulo para analizar solo esa zona</div>
            </div>
            <div class="btn-row">
              <button class="btn sm" id="scFull">Analizar imagen completa</button>
              <button class="btn sm" id="scAgain">Reanalizar</button>
            </div>
            <div class="grid-2" style="margin-top:12px">
              <label class="field"><span>Brillo / exposición <em id="scBrightVal">1.00×</em></span>
                <input type="range" id="scBright" min="0.7" max="1.35" step="0.01" value="1" style="padding:0;border:0;background:none">
              </label>
              <div class="field-row" style="padding-top:16px"><span>Balance de blancos automático</span><label class="switch"><input type="checkbox" id="scWB"><i></i></label></div>
            </div>
            <div class="note" style="margin-top:8px">El balance automático (grey-world) puede alterar suelos muy rojos o muy oscuros. Úselo solo si la foto tiene una fuente de luz dominante y compare con la carta Munsell física.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Color dominante</div>
            <div class="swatch" id="scSwatch" style="background:#3b2f24"></div>
            <div class="metrics">
              ${metric('scMunsell', 'Munsell estimado', 'aproximación', true)}
              ${metric('scName', 'Nombre orientativo', '')}
              ${metric('scHex', 'HEX', 'sRGB')}
              ${metric('scRGB', 'RGB', '')}
              ${metric('scLab', 'CIELAB', 'D65')}
              ${metric('scValue', 'Value / Chroma', '')}
            </div>
            <div id="scVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Paleta detectada <span class="tag">K-MEANS · LAB</span></div>
            <div id="scClusters" class="stack"><div class="note">Cargue una imagen para ver la paleta.</div></div>
            <details class="acc"><summary>Cómo se interpreta</summary><div class="acc-body">
              <p><b>Value bajo</b> (≤ 3) sugiere materia orgánica alta o humedad. <b>Croma ≤ 2 con value alto</b> puede indicar hidromorfismo (drenaje pobre). <b>Tonos rojizos con croma alto</b> sugieren óxidos de hierro y buena aireación.</p>
              <p>El color es un indicador, no un diagnóstico: moteados, concreciones y límites de horizonte requieren observación en campo.</p>
              <p>La conversión Munsell es una aproximación colorimétrica bajo iluminante D65. Confirme con carta Munsell física y luz natural indirecta.</p>
            </div></details>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T7;
      const preview = root.querySelector('#scPreview');
      let img = null, crop = null, drag = null, meta = null, clusters = [];
      const ctx = preview.getContext('2d');

      function fitRect() {
        if (!img) return null;
        const W = preview.clientWidth, H = preview.clientHeight;
        const s = Math.min(W / img.width, H / img.height);
        return { x: (W - img.width * s) / 2, y: (H - img.height * s) / 2, w: img.width * s, h: img.height * s, s };
      }
      function paint() {
        const W = preview.clientWidth, H = preview.clientHeight;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        preview.width = W * dpr; preview.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#0a0f0c'; ctx.fillRect(0, 0, W, H);
        if (!img) {
          ctx.fillStyle = 'rgba(160,180,170,.5)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('Sin imagen', W / 2, H / 2); return;
        }
        const r = fitRect(); meta = r;
        ctx.drawImage(img, r.x, r.y, r.w, r.h);
        if (crop) {
          const cx = r.x + crop.x * r.w, cy = r.y + crop.y * r.h, cw = crop.w * r.w, ch = crop.h * r.h;
          ctx.fillStyle = 'rgba(0,0,0,.45)';
          ctx.fillRect(r.x, r.y, r.w, cy - r.y); ctx.fillRect(r.x, cy + ch, r.w, r.y + r.h - (cy + ch));
          ctx.fillRect(r.x, cy, cx - r.x, ch); ctx.fillRect(cx + cw, cy, r.x + r.w - (cx + cw), ch);
          ctx.strokeStyle = '#5FE3A1'; ctx.lineWidth = 1.5; ctx.strokeRect(cx, cy, cw, ch);
        }
      }
      function drawDrag(e) {
        paint();
        if (!drag || !meta) return;
        const x = Math.min(drag.x0, e.offsetX), y = Math.min(drag.y0, e.offsetY);
        const w = Math.abs(e.offsetX - drag.x0), h = Math.abs(e.offsetY - drag.y0);
        ctx.strokeStyle = '#F2B45A'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
        ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
      }
      preview.addEventListener('mousedown', e => { if (!img) return; drag = { x0: e.offsetX, y0: e.offsetY }; });
      preview.addEventListener('mousemove', e => { if (drag) drawDrag(e); });
      preview.addEventListener('mouseup', e => {
        if (!drag || !meta) return;
        const r = meta;
        const x0 = GL.clamp(Math.min(drag.x0, e.offsetX), r.x, r.x + r.w);
        const x1 = GL.clamp(Math.max(drag.x0, e.offsetX), r.x, r.x + r.w);
        const y0 = GL.clamp(Math.min(drag.y0, e.offsetY), r.y, r.y + r.h);
        const y1 = GL.clamp(Math.max(drag.y0, e.offsetY), r.y, r.y + r.h);
        drag = null;
        if (x1 - x0 < 8 || y1 - y0 < 8) { paint(); return; }
        crop = { x: (x0 - r.x) / r.w, y: (y0 - r.y) / r.h, w: (x1 - x0) / r.w, h: (y1 - y0) / r.h };
        paint(); analyze();
      });
      preview.addEventListener('mouseleave', () => { if (drag) { drag = null; paint(); } });
      window.addEventListener('resize', GL.debounce(() => { if (document.body.contains(preview)) paint(); }, 150));

      function sourceCanvas() {
        const c = document.createElement('canvas');
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (crop) { sx = crop.x * img.width; sy = crop.y * img.height; sw = crop.w * img.width; sh = crop.h * img.height; }
        const max = 340;
        const s = Math.min(1, max / Math.max(sw, sh));
        c.width = Math.max(2, Math.round(sw * s)); c.height = Math.max(2, Math.round(sh * s));
        c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
        return c;
      }

      function analyze() {
        if (!img) return GL.toast('Cargue una imagen primero', 'warn');
        const src = sourceCanvas();
        const d = src.getContext('2d').getImageData(0, 0, src.width, src.height).data;
        const bright = +root.querySelector('#scBright').value;
        const wb = root.querySelector('#scWB').checked;
        let pts = [];
        for (let i = 0; i < d.length; i += 8) {
          let r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
          if (a < 200) continue;
          r *= bright; g *= bright; b *= bright;
          const lab = rgb2lab(r, g, b);
          if (lab.L < 6 || lab.L > 96) continue;
          pts.push({ r, g, b, L: lab.L, a: lab.a, bb: lab.b });
        }
        if (wb && pts.length) {
          const mr = GL.stat.mean(pts.map(p => p.r)), mg = GL.stat.mean(pts.map(p => p.g)), mb = GL.stat.mean(pts.map(p => p.b));
          const gray = (mr + mg + mb) / 3;
          pts = pts.map(p => {
            const nr = p.r * gray / (mr || 1), ng = p.g * gray / (mg || 1), nb = p.b * gray / (mb || 1);
            const lab = rgb2lab(nr, ng, nb);
            return { r: nr, g: ng, b: nb, L: lab.L, a: lab.a, bb: lab.b };
          });
        }
        if (pts.length < 30) { GL.toast('La zona tiene muy pocos píxeles útiles (sombras o blancos)', 'bad'); return; }
        // k-means determinista
        const k = 4;
        const sorted = pts.slice().sort((p, q) => p.L - q.L);
        let centers = [0.12, 0.36, 0.62, 0.88].map(q => {
          const p = sorted[Math.floor(q * (sorted.length - 1))];
          return { L: p.L, a: p.a, b: p.bb };
        });
        let assign = new Array(pts.length).fill(0);
        for (let it = 0; it < 14; it++) {
          for (let i = 0; i < pts.length; i++) {
            let bi = 0, bd = Infinity;
            for (let c = 0; c < k; c++) {
              const dd = (pts[i].L - centers[c].L) ** 2 + (pts[i].a - centers[c].a) ** 2 + (pts[i].bb - centers[c].b) ** 2;
              if (dd < bd) { bd = dd; bi = c; }
            }
            assign[i] = bi;
          }
          const sums = Array.from({ length: k }, () => ({ L: 0, a: 0, b: 0, n: 0 }));
          for (let i = 0; i < pts.length; i++) { const s = sums[assign[i]]; s.L += pts[i].L; s.a += pts[i].a; s.b += pts[i].bb; s.n++; }
          centers = sums.map((s, i) => s.n ? { L: s.L / s.n, a: s.a / s.n, b: s.b / s.n } : centers[i]);
        }
        const counts = Array.from({ length: k }, () => 0);
        assign.forEach(a => counts[a]++);
        clusters = centers.map((c, i) => {
          const rgb = lab2rgb(c.L, c.a, c.b);
          return { ...c, n: counts[i], pct: counts[i] / pts.length * 100, rgb, hex: hex(rgb.r, rgb.g, rgb.b) };
        }).sort((a, b) => b.n - a.n);
        const dom = clusters[0];
        const m = munsellFromLab(dom.L, dom.a, dom.b);
        const name = D.soilColorName(m.hue, m.value, m.chroma);
        root.querySelector('#scSwatch').style.background = dom.hex;
        GL.out('scMunsell', `${m.hue} ${fmt(m.value, 1)}/${fmt(m.chroma, 0)}`);
        GL.out('scName', name);
        GL.out('scHex', dom.hex);
        GL.out('scRGB', `${Math.round(dom.rgb.r)}, ${Math.round(dom.rgb.g)}, ${Math.round(dom.rgb.b)}`);
        GL.out('scLab', `${fmt(dom.L, 0)} / ${fmt(dom.a, 0)} / ${fmt(dom.b, 0)}`);
        GL.out('scValue', `${fmt(m.value, 1)} / ${fmt(m.chroma, 0)}`);

        const notes = [];
        if (m.value <= 3) notes.push('Color oscuro: señala materia orgánica elevada o suelo húmedo.');
        if (m.chroma <= 2 && m.value >= 5) notes.push('Croma bajo con value alto: posible hidromorfismo o drenaje deficiente.');
        if (m.chroma <= 2 && m.value < 5) notes.push('Croma bajo y oscuro: revise saturación y condiciones reductoras.');
        if (/R/.test(m.hue) && !/YR/.test(m.hue) && m.chroma >= 4) notes.push('Tono rojizo con croma alto: óxidos de hierro y buena aireación.');
        if (/Y$/.test(m.hue) && m.chroma >= 3) notes.push('Tono amarillento: mineralogía con hierro hidratado o transición.');
        if (!notes.length) notes.push('Color mineral sin un rasgo diagnóstico dominante; complemente con textura, estructura y moteados.');
        GL.setVerdict('scVerdict', m.value <= 3 ? 'info' : 'ok', `Color dominante: ${name}`,
          `${m.hue} ${fmt(m.value, 1)}/${fmt(m.chroma, 0)} · ${notes.join(' ')} ${crop ? 'Zona recortada analizada.' : 'Imagen completa analizada.'}`);
        root.querySelector('#scClusters').innerHTML = clusters.map(c => `<div style="display:flex;gap:10px;align-items:center;padding:7px;border:1px solid var(--line-soft);border-radius:9px;background:var(--panel-2)">
          <span style="width:34px;height:34px;border-radius:7px;background:${c.hex};border:1px solid rgba(255,255,255,.1);flex:none"></span>
          <div style="min-width:0"><b style="font-size:11px;font-family:var(--mono)">${c.hex}</b><small style="display:block;font-size:9.5px;color:var(--muted)">RGB ${Math.round(c.rgb.r)}, ${Math.round(c.rgb.g)}, ${Math.round(c.rgb.b)}</small></div>
          <span style="margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--accent)">${fmt(c.pct, 1)} %</span>
        </div>`).join('');

        T._report = {
          title: 'Análisis de color de suelo y estimación Munsell',
          subtitle: 'Colorimetría en espacio CIELAB · iluminante D65',
          inputs: [['Fuente', 'Imagen local'], ['Zona', crop ? 'Recorte seleccionado' : 'Imagen completa'], ['Balance de blancos', wb ? 'Automático' : 'Desactivado'], ['Brillo aplicado', fmt(bright, 2) + '×'], ['Píxeles analizados', fmt(pts.length, 0)]],
          results: [['Color dominante', dom.hex, 'HEX'], ['Munsell estimado', `${m.hue} ${fmt(m.value, 1)}/${fmt(m.chroma, 0)}`, ''], ['Nombre', name, ''], ['CIELAB', `${fmt(dom.L, 0)} / ${fmt(dom.a, 0)} / ${fmt(dom.b, 0)}`, ''], ['Proporción dominante', fmt(dom.pct, 1), '%']],
          extra: `<table><thead><tr><th>Color</th><th>HEX</th><th>RGB</th><th>Proporción</th></tr></thead><tbody>${clusters.map(c => `<tr><td>${c.hex}</td><td>${c.hex}</td><td>${Math.round(c.rgb.r)}, ${Math.round(c.rgb.g)}, ${Math.round(c.rgb.b)}</td><td>${fmt(c.pct, 1)} %</td></tr>`).join('')}</tbody></table>`,
          notes: ['La notación Munsell es una estimación colorimétrica; no sustituye la comparación con una carta Munsell física bajo iluminación normalizada.', 'El color de una fotografía depende de la cámara, la exposición, la luz y la humedad del suelo. El balance automático puede introducir sesgo.', 'La lectura de drenaje y materia orgánica es orientativa y requiere confirmación en campo.'],
          method: '<p>Conversión sRGB → CIELAB (D65), agrupamiento k-means en Lab, estimación de value por inversión de la función de valor Munsell y de chroma por correlación con C*. La notación final se redondea a los escalones habituales de la carta de suelos.</p>'
        };
        T._csv = clusters.map(c => ({ hex: c.hex, r: Math.round(c.rgb.r), g: Math.round(c.rgb.g), b: Math.round(c.rgb.b), porcentaje: +c.pct.toFixed(2) }));
      }

      root.querySelector('#scFile').addEventListener('change', e => {
        const f = e.target.files[0]; if (!f) return;
        if (f.size > 15 * 1024 * 1024) { GL.toast('Imagen demasiado grande (máx. 15 MB)', 'bad'); return; }
        const url = URL.createObjectURL(f);
        const im = new Image();
        im.onload = () => {
          img = im; crop = null;
          URL.revokeObjectURL(url);
          paint(); analyze();
          root.querySelector('#scHint').textContent = 'Arrastre un rectángulo para analizar solo esa zona';
        };
        im.onerror = () => { GL.toast('No se pudo leer la imagen', 'bad'); URL.revokeObjectURL(url); };
        im.src = url;
      });
      const dz = root.querySelector('#sc');
      ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag'); }));
      ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag'); }));
      dz.addEventListener('drop', e => {
        if (!e.dataTransfer.files.length) return;
        const f = e.dataTransfer.files[0];
        if (!/^image\//.test(f.type)) return GL.toast('El archivo no es una imagen', 'bad');
        const dt = new DataTransfer(); dt.items.add(f);
        root.querySelector('#scFile').files = dt.files;
        root.querySelector('#scFile').dispatchEvent(new Event('change'));
      });
      root.querySelector('#scBright').addEventListener('input', e => {
        root.querySelector('#scBrightVal').textContent = (+e.target.value).toFixed(2) + '×';
        if (img) analyze();
      });
      root.querySelector('#scWB').addEventListener('change', () => { if (img) analyze(); });
      root.querySelector('#scFull').addEventListener('click', () => { crop = null; paint(); if (img) analyze(); });
      root.querySelector('#scAgain').addEventListener('click', () => { if (img) analyze(); else GL.toast('Cargue una imagen', 'warn'); });
      paint();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_paleta_suelo.csv', this._csv); }
  };
  GL.tool(T7);

  /* ======================================================================
     08 · EMISIONES
     ====================================================================== */
  const T8 = {
    id: 'emissions',
    suite: 'soil',
    title: 'Calculadora de emisiones y balance de GEI',
    desc: 'Estime emisiones de un sistema agrícola con marco IPCC: cambio de stock de COS, N₂O directo e indirecto, fermentación entérica, manejo de estiércol y energía. Separe fuentes y sumideros.',
    tags: ['IPCC', 'GEI', 'CO₂-e', 'N₂O'],
    keywords: 'emisiones gases efecto invernadero huella carbono agricola ipcc metano oxido nitroso diesel fertilizante',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Límites del inventario</h2><p>Declare área, período y juego de GWP. Un inventario sin límites explícitos no es comparable.</p></div></div>
            <div class="grid-3">
              ${field('emArea', 'Área', 'ha', '100')}
              ${field('emYears', 'Período del balance de C', 'años', '1')}
              ${selectField('emGWP', 'Juego de GWP', Object.keys(D.GWP.sets).map(k => ({ id: k, label: D.GWP.sets[k].label })), 'AR6')}
              ${field('emProd', 'Producción del sistema (opcional)', 't/año', '0')}
            </div>
          </section>
          <section class="panel">
            <div class="panel-title">Cambio de carbono del suelo</div>
            <div class="grid-2">
              ${field('emC0', 'Stock inicial de COS', 't C/ha', '48')}
              ${field('emC1', 'Stock final de COS', 't C/ha', '46')}
            </div>
            <div class="note" style="margin-top:8px">Use stocks medidos a la misma masa de suelo. Un stock inicial mayor que el final genera emisión; lo contrario, remoción.</div>
          </section>
          <section class="panel">
            <div class="panel-title">Nitrógeno y ganado</div>
            <div class="grid-3">
              ${field('emNfert', 'Fertilizante nitrogenado (N sintético)', 'kg N/ha·año', '120')}
              ${field('emNfix', 'N fijado por leguminosas', 'kg N/ha·año', '0')}
              ${field('emNres', 'N en residuos de cosecha', 'kg N/ha·año', '20')}
              ${selectField('emClimate', 'Clima para EF1 de N₂O', [
                { id: 'wet', label: 'Húmedo · sintético 0,016 / orgánico 0,006' },
                { id: 'dry', label: 'Seco · todos los aportes 0,005' }
              ], 'wet')}
              ${field('emHeads', 'Cabezas de bovino', 'animales', '0')}
              ${field('emEFent', 'Factor entérico', 'kg CH₄/cab·año', '60')}
              ${field('emEFman', 'Factor estiércol', 'kg CH₄/cab·año', '10')}
            </div>
            <div class="note" style="margin-top:8px">El N sintético usa EF1 desagregado de clima húmedo (0,016); los residuos y la fijación biológica se tratan como N orgánico (0,006). En clima seco se aplica 0,005 a todos los aportes. La fijación biológica se incluye aquí como aporte orgánico: verifique si su inventario nacional ya la contabiliza para evitar doble conteo.</div>
          </section>
          <section class="panel">
            <div class="panel-title">Energía e insumos</div>
            <div class="grid-3">
              ${field('emDiesel', 'Diésel', 'L/año', '0')}
              ${field('emGas', 'Gasolina', 'L/año', '0')}
              ${field('emElec', 'Electricidad', 'kWh/año', '0')}
              ${field('emLime', 'Cal aplicada', 'kg/año', '0')}
              ${field('emUrea', 'Urea aplicada', 'kg/año', '0')}
              ${field('emEFelec', 'Factor eléctrico', 'kg CO₂-e/kWh', '0.45')}
            </div>
            <details class="acc"><summary>Factores IPCC usados</summary><div class="acc-body">
              <p>IPCC 2019, tabla 11.1: EF1 sintético húmedo = 0,016 (0,013–0,019); EF1 orgánico/residuos húmedo = 0,006 (0,001–0,011); EF1 seco = 0,005 (0,000–0,011); EF1 agregado = 0,010 (0,002–0,018). EF4 = 0,010 · EF5 = 0,011 · FracGASF = 0,11 · FracGASM = 0,21 · FracLEACH = 0,24 · relación N₂O-N → N₂O = 44/28.</p>
              <p>La incertidumbre mostrada usa solo el rango de EF1; no incluye la incertidumbre de los datos de actividad ni de los demás factores.</p>
              <p>Los factores de ganado y electricidad son referenciales y editables. Para un inventario formal use los factores nacionales de su país.</p>
            </div></details>
            <div class="note warn" style="margin-top:10px"><b>No es un cálculo para certificación.</b> Es una estimación de cribado. Un inventario verificable requiere factores locales, datos de actividad auditados y límites organizacionales definidos.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Balance</div>
            <div class="metrics">
              ${metric('emNet', 'Huella neta', 't CO₂-e', true)}
              ${metric('emPerHa', 'Intensidad por área', 't CO₂-e/ha')}
              ${metric('emGross', 'Emisiones brutas', 't CO₂-e')}
              ${metric('emRem', 'Remociones', 't CO₂-e')}
              ${metric('emKgProd', 'Intensidad por producto', 'kg CO₂-e/kg')}
              ${metric('emSoc', 'Cambio de COS anual', 't C/año')}
              ${metric('emRange', 'Balance · rango por EF1', 't CO₂-e')}
            </div>
            <div class="chart-wrap" style="margin-top:16px"><canvas id="emChart"></canvas></div>
            <div id="emVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Desglose por fuente</div>
            <div class="table-wrap"><table><thead><tr><th>Fuente</th><th class="num">t CO₂-e</th><th class="num">%</th><th class="num">t CO₂-e/ha</th></tr></thead><tbody id="emTable"></tbody></table></div>
            <div class="note" style="margin-top:10px">Las remociones se muestran con signo negativo. El balance neto es la suma algebraica; un resultado negativo indica sumidero neto en el período declarado.</div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T8;
      function update() {
        const area = Math.max(0.0001, num('emArea', 100));
        const years = Math.max(1, num('emYears', 1));
        const prod = Math.max(0, num('emProd', 0));
        const gwp = D.GWP.sets[root.querySelector('#emGWP').value] || D.GWP.sets.AR6;
        const c0 = num('emC0', 48), c1 = num('emC1', 46);
        const dC = (c1 - c0) * area / years;
        const socCO2 = -dC * 44 / 12;
        const nSyn = Math.max(0, num('emNfert', 0));
        const nFix = Math.max(0, num('emNfix', 0));
        const nRes = Math.max(0, num('emNres', 0));
        const nOrg = nFix + nRes;
        const climate = root.querySelector('#emClimate').value === 'dry' ? 'dry' : 'wet';
        const efSyn = climate === 'dry' ? D.ipcc.EF1_dry : D.ipcc.EF1_syn_wet;
        const efOrg = climate === 'dry' ? D.ipcc.EF1_dry : D.ipcc.EF1_org;
        const N = nSyn + nOrg;
        const Ntot = N * area;
        const n2oDirect = (nSyn * efSyn + nOrg * efOrg) * area * 44 / 28 / 1000;
        const n2oIndirect = ((nSyn * D.ipcc.FracGASF + nOrg * D.ipcc.FracGASM) * D.ipcc.EF4 +
          Ntot * D.ipcc.FracLEACH * D.ipcc.EF5) * 44 / 28 / 1000;
        const efRange = climate === 'dry' ? D.ipcc.EF1_range.dry : D.ipcc.EF1_range.orgWet;
        const efSynRange = climate === 'dry' ? D.ipcc.EF1_range.dry : D.ipcc.EF1_range.synWet;
        const n2oDirectLow = (nSyn * efSynRange[0] + nOrg * efRange[0]) * area * 44 / 28 / 1000;
        const n2oDirectHigh = (nSyn * efSynRange[1] + nOrg * efRange[1]) * area * 44 / 28 / 1000;
        const heads = Math.max(0, num('emHeads', 0));
        const ch4ent = heads * Math.max(0, num('emEFent', 60)) / 1000;
        const ch4man = heads * Math.max(0, num('emEFman', 10)) / 1000;
        const efElec = Math.max(0, num('emEFelec', 0.45));
        const energy = (Math.max(0, num('emDiesel', 0)) * D.ipcc.diesel + Math.max(0, num('emGas', 0)) * D.ipcc.gasoline +
          Math.max(0, num('emElec', 0)) * efElec + Math.max(0, num('emLime', 0)) * D.ipcc.lime + Math.max(0, num('emUrea', 0)) * D.ipcc.urea) / 1000;
        const parts = [
          { id: 'cos', label: 'Cambio de COS', v: socCO2, color: socCO2 < 0 ? '#5FE3A1' : '#F07E8A' },
          { id: 'n2od', label: 'N₂O directo', v: n2oDirect * gwp.N2O, color: '#F2B45A' },
          { id: 'n2oi', label: 'N₂O indirecto', v: n2oIndirect * gwp.N2O, color: '#E0A34A' },
          { id: 'ch4e', label: 'CH₄ entérico', v: ch4ent * gwp.CH4, color: '#66C7E8' },
          { id: 'ch4m', label: 'CH₄ estiércol', v: ch4man * gwp.CH4, color: '#4AA8C8' },
          { id: 'ener', label: 'Energía e insumos', v: energy, color: '#B4A4F5' }
        ];
        const gross = parts.filter(p => p.v > 0).reduce((s, p) => s + p.v, 0);
        const rem = Math.abs(parts.filter(p => p.v < 0).reduce((s, p) => s + p.v, 0));
        const net = parts.reduce((s, p) => s + p.v, 0);
        const n2oDirCo2 = n2oDirect * gwp.N2O;
        const netLow = net - n2oDirCo2 + n2oDirectLow * gwp.N2O;
        const netHigh = net - n2oDirCo2 + n2oDirectHigh * gwp.N2O;
        GL.out('emNet', GL.signed(net, 1));
        GL.out('emRange', GL.signed(netLow, 1) + ' a ' + GL.signed(netHigh, 1));
        GL.out('emPerHa', GL.signed(net / area, 2));
        GL.out('emGross', fmt(gross, 1));
        GL.out('emRem', fmt(rem, 1));
        GL.out('emKgProd', prod ? GL.signed(net * 1000 / prod, 2) : '—');
        GL.out('emSoc', GL.signed(dC, 2));

        root.querySelector('#emTable').innerHTML = parts.map(p => `<tr>
          <td class="name"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.label}</td>
          <td class="num">${GL.signed(p.v, 2)}</td>
          <td class="num">${net ? fmt(100 * p.v / net, 1) : '0'} %</td>
          <td class="num">${GL.signed(p.v / area, 3)}</td></tr>`).join('') +
          `<tr><td class="name"><b>Neto</b></td><td class="num"><b>${GL.signed(net, 2)}</b></td><td class="num"><b>100 %</b></td><td class="num"><b>${GL.signed(net / area, 3)}</b></td></tr>`;

        GL.chart(root.querySelector('#emChart'), {
          type: 'bar',
          series: [{ name: 't CO₂-e', data: parts.map(p => [p.label.replace('₂', '2').replace('₄', '4'), p.v]), color: '#66C7E8' }],
          y: { label: 't CO₂-e', zero: true }
        });

        const tone = net < 0 ? 'ok' : net < area * 2 ? 'info' : 'warn';
        GL.setVerdict('emVerdict', tone, net < 0 ? 'Sumidero neto en el período' : 'Fuente neta de emisiones',
          `${GL.signed(net, 1)} t CO₂-e en ${fmt(area, 0)} ha (${GL.signed(net / area, 2)} t CO₂-e/ha). Rango por incertidumbre de EF1: ${GL.signed(netLow, 1)} a ${GL.signed(netHigh, 1)} t CO₂-e. Emisiones brutas ${fmt(gross, 1)} t; remociones ${fmt(rem, 1)} t. ${Math.abs(socCO2) > 0 ? 'El cambio de COS es el componente de mayor peso relativo: ' + fmt(100 * Math.abs(socCO2) / (gross + rem || 1), 0) + ' % del flujo total.' : ''}`);

        T._report = {
          title: 'Balance de emisiones de gases de efecto invernadero',
          subtitle: `Marco IPCC 2019 · ${gwp.label} · clima ${climate === 'dry' ? 'seco' : 'húmedo'} · ${fmt(area, 0)} ha · ${fmt(years, 0)} año(s)`,
          inputs: [
            ['Área', fmt(area, 0) + ' ha'], ['Stock inicial / final', `${fmt(c0, 1)} → ${fmt(c1, 1)} t C/ha`],
            ['N sintético / orgánico', `${fmt(nSyn, 0)} / ${fmt(nOrg, 0)} kg N/ha·año`],
            ['Clima para EF1', climate === 'dry' ? 'Seco · 0,005' : 'Húmedo · sintético 0,016 / orgánico 0,006'],
            ['Bovinos', fmt(heads, 0)], ['Diésel / gasolina', `${fmt(num('emDiesel'), 0)} / ${fmt(num('emGas'), 0)} L`],
            ['Electricidad', fmt(num('emElec'), 0) + ' kWh · ' + fmt(efElec, 2) + ' kg CO₂-e/kWh']
          ],
          results: [
            ['Huella neta', GL.signed(net, 1), 't CO₂-e'], ['Rango por EF1', GL.signed(netLow, 1) + ' a ' + GL.signed(netHigh, 1), 't CO₂-e'],
            ['Por hectárea', GL.signed(net / area, 2), 't CO₂-e/ha'],
            ['Emisiones brutas', fmt(gross, 1), 't CO₂-e'], ['Remociones', fmt(rem, 1), 't CO₂-e'],
            ['Cambio de COS', GL.signed(dC, 2), 't C/año'], ['Intensidad por producto', prod ? GL.signed(net * 1000 / prod, 2) : '—', 'kg CO₂-e/kg']
          ],
          extra: `<table><thead><tr><th>Fuente</th><th>t CO₂-e</th><th>%</th></tr></thead><tbody>${parts.map(p => `<tr><td>${p.label}</td><td>${GL.signed(p.v, 2)}</td><td>${net ? fmt(100 * p.v / net, 1) : '0'} %</td></tr>`).join('')}</tbody></table>`,
          notes: [
            'Estimación de cribado con factores por defecto. No apta para certificación, reporte regulatorio ni declaraciones de carbono neutralidad.',
            'El cambio de stock de COS debe provenir de mediciones comparables (misma masa de suelo, mismo método, misma profundidad).',
            'N₂O directo: N sintético × EF1 desagregado (0,016 húmedo; 0,005 seco) + N orgánico y residuos × EF1 orgánico (0,006 húmedo; 0,005 seco). La fijación biológica se contabiliza como N orgánico; evite duplicarla si su inventario nacional ya la incluye.',
            'N₂O indirecto: volatilización = N sintético × FracGASF (0,11) + N orgánico × FracGASM (0,21), multiplicada por EF4; lixiviación = N total × FracLEACH × EF5. Las fracciones y EF4/EF5 son valores por defecto IPCC 2019.',
            'El rango mostrado usa solo la incertidumbre de EF1 (IPCC 2019, tabla 11.1); no incluye la incertidumbre de la actividad, del COS ni de los factores de ganado y energía.',
            'Los factores de emisión de ganado, fertilizantes y electricidad varían por país y tecnología. Reemplácelos por los valores nacionales aplicables.',
            'El GWP elegido debe declararse; los resultados no son comparables entre juegos AR4, AR5 y AR6.'
          ],
          method: `<p>CO₂ por cambio de COS = −ΔC × 44/12. N₂O directo = [N sintético × EF1<sub>sin</sub> + N orgánico × EF1<sub>org</sub>] × 44/28. N₂O indirecto = [(N sintético × FracGASF + N orgánico × FracGASM) × EF4 + N total × FracLEACH × EF5] × 44/28. CH₄ = cabezas × factor. Energía = combustible × factor. Todos los gases se convierten con ${gwp.label}. Rango = balance recalculado con los extremos de EF1.</p>`
        };
        T._csv = parts.map(p => ({ fuente: p.label, t_co2e: +p.v.toFixed(3), t_co2e_ha: +(p.v / area).toFixed(4), porcentaje: +(net ? 100 * p.v / net : 0).toFixed(1) }));
      }
      root.querySelector('#emGWP').addEventListener('change', update);
      root.querySelector('#emClimate').addEventListener('change', update);
      GL.bindCalc(root, ['emArea', 'emYears', 'emProd', 'emC0', 'emC1', 'emNfert', 'emNfix', 'emNres', 'emHeads', 'emEFent', 'emEFman', 'emDiesel', 'emGas', 'emElec', 'emLime', 'emUrea', 'emEFelec'], update);
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_emisiones_GEI.csv', this._csv); }
  };
  GL.tool(T8);

  /* ======================================================================
     09 · FACTORES LIMITANTES DE RENDIMIENTO
     ====================================================================== */
  const T9 = {
    id: 'yield-limiting',
    suite: 'soil',
    title: 'Factores limitantes de rendimiento',
    desc: 'Cruce análisis de suelo con mapa de rendimiento o NDVI: empareja puntos, calcula correlaciones, ordena los factores que más limitan y compara con rangos de suficiencia por cultivo.',
    tags: ['Fertilidad', 'Rendimiento', 'NDVI', 'Correlación'],
    keywords: 'factor limitante rendimiento ndvi analisis suelo correlacion fosforo potasio ph materia organica',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Archivos de entrada</h2><p>Ambos CSV deben compartir coordenadas (x, y / lon, lat) o un identificador de punto.</p></div></div>
            <div class="grid-2">
              <div>
                <div class="mini-title">Análisis de suelo</div>
                <div class="dropzone" id="ylSoil"><div class="dz-ico">▤</div><b>CSV de suelo</b><small>x, y o id · pH, P, K, MO, CIC…</small><input type="file" id="ylSoilFile" accept=".csv" hidden></div>
                <div class="file-list" id="ylSoilInfo"></div>
              </div>
              <div>
                <div class="mini-title">Rendimiento o NDVI</div>
                <div class="dropzone" id="ylYield"><div class="dz-ico">▤</div><b>CSV de rendimiento</b><small>x, y o id · yield, ndvi, rinde…</small><input type="file" id="ylYieldFile" accept=".csv" hidden></div>
                <div class="file-list" id="ylYieldInfo"></div>
              </div>
            </div>
            <div class="grid-3" style="margin-top:14px">
              ${selectField('ylCrop', 'Cultivo de referencia', Object.keys(D.crops).map(k => ({ id: k, label: D.crops[k].label })), 'maiz')}
              <label class="field"><span>Método de emparejamiento</span><select id="ylJoin">
                <option value="">Selecciona el método</option>
                <option value="id">Identificador único de muestra</option>
                <option value="geo">Longitud y latitud WGS 84</option>
                <option value="metric">Este y norte en metros · mismo CRS</option>
              </select></label>
              ${field('ylRadius', 'Radio de emparejamiento', 'm', '50')}
              ${field('ylYieldCol', 'Columna de rendimiento (opcional)', '', 'auto')}
            </div>
            <div class="btn-row"><button class="btn sm" id="ylTemplate">↓ Plantilla de suelo</button><button class="btn sm" id="ylTemplateY">↓ Plantilla de rendimiento</button></div>
          </section>
          <section class="panel">
            <div class="panel-title">Ranking de factores</div>
            <div class="table-wrap" style="max-height:360px"><table><thead><tr><th>Variable</th><th class="num">Media</th><th class="num">r</th><th class="num">p</th><th class="num">n</th><th>Estado</th></tr></thead><tbody id="ylTable"><tr><td colspan="6" class="name" style="color:var(--faint)">Cargue ambos archivos para calcular.</td></tr></tbody></table></div>
            <div class="note" style="margin-top:10px">r de Pearson entre la variable y el rendimiento. Un r positivo con media por debajo del rango de suficiencia es el patrón típico de un factor limitante. Correlación no implica causalidad.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Diagnóstico</div>
            <div class="metrics three">
              ${metric('ylPairs', 'Puntos emparejados', '', true)}
              ${metric('ylBest', 'Factor principal', '')}
              ${metric('ylR2', 'R² del modelo', '')}
              ${metric('ylYieldMean', 'Rendimiento medio', '')}
              ${metric('ylNDVI', 'NDVI medio', '')}
              ${metric('ylCoverage', 'Cobertura', '%')}
            </div>
            <div class="chart-wrap tall" style="margin-top:14px"><canvas id="ylChart"></canvas></div>
            <label class="field" style="margin-top:10px"><span>Variable a graficar</span><select id="ylVar"></select></label>
            <div id="ylVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Recomendaciones</div>
            <div id="ylRecs"><div class="note">El diagnóstico aparecerá al cargar los datos.</div></div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T9;
      let soil = null, yld = null, pairs = [], factors = [];

      const toNum = v => {
        if (v === null || v === undefined) return NaN;
        const s = String(v).trim().replace(/\s/g, '');
        if (!s) return NaN;
        if (s.includes(',') && s.includes('.')) return parseFloat(s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, ''));
        return parseFloat(s.replace(',', '.'));
      };
      const findCol = (headers, names) => headers.find(h => names.indexOf(h.toLowerCase().trim()) >= 0);

      function parseSoil(txt, name) {
        const p = GL.parseCSV(txt);
        const hx = findCol(p.headers, ['x', 'lon', 'longitud', 'long', 'easting', 'este']);
        const hy = findCol(p.headers, ['y', 'lat', 'latitud', 'northing', 'norte']);
        const hid = findCol(p.headers, ['id', 'punto', 'sample_id', 'muestra', 'point']);
        const skip = new Set([hx, hy, hid].filter(Boolean));
        const vars = p.headers.filter(h => !skip.has(h) && p.rows.some(r => isFinite(toNum(r[h]))));
        const rows = p.rows.map(r => {
          const o = { x: hx ? toNum(r[hx]) : NaN, y: hy ? toNum(r[hy]) : NaN, id: hid ? String(r[hid]).trim() : '' };
          vars.forEach(v => o[v] = toNum(r[v]));
          return o;
        });
        soil = { rows, vars, name };
        root.querySelector('#ylSoilInfo').innerHTML = `<div class="file-item"><span class="ok">✓</span>${esc(name)}<span style="margin-left:auto">${rows.length} × ${vars.length}</span></div>`;
      }
      function parseYield(txt, name) {
        const p = GL.parseCSV(txt);
        const hx = findCol(p.headers, ['x', 'lon', 'longitud', 'long', 'easting', 'este']);
        const hy = findCol(p.headers, ['y', 'lat', 'latitud', 'northing', 'norte']);
        const hid = findCol(p.headers, ['id', 'punto', 'sample_id', 'muestra', 'point']);
        const forced = root.querySelector('#ylYieldCol').value.trim();
        let hv = forced && forced !== 'auto' ? p.headers.find(h => h.toLowerCase() === forced.toLowerCase()) : findCol(p.headers, ['yield', 'rendimiento', 'rinde', 'ndvi', 'prod', 'produccion', 't_ha']);
        if (!hv) hv = p.headers.find(h => h !== hx && h !== hy && h !== hid && p.rows.some(r => isFinite(toNum(r[h]))));
        const rows = p.rows.map(r => ({ x: hx ? toNum(r[hx]) : NaN, y: hy ? toNum(r[hy]) : NaN, id: hid ? String(r[hid]).trim() : '', v: hv ? toNum(r[hv]) : NaN })).filter(r => isFinite(r.v));
        yld = { rows, col: hv, name };
        root.querySelector('#ylYieldInfo').innerHTML = `<div class="file-item"><span class="ok">✓</span>${esc(name)}<span style="margin-left:auto">${rows.length} · ${esc(hv || '—')}</span></div>`;
      }

      let matchIssue='';
      function match() {
        pairs=[];
        matchIssue='';
        if(!soil||!yld)return;
        const mode=root.querySelector('#ylJoin').value;
        if(!mode){matchIssue='Selecciona el método de emparejamiento de los dos archivos.';return;}
        if(!soil.rows.length||!yld.rows.length){matchIssue='Ambos archivos requieren registros válidos.';return;}
        if(mode==='id'){
          const soilIds=new Map(soil.rows.map(row=>[row.id,row]));
          const valid=rows=>rows.every(row=>row.id)&&new Set(rows.map(row=>row.id)).size===rows.length;
          if(!valid(soil.rows)||!valid(yld.rows)){matchIssue='Cada archivo necesita identificadores no vacíos y únicos.';return;}
          pairs=yld.rows.filter(row=>soilIds.has(row.id)).map(y=>({y,s:soilIds.get(y.id),d:0}));
          return;
        }
        const radius=Math.max(1,num('ylRadius',50));
        const valid=row=>Number.isFinite(row.x)&&Number.isFinite(row.y)&&
          (mode!=='geo'||(Math.abs(row.x)<=180&&Math.abs(row.y)<=90));
        if(!soil.rows.every(valid)||!yld.rows.every(valid)){matchIssue='Las coordenadas no son válidas para el método indicado.';return;}
        const distance=(a,b)=>mode==='geo'?GL.geo.haversine([a.x,a.y],[b.x,b.y]):Math.hypot(a.x-b.x,a.y-b.y);
        for(const y of yld.rows){
          let best=null, nearest=Infinity;
          for(const soilRow of soil.rows){
            const d=distance(soilRow,y);
            if(d<nearest){best=soilRow;nearest=d;}
          }
          if(best&&nearest<=radius)pairs.push({y,s:best,d:nearest});
        }
      }

      function update() {
        const crop = D.crops[root.querySelector('#ylCrop').value] || D.crops.maiz;
        match();
        factors = [];
        if (pairs.length >= 3 && soil) {
          soil.vars.forEach(v => {
            const xs = [], ys = [];
            pairs.forEach(p => { if (isFinite(p.s[v]) && isFinite(p.y.v)) { xs.push(p.s[v]); ys.push(p.y.v); } });
            if (xs.length < 3) return;
            const lr = GL.stat.linreg(xs, ys);
            const mean = GL.stat.mean(xs);
            let status = 'sin referencia', tone = 'info';
            const key = (D.soilVars[v] || {}).cropKey;
            const ref = key ? crop[key] : null;
            if (ref) {
              const lo = Array.isArray(ref) ? ref[0] : ref, hi = Array.isArray(ref) ? ref[1] : ref;
              if (mean < lo) { status = 'bajo'; tone = 'bad'; }
              else if (mean > hi) { status = 'alto'; tone = 'warn'; }
              else { status = 'óptimo'; tone = 'ok'; }
            } else if (D.soilVars[v]) {
              const dv = D.soilVars[v];
              if (dv.max !== undefined && mean > dv.max) { status = 'exceso'; tone = 'bad'; }
              else if (dv.min !== undefined && mean < dv.min) { status = 'bajo'; tone = 'warn'; }
              else { status = 'sin umbral'; }
            }
            factors.push({ v, label: (D.soilVars[v] || {}).label || v, unit: (D.soilVars[v] || {}).unit || '', mean, r: lr.r, p: lr.p, n: xs.length, status, tone, lr, xs, ys });
          });
          factors.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
        }
        const yMean = pairs.length ? GL.stat.mean(pairs.map(p => p.y.v)) : 0;
        const isNDVI = yld && /ndvi/i.test(yld.col || '');
        GL.out('ylPairs', fmt(pairs.length, 0));
        GL.out('ylBest', factors.length ? factors[0].label : '—');
        GL.out('ylR2', factors.length ? fmt(factors[0].r * factors[0].r, 2) : '—');
        GL.out('ylYieldMean', pairs.length ? (isNDVI ? fmt(yMean, 3) : fmt(yMean, 2)) : '—');
        GL.out('ylNDVI', isNDVI && pairs.length ? fmt(yMean, 3) : '—');
        GL.out('ylCoverage', yld && yld.rows.length ? fmt(100 * pairs.length / yld.rows.length, 0) + ' %' : '—');

        root.querySelector('#ylTable').innerHTML = factors.length ? factors.map(f => `<tr>
          <td class="name">${esc(f.label)}${f.unit ? ` <span style="color:var(--faint)">${esc(f.unit)}</span>` : ''}</td>
          <td class="num">${fmt(f.mean, 2)}</td><td class="num">${GL.signed(f.r, 2)}</td>
          <td class="num">${f.p < 0.001 ? '<0,001' : fmt(f.p, 3)}</td><td class="num">${f.n}</td>
          <td><span class="pill ${f.tone === 'bad' ? 'warn' : f.tone === 'ok' ? 'local' : ''}" style="font-size:8.5px">${f.status}</span></td></tr>`).join('') : '<tr><td colspan="6" class="name" style="color:var(--faint)">Sin pares suficientes o sin variables numéricas comparables.</td></tr>';

        const varSel = root.querySelector('#ylVar');
        const prev = varSel.value;
        varSel.innerHTML = factors.map(f => `<option value="${esc(f.v)}">${esc(f.label)}</option>`).join('');
        if (factors.some(f => f.v === prev)) varSel.value = prev;

        const drawChart = () => {
          const f = factors.find(x => x.v === varSel.value) || factors[0];
          if (!f) { GL.chart(root.querySelector('#ylChart'), { series: [] }); return; }
          const lo = Math.min.apply(null, f.xs), hi = Math.max.apply(null, f.xs);
          const line = [[lo, f.lr.intercept + f.lr.slope * lo], [hi, f.lr.intercept + f.lr.slope * hi]];
          GL.chart(root.querySelector('#ylChart'), {
            series: [
              { name: f.label, type: 'scatter', points: true, color: '#66C7E8', r: 3.2, data: f.xs.map((x, i) => [x, f.ys[i]]) },
              { name: 'Ajuste', data: line, color: '#F2B45A', width: 2, points: false }
            ],
            x: { label: f.label + (f.unit ? ' (' + f.unit + ')' : '') },
            y: { label: isNDVI ? 'NDVI' : 'Rendimiento' }
          });
        };
        varSel.onchange = drawChart;
        drawChart();

        const limiting = factors.filter(f => (f.status === 'bajo' && f.r > .25) || (['alto','exceso'].includes(f.status) && f.r < -.25)).sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
        if (!pairs.length) {
          GL.setVerdict('ylVerdict', 'info', 'Sin emparejamiento', matchIssue||'Carga ambos CSV y verifica que compartan identificadores o coordenadas dentro del radio.');
        } else if (limiting.length) {
          const top = limiting[0];
          GL.setVerdict('ylVerdict', 'warn', `Posible limitante: ${esc(top.label)}`,
            `${esc(top.label)} está en ${top.status} (media ${fmt(top.mean, 2)} ${top.unit}) y correlaciona ${top.r > 0 ? 'positivamente' : 'negativamente'} con el rendimiento (r = ${GL.signed(top.r, 2)}, p = ${top.p < 0.001 ? '<0,001' : fmt(top.p, 3)}). Priorice un plan de corrección y verifique con un ensayo.`);
        } else if (factors.length) {
          const top = factors[0];
          GL.setVerdict('ylVerdict', 'ok', 'Sin limitante nutricional evidente',
            `La variable con mayor asociación es ${esc(top.label)} (r = ${GL.signed(top.r, 2)}), pero su media está en estado ${top.status}. Revise agua, compactación, sanidad y manejo antes de fertilizar a ciegas.`);
        }
        root.querySelector('#ylRecs').innerHTML = (limiting.length ? limiting.slice(0, 4) : factors.slice(0, 3)).map(f => {
          const rec = f.status === 'bajo' ? `Elevar ${f.label} hacia el rango de suficiencia con un plan balanceado; evite aplicaciones de choque sin análisis de respuesta.`
            : f.status === 'exceso' ? `Reducir o redistribuir ${f.label}; un exceso puede inducir antagonismos con otros nutrientes.`
              : `Mantener ${f.label} y monitorear su evolución entre campañas.`;
          return `<div class="method-item"><i>→</i><div><b>${esc(f.label)} · ${esc(f.status)}</b><small>${esc(rec)} Asociación con rendimiento: r = ${GL.signed(f.r, 2)} (n = ${f.n}).</small></div></div>`;
        }).join('') || '<div class="note">Cargue datos con al menos 3 puntos emparejados.</div>';

        T._report=null;
        T._csv=null;
        if(!pairs.length)return;
        T._report = {
          title: 'Factores limitantes de rendimiento',
          subtitle: `Cultivo ${crop.label} · ${pairs.length} puntos emparejados`,
          inputs: [['Archivo de suelo', soil ? soil.name : '—'], ['Archivo de rendimiento', yld ? yld.name + ' · ' + yld.col : '—'], ['Método', root.querySelector('#ylJoin').selectedOptions[0].textContent], ['Radio', fmt(num('ylRadius', 50), 0) + ' m'], ['Cultivo', crop.label]],
          results: [['Puntos emparejados', fmt(pairs.length, 0), ''], ['Cobertura', yld && yld.rows.length ? fmt(100 * pairs.length / yld.rows.length, 0) + ' %' : '—', ''], ['Factor principal', factors[0] ? factors[0].label : '—', ''], ['R² principal', factors[0] ? fmt(factors[0].r ** 2, 2) : '—', ''], ['Rendimiento medio', pairs.length ? fmt(yMean, 3) : '—', isNDVI ? 'NDVI' : '']],
          extra: `<table><thead><tr><th>Variable</th><th>Media</th><th>r</th><th>p</th><th>Estado</th></tr></thead><tbody>${factors.map(f => `<tr><td>${esc(f.label)}</td><td>${fmt(f.mean, 2)}</td><td>${GL.signed(f.r, 2)}</td><td>${f.p < 0.001 ? '<0,001' : fmt(f.p, 3)}</td><td>${f.status}</td></tr>`).join('')}</tbody></table>`,
          notes: [
            'La correlación es exploratoria: no demuestra causalidad ni reemplaza un ensayo de respuesta a fertilizantes.',
            'Si se usan coordenadas métricas, ambos archivos deben compartir el mismo CRS en metros. El vecino más cercano puede reutilizar una muestra de suelo; la independencia y el valor p requieren revisión.',
            'Los rangos de suficiencia varían por método de análisis (Olsen, Bray, Mehlich), textura, clima y cultivar. Ajuste la tabla a su laboratorio.',
            'Un R² alto con pocos puntos puede ser producto del azar; revise el valor p y el tamaño de muestra.'
          ],
          method: '<p>Emparejamiento por identificador o vecino más cercano dentro del radio declarado. Para cada variable se calcula Pearson r, pendiente e intercepto por mínimos cuadrados y valor p bilateral. El estado se compara con rangos de suficiencia del cultivo.</p>'
        };
        T._csv = factors.map(f => ({ variable: f.label, media: +f.mean.toFixed(3), r: +f.r.toFixed(3), p: +f.p.toFixed(5), n: f.n, estado: f.status }));
      }

      function wireDrop(zoneId, inputId, handler) {
        const z = root.querySelector('#' + zoneId);
        root.querySelector('#' + inputId).addEventListener('change', e => { const f = e.target.files[0]; if (f) GL.geo.readAsText(f).then(t => handler(t, f.name)).catch(err => GL.toast(err.message, 'bad')); });
        ['dragover', 'dragenter'].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.add('drag'); }));
        ['dragleave', 'drop'].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.remove('drag'); }));
        z.addEventListener('drop', e => {
          const f = e.dataTransfer.files[0]; if (!f) return;
          GL.geo.readAsText(f).then(t => handler(t, f.name)).catch(err => GL.toast(err.message, 'bad'));
        });
      }
      wireDrop('ylSoil', 'ylSoilFile', (txt, name) => { try { parseSoil(txt, name); match(); update(); } catch (e) { GL.toast('CSV de suelo: ' + e.message, 'bad'); } });
      wireDrop('ylYield', 'ylYieldFile', (txt, name) => { try { parseYield(txt, name); match(); update(); } catch (e) { GL.toast('CSV de rendimiento: ' + e.message, 'bad'); } });
      root.querySelector('#ylCrop').addEventListener('change', update);
      root.querySelector('#ylJoin').addEventListener('change',update);
      T._report=null;
      T._csv=null;
      GL.bindCalc(root, ['ylRadius'], update);
      root.querySelector('#ylTemplate').addEventListener('click', () => {
        GL.csvDownload('GOL_plantilla_suelo.csv', [
          { id: 'P1', x: -76.10, y: -12.10, ph: 5.6, p: 8, k: 110, om: 1.8, cec: 12 },
          { id: 'P2', x: -76.08, y: -12.12, ph: 6.1, p: 14, k: 150, om: 2.4, cec: 15 },
          { id: 'P3', x: -76.06, y: -12.09, ph: 6.4, p: 18, k: 175, om: 2.9, cec: 18 }
        ]);
      });
      root.querySelector('#ylTemplateY').addEventListener('click', () => {
        GL.csvDownload('GOL_plantilla_rendimiento.csv', [
          { id: 'P1', x: -76.10, y: -12.10, yield: 5.2 },
          { id: 'P2', x: -76.08, y: -12.12, yield: 7.4 },
          { id: 'P3', x: -76.06, y: -12.09, yield: 8.1 }
        ]);
      });
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_factores_limitantes.csv', this._csv); }
  };
  GL.tool(T9);
})();
