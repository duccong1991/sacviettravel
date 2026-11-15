/* Sắc Việt – sinh tranh phong cảnh SVG theo địa danh (offline, tất định) */
(function () {
  const S = {};

  const REGION_COLORS = {
    'Miền núi phía Bắc': { deep: '#0f352f', mid: '#1c554b', soft: '#6f9a86', gold: '#eac07a', warm: '#d98d62' },
    'Đồng bằng Bắc Bộ': { deep: '#0e3a31', mid: '#246551', soft: '#86af94', gold: '#ecc473', warm: '#d89a66' },
    'Bắc Trung Bộ': { deep: '#0d3740', mid: '#25606d', soft: '#83aeb2', gold: '#ecc17a', warm: '#df9466' },
    'Nam Trung Bộ & Tây Nguyên': { deep: '#0c3a3e', mid: '#1d6a68', soft: '#7cbdb1', gold: '#f1c87c', warm: '#e29a6d' },
    'Đông Nam Bộ': { deep: '#133743', mid: '#2b6370', soft: '#8db8bd', gold: '#f2cb83', warm: '#e6a077' },
    'Đồng bằng sông Cửu Long': { deep: '#103a2b', mid: '#286646', soft: '#9dc28d', gold: '#f2cc72', warm: '#e3a062' },
  };

  const SKIES = {
    day: [
      { c: ['#2f8db4', '#7fc5d4', '#d3ece6', '#fdfaec'], sun: '#fffdf2', glow: '#fff0b0', cloud: 0.62, ink: '#123c45' },
      { c: ['#3a93ae', '#8fcdd0', '#e2f0e6', '#fffaf0'], sun: '#fffef8', glow: '#fff3c6', cloud: 0.55, ink: '#153f43' },
      { c: ['#3f8fa8', '#93c8c9', '#e8efdc', '#fdf9ea'], sun: '#fffef6', glow: '#ffefb4', cloud: 0.58, ink: '#14383a' },
    ],
    golden: [
      { c: ['#3d7f96', '#95c2c0', '#ead7a9', '#fdf2d8'], sun: '#fff7dc', glow: '#ffde96', cloud: 0.42, ink: '#173a33' },
      { c: ['#4a8090', '#a8c2af', '#efd9ad', '#fdf5df'], sun: '#fff9e6', glow: '#ffe2a4', cloud: 0.4, ink: '#17392f' },
    ],
    dusk: [
      { c: ['#1a2b4a', '#56698d', '#e0a878', '#fbe7bb'], sun: '#ffe8ba', glow: '#ffcd82', cloud: 0.3, ink: '#ffffff' },
      { c: ['#272238', '#6b4a62', '#e0926e', '#f8d9a2'], sun: '#ffdb9f', glow: '#ffc077', cloud: 0.32, ink: '#ffffff' },
    ],
  };

  function pickSky(place, kind) {
    const h = U.hash(place.id);
    const water = ['bay', 'island', 'beach', 'lake', 'river', 'lagoon', 'wetland', 'harbor', 'fishing-village', 'hotspring'].includes(kind);
    if (water) return SKIES.day[h % SKIES.day.length];
    if (kind === 'desert') return SKIES.golden[h % SKIES.golden.length];
    if (['mountain', 'peak', 'pass', 'plateau', 'valley', 'forest', 'terrace', 'garden', 'eco', 'cave', 'waterfall', 'rockfield'].includes(kind)) {
      return SKIES.day[(h + 1) % SKIES.day.length];
    }
    if (['city', 'town', 'theme', 'market'].includes(kind)) return SKIES.dusk[h % SKIES.dusk.length];
    if (['pagoda', 'temple', 'church', 'citadel', 'tower', 'relic', 'museum', 'statue'].includes(kind) && h % 5 === 0) {
      return SKIES.dusk[h % SKIES.dusk.length];
    }
    return SKIES.golden[h % SKIES.golden.length];
  }

  const K = {
    pagoda: '#a9683f', temple: '#9a4f3f', church: '#7c5a4a', cave: '#0a2429',
    citadel: '#6d5a45', tower: '#a25c3f', relic: '#7a6248', museum: '#8a7154',
  };

  function ridge(rnd, y, amp, fill, op, jag = 1) {
    let d = `M0,${y}`;
    for (let x = 0; x <= 1600; x += 70) {
      d += ` L${x},${(y - rnd() * amp * jag).toFixed(1)}`;
    }
    d += ' L1600,920 L0,920 Z';
    return `<path d="${d}" fill="${fill}" opacity="${op}"/>`;
  }

  function softRidge(rnd, y, amp, fill, op) {
    let d = `M0,${y}`;
    let prev = y;
    for (let x = 0; x <= 1600; x += 160) {
      const ny = y - rnd() * amp;
      d += ` Q${x + 80},${Math.min(prev, ny) - amp * 0.25} ${x + 160},${ny}`;
      prev = ny;
    }
    d += ' L1760,920 L0,920 Z';
    return `<path d="${d}" fill="${fill}" opacity="${op}"/>`;
  }

  function karst(x, base, w, h, fill, accent, op = 1) {
    const top = base - h;
    return `<path d="M${x - w / 2},${base} C${x - w * 0.46},${base - h * 0.5} ${x - w * 0.3},${top + h * 0.2} ${x - w * 0.05},${top} C${x + w * 0.16},${top + h * 0.06} ${x + w * 0.36},${top + h * 0.34} ${x + w * 0.48},${base} Z" fill="${fill}" opacity="${op}"/>
      <path d="M${x - w * 0.36},${base - h * 0.32} C${x - w * 0.18},${base - h * 0.55} ${x + w * 0.1},${base - h * 0.5} ${x + w * 0.33},${base - h * 0.26}" stroke="${accent}" stroke-width="7" opacity="0.18" fill="none"/>`;
  }

  function palm(x, base, s, color, dark) {
    return `<g>
      <path d="M${x},${base} C${x - 6 * s},${base - 50 * s} ${x + 4 * s},${base - 100 * s} ${x - 4 * s},${base - 150 * s}" stroke="${dark}" stroke-width="${7 * s}" fill="none" stroke-linecap="round"/>
      <g fill="${color}" opacity="0.95">
        <path d="M${x - 4 * s},${base - 150 * s} C${x - 55 * s},${base - 185 * s} ${x - 70 * s},${base - 130 * s} ${x - 18 * s},${base - 128 * s} Z"/>
        <path d="M${x - 4 * s},${base - 150 * s} C${x + 45 * s},${base - 195 * s} ${x + 78 * s},${base - 150 * s} ${x + 22 * s},${base - 128 * s} Z"/>
        <path d="M${x - 4 * s},${base - 150 * s} C${x - 15 * s},${base - 205 * s} ${x + 28 * s},${base - 205 * s} ${x + 4 * s},${base - 140 * s} Z"/>
        <path d="M${x - 4 * s},${base - 150 * s} C${x - 78 * s},${base - 140 * s} ${x - 70 * s},${base - 105 * s} ${x - 10 * s},${base - 118 * s} Z"/>
      </g>
    </g>`;
  }

  function boat(x, y, s, hull, sail, flip = 1) {
    return `<g transform="translate(${x},${y}) scale(${s * flip},${s})">
      <path d="M-74,0 Q0,26 74,0 L58,-16 L-58,-16 Z" fill="${hull}"/>
      <rect x="-2" y="-120" width="5" height="106" fill="${hull}" opacity="0.85"/>
      <path d="M3,-112 Q58,-86 48,-28 L3,-36 Z" fill="${sail}" opacity="0.92"/>
      <path d="M-2,-108 Q-45,-84 -38,-32 L-2,-38 Z" fill="${sail}" opacity="0.78"/>
      <path d="M-52,-12 L52,-12" stroke="${hull}" stroke-width="3" opacity="0.5"/>
    </g>`;
  }

  function bird(x, y, s, color) {
    return `<path d="M${x},${y} q${9 * s},${-8 * s} ${18 * s},0 q${9 * s},${-8 * s} ${18 * s},0" stroke="${color}" stroke-width="${2.4 * s}" fill="none" stroke-linecap="round" opacity="0.55"/>`;
  }

  function pagoda(x, base, s, color, accent) {
    let out = '';
    for (let i = 0; i < 3; i++) {
      const w = (72 - i * 15) * s;
      const y = base - i * 54 * s;
      out += `<path d="M${x - w},${y} Q${x},${y - 34 * s} ${x + w},${y} L${x + w * 0.78},${y + 10 * s} L${x - w * 0.78},${y + 10 * s} Z" fill="${color}"/>`;
      out += `<rect x="${x - w * 0.55}" y="${y + 10 * s}" width="${w * 1.1}" height="${40 * s}" fill="${color}"/>`;
      out += `<rect x="${x - w * 0.18}" y="${y + 16 * s}" width="${w * 0.36}" height="${22 * s}" fill="${accent}" opacity="0.5"/>`;
    }
    const apex = base - 142 * s;
    out += `<rect x="${x - 2 * s}" y="${apex - 26 * s}" width="${4 * s}" height="${26 * s}" fill="${accent}"/>`;
    out += `<circle cx="${x}" cy="${apex - 29 * s}" r="${5 * s}" fill="${accent}"/>`;
    return out;
  }

  function pine(x, base, h, color) {
    const w = h * 0.34;
    return `<g fill="${color}">
      <path d="M${x},${base - h} L${x - w * 0.55},${base - h * 0.58} L${x + w * 0.55},${base - h * 0.58} Z"/>
      <path d="M${x},${base - h * 0.76} L${x - w * 0.74},${base - h * 0.32} L${x + w * 0.74},${base - h * 0.32} Z"/>
      <path d="M${x},${base - h * 0.48} L${x - w},${base - h * 0.04} L${x + w},${base - h * 0.04} Z"/>
      <rect x="${x - 3}" y="${base - h * 0.05}" width="6" height="${h * 0.08}" fill="#38291d"/>
    </g>`;
  }

  function stiltHouse(x, base, s, wall, roof) {    return `<g>
      <rect x="${x - 40 * s}" y="${base - 52 * s}" width="${80 * s}" height="${44 * s}" fill="${wall}"/>
      <path d="M${x - 55 * s},${base - 50 * s} L${x},${base - 84 * s} L${x + 55 * s},${base - 50 * s} Z" fill="${roof}"/>
      <rect x="${x - 30 * s}" y="${base - 8 * s}" width="${4 * s}" height="${16 * s}" fill="${roof}"/>
      <rect x="${x + 26 * s}" y="${base - 8 * s}" width="${4 * s}" height="${16 * s}" fill="${roof}"/>
      <rect x="${x - 8 * s}" y="${base - 36 * s}" width="${10 * s}" height="${18 * s}" fill="${roof}" opacity="0.55"/>
    </g>`;
  }

  function palmRow(rnd, base, colors) {
    let out = '';
    for (let i = 0; i < 4; i++) {
      out += palm(140 + i * 420 + rnd() * 90, base, 0.9 + rnd() * 0.5, '#2f6b45', colors.deep);
    }
    return out;
  }

  function mistBand(id, y, h = 90, op = 0.16) {
    return `<rect x="-40" y="${y}" width="1680" height="${h}" fill="url(#mist${id})" opacity="${op}" class="mist"/>`;
  }

  function sunRays(x, y, id) {
    let out = `<g class="sun-rays" opacity="0.5" filter="url(#blur${id})">`;
    for (let i = 0; i < 6; i++) {
      const a = -66 + i * 22;
      out += `<path d="M${x},${y} l-260,-1050 l150,0 Z" fill="#ffe4a6" opacity="${0.05 + (i % 3) * 0.018}" transform="rotate(${a} ${x} ${y})"/>`;
    }
    return out + '</g>';
  }

  function leaf(x, y, len, lean, color, op) {
    return `<path d="M${x},${y} Q${x + lean * 0.3},${y - len * 0.55} ${x + lean},${y - len} Q${x + lean * 0.72},${y - len * 0.4} ${x},${y} Z" fill="${color}" opacity="${op}"/>`;
  }

  function frond(x, y, s, dir, color, op = 0.92) {
    let out = `<g class="fg-frond">`;
    const leaves = [[-64, 70], [-38, 96], [-12, 108], [16, 104], [44, 86], [66, 60], [82, 34]];
    for (const [dx, up] of leaves) {
      out += leaf(x, y, up * s, dx * s * dir, color, op);
    }
    out += `<path d="M${x},${y} C${x + 22 * s * dir},${y - 40 * s} ${x + 30 * s * dir},${y - 96 * s} ${x + 52 * s * dir},${y - 150 * s}" stroke="${color}" stroke-width="${5 * s}" fill="none" opacity="${op * 0.9}" stroke-linecap="round"/>`;
    return out + '</g>';
  }

  function reed(x, y, h, lean, color, op) {
    return `<path d="M${x},${y} q${lean * 0.4},${-h * 0.6} ${lean},${-h}" stroke="${color}" stroke-width="3" fill="none" opacity="${op}" stroke-linecap="round"/>`;
  }

  function motes(rnd, count, color) {
    let out = '<g class="motes">';
    for (let i = 0; i < count; i++) {
      const x = 140 + rnd() * 1320, y = 420 + rnd() * 400, r = 1.4 + rnd() * 2.2;
      out += `<circle class="mote" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" style="animation-delay:${(rnd() * 6).toFixed(2)}s;animation-duration:${(5 + rnd() * 5).toFixed(1)}s"/>`;
    }
    return out + '</g>';
  }

  const AREA_SHIRTS = ['#d9483f', '#1f7a6b', '#e0a33a', '#5b6fb3', '#c2557a', '#4f8c6f', '#efe6d2', '#e07a4f'];
  const AREA_PANTS = ['#2b3a55', '#3c3226', '#334155', '#2c2a35', '#4a3b2c'];
  const AREA_SKINS = ['#f6d3b3', '#ecc39d', '#e9b98f', '#f4cfa9'];
  const AREA_HAIRS = ['#2f241d', '#3a2a22', '#241b16', '#1f1a17'];
  const AREA_CAPS = ['#e8cf94', '#d9483f', '#1f7a6b', '#5b6fb3'];
  const AREA_HATS = ['none', 'none', 'cap', 'non', 'cap', 'none'];

  function areaLook(rnd) {
    return {
      shirt: AREA_SHIRTS[Math.floor(rnd() * AREA_SHIRTS.length)],
      pants: AREA_PANTS[Math.floor(rnd() * AREA_PANTS.length)],
      skin: AREA_SKINS[Math.floor(rnd() * AREA_SKINS.length)],
      hair: AREA_HAIRS[Math.floor(rnd() * AREA_HAIRS.length)],
      cap: AREA_CAPS[Math.floor(rnd() * AREA_CAPS.length)],
      hat: AREA_HATS[Math.floor(rnd() * AREA_HATS.length)],
    };
  }

  function areaHat(L) {
    if (L.hat === 'cap') {
      return `<path d="M-8.6 -38.4a8.6 8.6 0 0 1 17.2 0z" fill="${L.cap}"/>`
        + `<rect x="-9.6" y="-39.1" width="19.2" height="2.2" rx="1.1" fill="${L.cap}"/>`;
    }
    if (L.hat === 'non') {
      return `<path d="M0 -56.4L-11.4 -39.4q11.4 3.6 22.8 0z" fill="#e8cf94" stroke="#c9a961" stroke-width="1" stroke-linejoin="round"/>`
        + `<ellipse cx="0" cy="-39.4" rx="11.4" ry="2" fill="#d9ba76"/>`;
    }
    return '';
  }

  function areaPerson(x, y, s, L, pose = 'walk', flip = 1) {
    const step = pose === 'walk' ? 9 : 0;
    let arms = `
      <g transform="rotate(-9 -8.3 -28)"><rect x="-10.9" y="-28.4" width="4.7" height="12.8" rx="2.35" fill="${L.skin}"/></g>
      <g transform="rotate(9 8.3 -28)"><rect x="6.2" y="-28.4" width="4.7" height="12.8" rx="2.35" fill="${L.skin}"/></g>`;
    let extra = '';
    if (pose === 'photo') {
      arms = `
        <path d="M-7.8 -28.2Q-11.6 -34.4 -3.4 -36.2" stroke="${L.skin}" stroke-width="4.6" fill="none" stroke-linecap="round"/>
        <path d="M7.8 -28.2Q11.4 -33.6 6.2 -35.4" stroke="${L.skin}" stroke-width="4.6" fill="none" stroke-linecap="round"/>`;
      extra = `<rect x="4.2" y="-41.2" width="3.8" height="6.8" rx="1.1" fill="#22303a" stroke="#0d171c" stroke-width=".7" transform="rotate(-12 6.1 -37.8)"/>`;
    } else if (pose === 'guide') {
      arms = `
        <path d="M-7.8 -28.2Q-11 -33 -8.8 -38.4" stroke="${L.skin}" stroke-width="4.6" fill="none" stroke-linecap="round"/>
        <path d="M7.8 -28.2Q13.4 -34.4 12.6 -43.6" stroke="${L.skin}" stroke-width="4.6" fill="none" stroke-linecap="round"/>`;
      extra = `<rect x="11.9" y="-63.6" width="1.7" height="21" fill="#6b4a2a"/>`
        + `<path d="M13.6 -63.6L27 -58.4l-13.4 5.4z" fill="#d9483f"/>`;
    }
    return `<g transform="translate(${x},${y}) scale(${(s * flip).toFixed(3)},${s})">
      <ellipse cx="0" cy="0" rx="8.8" ry="2.4" fill="#0d241a" opacity=".2"/>
      <g transform="rotate(${-step} -2.7 -18.2)">
        <rect x="-5.5" y="-18.2" width="5.5" height="16.4" rx="2.7" fill="${L.pants}"/>
        <ellipse cx="-2.8" cy="-1.7" rx="3.9" ry="2.2" fill="#2b2118"/>
      </g>
      <g transform="rotate(${step} 2.7 -18.2)">
        <rect x="0" y="-18.2" width="5.5" height="16.4" rx="2.7" fill="${L.pants}"/>
        <ellipse cx="2.8" cy="-1.7" rx="3.9" ry="2.2" fill="#2b2118"/>
      </g>
      <path d="M-7.7 -28.8q7.7-3.2 15.4 0l2.4 12.4q-10.1 3.8-20.2 0z" fill="${L.shirt}"/>
      <path d="M-7.5 -28.2q7.5 2.8 15 0l-.5 3q-7 2.6-14 0z" fill="#fdf1cf"/>
      ${arms}
      <circle cx="0" cy="-36.6" r="8.4" fill="${L.skin}"/>
      <path d="M-8.2 -37.6a8.2 8.2 0 0 1 16.4 0q-3.4-3.6-8.2-3.6t-8.2 3.6z" fill="${L.hair}"/>
      <circle cx="-2.9" cy="-36.4" r="1" fill="#33261d"/>
      <circle cx="2.9" cy="-36.4" r="1" fill="#33261d"/>
      <path d="M-2 -33.6q2 1.5 4 0" stroke="#a3503f" stroke-width=".8" fill="none" stroke-linecap="round"/>
      ${areaHat(L)}
      ${extra}
    </g>`;
  }

  S.render = function (place, opts = {}) {
    const compact = !!opts.compact;
    const rnd = U.rng(U.hash(place.id + place.fame));
    const c = REGION_COLORS[place.region] || REGION_COLORS['Đồng bằng Bắc Bộ'];
    const kind = place.kind || 'relic';
    const sky = pickSky(place, kind);
    const id = U.hash(place.id) % 99999;
    const terrain = place.region === 'Miền núi phía Bắc' ? 'karst' : 'hills';

    const sunX = 260 + rnd() * 780;
    const sunY = 150 + rnd() * 70;
    const horizon = 560 + rnd() * 30;

    const waterKinds = ['bay', 'island', 'beach', 'lake', 'river', 'lagoon', 'wetland', 'harbor', 'fishing-village', 'hotspring'];
    const hasWater = waterKinds.includes(kind);

    const defs = `<defs>
        <linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${sky.c[0]}"/>
          <stop offset="0.42" stop-color="${sky.c[1]}"/>
          <stop offset="0.72" stop-color="${sky.c[2]}"/>
          <stop offset="1" stop-color="${sky.c[3]}"/>
        </linearGradient>
        <linearGradient id="water${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${c.soft}" stop-opacity="0.85"/>
          <stop offset="0.5" stop-color="${c.mid}"/>
          <stop offset="1" stop-color="${c.deep}"/>
        </linearGradient>
        <linearGradient id="sand${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f3dfb4"/>
          <stop offset="1" stop-color="#d8b98a"/>
        </linearGradient>
        <linearGradient id="land${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${c.mid}"/>
          <stop offset="1" stop-color="${c.deep}"/>
        </linearGradient>
        <radialGradient id="glow${id}">
          <stop offset="0" stop-color="${sky.glow}" stop-opacity="0.95"/>
          <stop offset="0.45" stop-color="${sky.glow}" stop-opacity="0.35"/>
          <stop offset="1" stop-color="${sky.glow}" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="mist${id}">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="vig${id}" cx="0.5" cy="0.44" r="0.76">
          <stop offset="0" stop-color="#02100d" stop-opacity="0"/>
          <stop offset="0.62" stop-color="#02100d" stop-opacity="0"/>
          <stop offset="1" stop-color="#02100d" stop-opacity="0.38"/>
        </radialGradient>
        <linearGradient id="grade${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffe0a0" stop-opacity="0.08"/>
          <stop offset="0.5" stop-color="#ffe0a0" stop-opacity="0"/>
          <stop offset="1" stop-color="#06231e" stop-opacity="0.16"/>
        </linearGradient>
        <filter id="blur${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="18"/>
        </filter>
        <filter id="soft${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
        <filter id="depth${id}" x="-12%" y="-12%" width="124%" height="124%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#02100d" flood-opacity="0.5"/>
        </filter>
      </defs>`;

    let svg = `<rect width="1600" height="900" fill="url(#sky${id})"/>
      <circle cx="${sunX}" cy="${sunY}" r="190" fill="url(#glow${id})"/>
      <circle cx="${sunX}" cy="${sunY}" r="36" fill="${sky.sun}" opacity="0.98"/>
      <circle cx="${sunX}" cy="${sunY}" r="58" fill="${sky.sun}" opacity="0.16"/>
      ${compact ? '' : sunRays(sunX, sunY, id)}`;

    // mây
    const cloudCount = compact ? 2 : 6;
    for (let i = 0; i < cloudCount; i++) {
      const cx = rnd() * 1600, cy = 66 + rnd() * 210, s = 0.7 + rnd() * 1.1;
      svg += `<g class="cloud ${i % 2 ? 'cloud-b' : 'cloud-a'}" opacity="${(sky.cloud * (0.55 + rnd() * 0.6)).toFixed(2)}">
        <ellipse cx="${cx}" cy="${cy}" rx="${150 * s}" ry="${26 * s}" fill="#fff"/>
        <ellipse cx="${cx + 70 * s}" cy="${cy - 14 * s}" rx="${92 * s}" ry="${22 * s}" fill="#fff"/>
        <ellipse cx="${cx - 78 * s}" cy="${cy + 6 * s}" rx="${72 * s}" ry="${16 * s}" fill="#fff" opacity="0.75"/>
        <ellipse cx="${cx + 20 * s}" cy="${cy + 14 * s}" rx="${120 * s}" ry="${14 * s}" fill="#fff" opacity="0.55"/>
      </g>`;
    }

    // dãy núi xa: lớp sương nhạt tạo chiều sâu
    svg += softRidge(rnd, horizon - 50, 120, sky.c[2], 0.42);
    if (terrain === 'karst' || hasWater) {
      for (let i = 0; i < (compact ? 4 : 7); i++) {
        svg += karst(110 + i * 230 + rnd() * 70, horizon - 6, 160 + rnd() * 90, 170 + rnd() * 190, c.mid, c.soft, 0.52);
      }
    } else {
      svg += softRidge(rnd, horizon - 20, 160, c.mid, 0.5);
    }
    svg += ridge(rnd, horizon + 20, 100, c.deep, 0.55, 0.8);
    svg += mistBand(id, horizon - 60, 110, 0.2);
    for (let i = 0; i < (compact ? 2 : 4); i++) svg += bird(1020 + i * 66 + rnd() * 50, 150 + i * 30 + rnd() * 20, 0.6 + rnd() * 0.5, sky.ink);

    const far = svg;
    svg = '';

    // mặt nước / mặt đất
    if (hasWater) {
      svg += `<rect x="0" y="${horizon}" width="1600" height="${900 - horizon}" fill="url(#water${id})"/>`;
      svg += `<path d="M0,${horizon + 6} L1600,${horizon - 4}" stroke="#ffffff" stroke-width="3" opacity="0.25"/>`;
      for (let i = 0; i < 16; i++) {
        const y = horizon + 20 + rnd() * (860 - horizon);
        const w = 40 + rnd() * 180;
        svg += `<rect x="${rnd() * 1600}" y="${y}" width="${w}" height="${2 + rnd() * 2}" fill="#fff" opacity="${0.05 + rnd() * 0.1}" class="water-shine"/>`;
      }
      svg += `<path d="M${sunX - 60},${horizon + 10} L${sunX + 50},${horizon + 10} L${sunX + 130},900 L${sunX - 150},900 Z" fill="#ffe3a8" opacity="0.12"/>`;
    } else {
      svg += `<path d="M0,${horizon + 40} C300,${horizon - 30} 600,${horizon + 80} 900,${horizon + 20} C1200,${horizon - 40} 1400,${horizon + 40} 1600,${horizon} L1600,900 L0,900 Z" fill="url(#land${id})"/>`;
    }

    const terrainSvg = svg;
    svg = '';

    // cảnh theo loại địa danh
    if (kind === 'bay' || kind === 'island') {
      for (let i = 0; i < 4; i++) {
        svg += karst(240 + i * 390 + rnd() * 80, horizon + 26, 150 + rnd() * 60, 90 + rnd() * 130, c.deep, c.gold, 0.9);
      }
      svg += boat(1120, horizon + 150, 0.95, '#3a2420', '#b8402f');
      svg += boat(420, horizon + 210, 0.6, '#3a2420', '#cf6a3d', -1);
      svg += `<path d="M0,${horizon + 32} Q300,${horizon + 14} 600,${horizon + 34} T1200,${horizon + 28} T1600,${horizon + 36}" stroke="#f7e4b8" stroke-width="4" fill="none" opacity="0.25"/>`;
    } else if (kind === 'beach') {
      svg += `<path d="M0,${horizon + 120} Q420,${horizon + 60} 900,${horizon + 130} T1600,${horizon + 90} L1600,900 L0,900 Z" fill="url(#sand${id})"/>`;
      for (let i = 0; i < 5; i++) {
        svg += `<path d="M0,${horizon + 40 + i * 16} Q300,${horizon + 26 + i * 16} 620,${horizon + 46 + i * 16} T1260,${horizon + 40 + i * 16} T1600,${horizon + 52 + i * 16}" stroke="#ffffff" stroke-width="3" fill="none" opacity="${0.25 - i * 0.03}"/>`;
      }
      svg += palmRow(rnd, horizon + 120, c);
      svg += boat(1240, horizon + 70, 0.55, '#4a3024', '#c95b3c');
    } else if (kind === 'cave') {
      const arch = `M250,900 C250,560 470,400 800,400 C1130,400 1350,560 1350,900 Z`;
      const archTop = (x) => 900 - 500 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 800) / 550, 2)));
      svg += `<defs>
        <clipPath id="cave${id}"><path d="${arch}"/></clipPath>
        <linearGradient id="caveglow${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1b5550"/>
          <stop offset="0.46" stop-color="#54978a"/>
          <stop offset="0.78" stop-color="#b6c8aa"/>
          <stop offset="1" stop-color="#e9d6a4"/>
        </linearGradient>
      </defs>`;
      svg += `<rect x="-40" y="-40" width="1680" height="980" fill="#071a18"/>`;
      svg += `<path d="${arch}" fill="url(#caveglow${id})"/>`;
      svg += `<g clip-path="url(#cave${id})">
        <ellipse cx="800" cy="560" rx="330" ry="200" fill="#f8e7ba" opacity="0.32" filter="url(#blur${id})"/>
        <path d="M700,400 L900,400 L1120,900 L520,900 Z" fill="#fff3cc" opacity="0.09"/>
        <path d="M250,900 C250,790 470,730 800,730 C1130,730 1350,790 1350,900 Z" fill="url(#water${id})" opacity="0.92"/>
        ${Array.from({ length: 12 }, (_, i) => {
          const x = 350 + i * 84 + rnd() * 16;
          const top = archTop(x) - 4;
          const len = 24 + rnd() * 76;
          return `<path d="M${x - 9},${top} L${x + 10},${top} L${x + 1},${top + len} Z" fill="#0c2a26" opacity="0.94"/>`;
        }).join('')}
        ${Array.from({ length: 9 }, (_, i) => {
          const x = 340 + i * 112 + rnd() * 20;
          const h = 22 + rnd() * 74;
          return `<path d="M${x - 12},900 L${x},${900 - h} L${x + 13},900 Z" fill="#0c2a26" opacity="0.92"/>`;
        }).join('')}
        ${boat(820, horizon + 200, 0.52, '#160f0c', '#d6b17a')}
      </g>`;
      svg += `<path fill-rule="evenodd" fill="#0a2422" d="M0,900 L0,${horizon - 300} L1600,${horizon - 300} L1600,900 Z ${arch}"/>`;
      svg += `<path d="${arch}" fill="none" stroke="#e2bd7c" stroke-width="5" opacity="0.3"/>`;
      svg += `<path d="M0,900 L0,${horizon + 30} L130,${horizon - 60} L260,${horizon + 70} L360,900 Z" fill="#081d1a" opacity="0.85"/>
        <path d="M1600,900 L1600,${horizon + 10} L1460,${horizon - 70} L1340,${horizon + 50} L1240,900 Z" fill="#081d1a" opacity="0.85"/>`;
    } else if (kind === 'waterfall') {
      svg += `<path d="M0,${horizon + 30} L360,${horizon - 60} L560,${horizon + 10} L640,900 L0,900 Z" fill="${c.deep}" opacity="0.95"/>`;
      svg += `<path d="M1180,900 L1260,${horizon - 80} L1420,${horizon + 20} L1600,900 Z" fill="${c.deep}" opacity="0.95"/>`;
      svg += `<path d="M720,${horizon - 120} L880,${horizon - 130} L930,900 L670,900 Z" fill="#e8f7f2" opacity="0.9"/>`;
      svg += `<path d="M735,${horizon - 110} L865,${horizon - 118} L900,860 L700,860 Z" fill="#ffffff" opacity="0.45" class="water-shine"/>`;
      svg += `<ellipse cx="800" cy="860" rx="220" ry="40" fill="#fff" opacity="0.35" filter="url(#blur${id})"/>`;
    } else if (kind === 'lake' || kind === 'lagoon' || kind === 'river') {
      svg += `<path d="M0,${horizon + 90} C300,${horizon + 40} 520,${horizon + 150} 800,${horizon + 110} C1100,${horizon + 60} 1320,${horizon + 140} 1600,${horizon + 100} L1600,900 L0,900 Z" fill="url(#water${id})"/>`;
      svg += boat(430, horizon + 190, 0.5, '#3a2a1f', '#c8794c');
      svg += boat(1180, horizon + 240, 0.45, '#3a2a1f', '#b55b42', -1);
      for (let i = 0; i < 3; i++) svg += stiltHouse(150 + i * 540, horizon + 130, 0.6, c.gold, c.deep);
    } else if (kind === 'wetland') {
      svg += `<rect x="0" y="${horizon + 40}" width="1600" height="${900 - horizon}" fill="url(#water${id})"/>`;
      for (let i = 0; i < 22; i++) {
        const x = rnd() * 1600, h = 50 + rnd() * 90;
        svg += `<path d="M${x},900 q${-12 + rnd() * 24},${-h * 0.6} ${-4 + rnd() * 8},${-h}" stroke="${c.deep}" stroke-width="3" fill="none" opacity="0.45"/>`;
      }
      for (let i = 0; i < 3; i++) svg += bird(300 + i * 400, 180 + rnd() * 80, 0.8, '#ffffff');
    } else if (kind === 'mountain' || kind === 'peak' || kind === 'pass' || kind === 'plateau' || kind === 'valley') {
      svg += softRidge(rnd, horizon + 120, 170, c.deep, 0.85);
      svg += softRidge(rnd, horizon + 240, 110, c.deep, 0.95);
      if (terrain === 'karst') {
        for (let i = 0; i < 4; i++) {
          svg += karst(230 + i * 380 + rnd() * 60, horizon + 190, 250 + rnd() * 110, 220 + rnd() * 170, c.deep, c.gold, 0.94);
        }
      } else {
        svg += softRidge(rnd, horizon + 60, 210, c.mid, 0.8);
      }
      for (let i = 0; i < 7; i++) {
        svg += pine(90 + i * 240 + rnd() * 40, horizon + 330 + rnd() * 40, 70 + rnd() * 70, '#0c2b22');
      }
      if (kind === 'peak') {
        svg += `<path d="M620,${horizon - 30} L800,${horizon - 330} L1010,${horizon - 20} Z" fill="#f1f6f3" opacity="0.9"/>`;
        svg += `<path d="M800,${horizon - 330} L860,${horizon - 180} L800,${horizon - 150} L740,${horizon - 170} Z" fill="#ffffff" opacity="0.7"/>`;
        svg += `<path d="M560,${horizon + 40} L760,${horizon - 150} L930,${horizon + 30} Z" fill="${c.mid}" opacity="0.5"/>`;
      }
      if (kind === 'pass') {
        svg += `<path d="M380,900 C520,700 620,620 780,600 C940,580 1040,520 1180,420" stroke="#e8c078" stroke-width="18" fill="none" opacity="0.8" stroke-linecap="round"/>`;
        svg += `<path d="M380,900 C520,700 620,620 780,600 C940,580 1040,520 1180,420" stroke="#8a5f3c" stroke-width="4" fill="none" opacity="0.6" stroke-dasharray="18 22"/>`;
      }
      if (kind === 'valley') {
        svg += `<path d="M0,${horizon + 320} Q400,${horizon + 240} 800,${horizon + 330} T1600,${horizon + 300} L1600,900 L0,900 Z" fill="#d9b56f" opacity="0.35"/>`;
        for (let i = 0; i < 5; i++) {
          svg += `<path d="M0,${horizon + 350 + i * 34} Q420,${horizon + 290 + i * 34} 820,${horizon + 370 + i * 34} T1600,${horizon + 340 + i * 34}" stroke="#f0d190" stroke-width="6" fill="none" opacity="0.28"/>`;
        }
        svg += stiltHouse(1080, horizon + 380, 0.8, c.gold, c.deep);
      }
      if (kind === 'plateau' || kind === 'terrace') {
        for (let i = 0; i < 7; i++) {
          svg += `<path d="M0,${horizon + 120 + i * 52} Q420,${horizon + 60 + i * 52} 830,${horizon + 150 + i * 52} T1600,${horizon + 110 + i * 52}" stroke="#e7c473" stroke-width="14" fill="none" opacity="${0.2 + i * 0.03}"/>`;
        }
      }
      svg += mistBand(id, horizon + 120, 80, 0.2);
    } else if (kind === 'terrace') {
      for (let i = 0; i < 9; i++) {
        svg += `<path d="M0,${horizon - 20 + i * 46} Q400,${horizon - 80 + i * 46} 800,${horizon + 10 + i * 46} T1600,${horizon - 30 + i * 46}" stroke="${i % 2 ? '#e8c777' : '#a9bf6e'}" stroke-width="20" fill="none" opacity="${0.25 + i * 0.04}"/>`;
      }
    } else if (kind === 'forest' || kind === 'garden' || kind === 'eco') {
      for (let i = 0; i < 18; i++) {
        const x = rnd() * 1600, base = horizon + 140 + rnd() * 200, h = 90 + rnd() * 120;
        svg += `<path d="M${x},${base} l${-h * 0.24},0 l${h * 0.24},${-h} l${h * 0.24},${h} Z" fill="${c.deep}" opacity="${0.35 + rnd() * 0.4}"/>`;
      }
      if (kind === 'garden') {
        for (let i = 0; i < 5; i++) {
          svg += `<path d="M0,${horizon + 300 + i * 34} Q400,${horizon + 260 + i * 34} 800,${horizon + 320 + i * 34} T1600,${horizon + 300 + i * 34}" stroke="#d9c27a" stroke-width="12" fill="none" opacity="0.3"/>`;
        }
      }
      svg += mistBand(id, horizon + 180, 100, 0.16);
    } else if (kind === 'desert') {
      svg += `<path d="M0,${horizon + 160} Q400,${horizon + 10} 800,${horizon + 120} Q1200,${horizon + 230} 1600,${horizon + 90} L1600,900 L0,900 Z" fill="#e9c98e"/>`;
      svg += `<path d="M0,${horizon + 340} Q420,${horizon + 180} 840,${horizon + 300} Q1220,${horizon + 410} 1600,${horizon + 270} L1600,900 L0,900 Z" fill="#d9b171" opacity="0.85"/>`;
      svg += `<ellipse cx="1080" cy="${horizon + 220}" rx="80" ry="10" fill="#b89356" opacity="0.4"/>`;
    } else if (kind === 'rockfield') {
      svg += `<rect x="0" y="${horizon + 60}" width="1600" height="${900 - horizon}" fill="#2f5f66"/>`;
      for (let r = 0; r < 5; r++) {
        for (let i = 0; i < 9; i++) {
          const x = 100 + i * 175 + (r % 2) * 50, y = horizon + 100 + r * 72;
          svg += `<path d="M${x},${y} l45,-26 l45,26 l0,52 l-45,26 l-45,-26 Z" fill="#3c7076" opacity="${0.55 + rnd() * 0.3}" stroke="#8fb8b3" stroke-width="3"/>`;
        }
      }
      svg += `<path d="M0,${horizon + 60} Q400,${horizon + 20} 800,${horizon + 70} T1600,${horizon + 40}" stroke="#ffffff" stroke-width="5" fill="none" opacity="0.3"/>`;
    } else if (kind === 'pagoda' || kind === 'temple') {
      const base = horizon + 70;
      svg += `<path d="M0,${horizon + 150} Q320,${horizon + 38} 760,${horizon + 78} T1600,${horizon + 54} L1600,900 L0,900 Z" fill="#1a4738" opacity="0.97"/>`;
      svg += `<path d="M0,${horizon + 250} Q420,${horizon + 168} 840,${horizon + 242} T1600,${horizon + 212} L1600,900 L0,900 Z" fill="#10332b"/>
        <path d="M0,${horizon + 300} Q420,${horizon + 240} 840,${horizon + 300} T1600,${horizon + 280} L1600,900 L0,900 Z" fill="#0b2822"/>`;
      svg += `<path d="M780,${base + 46} Q1020,${base + 8} 1290,${base + 44} L1360,${horizon + 300} L720,${horizon + 300} Z" fill="#c9b078" opacity="0.14"/>`;
      for (const [tx, th] of [[110, 100], [228, 78], [430, 112], [540, 84], [1370, 108], [1490, 86]]) {
        svg += pine(tx, horizon + 165 + rnd() * 30, th, '#0d3227');
      }
      if (kind === 'pagoda') {
        svg += pagoda(1080, base, 1.5, K.pagoda, '#f3ca74');
        svg += pagoda(305, base - 2, 0.92, K.pagoda, '#f3ca74');
        svg += `<path d="M1020,${base + 36} L1140,${base + 36}" stroke="#e8c274" stroke-width="5" opacity="0.4"/>`;
      } else {
        svg += `<rect x="930" y="${base - 24}" width="380" height="190" fill="${K.temple}"/>
          <path d="M900,${base - 18} L1120,${base - 116} L1340,${base - 18} Z" fill="${K.temple}"/>
          <path d="M900,${base - 18} L1120,${base - 116} L1340,${base - 18}" stroke="${c.gold}" stroke-width="8" fill="none"/>
          <rect x="1060" y="${base + 42}" width="120" height="120" fill="${c.deep}" opacity="0.82"/>
          <path d="M900,${base + 10} L1340,${base + 10}" stroke="${c.gold}" stroke-width="5" opacity="0.32"/>`;
      }
      for (let i = 0; i < 5; i++) {
        svg += `<path d="M${900 + i * 60},${base + 118 + i * 6} L${1280 - i * 20},${base + 118 + i * 6}" stroke="#e9c97c" stroke-width="4" opacity="${0.34 - i * 0.05}"/>`;
      }
      for (let i = 0; i < 3; i++) svg += `<circle cx="${920 + i * 120}" cy="${base + 62}" r="9" fill="#f6c56e" opacity="0.9" class="lantern"/>`;
    } else if (kind === 'church') {
      svg += `<path d="M0,${horizon + 200} Q400,${horizon + 120} 800,${horizon + 190} T1600,${horizon + 170} L1600,900 L0,900 Z" fill="${c.deep}" opacity="0.9"/>`;
      svg += `<path d="M1040,900 Q1100,${horizon + 280} 1136,${horizon + 300} Q1180,${horizon + 280} 1230,900 Z" fill="#d9c391" opacity="0.55"/>`;
      for (const [tx, th] of [[820, 120], [1420, 100], [700, 86], [1500, 128]]) {
        svg += pine(tx, horizon + 260, th, '#14392c');
      }
      svg += `<rect x="980" y="${horizon + 90}" width="300" height="180" fill="${K.church}"/>
        <path d="M960,${horizon + 96} L1130,${horizon - 20} L1300,${horizon + 96} Z" fill="${K.church}"/>
        <rect x="1090" y="${horizon - 190}" width="80" height="180" fill="${K.church}"/>
        <path d="M1070,${horizon - 180} L1130,${horizon - 270} L1190,${horizon - 180} Z" fill="${K.church}"/>
        <rect x="1122" y="${horizon - 320}" width="16" height="50" fill="${c.gold}"/>
        <rect x="1104" y="${horizon - 306}" width="52" height="14" fill="${c.gold}"/>
        <circle cx="1130" cy="${horizon + 20}" r="34" fill="${c.gold}" opacity="0.45"/>`;
    } else if (kind === 'citadel' || kind === 'tower' || kind === 'relic' || kind === 'museum' || kind === 'statue') {
      svg += `<path d="M0,${horizon + 200} Q400,${horizon + 120} 800,${horizon + 190} T1600,${horizon + 170} L1600,900 L0,900 Z" fill="${c.deep}" opacity="0.9"/>`;
      if (kind === 'tower') {
        for (let i = 0; i < 3; i++) {
          const x = 1040 + i * 130, base = horizon + 190, h = 190 - i * 25;
          svg += `<rect x="${x - 42}" y="${base - h}" width="84" height="${h}" fill="${K.tower}"/>
            <path d="M${x - 56},${base - h} L${x},${base - h - 46} L${x + 56},${base - h} Z" fill="${K.tower}"/>`;
        }
      } else if (kind === 'citadel') {
        svg += `<rect x="760" y="${horizon + 20}" width="420" height="170" fill="${K.citadel}"/>
          <path d="M740,${horizon + 26} L970,${horizon - 50} L1200,${horizon + 26} Z" fill="${K.citadel}"/>
          <rect x="880" y="${horizon + 100}" width="90" height="110" fill="#2b2a24" opacity="0.8"/>`;
      } else {
        svg += `<rect x="900" y="${horizon + 40}" width="360" height="160" fill="${K.relic}"/>
          <path d="M860,${horizon + 46} L1080,${horizon - 40} L1300,${horizon + 46} Z" fill="${K.relic}"/>
          <g fill="${c.gold}" opacity="0.5"><rect x="990" y="${horizon + 90}" width="36" height="110"/><rect x="1060" y="${horizon + 90}" width="36" height="110"/><rect x="1130" y="${horizon + 90}" width="36" height="110"/></g>`;
      }
    } else if (kind === 'city' || kind === 'town' || kind === 'theme') {
      for (let i = 0; i < 14; i++) {
        const x = 60 + i * 115, base = horizon + 210, h = 60 + rnd() * 190;
        svg += `<rect x="${x}" y="${base - h}" width="${70 + rnd() * 30}" height="${h}" fill="${c.deep}" opacity="${0.6 + rnd() * 0.3}"/>`;
        for (let j = 0; j < 4; j++) {
          if (rnd() > 0.45) svg += `<rect x="${x + 14 + (j % 2) * 30}" y="${base - h + 18 + Math.floor(j / 2) * 38}" width="14" height="18" fill="#f6cf86" opacity="0.7"/>`;
        }
      }
      if (kind === 'theme') {
        svg += `<circle cx="1240" cy="${horizon - 30}" r="130" fill="none" stroke="${c.gold}" stroke-width="8" opacity="0.75"/>
          <circle cx="1240" cy="${horizon - 30}" r="8" fill="${c.gold}"/>
          <path d="M1112,${horizon - 30} L1368,${horizon - 30} M1240,${horizon - 160} L1240,${horizon + 100} M1148,${horizon - 124} L1332,${horizon + 64} M1332,${horizon - 124} L1148,${horizon + 64}" stroke="${c.gold}" stroke-width="4" opacity="0.6"/>`;
      }
      svg += `<path d="M0,${horizon + 210} L1600,${horizon + 210}" stroke="#f6cf86" stroke-width="3" opacity="0.3"/>`;
    } else if (kind === 'bridge') {
      svg += `<path d="M0,${horizon + 160} Q400,${horizon + 40} 800,${horizon + 150} T1600,${horizon + 120} L1600,900 L0,900 Z" fill="url(#water${id})"/>`;
      svg += `<path d="M120,${horizon + 80} Q800,${horizon - 150} 1480,${horizon + 80}" stroke="#c95b45" stroke-width="26" fill="none"/>`;
      svg += `<path d="M120,${horizon + 80} Q800,${horizon - 150} 1480,${horizon + 80}" stroke="${c.gold}" stroke-width="4" fill="none" opacity="0.6"/>`;
      for (let i = 0; i < 9; i++) {
        const x = 170 + i * 160;
        svg += `<line x1="${x}" y1="${horizon + 120}" x2="${x}" y2="${horizon + 70}" stroke="#c95b45" stroke-width="6" opacity="0.8"/>`;
      }
    } else if (kind === 'market') {
      svg += `<rect x="0" y="${horizon + 100}" width="1600" height="${900 - horizon}" fill="url(#water${id})"/>`;
      svg += boat(520, horizon + 220, 1, '#6b4227', '#d8a85d');
      svg += boat(1080, horizon + 260, 0.9, '#6b4227', '#c0714b', -1);
      for (let i = 0; i < 6; i++) {
        const x = 300 + i * 190;
        svg += `<path d="M${x},${horizon + 130} q40,-46 80,0 Z" fill="${i % 2 ? '#d96b58' : '#e6bb68'}" opacity="0.9"/>`;
        svg += `<rect x="${x + 36}" y="${horizon + 130}" width="6" height="40" fill="#4a3224"/>`;
      }
    } else if (kind === 'village' || kind === 'fishing-village' || kind === 'craft') {
      svg += `<path d="M0,${horizon + 150} Q400,${horizon + 96} 800,${horizon + 148} T1600,${horizon + 128} L1600,900 L0,900 Z" fill="#8f9a5e" opacity="0.72"/>`;
      svg += `<path d="M0,${horizon + 230} Q400,${horizon + 178} 800,${horizon + 232} T1600,${horizon + 212} L1600,900 L0,900 Z" fill="${c.deep}" opacity="0.92"/>`;
      for (let i = 0; i < 4; i++) svg += stiltHouse(230 + i * 330 + rnd() * 40, horizon + 196, 1.3 + rnd() * 0.2, c.gold, '#3b2a20');
      for (let i = 0; i < 3; i++) svg += palm(70 + i * 700 + rnd() * 90, horizon + 250, 1.15 + rnd() * 0.35, '#2f6b45', c.deep);
      if (kind === 'fishing-village') svg += boat(1220, horizon + 200, 0.6, '#3a2a1f', '#b55b42');
      if (kind === 'craft') {
        svg += `<ellipse cx="1280" cy="${horizon + 210}" rx="96" ry="48" fill="#7b4b33"/><ellipse cx="1280" cy="${horizon + 196}" rx="70" ry="32" fill="#d8734b"/>`;
        svg += `<path d="M1280,${horizon + 196} q-24,-40 0,-80 q24,40 0,80" fill="#f4d9a0" opacity="0.7"/>`;
      }
      svg += `<path d="M0,${horizon + 262} Q400,${horizon + 214} 800,${horizon + 272} T1600,${horizon + 240}" stroke="#e9c274" stroke-width="9" fill="none" opacity="0.34"/>`;
      for (let i = 0; i < 3; i++) {
        svg += `<path d="M${300 + i * 330},${horizon + 190} q-14,-40 4,-74 q16,-24 6,-52" stroke="#f6f1e4" stroke-width="7" fill="none" opacity="0.16" stroke-linecap="round"/>`;
      }
    } else if (kind === 'lighthouse') {
      svg += `<rect x="0" y="${horizon + 80}" width="1600" height="${900 - horizon}" fill="url(#water${id})"/>`;
      svg += `<path d="M980,${horizon + 150} Q1050,${horizon + 76} 1153,${horizon + 86} Q1250,${horizon + 80} 1330,${horizon + 160} L1380,900 L940,900 Z" fill="#2b4a42"/>`;
      svg += `<path d="M980,${horizon + 150} Q1050,${horizon + 76} 1153,${horizon + 86} Q1250,${horizon + 80} 1330,${horizon + 160}" stroke="#e9d6a2" stroke-width="6" fill="none" opacity="0.4"/>`;
      svg += `<rect x="1130" y="${horizon - 130}" width="46" height="230" fill="#f6efdd"/><rect x="1118" y="${horizon - 150}" width="70" height="24" fill="#c95b45"/>
        <rect x="1126" y="${horizon - 190}" width="54" height="42" fill="#f6efdd"/><path d="M1118,${horizon - 190} L1153,${horizon - 220} L1188,${horizon - 190} Z" fill="#c95b45"/>
        <rect x="1126" y="${horizon - 196}" width="54" height="10" fill="#8a3f2f" opacity="0.6"/>
        <path d="M1153,${horizon - 210} L900,${horizon - 120} L1153,${horizon - 150} Z" fill="#ffe9b0" opacity="0.22"/>`;
      for (let i = 0; i < 9; i++) {
        const x = 860 + rnd() * 620, y = horizon + 200 + rnd() * 260, w = 60 + rnd() * 140;
        svg += `<rect x="${x}" y="${y}" width="${w}" height="3" rx="1.5" fill="#ffffff" opacity="${0.12 + rnd() * 0.16}" class="water-shine"/>`;
      }
      for (let i = 0; i < 3; i++) svg += bird(880 + i * 90, 210 + i * 26, 0.7, sky.ink);
    } else if (kind === 'spring' || kind === 'hotspring') {
      svg += `<path d="M0,${horizon + 220} Q400,${horizon + 150} 800,${horizon + 230} T1600,${horizon + 200} L1600,900 L0,900 Z" fill="${c.deep}" opacity="0.9"/>`;
      svg += `<path d="M300,900 C380,700 520,660 700,680 C880,700 980,600 1120,520" stroke="#dff6ef" stroke-width="46" fill="none" opacity="0.65"/>`;
      if (kind === 'hotspring') for (let i = 0; i < 5; i++) svg += `<path d="M${420 + i * 130},${horizon + 120} q-30,-60 0,-120 q30,-60 0,-120" stroke="#ffffff" stroke-width="10" fill="none" opacity="0.18"/>`;
    } else if (kind === 'field') {
      svg += `<path d="M0,${horizon + 100} Q400,${horizon + 30} 800,${horizon + 110} T1600,${horizon + 84} L1600,900 L0,900 Z" fill="#d8b96b"/>`;
      svg += `<path d="M0,${horizon + 210} Q400,${horizon + 140} 800,${horizon + 220} T1600,${horizon + 190} L1600,900 L0,900 Z" fill="#c9a955"/>`;
      for (let i = 0; i < 10; i++) {
        svg += `<path d="M0,${horizon + 120 + i * 38} Q420,${horizon + 58 + i * 38} 820,${horizon + 140 + i * 38} T1600,${horizon + 110 + i * 38}" stroke="#efd78e" stroke-width="13" fill="none" opacity="${0.24 + i * 0.012}"/>`;
      }
      svg += stiltHouse(1160, horizon + 300, 1, c.gold, c.deep);
      svg += palm(180, horizon + 330, 1.4, '#2f6b45', '#123b2c');
      svg += palm(1460, horizon + 340, 1.2, '#2f6b45', '#123b2c');
      for (let i = 0; i < 6; i++) {
        svg += `<path d="M${620 + i * 90},${horizon + 300 + rnd() * 50} l0,${-22 - rnd() * 16}" stroke="#8a6a2f" stroke-width="5" opacity="0.4" stroke-linecap="round"/>`;
      }
      for (let i = 0; i < 4; i++) {
        const x = 420 + i * 260 + rnd() * 50, y = horizon + 250 + rnd() * 40;
        svg += `<path d="M${x - 30},${y} Q${x},${y - 62} ${x + 30},${y} Z" fill="#e6c273"/><path d="M${x - 6},${y - 58} l0,-18" stroke="#b58d44" stroke-width="4"/>`;
      }
    } else {
      svg += `<path d="M0,${horizon + 200} Q400,${horizon + 120} 800,${horizon + 210} T1600,${horizon + 180} L1600,900 L0,900 Z" fill="${c.deep}" opacity="0.88"/>`;
      svg += pagoda(1080, horizon + 200, 0.9, K.relic, '#f0c66f');
    }

    const mid = terrainSvg + `<g class="scene-struct" filter="url(#depth${id})">${svg}</g>`;
    svg = '';

    // tiền cảnh: tạo chiều sâu diorama
    if (hasWater) {
      svg += `<path d="M-40,900 L-40,846 Q300,828 620,850 T1240,846 Q1420,840 1640,852 L1640,900 Z" fill="#041b1c" opacity="0.82"/>`;
      for (let i = 0; i < (compact ? 4 : 12); i++) {
        const x = rnd() * 1600, y = 858 + rnd() * 34, w = 34 + rnd() * 120;
        svg += `<rect x="${x - 30}" y="${y}" width="${w}" height="2.4" fill="#9fd7c8" opacity="${0.08 + rnd() * 0.12}" class="water-shine"/>`;
      }
      for (let i = 0; i < (compact ? 4 : 10); i++) {
        const x = 40 + rnd() * 1520;
        svg += reed(x, 900, 50 + rnd() * 100, -16 + rnd() * 32, c.deep, 0.5);
      }
    } else if (kind !== 'desert' && kind !== 'rockfield') {
      svg += `<path d="M-40,900 L-40,842 C240,806 430,860 690,840 C960,818 1180,862 1640,838 L1640,900 Z" fill="#041713" opacity="0.88"/>`;
      for (let i = 0; i < (compact ? 6 : 24); i++) {
        const x = rnd() * 1600, y = 826 + rnd() * 66, h = 14 + rnd() * 34;
        svg += `<path d="M${x},${y} q${-6 + rnd() * 12},${-h * 0.6} ${-4 + rnd() * 8},${-h}" stroke="${c.gold}" stroke-width="2" fill="none" opacity="${0.2 + rnd() * 0.22}"/>`;
      }
    }
    if (kind !== 'desert' && kind !== 'rockfield') {
      svg += frond(66, 908, compact ? 1.1 : 1.65, 1, '#031511', 0.9);
      svg += frond(1534, 908, compact ? 1 : 1.5, -1, '#031511', 0.88);
      if (!compact) {
        svg += frond(250, 916, 0.8, 1, '#062019', 0.7);
        svg += frond(1360, 918, 0.72, -1, '#062019', 0.66);
      }
    }
    if (place.region === 'Đồng bằng sông Cửu Long' || place.region === 'Đồng bằng Bắc Bộ') {
      for (let i = 0; i < (compact ? 2 : 5); i++) {
        const x = 120 + i * 330 + rnd() * 80, y = 850 + rnd() * 30;
        svg += `<g opacity="0.75"><ellipse cx="${x}" cy="${y}" rx="16" ry="6" fill="#f39ab5"/><ellipse cx="${x - 12}" cy="${y + 3}" rx="12" ry="5" fill="#f7b7c9"/><ellipse cx="${x + 12}" cy="${y + 3}" rx="12" ry="5" fill="#f7b7c9"/></g>`;
      }
    }
    if (!compact && kind !== 'desert' && kind !== 'rockfield' && place.region !== 'Miền núi phía Bắc') {
      svg += motes(rnd, 14, '#ffe6a8');
    }
    svg += mistBand(id, 690, 90, 0.1);
    svg += `<rect x="-40" y="-40" width="1680" height="980" fill="url(#grade${id})" pointer-events="none"/>`;
    svg += `<rect x="-40" y="-40" width="1680" height="980" fill="url(#vig${id})" pointer-events="none"/>`;
    const near = svg;

    return `<svg xmlns="http://www.w3.org/2000/svg" class="scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Phong cảnh minh hoạ ${U.esc(place.name)}">
      ${defs}
      <rect x="-40" y="-40" width="1680" height="980" fill="${sky.c[0]}"/>
      <g class="scene-layer far">${far}</g>
      <g class="scene-layer mid">${mid}</g>
      <g class="scene-layer near">${near}</g>
    </svg>`;
  };

  const AREA_CACHE = new Map();

  S.area = function (place) {
    const lang = window.I18N ? I18N.code() : 'vi';
    const key = place.id + '|' + lang;
    if (AREA_CACHE.has(key)) return AREA_CACHE.get(key);

    const rnd = U.rng(U.hash(place.id + '|park'));
    const c = REGION_COLORS[place.region] || REGION_COLORS['Đồng bằng Bắc Bộ'];
    const id = U.hash(place.id + '|park') % 99999;
    const sky = SKIES.day[U.hash(place.id) % SKIES.day.length];
    const northern = place.region === 'Miền núi phía Bắc';
    const gateLabel = U.esc((window.I18N && I18N.t('tour.areaGate')) || 'KHU DU LỊCH');
    const ariaLabel = U.esc((window.I18N && I18N.t('tour.areaAria', { place: place.name })) || place.name);

    const defs = `<defs>
      <linearGradient id="skyAr${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${sky.c[0]}"/>
        <stop offset="0.45" stop-color="${sky.c[1]}"/>
        <stop offset="0.78" stop-color="${sky.c[2]}"/>
        <stop offset="1" stop-color="${sky.c[3]}"/>
      </linearGradient>
      <linearGradient id="lawnAr${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#6ba273"/>
        <stop offset="0.4" stop-color="#3f7d55"/>
        <stop offset="1" stop-color="#1e4d36"/>
      </linearGradient>
      <linearGradient id="pathAr${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#d9c294"/>
        <stop offset="1" stop-color="#b8955f"/>
      </linearGradient>
      <linearGradient id="waterAr${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8fcdc2"/>
        <stop offset="0.55" stop-color="#4f9c92"/>
        <stop offset="1" stop-color="#2b6f6a"/>
      </linearGradient>
      <radialGradient id="glowAr${id}">
        <stop offset="0" stop-color="${sky.glow}" stop-opacity=".95"/>
        <stop offset="0.45" stop-color="${sky.glow}" stop-opacity=".32"/>
        <stop offset="1" stop-color="${sky.glow}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="fadeAr${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#08201c" stop-opacity="0"/>
        <stop offset="1" stop-color="#06201a" stop-opacity=".5"/>
      </linearGradient>
      <radialGradient id="vigAr${id}" cx="0.5" cy="0.5" r="0.78">
        <stop offset="0" stop-color="#02100d" stop-opacity="0"/>
        <stop offset="0.68" stop-color="#02100d" stop-opacity="0"/>
        <stop offset="1" stop-color="#02100d" stop-opacity=".34"/>
      </radialGradient>
    </defs>`;

    const sunX = 280 + rnd() * 900;
    const sunY = 118 + rnd() * 58;
    let far = `<rect width="1600" height="1000" fill="url(#skyAr${id})"/>
      <circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="170" fill="url(#glowAr${id})"/>
      <circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="33" fill="${sky.sun}" opacity=".98"/>
      <circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="52" fill="${sky.sun}" opacity=".15"/>`;
    for (let i = 0; i < 5; i++) {
      const cx = rnd() * 1600, cy = 58 + rnd() * 190, s = 0.62 + rnd() * 1.05;
      far += `<g class="cloud" opacity="${(sky.cloud * (0.5 + rnd() * 0.45)).toFixed(2)}">
        <ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(150 * s).toFixed(1)}" ry="${(25 * s).toFixed(1)}" fill="#fff"/>
        <ellipse cx="${(cx + 66 * s).toFixed(1)}" cy="${(cy - 13 * s).toFixed(1)}" rx="${(90 * s).toFixed(1)}" ry="${(21 * s).toFixed(1)}" fill="#fff"/>
        <ellipse cx="${(cx - 74 * s).toFixed(1)}" cy="${(cy + 6 * s).toFixed(1)}" rx="${(70 * s).toFixed(1)}" ry="${(15 * s).toFixed(1)}" fill="#fff" opacity=".75"/>
      </g>`;
    }
    far += softRidge(rnd, 400, 110, sky.c[2], 0.4);
    if (northern) {
      for (let i = 0; i < 5; i++) far += karst(130 + i * 320 + rnd() * 80, 432, 160 + rnd() * 80, 150 + rnd() * 170, c.mid, c.soft, 0.5);
    } else {
      far += softRidge(rnd, 442, 150, c.mid, 0.46);
    }
    far += ridge(rnd, 488, 70, c.deep, 0.42, 0.8);

    let mid = `<path d="M0,520 C280,494 520,530 800,516 C1090,500 1320,534 1600,512 L1600,1000 L0,1000 Z" fill="url(#lawnAr${id})"/>`;
    for (let i = 0; i < 7; i++) {
      const x = 40 + i * 240 + rnd() * 60, y = 528 + rnd() * 18, s = 0.6 + rnd() * 0.5;
      mid += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(58 * s).toFixed(1)}" ry="${(34 * s).toFixed(1)}" fill="${c.deep}" opacity=".22"/>`;
    }

    const pondX = 240, pondY = 828;
    mid += `<g>
      <ellipse cx="${pondX}" cy="${pondY}" rx="176" ry="58" fill="#2b5a41"/>
      <ellipse cx="${pondX}" cy="${pondY}" rx="168" ry="52" fill="url(#waterAr${id})"/>
      <ellipse cx="${pondX}" cy="${pondY}" rx="168" ry="52" fill="none" stroke="#cdb27a" stroke-width="5" opacity=".55"/>
      ${Array.from({ length: 9 }, () => {
        const a = rnd() * Math.PI * 2, r = 24 + rnd() * 92;
        const lx = pondX + Math.cos(a) * r, ly = pondY + Math.sin(a) * r * 0.5;
        return `<ellipse cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" rx="${(11 + rnd() * 8).toFixed(1)}" ry="${(5 + rnd() * 3.5).toFixed(1)}" fill="#2f7a52" opacity=".88"/>`;
      }).join('')}
      ${Array.from({ length: 4 }, (_, i) => {
        const a = (i / 4) * Math.PI * 2 + rnd() * 0.6, r = 40 + rnd() * 60;
        const lx = pondX + Math.cos(a) * r, ly = pondY + Math.sin(a) * r * 0.5;
        return `<g><ellipse cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" rx="7" ry="4" fill="#f2a6bc"/><ellipse cx="${lx.toFixed(1)}" cy="${(ly - 3).toFixed(1)}" rx="4" ry="4.4" fill="#f7c1d0"/><circle cx="${lx.toFixed(1)}" cy="${(ly - 2).toFixed(1)}" r="1.7" fill="#f8e6a1"/></g>`;
      }).join('')}
    </g>`;

    mid += `<g>
      <path d="M80 848 Q250 786 420 848 L420 862 Q250 802 80 862 Z" fill="#7f5330"/>
      <path d="M80 846 Q250 782 420 846" stroke="#9a6a3d" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M80 828 Q250 720 420 828" stroke="#8a5f38" stroke-width="3.4" fill="none" opacity=".9"/>
      ${[0.1, 0.28, 0.5, 0.72, 0.9].map((t) => {
        const x = 80 + t * 340;
        const dy = 846 - 216 * t * (1 - t);
        return `<rect x="${(x - 1.6).toFixed(1)}" y="${(dy - 18).toFixed(1)}" width="3.2" height="18" fill="#6b4426"/>`;
      }).join('')}
    </g>`;

    const gateY = 648;
    mid += `<path d="M686 ${gateY} L914 ${gateY} L1296 1000 L304 1000 Z" fill="url(#pathAr${id})"/>
      <path d="M686 ${gateY} L304 1000" stroke="#c9a86e" stroke-width="6" opacity=".5"/>
      <path d="M914 ${gateY} L1296 1000" stroke="#c9a86e" stroke-width="6" opacity=".5"/>`;
    for (let i = 1; i <= 5; i++) {
      const t = i / 6, y = gateY + t * (1000 - gateY);
      const lx = 686 - t * 382, rx = 914 + t * 382;
      mid += `<path d="M${lx.toFixed(1)} ${y.toFixed(1)} Q800 ${(y + 5).toFixed(1)} ${rx.toFixed(1)} ${y.toFixed(1)}" stroke="#c4a06a" stroke-width="${(1.4 + t * 1.6).toFixed(1)}" fill="none" opacity="${(0.55 - t * 0.16).toFixed(2)}"/>`;
    }
    for (let i = 0; i < 26; i++) {
      const t = rnd(), y = gateY + t * 352;
      const lx = 686 - t * 382, rx = 914 + t * 382;
      mid += `<circle cx="${(lx + rnd() * (rx - lx)).toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.8 + t * 1.4).toFixed(1)}" fill="#a98a5b" opacity=".3"/>`;
    }

    const tree = (x, base, s, leaf, dark, accent) => `<g>
      <ellipse cx="${x}" cy="${base + 2}" rx="${(44 * s).toFixed(1)}" ry="${(9 * s).toFixed(1)}" fill="#0d241a" opacity=".18"/>
      <path d="M${x} ${base} C${(x - 10 * s).toFixed(1)} ${(base - 52 * s).toFixed(1)} ${(x + 8 * s).toFixed(1)} ${(base - 100 * s).toFixed(1)} ${(x - 4 * s).toFixed(1)} ${(base - 140 * s).toFixed(1)}" stroke="${dark}" stroke-width="${(12 * s).toFixed(1)}" fill="none" stroke-linecap="round"/>
      <g fill="${leaf}">
        <ellipse cx="${(x - 34 * s).toFixed(1)}" cy="${(base - 138 * s).toFixed(1)}" rx="${(38 * s).toFixed(1)}" ry="${(26 * s).toFixed(1)}"/>
        <ellipse cx="${(x + 30 * s).toFixed(1)}" cy="${(base - 146 * s).toFixed(1)}" rx="${(42 * s).toFixed(1)}" ry="${(28 * s).toFixed(1)}"/>
        <ellipse cx="${(x - 2 * s).toFixed(1)}" cy="${(base - 166 * s).toFixed(1)}" rx="${(46 * s).toFixed(1)}" ry="${(30 * s).toFixed(1)}"/>
        <ellipse cx="${(x + 52 * s).toFixed(1)}" cy="${(base - 122 * s).toFixed(1)}" rx="${(30 * s).toFixed(1)}" ry="${(22 * s).toFixed(1)}"/>
        <ellipse cx="${(x - 58 * s).toFixed(1)}" cy="${(base - 118 * s).toFixed(1)}" rx="${(28 * s).toFixed(1)}" ry="${(21 * s).toFixed(1)}"/>
      </g>
      <g fill="${accent}" opacity=".55">
        <circle cx="${(x - 22 * s).toFixed(1)}" cy="${(base - 158 * s).toFixed(1)}" r="${(9 * s).toFixed(1)}"/>
        <circle cx="${(x + 18 * s).toFixed(1)}" cy="${(base - 172 * s).toFixed(1)}" r="${(8 * s).toFixed(1)}"/>
      </g>
    </g>`;
    mid += tree(148, 700, 1.15, '#2f7a4e', '#4a3324', '#4f9c68');
    mid += tree(1478, 742, 1.05, '#2c7247', '#4a3324', '#4f9c68');
    mid += tree(626, 596, 0.72, '#357f52', '#4a3324', '#5da875');
    mid += tree(986, 588, 0.68, '#357f52', '#4a3324', '#5da875');
    mid += palm(56, 742, 0.95, '#2f6b45', c.deep);
    mid += palm(1552, 760, 1.0, '#2f6b45', c.deep);

    mid += `<g>
      <ellipse cx="800" cy="652" rx="182" ry="16" fill="#0d241a" opacity=".16"/>
      <rect x="679" y="470" width="34" height="178" fill="#a9774a"/>
      <rect x="887" y="470" width="34" height="178" fill="#a9774a"/>
      <rect x="675" y="462" width="42" height="12" rx="3" fill="#8a5f38"/>
      <rect x="883" y="462" width="42" height="12" rx="3" fill="#8a5f38"/>
      <rect x="675" y="634" width="42" height="14" rx="3" fill="#8a5f38"/>
      <rect x="883" y="634" width="42" height="14" rx="3" fill="#8a5f38"/>
      <path d="M596 470 Q800 394 1004 470 L1004 494 Q800 426 596 494 Z" fill="#a2412f"/>
      <path d="M596 470 Q800 394 1004 470" stroke="#bf5140" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M648 460 Q800 408 952 460" stroke="#7f2f26" stroke-width="3" fill="none" opacity=".5"/>
      <path d="M596 470q-20-14-34-3 16-1 24 10z" fill="#a2412f"/>
      <path d="M1004 470q20-14 34-3-16-1-24 10z" fill="#a2412f"/>
      <rect x="720" y="500" width="160" height="46" rx="6" fill="#7c2b22" stroke="#e8c479" stroke-width="2.5"/>
      <text x="800" y="530" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="15" letter-spacing="1.6" fill="#f4d892">${gateLabel}</text>
      <rect x="661" y="504" width="26" height="68" rx="4" fill="#c33d31"/>
      <rect x="913" y="504" width="26" height="68" rx="4" fill="#c33d31"/>
      <path d="M668 572l6 12 6-12zM920 572l6 12 6-12z" fill="#e8c479" opacity=".8"/>
    </g>`;

    const kiosk = (x, base, w, accent) => {
      const top = base - 74;
      let out = `<g>
        <ellipse cx="${x}" cy="${base + 4}" rx="${(w * 0.66).toFixed(1)}" ry="10" fill="#0d241a" opacity=".18"/>
        <rect x="${(x - w / 2).toFixed(1)}" y="${top}" width="${w}" height="74" fill="#f3e6c8"/>
        <rect x="${(x - w / 2).toFixed(1)}" y="${base - 30}" width="${w}" height="30" fill="#b98a55"/>
        <rect x="${(x - w / 2).toFixed(1)}" y="${base - 30}" width="${w}" height="4" fill="#8a5f38"/>
        <rect x="${(x - w * 0.34).toFixed(1)}" y="${base - 62}" width="${(w * 0.68).toFixed(1)}" height="28" rx="3" fill="#7a4f2a" opacity=".35"/>`;
      for (let i = 0; i < 5; i++) {
        const x0 = x - w / 2 - 10 + i * (w + 20) / 5;
        const x1 = x0 + (w + 20) / 5;
        out += `<path d="M${x0.toFixed(1)} ${top - 20} L${x1.toFixed(1)} ${top - 20} L${(x1 + 3).toFixed(1)} ${top} L${(x0 + 3).toFixed(1)} ${top} Z" fill="${i % 2 ? accent : '#f8efd8'}"/>`;
      }
      out += `<rect x="${(x - w / 2 - 12).toFixed(1)}" y="${top - 26}" width="${w + 24}" height="8" rx="4" fill="${accent}"/>`;
      out += `<circle cx="${(x - w * 0.22).toFixed(1)}" cy="${base - 38}" r="7" fill="#e07a4f"/><circle cx="${(x - w * 0.06).toFixed(1)}" cy="${base - 38}" r="7" fill="#e8b84f"/><circle cx="${(x + w * 0.1).toFixed(1)}" cy="${base - 38}" r="7" fill="#c2557a"/><circle cx="${(x + w * 0.26).toFixed(1)}" cy="${base - 38}" r="7" fill="#5b8c4f"/>`;
      out += `${[-0.3, 0.3].map((d) => `<path d="M${(x + d * w).toFixed(1)} ${top} l-8 13 q8 2.6 16 0 z" fill="#e8cf94" stroke="#c9a961" stroke-width="1"/>`).join('')}`;
      return out + '</g>';
    };
    mid += kiosk(196, 706, 132, '#c33d31');
    mid += kiosk(1164, 708, 128, '#1f7a6b');

    const cafe = (x, base, s, accent) => `<g>
      <ellipse cx="${x}" cy="${base}" rx="${(40 * s).toFixed(1)}" ry="${(7 * s).toFixed(1)}" fill="#0d241a" opacity=".16"/>
      <rect x="${(x - 1.6 * s).toFixed(1)}" y="${(base - 66 * s).toFixed(1)}" width="${(3.2 * s).toFixed(1)}" height="${(66 * s).toFixed(1)}" fill="#8a5f38"/>
      <path d="M${(x - 48 * s).toFixed(1)} ${(base - 58 * s).toFixed(1)} Q${x} ${(base - 96 * s).toFixed(1)} ${(x + 48 * s).toFixed(1)} ${(base - 58 * s).toFixed(1)} Q${(x + 24 * s).toFixed(1)} ${(base - 52 * s).toFixed(1)} ${x} ${(base - 57 * s).toFixed(1)} Q${(x - 24 * s).toFixed(1)} ${(base - 52 * s).toFixed(1)} ${(x - 48 * s).toFixed(1)} ${(base - 58 * s).toFixed(1)} Z" fill="${accent}"/>
      <path d="M${x} ${(base - 57 * s).toFixed(1)} L${x} ${(base - 90 * s).toFixed(1)}" stroke="#f8efd8" stroke-width="${(1.8 * s).toFixed(1)}" opacity=".75"/>
      <ellipse cx="${x}" cy="${(base - 34 * s).toFixed(1)}" rx="${(22 * s).toFixed(1)}" ry="${(6.5 * s).toFixed(1)}" fill="#f3e6c8"/>
      <rect x="${x - 2}" y="${(base - 34 * s).toFixed(1)}" width="4" height="${(34 * s).toFixed(1)}" fill="#8a5f38"/>
      <ellipse cx="${(x - 34 * s).toFixed(1)}" cy="${(base - 6 * s).toFixed(1)}" rx="${(11 * s).toFixed(1)}" ry="${(5 * s).toFixed(1)}" fill="#8a5f38"/>
      <ellipse cx="${(x + 34 * s).toFixed(1)}" cy="${(base - 6 * s).toFixed(1)}" rx="${(11 * s).toFixed(1)}" ry="${(5 * s).toFixed(1)}" fill="#8a5f38"/>
    </g>`;
    mid += cafe(1402, 812, 1, '#c33d31');
    mid += cafe(1330, 736, 0.7, '#e0a33a');

    const bench = (x, y, s, flip = 1) => `<g transform="translate(${x},${y}) scale(${(s * flip).toFixed(2)},${s})">
      <ellipse cx="0" cy="2" rx="36" ry="5" fill="#0d241a" opacity=".18"/>
      <rect x="-34" y="-30" width="68" height="6" rx="3" fill="#9a6a3d"/>
      <rect x="-34" y="-14" width="68" height="7" rx="3" fill="#8a5f38"/>
      <rect x="-30" y="-7" width="5" height="12" fill="#5c3f27"/>
      <rect x="25" y="-7" width="5" height="12" fill="#5c3f27"/>
      <rect x="-30" y="-30" width="4" height="19" fill="#5c3f27"/>
      <rect x="26" y="-30" width="4" height="19" fill="#5c3f27"/>
    </g>`;
    mid += bench(280, 942, 1.1, -1);
    mid += bench(1246, 884, 1, 1);

    mid += `<g>
      <ellipse cx="492" cy="768" rx="86" ry="10" fill="#0d241a" opacity=".16"/>
      <rect x="432" y="676" width="8" height="92" rx="3" fill="#8a5f38"/>
      <rect x="544" y="676" width="8" height="92" rx="3" fill="#8a5f38"/>
      <rect x="420" y="652" width="144" height="70" rx="16" fill="#f6ead0" stroke="#f0c97c" stroke-width="8"/>
      <rect x="420" y="652" width="144" height="70" rx="16" fill="none" stroke="#c98f3f" stroke-width="1.6" opacity=".6"/>
      <text x="492" y="681" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="9.5" letter-spacing="2" fill="#a9774a">CHECK-IN</text>
      <path d="M492 703c-9-11-23-3.5-23 6 0 9 12.5 15 23 21 10.5-6 23-12 23-21 0-9.5-14-17-23-6z" fill="#d9483f" opacity=".9"/>
    </g>`;

    mid += `<g transform="translate(1040,700)">
      <ellipse cx="0" cy="2" rx="14" ry="4" fill="#0d241a" opacity=".18"/>
      <rect x="-3" y="-72" width="6" height="74" fill="#6b4a2a"/>
      <path d="M-2 -70h58l9 9-9 9H-2z" fill="#a9774a"/>
      <path d="M2 -52H-56l-9 9 9 9H2z" fill="#b98a55"/>
      <path d="M34 -64l14 3-14 3z" fill="#f8efd8"/>
      <path d="M-34 -46l-14 3 14 3z" fill="#f8efd8"/>
    </g>`;

    const lanterns = (x1, y1, x2, y2, sag, n) => {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + sag;
      let out = `<path d="M${x1} ${y1} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2} ${y2}" stroke="#5c4630" stroke-width="2.5" fill="none" opacity=".8"/>`;
      for (let i = 1; i < n; i++) {
        const t = i / n;
        const x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
        const y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;
        const col = i % 3 === 0 ? '#f2c75c' : '#d9483f';
        out += `<g>
          <circle cx="${x.toFixed(1)}" cy="${(y + 13).toFixed(1)}" r="16" fill="#ffd98a" opacity=".14"/>
          <rect x="${(x - 6).toFixed(1)}" y="${y.toFixed(1)}" width="12" height="17" rx="5.5" fill="${col}"/>
          <rect x="${(x - 6).toFixed(1)}" y="${y.toFixed(1)}" width="12" height="3.5" rx="1.7" fill="#f6e2a9"/>
          <path d="M${x.toFixed(1)} ${(y + 17).toFixed(1)}l0 6" stroke="#e8b84f" stroke-width="1.6"/>
          <rect x="${(x - 2.4).toFixed(1)}" y="${(y + 23).toFixed(1)}" width="4.8" height="3" rx="1.4" fill="#b8402f"/>
        </g>`;
      }
      return out;
    };
    mid += lanterns(196, 600, 616, 560, 58, 8);
    mid += lanterns(1404, 588, 1000, 556, 54, 8);

    const people = [];
    const addPerson = (x, y, s, pose = 'walk', flip = 1) => {
      people.push({ y, svg: areaPerson(x, y, s, areaLook(rnd), pose, flip) });
    };
    addPerson(864, 682, 0.95, 'guide', -1);
    addPerson(822, 690, 0.9, 'walk', 1);
    addPerson(790, 696, 0.86, 'stand', 1);
    addPerson(902, 692, 0.88, 'walk', -1);
    addPerson(936, 686, 0.82, 'stand', -1);
    addPerson(716, 664, 0.62, 'walk', 1);
    addPerson(742, 670, 0.6, 'walk', 1);
    addPerson(966, 666, 0.62, 'walk', -1);
    addPerson(318, 722, 0.78, 'stand', 1);
    addPerson(352, 728, 0.74, 'stand', -1);
    addPerson(250, 792, 0.5, 'walk', 1);
    addPerson(288, 790, 0.48, 'walk', 1);
    addPerson(492, 764, 0.86, 'stand', 1);
    addPerson(586, 800, 0.95, 'photo', -1);
    addPerson(700, 852, 1.02, 'walk', 1);
    addPerson(752, 862, 0.98, 'walk', 1);
    addPerson(728, 868, 0.66, 'walk', 1);
    addPerson(1046, 868, 1.08, 'walk', -1);
    addPerson(1088, 880, 1.04, 'walk', -1);
    addPerson(1318, 788, 0.88, 'stand', -1);
    addPerson(1226, 726, 0.72, 'photo', 1);
    addPerson(372, 934, 1.28, 'walk', 1);
    addPerson(420, 946, 1.22, 'walk', 1);
    addPerson(1168, 946, 1.24, 'walk', -1);

    people.push({
      y: 836,
      svg: `<g>
        <path d="M730 836 Q748 812 758 792" stroke="#5c4630" stroke-width="1.2" fill="none"/>
        <ellipse cx="758" cy="784" rx="10" ry="12" fill="#d9483f"/>
        <path d="M758 796l-3 5 6 0z" fill="#b8402f"/>
        <ellipse cx="754" cy="780" rx="3" ry="4" fill="#f2a6bc" opacity=".8"/>
      </g>`,
    });

    const peopleSvg = people.sort((a, b) => a.y - b.y).map((p) => p.svg).join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="area-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${ariaLabel}">
      ${defs}
      <g class="area-layer">${far}</g>
      <g class="area-layer">${mid}</g>
      <rect x="0" y="880" width="1600" height="120" fill="url(#fadeAr${id})"/>
      <g class="area-people">${peopleSvg}</g>
      <g class="area-near" opacity=".9">
        <path d="M0 1000V946c42-18 88-10 120 12 24 16 44 28 56 42z" fill="#123a2a"/>
        <path d="M1600 1000v-58c-44-14-90-6-120 14-24 16-44 28-56 44z" fill="#123a2a"/>
      </g>
      <rect width="1600" height="1000" fill="url(#vigAr${id})" pointer-events="none"/>
    </svg>`;

    if (AREA_CACHE.size > 12) AREA_CACHE.clear();
    AREA_CACHE.set(key, svg);
    return svg;
  };

  S.thumb = function (place) {
    const svg = S.render(place, { compact: true });
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };

  window.Scene = S;
})();
