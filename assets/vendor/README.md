# Dependencias locales de ejecución

No se cargan desde CDN durante el uso de la suite.

- **WebR 0.6.1**: paquete npm `webr`, distribución oficial https://registry.npmjs.org/webr/-/webr-0.6.1.tgz. Motor R WebAssembly 4.6.0, interfaz y bibliotecas incluidas. Condiciones y avisos completos en `webr/LICENSE.md`; R y sus componentes conservan sus licencias. Documentación: https://docs.r-wasm.org/webr/v0.6.0/ . El archivo `dist/webr.js` es el módulo para navegador; `webr.mjs` de este paquete es la entrada de Node.
- **Turf 7.4.0**: paquete npm `@turf/turf`, distribución oficial https://registry.npmjs.org/@turf/turf/-/turf-7.4.0.tgz. Licencia MIT incluida en `turf/LICENSE`. Operaciones vectoriales y buffers. https://turfjs.org/docs/
- **Proj4js 2.22.0**: paquete npm `proj4`, distribución oficial https://registry.npmjs.org/proj4/-/proj4-2.22.0.tgz. Licencia incluida en el paquete. Reproyección explícita entre CRS. https://proj4js.org/
- **Leaflet 1.9.4**: distribución oficial del paquete npm `leaflet`. Mapa interactivo del laboratorio espacial. Licencia BSD de dos cláusulas en `leaflet/LICENSE`. https://github.com/Leaflet/Leaflet/releases/tag/v1.9.4

Los archivos de las bibliotecas se conservan sin modificaciones. El código de integración está en `assets/js/r-runtime.js`, `assets/js/spatial-ops.js` y `assets/js/tools/science-map.js`. El motor acústico es un componente Python local separado. Véase `docs/BIOACUSTICA.md`.
