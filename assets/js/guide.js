/* Yupana · guía editorial por herramienta.
   Genera una ficha estable a partir de los metadatos del modelo y de un
   contexto por categoría. Las definiciones pueden sobrescribir cualquier
   sección con `guide: { ... }` sin tocar el motor de cálculo. */
(function () {
  'use strict';
  const G = window.GL, E = G.escape;

  const SUITE = {
    soil: {
      what: 'El suelo es un sistema poroso donde conviven minerales, materia orgánica, agua y aire. Sus propiedades físicas y químicas condicionan la fertilidad, la erosión, el almacenamiento de carbono y la movilidad de contaminantes.',
      context: 'La interpretación depende del tipo de suelo, la profundidad, el método de muestreo y la variabilidad del sitio.',
      applications: ['Caracterización física y química de suelos', 'Fertilidad, enmiendas y recomendaciones de manejo', 'Carbono orgánico y balances de materia orgánica', 'Evaluación de erosión, salinidad y remediación'],
      mistakes: ['Usar una densidad aparente de otro sitio o profundidad', 'Confundir carbono orgánico con materia orgánica', 'No corregir por humedad ni declarar la base de cálculo'],
      limitation: 'Una muestra puntual no representa todo el polígono; la incertidumbre espacial debe declararse.'
    },
    water: {
      what: 'El agua para consumo y uso industrial se evalúa con parámetros físicos, químicos y biológicos. La calidad, la dosis y el tratamiento se interpretan juntos: un valor aislado rara vez alcanza para decidir.',
      context: 'La temperatura, el pH, la alcalinidad y la base seca o húmeda cambian el significado de una concentración.',
      applications: ['Potabilización y dosificación de coagulantes', 'Control de calidad y cumplimiento de límites', 'Redes, pérdidas y balances hídricos', 'Preparación de agua para procesos'],
      mistakes: ['Mezclar concentraciones con cargas másicas', 'No verificar la base seca o húmeda del dato', 'Ignorar la temperatura o el pH al comparar resultados'],
      limitation: 'Los valores de ejemplo son referenciales; el diseño exige caracterización local y verificación en campo.'
    },
    wastewater: {
      what: 'El tratamiento de aguas residuales combina operaciones físicas, químicas y biológicas. El caudal, la carga orgánica, los nutrientes y la edad del lodo determinan el tamaño y el desempeño de cada unidad.',
      context: 'Un caudal medio no describe un pico horario; una concentración no describe una carga diaria.',
      applications: ['Dimensionamiento de PTAR y unidades de tratamiento', 'Lodos activados, lagunas y ecualización', 'Cálculo de lodos, oxígeno y sopladores', 'Reúso, vertimiento y revisión de efluentes'],
      mistakes: ['Confundir DBO con DQO o usar una relación sin verificar', 'Dimensionar con caudal medio cuando el diseño exige pico', 'Olvidar el retorno de lodos, el reciclo o las pérdidas'],
      limitation: 'El modelo representa un régimen ideal; la calibración con aforos y caracterización local es indispensable.'
    },
    hydraulics: {
      what: 'La hidráulica estudia el movimiento del agua en tuberías, canales y cuencas. Las pérdidas, la geometría, la pendiente y el régimen de flujo definen la capacidad y la energía del sistema.',
      context: 'La geometría, la pendiente y el régimen de flujo deben ser coherentes con el tramo o la cuenca analizada.',
      applications: ['Dimensionamiento y revisión de tuberías', 'Canales, vertederos y aforos', 'Perfiles hidráulicos y pérdidas de carga', 'Escorrentía y drenaje de cuencas pequeñas'],
      mistakes: ['Usar diámetro nominal en lugar del interior', 'Ignorar pérdidas locales o cambios de régimen', 'Mezclar caudales de diseño con caudales operativos'],
      limitation: 'Las fórmulas empíricas tienen rangos de validez; verifica Reynolds, pendiente y geometría antes de extrapolar.'
    },
    membranes: {
      what: 'La separación por membranas usa una barrera selectiva y una fuerza impulsora, normalmente presión. El flujo, la recuperación, el rechazo y el ensuciamiento dependen de la membrana, la temperatura y la calidad del agua de alimentación.',
      context: 'La presión osmótica y la temperatura corrigen el flujo; la recuperación no es lo mismo que el rechazo de sales.',
      applications: ['Ósmosis inversa y nanofiltración', 'Ultrafiltración y microfiltración', 'Ensayos de ensuciamiento y limpieza', 'Energía y recuperación en desalinización'],
      mistakes: ['No corregir el flujo por temperatura', 'Confundir recuperación con eficiencia de rechazo', 'Ignorar la presión osmótica o el factor de concentración'],
      limitation: 'Los modelos de membrana son aproximaciones; el desempeño real se confirma con ensayos de banco o piloto.'
    },
    'industrial-water': {
      what: 'El agua industrial alimenta calderas, torres de enfriamiento, intercambiadores y procesos de alta pureza. La química del agua controla incrustación, corrosión, arrastre y calidad del producto.',
      context: 'Los ciclos de concentración, el arrastre y la calidad del make-up determinan el régimen químico.',
      applications: ['Calderas y generación de vapor', 'Torres de enfriamiento y ciclos de concentración', 'Intercambio iónico y agua ultrapura', 'Control de incrustación y corrosión'],
      mistakes: ['Calcular ciclos sin considerar el arrastre', 'Evaluar dureza sin alcalinidad ni sílice', 'Usar agua de reposición sin caracterización'],
      limitation: 'Las recomendaciones químicas dependen del fabricante y de la normativa aplicable; verifica con el proveedor.'
    },
    waste: {
      what: 'La gestión de residuos sólidos conecta generación, segregación, valorización, tratamiento y disposición final. La masa, el volumen, la densidad y la humedad cambian a lo largo de la cadena.',
      context: 'Una tonelada no ocupa el mismo volumen antes y después de la compactación; la cobertura también consume capacidad.',
      applications: ['Generación y caracterización de residuos', 'Valorización y tasas de desvío', 'Dimensionamiento de rellenos sanitarios', 'Lixiviados, biogás y cierre de celdas'],
      mistakes: ['Confundir masa con volumen sin declarar la densidad', 'Ignorar la cobertura y el asentamiento', 'Usar tasas de generación de otra ciudad o año'],
      limitation: 'Los resultados son estimaciones de planificación; el diseño final requiere topografía, geotecnia y estudios de campo.'
    },
    air: {
      what: 'La calidad del aire y las emisiones se describen con concentraciones, caudales y factores de emisión. La normalización a condiciones de referencia y la base seca son parte del dato, no un detalle posterior.',
      context: 'Las condiciones de referencia, la base seca o húmeda y el caudal forman parte del dato, no son un ajuste posterior.',
      applications: ['Inventarios y factores de emisión', 'Normalización de gases de chimenea', 'Dispersión atmosférica y cribado', 'Índices de calidad del aire'],
      mistakes: ['Comparar ppm con mg/m³ sin convertir', 'No normalizar a la base de oxígeno declarada', 'Usar una clase de estabilidad sin justificarla'],
      limitation: 'Los modelos de dispersión son cribados; la decisión regulatoria exige modelamiento validado y datos meteorológicos representativos.'
    },
    energy: {
      what: 'La energía y la potencia describen cosas distintas: la potencia es la tasa instantánea y la energía es la integral en el tiempo. La eficiencia, el factor de planta y las condiciones de operación conectan ambas.',
      context: 'La irradiancia, el viento y la demanda varían; un valor instantáneo no es un promedio anual.',
      applications: ['Eficiencia energética y auditorías', 'Generación solar y eólica', 'Potencia de equipos y motores', 'Ahorros y verificación de medidas'],
      mistakes: ['Confundir energía con potencia', 'Usar irradiancia instantánea como media anual', 'Ignorar el factor de planta o las pérdidas del sistema'],
      limitation: 'Las estimaciones preliminares no reemplazan mediciones, curvas de potencia ni estudios de recurso.'
    },
    climate: {
      what: 'El clima y el carbono se estudian con series, balances y factores de emisión. La escala temporal, la frontera del inventario y el potencial de calentamiento deben declararse antes de comparar resultados.',
      context: 'Carbono elemental, CO₂ y CO₂ equivalente no son la misma magnitud; el factor de emisión depende del sistema y del año.',
      applications: ['Confort térmico y aridez', 'Huella de carbono e inventarios', 'Balances de carbono y CO₂ equivalente', 'Análisis de series climáticas'],
      mistakes: ['Confundir carbono con CO₂ o con CO₂ equivalente', 'Usar un factor de emisión genérico sin declarar la fuente', 'Extrapolar índices fuera de su rango de validez'],
      limitation: 'Los índices empíricos son aproximaciones; la decisión climática requiere series locales y análisis de incertidumbre.'
    },
    ecology: {
      what: 'La ecología mide comunidades, poblaciones y hábitats. La riqueza, la abundancia, la diversidad y la composición responden de forma distinta al esfuerzo de muestreo y al tipo de hábitat.',
      context: 'Comparar muestreos exige el mismo esfuerzo, método, temporada y unidad de observación.',
      applications: ['Diversidad y estructura de comunidades', 'Bioindicadores y calidad ecológica', 'Restauración y monitoreo de hábitat', 'Análisis de cobertura y cambio de uso'],
      mistakes: ['Comparar riqueza con esfuerzos de muestreo distintos', 'Confundir abundancia con riqueza', 'Ignorar la temporada o el observador'],
      limitation: 'Los índices resumen una parte de la comunidad; la interpretación ecológica requiere contexto de hábitat y presión.'
    },
    impact: {
      what: 'La evaluación de impacto ambiental identifica, predice y valora cambios en el entorno. La significancia combina magnitud, extensión, duración y sensibilidad del receptor; no es solo un número.',
      context: 'Una matriz ordena la discusión, pero no reemplaza la línea base ni la justificación técnica de cada valoración.',
      applications: ['Clasificación y cribado de proyectos', 'Matrices de impacto y significancia', 'Línea base y planes de manejo', 'Seguimiento y cumplimiento ambiental'],
      mistakes: ['Confundir magnitud con significancia', 'Omitir impactos acumulativos o sinérgicos', 'No justificar los pesos ni la valoración'],
      limitation: 'La herramienta apoya el análisis; la decisión final depende de la autoridad, el marco legal y la participación ciudadana.'
    },
    sustainability: {
      what: 'La sostenibilidad compara desempeño ambiental, social y económico. La frontera del sistema, la unidad funcional y la base de referencia son tan importantes como el indicador final.',
      context: 'Un valor absoluto y un valor relativo cuentan historias distintas; declara la base antes de comparar.',
      applications: ['Huella y ecoeficiencia', 'Economía circular y valorización', 'Reportes de sostenibilidad', 'Comparación de escenarios y metas'],
      mistakes: ['Confundir indicador relativo con absoluto', 'No declarar la frontera o la unidad funcional', 'Contar dos veces el mismo flujo'],
      limitation: 'Los indicadores agregados simplifican; la decisión requiere revisar los supuestos y las externalidades.'
    },
    health: {
      what: 'La salud ambiental evalúa la relación entre exposición y efecto. El peligro describe una propiedad; el riesgo combina peligro, exposición y vulnerabilidad de la población.',
      context: 'Sin escenario de exposición no hay riesgo: ruta, frecuencia, duración y población deben declararse.',
      applications: ['Evaluación de exposición y riesgo sanitario', 'Calidad de agua y aire interior', 'Vectores y saneamiento', 'Vigilancia y comunicación de riesgo'],
      mistakes: ['Confundir peligro con riesgo', 'No declarar la ruta ni la población expuesta', 'Ignorar grupos sensibles o exposiciones múltiples'],
      limitation: 'Los resultados son orientativos; la evaluación sanitaria formal requiere datos de exposición y criterios toxicológicos validados.'
    },
    safety: {
      what: 'La seguridad y salud en el trabajo prioriza peligros, evalúa riesgos y verifica controles. La probabilidad, la severidad y la exposición deben estimarse con evidencia y revisarse cuando cambia la operación.',
      context: 'Una matriz de riesgo es una fotografía del proceso; pierde validez si no se actualiza con cambios, incidentes o auditorías.',
      applications: ['IPERC y matrices de riesgo', 'Evaluación Conesa y criticidad', 'Trabajo en altura, ruido y exposición', 'Indicadores y fiscalización'],
      mistakes: ['Confundir probabilidad con frecuencia observada', 'No actualizar la matriz tras un cambio', 'Declarar controles sin verificar su eficacia'],
      limitation: 'La herramienta ordena la evaluación; la validez legal y la decisión de control requieren revisión profesional y normativa aplicable.'
    },
    noise: {
      what: 'El ruido es una presión sonora que se propaga y se percibe. Los decibeles son logarítmicos: no se suman aritméticamente y la distancia, la geometría y el fondo cambian el nivel en el receptor.',
      context: 'Un nivel medido sin tiempo de exposición, tipo de fuente y condiciones del entorno no describe el impacto.',
      applications: ['Propagación de fuentes puntuales y lineales', 'Suma de fuentes y niveles equivalentes', 'Exposición ocupacional y ambiental', 'Barreras y control de ruido'],
      mistakes: ['Sumar decibeles de forma aritmética', 'Ignorar el ruido de fondo', 'Aplicar una fórmula de campo libre en un recinto cerrado'],
      limitation: 'Las fórmulas simplificadas no incluyen reflexión, absorción, terreno ni difracción múltiple; verifica con medición.'
    },
    metrology: {
      what: 'La metrología sostiene la comparabilidad de las mediciones. La exactitud, la precisión, la incertidumbre y la trazabilidad permiten decidir si una diferencia es real o está dentro del error.',
      context: 'Un resultado sin incertidumbre y sin trazabilidad es difícil de defender ante una auditoría o una comparación.',
      applications: ['Incertidumbre y presupuestos de medición', 'Calibración y verificación de equipos', 'Muestreo, diluciones y control de calidad', 'Planes de monitoreo y trazabilidad'],
      mistakes: ['Confundir exactitud con precisión', 'No declarar la trazabilidad ni el método', 'Ignorar blancos, duplicados y límites de detección'],
      limitation: 'La incertidumbre debe estimarse con el método y el equipo reales; los valores de ejemplo no sustituyen la validación.'
    },
    conversion: {
      what: 'La conversión de unidades traduce una magnitud sin cambiar su significado físico. La unidad, la base y la magnitud deben coincidir; un factor correcto aplicado a la magnitud equivocada sigue siendo un error.',
      context: 'Masa, volumen, concentración y caudal son magnitudes distintas aunque compartan números.',
      applications: ['Conversión de magnitudes y unidades', 'Equivalencias para informes y especificaciones', 'Preparación de datos para modelos', 'Verificación de unidades de campo'],
      mistakes: ['Mezclar magnitudes diferentes', 'Usar factores redondeados en cálculos encadenados', 'Confundir concentración másica con molar'],
      limitation: 'Los factores son estándar; la validez depende de que la magnitud y la base de la conversión sean las correctas.'
    },
    decision: {
      what: 'La decisión multicriterio ordena alternativas con criterios explícitos. Los pesos expresan preferencias y los puntajes describen desempeño; ambos deben normalizarse y justificarse.',
      context: 'Un ranking no es una verdad objetiva: es el resultado de una estructura de criterios, pesos y reglas declaradas.',
      applications: ['Priorización de alternativas', 'Análisis jerárquico y ponderación', 'Selección de tecnologías o sitios', 'Análisis de sensibilidad de la decisión'],
      mistakes: ['Confundir peso con puntaje', 'No normalizar criterios en escalas distintas', 'Presentar el ranking sin análisis de sensibilidad'],
      limitation: 'El resultado depende de los pesos y criterios elegidos; documenta la participación y prueba escenarios alternativos.'
    },
    analysis: {
      what: 'El análisis de datos convierte observaciones en evidencia. La calidad, la independencia, la representatividad y los supuestos del modelo determinan si una conclusión es defendible.',
      context: 'Una correlación no implica causalidad; un buen ajuste no garantiza un modelo válido fuera del rango observado.',
      applications: ['Series de tiempo y tendencias', 'Regresión y modelos explicativos', 'Análisis multivariado y PCA', 'Calidad de datos y simulación'],
      mistakes: ['Confundir correlación con causalidad', 'Ignorar supuestos de independencia o normalidad', 'Sobreajustar el modelo a los datos de ejemplo'],
      limitation: 'Los datos de ejemplo son sintéticos o referenciales; la inferencia requiere el diseño de muestreo y los datos reales.'
    },
    spatial: {
      what: 'El análisis espacial relaciona geometrías, atributos y posiciones. El sistema de referencia, la escala y la topología determinan si una distancia, un área o una intersección son válidos.',
      context: 'Grados no son metros; un buffer en coordenadas geográficas no tiene la misma distancia en todas las direcciones.',
      applications: ['Coordenadas y transformación de datum', 'Distancias, áreas y buffers', 'Validación de geometrías y topología', 'Exportación a SIG y mapas'],
      mistakes: ['Mezclar sistemas de referencia', 'Calcular distancias en grados como si fueran metros', 'Ignorar geometrías inválidas o auto-intersecciones'],
      limitation: 'La precisión depende de la fuente y del datum; verifica en el SIG de destino antes de tomar decisiones territoriales.'
    },
    population: {
      what: 'La demografía describe tamaño, estructura y cambio de una población. Las tasas, proporciones y proyecciones dependen de la definición de la población, el periodo y los supuestos de migración y fecundidad.',
      context: 'Una tasa y una proporción no son intercambiables; la base poblacional debe ser la misma en numerador y denominador.',
      applications: ['Indicadores de dependencia y estructura', 'Proyecciones y escenarios', 'Demanda de servicios y agua', 'Análisis de migración y envejecimiento'],
      mistakes: ['Confundir tasa con proporción', 'Usar cohortes o años incompatibles', 'Ignorar migración o cambios de definición'],
      limitation: 'Las proyecciones son escenarios condicionados por supuestos; actualízalas con censos y estadísticas oficiales.'
    }
  };

  const GENERIC = {
    what: 'Esta herramienta resuelve un cálculo técnico con entradas explícitas, unidades declaradas y un resultado reproducible.',
    context: 'Revisa el alcance, la procedencia de los datos y los supuestos antes de usar el resultado en una decisión.',
    applications: ['Cálculo técnico de apoyo', 'Verificación de órdenes de magnitud', 'Preparación de insumos para informes', 'Comparación de escenarios'],
    mistakes: ['Usar valores de ejemplo como datos de diseño', 'No verificar unidades y bases de cálculo', 'Ignorar las limitaciones declaradas'],
    limitation: 'Los resultados son de apoyo técnico; la decisión final requiere revisión profesional y datos del caso.'
  };

  function list(items) {
    const a = (items || []).filter(Boolean);
    if (!a.length) return '';
    if (a.length === 1) return a[0];
    return a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];
  }
  function safeId(value) {
    return String(value == null ? 'tool' : value).replace(/[^a-zA-Z0-9_-]/g, '-');
  }
  function normalizeRefs(t, d, g) {
    const raw = g.refs || d.refs || t.refs || [];
    return raw.filter(r => Array.isArray(r) && r[0]).map(r => [String(r[0]), r[1] ? String(r[1]) : '']);
  }
  function optionLabel(f) {
    const found = (f.options || []).find(o => String(o[0]) === String(f.value));
    return found ? found[1] : String(f.value == null ? '' : f.value);
  }
  function tableShape(value) {
    const lines = String(value == null ? '' : value).trim().split(/\r?\n/).filter(s => s.trim());
    if (!lines.length) return 'tabla vacía';
    const cols = Math.max(1, ...lines.map(s => s.trim().split(/[;\t]/).length));
    return lines.length + (lines.length === 1 ? ' fila' : ' filas') + ' × ' + cols + (cols === 1 ? ' columna' : ' columnas');
  }
  function defaultInputs(d) {
    const v = {};
    for (const f of d.fields || []) {
      try {
        if (f.type === 'table' && !f.raw) v[f.key] = G.lab.matrix(f.value);
        else if (f.type === 'select' || f.type === 'text' || f.raw) v[f.key] = f.value;
        else v[f.key] = G.lab.number(String(f.value));
      } catch (error) {
        return null;
      }
    }
    return v;
  }
  function evaluate(d) {
    if (!d || !Array.isArray(d.fields) || typeof d.calc !== 'function' || !G.lab) return null;
    try {
      const values = defaultInputs(d);
      if (!values) return null;
      const result = d.calc(values);
      if (!result || !Array.isArray(result.metrics)) return null;
      return { metrics: result.metrics.filter(m => Array.isArray(m) && m.length >= 2) };
    } catch (error) {
      return null;
    }
  }
  function metricValue(value) {
    return typeof value === 'number' && Number.isFinite(value) ? G.fmtSmart(value) : String(value == null ? '—' : value);
  }
  function fieldNote(f) {
    if (f.type === 'select') return 'Opciones: ' + (f.options || []).map(o => o[1]).join(' · ') + '.';
    if (f.type === 'table') return f.hint || 'Una fila por observación; separa columnas con punto y coma.';
    const bits = [];
    if (f.hint) bits.push(f.hint);
    if (f.min !== undefined) bits.push('Mínimo ' + G.fmt(f.min, 6) + '.');
    if (f.max !== undefined) bits.push('Máximo ' + G.fmt(f.max, 6) + '.');
    return bits.join(' ');
  }
  function sectionHTML(id, title, body) {
    return '<section class="tg-section" id="' + id + '" tabindex="-1"><h2>' + E(title) + '</h2>' + body + '</section>';
  }

  function guideFor(t) {
    if (!t) return null;
    const d = t.lab || t;
    const g = t.guide || d.guide || {};
    const suite = G.suites[t.suite] || G.suites[d.suite] || {};
    const info = SUITE[t.suite] || SUITE[d.suite] || GENERIC;
    const title = t.title || d.title || 'Herramienta';
    const fields = Array.isArray(d.fields) ? d.fields : (Array.isArray(g.fields) ? g.fields : []);
    const method = String(g.formula || d.method || '').trim();
    const desc = String(t.desc || d.desc || '').trim();
    const clearDesc = desc && desc !== method && !/[=→]/.test(desc) ? desc : '';
    const evaluated = evaluate(d);
    const metrics = evaluated ? evaluated.metrics : (Array.isArray(g.outputs) ? g.outputs : []);
    const refs = normalizeRefs(t, d, g);
    const tags = (t.tags || d.tags || []).filter(Boolean);
    const base = 'guia-' + safeId(t.id || d.id);

    const inputNames = fields.slice(0, 4).map(f => String(f.label || f.key).toLowerCase());
    const outputNames = metrics.slice(0, 2).map(m => String(m[0]).toLowerCase());
    const primary = metrics[0];
    const primaryText = primary ? String(primary[0]) + (primary[2] ? ' (' + primary[2] + ')' : '') : '';

    let overview = String(g.overview || clearDesc || '').trim();
    if (!overview) {
      overview = title + ' es una calculadora de ' + String(suite.name || 'análisis ambiental').toLowerCase() +
        (inputNames.length ? ' que parte de ' + list(inputNames) : ' que trabaja con entradas explícitas') +
        (outputNames.length ? ' y devuelve ' + list(outputNames) : ' y devuelve un resultado trazable') + '.';
    }
    if (primaryText && !overview.toLowerCase().includes(String(primary[0]).toLowerCase())) {
      overview += ' El resultado principal es ' + primaryText + '.';
    }
    if (info.context) overview += ' ' + info.context;

    const howTo = Array.isArray(g.howTo) && g.howTo.length ? g.howTo : [
      'Confirma que la categoría ' + (suite.name || 'de la herramienta') + ' y el alcance descrito corresponden a tu caso.',
      fields.length
        ? 'Ingresa ' + list(inputNames) + '. Los valores iniciales son un ejemplo, no un diseño.'
        : 'Ajusta los controles de la calculadora con los datos de tu escenario.',
      primaryText
        ? 'Lee el resultado principal (' + primaryText + ') y contrasta la tabla, el gráfico o el mensaje de interpretación.'
        : 'Revisa el resultado y la tabla de salida antes de exportar.',
      'Exporta el informe o el CSV si necesitas dejar trazabilidad de entradas, fórmula y resultado.',
      'Si el valor no es plausible, revisa las limitaciones y los errores comunes antes de cambiar el modelo.'
    ];

    const inputRows = fields.map(f => {
      const note = fieldNote(f);
      const value = f.type === 'table' ? tableShape(f.value) : f.type === 'select' ? optionLabel(f) : String(f.value == null ? '' : f.value);
      return '<div class="tg-io-row"><div><b>' + E(f.label || f.key) + '</b>' + (note ? '<small>' + E(note) + '</small>' : '') + '</div><span>' + E(value) + (f.unit ? ' <em>' + E(f.unit) + '</em>' : '') + '</span></div>';
    }).join('');
    const outputRows = metrics.map(m => {
      const unit = m[2] ? ' <em>' + E(m[2]) + '</em>' : '';
      return '<div class="tg-io-row"><div><b>' + E(m[0]) + '</b></div><span>' + E(metricValue(m[1])) + unit + '</span></div>';
    }).join('');

    const exampleRows = fields.slice(0, 8).map(f => {
      const value = f.type === 'table' ? tableShape(f.value) : f.type === 'select' ? optionLabel(f) : String(f.value == null ? '' : f.value);
      return '<tr><th>' + E(f.label || f.key) + '</th><td>' + E(value) + (f.unit ? ' ' + E(f.unit) : '') + '</td></tr>';
    }).join('');
    const resultRows = metrics.map(m => '<tr><th>' + E(m[0]) + '</th><td><b>' + E(metricValue(m[1])) + '</b>' + (m[2] ? ' ' + E(m[2]) : '') + '</td></tr>').join('');

    let exampleHTML = '';
    if (typeof g.example === 'string' && g.example.trim()) {
      exampleHTML = '<p>' + E(g.example) + '</p>';
    } else if (evaluated && metrics.length) {
      exampleHTML = '<p>Los valores iniciales de la calculadora producen el siguiente resultado. Es un ejemplo de funcionamiento, no un caso de diseño.</p>' +
        (exampleRows ? '<div class="tg-io"><div class="tg-io-card"><h3>Entradas de ejemplo</h3><table class="tg-table">' + exampleRows + '</table></div><div class="tg-io-card"><h3>Salidas de ejemplo</h3><table class="tg-table">' + resultRows + '</table></div></div>' : '') +
        '<p class="tg-note">Puedes cambiar cualquier entrada en la calculadora y volver a este ejemplo con Restablecer.</p>';
    } else {
      exampleHTML = '<div data-guide-example><p>Los valores de ejemplo ya están cargados en la calculadora. Ajusta una entrada, observa el cambio y usa Restablecer para volver al escenario inicial.</p>' +
        (g.exampleNote ? '<p class="tg-note">' + E(g.exampleNote) + '</p>' : '') + '</div>';
    }

    const applications = Array.isArray(g.applications) && g.applications.length ? g.applications : info.applications;
    const mistakes = Array.isArray(g.mistakes) && g.mistakes.length ? g.mistakes : info.mistakes;
    const limitations = String(g.limitations || d.limit || info.limitation || GENERIC.limitation).trim();
    const what = String(g.whatIs || '').trim() ||
      info.what + ' «' + title + '» aplica ese marco a ' +
      (tags.length ? list(tags.slice(0, 4)).toLowerCase() : (inputNames.length ? list(inputNames) : 'un cálculo técnico')) + '.';

    const facts = [
      ['Categoría', suite.name || 'General'],
      ['Tipo', d.calc ? 'Modelo determinista' : 'Calculadora interactiva'],
      ['Entradas', fields.length ? fields.length + (fields.length === 1 ? ' campo' : ' campos') : 'Controles en pantalla'],
      ['Salida principal', primaryText || 'Ver calculadora'],
      ['Cálculo', 'Local, en tu navegador'],
      ['Referencias', refs.length ? refs.length + (refs.length === 1 ? ' fuente' : ' fuentes') : 'Método documentado']
    ];

    const sections = [
      {
        id: base + '-calc',
        label: 'Calculadora',
        html: sectionHTML(base + '-calc', 'Calculadora',
          '<p>La calculadora está en la parte superior de esta página. La guía no duplica los controles: explica qué significan, cómo se relacionan y cuándo el resultado deja de ser válido.</p>' +
          '<p><button type="button" class="btn sm" data-guide-target="toolBody">Ir a la calculadora</button></p>')
      },
      {
        id: base + '-overview',
        label: 'Descripción general',
        html: sectionHTML(base + '-overview', 'Descripción general', '<p>' + E(overview) + '</p>')
      },
      {
        id: base + '-how',
        label: 'Cómo usar',
        html: sectionHTML(base + '-how', 'Cómo usar', '<ol class="tg-steps">' + howTo.map(s => '<li>' + E(s) + '</li>').join('') + '</ol>')
      },
      {
        id: base + '-io',
        label: 'Entradas y salidas',
        html: sectionHTML(base + '-io', 'Entradas y salidas',
          '<p>Las unidades se declaran en cada campo. La herramienta no aplica conversiones ocultas: si cambias la unidad, cambia el número.</p>' +
          '<div class="tg-io"><div class="tg-io-card"><h3>Entradas</h3>' + (inputRows || '<p class="tg-note">Esta herramienta no declara campos de entrada fijos; los controles están en la calculadora.</p>') + '</div>' +
          '<div class="tg-io-card"><h3>Salidas</h3>' + (outputRows || '<p class="tg-note">Las salidas se muestran en la calculadora y en la tabla de resultados.</p>') + '</div></div>')
      },
      {
        id: base + '-formula',
        label: 'Fórmula',
        html: sectionHTML(base + '-formula', 'Fórmula',
          method
            ? '<div class="tg-formula">' + E(method) + '</div><p class="tg-note">La fórmula se aplica con las unidades indicadas en cada entrada. Los factores y constantes deben corresponder al método y a la fuente declarada.</p>'
            : '<p>Esta calculadora interactiva combina varios cálculos según el modo o los datos seleccionados; no tiene una única expresión cerrada en esta ficha. Las convenciones y las expresiones aplicadas se documentan en la sección «Método» de la propia herramienta y en el informe exportado.</p>')
      },
      {
        id: base + '-what',
        label: '¿Qué es?',
        html: sectionHTML(base + '-what', '¿Qué es ' + title + '?', '<p>' + E(what) + '</p>')
      },
      {
        id: base + '-facts',
        label: 'Datos clave',
        html: sectionHTML(base + '-facts', 'Datos clave',
          '<div class="tg-facts">' + facts.map(([k, v]) => '<div class="tg-fact"><span>' + E(k) + '</span><b>' + E(v) + '</b></div>').join('') + '</div>')
      },
      {
        id: base + '-apps',
        label: 'Aplicaciones',
        html: sectionHTML(base + '-apps', 'Aplicaciones', '<ul class="tg-list">' + applications.map(s => '<li>' + E(s) + '</li>').join('') + '</ul>')
      },
      {
        id: base + '-example',
        label: 'Ejemplo de cálculo',
        html: sectionHTML(base + '-example', 'Ejemplo de cálculo', exampleHTML)
      },
      {
        id: base + '-refs',
        label: 'Normas y referencias',
        html: sectionHTML(base + '-refs', 'Normas y referencias',
          refs.length
            ? '<p>Fuentes declaradas por la herramienta. Úsalas para verificar el método, los factores y el alcance antes de citar el resultado.</p><ul class="tg-refs">' +
              refs.map(([label, url]) => '<li>' + (url ? '<a href="' + E(url) + '" target="_blank" rel="noopener noreferrer">' + E(label) + ' ↗</a>' : E(label)) + '</li>').join('') + '</ul>'
            : '<p>Esta ficha no declara referencias externas. El método y los supuestos están descritos en la fórmula y en las limitaciones; si necesitas citar una norma, verifica la edición vigente y el alcance jurisdiccional.</p>')
      },
      {
        id: base + '-limits',
        label: 'Limitaciones',
        html: sectionHTML(base + '-limits', 'Limitaciones',
          '<p>' + E(limitations) + '</p><p class="tg-note">Un resultado válido para un escenario no es automáticamente válido para otro. Revisa unidades, frontera del sistema, representatividad de los datos y vigencia de los factores.</p>')
      },
      {
        id: base + '-mistakes',
        label: 'Errores comunes',
        html: sectionHTML(base + '-mistakes', 'Errores comunes', '<ul class="tg-list tg-list--warn">' + mistakes.map(s => '<li>' + E(s) + '</li>').join('') + '</ul>')
      }
    ];

    return {
      id: base,
      title: title,
      suite: suite,
      color: suite.color || 'var(--brand-teal)',
      sections: sections
    };
  }

  function guideHTML(t) {
    const data = guideFor(t);
    if (!data) return '';
    const toc = data.sections.map((s, i) =>
      '<button type="button" class="tg-toc-link" data-guide-target="' + s.id + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + E(s.label) + '</button>'
    ).join('');
    return '<details class="tool-guide panel" id="' + data.id + '" style="--sc:' + E(data.color) + '">' +
      '<summary class="tg-summary">' +
        '<span class="tg-summary-icon" aria-hidden="true">' + G.icon('book', 'sm') + '</span>' +
        '<span class="tg-summary-text"><b>Guía de la herramienta</b><small>' + E(data.title) + ' · ' + data.sections.length + ' secciones · descripción, fórmula, ejemplo, referencias y errores comunes</small></span>' +
        '<span class="tg-chevron" aria-hidden="true">' + G.icon('arrow', 'sm') + '</span>' +
      '</summary>' +
      '<div class="tg-body">' +
        '<nav class="tg-toc" aria-label="Secciones de la guía">' + toc + '</nav>' +
        '<div class="tg-content">' + data.sections.map(s => s.html).join('') + '</div>' +
      '</div>' +
    '</details>';
  }

  /* Las calculadoras personalizadas no exponen `calc`; su informe sí devuelve
     entradas y resultados. Se usa después del montaje para completar el ejemplo
     con el escenario inicial real, sin volver a ejecutar la interfaz. */
  function hydrateGuide(t, root) {
    if (!t || t.lab || !root) return;
    const slot = root.querySelector('.tool-guide [data-guide-example]');
    if (!slot || typeof t.report !== 'function') return;
    let report = null;
    try { report = t.report(); } catch (error) { return; }
    if (!report) return;
    const inputs = (report.inputs || []).filter(r => Array.isArray(r) && r.length >= 2).slice(0, 8);
    const results = (report.results || []).filter(r => Array.isArray(r) && r.length >= 2).slice(0, 8);
    if (!inputs.length && !results.length) return;
    const inputRows = inputs.map(r => '<tr><th>' + E(r[0]) + '</th><td>' + E(r[1]) + '</td></tr>').join('');
    const resultRows = results.map(r => '<tr><th>' + E(r[0]) + '</th><td><b>' + E(r[1]) + '</b>' + (r[2] ? ' ' + E(r[2]) : '') + '</td></tr>').join('');
    const io = root.querySelector('.tool-guide [id$="-io"] .tg-io');
    if (io) {
      io.innerHTML = '<div class="tg-io-card"><h3>Entradas</h3><table class="tg-table">' + inputRows + '</table></div>' +
        '<div class="tg-io-card"><h3>Salidas</h3><table class="tg-table">' + resultRows + '</table></div>';
    }
    const facts = root.querySelectorAll('.tool-guide [id$="-facts"] .tg-fact b');
    if (facts.length >= 4 && results.length) {
      if (inputs.length) facts[2].textContent = inputs.length + (inputs.length === 1 ? ' campo' : ' campos');
      facts[3].textContent = String(results[0][0]) + (results[0][2] ? ' (' + results[0][2] + ')' : '');
    }
    slot.innerHTML = '<p>Ejemplo con los valores iniciales de la calculadora. Es una comprobación de funcionamiento, no un caso de diseño.</p>' +
      (report.subtitle ? '<p class="tg-note">Escenario de referencia: ' + E(report.subtitle) + '</p>' : '') +
      '<div class="tg-io">' +
        '<div class="tg-io-card"><h3>Entradas de ejemplo</h3><table class="tg-table">' + inputRows + '</table></div>' +
        '<div class="tg-io-card"><h3>Salidas de ejemplo</h3><table class="tg-table">' + resultRows + '</table></div>' +
      '</div>' +
      '<p class="tg-note">Puedes cambiar cualquier entrada en la calculadora y volver a este ejemplo con Restablecer.</p>';

    const formula = root.querySelector('.tool-guide [id$="-formula"]');
    if (formula && report.method && !formula.querySelector('.tg-formula')) {
      formula.innerHTML = '<h2>Fórmula</h2><div class="tg-formula">' + report.method + '</div>' +
        '<p class="tg-note">La fórmula se aplica con las unidades indicadas en cada entrada. Los factores y constantes deben corresponder al método y a la fuente declarada.</p>';
    }
    const limits = root.querySelector('.tool-guide [id$="-limits"]');
    const notes = (report.notes || []).filter(Boolean);
    if (limits && notes.length) {
      limits.insertAdjacentHTML('beforeend', '<h3 class="tg-subhead">Notas del modelo</h3><ul class="tg-list">' +
        notes.map(n => '<li>' + E(n) + '</li>').join('') + '</ul>');
    }
  }

  G.guideFor = guideFor;
  G.guideHTML = guideHTML;
  G.hydrateGuide = hydrateGuide;
})();
