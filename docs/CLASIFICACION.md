# Clasificación funcional de Green Owl Labs

Revisión del 11 de noviembre de 2026. Las 339 herramientas se distribuyen en 22 categorías principales. La primera revisión reasignó 66 herramientas. El ajuste posterior clasificó MBR y los caudales de alcantarillado en aguas residuales, y Streeter–Phelps en calidad del agua. Membranas e hidráulica conservan sus accesos relacionados. La ficha UV de efluentes de NovaSolver usa aguas residuales y enlaza el reactor UV compartido. Cada ID, enlace directo y registro de favoritos sigue asociado a la misma herramienta.

## Criterios

- Agua, calidad y potabilización reúne caracterización, química, coagulación, desinfección y tratamiento de agua para abastecimiento.
- Aguas residuales y reúso reúne PTAR, afluentes, ecualización, DBO/DQO, tratamiento biológico, lodos, efluentes y reúso.
- Hidráulica e hidrología reúne tuberías, canales, aforos, perfiles, tanques y escorrentía. Membranas y desalinización reúne RO, NF, UF/MF y ensayos de ensuciamiento. Agua industrial y alta pureza reúne calderas, torres, resinas y agua de proceso.
- Salud ambiental y toxicología reúne exposición poblacional y toxicología. Seguridad y salud en el trabajo cubre el entorno ocupacional. Sostenibilidad y economía ambiental reúne valoración, finanzas, ciclo de vida y metas.
- Los cálculos transversales aparecen en la sección de herramientas relacionadas. Por ejemplo, una calculadora de CT tiene categoría principal de agua y puede encontrarse desde aguas residuales. En AtlasWTS, las fichas con modos explícitos se filtran por su aplicación.

## Categorías principales

| Categoría | Herramientas |
|---|---:|
| Suelos y remediación | 17 |
| Agua, calidad y potabilización | 55 |
| Aguas residuales y reúso | 31 |
| Hidráulica e hidrología | 25 |
| Membranas y desalinización | 13 |
| Agua industrial y alta pureza | 9 |
| Residuos sólidos | 9 |
| Aire y emisiones | 23 |
| Energía y renovables | 22 |
| Clima, meteorología y carbono | 21 |
| Ecología & Biodiversidad | 28 |
| Impacto, riesgo y cumplimiento ambiental | 15 |
| Sostenibilidad y economía ambiental | 12 |
| Salud ambiental y toxicología | 3 |
| Seguridad y salud en el trabajo | 6 |
| Acústica y ruido | 8 |
| Laboratorio, monitoreo y metrología | 7 |
| Unidades y conversiones | 2 |
| Decisión Multicriterio | 14 |
| Análisis & Estadística | 9 |
| Geografía & Territorio | 9 |
| Población y demografía | 1 |

## Inventario y comprobación

El [inventario de clasificación](classification-audit.json) registra las 339 asignaciones, sus usos relacionados y los cambios respecto de la revisión anterior. La lógica reside en [classification.js](../assets/js/classification.js).

El [conversor central](http://127.0.0.1:8876/#/tool/unit-converter) tiene 24 magnitudes y se puede abrir desde el menú principal. Las nueve fichas de conversión (longitud, área, volumen, masa, densidad, presión, temperatura, caudal y caudal másico) se integran en él; sus rutas `unit-*` anteriores redirigen. Las pruebas de `tests/classification.cjs`, `tests/catalogue.cjs`, `tests/units.cjs`, `tests/routes-cdp.cjs` y `tests/lab-browser.cjs` cubren asignaciones, filtros, rutas y conversiones.
