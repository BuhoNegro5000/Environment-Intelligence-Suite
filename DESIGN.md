---
name: Green Owl Labs
description: Suite de cálculo ambiental en español con estética de estación de monitoreo.
colors:
  signal-green: "#8BE05A"
  signal-green-bright: "#C9F56F"
  signal-ink: "#08210F"
  console-green: "#07130D"
  console-green-raised: "#0D2116"
  console-green-input: "#112A1C"
  console-green-high: "#163420"
  instrument-line: "#22452F"
  instrument-line-soft: "#193526"
  readout-white: "#E9F4EE"
  readout-secondary: "#C2D6CB"
  readout-muted: "#8BA79A"
  readout-faint: "#648274"
  warning-amber: "#F2B45A"
  info-cyan: "#66C7E8"
  alert-rose: "#F07E8A"
  method-violet: "#B4A4F5"
  daylight-canvas: "#F4F7F0"
  daylight-panel: "#FFFFFF"
  daylight-signal: "#2E7D32"
  daylight-ink: "#10241B"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(30px, 4vw, 52px)"
    fontWeight: 650
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(24px, 2.8vw, 34px)"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  control:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "11.5px"
    fontWeight: 550
    lineHeight: 1.2
    letterSpacing: "0em"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "0.16em"
  data:
    fontFamily: "ui-monospace, SFMono-Regular, Cascadia Mono, Roboto Mono, Menlo, Consolas, monospace"
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.04em"
rounded:
  xs: "7px"
  sm: "9px"
  md: "10px"
  lg: "12px"
  badge: "14px"
  xl: "15px"
  panel: "18px"
  hero: "26px"
  pill: "999px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  2xl: "34px"
components:
  button-primary:
    backgroundColor: "{colors.signal-green}"
    textColor: "{colors.signal-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "8px 13px"
  button-secondary:
    backgroundColor: "{colors.console-green-input}"
    textColor: "{colors.readout-secondary}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "8px 13px"
  input-field:
    backgroundColor: "{colors.console-green-input}"
    textColor: "{colors.readout-white}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "9px 10px"
  chip:
    backgroundColor: "{colors.console-green-raised}"
    textColor: "{colors.readout-muted}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "7px 11px"
  tool-card:
    backgroundColor: "{colors.console-green-raised}"
    rounded: "{rounded.xl}"
    padding: "17px"
  panel:
    backgroundColor: "{colors.console-green-raised}"
    rounded: "{rounded.panel}"
    padding: "20px"
  metric:
    backgroundColor: "{colors.console-green-input}"
    rounded: "{rounded.lg}"
    padding: "12px"
  navigation-link:
    backgroundColor: "{colors.console-green-raised}"
    textColor: "{colors.readout-secondary}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "7px 10px 7px 12px"
  verdict-badge:
    backgroundColor: "{colors.console-green-input}"
    textColor: "{colors.readout-white}"
    rounded: "{rounded.badge}"
    padding: "14px 16px"
---

# Design System: Green Owl Labs

## Overview

**Creative North Star: "La estación de monitoreo"**

La suite se lee como una consola nocturna de instrumentos: fondo verde profundo, superficies apenas más claras que se apilan sin ruido, cifras en monoespaciada que ocupan el lugar del protagonista y un verde señal que solo se enciende cuando hay algo que mirar. No es una landing comercial ni un panel SaaS de tarjetas blandas; es el puesto donde alguien compara un resultado contra un límite normativo y necesita ver de inmediato qué está dentro, qué está al borde y qué está fuera.

La densidad es deliberada. La navegación lateral de 268 px sostiene 339 herramientas en 22 categorías sin convertirse en un menú infinito; el área de trabajo usa paneles de borde fino, etiquetas en versalitas y tablas compactas porque el usuario lee supuestos y unidades, no párrafos de marketing. El contraste entre texto claro y fondo oscuro hace el trabajo que en otros sistemas haría una sombra.

La personalidad visual es **precisa, sobria e instrumentada**. El movimiento existe para confirmar una acción —un borde que se enciende, una tarjeta que sube 2 px, un panel que se desliza— y nunca para decorar. La autoridad narrativa la da la jerarquía, no el color.

**Key Characteristics:**
- Densidad alta y jerarquía explícita, con etiquetas pequeñas en mayúsculas sobre valores grandes en mono.
- Acento verde escaso: aparece en el estado activo, el veredicto, la cifra principal y el foco de teclado.
- Profundidad por capas tonales, no por sombras; la sombra se reserva para lo que flota.
- Bordes de 1 px como estructura; radios medianos que se abren según el tamaño del contenedor.
- Tema claro disponible como "turno de día", con la misma lógica y el verde oscurecido.

## Colors

Paleta de dos familias: verdes de consola para las superficies y un verde señal casi fluorescente para el estado. El color funcional (ámbar, cian, rosa, violeta) nunca es decorativo: cada uno tiene un significado estable.

### Primary
- **Verde señal** (#8BE05A): acento del sistema. Marca el ítem de navegación activo, el botón primario, la cifra principal de una métrica, el foco de teclado, la barra de progreso y el borde de los campos enfocados.
- **Verde señal alto** (#C9F56F): segunda voz del acento, para hover del primario y extremos de degradados de estado.
- **Tinta sobre señal** (#08210F): texto sobre relleno verde. Nunca usar blanco sobre el acento: el contraste se pierde.

### Secondary
- **Ámbar de advertencia** (#F2B45A): estados "al límite", favoritos guardados y veredictos que requieren atención sin llegar a incumplimiento.
- **Cian de información** (#66C7E8): datos auxiliares, series secundarias de gráfico y referencias de método.
- **Rosa de alerta** (#F07E8A): excedencias y errores de validación. Es el único rojo suave del sistema; el rojo puro (`#ff7d7d`) se reserva para texto de error.
- **Violeta de método** (#B4A4F5): categorías analíticas y series de comparación que no son estado.

### Neutral
- **Verde consola** (#07130D): lienzo de la aplicación y color de fondo del documento.
- **Verde consola elevado** (#0D2116): superficie base de paneles y tarjetas.
- **Verde consola de entrada** (#112A1C): campos, botones secundarios, métricas y todo lo que "recibe" información.
- **Verde consola alto** (#163420): tercer nivel, para lo presionado, lo seleccionado y los controles segmentados.
- **Línea de instrumento** (#22452F) y **línea suave** (#193526): bordes de 1 px. La línea suave estructura; la línea fuerte separa controles.
- **Blanco de lectura** (#E9F4EE): texto principal. **Secundario** (#C2D6CB): descripciones y valores de tabla. **Atenuado** (#8BA79A): etiquetas y ayudas. **Tenue** (#648274): metadatos, numeración y texto que no debe competir.

### Turno de día
El tema claro invierte los neutros sin tocar la semántica: **lienzo de día** (#F4F7F0), **panel de día** (#FFFFFF), **tinta de expediente** (#10241B) y **verde normativo diurno** (#2E7D32), que reemplaza al verde señal para conservar contraste sobre blanco. Un componente nuevo debe declarar ambos temas usando las variables, nunca un hex directo.

### Named Rules
**La regla del verde escaso.** El verde señal no debe cubrir más de ~10 % de la superficie visible. Si dos bloques compiten por el acento, uno de los dos está mal jerarquizado.

**La regla del color con significado.** Ámbar, cian, rosa y violeta solo aparecen asociados a un estado o a una serie declarada en la leyenda. Nunca se usan para "dar vida" a una tarjeta.

## Typography

**Display Font:** Inter con reserva del sistema (`-apple-system`, `Segoe UI`, `Roboto`, `Helvetica`, `Arial`)
**Body Font:** la misma pila sans
**Label/Mono Font:** monoespaciada del sistema (`ui-monospace`, `Cascadia Mono`, `Roboto Mono`, `Menlo`, `Consolas`)

**Character:** una sola familia sans para todo el texto y una mono para todo lo que se mide. La sans es neutra y no pide atención; la mono es la que firma el sistema, porque en esta suite un número es una afirmación verificable. Inter está declarada primero, pero **no se empaqueta ni se carga con `@font-face`**: en la práctica se renderiza la fuente del sistema operativo. Cualquier pantalla nueva debe aceptar esa sustitución sin romper la métrica.

### Hierarchy
- **Display** (650, `clamp(30px, 4vw, 52px)`, 1.02, -0.035em): solo el `h1` de la portada, con ancho máximo de 16 caracteres por línea. En móvil baja a 30 px.
- **Headline** (650, `clamp(24px, 2.8vw, 34px)`, 1.15): título de una herramienta. Nunca dos titulares de este tamaño en la misma vista.
- **Title** (650, 20px, 1.15): cabecera de sección y `h2` de panel de resultados.
- **Body** (400, 15px, 1.55): texto corrido y descripciones. El área de lectura se limita a 58–78 caracteres por línea.
- **Control** (550, 11.5px, 1.2): etiquetas de botón, campos y navegación. Es el tamaño más pequeño que se usa para texto accionable.
- **Label** (650, 9.5–10px, 1.2, 0.10–0.18em, mayúsculas): encabezados de panel, subsecciones y metadatos. Nunca para frases completas.
- **Data** (600, 21px, 1.1, -0.04em, mono): valor de una métrica. La cifra principal de una vista sube a 32 px y toma el verde señal.

### Named Rules
**La regla de la cifra primero.** Todo resultado numérico va en mono, con la etiqueta arriba en versalitas y la unidad en un `small` debajo. Una cifra sin unidad o sin período de promedio es un defecto, no un estilo.

**La regla de la versalita corta.** Las mayúsculas con tracking solo se aplican a etiquetas de hasta cuatro palabras. Si el texto necesita leerse como frase, va en caja baja y en cuerpo.

**Tensión conocida.** La escala densa usa 9–10.5 px en tablas, metadatos y leyendas de gráfico. Es legible en escritorio, pero no debe reducirse más y es el primer candidato a revisión en accesibilidad móvil.

## Layout

El esqueleto es una rejilla de dos columnas: barra lateral fija de 268 px y área principal fluida con `max-width: 1480px` centrada. La barra lateral es `position: sticky` a altura completa y contiene marca, nota de estado, navegación agrupada por categoría y acciones de pie. La barra superior también es sticky, con migas de pan a la izquierda y búsqueda, tema y menú a la derecha; usa fondo translúcido con `backdrop-filter: blur(14px)`.

El contenido respira con un ritmo fijo: 30 px arriba, 34 px a los lados y 60 px abajo en escritorio. Las vistas de herramienta usan una rejilla de dos columnas iguales (`minmax(0,1fr) minmax(0,1.05fr)`) para entrada y resultado; `.wide-left` da más espacio a la entrada y `.single` colapsa a una columna cuando el dato es una matriz, un mapa o una serie larga. Las tarjetas se distribuyen con `repeat(auto-fill, minmax(268px, 1fr))`, así que el número de columnas lo decide el ancho disponible, no un breakpoint.

Puntos de quiebre observados: **1180 px** reduce la barra lateral a 236 px, colapsa las rejillas de trabajo a una columna y oculta el panel lateral del hero; **860 px** convierte la barra lateral en un cajón deslizante de 270 px con velo, reduce la búsqueda a un icono de 40×36 px y pasa las rejillas de 3–4 columnas a 2; **560 px** deja una sola columna, reduce el padding de paneles a 16 px y fija el título de portada en 30 px. La impresión es un caso aparte: el informe se renderiza sobre blanco, con tres columnas de métricas y sin cabecera ni pie del modal.

La densidad no cambia con el tamaño: cambia el número de columnas. Un campo nunca baja de 9 px de padding interno y un botón nunca baja de 5 px verticales (variante `sm`).

## Elevation & Depth

**Capas tonales, sombra solo al flotar.** La profundidad se construye con cuatro pasos de verde —lienzo, panel, entrada, alto— y con bordes de 1 px que separan sin dibujar cajas duras. Un panel en reposo no proyecta sombra: se distingue por el tono y por `--line-soft`. El sistema no usa degradados de superficie salvo en dos casos declarados: el hero de portada (degradado verde sutil sobre rejilla de 34 px) y el ítem de navegación activo.

La sombra aparece solo cuando algo se separa del plano: modal, cajón lateral móvil, tooltip de gráfico, toast y el panel de estado del hero. Su valor único es amplio y negativo, de modo que se lee como ambiente y no como borde.

### Shadow Vocabulary
- **Ambiente profundo** (`0 24px 70px -30px rgba(0,0,0,.75)`): modales, cajón lateral, toast y tooltip. En tema claro se reemplaza por `0 20px 50px -30px rgba(16,36,27,.28)`.
- **Reposo de tarjeta** (sin sombra): las tarjetas y paneles usan borde y tono. El hover de una tarjeta añade `0 18px 40px -30px rgba(0,0,0,.6)`, una sombra de contacto, no de elevación.
- **Halo de acento** (`0 10px 26px -12px rgba(139,224,90,.5)`): exclusivo del botón primario, para que la acción principal se despegue una vez.

### Named Rules
**La regla de la capa tonal.** Si un bloque necesita destacar, primero se sube un nivel de tono (`panel` → `input` → `high`). La sombra es el último recurso, no el primero.

**La regla del flotante.** Solo lo que puede tapar contenido —modal, cajón, tooltip, toast— proyecta la sombra ambiente. Una tarjeta estática con sombra es un error de sistema.

## Shapes

El lenguaje de formas es rectangular con esquinas suaves y una jerarquía de radio proporcional al tamaño del contenedor: controles pequeños 7 px, controles estándar 9 px, campos y botones de barra 10 px, métricas y cajas internas 12 px, insignias 14 px, tarjetas 15 px, paneles 18 px, y el hero de portada 26 px. Las píldoras usan radio completo y se reservan para chips de filtro, estados y contadores; nunca para botones de acción.

No hay cortes diagonales, blobs, ni contenedores orgánicos. La geometría que sí aparece es la del instrumento: la rejilla de 34 px del hero, las barras de 2 px de las tarjetas de suite, las celdas de 26 px del mapa de calor, el anillo de 100 px del laboratorio y el indicador de 7 px con halo de 4 px. Los bordes son siempre de 1 px; no existe un borde de 2 px decorativo, y el foco de teclado es la única línea que se dibuja por fuera con 2 px.

## Components

### Buttons
- **Shape:** rectángulo de esquinas suaves (9 px), altura implícita por padding de 8×13 px; variante compacta de 5×9 px con radio de 7 px.
- **Primary:** relleno verde señal con tinta oscura y peso 650; el único elemento con halo. Se usa una vez por vista, para la acción que produce el resultado.
- **Hover / Focus:** el secundario aclara el borde y sube un nivel de superficie; el primario sube 1 px y aumenta 6 % el brillo. El foco visible es un contorno de 2 px con 2 px de separación.
- **Secondary / Ghost:** fondo de entrada con borde de línea; existe una variante `danger` con texto rosa y borde translúcido, y una variante de icono de 36×36 px. La acción destructiva nunca es sólida.

### Chips
- **Style:** píldora de 20 px de radio, fondo de panel, borde de 1 px y texto atenuado a 11 px. Los chips filtran, no navegan.
- **State:** activo con fondo verde al 12 %, borde verde al 45 % y texto en verde señal. El hover aclara el texto y el borde, sin cambiar el relleno.

### Cards / Containers
- **Corner Style:** 15 px para tarjetas de herramienta, 16 px para tarjetas de suite, 18 px para paneles, 26 px para el hero.
- **Background:** panel elevado para tarjetas y paneles; entrada para cajas internas como métricas, ítems de lista y campos.
- **Shadow Strategy:** ninguna en reposo; sombra de contacto en hover (ver Elevation & Depth).
- **Border:** 1 px de línea suave; el hover de tarjeta de herramienta sube a verde al 35 %.
- **Internal Padding:** 17 px en tarjeta, 20 px en panel, 16 px en panel compacto y 0 en panel de tabla.

### Inputs / Fields
- **Style:** fondo de entrada, borde de 1 px, radio de 9 px, padding de 9×10 px y tipografía mono a 13 px; la etiqueta va arriba en 10.5 px atenuado, con unidad o símbolo en mono a 9.5 px.
- **Focus:** el borde pasa a verde señal, desaparece el outline y el fondo sube a verde alto. En la calculadora, el contenedor dibuja un contorno de 2 px para no perder el foco cuando el campo es compuesto.
- **Error / Disabled:** borde de peligro con `aria-invalid="true"`; el mensaje se asocia al campo y se muestra debajo en 10.5 px. El estado deshabilitado baja la opacidad al 45 % y no responde a hover.

### Navigation
- **Style:** grupos con encabezado en versalita de 10 px, contador en mono y chevrón; enlaces de 12.75 px con número de orden en mono y radio de 9 px.
- **States:** hover con velo translúcido; activo con degradado verde de izquierda a derecha, borde verde al 22 % y una barra de 2 px en el borde izquierdo. En móvil el grupo se convierte en cajón con velo y las migas bajan a 10 px.
- **Top bar:** migas truncadas con elipsis, búsqueda de 250 px que se reduce a icono, botón de tema y menú de 36 px.

### Metrics (signature)
La métrica es la unidad narrativa del sistema: etiqueta de 9.5 px en mayúsculas, cifra en mono de 21 px y unidad o nota en 9.5 px tenue. La métrica principal ocupa dos columnas, sube la cifra a 32 px y usa un degradado verde al 13 % con borde verde al 30 %. Las variantes de tono (`warn`, `bad`) cambian borde, fondo y cifra, nunca la tipografía: el color informa el estado, la forma sigue siendo la misma.

### Verdict Badge (signature)
Insignia de veredicto con icono cuadrado de 52 px y radio de 14 px, título de 15 px y explicación de 10.5 px. Es el cierre de un cálculo: dice si el resultado cumple, y la variante de tono (`ok`, `warn`, `bad`) se acompaña siempre de texto. Un veredicto sin explicación se considera incompleto.

### Instrument Grid (signature)
Rejilla de fichas de color para datos categóricos continuos, usada por la carta Munsell. Las fichas no llevan texto: las coordenadas viven en los ejes (value en filas, chroma en columnas) y la notación completa aparece en la lectura inferior. La ficha seleccionada usa doble anillo —contorno de texto y halo de acento—; la ficha más cercana a un dato analizado se marca con un pulso de 2 px. El hover eleva 2 px y escala 1.05; el foco de teclado recorre la malla con flechas, Inicio y Fin. En móvil la rejilla se desplaza en horizontal con un degradado que insinúa el corte, nunca se comprime por debajo de 46 px por ficha.

**La regla de la ficha limpia.** Una ficha de color no repite su etiqueta dentro del relleno. Si hace falta el valor exacto, se lee en el eje o en la lectura inferior; la pureza del color es el dato.

### Result Readout (signature)
El banco no deja una tabla numérica sin lectura visual. Toda tabla de 2 a 24 filas con una columna de identidad y una medida se abre en barras horizontales; las series temporales y las curvas —hasta 400 puntos— se abren en una línea con área. El encabezado declara el campo medido y la escala —desde cero o centrada en cero— y un conmutador `Barras | Tabla` (o `Tendencia | Tabla`) conserva el dato exacto a un clic o una tecla. Los valores viven en mono a la derecha; las barras entran escalonadas 24 ms por fila y la línea se dibuja una sola vez. En móvil la etiqueta cede ancho antes que la barra y la tabla se desplaza en horizontal.

**La regla del eje honesto.** Las barras parten de cero; si hay negativos, se dibuja la línea de cero y la barra cambia de lado. El eje no se recorta para dramatizar una diferencia. En una tendencia el eje se ajusta al rango observado y ese rango se declara en la nota.

**La regla de la tabla a un toque.** Toda visualización conserva su tabla de resultados a un clic o una tecla; el gráfico no reemplaza el dato exportable.

## Do's and Don'ts

### Do:
- **Do** usar la mono para toda cifra, unidad, identificador, huella y versión; la sans queda para lenguaje.
- **Do** mantener el borde en 1 px y resolver la separación con tono (`panel` → `input` → `high`).
- **Do** declarar color mediante las variables del tema, de modo que el modo claro siga funcionando sin retoques.
- **Do** repetir la estructura de la métrica: etiqueta arriba, cifra en mono, unidad o período debajo.
- **Do** acompañar cada veredicto con su razón y su referencia normativa o método.
- **Do** respetar `prefers-reduced-motion`: el sistema ya anula animaciones y transiciones, y cualquier animación nueva debe hacer lo mismo.
- **Do** mantener el foco visible con 2 px de acento y 2 px de separación, incluso dentro de controles compuestos.
- **Do** abrir toda tabla numérica en su lectura visual y dejar la tabla a un clic o una tecla.

### Don't:
- **Don't** teñir superficies completas de verde señal ni usarlo como fondo de secciones; su valor es la rareza.
- **Don't** añadir sombras a paneles o tarjetas en reposo: rompe la lógica de capas tonales.
- **Don't** usar radios de píldora en botones de acción ni radios menores a 7 px en controles.
- **Don't** poner texto blanco sobre el verde señal; la tinta oscura es la única combinación válida.
- **Don't** bajar de 9 px en etiquetas ni de 11.5 px en texto accionable; la densidad no justifica ilegibilidad.
- **Don't** usar barras para una matriz cuadrada ni para una tabla sin eje: ahí la tabla es la lectura correcta.
- **Don't** introducir una segunda familia tipográfica ni iconos de fuente: los iconos del sistema son SVG o glifos textuales ya establecidos.
- **Don't** mostrar una cifra sin unidad, sin período de promedio o sin modelo declarado cuando el resultado es normativo.
