# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Usuario primario: público técnico mixto. Incluye ingenieros y consultores ambientales que preparan estudios, informes y expedientes; equipos de EHS, operaciones y cumplimiento en empresas e industrias; y docencia e investigación en carreras ambientales. La situación de uso es el cálculo puntual o encadenado dentro de un informe técnico: se necesitan resultados en español, con unidades claras, supuestos visibles y una salida que se pueda adjuntar o revisar.

## Product Purpose

Green Owl Labs es una suite de cálculo ambiental en español con 339 herramientas en 22 categorías: suelo, agua y potabilización, aguas residuales y reúso, hidráulica, membranas, agua industrial, residuos, aire, energía, clima y carbono, ecología, impacto y cumplimiento, sostenibilidad, salud, seguridad, ruido, metrología, conversión, decisión multicriterio, análisis y territorio. Existe para que un profesional obtenga un resultado defendible sin depender de hojas de cálculo dispersas. El éxito significa que el cálculo, sus supuestos y su trazabilidad se expliquen por sí mismos y resistan una revisión técnica.

## Positioning

Amplitud y consistencia en español para ingeniería ambiental, con cálculo local en el navegador, sin cuentas ni CDN y sin enviar datos a servicios externos. El mecanismo que un producto vecino no podría copiar de forma veraz es la combinación de: cobertura amplia de dominios, tablas normativas peruanas verificadas contra fuente primaria, métodos reconocidos (AERMOD como referencia de cribado, ISO 9613-2, SCS-CN, GHG Protocol, IPCC, EPA, OMS, JCGM) y una regresión numérica que fija resultados y detecta cambios.

## Operating Context

- Aplicación estática de HTML, CSS y JavaScript servida desde un servidor local; no requiere compilación.
- Navegador de escritorio y móvil; se verifica en Chrome/Edge headless.
- Los cálculos corren en el navegador; el estado y las preferencias usan almacenamiento local.
- El motor acústico de bioacústica es opcional, corre en Python en el equipo y está separado del servidor estático.
- Las salidas típicas son pantalla, informe imprimible y CSV; los informes incluyen huella, fecha de cálculo y versión del modelo.
- La jurisdicción normativa principal es Perú; las referencias EPA, NRCS, OMS, IPCC, GHG Protocol y JCGM se identifican por separado.

## Capabilities and Constraints

- 339 herramientas registradas, 301 modelos declarativos y 22 categorías; conversión central con 24 magnitudes.
- Unidades SI o derivadas, con conversiones explícitas; interfaz y formato en español (Perú), con coma decimal.
- Los modelos son de cribado y así se declara cuando corresponde; no reemplazan software regulatorio validado, laboratorios acreditados, calibraciones trazables ni la firma de un profesional competente.
- Sin backend, sin autenticación y sin telemetría en la versión actual. No se envían datos a terceros.
- El registro pasó de 348 a 339 herramientas al consolidar nueve calculadoras de conversión en el conversor central; las rutas `unit-*` anteriores redirigen.
- Decisión confirmada: el producto se orienta a un modelo de pago o freemium. El precio, la capa gratuita, la autenticación y el despliegue público aún no están definidos.

## Brand Commitments

- Nombre: Green Owl Labs. Existe una marca gráfica (`assets/img/green-owl-labs-mark.png`) y una variante transparente.
- Idioma de producto: español (Perú). Tono técnico, directo y sin promesas comerciales no sustentadas.
- No inventar valores, normas, testimonios, clientes ni resultados. Toda referencia normativa debe citar fuente y fecha.

## Evidence on Hand

- `README.md`: estado, alcance, estructura, pruebas y limitaciones.
- `docs/INVENTARIO-TECNICO.md`: 339 herramientas con entradas, salidas de ejemplo y método.
- `docs/AUDITORIA-TECNICA.md` y `docs/AUDITORIA-CONSULTORIA-2026-11-11.md`: hallazgos, correcciones y estado de implementación.
- `docs/CLASIFICACION.md` y `docs/classification-audit.json`: 339 asignaciones en 22 categorías.
- `docs/catalogue-coverage.json` y `assets/js/catalogue-data.js`: 113 fichas de referencia con ruta local.
- `tests/`: regresión de 301 modelos, resultados base, catálogo, unidades, operaciones espaciales, índices bióticos y barrido de rutas por CDP.
- No hay validación con datos de campo, calibración, casos de cliente ni testimonios. No deben fabricarse.

## Product Principles

1. **El resultado debe poder defenderse.** Mostrar supuestos, unidades, período de promedio y limitaciones antes que una cifra sin contexto.
2. **La norma se cita, no se improvisa.** Cada tabla o límite regulatorio declara fuente, artículo y vigencia; si no está confirmado, se marca como referencia u decisión abierta.
3. **Amplitud sin duplicar.** Una función vive en un solo lugar; las rutas antiguas redirigen y el catálogo no promete equivalencia funcional que no exista.
4. **Local primero.** El cálculo y los datos permanecen en el equipo del usuario; cualquier servicio externo es opcional y explícito.
5. **La interfaz es parte del rigor.** Jerarquía clara, estados vacíos honestos, errores que explican qué corregir y accesibilidad como requisito, no como adorno.

## Accessibility & Inclusion

Meta confirmada: WCAG 2.1 AA. Incluye contraste suficiente, navegación por teclado, foco visible, etiquetas y mensajes de error asociados a los campos, respeto de `prefers-reduced-motion` y compatibilidad con lectores de pantalla en los flujos principales. El producto es en español; no se ha definido internacionalización a otros idiomas.
