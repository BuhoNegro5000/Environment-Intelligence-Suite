/* ==========================================================================
   Yupana · Impacto Ambiental
   21 · Clasificación SEIA (evaluación preliminar)
   22 · Matriz de Leopold interactiva
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL, D = GL.data, num = GL.num, fmt = GL.fmt, esc = GL.escape, U = GL.ui;

  /* ======================================================================
     21 · CLASIFICACIÓN SEIA
     ====================================================================== */
  const SECTORS = [
    { id: 'mining', name: 'Minería', unit: 't/día', low: 500, high: 5000, cap: 2000 },
    { id: 'hydro', name: 'Hidrocarburos', unit: 'bbl/día', low: 1000, high: 10000, cap: 4000 },
    { id: 'energy', name: 'Energía', unit: 'MW', low: 10, high: 100, cap: 30 },
    { id: 'road', name: 'Infraestructura vial', unit: 'km', low: 10, high: 50, cap: 25 },
    { id: 'water', name: 'Saneamiento / PTAR', unit: 'm³/día', low: 500, high: 5000, cap: 1500 },
    { id: 'waste', name: 'Residuos sólidos', unit: 't/día', low: 50, high: 500, cap: 120 },
    { id: 'industry', name: 'Industria manufacturera', unit: 't/día', low: 100, high: 1000, cap: 300 },
    { id: 'agro', name: 'Agroindustria', unit: 'ha', low: 500, high: 5000, cap: 1200 },
    { id: 'tourism', name: 'Turismo', unit: 'habitaciones', low: 50, high: 300, cap: 120 },
    { id: 'forest', name: 'Forestal', unit: 'ha', low: 1000, high: 10000, cap: 3000 }
  ];

  const SENS = [
    { id: 'anp', label: 'Área natural protegida o zona de amortiguamiento', sub: 'Categoría crítica: eleva la evaluación.', w: 2, critical: true },
    { id: 'indig', label: 'Territorio indígena o pueblo originario', sub: 'Activa consulta previa, libre e informada.', w: 2, critical: true },
    { id: 'arqueo', label: 'Sitio arqueológico o patrimonio cultural', sub: 'Requiere prospección y plan de monitoreo.', w: 2, critical: true },
    { id: 'humedal', label: 'Humedal, bofedal o cabecera de cuenca', sub: 'Ecosistema frágil y regulador hídrico.', w: 2, critical: true },
    { id: 'esp', label: 'Especie amenazada o hábitat crítico', sub: 'Evaluar afectación directa e indirecta.', w: 1 },
    { id: 'urb', label: 'Zona urbana o residencial cercana', sub: 'Ruido, tráfico, olores y salud pública.', w: 1 },
    { id: 'costa', label: 'Zona costera o marino-costera', sub: 'Analizar dinámica litoral y vertidos.', w: 1 },
    { id: 'alto', label: 'Zona altoandina sobre 3 800 msnm', sub: 'Condiciones extremas y bofedales.', w: 1 },
    { id: 'pasivo', label: 'Pasivos ambientales en el área de influencia', sub: 'Sumar línea base y plan de remediación.', w: 1 },
    { id: 'agua', label: 'Cuerpo de agua receptor sensible', sub: 'Verificar ECA y capacidad de asimilación.', w: 1 }
  ];

  const STUDIES = {
    1: [
      ['Línea base física', 'Topografía, suelos, agua superficial y clima.'],
      ['Línea base biológica', 'Vegetación, fauna y hábitats del área de influencia.'],
      ['Línea base socioeconómica', 'Población, actividades económicas y servicios.'],
      ['Plan de manejo ambiental', 'Medidas, responsables, cronograma y presupuesto.'],
      ['Plan de monitoreo', 'Parámetros, puntos, frecuencia y normas aplicables.'],
      ['Participación ciudadana', 'Mecanismos de información y consulta.']
    ],
    2: [
      ['Línea base física detallada', 'Hidrología, hidrogeología, calidad de aire, ruido y suelos.'],
      ['Línea base biológica con inventario', 'Especies, abundancia, hábitats críticos y conectividad.'],
      ['Línea base social y cultural', 'Actores, medios de vida, patrimonio y percepción.'],
      ['Modelamiento de dispersión y ruido', 'Escenarios de operación y peor caso.'],
      ['Evaluación de impactos', 'Matriz causa-efecto, significancia y acumulación.'],
      ['Plan de manejo y contingencia', 'Medidas, riesgos y respuesta a emergencias.'],
      ['Plan de monitoreo y vigilancia', 'Cobertura, límites de detección y reporte.'],
      ['Plan de participación y consulta', 'Etapas, actores y mecanismos.']
    ],
    3: [
      ['Línea base multidisciplinaria', 'Campañas estacionales y cobertura ampliada.'],
      ['Estudios de línea base específicos', 'Hidrogeología, calidad de agua, aire, ruido, suelos, biología y social.'],
      ['Modelamiento avanzado', 'Dispersión, ruido, hidrología, transporte de sedimentos y riesgo.'],
      ['Análisis de alternativas', 'Comparación técnica, ambiental y social de opciones.'],
      ['Evaluación de impactos acumulativos', 'Escala de cuenca o corredor, no solo del proyecto.'],
      ['Plan de manejo ambiental detallado', 'Medidas por etapa, costos, responsables y verificación.'],
      ['Plan de contingencia y riesgo', 'Escenarios, protocolos y coordinación institucional.'],
      ['Plan de monitoreo y auditoría', 'Indicadores, líneas base, umbrales y auditorías.'],
      ['Plan de consulta y participación', 'Proceso continuo, documentado y trazable.'],
      ['Plan de cierre y post-cierre', 'Restauración, monitoreo y garantías.']
    ]
  };

  const T21 = {
    id: 'seia-classifier',
    suite: 'impact',
    storeKeys: ['sie.checks'],
    title: 'Cribado SEIA · evaluación preliminar',
    desc: 'Explora de forma orientativa el posible nivel de estudio (I, II o III) y los estudios mínimos. No clasifica el proyecto: la categoría definitiva es sectorial y la establece la autoridad competente con los anexos de clasificación anticipada.',
    tags: ['SEIA', 'Cribado', 'Orientativo', 'Perú'],
    keywords: 'seia cribado evaluacion preliminar categoria dia eia estudio de impacto ambiental clasificacion anticipada proyecto peru mineria energia saneamiento consulta previa',
    html() {
      return `<div class="layout wide-left">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Proyecto y entorno</h2><p>Cribado orientativo; no clasifica ni reemplaza la evaluación de la autoridad competente.</p></div><span class="mono" id="sieTag">CRIBADO</span></div>
            <div class="grid-2">
              ${U.select('sieSector', 'Tipo de proyecto', SECTORS.map(s => ({ id: s.id, label: s.name + ' · ' + s.unit })), 'water')}
              ${U.field('sieCap', 'Capacidad o escala', '', '1500', { hint: 'Unidad según el tipo de proyecto.' })}
            </div>
            <div style="margin-top:10px">${U.slider('sieCapPct', 'Escala relativa del proyecto', '%', 40, 0, 100, 1)}</div>
            <div class="grid-3" style="margin-top:12px">
              ${U.select('sieStage', 'Etapa', [
                { id: 'new', label: 'Proyecto nuevo' },
                { id: 'mod', label: 'Modificación de proyecto existente' },
                { id: 'its', label: 'Ampliación menor / optimización' }
              ], 'new')}
              ${U.field('sieInc', 'Incremento de capacidad', '%', '0', { hint: 'Solo para modificaciones.' })}
              ${U.select('sieZone', 'Zona ecológica', [
                { id: 'costa', label: 'Costa' },
                { id: 'sierra', label: 'Sierra' },
                { id: 'selva', label: 'Selva' }
              ], 'sierra')}
            </div>
            <div class="subhead">Sensibilidades del entorno</div>
            <div class="check-grid">
              ${SENS.map(s => U.opt('sie_' + s.id, s.label, s.sub, false)).join('')}
            </div>
            <div class="btn-row"><button class="btn sm" id="sieDemo" type="button">Caso de ejemplo</button><button class="btn sm" id="sieClear" type="button">Limpiar sensibilidades</button></div>
          </section>
          <section class="panel">
            <div class="panel-title">Estudios mínimos <span class="tag" id="sieProg">0 %</span></div>
            <div class="progress" style="margin-bottom:10px"><i id="sieProgBar" style="width:0%"></i></div>
            <div id="sieStudies"></div>
            <div class="note" style="margin-top:10px">Marca los estudios que ya tienes previstos. El avance se guarda en este navegador y sirve para planificar el expediente, no como constancia de cumplimiento.</div>
          </section>
        </div>
        <div class="stack">
          <section class="panel">
            <div class="panel-title">Resultado del cribado</div>
            <div class="verdict-badge" id="sieBadge">
              <div class="vb-ico" id="sieCat">C</div>
              <div class="vb-body"><b id="sieInst">—</b><small id="sieSub">Complete los datos.</small></div>
            </div>
            <div class="note warn" style="margin-top:10px"><b>No es una clasificación vinculante.</b> El SEIA se clasifica por sector con anexos de clasificación anticipada. Este resultado solo ayuda a preparar la consulta; no sustituye el pronunciamiento de la autoridad.</div>
            <div class="metrics three" style="margin-top:12px">
              ${U.metric('siePts', 'Puntos de presión', 'pts')}
              ${U.metric('sieCrit', 'Sensibilidades críticas', 'n')}
              ${U.metric('sieLevel', 'Nivel de estudio', '')}
            </div>
            <div class="gauge" id="sieGauge"></div>
            <div class="gauge-foot"><span>I · leve</span><span>II · moderado</span><span>III · significativo</span></div>
            <div class="subhead">Fundamento</div>
            <div id="sieWhy"></div>
            <div id="sieVerdict" class="verdict info"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Siguientes pasos</div>
            <div id="sieNext"></div>
            <div class="note" style="margin-top:10px">Los umbrales y listas son <b>referenciales y editables</b>. La categoría definitiva depende de la normativa vigente, los criterios de la autoridad y las características específicas del proyecto.</div>
          </section>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T21;
      let checks = GL.store.get('sie.checks', {}) || {};
      const sector = () => SECTORS.find(s => s.id === root.querySelector('#sieSector').value) || SECTORS[0];
      const stage = () => root.querySelector('#sieStage').value;
      const caps = () => Math.max(0, num('sieCap', sector().cap));

      function syncCapFromSlider() {
        const s = sector();
        const pct = +root.querySelector('#sieCapPct').value / 100;
        const cap = Math.round((s.high * 2) * pct);
        root.querySelector('#sieCap').value = String(cap);
      }
      function syncSliderFromCap() {
        const s = sector();
        const cap = caps();
        const pct = Math.max(0, Math.min(100, cap / (s.high * 2) * 100));
        root.querySelector('#sieCapPct').value = pct.toFixed(0);
        GL.syncRange(root.querySelector('#sieCapPct'));
      }

      function sensOn() { return SENS.filter(s => root.querySelector('#sie_' + s.id).checked); }

      function compute() {
        const s = sector(), cap = caps(), st = stage();
        const inc = Math.max(0, num('sieInc', 0));
        let base = cap < s.low ? 1 : cap < s.high ? 2 : 3;
        const on = sensOn();
        const crit = on.filter(x => x.critical).length;
        const pts = on.reduce((a, x) => a + x.w, 0);
        let cat = base;
        if (crit >= 1) cat = Math.max(cat, 2);
        if (crit >= 3) cat = 3;
        if (pts >= 4) cat = Math.max(cat, 2);
        if (pts >= 8) cat = 3;
        if (st === 'mod' && inc >= 50) cat = Math.max(cat, 3);
        else if (st === 'mod' && inc >= 20) cat = Math.max(cat, base + 1);

        let instrument, note;
        if (st === 'its' || (st === 'mod' && inc < 20 && crit === 0 && pts < 4)) {
          instrument = 'Orientativo · ITS (verificar en la norma sectorial)';
          cat = Math.max(1, Math.min(cat, 2));
          note = 'Modificación de bajo impacto relativo: verificar si califica como ITS según el anexo sectorial.';
        } else if (cat === 1) {
          instrument = 'Orientativo · DIA (verificar en la norma sectorial)';
          note = 'Impactos posiblemente leves y localizados; línea base y plan de manejo acotados.';
        } else if (cat === 2) {
          instrument = 'Orientativo · EIA-sd (verificar en la norma sectorial)';
          note = 'Impactos posiblemente moderados; se requiere evaluación detallada por componentes.';
        } else {
          instrument = 'Orientativo · EIA-d (verificar en la norma sectorial)';
          note = 'Impactos posiblemente significativos o alta sensibilidad; evaluación multidisciplinaria y acumulativa.';
        }
        return { s, cap, st, inc, base, on, crit, pts, cat, instrument, note };
      }

      function studiesHTML(cat) {
        const list = STUDIES[cat] || STUDIES[1];
        return list.map(([title, sub], i) => {
          const key = 'c' + cat + '_' + i;
          const on = !!checks[key];
          return `<label class="opt ${on ? 'on' : ''}" style="margin-bottom:6px">
            <input type="checkbox" data-study="${key}" ${on ? 'checked' : ''}>
            <span><b>${title}</b><small>${sub}</small></span></label>`;
        }).join('');
      }

      function update() {
        const r = compute();
        root.querySelector('#sieTag').textContent = 'CRIBADO · ' + r.s.name;
        GL.out('siePts', fmt(r.pts, 0));
        GL.out('sieCrit', fmt(r.crit, 0));
        GL.out('sieLevel', 'Nivel ' + ['', 'I', 'II', 'III'][r.cat]);
        const catEl = root.querySelector('#sieCat');
        catEl.textContent = ['', 'I', 'II', 'III'][r.cat];
        const badge = root.querySelector('#sieBadge');
        badge.className = 'verdict-badge ' + (r.cat === 1 ? 'tone-ok' : r.cat === 2 ? 'tone-warn' : 'tone-bad');
        root.querySelector('#sieInst').textContent = r.instrument;
        root.querySelector('#sieSub').textContent = `${r.s.name} · ${fmt(r.cap, 0)} ${r.s.unit} · ${r.note}`;

        // gauge
        root.querySelector('#sieGauge').innerHTML = `
          <span class="gauge-band" style="left:0;width:33.3%"></span>
          <span class="gauge-band amb" style="left:33.3%;width:33.3%"></span>
          <span class="gauge-band bad" style="left:66.6%;width:33.4%"></span>
          <span class="gauge-mark meas" style="left:${(r.cat - 1) * 33.3 + 16.6}%"></span>
          <span class="gauge-lab" style="left:16.6%">I</span>
          <span class="gauge-lab" style="left:50%">II</span>
          <span class="gauge-lab" style="left:83.3%">III</span>`;

        const why = [];
        why.push(`<div class="method-item"><i>1</i><div><b>Escala del proyecto</b><small>${fmt(r.cap, 0)} ${r.s.unit}; umbrales referenciales: menor de ${fmt(r.s.low, 0)} → I, entre ${fmt(r.s.low, 0)} y ${fmt(r.s.high, 0)} → II, mayor → III.</small></div></div>`);
        if (r.on.length) why.push(`<div class="method-item"><i>2</i><div><b>Entorno sensible (${r.on.length})</b><small>${r.on.map(x => x.label).join('; ')}.</small></div></div>`);
        else why.push(`<div class="method-item"><i>2</i><div><b>Sin sensibilidades marcadas</b><small>Verifique en campo y con la autoridad; una omisión puede cambiar la categoría.</small></div></div>`);
        why.push(`<div class="method-item"><i>3</i><div><b>Modificación y etapa</b><small>${r.st === 'new' ? 'Proyecto nuevo.' : r.st === 'mod' ? `Modificación con incremento de ${fmt(r.inc, 0)} %.` : 'Ampliación menor u optimización.'}</small></div></div>`);
        root.querySelector('#sieWhy').innerHTML = why.join('');

        GL.setVerdict('sieVerdict', r.cat === 1 ? 'ok' : r.cat === 2 ? 'warn' : 'bad',
          `Cribado: posible nivel ${['', 'I', 'II', 'III'][r.cat]}`,
          `${r.note} Esto no es una clasificación SEIA. Confirme la categoría, el instrumento y los términos de referencia con el anexo de clasificación anticipada del sector y con la autoridad ambiental competente.`);

        root.querySelector('#sieStudies').innerHTML = studiesHTML(r.cat);
        const total = (STUDIES[r.cat] || []).length;
        const done = (STUDIES[r.cat] || []).filter((_, i) => checks['c' + r.cat + '_' + i]).length;
        const pct = total ? done / total * 100 : 0;
        root.querySelector('#sieProg').textContent = fmt(pct, 0) + ' %';
        root.querySelector('#sieProgBar').style.width = pct + '%';

        const next = [];
        if (r.cat === 3) next.push('Coordinar con la autoridad el alcance y los términos de referencia antes de iniciar la línea base.');
        if (r.on.some(x => x.id === 'indig')) next.push('Activar el proceso de consulta previa y documentar acuerdos.');
        if (r.on.some(x => x.id === 'arqueo')) next.push('Solicitar prospección arqueológica y plan de monitoreo al ente competente.');
        if (r.on.some(x => x.id === 'anp')) next.push('Verificar compatibilidad con el plan maestro del área protegida y la zona de amortiguamiento.');
        next.push('Elaborar la línea base con campañas representativas (mínimo una estación seca y una húmeda).');
        next.push('Definir el área de influencia directa e indirecta y el área de estudio.');
        next.push('Documentar supuestos, fuentes y fecha de consulta de cada tabla utilizada.');
        root.querySelector('#sieNext').innerHTML = next.map((x, i) => `<div class="method-item"><i>${i + 1}</i><div><b>Paso ${i + 1}</b><small>${x}</small></div></div>`).join('');

        T._report = {
          title: 'Cribado preliminar SEIA (no es clasificación)',
          subtitle: `${r.s.name} · ${fmt(r.cap, 0)} ${r.s.unit} · posible nivel ${['', 'I', 'II', 'III'][r.cat]}`,
          inputs: [['Tipo de proyecto', r.s.name], ['Capacidad', fmt(r.cap, 0) + ' ' + r.s.unit], ['Etapa', r.st === 'new' ? 'Proyecto nuevo' : r.st === 'mod' ? 'Modificación' : 'Ampliación menor'],
            ['Incremento', fmt(r.inc, 0) + ' %'], ['Sensibilidades', r.on.length ? r.on.map(x => x.label).join('; ') : 'Ninguna marcada']],
          results: [['Posible nivel de estudio', ['', 'I', 'II', 'III'][r.cat], ''], ['Instrumento orientativo', r.instrument, ''],
            ['Puntos de presión', fmt(r.pts, 0), 'pts'], ['Sensibilidades críticas', fmt(r.crit, 0), 'n'],
            ['Estudios previstos', fmt(done, 0) + ' / ' + fmt(total, 0), '']],
          extra: `<table><thead><tr><th>#</th><th>Estudio mínimo</th><th>Estado</th></tr></thead><tbody>${(STUDIES[r.cat] || []).map(([t], i) => `<tr><td>${i + 1}</td><td>${esc(t)}</td><td>${checks['c' + r.cat + '_' + i] ? 'Previsto' : 'Pendiente'}</td></tr>`).join('')}</tbody></table>`,
          notes: [
            'Herramienta de cribado orientativa. No clasifica el proyecto ni determina el instrumento. La categoría definitiva es sectorial y se establece con los anexos de clasificación anticipada y el pronunciamiento de la autoridad competente.',
            'Los umbrales de escala son referenciales y editables; no reproducen necesariamente los anexos oficiales vigentes. Un mismo tamaño puede tener categorías distintas según el sector y la ubicación.',
            'La sensibilidad del entorno debe verificarse con cartografía oficial, trabajo de campo y consulta a la población.',
            'No constituye evaluación de impacto ambiental, dictamen, certificación ni opinión legal.'
          ],
          method: '<p>Puntaje de presión = suma ponderada de sensibilidades (críticas = 2, restantes = 1). Categoría base por escala frente a umbrales del sector; las sensibilidades críticas elevan a II y tres o más a III. Las modificaciones con incremento ≥ 20 % suben un nivel; ≥ 50 % fuerzan III. El ITS se sugiere solo para modificaciones menores sin sensibilidades críticas.</p>'
        };
        T._csv = [{ tipo_proyecto: r.s.name, capacidad: r.cap, unidad: r.s.unit, etapa: r.st, incremento_pct: r.inc, puntos_presion: r.pts, criticas: r.crit, nivel_cribado: ['', 'I', 'II', 'III'][r.cat], instrumento_orientativo: r.instrument, estudios_previstos: done, estudios_total: total }];
      }

      root.addEventListener('change', e => {
        if (e.target.matches('[data-study]')) {
          checks[e.target.dataset.study] = e.target.checked;
          GL.store.set('sie.checks', checks);
          e.target.closest('.opt').classList.toggle('on', e.target.checked);
          update();
        }
      });
      root.querySelector('#sieSector').addEventListener('change', () => {
        const s = sector();
        root.querySelector('#sieCap').value = String(s.cap);
        syncSliderFromCap();
        update();
      });
      root.querySelector('#sieCapPct').addEventListener('input', () => { syncCapFromSlider(); update(); });
      root.querySelector('#sieCap').addEventListener('input', () => { syncSliderFromCap(); update(); });
      GL.bindCalc(root, ['sieInc'], update);
      root.querySelector('#sieStage').addEventListener('change', update);
      root.querySelector('#sieZone').addEventListener('change', update);
      SENS.forEach(s => root.querySelector('#sie_' + s.id).addEventListener('change', update));
      root.querySelector('#sieDemo').addEventListener('click', () => {
        ['anp', 'humedal', 'agua'].forEach(id => { root.querySelector('#sie_' + id).checked = true; root.querySelector('#sie_' + id).closest('.opt').classList.add('on'); });
        root.querySelector('#sieSector').value = 'water';
        root.querySelector('#sieCap').value = '4200';
        syncSliderFromCap(); update();
      });
      root.querySelector('#sieClear').addEventListener('click', () => {
        SENS.forEach(s => { const el = root.querySelector('#sie_' + s.id); el.checked = false; el.closest('.opt').classList.remove('on'); });
        update();
      });

      syncSliderFromCap();
      update();
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_clasificacion_SEIA.csv', this._csv); }
  };
  GL.tool(T21);

  /* ======================================================================
     22 · MATRIZ DE LEOPOLD INTERACTIVA
     ====================================================================== */
  const ACTIONS = [
    { g: 'prep', n: 'Desbroce y limpieza' }, { g: 'prep', n: 'Movimiento de tierras' }, { g: 'prep', n: 'Caminos de acceso' }, { g: 'prep', n: 'Campamento temporal' },
    { g: 'build', n: 'Obras civiles' }, { g: 'build', n: 'Montaje electromecánico' }, { g: 'build', n: 'Transporte de materiales' }, { g: 'build', n: 'Residuos de construcción' },
    { g: 'op', n: 'Captación de agua' }, { g: 'op', n: 'Consumo de energía' }, { g: 'op', n: 'Emisiones atmosféricas' }, { g: 'op', n: 'Efluentes líquidos' },
    { g: 'op', n: 'Residuos sólidos' }, { g: 'op', n: 'Ruido y vibración' }, { g: 'op', n: 'Tránsito vehicular' }, { g: 'op', n: 'Empleo y compras locales' },
    { g: 'close', n: 'Desmantelamiento' }, { g: 'close', n: 'Restauración del terreno' }, { g: 'close', n: 'Monitoreo post-cierre' }, { g: 'close', n: 'Uso futuro del sitio' }
  ];
  const FACTORS = [
    { g: 'fis', n: 'Calidad del aire' }, { g: 'fis', n: 'Ruido y vibraciones' }, { g: 'fis', n: 'Suelo' }, { g: 'fis', n: 'Agua superficial' }, { g: 'fis', n: 'Agua subterránea' }, { g: 'fis', n: 'Paisaje y relieve' },
    { g: 'bio', n: 'Vegetación' }, { g: 'bio', n: 'Fauna' }, { g: 'bio', n: 'Hábitats y ecosistemas' }, { g: 'bio', n: 'Biodiversidad' }, { g: 'bio', n: 'Servicios ecosistémicos' },
    { g: 'soc', n: 'Empleo' }, { g: 'soc', n: 'Economía local' }, { g: 'soc', n: 'Salud y seguridad' }, { g: 'soc', n: 'Infraestructura y servicios' }, { g: 'soc', n: 'Patrimonio cultural' }
  ];
  const GCOL = { fis: '#5277A8', bio: '#5F8A3A', soc: '#A57B1F' };
  const GLABEL = { fis: 'Físico', bio: 'Biológico', soc: 'Socioeconómico' };
  const AGLABEL = { prep: 'Preparación', build: 'Construcción', op: 'Operación', close: 'Cierre' };

  const DEMO = [
    [0, 6, -4, 4], [1, 2, -5, 5], [1, 6, -6, 6], [2, 0, -3, 3],
    [4, 0, -2, 3], [5, 14, -3, 4], [6, 2, -2, 3],
    [8, 3, -6, 6], [9, 0, -4, 5], [10, 0, -6, 6], [11, 3, -7, 7],
    [12, 2, -4, 4], [13, 1, -4, 4], [14, 0, -3, 3], [15, 12, 4, 5],
    [17, 6, 5, 5], [18, 9, 4, 4], [19, 11, 3, 3]
  ];

  const T22 = {
    id: 'leopold-matrix',
    suite: 'impact',
    storeKeys: ['lp.impacts'],
    title: 'Matriz de Leopold interactiva',
    desc: 'Valora impactos cruzando 20 acciones del proyecto con 16 factores ambientales. Edita magnitud e importancia celda por celda, observa el mapa de calor, prioriza impactos y exporta la matriz.',
    tags: ['Leopold', 'Matriz', 'Impacto', 'EIA'],
    keywords: 'matriz leopold impacto ambiental magnitud importancia accion factor mapa de calor eia identificacion valoracion',
    html() {
      return `<div class="layout single">
        <div class="stack">
          <section class="panel">
            <div class="panel-head"><div><h2>Matriz causa-efecto</h2><p>Haz clic en una celda para valorarla. Magnitud de −10 a +10; importancia de 1 a 10.</p></div><span class="mono" id="lpCount">0 impactos</span></div>
            <div class="lp-editor" id="lpEditor" style="border:1px solid var(--line-soft);border-radius:12px;background:var(--panel-2);padding:12px;margin-bottom:12px">
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px">
                <b id="lpCellName" style="font-size:11.5px">Selecciona una celda</b>
                <span class="mono-chip" id="lpCellVal">—</span>
                <span style="margin-left:auto" id="lpCellTag"></span>
              </div>
              <div class="grid-2">
                ${U.slider('lpMag', 'Magnitud', '', -3, -10, 10, 1)}
                ${U.slider('lpImp', 'Importancia', '', 3, 1, 10, 1)}
              </div>
              <div class="btn-row" style="margin-top:8px">
                <button class="btn sm primary" id="lpAdd" type="button">Guardar impacto</button>
                <button class="btn sm danger" id="lpDel" type="button">Quitar</button>
                <button class="btn sm" id="lpDemo" type="button">Proyecto de ejemplo</button>
                <button class="btn sm" id="lpClear" type="button">Vaciar matriz</button>
              </div>
            </div>
            <div class="heat-wrap" id="lpWrap" style="max-height:600px"></div>
            ${U.heatLegend('Impacto negativo', 'Suma M × I', 'Impacto positivo')}
          </section>
          <div class="layout">
            <section class="panel">
              <div class="panel-title">Resumen</div>
              <div class="metrics three">
                ${U.metric('lpTotal', 'Impactos valorados', 'n', true)}
                ${U.metric('lpNet', 'Suma neta', 'M×I')}
                ${U.metric('lpNeg', 'Negativos', 'n')}
                ${U.metric('lpPos', 'Positivos', 'n')}
                ${U.metric('lpMax', 'Máximo |M×I|', '')}
                ${U.metric('lpAvg', 'Promedio |M×I|', '')}
              </div>
              <div class="chart-wrap short" style="margin-top:12px"><canvas id="lpChart"></canvas></div>
              <div class="chart-legend"><span><i style="background:#5277A8"></i>Físico</span><span><i style="background:#5F8A3A"></i>Biológico</span><span><i style="background:#A57B1F"></i>Socioeconómico</span></div>
              <div id="lpVerdict" class="verdict info"></div>
            </section>
            <section class="panel">
              <div class="panel-title">Impactos prioritarios</div>
              <div id="lpTop"></div>
              <div class="note" style="margin-top:10px">La matriz de Leopold es una herramienta de cribado cualitativo. No pondera acumulación, reversibilidad ni sinergia; complétela con criterios de significancia y validación en campo.</div>
            </section>
          </div>
        </div>
      </div>`;
    },
    mount(root) {
      const T = T22;
      let imp = GL.store.get('lp.impacts', null);
      if (!imp || typeof imp !== 'object') imp = {};
      let sel = null;

      const key = (a, f) => a + '|' + f;
      const get = (a, f) => imp[key(a, f)] || null;
      const val = (a, f) => { const x = get(a, f); return x ? x.m * x.i : 0; };

      function renderMatrix() {
        const cols = `150px repeat(${FACTORS.length}, minmax(26px, 1fr)) 44px`;
        let h = `<div class="heat" style="grid-template-columns:${cols}">`;
        h += `<div class="hm-corner">Acción \\ Factor</div>`;
        FACTORS.forEach((f, j) => h += `<div class="hm-col" title="${esc(f.n)} · ${GLABEL[f.g]}" style="border-top:2px solid ${GCOL[f.g]}">${esc(f.n)}</div>`);
        h += `<div class="hm-col" style="border-top:2px solid var(--line)">Σ</div>`;
        ACTIONS.forEach((a, i) => {
          h += `<div class="hm-row" title="${AGLABEL[a.g]}"><b>${i + 1}</b>&nbsp;${esc(a.n)}</div>`;
          let sum = 0;
          FACTORS.forEach((f, j) => {
            const x = get(i, j);
            const v = x ? x.m * x.i : 0;
            sum += v;
            if (x) {
              const c = GL.heat(v / 100);
              h += `<div class="hm-cell has${sel && sel.a === i && sel.f === j ? ' active' : ''}" data-a="${i}" data-f="${j}" title="${esc(a.n)} × ${esc(f.n)} — M ${x.m}, I ${x.i}, M×I ${v}" style="background:${c.bg};color:${c.fg}">${v}</div>`;
            } else {
              h += `<div class="hm-cell${sel && sel.a === i && sel.f === j ? ' active' : ''}" data-a="${i}" data-f="${j}" title="${esc(a.n)} × ${esc(f.n)} — sin valorar"></div>`;
            }
          });
          h += `<div class="hm-row" style="justify-content:flex-end;font-family:var(--mono);font-size:9px;color:${sum < 0 ? 'var(--rose)' : sum > 0 ? 'var(--accent)' : 'var(--faint)'}">${sum || '·'}</div>`;
        });
        // totales por factor
        h += `<div class="hm-row" style="font-family:var(--mono);font-size:8.5px;color:var(--faint)">Σ por factor</div>`;
        FACTORS.forEach((f, j) => {
          let s = 0; ACTIONS.forEach((a, i) => { s += val(i, j); });
          h += `<div class="hm-cell" style="border:0;background:transparent;color:${s < 0 ? 'var(--rose)' : s > 0 ? 'var(--accent)' : 'var(--faint)'};font-size:9px">${s || '·'}</div>`;
        });
        h += `<div class="hm-cell" style="border:0;background:transparent;color:var(--text-2);font-size:9px">${Object.keys(imp).length}</div>`;
        h += `</div>`;
        root.querySelector('#lpWrap').innerHTML = h;
      }

      function selectCell(a, f) {
        sel = { a, f };
        const x = get(a, f);
        const c = x || { m: -3, i: 3 };
        root.querySelector('#lpMag').value = c.m;
        root.querySelector('#lpImp').value = c.i;
        GL.syncRange(root.querySelector('#lpMag'));
        GL.syncRange(root.querySelector('#lpImp'));
        root.querySelector('#lpCellName').textContent = `${a + 1}. ${ACTIONS[a].n} × ${FACTORS[f].n}`;
        const v = c.m * c.i;
        root.querySelector('#lpCellVal').textContent = `M ${c.m} · I ${c.i} · M×I ${v}`;
        root.querySelector('#lpCellTag').innerHTML = x ? `<span class="tag">${GLABEL[FACTORS[f].g]}</span>` : `<span class="tag">sin valorar</span>`;
        root.querySelector('#lpDel').disabled = !x;
        renderMatrix();
      }

      function update() {
        const keys = Object.keys(imp);
        const vals = keys.map(k => imp[k].m * imp[k].i);
        const net = vals.reduce((s, v) => s + v, 0);
        const neg = vals.filter(v => v < 0).length;
        const pos = vals.filter(v => v > 0).length;
        const max = vals.length ? Math.max.apply(null, vals.map(Math.abs)) : 0;
        const avg = vals.length ? vals.reduce((s, v) => s + Math.abs(v), 0) / vals.length : 0;
        root.querySelector('#lpCount').textContent = fmt(keys.length, 0) + ' impactos';
        GL.out('lpTotal', fmt(keys.length, 0));
        GL.out('lpNet', (net > 0 ? '+' : '') + fmt(net, 0));
        GL.out('lpNeg', fmt(neg, 0));
        GL.out('lpPos', fmt(pos, 0));
        GL.out('lpMax', fmt(max, 0));
        GL.out('lpAvg', fmt(avg, 1));

        const groups = ['fis', 'bio', 'soc'];
        const sums = groups.map(g => FACTORS.reduce((s, f, j) => {
          if (f.g !== g) return s;
          return s + ACTIONS.reduce((t, a, i) => t + val(i, j), 0);
        }, 0));
        GL.chart(root.querySelector('#lpChart'), {
          type: 'bar',
          series: [{ name: 'Suma M×I', data: groups.map((g, i) => [GLABEL[g], sums[i]]), color: '#5F8A3A' }],
          y: { label: 'Suma M × I', zero: true }
        });

        const top = keys.map(k => {
          const [a, f] = k.split('|').map(Number);
          return { a, f, m: imp[k].m, i: imp[k].i, v: imp[k].m * imp[k].i };
        }).sort((x, y) => Math.abs(y.v) - Math.abs(x.v)).slice(0, 8);

        root.querySelector('#lpTop').innerHTML = top.length ? top.map((x, n) => {
          const cls = x.v < 0 ? 'bad' : 'ok';
          return `<div class="method-item"><i>${String(n + 1).padStart(2, '0')}</i><div><b>${esc(ACTIONS[x.a].n)} <span class="tag tag-${cls}">${x.v}</span></b><small>${esc(FACTORS[x.f].n)} · M ${x.m}, I ${x.i} · ${x.v < 0 ? 'negativo' : 'positivo'}</small></div></div>`;
        }).join('') : '<div class="note">Aún no hay impactos valorados. Usa el ejemplo o haz clic en una celda.</div>';

        const tone = neg > pos * 2 ? 'bad' : net < 0 ? 'warn' : 'ok';
        GL.setVerdict('lpVerdict', tone,
          keys.length ? `${fmt(keys.length, 0)} impactos · suma neta ${net > 0 ? '+' : ''}${fmt(net, 0)}` : 'Matriz vacía',
          keys.length ? (neg > pos ? 'Predominan los impactos negativos: priorice medidas de prevención, mitigación y monitoreo en los factores con mayor |M×I|.' : 'Predominan los impactos positivos, pero verifique que los negativos residuales tengan control y seguimiento.') : 'Valore al menos un cruce acción-factor para obtener un diagnóstico.');

        T._report = {
          title: 'Matriz de Leopold · valoración de impactos',
          subtitle: `${fmt(keys.length, 0)} impactos valorados · suma neta ${fmt(net, 0)}`,
          inputs: [['Acciones', String(ACTIONS.length)], ['Factores', String(FACTORS.length)], ['Escala magnitud', '−10 a +10'], ['Escala importancia', '1 a 10']],
          results: [['Impactos valorados', fmt(keys.length, 0), 'n'], ['Suma neta M×I', fmt(net, 0), ''], ['Negativos', fmt(neg, 0), 'n'], ['Positivos', fmt(pos, 0), 'n'], ['Máximo |M×I|', fmt(max, 0), '']],
          extra: `<table><thead><tr><th>Acción</th><th>Factor</th><th>M</th><th>I</th><th>M×I</th></tr></thead><tbody>${keys.map(k => { const [a, f] = k.split('|').map(Number); const x = imp[k]; return `<tr><td>${esc(ACTIONS[a].n)}</td><td>${esc(FACTORS[f].n)}</td><td>${x.m}</td><td>${x.i}</td><td>${x.m * x.i}</td></tr>`; }).join('')}</tbody></table>`,
          notes: [
            'La matriz de Leopold identifica y valora cualitativamente impactos con magnitud e importancia; no sustituye una evaluación de significancia, acumulación, sinergia ni riesgo.',
            'La selección de 20 acciones y 16 factores es una simplificación editable; adáptela al proyecto y a los términos de referencia.',
            'La valoración debe ser consensuada por un equipo multidisciplinario y sustentada en línea base de campo.',
            'No constituye certificación ni dictamen ambiental.'
          ],
          method: '<p>Para cada cruce acción-factor se registra magnitud (M, −10 a +10) e importancia (I, 1 a 10). El producto M×I resume la intensidad del impacto; los totales por acción, por factor y por grupo permiten priorizar. El color del mapa de calor escala con |M×I|/100.</p>'
        };
        T._csv = keys.map(k => {
          const [a, f] = k.split('|').map(Number), x = imp[k];
          return { accion: ACTIONS[a].n, factor: FACTORS[f].n, grupo: GLABEL[FACTORS[f].g], magnitud: x.m, importancia: x.i, producto: x.m * x.i, tipo: x.m * x.i < 0 ? 'negativo' : 'positivo' };
        });
      }

      root.querySelector('#lpWrap').addEventListener('click', e => {
        const cell = e.target.closest('[data-a]');
        if (cell) selectCell(+cell.dataset.a, +cell.dataset.f);
      });
      root.querySelector('#lpAdd').addEventListener('click', () => {
        if (!sel) return GL.toast('Selecciona una celda de la matriz', 'warn');
        imp[key(sel.a, sel.f)] = { m: +root.querySelector('#lpMag').value, i: +root.querySelector('#lpImp').value };
        GL.store.set('lp.impacts', imp);
        selectCell(sel.a, sel.f); update();
      });
      root.querySelector('#lpDel').addEventListener('click', () => {
        if (!sel) return;
        delete imp[key(sel.a, sel.f)];
        GL.store.set('lp.impacts', imp);
        selectCell(sel.a, sel.f); update();
      });
      root.querySelector('#lpDemo').addEventListener('click', () => {
        imp = {};
        DEMO.forEach(([a, f, m, i]) => { imp[key(a, f)] = { m, i }; });
        GL.store.set('lp.impacts', imp);
        sel = null; renderMatrix(); update();
        GL.toast('Proyecto de ejemplo cargado');
      });
      root.querySelector('#lpClear').addEventListener('click', () => {
        imp = {}; GL.store.set('lp.impacts', imp);
        sel = null; renderMatrix(); update();
      });
      ['lpMag', 'lpImp'].forEach(id => root.querySelector('#' + id).addEventListener('input', () => {
        if (!sel) return;
        const c = get(sel.a, sel.f);
        const m = +root.querySelector('#lpMag').value, i = +root.querySelector('#lpImp').value;
        root.querySelector('#lpCellVal').textContent = `M ${m} · I ${i} · M×I ${m * i}`;
        if (c) {
          c.m = m; c.i = i; GL.store.set('lp.impacts', imp);
          renderMatrix(); update();
        }
      }));

      renderMatrix();
      update();
      if (!Object.keys(imp).length) { selectCell(1, 2); }
    },
    report() { return this._report; },
    csv() { if (this._csv) GL.csvDownload('GOL_matriz_Leopold.csv', this._csv); }
  };
  GL.tool(T22);
})();
