/* Marca Yupana · Environmental Intelligence.
   El símbolo vive en línea para adaptarse al tema; el informe usa un data URI. */
(function () {
  'use strict';
  const G = window.GL || (window.GL = {});
  const INK = [[0, 114], [38, 114], [76, 114], [114, 114]];
  const TEAL = [[38, 76], [76, 76], [114, 76], [76, 38], [114, 38]];
  const rect = (x, y, cls, fill) => `<rect${cls ? ` class="${cls}"` : ''}${fill ? ` fill="${fill}"` : ''} x="${x}" y="${y}" width="32" height="32" rx="6"/>`;

  /* Símbolo en línea: hereda los colores del tema desde app.css. */
  G.brandMark = function (cls, size, label) {
    return `<svg class="${cls || 'brand-mark'}" width="${size || 44}" height="${size || 44}" viewBox="0 0 146 146" role="img" aria-label="${label || 'Yupana'}">` +
      INK.map(([x, y]) => rect(x, y, 'ym-ink')).join('') +
      TEAL.map(([x, y]) => rect(x, y, 'ym-teal')).join('') +
      '<circle class="ym-sun" cx="130" cy="16" r="16"/></svg>';
  };

  /* Símbolo fijo para favicon, informes e imágenes exportadas. */
  const fixed = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 146 146">' +
    INK.map(([x, y]) => rect(x, y, '', '#1F4D3A')).join('') +
    TEAL.map(([x, y]) => rect(x, y, '', '#2A8C82')).join('') +
    '<circle cx="130" cy="16" r="16" fill="#D9A441"/></svg>';
  G.brandData = 'data:image/svg+xml,' + encodeURIComponent(fixed);
  G.brandDataDark = 'data:image/svg+xml,' + encodeURIComponent(fixed
    .replace(/#1F4D3A/g, '#DDEBE3').replace(/#2A8C82/g, '#5FC7B8'));
})();
