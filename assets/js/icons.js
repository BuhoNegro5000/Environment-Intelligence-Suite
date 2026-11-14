/* Set de iconos Yupana · SVG en línea, trazo de 1,6 px, sin fuentes de iconos. */
(function () {
  'use strict';
  const G = window.GL;
  const P = {
    home: '<path d="M3 10.7 12 3l9 7.7V21h-6.2v-6H9.2v6H3z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/>',
    swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    star: '<path d="m12 3.6 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-3.9 5.6-.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    leaf: '<path d="M20 4C11 4 4 8.5 4 16c0 2 .6 3.5 1.7 4.7C8.6 14 13 11 20 9c-5.3 3-8.6 6.3-10.2 11C17 21 20 15.5 20 4z"/>',
    droplet: '<path d="M12 3.5c3.2 3.7 5.5 6.5 5.5 9.3a5.5 5.5 0 0 1-11 0c0-2.8 2.3-5.6 5.5-9.3z"/>',
    waves: '<path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
    wind: '<path d="M3 8h10a3 3 0 1 0-3-3M3 12h14a3 3 0 1 1-3 3M3 16h7"/>',
    bolt: '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
    thermometer: '<path d="M10 4a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0zM12 8v6"/>',
    scale: '<path d="M12 3v18M6 6h12M6 6 3 12h6zM18 6l-3 6h6zM8 21h8"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14"/>',
    layers: '<path d="M12 3 3 8l9 5 9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
    recycle: '<path d="M7 7l3-3 3 3M7 7H4l2 4M17 17l-3 3-3-3M17 17h3l-2-4M9 20l-2-4M15 4l2 4"/>',
    filter: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
    factory: '<path d="M3 21V10l5 3V10l5 3V8l8 4v9zM7 21v-3M11 21v-3M15 21v-3"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    cycle: '<path d="M20 12a8 8 0 0 1-14 5M4 12a8 8 0 0 1 14-5M4 17v-5h5M20 7v5h-5"/>',
    heart: '<path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z"/>',
    helmet: '<path d="M4 16a8 8 0 0 1 16 0M2 16h20v3H2zM12 4v4"/>',
    volume: '<path d="M4 10v4h4l5 4V6l-5 4zM17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7 15h10"/>',
    users: '<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-3.3 3-6 7-6s7 2.7 7 6M17 4a4 4 0 0 1 0 8M18 15c2.4.7 4 2.9 4 6"/>',
    lock: '<path d="M6 10h12v10H6zM9 10V7a3 3 0 0 1 6 0v3"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
    printer: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    alert: '<path d="M12 3l9 17H3zM12 9v5M12 17h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
    book: '<path d="M4 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4h-4a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h4z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/>',
    pin: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11zM12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>',
    external: '<path d="M14 4h6v6M20 4l-8 8M18 14v5H5V6h5"/>',
    filterLines: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    file: '<path d="M6 3h8l4 4v14H6zM14 3v5h5"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'
  };

  G.icon = function (name, cls, size) {
    const s = size || 18;
    return `<svg class="ico ${cls || ''}" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${P[name] || P.sparkle}</svg>`;
  };

  const SUITE = {
    soil: 'layers', water: 'droplet', wastewater: 'recycle', hydraulics: 'waves',
    membranes: 'filter', 'industrial-water': 'factory', waste: 'trash', air: 'wind',
    energy: 'bolt', climate: 'thermometer', ecology: 'leaf', impact: 'shield',
    sustainability: 'cycle', health: 'heart', safety: 'helmet', noise: 'volume',
    metrology: 'flask', conversion: 'swap', decision: 'scale', analysis: 'chart',
    spatial: 'map', population: 'users'
  };
  G.suiteIcon = id => SUITE[id] || 'sparkle';
})();
