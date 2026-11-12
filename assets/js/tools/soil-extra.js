/* ==========================================================================
   Green Owl Labs · Suelo (ampliación)
   10 · Triángulo textural USDA interactivo + funciones de pedotransferencia
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL, fmt = GL.fmt, esc = GL.escape, U = GL.ui;

  /* Clases USDA y valores típicos referenciales (no normativos) */
  const CLASSES = {
    'Arena':              { group: 'sand',  fc: 0.05, wp: 0.02, ks: 120, bd: 1.60, note: 'Drenaje muy rápido; baja retención de agua y nutrientes.' },
    'Arena franca':       { group: 'sand',  fc: 0.07, wp: 0.03, ks: 60,  bd: 1.55, note: 'Drenaje rápido; riego frecuente y en dosis pequeñas.' },
    'Franco arenoso':     { group: 'loam',  fc: 0.12, wp: 0.05, ks: 25,  bd: 1.50, note: 'Buena aireación; retención moderada.' },
    'Franco':             { group: 'loam',  fc: 0.22, wp: 0.10, ks: 8,   bd: 1.40, note: 'Textura equilibrada; apta para la mayoría de cultivos.' },
    'Franco limoso':      { group: 'silt',  fc: 0.28, wp: 0.12, ks: 4,   bd: 1.35, note: 'Alta retención; cuidar sellado superficial y erosión.' },
    'Limo':               { group: 'silt',  fc: 0.32, wp: 0.14, ks: 2,   bd: 1.30, note: 'Muy alta retención; susceptible a costra y erosión hídrica.' },
    'Franco arcilloso arenoso': { group: 'clay', fc: 0.25, wp: 0.14, ks: 2.5, bd: 1.42, note: 'Mezcla de arena y arcilla; vigilar compactación.' },
    'Franco arcilloso':   { group: 'clay',  fc: 0.30, wp: 0.17, ks: 1.2, bd: 1.35, note: 'Retención alta; sensible al laboreo en húmedo.' },
    'Franco arcilloso limoso': { group: 'clay', fc: 0.33, wp: 0.19, ks: 0.8, bd: 1.32, note: 'Alta retención y plasticidad; drenaje moderado a lento.' },
    'Arcilla arenosa':    { group: 'clay',  fc: 0.30, wp: 0.20, ks: 0.6, bd: 1.38, note: 'Drenaje lento; riesgo de anegamiento y compactación.' },
    'Arcilla limosa':     { group: 'clay',  fc: 0.38, wp: 0.24, ks: 0.2, bd: 1.25, note: 'Drenaje muy lento; manejo cuidadoso de la estructura.' },
    'Arcilla':            { group: 'clay',  fc: 0.40, wp: 0.25, ks: 0.15, bd: 1.20, note: 'Máxima retención; baja infiltración y aireación.' }
  };
  const GROUP_COLOR = {
    sand: 'rgba(242,180,90,.16)',
    loam: 'rgba(139,224,90,.13)',
    silt: 'rgba(102,199,232,.14)',
    clay: 'rgba(180,164,245,.16)'
  };
  const GROUP_RING = { sand: '#F2B45A', loam: '#8BE05A', silt: '#66C7E8', clay: '#B4A4F5' };
  const GROUP_LABEL = { sand: 'Arenoso', loam: 'Franco', silt: 'Limoso', clay: 'Arcilloso' };

  /* Clasificación textural USDA (reglas estándar, tolerancia 0,01) */
  function classify(sand, silt, clay) {
    const e = 0.01;
    if (clay >= 40 - e && silt >= 40 - e) return 'Arcilla limosa';
    if (clay >= 40 - e && sand <= 45 + e) return 'Arcilla';
    if (clay >= 35 - e && sand >= 45 - e) return 'Arcilla arenosa';
    if (clay >= 27 - e && sand <= 20 + e) return 'Franco arcilloso limoso';
    if (clay >= 27 - e && sand > 20 && sand <= 45 + e) return 'Franco arcilloso';
    if (clay >= 20 - e && sand > 45 + e) return 'Franco arcilloso arenoso';
    if (silt >= 80 - e && clay < 12 + e) return 'Limo';
    if (silt >= 50 - e && clay < 27 + e) return 'Franco limoso';
    if (clay >= 7 - e && clay < 27 + e && silt >= 28 - e && silt < 50 + e && sand <= 52 + e) return 'Franco';
    if (silt + 1.5 * clay < 15 + e) return 'Arena';
    if (silt + 2 * clay < 30 + e) return 'Arena franca';
    return 'Franco arenoso';
  }

  const T = {
    id: 'soil-texture',
    suite: 'soil',
    storeKeys: [],
    title: 'Triángulo textural USDA interactivo',
    desc: 'Arrastra la composición de arena, limo y arcilla sobre el triángulo USDA, identifica la clase textural y estima capacidad de campo, agua disponible, conductividad y densidad aparente con valores típicos por clase.',
    tags: ['Textura', 'USDA', 'Suelo', 'Agua'],
    keywords: 'triangulo textural usda arena limo arcilla clase franco capacidad de campo agua disponible conductividad densidad aparente pedotransferencia',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Composición textural</h2><p>Arrastra el marcador dentro del triángulo o ajusta los controles.</p></div><span class="mono" id="txTop">—</span></div>
            <div class="chart-wrap" style="height:340px"><canvas id="txCanvas"></canvas></div>
            <div class="grid-2" style="margin-top:10px">
              ${U.slider('txSand', 'Arena', '%', 40, 0, 100, 1)}
              ${U.slider('txClay', 'Arcilla', '%', 25, 0, 100, 1)}
            </div>
            <div class="compbar" id="txBar" style="margin-top:12px"></div>
            <div class="compbar-legend" id="txLeg"></div>
            <div class="explore-hint" style="margin-top:12px"><b>Interactivo:</b> el puntero muestra la clase bajo el cursor; el marcador se puede arrastrar.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Clase textural <span class="tag" id="txGroup">—</span></div>
            <div class="metrics">
              ${U.metric('txCls', 'Clase USDA', '', true)}
              ${U.metric('txSilt', 'Limo', '%')}
              ${U.metric('txFC', 'Capacidad de campo', '% vol')}
              ${U.metric('txAW', 'Agua disponible', 'mm/m')}
              ${U.metric('txKs', 'Conductividad Ks', 'mm/h')}
              ${U.metric('txBD', 'Densidad aparente', 'g/cm³')}
            </div>
            <div id="txVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Lectura agronómica</div>
            <div class="kv" id="txKv"></div>
            <div class="note" style="margin-top:12px">La clase se obtiene con las reglas USDA sobre la composición declarada. Los valores hidráulicos son <b>típicos por clase</b>, referenciales y editables: no reemplazan una curva de retención medida ni un ensayo de infiltración.</div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const cv = root.querySelector('#txCanvas');
      const ctx = cv.getContext('2d');
      const mono = getComputedStyle(document.documentElement).getPropertyValue('--mono') || 'monospace';
      const sans = getComputedStyle(document.documentElement).getPropertyValue('--sans') || 'sans-serif';
      let sand = 40, clay = 25, hover = null, drag = false;
      let geo = null, bg = null, bgKey = '';

      function layout() {
        const W = cv.parentElement.clientWidth, H = cv.parentElement.clientHeight;
        const dpr = Math.min(2.5, window.devicePixelRatio || 1);
        const padL = 46, padR = 46, padT = 18, padB = 32;
        const pw = Math.max(40, W - padL - padR), ph = Math.max(40, H - padT - padB);
        const key = W + 'x' + H + '@' + dpr;
        const changed = key !== bgKey;
        if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
          cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        geo = { W, H, dpr, padL, padT, pw, ph, A: { x: padL + pw / 2, y: padT }, B: { x: padL, y: padT + ph }, C: { x: padL + pw, y: padT + ph } };
        bgKey = key;
        return changed;
      }
      const xy = (s, si, c) => ({ x: geo.padL + geo.pw * (si / 100 + c / 200), y: geo.padT + geo.ph * (1 - c / 100) });

      function fromXY(px, py) {
        const c = (geo.padT + geo.ph - py) / geo.ph * 100;
        const rel = (px - geo.padL) / geo.pw;
        const si = (rel - c / 200) * 100;
        const s = 100 - c - si;
        let cl = Math.max(0, Math.min(100, c));
        let sa = Math.max(0, Math.min(100, s));
        let sl = Math.max(0, Math.min(100, si));
        const tot = cl + sa + sl;
        if (tot <= 0) return { sand: 100, clay: 0, silt: 0 };
        return { sand: Math.round(sa / tot * 100), clay: Math.round(cl / tot * 100), silt: Math.round(sl / tot * 100) };
      }

      function renderBase() {
        const { W, H, padL, padT, pw, ph } = geo;
        bg = document.createElement('canvas');
        bg.width = cv.width; bg.height = cv.height;
        const g = bg.getContext('2d');
        g.setTransform(geo.dpr, 0, 0, geo.dpr, 0, 0);
        g.clearRect(0, 0, W, H);
        // regiones por clase (raster)
        const step = 2;
        for (let y = padT; y <= padT + ph; y += step) {
          for (let x = padL; x <= padL + pw; x += step) {
            const c = (padT + ph - y) / ph * 100;
            const si = ((x - padL) / pw - c / 200) * 100;
            const s = 100 - c - si;
            if (c < -0.5 || si < -0.5 || s < -0.5) continue;
            const cls = classify(Math.max(0, s), Math.max(0, si), Math.max(0, c));
            g.fillStyle = GROUP_COLOR[CLASSES[cls].group];
            g.fillRect(x, y, step + 0.5, step + 0.5);
          }
        }
        // retícula cada 10 %
        for (let v = 10; v < 100; v += 10) {
          g.strokeStyle = v % 20 === 0 ? 'rgba(180,205,190,.26)' : 'rgba(180,205,190,.12)';
          g.lineWidth = 1;
          let p1 = xy(100 - v, 0, v), p2 = xy(0, 100 - v, v);
          g.beginPath(); g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.stroke();
          p1 = xy(v, 100 - v, 0); p2 = xy(v, 0, 100 - v);
          g.beginPath(); g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.stroke();
          p1 = xy(100 - v, v, 0); p2 = xy(0, v, 100 - v);
          g.beginPath(); g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.stroke();
        }
        // borde
        g.strokeStyle = 'rgba(200,225,210,.55)'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(geo.B.x, geo.B.y); g.lineTo(geo.A.x, geo.A.y); g.lineTo(geo.C.x, geo.C.y); g.closePath(); g.stroke();

        // números y rótulos de ejes
        g.font = '9px ' + mono;
        g.fillStyle = 'rgba(190,212,200,.78)';
        for (let v = 0; v <= 100; v += 20) {
          const p = xy(100 - v, v, 0);
          g.textAlign = 'center'; g.textBaseline = 'top';
          g.fillText(String(100 - v), p.x, p.y + 5);
          const q = xy(100 - v, 0, v);
          g.save(); g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(String(v), q.x - 7, q.y); g.restore();
          const r = xy(0, 100 - v, v);
          g.save(); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(String(v), r.x + 7, r.y); g.restore();
        }
        g.fillStyle = 'rgba(190,212,200,.9)';
        g.textAlign = 'center'; g.textBaseline = 'bottom';
        g.fillText('Arena (%)', padL + pw * 0.3, H - 1);
        g.save(); g.translate(13, padT + ph * 0.55); g.rotate(-Math.PI / 2); g.fillText('Arcilla (%)', 0, 0); g.restore();
        g.save(); g.translate(W - 11, padT + ph * 0.55); g.rotate(Math.PI / 2); g.fillText('Limo (%)', 0, 0); g.restore();
      }

      function draw() {
        if (!cv.isConnected || !cv.parentElement || cv.parentElement.clientWidth < 2 || cv.parentElement.clientHeight < 2) return;
        const changed = layout();
        if (changed || !bg) renderBase();
        const { W, H } = geo;
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(bg, 0, 0, W, H);

        const silt = Math.max(0, 100 - sand - clay);
        const cls = classify(sand, silt, clay);
        const ring = GROUP_RING[CLASSES[cls].group];
        const p = xy(sand, silt, clay);
        ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, 7.5, 0, Math.PI * 2); ctx.fillStyle = ring; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#07130d'; ctx.stroke();
        ctx.beginPath(); ctx.arc(p.x - 2, p.y - 2, 2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();

        if (hover) {
          const t = classify(hover.sand, hover.silt, hover.clay);
          ctx.font = '10px ' + sans;
          const w = ctx.measureText(t).width + 14;
          let bx = hover.x + 12, by = hover.y - 26;
          if (bx + w > W - 6) bx = hover.x - w - 12;
          if (by < 4) by = hover.y + 14;
          ctx.fillStyle = 'rgba(9,24,15,.95)';
          ctx.strokeStyle = 'rgba(180,205,190,.35)';
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(bx, by, w, 19, 5); else ctx.rect(bx, by, w, 19);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#EAF7EE'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(t, bx + 7, by + 10);
        }
      }

      function update() {
        if (sand + clay > 100) clay = Math.max(0, 100 - sand);
        const silt = Math.max(0, 100 - sand - clay);
        const cls = classify(sand, silt, clay);
        const c = CLASSES[cls];
        const aw = Math.round((c.fc - c.wp) * 1000);
        const sSand = root.querySelector('#txSand'), sClay = root.querySelector('#txClay');
        sSand.value = sand; sClay.value = clay;
        GL.syncRange(sSand); GL.syncRange(sClay);
        GL.out('txCls', cls);
        GL.out('txSilt', fmt(silt, 0) + ' %');
        GL.out('txFC', fmt(c.fc * 100, 0));
        GL.out('txAW', fmt(aw, 0));
        GL.out('txKs', fmt(c.ks, c.ks < 1 ? 2 : 1));
        GL.out('txBD', fmt(c.bd, 2));
        root.querySelector('#txTop').textContent = `${sand}/${silt}/${clay}`;
        const tag = root.querySelector('#txGroup');
        tag.textContent = GROUP_LABEL[c.group];
        tag.className = 'tag';
        const color = GROUP_RING[c.group];
        tag.style.color = color; tag.style.borderColor = color + '66';

        root.querySelector('#txBar').innerHTML = `<span style="width:${sand}%;background:#F2B45A" title="Arena ${sand}%"></span><span style="width:${silt}%;background:#66C7E8" title="Limo ${silt}%"></span><span style="width:${clay}%;background:#B4A4F5" title="Arcilla ${clay}%"></span>`;
        root.querySelector('#txLeg').innerHTML = `<span><i style="background:#F2B45A"></i>Arena <b>${sand}%</b></span><span><i style="background:#66C7E8"></i>Limo <b>${silt}%</b></span><span><i style="background:#B4A4F5"></i>Arcilla <b>${clay}%</b></span>`;

        root.querySelector('#txKv').innerHTML = `
          <dt>Grupo textural</dt><dd>${GROUP_LABEL[c.group]}</dd>
          <dt>Agua disponible</dt><dd>${fmt((c.fc - c.wp) * 100, 1)} % vol</dd>
          <dt>Lámina en 60 cm</dt><dd>${fmt(aw * 0.6, 0)} mm</dd>
          <dt>Infiltración básica</dt><dd>${fmt(c.ks, c.ks < 1 ? 2 : 1)} mm/h</dd>
          <dt>Porosidad estimada</dt><dd>${fmt((1 - c.bd / 2.65) * 100, 0)} %</dd>`;

        const tone = c.group === 'sand' ? 'warn' : c.group === 'clay' ? 'info' : 'ok';
        GL.setVerdict('txVerdict', tone, `${cls} · ${GROUP_LABEL[c.group]}`,
          `${c.note} Agua disponible ≈ ${fmt(aw, 0)} mm/m (${fmt(aw * 0.6, 0)} mm en 60 cm). Ajuste el manejo a la clase y confirme con datos locales.`);

        T._report = {
          title: 'Clasificación textural USDA y estimación hidráulica',
          subtitle: `${cls} · arena ${sand} %, limo ${fmt(silt, 0)} %, arcilla ${clay} %`,
          inputs: [['Arena', fmt(sand, 0) + ' %'], ['Limo', fmt(silt, 0) + ' %'], ['Arcilla', fmt(clay, 0) + ' %'], ['Clase USDA', cls]],
          results: [['Capacidad de campo', fmt(c.fc * 100, 0), '% vol'], ['Punto de marchitez', fmt(c.wp * 100, 0), '% vol'],
            ['Agua disponible', fmt(aw, 0), 'mm/m'], ['Conductividad saturada', fmt(c.ks, c.ks < 1 ? 2 : 1), 'mm/h'],
            ['Densidad aparente típica', fmt(c.bd, 2), 'g/cm³']],
          extra: `<p>${esc(c.note)}</p><p>Grupo textural: <b>${GROUP_LABEL[c.group]}</b>. Lámina disponible en 60 cm: ${fmt(aw * 0.6, 0)} mm.</p>`,
          notes: [
            'La clase textural se calcula con las reglas USDA sobre porcentajes de arena, limo y arcilla declarados; no sustituye un análisis granulométrico de laboratorio.',
            'Los valores de capacidad de campo, punto de marchitez, Ks y densidad son promedios típicos por clase, referenciales y editables. Varían con estructura, materia orgánica, compactación y salinidad.',
            'Para diseño de riego o balance hídrico, use curvas de retención y ensayos de infiltración del sitio.'
          ],
          method: '<p>Triángulo textural USDA con las 12 clases estándar. Las funciones de pedotransferencia son una tabla de valores típicos por clase (no una regresión calibrada).</p>'
        };
        T._csv = [{ arena_pct: sand, limo_pct: silt, arcilla_pct: clay, clase_usda: cls, grupo: GROUP_LABEL[c.group], capacidad_campo_pct: +(c.fc * 100).toFixed(1), agua_disponible_mm_m: aw, ks_mm_h: c.ks, densidad_aparente: c.bd }];

        draw();
      }

      function setFromPointer(e) {
        const r = cv.getBoundingClientRect();
        const p = fromXY(e.clientX - r.left, e.clientY - r.top);
        sand = p.sand; clay = p.clay;
        update();
      }

      cv.addEventListener('pointerdown', e => {
        drag = true;
        try { cv.setPointerCapture(e.pointerId); } catch (err) { }
        setFromPointer(e);
      });
      cv.addEventListener('pointermove', e => {
        const r = cv.getBoundingClientRect();
        const px = e.clientX - r.left, py = e.clientY - r.top;
        const p = fromXY(px, py);
        hover = { sand: p.sand, silt: p.silt, clay: p.clay, x: px, y: py };
        if (drag) setFromPointer(e); else draw();
      });
      cv.addEventListener('pointerup', () => { drag = false; });
      cv.addEventListener('pointercancel', () => { drag = false; });
      cv.addEventListener('pointerleave', () => { drag = false; hover = null; draw(); });

      GL.bindCalc(root, ['txSand', 'txClay'], () => {
        const sEl = root.querySelector('#txSand'), cEl = root.querySelector('#txClay');
        sand = Math.max(0, Math.min(100, Math.round(+sEl.value || 0)));
        clay = Math.max(0, Math.min(100, Math.round(+cEl.value || 0)));
        if (sand + clay > 100) {
          if (document.activeElement && document.activeElement.id === 'txSand') clay = 100 - sand;
          else sand = 100 - clay;
        }
        update();
      });

      update();
      const ro = new ResizeObserver(GL.debounce(() => { if (!cv.isConnected) { ro.disconnect(); return; } bg = null; bgKey = ''; draw(); }, 90));
      ro.observe(cv.parentElement);
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_textura_USDA.csv', this._csv); }
  };
  GL.tool(T);
})();
