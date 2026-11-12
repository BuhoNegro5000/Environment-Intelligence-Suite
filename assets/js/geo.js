/* ==========================================================================
   Green Owl Labs · geo
   Lectura de SHP/DBF, KML y GeoJSON; validación geométrica; conversión y mapa.
   Implementación propia, sin librerías externas.
   ========================================================================== */
(function () {
  'use strict';
  const GL = window.GL = window.GL || {};
  const G = GL.geo = {};
  const R = 6378137;

  /* ------------------------------------------------------------- helpers */
  const isNum = v => typeof v === 'number' && isFinite(v);
  G.signedArea = function (ring) {
    let a = 0;
    for (let i = 0, n = ring.length; i < n; i++) {
      const p = ring[i], q = ring[(i + 1) % n];
      a += p[0] * q[1] - q[0] * p[1];
    }
    return a / 2;
  };
  G.areaM2 = function (ring) {
    // exceso esférico (Chamberlain & Duquette)
    let a = 0;
    for (let i = 0, n = ring.length; i < n; i++) {
      const p1 = ring[i], p2 = ring[(i + 1) % n];
      a += (p2[0] - p1[0]) * Math.PI / 180 *
        (2 + Math.sin(p1[1] * Math.PI / 180) + Math.sin(p2[1] * Math.PI / 180));
    }
    return Math.abs(a * R * R / 2);
  };
  G.perimeterM = function (ring) {
    let d = 0;
    for (let i = 0, n = ring.length; i < n - 1; i++) d += G.haversine(ring[i], ring[i + 1]);
    return d;
  };
  G.haversine = function (p1, p2) {
    const toR = Math.PI / 180;
    const dLat = (p2[1] - p1[1]) * toR, dLon = (p2[0] - p1[0]) * toR;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1[1] * toR) * Math.cos(p2[1] * toR) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  };
  G.bbox = function (coords, acc) {
    acc = acc || [Infinity, Infinity, -Infinity, -Infinity];
    if (typeof coords[0] === 'number') {
      acc[0] = Math.min(acc[0], coords[0]); acc[1] = Math.min(acc[1], coords[1]);
      acc[2] = Math.max(acc[2], coords[0]); acc[3] = Math.max(acc[3], coords[1]);
    } else coords.forEach(c => G.bbox(c, acc));
    return acc;
  };
  G.centroid = function (ring) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, n = ring.length; i < n; i++) {
      const p = ring[i], q = ring[(i + 1) % n];
      const f = p[0] * q[1] - q[0] * p[1];
      a += f; cx += (p[0] + q[0]) * f; cy += (p[1] + q[1]) * f;
    }
    if (Math.abs(a) < 1e-14) return ring[0] ? [ring[0][0], ring[0][1]] : [0, 0];
    return [cx / (3 * a), cy / (3 * a)];
  };

  /* -------------------------------------------------------------- GeoJSON */
  G.parseGeoJSON = function (text, options={}) {
    const j = JSON.parse(text);
    if(options.requireRFC7946&&j.crs!=null)throw new Error('Exporta GeoJSON RFC 7946 en WGS 84, sin un CRS alternativo declarado.');
    const feats = [];
    const pushGeom = (geom, props, name) => {
      if (!geom) return;
      if (geom.type === 'GeometryCollection') {
        (geom.geometries || []).forEach((g, i) => pushGeom(g, props, name + ' #' + (i + 1)));
        return;
      }
      feats.push({ name: name || 'Feature ' + (feats.length + 1), desc: '', props: props || {}, geometry: geom });
    };
    if (j.type === 'FeatureCollection') {
      (j.features || []).forEach((f, i) => {
        const p = f.properties || {};
        const nm = p.name || p.NOMBRE || p.Name || p.NAME || p.id || 'Feature ' + (i + 1);
        pushGeom(f.geometry, p, String(nm));
      });
    } else if (j.type === 'Feature') {
      pushGeom(j.geometry, j.properties || {}, j.properties && (j.properties.name || j.properties.NAME) || 'Feature 1');
    } else if (j.type) {
      pushGeom(j, {}, 'Geometría');
    } else throw new Error('GeoJSON no reconocido');
    return feats;
  };

  /* ------------------------------------------------------------------ KML */
  G.parseKML = function (text) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) throw new Error('KML inválido: ' + err.textContent.slice(0, 120));
    const feats = [];
    const txt = (node, tag) => {
      const el = node.getElementsByTagNameNS('*', tag)[0];
      return el ? el.textContent.trim() : '';
    };
    const coords = el => {
      if (!el) return [];
      return el.textContent.trim().split(/\s+/).map(t => {
        const p = t.split(',').map(Number);
        return [p[0], p[1]].map(v => isFinite(v) ? v : 0);
      }).filter(p => p.length === 2 && isFinite(p[0]) && isFinite(p[1]));
    };
    const polys = (pm) => {
      const out = [];
      const outer = pm.getElementsByTagNameNS('*', 'outerBoundaryIs');
      const inner = pm.getElementsByTagNameNS('*', 'innerBoundaryIs');
      for (let i = 0; i < outer.length; i++) {
        // only direct-ish pairing: collect inners in the same Polygon node
        const polyNode = outer[i].parentNode;
        const shell = coords(outer[i].getElementsByTagNameNS('*', 'coordinates')[0]);
        if (!shell.length) continue;
        const holes = [];
        polyNode.querySelectorAll('innerBoundaryIs').forEach(ib => {
          const h = coords(ib.getElementsByTagNameNS('*', 'coordinates')[0]);
          if (h.length) holes.push(h);
        });
        out.push([shell].concat(holes));
      }
      return out;
    };
    const walk = (node, parentName) => {
      Array.from(node.children || []).forEach(child => {
        const tag = child.localName;
        if (tag === 'Placemark') {
          const name = txt(child, 'name') || parentName || 'Placemark ' + (feats.length + 1);
          const desc = txt(child, 'description');
          const props = {};
          child.querySelectorAll('ExtendedData Data').forEach(d => {
            props[d.getAttribute('name')] = (d.querySelector('value') || {}).textContent || '';
          });
          child.querySelectorAll('ExtendedData SimpleData').forEach(d => {
            props[d.getAttribute('name')] = d.textContent;
          });
          const pgs = polys(child);
          if (pgs.length) {
            feats.push({
              name, desc, props: Object.assign({}, props),
              geometry: pgs.length === 1
                ? { type: 'Polygon', coordinates: pgs[0] }
                : { type: 'MultiPolygon', coordinates: pgs }
            });
          } else {
            const ls = child.getElementsByTagNameNS('*', 'LineString');
            if (ls.length) {
              const lines = Array.from(ls).map(l => coords(l.getElementsByTagNameNS('*', 'coordinates')[0])).filter(c => c.length > 1);
              if (lines.length) feats.push({ name, desc, props, geometry: { type: lines.length > 1 ? 'MultiLineString' : 'LineString', coordinates: lines.length > 1 ? lines : lines[0] } });
            } else {
              const pts = child.getElementsByTagNameNS('*', 'Point');
              if (pts.length) {
                const c = Array.from(pts).map(p => coords(p.getElementsByTagNameNS('*', 'coordinates')[0])[0]).filter(Boolean);
                if (c.length) feats.push({ name, desc, props, geometry: { type: c.length > 1 ? 'MultiPoint' : 'Point', coordinates: c.length > 1 ? c : c[0] } });
              }
            }
          }
        } else if (['Document', 'Folder'].indexOf(tag) >= 0) walk(child, txt(child, 'name') || parentName);
      });
    };
    walk(doc.documentElement, '');
    if (!feats.length) throw new Error('No se encontraron geometrías en el KML');
    return feats;
  };

  /* -------------------------------------------------------------- SHP/DBF */
  function readCString(dv, offset, len) {
    let s = '';
    for (let i = 0; i < len; i++) s += String.fromCharCode(dv.getUint8(offset + i));
    return s.replace(/\0[\s\S]*$/, '').trim();
  }
  G.parseDBF = function (buffer) {
    const dv = new DataView(buffer);
    if (buffer.byteLength < 32) return [];
    const n = dv.getUint32(4, true), hlen = dv.getUint16(8, true), rlen = dv.getUint16(10, true);
    const fields = [];
    for (let p = 32; p < hlen - 1; p += 32) {
      if (dv.getUint8(p) === 0x0D) break;
      fields.push({
        name: readCString(dv, p, 11),
        type: String.fromCharCode(dv.getUint8(p + 11)),
        len: dv.getUint8(p + 16),
        dec: dv.getUint8(p + 17)
      });
    }
    const dec = (() => {
      const len = Math.max(0, Math.min(rlen * Math.min(n, 5), buffer.byteLength - hlen));
      const bytes = new Uint8Array(buffer, hlen, len);
      let utf = true;
      try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch (e) { utf = false; }
      return new TextDecoder(utf ? 'utf-8' : 'windows-1252');
    })();
    const rows = [];
    for (let r = 0; r < n; r++) {
      const base = hlen + r * rlen;
      if (base + rlen > buffer.byteLength) break;
      if (dv.getUint8(base) === 0x2A) { rows.push(null); continue; }
      const row = {};
      let off = base + 1;
      fields.forEach(f => {
        const raw = dec.decode(new Uint8Array(buffer, off, f.len)).trim();
        off += f.len;
        if (f.type === 'N' || f.type === 'F') row[f.name] = raw === '' ? null : parseFloat(raw.replace(',', '.'));
        else if (f.type === 'L') row[f.name] = /^[TY1]$/i.test(raw);
        else row[f.name] = raw;
      });
      rows.push(row);
    }
    return rows;
  };
  G.parseSHP = function (buffer, dbfBuffer) {
    const dv = new DataView(buffer);
    if (buffer.byteLength < 100) throw new Error('SHP demasiado corto');
    if (dv.getInt32(0, false) !== 9994) throw new Error('Firma SHP inválida (se esperaba 9994)');
    const fileType = dv.getInt32(32, true);
    const attrs = dbfBuffer ? G.parseDBF(dbfBuffer) : [];
    const feats = [];
    let off = 100, rec = 0;
    while (off + 8 <= buffer.byteLength) {
      const contentLen = dv.getInt32(off + 4, false) * 2;
      const start = off + 8;
      if (start + contentLen > buffer.byteLength || contentLen < 4) break;
      const st = dv.getInt32(start, true);
      if (st !== 0) {
        const props = attrs[rec] || {};
        const nm = props.NAME || props.NOMBRE || props.name || props.Name || props.ID || props.id || ('Registro ' + (rec + 1));
        try {
          if (st === 1 || st === 11 || st === 21 || st === 31) {
            const x = dv.getFloat64(start + 4, true), y = dv.getFloat64(start + 12, true);
            feats.push({ name: String(nm), props, geometry: { type: 'Point', coordinates: [+x.toFixed(8), +y.toFixed(8)] } });
          } else if (st === 8 || st === 18 || st === 28 || st === 38) {
            const np = dv.getInt32(start + 36, true);
            const pts = [];
            for (let i = 0; i < np; i++) {
              const p = start + 40 + i * 16;
              pts.push([+dv.getFloat64(p, true).toFixed(8), +dv.getFloat64(p + 8, true).toFixed(8)]);
            }
            if (pts.length) feats.push({ name: String(nm), props, geometry: { type: 'MultiPoint', coordinates: pts } });
          } else if ([3, 5, 13, 15, 23, 25, 33, 35].indexOf(st) >= 0) {
            const nParts = dv.getInt32(start + 36, true), nPoints = dv.getInt32(start + 40, true);
            const parts = [];
            for (let i = 0; i < nParts; i++) parts.push(dv.getInt32(start + 44 + i * 4, true));
            parts.push(nPoints);
            const basePt = start + 44 + nParts * 4;
            const rings = [];
            for (let p = 0; p < nParts; p++) {
              const ring = [];
              for (let i = parts[p]; i < parts[p + 1]; i++) {
                const q = basePt + i * 16;
                ring.push([+dv.getFloat64(q, true).toFixed(8), +dv.getFloat64(q + 8, true).toFixed(8)]);
              }
              if (ring.length) rings.push(ring);
            }
            const isPoly = st === 5 || st === 15 || st === 25 || st === 35;
            if (isPoly) {
              const shells = [], holes = [];
              rings.forEach(ring => {
                (G.signedArea(ring) < 0 ? shells : holes).push(ring);
              });
              if (!shells.length) { rings.forEach(r => shells.push(r)); holes.length = 0; }
              const groups = shells.map(sh => [sh]);
              holes.forEach(h => {
                const c = G.centroid(h);
                let best = -1, bestA = Infinity;
                groups.forEach((g, gi) => {
                  if (!G.pointInRing(c, g[0])) return;
                  const a = G.areaM2(g[0]);
                  if (a < bestA) { bestA = a; best = gi; }
                });
                if (best >= 0) groups[best].push(h);
              });
              if (groups.length === 1) feats.push({ name: String(nm), props, geometry: { type: 'Polygon', coordinates: groups[0] } });
              else feats.push({ name: String(nm), props, geometry: { type: 'MultiPolygon', coordinates: groups } });
            } else {
              if (rings.length === 1) feats.push({ name: String(nm), props, geometry: { type: 'LineString', coordinates: rings[0] } });
              else feats.push({ name: String(nm), props, geometry: { type: 'MultiLineString', coordinates: rings } });
            }
          }
        } catch (e) { console.warn('Registro SHP omitido', rec, e); }
      }
      rec++;
      off = start + contentLen;
    }
    if (!feats.length) throw new Error('El SHP no contiene geometrías compatibles (tipo ' + fileType + ')');
    return feats;
  };

  /* --------------------------------------------------------- point in ring */
  G.pointInRing = function (pt, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if (((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  };

  /* --------------------------------------------------------- intersections */
  function orient(a, b, c) {
    const v = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    return Math.abs(v) < 1e-13 ? 0 : v > 0 ? 1 : -1;
  }
  function onSeg(a, b, c) {
    return Math.min(a[0], b[0]) - 1e-12 <= c[0] && c[0] <= Math.max(a[0], b[0]) + 1e-12 &&
      Math.min(a[1], b[1]) - 1e-12 <= c[1] && c[1] <= Math.max(a[1], b[1]) + 1e-12;
  }
  function segIntersect(p1, p2, p3, p4) {
    const d1 = orient(p3, p4, p1), d2 = orient(p3, p4, p2),
      d3 = orient(p1, p2, p3), d4 = orient(p1, p2, p4);
    if (d1 !== d2 && d3 !== d4) return true;
    if (d1 === 0 && onSeg(p3, p4, p1)) return true;
    if (d2 === 0 && onSeg(p3, p4, p2)) return true;
    if (d3 === 0 && onSeg(p1, p2, p3)) return true;
    if (d4 === 0 && onSeg(p1, p2, p4)) return true;
    return false;
  }
  G.selfIntersections = function (ring, limit) {
    const n = ring.length;
    if (n > (limit || 2500)) return [];
    const hits = [];
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n - 1; j++) {
        if (i === 0 && j === n - 2) continue;
        if (segIntersect(ring[i], ring[i + 1], ring[j], ring[j + 1])) {
          hits.push([i, j]);
          if (hits.length > 50) return hits;
        }
      }
    }
    return hits;
  };

  /* ------------------------------------------------------------- validate */
  G.validate = function (features) {
    const issues = [];
    const stats = { vertices: 0, polygons: 0, holes: 0, features: features.length, area: 0, perimeter: 0 };
    const push = (feat, sev, code, msg, detail) => issues.push({ feature: feat, sev, code, msg, detail: detail || '', fixable: ['unclosed', 'dup', 'winding', 'degenerate', 'hole-outside'].indexOf(code) >= 0 });
    features.forEach((f, fi) => {
      const nm = f.name || ('Feature ' + (fi + 1));
      const g = f.geometry;
      if (!g || !g.type) { push(nm, 'error', 'nogeom', 'La entidad no tiene geometría'); return; }
      const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      if (g.type === 'LineString' || g.type === 'MultiLineString') {
        const lines = g.type === 'LineString' ? [g.coordinates] : g.coordinates;
        lines.forEach((ln, li) => {
          stats.vertices += ln.length;
          ln.forEach((p, i) => {
            if (Math.abs(p[1]) > 90) push(nm, 'error', 'range', 'Latitud fuera de rango (−90 a 90)', 'Vértice ' + (i + 1) + ': ' + p.join(', '));
            if (Math.abs(p[0]) > 180) push(nm, 'error', 'range', 'Longitud fuera de rango (−180 a 180)', 'Vértice ' + (i + 1) + ': ' + p.join(', '));
          });
          if (ln.length < 2) push(nm, 'error', 'degenerate', 'Línea con menos de 2 vértices');
        });
        return;
      }
      if (g.type === 'Point' || g.type === 'MultiPoint') {
        const pts = g.type === 'Point' ? [g.coordinates] : g.coordinates;
        pts.forEach(p => {
          if (Math.abs(p[1]) > 90 || Math.abs(p[0]) > 180) push(nm, 'error', 'range', 'Coordenada fuera de rango', p.join(', '));
        });
        stats.vertices += pts.length;
        return;
      }
      if (!polys.length) { push(nm, 'warn', 'type', 'Tipo de geometría no validado: ' + g.type); return; }
      let fArea = 0;
      polys.forEach((poly, pi) => {
        stats.polygons++;
        const shell = poly[0], holes = poly.slice(1);
        if (!shell || shell.length < 4) { push(nm, 'error', 'degenerate', 'Anillo exterior con menos de 4 vértices', 'Polígono ' + (pi + 1)); return; }
        let ringArea = 0;
        poly.forEach((ring, ri) => {
          stats.vertices += ring.length;
          const isShell = ri === 0;
          if (isShell) ringArea += G.areaM2(ring); else ringArea -= G.areaM2(ring);
          const first = ring[0], last = ring[ring.length - 1];
          if (!first || !last || first[0] !== last[0] || first[1] !== last[1]) {
            push(nm, 'error', 'unclosed', (isShell ? 'Anillo exterior' : 'Anillo interior') + ' no está cerrado', 'Polígono ' + (pi + 1) + ', anillo ' + (ri + 1) + '. El primer y último vértice deben coincidir.');
          }
          if (ring.length < 4) push(nm, 'error', 'degenerate', 'Anillo con menos de 4 vértices', 'Polígono ' + (pi + 1) + ', anillo ' + (ri + 1));
          let dup = 0;
          for (let i = 1; i < ring.length; i++) {
            if (ring[i][0] === ring[i - 1][0] && ring[i][1] === ring[i - 1][1]) dup++;
          }
          if (dup) push(nm, 'warn', 'dup', dup + ' vértice(s) duplicado(s) consecutivo(s)', 'Polígono ' + (pi + 1) + ', anillo ' + (ri + 1) + '. Puede generar rechazos en validadores estrictos.');
          const si = G.selfIntersections(ring);
          if (si.length) push(nm, 'error', 'selfint', 'Auto-intersección del anillo', si.length + ' cruce(s) detectado(s). Corrija la geometría en su SIG.');
          if (ring.length > 12000) push(nm, 'info', 'dense', 'Anillo muy denso (' + ring.length + ' vértices)', 'Considere simplificar para visores y trámites.');
          if (isShell) {
            const a = G.signedArea(ring);
            if (a < 0) push(nm, 'info', 'winding', 'Anillo exterior en sentido horario', 'RFC 7946 espera sentido antihorario. Algunos visores lo toleran; normalizar mejora interoperabilidad.');
            if (Math.abs(G.areaM2(ring)) < 1) push(nm, 'warn', 'area', 'Área exterior casi nula (< 1 m²)');
            if (holes.length) {
              holes.forEach((h, hi) => {
                if (!G.pointInRing(h[0], shell)) push(nm, 'warn', 'hole-outside', 'Anillo interior fuera del exterior', 'Polígono ' + (pi + 1) + ', hueco ' + (hi + 1) + '. Revise si el hueco pertenece a otro polígono.');
              });
            }
          }
        });
        fArea += ringArea;
      });
      stats.area += fArea;
      if (fArea <= 0) push(nm, 'error', 'area', 'Área total no positiva (' + GL.fmt(fArea, 1) + ' m²)', 'Posible anidamiento de anillos invertido o geometría degenerada.');
      if (!isFinite(fArea)) push(nm, 'error', 'area', 'Área no calculable');
    });
    // bboxes cruzan el antimeridiano: aviso genérico
    if (features.length > 1) {
      const boxes = features.map(f => G.bbox(f.geometry.coordinates));
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], b = boxes[j];
          if (a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3]) {
            // solo aviso informativo si se solapan fuertemente
            const wa = a[2] - a[0], wb = b[2] - b[0], ha = a[3] - a[1], hb = b[3] - b[1];
            if (wa > 0 && wb > 0 && ha > 0 && hb > 0) {
              const ix = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
              const iy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
              if (ix > 0 && iy > 0) {
                issues.push({
                  feature: (features[i].name || 'Feature ' + (i + 1)) + ' ↔ ' + (features[j].name || 'Feature ' + (j + 1)),
                  sev: 'info', code: 'bbox-overlap', fixable: false,
                  msg: 'Las extensiones de dos entidades se solapan',
                  detail: 'Puede ser normal (polígonos anidados) o indicar duplicidad de límites. Verifique en el mapa.'
                });
              }
            }
          }
        }
      }
    }
    return { issues, stats };
  };

  /* ------------------------------------------------------------------ fix */
  function dedupeRing(ring) {
    const out = [];
    ring.forEach(p => {
      const last = out[out.length - 1];
      if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push([p[0], p[1]]);
    });
    return out;
  }
  function closeRing(ring) {
    if (ring.length < 3) return ring;
    const a = ring[0], b = ring[ring.length - 1];
    if (a[0] !== b[0] || a[1] !== b[1]) ring.push([a[0], a[1]]);
    return ring;
  }
  G.fix = function (features) {
    let changes = 0;
    const out = JSON.parse(JSON.stringify(features));
    out.forEach(f => {
      const g = f.geometry;
      if (!g) return;
      const fixPoly = poly => {
        let cleaned = [];
        poly.forEach((ring, ri) => {
          let r = dedupeRing(ring);
          if (r.length < 3) { changes++; return; }
          r = closeRing(r);
          if (r.length < 4) { changes++; return; }
          const a = G.signedArea(r);
          const wantCCW = ri === 0;
          if ((a < 0 && wantCCW) || (a > 0 && !wantCCW)) { r.reverse(); changes++; }
          cleaned.push(r);
        });
        return cleaned.length ? cleaned : null;
      };
      if (g.type === 'Polygon') {
        const p = fixPoly(g.coordinates);
        if (p) { if (JSON.stringify(p) !== JSON.stringify(g.coordinates)) changes++; g.coordinates = p; }
      } else if (g.type === 'MultiPolygon') {
        const ps = g.coordinates.map(fixPoly).filter(Boolean);
        if (JSON.stringify(ps) !== JSON.stringify(g.coordinates)) changes++;
        g.coordinates = ps;
      }
    });
    return { features: out, changes };
  };

  /* ------------------------------------------------------------- export */
  G.toGeoJSON = function (features) {
    return JSON.stringify({
      type: 'FeatureCollection',
      name: 'Green Owl Labs export',
      features: features.map(f => ({ type: 'Feature', properties: Object.assign({ name: f.name }, f.props || {}), geometry: f.geometry }))
    }, null, 2);
  };
  function kmlCoords(ring, prec) {
    return ring.map(p => p[0].toFixed(prec) + ',' + p[1].toFixed(prec) + ',0').join(' ');
  }
  G.toKML = function (features, opts) {
    opts = Object.assign({ precision: 7, nameField: 'name', includeAttrs: true, color: 'ff5fe3a1', fill: true, outline: true }, opts || {});
    const esc = GL.escape;
    const styles = `<Style id="gowlPoly"><LineStyle><color>${opts.color}</color><width>2</width></LineStyle><PolyStyle><color>${opts.fill ? '4d5fe3a1' : '00ffffff'}</color><fill>${opts.fill ? 1 : 0}</fill><outline>${opts.outline ? 1 : 0}</outline></PolyStyle></Style>
<Style id="gowlLine"><LineStyle><color>${opts.color}</color><width>2</width></LineStyle></Style>
<Style id="gowlPoint"><IconStyle><color>${opts.color}</color><scale>0.9</scale><Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon></IconStyle></Style>`;
    const placemarks = features.map(f => {
      const g = f.geometry, nm = f.name || 'Entidad';
      let geom = '';
      if (g.type === 'Polygon' || g.type === 'MultiPolygon') {
        const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
        geom = polys.map(poly => {
          const outer = poly[0] || [];
          const holes = poly.slice(1).map(h => `<innerBoundaryIs><LinearRing><coordinates>${kmlCoords(h, opts.precision)}</coordinates></LinearRing></innerBoundaryIs>`).join('');
          return `<Polygon><tessellate>1</tessellate><altitudeMode>clampToGround</altitudeMode><outerBoundaryIs><LinearRing><coordinates>${kmlCoords(outer, opts.precision)}</coordinates></LinearRing></outerBoundaryIs>${holes}</Polygon>`;
        }).join('');
        if (polys.length > 1) geom = `<MultiGeometry>${geom}</MultiGeometry>`;
      } else if (g.type === 'LineString' || g.type === 'MultiLineString') {
        const lines = g.type === 'LineString' ? [g.coordinates] : g.coordinates;
        geom = lines.map(l => `<LineString><tessellate>1</tessellate><coordinates>${kmlCoords(l, opts.precision)}</coordinates></LineString>`).join('');
        if (lines.length > 1) geom = `<MultiGeometry>${geom}</MultiGeometry>`;
      } else if (g.type === 'Point' || g.type === 'MultiPoint') {
        const pts = g.type === 'Point' ? [g.coordinates] : g.coordinates;
        geom = pts.map(p => `<Point><coordinates>${p[0].toFixed(opts.precision)},${p[1].toFixed(opts.precision)},0</coordinates></Point>`).join('');
        if (pts.length > 1) geom = `<MultiGeometry>${geom}</MultiGeometry>`;
      }
      const attrs = opts.includeAttrs && f.props ? Object.keys(f.props).filter(k => f.props[k] !== null && f.props[k] !== '').map(k =>
        `<Data name="${esc(k)}"><value>${esc(f.props[k])}</value></Data>`).join('') : '';
      const style = /Polygon/.test(g.type) ? '#gowlPoly' : /Line/.test(g.type) ? '#gowlLine' : '#gowlPoint';
      return `<Placemark><name>${esc(nm)}</name>${f.desc ? `<description>${esc(f.desc)}</description>` : ''}${attrs ? `<ExtendedData>${attrs}</ExtendedData>` : ''}<styleUrl>${style}</styleUrl>${geom}</Placemark>`;
    }).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
<Document>
<name>Green Owl Labs · ${esc(opts.title || 'Exportación')}</name>
<description>Generado localmente con Green Owl Labs. Sistema de referencia: WGS 84 (EPSG:4326).</description>
${styles}
${placemarks}
</Document>
</kml>`;
  };

  /* ---------------------------------------------------------- canvas map */
  G.render = function (canvas, features, opts) {
    if (!canvas) return;
    opts = opts || {};
    const parent = canvas.parentElement;
    const W = parent.clientWidth, H = parent.clientHeight;
    if (W < 10 || H < 10) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!features || !features.length) {
      ctx.fillStyle = 'rgba(140,170,155,.55)';
      ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Sin geometrías para mostrar', W / 2, H / 2);
      return;
    }
    let bb = [Infinity, Infinity, -Infinity, -Infinity];
    features.forEach(f => { if (f.geometry) G.bbox(f.geometry.coordinates, bb); });
    if (!isFinite(bb[0])) return;
    const pad = 18;
    const dx = bb[2] - bb[0] || 1e-6, dy = bb[3] - bb[1] || 1e-6;
    const scale = Math.min((W - pad * 2) / dx, (H - pad * 2) / dy);
    const ox = pad + ((W - pad * 2) - dx * scale) / 2 - bb[0] * scale;
    const oy = pad + ((H - pad * 2) - dy * scale) / 2 + bb[3] * scale;
    const px = p => [p[0] * scale + ox, oy - p[1] * scale];
    // grid
    ctx.strokeStyle = 'rgba(140,170,155,.08)'; ctx.lineWidth = 1;
    for (let x = pad; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = pad; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    features.forEach((f, fi) => {
      const g = f.geometry;
      if (!g) return;
      const color = opts.color ? opts.color : GL.palette[fi % 5];
      const drawRing = (ring, fill, alpha) => {
        if (ring.length < 2) return;
        ctx.beginPath();
        ring.forEach((p, i) => { const q = px(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
        if (fill) { ctx.closePath(); ctx.fillStyle = color + (alpha || '22'); ctx.fill(); }
        ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.stroke();
      };
      if (g.type === 'Polygon' || g.type === 'MultiPolygon') {
        const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
        polys.forEach(poly => {
          ctx.beginPath();
          poly.forEach(ring => {
            ring.forEach((p, i) => { const q = px(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
            ctx.closePath();
          });
          ctx.fillStyle = color + '21';
          ctx.fill('evenodd');
          ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.stroke();
        });
        // vertex dots for small geometries
        if (opts.vertices !== false) {
          polys.forEach(poly => poly.forEach(ring => {
            if (ring.length > 400) return;
            ring.forEach(p => {
              const q = px(p);
              ctx.beginPath(); ctx.arc(q[0], q[1], 1.8, 0, Math.PI * 2);
              ctx.fillStyle = '#0b1f17'; ctx.fill();
              ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
            });
          }));
        }
      } else if (g.type === 'LineString' || g.type === 'MultiLineString') {
        const lines = g.type === 'LineString' ? [g.coordinates] : g.coordinates;
        lines.forEach(l => drawRing(l, false));
      } else if (g.type === 'Point' || g.type === 'MultiPoint') {
        const pts = g.type === 'Point' ? [g.coordinates] : g.coordinates;
        pts.forEach(p => {
          const q = px(p);
          ctx.beginPath(); ctx.arc(q[0], q[1], 3.2, 0, Math.PI * 2);
          ctx.fillStyle = color; ctx.fill();
        });
      }
    });
    // north arrow
    ctx.fillStyle = 'rgba(140,170,155,.6)';
    ctx.font = '9px monospace'; ctx.textAlign = 'right';
    ctx.fillText('N ↑', W - 8, H - 8);
  };

  /* ---------------------------------------------------------- file router */
  G.readAsArrayBuffer = file => new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej(fr.error);
    fr.readAsArrayBuffer(file);
  });
  G.readAsText = file => new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej(fr.error);
    fr.readAsText(file);
  });
  G.parseFiles = async function (files, options={}) {
    const list = Array.from(files || []);
    const find = ext => list.find(f => f.name.toLowerCase().endsWith(ext));
    const shp = find('.shp'), dbf = find('.dbf'), kml = find('.kml'), geojson = find('.geojson') || find('.json');
    if (shp) {
      const buf = await G.readAsArrayBuffer(shp);
      const dbfBuf = dbf ? await G.readAsArrayBuffer(dbf) : null;
      return { features: G.parseSHP(buf, dbfBuf), kind: 'SHP' + (dbf ? ' + DBF' : '') };
    }
    if (kml) return { features: G.parseKML(await G.readAsText(kml)), kind: 'KML' };
    if (geojson) return { features: G.parseGeoJSON(await G.readAsText(geojson),options), kind: 'GeoJSON' };
    throw new Error('Seleccione un .shp (+ .dbf), .kml o .geojson');
  };
})();
