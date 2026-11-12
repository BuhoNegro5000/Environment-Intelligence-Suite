/* ==========================================================================
   Green Owl Labs · app shell
   Rutas, navegación, portada, filtros y ciclo de vida de cada herramienta.
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL;
  const view = document.getElementById('view');
  const nav = document.getElementById('nav');
  const crumbs = document.getElementById('crumbs');
  const modalRoot = document.getElementById('modalRoot');
  const normalizeSearch = value => value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  function searchText(tool) {
    const categories = [tool.suite, ...tool.relatedSuites].map(id => GL.suites[id].name);
    return normalizeSearch([tool.title, tool.desc, ...categories, ...(tool.tags || []), tool.keywords || ''].join(' '));
  }

  /* --------------------------------------------------------------- theme */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeLbl').textContent = theme === 'dark' ? 'Tema claro' : 'Tema oscuro';
    document.getElementById('themeIco').textContent = theme === 'dark' ? '☀' : '☾';
    document.querySelector('meta[name="theme-color"]').setAttribute('content', theme === 'dark' ? '#07130d' : '#f2f4ef');
    GL.store.set('theme', theme);
    setTimeout(() => GL.redrawCharts(), 60);
  }
  const savedTheme = GL.store.get('theme', 'light');
  applyTheme(savedTheme);
  document.getElementById('themeBtn').addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ----------------------------------------------------------------- nav */
  const collapsed = GL.store.get('nav.collapsed', {});
  function buildNav(activeSuite, activeId) {
    const favCount = GL.favs().length;
    let html = `<div class="nav-group">
      <a class="nav-link ${!activeId && !activeSuite ? 'active' : ''}" href="#/"><span class="ni">⌂</span>Inicio</a>
      <a class="nav-link" href="#/catalogo"><span class="ni">▦</span>Catálogo científico</a>
      <a class="nav-link" href="#/tool/unit-converter"><span class="ni">⇄</span>Conversor de unidades</a>
      <a class="nav-link ${location.hash === '#/favoritos' ? 'active' : ''}" href="#/favoritos"><span class="ni">★</span>Favoritos ${favCount ? `<span class="badge-count" style="margin-left:auto">${favCount}</span>` : ''}</a>
    </div>`;
    Object.keys(GL.suites).forEach(sid => {
      const s = GL.suites[sid];
      const list = GL.toolsBySuite(sid);
      const isClosed = (collapsed[sid] ?? true) && activeSuite !== sid;
      html += `<div class="nav-group ${isClosed ? 'closed' : ''}" data-group="${sid}">
        <button class="nav-group-head" type="button" data-toggle="${sid}" aria-expanded="${!isClosed}" aria-controls="nav-${sid}">
          <span style="color:${s.color};font-size:11px">${s.icon}</span><b>${s.short}</b>
          <span class="count">${list.length}</span><span class="chev">▾</span>
        </button>
        <div class="nav-links" id="nav-${sid}">
          ${list.map(t => `<a class="nav-link ${activeId === t.id ? 'active' : ''}" href="#/tool/${t.id}"><span class="ni">${String(t.n).padStart(2, '0')}</span>${GL.escape(t.title)}</a>`).join('')}
        </div>
      </div>`;
    });
    nav.innerHTML = html;
    nav.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sid = btn.dataset.toggle;
        const group = btn.closest('.nav-group');
        group.classList.toggle('closed');
        collapsed[sid] = group.classList.contains('closed');
        btn.setAttribute('aria-expanded',String(!collapsed[sid]));
        GL.store.set('nav.collapsed', collapsed);
      });
    });
    document.getElementById('sideCount').textContent = GL.tools.length;
  }
  function syncNav(activeSuite, activeId) {
    nav.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
    if (activeId) {
      const link = nav.querySelector(`a[href="#/tool/${activeId}"]`);
      if (link) {
        link.classList.add('active');
        const g = link.closest('.nav-group');
        if (g) { g.classList.remove('closed'); g.querySelector('[data-toggle]')?.setAttribute('aria-expanded','true'); }
      }
    } else if (activeSuite) {
      const g = nav.querySelector(`[data-group="${activeSuite}"]`);
      if (g) { g.classList.remove('closed'); g.querySelector('[data-toggle]')?.setAttribute('aria-expanded','true'); }
    } else if (location.hash === '' || location.hash === '#/') {
      const link = nav.querySelector('a[href="#/"]');
      if (link) link.classList.add('active');
    } else if (location.hash === '#/favoritos') {
      const link = nav.querySelector('a[href="#/favoritos"]');
      if (link) link.classList.add('active');
    }
  }

  /* --------------------------------------------------------------- cards */
  function suiteColor(id) { return (GL.suites[id] || {}).color || '#5FE3A1'; }
  function toolCard(t) {
    const s = GL.suites[t.suite];
    return `<a class="tool-card" href="#/tool/${t.id}">
      <div class="tc-head">
        <span class="tc-num">${String(t.n).padStart(2, '0')}</span>
        <span class="tc-suite" style="color:${s.color}">${s.short}</span>
        <button class="tc-fav ${GL.isFav(t.id) ? 'on' : ''}" data-fav="${t.id}" title="Favorito">${GL.isFav(t.id) ? '★' : '☆'}</button>
      </div>
      <h3>${GL.escape(t.title)}</h3>
      <p>${GL.escape(t.desc)}</p>
      <div class="tc-foot">${(t.tags || []).slice(0, 3).map(x => `<span class="tag">${GL.escape(x)}</span>`).join('')}<span class="tc-arrow">→</span></div>
    </a>`;
  }
  function bindFavButtons(root) {
    root.querySelectorAll('[data-fav]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        const on = GL.toggleFav(btn.dataset.fav);
        btn.classList.toggle('on', on);
        btn.textContent = on ? '★' : '☆';
        GL.toast(on ? 'Añadido a favoritos' : 'Quitado de favoritos');
        buildNav();
        syncNav(currentRoute.suite, currentRoute.id);
      });
    });
  }

  /* ---------------------------------------------------------------- home */
  function pageHome() {
    const n = GL.tools.length;
    const suites = Object.keys(GL.suites);
    view.innerHTML = `
      <section class="hero">
        <div class="hero-inner">
          <div>
            <div class="eyebrow">Environmental Intelligence Suite</div>
            <h1>Precisión que <span class="thin">se puede defender.</span></h1>
            <p>${n} herramientas en español para agua, aguas residuales, suelo, aire, clima, biodiversidad y evaluación ambiental.</p>
            <div class="hero-actions">
              <a class="btn primary" href="#/suite/soil">Explorar herramientas →</a>
              <a class="btn" href="#/tool/unit-converter">⇄ Convertir unidades</a>
              <button class="btn" data-open-palette>⌕ Buscar por problema</button>
            </div>
            <div class="hero-stats">
              <div class="hero-stat"><b>${n}</b><span>HERRAMIENTAS</span></div>
              <div class="hero-stat"><b>${suites.length}</b><span>SUITES</span></div>
              <div class="hero-stat"><b>0</b><span>BYTES ENVIADOS</span></div>
              <div class="hero-stat"><b>100%</b><span>OFFLINE</span></div>
            </div>
          </div>
          <aside class="hero-panel">
            <div class="hero-panel-title"><span>Flujo de trabajo</span><span class="live">LOCAL</span></div>
            <div class="chain">
              <div class="chain-step"><i>01</i><div><b>Entra un dato de campo</b><small>Foto, CSV, SHP o lectura de instrumento.</small></div></div>
              <div class="chain-step"><i>02</i><div><b>Se calcula y se contrasta</b><small>Fórmula visible, unidades explícitas, alertas de rango.</small></div></div>
              <div class="chain-step"><i>03</i><div><b>Sale evidencia trazable</b><small>Resultado, memoria de cálculo e informe imprimible.</small></div></div>
            </div>
            <div class="hero-panel-foot"><span>green owl labs</span><span>v${GL.version}</span></div>
          </aside>
        </div>
      </section>

      <div class="section-head">
        <div><h2>Categorías de herramientas</h2><p>Explora las calculadoras por aplicación.</p></div>
        <span class="count-badge">${n} herramientas · ${suites.length} suites</span>
      </div>
      <div class="suite-grid">
        ${suites.map(sid => {
          const s = GL.suites[sid], list = GL.toolsBySuite(sid);
          return `<a class="suite-card" href="#/suite/${sid}" style="--sc:${s.color}">
            <div class="sc-bar"><span style="width:${Math.min(100, list.length * 11)}%"></span></div>
            <div class="sc-top"><span class="sc-ico" style="color:${s.color}">${s.icon}</span><span class="sc-n">${String(list.length).padStart(2, '0')} HERRAMIENTAS</span></div>
            <h3>${s.name}</h3><p>${s.desc}</p>
            <div class="sc-tags">${list.slice(0, 3).map(t => `<span class="tag">${GL.escape(t.tags ? t.tags[0] : '')}</span>`).join('')}</div>
          </a>`;
        }).join('')}
      </div>

      <div class="section-head">
        <div><h2>Todas las herramientas</h2><p>Filtra por suite o busca por síntoma: «ruido», «PTAR», «Munsell», «incertidumbre».</p></div>
      </div>
      <div class="toolbar">
        <div class="filter-input"><span class="fi">⌕</span><input id="homeFilter" placeholder="Buscar herramienta, magnitud o norma…" autocomplete="off"></div>
        <button class="chip on" data-filter="all">Todas</button>
        ${suites.map(sid => `<button class="chip" data-filter="${sid}" style="--sc:${GL.suites[sid].color}">${GL.suites[sid].short}</button>`).join('')}
      </div>
      <div class="tool-grid" id="homeGrid"></div>
      <div class="note" style="margin-top:22px">Green Owl Labs es una implementación independiente. Las fórmulas y criterios se documentan en cada herramienta; las tablas normativas son referenciales y deben verificarse contra la edición vigente en su jurisdicción.</div>
    `;
    const grid = document.getElementById('homeGrid');
    const input = document.getElementById('homeFilter');
    let filter = 'all';
    const render = () => {
      const terms = normalizeSearch(input.value).split(/\s+/).filter(Boolean);
      const list = GL.tools.filter(t => {
        if (filter !== 'all' && t.suite !== filter && !t.relatedSuites.includes(filter)) return false;
        if (!terms.length) return true;
        const hay = searchText(t);
        return terms.every(term => hay.includes(term));
      });
      grid.innerHTML = list.length ? list.map(toolCard).join('') : `<div class="empty">No hay herramientas que coincidan. Prueba con «carbono», «ruido», «agua» o «incertidumbre».</div>`;
      bindFavButtons(grid);
    };
    input.addEventListener('input', render);
    view.querySelectorAll('[data-filter]').forEach(chip => chip.addEventListener('click', () => {
      view.querySelectorAll('[data-filter]').forEach(c => c.classList.remove('on'));
      chip.classList.add('on');
      filter = chip.dataset.filter;
      render();
    }));
    render();
    bindFavButtons(view);
  }

  /* --------------------------------------------------------------- suite */
  function pageSuite(sid) {
    const s = GL.suites[sid];
    if (!s) return pageHome();
    const list = GL.toolsBySuite(sid);
    const related = GL.tools.filter(t => t.relatedSuites.includes(sid));
    view.innerHTML = `
      <header class="tool-head">
        <div class="kicker"><span style="color:${s.color}">${s.icon}</span><span class="k-suite">${s.name}</span></div>
        <h1>${s.name}</h1>
        <p class="lede">${s.desc}</p>
        <div class="tool-meta">
          <span class="pill local">Cálculo local</span>
          <span class="pill">${list.length} herramientas principales</span>
          <span class="pill">Informe imprimible</span>
        </div>
      </header>
      <div class="tool-grid">${list.map(toolCard).join('')}</div>
      ${related.length ? `<section aria-label="Herramientas relacionadas">
        <div class="section-head"><div><h2>Herramientas relacionadas</h2><p>Cálculos de otras categorías que también se aplican aquí.</p></div></div>
        <div class="tool-grid">${related.map(toolCard).join('')}</div>
      </section>` : ''}
    `;
    bindFavButtons(view);
  }

  /* ------------------------------------------------------------ favorites */
  function pageFavs() {
    const favs = GL.favs();
    const list = GL.tools.filter(t => favs.indexOf(t.id) >= 0);
    view.innerHTML = `
      <header class="tool-head">
        <div class="kicker">★ <span class="k-suite">Tu espacio</span></div>
        <h1>Favoritos</h1>
        <p class="lede">Las herramientas que marcaste quedan guardadas en este navegador. No viajan a ningún servidor.</p>
      </header>
      ${list.length ? `<div class="tool-grid">${list.map(toolCard).join('')}</div>` : `<div class="empty">Todavía no marcaste ninguna herramienta. Usa la estrella en cualquier tarjeta o en la cabecera de la herramienta.</div>`}
    `;
    bindFavButtons(view);
  }

  /* ---------------------------------------------------------------- about */
  function pageMetodo() {
    view.innerHTML = `
      <div class="about">
        <header class="tool-head">
          <div class="kicker">§ <span class="k-suite">Green Owl Labs</span></div>
          <h1>Método, privacidad y límites.</h1>
          <p class="lede">Una herramienta técnica sirve si puedes explicar de dónde sale el número. Esta plataforma expone la fórmula, las unidades y las suposiciones de cada cálculo, y mantiene tus datos fuera de cualquier servidor.</p>
        </header>
        <div class="about-grid">
          <div>
            <h2>Arquitectura local-first</h2>
            <p>Todo el procesamiento —incluidos CSV, imágenes, SHP, DBF, KML y GeoJSON— ocurre en tu navegador. No hay backend, telemetría ni carga de archivos. Si abres el archivo <span class="mono">index.html</span> sin conexión, las herramientas siguen funcionando salvo la tipografía del sistema.</p>
            <p>Los valores que escribes se guardan en <span class="mono">localStorage</span> para que no pierdas el trabajo al cambiar de herramienta. Puedes borrarlos con el botón <b>Restablecer</b> de cada herramienta o limpiando los datos del sitio.</p>

            <h2>Cómo se construye cada resultado</h2>
            <ol>
              <li><b>Entrada explícita.</b> Cada campo declara unidad y rango; los valores fuera de rango generan advertencias, no resultados silenciosos.</li>
              <li><b>Fórmula visible.</b> El bloque «Cómo se calcula» muestra la ecuación y los factores usados, con su fuente.</li>
              <li><b>Verificación dimensional.</b> Los resultados se expresan en unidades del SI o en las unidades normativas indicadas (t C/ha, µg/m³, dB, UIT).</li>
              <li><b>Incertidumbre cuando importa.</b> Las herramientas de decisión incorporan bandas de guarda, propagación de incertidumbre o intervalos de confianza.</li>
              <li><b>Evidencia.</b> Cada herramienta genera un informe con fecha, entradas, resultados, método y limitaciones.</li>
            </ol>

            <h2>Qué no es</h2>
            <p>Green Owl Labs no emite certificaciones, no sustituye un dictamen legal ni reemplaza el juicio de un profesional competente. Los límites normativos, factores de emisión y tablas de multas cambian por país y por año: están parametrizados y deben contrastarse con la norma vigente. Las herramientas de dispersión y de benchmark son modelos de cribado, no modelos regulatorios validados.</p>

            <h2>Sobre las herramientas de referencia</h2>
            <p>La plataforma reorganiza y amplía funciones de utilidad pública del ecosistema ambiental —cálculo de stock de carbono, validación de límites, análisis de color de suelo, dimensionamiento de PTAR, matrices de riesgo, metrología— con implementación propia, interfaz unificada, memoria de cálculo, exportación e informes. No se copiaron código, marcas ni activos de terceros. Los conjuntos de datos de demostración son sintéticos y están marcados como tales.</p>

            <h2>Atajos</h2>
            <table style="max-width:520px"><tbody>
              <tr><td class="name">Buscar herramienta</td><td>Ctrl / ⌘ + K</td></tr>
              <tr><td class="name">Cerrar diálogo</td><td>Esc</td></tr>
              <tr><td class="name">Navegar resultados</td><td>↑ ↓ + Enter</td></tr>
              <tr><td class="name">Imprimir informe</td><td>Ctrl / ⌘ + P (con el informe abierto)</td></tr>
            </tbody></table>

            <h2>Estado y versión</h2>
            <p>Versión ${GL.version} · ${GL.tools.length} herramientas · ${Object.keys(GL.suites).length} suites · sin dependencias externas. Diseñada para operar desde una carpeta local, una intranet o cualquier hosting estático.</p>
          </div>
          <aside class="stack">
            <div class="callout"><b>Compromiso de privacidad.</b><br>Ningún archivo, coordenada, fotografía o dato de laboratorio sale de tu equipo. No hay analítica, cookies de seguimiento ni cuentas.</div>
            <div class="panel">
              <div class="panel-title">Principios de cálculo</div>
              <div class="method-list">
                <div class="method-item"><i>01</i><div><b>Trazabilidad</b><small>Entrada, fórmula, factor y resultado en el mismo informe.</small></div></div>
                <div class="method-item"><i>02</i><div><b>Unidades explícitas</b><small>Sin conversiones ocultas; el sistema internacional como base.</small></div></div>
                <div class="method-item"><i>03</i><div><b>Honestidad estadística</b><small>Cuando el dato no alcanza para decidir, la herramienta lo dice.</small></div></div>
                <div class="method-item"><i>04</i><div><b>Reemplazable</b><small>Factores y tablas editables para adaptarse a cada jurisdicción.</small></div></div>
              </div>
            </div>
            <div class="panel">
              <div class="panel-title">Fuentes de referencia</div>
              <div class="note" style="font-size:10px">IPCC (2019 Refinement, AR6), GUM / EA-4/02, ISO/IEC 17025, ISO 1996-2, EPA AQI 2024, OMS 2021, APHA Standard Methods, D.S. 085-2003-PCM, D.S. 003-2017-MINAM, R.M. 050-2013-TR, D.S. 008-2020-TR, IWA/AWWA water balance, GARD Guide, Metcalf & Eddy, Briggs/Pasquill–Gifford, RFC 7946.</div>
            </div>
          </aside>
        </div>
      </div>
    `;
  }

  /* ----------------------------------------------------------- tool page */
  let currentTool = null;
  let currentRoute = { suite: null, id: null };

  function renderTool(t) {
    const s = GL.suites[t.suite];
    GL.clearCharts();
    currentTool = t;
    currentRoute = { suite: t.suite, id: t.id };
    document.title = t.title + ' · Green Owl Labs';
    const pilot=GL.calculatorUI.isPilot(t.id);
    const classicHeader=`<header class="tool-head">
          <div class="kicker"><span>${String(t.n).padStart(2, '0')}</span><span class="k-sep">/</span><span class="k-suite" style="color:${s.color}">${s.name}</span></div>
          <h1>${GL.escape(t.title)}</h1>
          <p class="lede">${GL.escape(t.desc)}</p>
          <div class="tool-meta">
            <span class="pill local">${t.requiresLocalEngine ? 'Motor en tu equipo · sin nube' : '100% en tu navegador'}</span>
            ${(t.tags || []).map(x => `<span class="pill">${GL.escape(x)}</span>`).join('')}
            ${(t.relatedSuites || []).map(id => `<a class="pill" href="#/suite/${id}">Uso relacionado: ${GL.escape(GL.suites[id].short)}</a>`).join('')}
            <span class="spacer"></span>
            <div class="tool-actions">
              <button class="btn sm" data-act="fav">${GL.isFav(t.id) ? '★ Favorito' : '☆ Favorito'}</button>
              ${t.report ? '<button class="btn sm" data-act="report">⎙ Informe</button>' : ''}
              ${t.csv ? '<button class="btn sm" data-act="csv">↓ CSV</button>' : ''}
              <button class="btn sm" data-act="reset">↺ Restablecer</button>
            </div>
          </div>
        </header>`;
    view.innerHTML = `<article class="tool${pilot?' tool--pilot':''}" data-tool="${t.id}" data-calc-suite="${t.suite}">
      ${pilot?GL.calculatorUI.header(t):classicHeader}<div id="toolBody"></div></article>`;
    const body = document.getElementById('toolBody');
    try {
      body.innerHTML = t.html ? t.html() : '';
      GL.restoreInputs(t.id, body);
      if (t.mount) t.mount(body);
      // guardar cambios
      const save = GL.debounce(() => GL.saveInputs(t.id, body), 250);
      body.addEventListener('input', save);
      body.addEventListener('change', save);
    } catch (e) {
      console.error(e);
      body.innerHTML = `<div class="panel"><div class="note warn">No se pudo iniciar la herramienta: ${GL.escape(e.message)}</div></div>`;
    }
    view.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'fav') {
          const on = GL.toggleFav(t.id);
          if(pilot)btn.setAttribute('aria-pressed',String(on));
          else btn.textContent = on ? '★ Favorito' : '☆ Favorito';
          GL.toast(on ? 'Añadido a favoritos' : 'Quitado de favoritos');
          buildNav();
          syncNav(t.suite, t.id);
        } else if (act === 'report' && t.report) {
          GL.openReport(t.report());
        } else if (act === 'csv' && t.csv) {
          if (t._refresh) t._refresh();
          if (!t._csv) { GL.toast('Genere resultados primero para exportar el CSV.', 'warn'); return; }
          t.csv();
        } else if (act === 'reset') {
          GL.confirm('Se borrarán los valores guardados de esta herramienta y volverán los de ejemplo.', () => {
            GL.clearInputs(t.id);
            (t.storeKeys || []).forEach(k => GL.store.del(k));
            GL.clearCharts();
            renderTool(t);
            GL.toast('Herramienta restablecida');
          }, 'Restablecer');
        }
      });
    });
    crumbs.innerHTML = `<a href="#/">Inicio</a><span class="sep">/</span><a href="#/suite/${t.suite}">${s.name}</a><span class="sep">/</span><b>${GL.escape(t.title)}</b>`;
    buildNav(t.suite, t.id);
    syncNav(t.suite, t.id);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* --------------------------------------------------------------- router */
  const LEGACY_UNIT_ROUTES = {
    'unit-length': 'length', 'unit-area': 'area', 'unit-volume': 'volume',
    'unit-mass': 'mass', 'unit-density': 'density', 'unit-pressure': 'pressure',
    'unit-temperature': 'temperature', 'unit-flow': 'flow', 'unit-mass-flow': 'massFlow'
  };
  function route() {
    GL.clearCharts();
    currentTool = null;
    const h = (location.hash || '#/').replace(/^#/, '');
    const parts = h.split('/').filter(Boolean);
    // Las rutas antiguas unit-* se consolidan en el conversor central con su magnitud.
    if (parts[0] === 'tool' && LEGACY_UNIT_ROUTES[parts[1]]) {
      location.replace(location.pathname + location.search + '#/tool/unit-converter/' + LEGACY_UNIT_ROUTES[parts[1]]);
      return;
    }
    document.title = 'Green Owl Labs · Suite de herramientas ambientales';
    if (!parts.length) {
      currentRoute = { suite: null, id: null };
      pageHome();
      crumbs.innerHTML = '<b>Inicio</b>';
      buildNav(); syncNav();
      window.scrollTo(0, 0);
      return;
    }
    if (parts[0] === 'catalogo') {
      GL.renderCatalogue(view, parts[1]);
      crumbs.innerHTML = '<a href="#/">Inicio</a><span class="sep">/</span><b>Catálogo científico y auditoría</b>';
      buildNav(); window.scrollTo(0,0); return;
    }
    if (parts[0] === 'tool' && parts[1]) {
      const t = GL.getTool(parts[1]);
      if (t) return renderTool(t);
      GL.toast('Herramienta no encontrada', 'bad');
      location.hash = '#/';
      return;
    }
    if (parts[0] === 'suite' && parts[1]) {
      currentRoute = { suite: parts[1], id: null };
      pageSuite(parts[1]);
      crumbs.innerHTML = `<a href="#/">Inicio</a><span class="sep">/</span><b>${(GL.suites[parts[1]] || {}).name || 'Suite'}</b>`;
      buildNav(parts[1], null); syncNav(parts[1], null);
      window.scrollTo(0, 0);
      return;
    }
    if (parts[0] === 'favoritos') {
      currentRoute = { suite: null, id: null };
      pageFavs();
      crumbs.innerHTML = '<a href="#/">Inicio</a><span class="sep">/</span><b>Favoritos</b>';
      buildNav(); syncNav();
      document.title = 'Favoritos · Green Owl Labs';
      window.scrollTo(0, 0);
      return;
    }
    if (parts[0] === 'metodo') {
      currentRoute = { suite: null, id: null };
      pageMetodo();
      crumbs.innerHTML = '<a href="#/">Inicio</a><span class="sep">/</span><b>Método y privacidad</b>';
      buildNav(); syncNav();
      document.title = 'Método y privacidad · Green Owl Labs';
      window.scrollTo(0, 0);
      return;
    }
    location.hash = '#/';
  }
  window.addEventListener('hashchange', route);

  /* --------------------------------------------------------------- palette */
  let palSel = 0, palResults = [];
  function openPalette() {
    const m = GL.modal({
      title: '', body: `<div class="palette" style="margin:0">        <input class="palette-input" id="palInput" placeholder="Buscar: PTAR, Munsell, ruido, SHP, incertidumbre…" autocomplete="off">
        <div class="palette-list" id="palList"></div>
        <div class="pal-foot"><span>↑↓ navegar</span><span>Enter abrir</span><span>Esc cerrar</span><span style="margin-left:auto">${GL.tools.length} herramientas</span></div>
      </div>`, size: 'palette-modal'
    });
    const input = m.root.querySelector('#palInput');
    const list = m.root.querySelector('#palList');
    const render = () => {
      const terms = normalizeSearch(input.value).split(/\s+/).filter(Boolean);
      palResults = GL.tools.filter(t => {
        if (!terms.length) return true;
        const hay = searchText(t);
        return terms.every(term => hay.includes(term));
      }).slice(0, 12);
      palSel = Math.min(palSel, Math.max(0, palResults.length - 1));
      list.innerHTML = palResults.length ? palResults.map((t, i) => `
        <div class="pal-item ${i === palSel ? 'sel' : ''}" data-i="${i}">
          <span class="pi-n">${String(t.n).padStart(2, '0')}</span>
          <span class="pi-t">${GL.escape(t.title)}</span>
          <span class="pi-s">${GL.suites[t.suite].short}</span>
        </div>`).join('') : `<div class="pal-empty">Sin resultados. Prueba «agua», «riesgo», «carbono» o «geometría».</div>`;
      list.querySelectorAll('.pal-item').forEach(el => {
        el.addEventListener('click', () => go(parseInt(el.dataset.i, 10)));
      });
    };
    const go = i => {
      const t = palResults[i];
      if (!t) return;
      m.close();
      location.hash = '#/tool/' + t.id;
    };
    input.addEventListener('input', () => { palSel = 0; render(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palResults.length - 1, palSel + 1); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(0, palSel - 1); render(); }
      else if (e.key === 'Enter') { e.preventDefault(); go(palSel); }
      else if (e.key === 'Escape') { m.close(); }
    });
    render();
    setTimeout(() => input.focus(), 30);
  }
  document.getElementById('searchBtn').addEventListener('click', openPalette);
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
    else if (e.key === 'Escape') {
      const root = document.getElementById('modalRoot');
      if (root.innerHTML) { root.innerHTML = ''; document.body.style.overflow = ''; }
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('scrim').classList.remove('on');
    }
  });
  document.querySelectorAll('[data-open-method]').forEach(b => b.addEventListener('click', () => { location.hash = '#/metodo'; }));
  document.addEventListener('click', e => {
    if (e.target.closest('[data-open-palette]')) openPalette();
  });

  /* ---------------------------------------------------------------- mobile */
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('scrim');
  document.getElementById('menuBtn').addEventListener('click', () => {
    sidebar.classList.add('open'); scrim.classList.add('on');
  });
  scrim.addEventListener('click', () => { sidebar.classList.remove('open'); scrim.classList.remove('on'); });
  nav.addEventListener('click', e => {
    if (e.target.closest('a')) { sidebar.classList.remove('open'); scrim.classList.remove('on'); }
  });

  /* ------------------------------------------------------------------ boot */
  const toolCount = document.getElementById('sideCount');
  if (toolCount) toolCount.textContent = GL.tools.length;
  if (!location.hash) history.replaceState(null, '', location.pathname + '#/');
  route();
})();
