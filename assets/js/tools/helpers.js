/* ==========================================================================
   Yupana · helpers de interfaz para las suites
   Constructores de campos, métricas, barras de composición y bloques.
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL = window.GL || {};
  const esc = GL.escape;

  const U = GL.ui = {};

  U.field = function (id, label, unit, val, opts) {
    opts = opts || {};
    return `<label class="field"><span>${label}${unit ? ` <em>${unit}</em>` : ''}${opts.q ? ` <span class="q" title="${esc(opts.q)}">?</span>` : ''}</span>
      <input id="${id}" type="text" inputmode="decimal" value="${val}" ${opts.ro ? 'readonly' : ''} ${opts.ph ? `placeholder="${esc(opts.ph)}"` : ''}>
      ${opts.hint ? `<small>${opts.hint}</small>` : ''}</label>`;
  };

  U.select = function (id, label, options, val, opts) {
    opts = opts || {};
    return `<label class="field"><span>${label}</span><select id="${id}">
      ${options.map(o => `<option value="${esc(o.id)}" ${String(o.id) === String(val) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
    </select>${opts.hint ? `<small>${opts.hint}</small>` : ''}</label>`;
  };

  U.metric = function (id, label, unit, hero) {
    return `<div class="metric ${hero ? 'hero' : ''}"><span>${label}</span><strong id="${id}">—</strong><small>${unit || ''}</small></div>`;
  };

  U.toggle = function (id, label, checked) {
    return `<div class="field-row"><span>${label}</span><label class="switch"><input type="checkbox" id="${id}" ${checked ? 'checked' : ''}><i></i></label></div>`;
  };

  U.fileZone = function (id, title, sub, accept) {
    return `<div class="dropzone" id="${id}">
      <div class="dz-ico">▤</div><b>${title}</b><small>${sub || ''}</small>
      <input type="file" id="${id}File" accept="${accept || '.csv,text/csv'}" hidden>
    </div>`;
  };

  U.note = function (text, tone) {
    return `<div class="note ${tone || ''}">${text}</div>`;
  };

  U.compbar = function (segments, opts) {
    opts = opts || {};
    const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
    return `<div class="compbar">${segments.map(s => {
      const pct = Math.max(0, s.value) / total * 100;
      return `<span style="width:${pct}%;background:${s.color || '#2A8C82'}" title="${esc(s.label)}: ${GL.fmt(s.value, 1)} (${GL.fmt(pct, 1)} %)"></span>`;
    }).join('')}</div>
    <div class="compbar-legend">${segments.map(s => `<span><i style="background:${s.color || '#2A8C82'}"></i>${esc(s.label)} <b>${GL.fmt(s.value, opts.dec === undefined ? 1 : opts.dec)}</b>${opts.unit ? ' ' + esc(opts.unit) : ''}</span>`).join('')}</div>`;
  };

  /* fila de tabla editable genérica */
  U.trow = function (cells, i, delDisabled) {
    return `<tr>${cells.map(c => {
      if (c.kind === 'text') return `<td><input class="tbl-input" style="width:${c.width || 120}px;text-align:left" data-i="${i}" data-k="${c.k}" value="${esc(c.v)}"></td>`;
      if (c.kind === 'select') return `<td><select class="tbl-select" data-i="${i}" data-k="${c.k}">${c.options.map(o => `<option value="${esc(o.id)}" ${String(o.id) === String(c.v) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></td>`;
      return `<td><input class="tbl-input" data-i="${i}" data-k="${c.k}" value="${c.v}"></td>`;
    }).join('')}<td><button class="btn sm" data-del="${i}" ${delDisabled ? 'disabled' : ''} title="Eliminar">✕</button></td></tr>`;
  };

  U.dt = function (d) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  /* control deslizante con lectura en vivo */
  U.slider = function (id, label, unit, val, min, max, step, opts) {
    opts = opts || {};
    const v = +val;
    const pct = Math.max(0, Math.min(100, (v - min) / (max - min) * 100)).toFixed(2);
    return `<label class="slider">
      <span class="sl-head"><span>${label}${unit ? ` <em>${unit}</em>` : ''}</span><output data-out="${id}"${opts.suffix ? ` data-suffix="${esc(opts.suffix)}"` : ''}>${GL.fmtSmart(v)}${opts.suffix ? ' ' + esc(opts.suffix) : ''}</output></span>
      <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}" style="--p:${pct}%">
    </label>`;
  };

  /* fila de opción con casilla (checklist) */
  U.opt = function (id, title, sub, checked) {
    return `<label class="opt ${checked ? 'on' : ''}">
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
      <span><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>
    </label>`;
  };

  /* leyenda de escala de calor */
  U.heatLegend = function (lo, mid, hi) {
    return `<div class="legend-scale"><span>${esc(lo)}</span><span class="ls-bar"></span><span>${esc(hi)}</span><span style="margin-left:auto;color:var(--faint)">${esc(mid || '')}</span></div>`;
  };

  /* mantiene sliders sincronizados en cualquier herramienta */
  document.addEventListener('input', function (e) {
    if (e.target && e.target.type === 'range') GL.syncRange(e.target);
  });
  document.addEventListener('change', function (e) {
    const box = e.target;
    if (box && box.type === 'checkbox' && box.closest('.opt')) box.closest('.opt').classList.toggle('on', box.checked);
  });
})();
