/* SVG map of Vietnam's 34 first-level administrative units.
   Geometry comes from js/provinces34.js (MIT, thanglequoc/vietnamese-provinces-database). */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const PAD = 34;
  const W = 1000;

  function merc(lat) {
    return (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI;
  }

  function node(name, attrs) {
    const el = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function level(count) {
    return count >= 50 ? 4 : count >= 35 ? 3 : count >= 20 ? 2 : 1;
  }

  function shortLabel(name) {
    const s = String(name || '').replace(/^TP\.\s*/, 'TP. ');
    return s === 'TP. Hồ Chí Minh' ? 'TP.HCM' : s;
  }

  function ringCentroid(ring) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
      a += cross;
      cx += (ring[j][0] + ring[i][0]) * cross;
      cy += (ring[j][1] + ring[i][1]) * cross;
    }
    if (Math.abs(a) < 1e-9) {
      const sum = ring.reduce((s, p) => [s[0] + p[0], s[1] + p[1]], [0, 0]);
      return [sum[0] / ring.length, sum[1] / ring.length];
    }
    return [cx / (3 * a), cy / (3 * a)];
  }

  function largestRing(row) {
    let best = null;
    let bestArea = -1;
    for (const ring of row.g) {
      let a = 0;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
      }
      a = Math.abs(a / 2);
      if (a > bestArea) { bestArea = a; best = ring; }
    }
    return best;
  }

  function overlaps(a, b) {
    return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  }

  function render(container, rows, opts = {}) {
    container.innerHTML = '';
    if (!rows || !rows.length) return null;
    // Keep on-screen type readable: labels grow in viewBox units on narrow maps.
    const FONT = Math.max(26, Math.min(48, Math.round(11800 / Math.max(260, container.clientWidth || 700))));
    let minLon = 999, maxLon = -999, minLat = 999, maxLat = -999;
    for (const row of rows) {
      for (const ring of row.g) for (const [lon, lat] of ring) {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }
    const yTop = merc(maxLat);
    const yBot = merc(minLat);
    const scale = (W - PAD * 2) / (maxLon - minLon);
    const H = Math.round((yTop - yBot) * scale + PAD * 2);
    const project = ([lon, lat]) => [PAD + (lon - minLon) * scale, PAD + (yTop - merc(lat)) * scale];

    const svg = node('svg', {
      viewBox: `0 0 ${W} ${H}`,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-label': opts.aria || '',
    });
    const gProv = node('g', { class: 'map-provinces' });
    svg.appendChild(gProv);

    const groups = new Map();
    const byKey = new Map();
    rows.forEach((row) => {
      const d = row.g.map((ring) => 'M' + ring.map((p) => {
        const [x, y] = project(p);
        return x.toFixed(1) + ' ' + y.toFixed(1);
      }).join('L') + 'Z').join('');
      const g = node('g', {
        class: `map-prov lvl-${level(row.count || 0)}`,
        'data-key': row.key,
        tabindex: '0',
        role: 'button',
        'aria-label': opts.ariaFor ? opts.ariaFor(row) : row.key,
      });
      g.appendChild(node('path', { d, 'vector-effect': 'non-scaling-stroke' }));
      const title = node('title');
      title.textContent = opts.titleFor ? opts.titleFor(row) : row.key;
      g.appendChild(title);
      g.addEventListener('click', () => opts.onSelect && opts.onSelect(row.key));
      g.addEventListener('pointerenter', (e) => showTip(row, e.clientX, e.clientY));
      g.addEventListener('pointermove', (e) => moveTip(e.clientX, e.clientY));
      g.addEventListener('pointerleave', hideTip);
      g.addEventListener('focus', () => {
        const r = g.getBoundingClientRect();
        showTip(row, r.left + r.width / 2, r.top + r.height / 2);
      });
      g.addEventListener('blur', hideTip);
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          if (opts.onSelect) opts.onSelect(row.key);
        }
      });
      gProv.appendChild(g);
      groups.set(row.key, g);
      byKey.set(row.key, row);
    });

    // Labels: selected and place-rich provinces first, then avoid collisions.
    const labelLayer = node('g', { class: 'map-labels', 'pointer-events': 'none' });
    const placed = [];
    const labelByKey = new Map();
    const selectedKey = opts.selected || null;

    function labelText(row) {
      return shortLabel(row.name || row.n || row.key);
    }

    function labelNode(row, tx, ty) {
      const t = node('text', {
        x: tx.toFixed(1),
        y: ty.toFixed(1),
        class: 'map-label',
        'font-size': FONT,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
      });
      t.textContent = labelText(row);
      return t;
    }

    const ordered = rows.slice().sort((a, b) => {
      if (a.key === selectedKey) return -1;
      if (b.key === selectedKey) return 1;
      return (b.count || 0) - (a.count || 0) || (b.a || 0) - (a.a || 0);
    });
    for (const row of ordered) {
      const ring = largestRing(row);
      if (!ring) continue;
      const [lon, lat] = ringCentroid(ring);
      const [ax, ay] = project([lon, lat]);
      const text = labelText(row);
      const tw = text.length * FONT * 0.62;
      const th = FONT * 1.26;
      const tries = [
        [0, 0], [0, -FONT * 1.3], [0, FONT * 1.3], [-tw * 0.55, 0], [tw * 0.55, 0],
        [-tw * 0.45, -FONT * 1.25], [tw * 0.45, -FONT * 1.25],
        [-tw * 0.45, FONT * 1.25], [tw * 0.45, FONT * 1.25],
        [0, -FONT * 2.5], [0, FONT * 2.5],
      ];
      let spot = null;
      for (const [dx, dy] of tries) {
        const box = { x: ax + dx - tw / 2, y: ay + dy - th * 0.42, w: tw, h: th };
        if (box.x < 6 || box.x + box.w > W - 6 || box.y < 2 || box.y + box.h > H - 2) continue;
        if (placed.some((b) => overlaps(b, box))) continue;
        spot = { box, tx: ax + dx, ty: ay + dy };
        break;
      }
      if (!spot) continue;
      placed.push(spot.box);
      const t = labelNode(row, spot.tx, spot.ty);
      if (row.key === selectedKey) t.classList.add('is-on');
      labelLayer.appendChild(t);
      labelByKey.set(row.key, t);
    }
    svg.appendChild(labelLayer);
    container.appendChild(svg);

    const tipEl = opts.tipEl || null;

    function showTip(row, cx, cy) {
      if (!tipEl) return;
      tipEl.innerHTML = opts.tipFor ? opts.tipFor(row) : row.key;
      tipEl.hidden = false;
      moveTip(cx, cy);
    }

    function moveTip(cx, cy) {
      if (!tipEl || tipEl.hidden) return;
      const host = tipEl.offsetParent || tipEl.parentElement;
      if (!host) return;
      const r = host.getBoundingClientRect();
      let x = cx - r.left + 16;
      let y = cy - r.top + 16;
      const tw = tipEl.offsetWidth;
      const th = tipEl.offsetHeight;
      if (x + tw > r.width - 8) x = cx - r.left - tw - 16;
      if (y + th > r.height - 8) y = cy - r.top - th - 16;
      tipEl.style.left = Math.max(8, x) + 'px';
      tipEl.style.top = Math.max(8, y) + 'px';
    }

    function hideTip() {
      if (tipEl) tipEl.hidden = true;
    }

    const api = {
      height: H,
      select(key) {
        groups.forEach((g, k) => {
          g.classList.toggle('is-on', k === key);
          if (k === key) gProv.appendChild(g);
        });
        labelLayer.querySelectorAll('[data-extra]').forEach((t) => {
          if (t.dataset.extra !== key) {
            labelByKey.delete(t.dataset.extra);
            t.remove();
          }
        });
        labelByKey.forEach((t, k) => t.classList.toggle('is-on', k === key));
        if (key && !labelByKey.has(key)) {
          const row = byKey.get(key);
          const ring = row ? largestRing(row) : null;
          if (ring) {
            const [ax, ay] = project(ringCentroid(ring));
            const t = labelNode(row, ax, ay - FONT * 0.2);
            t.classList.add('is-on');
            t.dataset.extra = key;
            labelLayer.appendChild(t);
            labelByKey.set(key, t);
          }
        }
        tipEl && (tipEl.hidden = true);
      },
      row(key) { return byKey.get(key) || null; },
    };
    if (opts.selected) api.select(opts.selected);
    return api;
  }

  window.ProvincesMap = { render, level };
})();
