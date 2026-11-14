---
name: Yupana · Environmental Intelligence
description: Suite de cálculo ambiental en español con la lógica visual de un tablero de contar andino.
colors:
  brand-ink: "#1F4D3A"
  brand-teal: "#2A8C82"
  brand-gold: "#D9A441"
  brand-slate: "#3D5A4E"
  accent: "#1F6F66"
  accent-ink: "#FFFFFF"
  paper-canvas: "#F6F5EF"
  paper-panel: "#FFFFFF"
  paper-input: "#FAF9F4"
  paper-high: "#EFEEE5"
  paper-line: "#DCDBCE"
  paper-line-soft: "#E8E7DC"
  paper-text: "#16241E"
  paper-text-secondary: "#33473E"
  paper-muted: "#5F7268"
  paper-faint: "#87978E"
  dark-canvas: "#0B1A14"
  dark-panel: "#132A20"
  dark-input: "#173227"
  dark-high: "#1C3B2E"
  dark-line: "#2A4A3A"
  dark-line-soft: "#1F3A2D"
  readout-white: "#F0F4EE"
  readout-secondary: "#CBDAD1"
  readout-muted: "#93A99C"
  readout-faint: "#6F8879"
  dark-accent: "#6BC9B6"
  warning-amber: "#8A6214"
  info-sky: "#2C6E86"
  alert-rose: "#A34A4A"
  method-violet: "#5E4E8A"
  chart-teal: "#2A8C82"
  chart-gold: "#A57B1F"
  chart-blue: "#5277A8"
  chart-clay: "#B06060"
  chart-violet: "#77679A"
  chart-olive: "#5F8A3A"
typography:
  display:
    fontFamily: "Space Grotesk, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(32px, 4.2vw, 54px)"
    fontWeight: 650
    lineHeight: 1.03
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Space Grotesk, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(24px, 2.8vw, 34px)"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Space Grotesk, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "21px"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.025em"
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
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "8px 13px"
  button-secondary:
    backgroundColor: "{colors.paper-input}"
    textColor: "{colors.paper-text-secondary}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "8px 13px"
  input-field:
    backgroundColor: "{colors.paper-input}"
    textColor: "{colors.paper-text}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "9px 10px"
  chip:
    backgroundColor: "{colors.paper-panel}"
    textColor: "{colors.paper-muted}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    padding: "7px 11px"
  tool-card:
    backgroundColor: "{colors.paper-panel}"
    rounded: "{rounded.xl}"
    padding: "17px"
  panel:
    backgroundColor: "{colors.paper-panel}"
    rounded: "{rounded.panel}"
    padding: "20px"
  metric:
    backgroundColor: "{colors.paper-input}"
    rounded: "{rounded.lg}"
    padding: "12px"
  navigation-link:
    backgroundColor: "{colors.paper-panel}"
    textColor: "{colors.paper-text-secondary}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "7px 10px 7px 12px"
  verdict-badge:
    backgroundColor: "{colors.paper-input}"
    textColor: "{colors.paper-text}"
    rounded: "{rounded.badge}"
    padding: "14px 16px"
---

# Design System: Yupana · Environmental Intelligence

## Overview

**Creative North Star: "El tablero de contar"**

La portada no se abre con una promesa comercial: se abre con un tablero yupana. Cinco columnas de bloques apilados representan los cinco dominios del producto, el sol dorado corona la columna de mayor peso y el resto del sistema hereda esa lógica —contar, ordenar y leer un resultado—. La interfaz se siente como una mesa de trabajo bien curada: papel cálido, tinta verde profunda, teal para lo activo y oro para lo que hay que mirar.

La densidad es deliberada. La navegación lateral sostiene 339 herramientas en 22 categorías sin convertirse en un menú infinito; el área de trabajo usa paneles de borde fino, etiquetas en versalitas y tablas compactas porque el usuario lee supuestos y unidades, no párrafos de marketing. El tema claro es el turno principal; el oscuro es una versión nocturna del mismo tablero, no otro producto.

La personalidad visual es **precisa, cálida e instrumentada**. El movimiento existe para confirmar una acción —un borde que se enciende, una tarjeta que sube 2 px, un bloque que aparece— y nunca para decorar. La autoridad narrativa la da la jerarquía, no el color.

**Key Characteristics:**
- Densidad alta y jerarquía explícita, con etiquetas pequeñas en mayúsculas sobre valores grandes en mono.
- Acento teal escaso: aparece en el estado activo, el veredicto, la cifra principal y el foco de teclado.
- Oro reservado para el símbolo de marca, los hitos y las referencias que requieren atención.
- Profundidad por capas tonales, no por sombras; la sombra se reserva para lo que flota.
- Bordes de 1 px como estructura; radios medianos que se abren según el tamaño del contenedor.
- Tema oscuro disponible como turno de noche, con la misma lógica y el teal aclarado.

## Colors

Paleta de cuatro voces de marca —tinta, teal, oro y pizarra— sobre papel cálido. El color funcional (ámbar, azul, arcilla, violeta) nunca es decorativo: cada uno tiene un significado estable y se declara en la leyenda.

### Primary
- **Tinta Yupana** (`#1F4D3A`): color de los títulos, la marca y los bloques de mayor peso. En tema oscuro se invierte a `#DDEBE3` para conservar contraste.
- **Teal Yupana** (`#2A8C82`): acento del sistema. Marca el ítem de navegación activo, el botón primario, la cifra principal de una métrica, el foco de teclado y el borde de los campos enfocados. En claro se oscurece a `#1F6F66` cuando el texto debe ir sobre papel.
- **Oro Yupana** (`#D9A441`): sol de la marca, hitos y referencias que requieren atención. Nunca se usa como color de texto pequeño sobre papel claro; para datos se sustituye por `#A57B1F`.
- **Tinta sobre acento** (`#FFFFFF` en claro, `#0A1D16` en oscuro): texto sobre relleno teal.

### Secondary
- **Ámbar de advertencia** (`#8A6214` en claro, `#E3B45C` en oscuro): estados "al límite", favoritos guardados y veredictos que requieren atención sin llegar a incumplimiento.
- **Azul de información** (`#2C6E86` / `#7FC3D8`): datos auxiliares, series secundarias de gráfico y referencias de método.
- **Arcilla de alerta** (`#A34A4A` / `#F08A8A`): excedencias y errores de validación. Es el único rojo suave del sistema.
- **Violeta de método** (`#5E4E8A` / `#B7A8E0`): categorías analíticas y series de comparación que no son estado.

### Neutral
- **Papel cálido** (`#F6F5EF`): lienzo de la aplicación en tema claro.
- **Papel de panel** (`#FFFFFF`): superficie base de paneles y tarjetas.
- **Papel de entrada** (`#FAF9F4`): campos, botones secundarios, métricas y todo lo que "recibe" información.
- **Papel alto** (`#EFEEE5`): tercer nivel, para lo presionado, lo seleccionado y los controles segmentados.
- **Línea de papel** (`#DCDBCE`) y **línea suave** (`#E8E7DC`): bordes de 1 px. La línea suave estructura; la línea fuerte separa controles.
- **Tinta de lectura** (`#16241E`): texto principal. **Secundario** (`#33473E`): descripciones y valores de tabla. **Atenuado** (`#5F7268`): etiquetas y ayudas. **Tenue** (`#87978E`): metadatos, numeración y texto que no debe competir.

### Turno de noche
El tema oscuro no invierte la semántica: **lienzo profundo** (`#0B1A14`), **panel** (`#132A20`), **entrada** (`#173227`), **alto** (`#1C3B2E`), **texto** (`#F0F4EE`) y **teal aclarado** (`#6BC9B6`), que reemplaza al acento para conservar contraste sobre verde profundo. Un componente nuevo debe declarar ambos temas usando las variables, nunca un hex directo.

### Gráficos
Las series usan una paleta de siete pasos verificada a ≥3:1 tanto sobre papel como sobre panel oscuro: teal `#2A8C82`, oro profundo `#A57B1F`, azul `#5277A8`, arcilla `#B06060`, violeta `#77679A`, oliva `#5F8A3A` y neutro `#8A8F86`. El oro de marca `#D9A441` no se usa como trazo de dato sobre papel claro porque no alcanza contraste.

### Named Rules
**La regla del teal escaso.** El teal no debe cubrir más de ~10 % de la superficie visible. Si dos bloques compiten por el acento, uno de los dos está mal jerarquizado.

**La regla del color con significado.** Ámbar, azul, arcilla y violeta solo aparecen asociados a un estado o a una serie declarada en la leyenda. Nunca se usan para "dar vida" a una tarjeta.

## Typography

**Display Font:** Space Grotesk (300–700), empaquetada localmente en `assets/fonts/space-grotesk.woff2`
**Body Font:** pila del sistema (`Inter`, `-apple-system`, `Segoe UI`, `Roboto`, `Helvetica`, `Arial`)
**Label/Mono Font:** monoespaciada del sistema (`ui-monospace`, `Cascadia Mono`, `Roboto Mono`, `Menlo`, `Consolas`)

**Character:** una familia display con carácter geométrico para títulos y marca, una sans neutra para el texto y una mono para todo lo que se mide. Space Grotesk se carga con `@font-face` desde el propio repositorio, sin Google Fonts ni CDN; si la fuente no está disponible, la pila cae en la sans del sistema sin romper la métrica.

### Hierarchy
- **Display** (650, `clamp(32px, 4.2vw, 54px)`, 1.03, -0.035em, Space Grotesk): solo el `h1` de la portada, con ancho máximo de 17 caracteres por línea.
- **Headline** (650, `clamp(24px, 2.8vw, 34px)`, 1.15, Space Grotesk): título de una herramienta. Nunca dos titulares de este tamaño en la misma vista.
- **Title** (650, 21px, 1.15, Space Grotesk): cabecera de sección y `h2` de panel de resultados.
- **Body** (400, 15px, 1.55): texto corrido y descripciones. El área de lectura se limita a 58–78 caracteres por línea.
- **Control** (550, 11.5px, 1.2): etiquetas de botón, campos y navegación. Es el tamaño más pequeño que se usa para texto accionable.
- **Label** (650, 9.5–10px, 1.2, 0.10–0.18em, mayúsculas): encabezados de panel, subsecciones y metadatos. Nunca para frases completas.
- **Data** (600, 21px, 1.1, -0.04em, mono): valor de una métrica. La cifra principal de una vista sube a 32 px y toma el teal.

### Named Rules
**La regla de la cifra primero.** Todo resultado numérico va en mono, con la etiqueta arriba en versalitas y la unidad en un `small` debajo. Una cifra sin unidad o sin período de promedio es un defecto, no un estilo.

**La regla de la versalita corta.** Las mayúsculas con tracking solo se aplican a etiquetas de hasta cuatro palabras. Si el texto necesita leerse como frase, va en caja baja y en cuerpo.

**Tensión conocida.** La escala densa usa 9–10.5 px en tablas, metadatos y leyendas de gráfico. Es legible en escritorio, pero no debe reducirse más y es el primer candidato a revisión en accesibilidad móvil.

## Layout

El esqueleto es una rejilla de dos columnas: barra lateral fija de 268 px y área principal fluida con `max-width: 1480px` centrada. La barra lateral es `position: sticky` a altura completa y contiene marca, nota de estado, navegación agrupada por dominio y acciones de pie. La barra superior también es sticky, con migas de pan a la izquierda y búsqueda, tema y menú a la derecha; usa fondo translúcido con `backdrop-filter: blur(14px)`.

La portada se ordena en tres actos: el hero con el tablero yupana, las cinco tarjetas de dominio con sus subcategorías, y la rejilla completa de herramientas con filtros. El contenido respira con un ritmo fijo: 30 px arriba, 34 px a los lados y 60 px abajo en escritorio. Las vistas de herramienta usan una rejilla de dos columnas iguales (`minmax(0,1fr) minmax(0,1.05fr)`) para entrada y resultado; `.wide-left` da más espacio a la entrada y `.single` colapsa a una columna cuando el dato es una matriz, un mapa o una serie larga.

Puntos de quiebre observados: **1180 px** reduce la barra lateral a 236 px, colapsa las rejillas de trabajo a una columna y oculta el panel lateral del hero; **860 px** convierte la barra lateral en un cajón deslizante de 270 px con velo, reduce la búsqueda a un icono de 40×36 px y pasa las rejillas de 3–4 columnas a 2; **560 px** deja una sola columna, reduce el padding de paneles a 16 px y fija el título de portada en 30 px. La impresión es un caso aparte: el informe se renderiza sobre blanco, con tres columnas de métricas y sin cabecera ni pie del modal.

La densidad no cambia con el tamaño: cambia el número de columnas. Un campo nunca baja de 9 px de padding interno y un botón nunca baja de 5 px verticales (variante `sm`).

## Elevation & Depth

**Capas tonales, sombra solo al flotar.** La profundidad se construye con cuatro pasos de papel —lienzo, panel, entrada, alto— y con bordes de 1 px que separan sin dibujar cajas duras. Un panel en reposo no proyecta sombra: se distingue por el tono y por `--line-soft`. El sistema no usa degradados de superficie salvo en tres casos declarados: el hero de portada (destello teal y oro sobre rejilla), el tablero yupana y el ítem de navegación activo.

La sombra aparece solo cuando algo se separa del plano: modal, cajón lateral móvil, tooltip de gráfico, toast y el panel de estado del hero. Su valor único es amplio y negativo, de modo que se lee como ambiente y no como borde.

### Shadow Vocabulary
- **Ambiente profundo** (`0 24px 70px -30px rgba(0,0,0,.75)`): modales, cajón lateral, toast y tooltip. En tema claro se reemplaza por `0 24px 60px -32px rgba(31,77,58,.32)`.
- **Reposo de tarjeta** (sin sombra): las tarjetas y paneles usan borde y tono. El hover de una tarjeta añade `0 18px 40px -30px rgba(31,77,58,.28)`, una sombra de contacto, no de elevación.
- **Halo de acento** (`0 10px 26px -12px rgba(42,140,130,.38)`): exclusivo del botón primario, para que la acción principal se despegue una vez.

### Named Rules
**La regla de la capa tonal.** Si un bloque necesita destacar, primero se sube un nivel de tono (`panel` → `input` → `high`). La sombra es el último recurso, no el primero.

**La regla del flotante.** Solo lo que puede tapar contenido —modal, cajón, tooltip, toast— proyecta la sombra ambiente. Una tarjeta estática con sombra es un error de sistema.

## Shapes

El lenguaje de formas es rectangular con esquinas suaves y una jerarquía de radio proporcional al tamaño del contenedor: controles pequeños 7 px, controles estándar 9 px, campos y botones de barra 10 px, métricas y cajas internas 12 px, insignias 14 px, tarjetas 15 px, paneles 18 px, y el hero de portada 26 px. Las píldoras usan radio completo y se reservan para chips de filtro, estados y contadores; nunca para botones de acción.

No hay cortes diagonales, blobs ni contenedores orgánicos. La geometría que sí aparece es la del tablero: la rejilla de 34 px del hero, los bloques de 32 px del símbolo, las barras de 2 px de las tarjetas de suite, las celdas del mapa de calor, el anillo de 100 px del laboratorio y el indicador de 7 px con halo de 4 px. Los bordes son siempre de 1 px; no existe un borde de 2 px decorativo, y el foco de teclado es la única línea que se dibuja por fuera con 2 px.

## Components

### Buttons
- **Shape:** rectángulo de esquinas suaves (9 px), altura implícita por padding de 8×13 px; variante compacta de 5×9 px con radio de 7 px.
- **Primary:** relleno teal con tinta blanca en claro y tinta profunda en oscuro, peso 650; el único elemento con halo. Se usa una vez por vista, para la acción que produce el resultado.
- **Hover / Focus:** el secundario aclara el borde y sube un nivel de superficie; el primario sube 1 px y aumenta 6 % el brillo. El foco visible es un contorno de 2 px con 2 px de separación.
- **Secondary / Ghost:** fondo de entrada con borde de línea; existe una variante `danger` con texto arcilla y borde translúcido, y una variante de icono de 36×36 px. La acción destructiva nunca es sólida.

### Chips
- **Style:** píldora de 20 px de radio, fondo de panel, borde de 1 px y texto atenuado a 11 px. Los chips filtran, no navegan.
- **State:** activo con fondo teal al 12 %, borde teal al 45 % y texto en teal. El hover aclara el texto y el borde, sin cambiar el relleno.

### Cards / Containers
- **Corner Style:** 15 px para tarjetas de herramienta, 16 px para tarjetas de suite, 18 px para paneles, 26 px para el hero.
- **Background:** panel para tarjetas y paneles; entrada para cajas internas como métricas, ítems de lista y campos.
- **Category Color:** cada tarjeta de herramienta declara `--sc` con el color de su suite. Una banda superior de 4 px, un velo del 10 % en el encabezado, un borde al 24 % y el chip de categoría usan ese color. El color acelera el escaneo; la etiqueta textual sigue siendo la fuente de verdad.
- **Shadow Strategy:** ninguna en reposo; sombra de contacto en hover (ver Elevation & Depth).
- **Border:** 1 px mezclado con el color de categoría al 24 %; el hover sube al 46 %.
- **Internal Padding:** 17 px en tarjeta, 20 px en panel, 16 px en panel compacto y 0 en panel de tabla.

**La regla de la categoría visible.** Una tarjeta de herramienta siempre muestra el color de su categoría en la banda superior y en el chip; nunca solo en un punto de 4 px ni solo en el icono. Si el color desaparece, la tarjeta pierde su función de orientación.

### Tool Guide (signature)
- **Structure:** doce secciones estables —Calculadora, Descripción general, Cómo usar, Entradas y salidas, Fórmula, ¿Qué es?, Datos clave, Aplicaciones, Ejemplo de cálculo, Normas y referencias, Limitaciones y Errores comunes— generadas desde los metadatos del modelo.
- **Presentation:** un `<details>` cerrado al final de la herramienta. La calculadora conserva el foco; la guía aparece cuando se pide o cuando se imprime.
- **Layout:** índice pegajoso de 205 px a la izquierda y contenido de una columna a la derecha. En móvil el índice se convierte en una fila desplazable y las tarjetas de entradas/salidas se apilan.
- **Typography:** títulos en display a 15.5 px, prosa a 12.5 px con 1.65 de interlineado y fórmulas en mono a 11.5 px dentro de un bloque con borde izquierdo del color de la categoría.
- **Data:** las tablas de ejemplo usan mono para valores y unidades; las notas y limitaciones bajan a 10.5 px atenuado.

**La regla de la guía no invasiva.** La guía nunca reemplaza la calculadora ni se abre sola. Explica el cálculo, el alcance y los errores frecuentes; si el usuario solo quiere calcular, el flujo principal sigue siendo entrada → resultado → exportación.

### Inputs / Fields
- **Style:** fondo de entrada, borde de 1 px, radio de 9 px, padding de 9×10 px y tipografía mono a 13 px; la etiqueta va arriba en 10.5 px atenuado, con unidad o símbolo en mono a 9.5 px.
- **Focus:** el borde pasa a teal, desaparece el outline y el fondo sube a papel alto. En la calculadora, el contenedor dibuja un contorno de 2 px para no perder el foco cuando el campo es compuesto.
- **Error / Disabled:** borde de peligro con `aria-invalid="true"`; el mensaje se asocia al campo y se muestra debajo en 10.5 px. El estado deshabilitado baja la opacidad al 45 % y no responde a hover.

### Navigation
- **Style:** grupos con encabezado en versalita de 10 px, contador en mono y chevrón; enlaces de 12.75 px con icono SVG y radio de 9 px.
- **States:** hover con velo translúcido; activo con degradado teal de izquierda a derecha, borde teal al 22 % y una barra de 2 px en el borde izquierdo. En móvil el grupo se convierte en cajón con velo y las migas bajan a 10 px.
- **Top bar:** migas truncadas con elipsis, búsqueda de 250 px que se reduce a icono, botón de tema y menú de 36 px.

### Metrics (signature)
La métrica es la unidad narrativa del sistema: etiqueta de 9.5 px en mayúsculas, cifra en mono de 21 px y unidad o nota en 9.5 px tenue. La métrica principal ocupa dos columnas, sube la cifra a 32 px y usa un degradado teal al 13 % con borde teal al 30 %. Las variantes de tono (`warn`, `bad`) cambian borde, fondo y cifra, nunca la tipografía: el color informa el estado, la forma sigue siendo la misma.

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
- **Do** reservar Space Grotesk para títulos, marca y cifras de portada; el cuerpo usa la sans del sistema.
- **Do** mantener el borde en 1 px y resolver la separación con tono (`panel` → `input` → `high`).
- **Do** declarar color mediante las variables del tema, de modo que el modo oscuro siga funcionando sin retoques.
- **Do** repetir la estructura de la métrica: etiqueta arriba, cifra en mono, unidad o período debajo.
- **Do** acompañar cada veredicto con su razón y su referencia normativa o método.
- **Do** respetar `prefers-reduced-motion`: el sistema ya anula animaciones y transiciones, y cualquier animación nueva debe hacer lo mismo.
- **Do** mantener el foco visible con 2 px de acento y 2 px de separación, incluso dentro de controles compuestos.
- **Do** abrir toda tabla numérica en su lectura visual y dejar la tabla a un clic o una tecla.

### Don't:
- **Don't** teñir superficies completas de teal ni usarlo como fondo de secciones; su valor es la rareza.
- **Don't** usar el oro de marca como texto pequeño sobre papel claro ni como trazo de dato sin oscurecerlo.
- **Don't** añadir sombras a paneles o tarjetas en reposo: rompe la lógica de capas tonales.
- **Don't** usar radios de píldora en botones de acción ni radios menores a 7 px en controles.
- **Don't** poner texto blanco sobre el teal claro del tema oscuro; ahí la tinta profunda es la única combinación válida.
- **Don't** bajar de 9 px en etiquetas ni de 11.5 px en texto accionable; la densidad no justifica ilegibilidad.
- **Don't** usar barras para una matriz cuadrada ni para una tabla sin eje: ahí la tabla es la lectura correcta.
- **Don't** introducir una segunda familia tipográfica ni iconos de fuente: los iconos del sistema son SVG inline.
- **Don't** mostrar una cifra sin unidad, sin período de promedio o sin modelo declarado cuando el resultado es normativo.
