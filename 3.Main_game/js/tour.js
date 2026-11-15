/* Sắc Việt – tour ảo: Mai dẫn người chơi check-in, xem văn hoá và ẩm thực */
(function () {
  const T = {};
  const { $, esc } = U;

  let cfg = null;
  let place = null;
  let stops = [];
  let step = 0;
  let lastFocused = null;
  let filmOn = false;
  let filmTimer = null;
  let panoOn = false;
  const FILM_MS = 4600;

  const state = () => cfg.getState();
  const displayName = () => String(state().name || '').trim() || I18N.t('tour.you');
  const today = () => I18N.date();

  function buildStops(p) {
    const n = displayName();
    const [s0, s1, s2] = I18N.spots(p.kind);
    const kind = I18N.kind(p.kind, p.kindLabel);
    const kindTitle = I18N.kindTitle(p.kind, p.kindLabel);
    const region = I18N.region(p.region);
    const date = today();
    const desc = I18N.placeStory(p);
    const creditOf = (src) => (src ? I18N.credit(cfg.media?.credit?.(src) || I18N.t('tour.defaultCredit')) : '');
    const shot = (src) => ({ img: src || '', credit: creditOf(src) });
    const clean = (e) => (e && e.img
      ? { img: e.img, credit: I18N.credit(e.credit || I18N.t('tour.defaultCredit')) }
      : null);

    const placePool = (cfg.media?.placeGallery?.(p) || []).map(clean).filter(Boolean);
    const provPool = (cfg.media?.provinceGallery?.(p) || []).map(clean).filter(Boolean);
    const cultureImg = cfg.media?.culture?.(p) || '';
    const foodImg = cfg.media?.food?.(p) || '';
    const placeImg = placePool[0]?.img || provPool[0]?.img || '';
    const prov = (i) => cfg.media?.province?.(p, i) || provPool[i]?.img || '';

    const pool = [];
    const add = (e) => {
      if (e && e.img && !pool.some((x) => x.img === e.img)) pool.push(e);
    };
    placePool.forEach(add);
    provPool.forEach(add);
    add(shot(cultureImg));
    add(shot(foodImg));
    if (!pool.length) add(shot(placeImg));

    const pick = (primary, offset) => {
      const out = [];
      const addTo = (e) => {
        if (e && e.img && !out.some((x) => x.img === e.img)) out.push(e);
      };
      addTo(shot(primary));
      const start = Math.max(0, pool.findIndex((x) => x.img === primary));
      for (let k = 0; out.length < 3 && k < pool.length * 2; k++) {
        addTo(pool[(start + offset + k) % pool.length]);
      }
      return out;
    };

    const first = pick(placeImg, 0);
    const second = pick(prov(1) || placeImg, 2);
    const third = pick(prov(2) || placeImg, 4);
    const culture = pick(cultureImg || prov(3) || placeImg, 6);
    const food = pick(foodImg || prov(4) || placeImg, 8);
    const primary = (shots) => shots[0] || { img: '', credit: '' };

    return [
      {
        ...primary(first), shots: first,
        kind: 'checkin', spot: 0, tag: I18N.t('tour.checkinTag'), stamp: I18N.t('tour.stampCheckin'),
        title: I18N.t('tour.stop1.title', { spot: s0 }),
        text: I18N.t('tour.stop1.text', { n, spot: s0, place: p.name, desc }),
        note: I18N.t('tour.stop1.note', { kind: kindTitle, province: p.province, date }),
      },
      {
        ...primary(second), shots: second,
        kind: 'checkin', spot: 1, tag: I18N.t('tour.checkinTag'), stamp: I18N.t('tour.stampCheckin'),
        title: I18N.t('tour.stop2.title', { spot: s1 }),
        text: I18N.t('tour.stop2.text', { spot0: s0, spot1: s1, place: p.name, kind, province: p.province, region, n }),
        note: I18N.t('tour.stop2.note', { n, province: p.province }),
      },
      {
        ...primary(third), shots: third,
        kind: 'checkin', spot: 2, tag: I18N.t('tour.checkinTag'), stamp: I18N.t('tour.stampCheckin'),
        title: I18N.t('tour.stop3.title', { spot: s2 }),
        text: I18N.t('tour.stop3.text', { spot: s2, place: p.name, n }),
        note: I18N.t('tour.stop3.note', { n, date }),
      },
      {
        ...primary(culture), shots: culture,
        kind: 'culture', spot: 1, tag: I18N.t('tour.cultureTag'), stamp: I18N.t('tour.stampCulture'),
        title: I18N.t('tour.culture.title'),
        text: I18N.t('tour.culture.text', { culture: p.culture, province: p.province, n }),
        note: I18N.t('tour.culture.note', { province: p.province }),
      },
      {
        ...primary(food), shots: food,
        kind: 'food', spot: 2, tag: I18N.t('tour.foodTag'), stamp: I18N.t('tour.stampFood'),
        title: I18N.t('tour.food.title'),
        text: I18N.t('tour.food.text', { n, specialty: p.specialty, province: p.province }),
        note: I18N.t('tour.food.note', { specialty: p.specialty }),
      },
    ];
  }

  const MOTES = [
    [9, 9.4, 0.9, 0, 18], [22, 12.2, 1.25, -2.6, -26], [34, 8.6, 1.05, -5.4, 30],
    [47, 11.4, 0.85, -1.4, -22], [59, 9.8, 1.35, -7.1, 26], [71, 13, 1.1, -3.8, -30],
    [82, 8.9, 0.95, -6.3, 22], [91, 10.6, 1.2, -8.6, -18],
  ];

  function tinyHtml() {
    return `
      <div class="tour-tiny" aria-hidden="true">
        <svg viewBox="0 0 64 96" focusable="false">
          <ellipse class="tiny-shadow" cx="32" cy="88.4" rx="14" ry="3.6"/>
          <g class="tiny-leg tiny-leg-a">
            <rect x="26.6" y="64" width="6.6" height="16" rx="3.3" fill="#ecc39d"/>
            <path d="M25.2 78h8.4v1.6a2.6 2.6 0 0 1-2.6 2.6h-3.2a2.6 2.6 0 0 1-2.6-2.6z" fill="#3b2a1e"/>
          </g>
          <g class="tiny-leg tiny-leg-b">
            <rect x="32.8" y="64" width="6.6" height="16" rx="3.3" fill="#f4cfa9"/>
            <path d="M31.4 78h8.4v1.6a2.6 2.6 0 0 1-2.6 2.6h-3.2a2.6 2.6 0 0 1-2.6-2.6z" fill="#33261d"/>
          </g>
          <g class="tiny-upper">
            <g class="tiny-pack">
              <rect x="12.5" y="46" width="13" height="24" rx="6.5" fill="#8a5a2f"/>
              <rect x="14.6" y="50.4" width="8.6" height="6" rx="2.2" fill="#c99a5e"/>
              <rect x="14.6" y="60.2" width="8.6" height="3.8" rx="1.9" fill="#6b421f"/>
            </g>
            <path d="M23.6 47.4q-2.6 5.2-2 11.2" fill="none" stroke="#6b421f" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M22 46.5q10-4.4 20 0l5.6 22.5q-15.6 4.8-31.2 0z" fill="#2f7f72"/>
            <path d="M36.6 47.1l5 21.3q-3.4 1.3-7 2L33 47.9z" fill="#25695f" opacity=".55"/>
            <path d="M22 46.5q10-4.4 20 0l.9 3.6q-10.9-4-21.8 0z" fill="#f6ecd4"/>
            <path d="M25.6 46.4q6.4 3.2 12.8 0l-.6 2.8q-5.8 2.8-11.6 0z" fill="#d9483f"/>
            <path d="M32 50.2l-4.5 6.3 1 1.9 3.5-4.6 3.5 4.6 1-1.9z" fill="#f0c97c"/>
            <path d="M17.6 59.4q14.4 4.4 28.8 0l1 5.1q-15.4 4.4-30.8 0z" fill="#e9c46f"/>
            <path d="M18.2 61.8q13.8 4.1 27.6 0" fill="none" stroke="#b98f3f" stroke-width=".95" opacity=".75"/>
            <path d="M23.6 48.8q-2 9.4 6.2 12.8" fill="none" stroke="#25695f" stroke-width="6.2" stroke-linecap="round"/>
            <path d="M40.4 48.8q2 9.4-6.2 12.8" fill="none" stroke="#25695f" stroke-width="6.2" stroke-linecap="round"/>
            <ellipse cx="29.8" cy="62.4" rx="3.2" ry="3.4" fill="#f6d3b3"/>
            <ellipse cx="34.2" cy="62.4" rx="3.2" ry="3.4" fill="#f6d3b3"/>
            <path d="M32 59.1v6.6" stroke="#dfae7f" stroke-width=".7" opacity=".85"/>
            <path d="M30.7 60.2v1.5M33.3 60.2v1.5" stroke="#d7a476" stroke-width=".6" stroke-linecap="round" opacity=".7"/>
            <circle cx="32" cy="30" r="17" fill="#f6d3b3"/>
            <path d="M15 30a17 17 0 0 1 34 0q-1.4-4.2-7-5.6-4.7 1.7-10 1.7t-10-1.7q-5.6 1.4-7 5.6z" fill="#3a2a22"/>
            <circle cx="26" cy="32.6" r="1.9" fill="#241c17"/>
            <circle cx="38" cy="32.6" r="1.9" fill="#241c17"/>
            <circle cx="26.6" cy="32" r=".7" fill="#fff" opacity=".85"/>
            <circle cx="38.6" cy="32" r=".7" fill="#fff" opacity=".85"/>
            <path d="M32 2.8 5.9 24.7q26.1 7.1 52.2 0z" fill="#e8cf94" stroke="#c9a961" stroke-width="1.2" stroke-linejoin="round"/>
            <ellipse cx="32" cy="24.4" rx="26.1" ry="5" fill="#d9ba76"/>
            <path d="M32 4.6v19" stroke="#f6e6b8" stroke-width="1.1" opacity=".7"/>
          </g>
        </svg>
      </div>
    `;
  }

  const CROWD_LOOKS = [
    { robe: '#8fb6dc', robeDark: '#6e97c1', sash: '#e9c46f', trim: '#fbf1d8', skin: '#f2c9a0', hair: '#241c17', cap: '#7aa7cf' },
    { robe: '#b9d0e6', robeDark: '#93b2cf', sash: '#e3b969', trim: '#fffaf0', skin: '#f6d3b3', hair: 'none', cap: '#d9c08a' },
    { robe: '#5f88b8', robeDark: '#496e99', sash: '#ecc76f', trim: '#f4ead4', skin: '#e9b98f', hair: '#2b211b', cap: '#31537d' },
    { robe: '#7fb7ad', robeDark: '#5f9a90', sash: '#e9c46f', trim: '#f7f0dd', skin: '#f4cfa9', hair: '#1f1a17', cap: '#4b7f76' },
    { robe: '#e6dfcc', robeDark: '#c8bfa8', sash: '#d8b25f', trim: '#fffdf6', skin: '#f2caa4', hair: 'none', cap: '#b9a06a' },
    { robe: '#6c7fb0', robeDark: '#556792', sash: '#e6c479', trim: '#f2ecdc', skin: '#f6d3b3', hair: '#33251c', cap: '#455a87' },
  ];
  const CROWD_NAMES = ['Linh', 'Minh', 'Hà', 'Nam', 'Thảo', 'Bảo', 'Trang', 'Duy', 'Khánh', 'Mai Anh'];
  const CROWD_HATS = ['none', 'cap', 'none', 'non', 'none', 'none'];

  let crowdCache = null;

  function crowdData() {
    const id = String(place.id || place.name);
    if (crowdCache && crowdCache.id === id) return crowdCache;
    const rnd = U.rng(U.hash(id + '|visit'));
    const fame = Number(place.fame) || 0;
    const count = Math.max(3, Math.min(7, 3 + Math.floor(rnd() * 3) + (fame >= 5 ? 1 : 0)));
    const sitCount = count >= 5 ? 2 : 1;
    const look = () => CROWD_LOOKS[Math.floor(rnd() * CROWD_LOOKS.length)];
    const names = U.shuffle(CROWD_NAMES, rnd);
    const sitters = [];
    for (let i = 0; i < sitCount; i++) {
      sitters.push({
        x: Math.round((30 + i * 32 + rnd() * 6) * 10) / 10,
        sz: Math.round((0.92 + rnd() * 0.1) * 100) / 100,
        look: look(),
        hat: CROWD_HATS[Math.floor(rnd() * CROWD_HATS.length)],
        name: names[i % names.length],
        line: i % 3,
        flip: rnd() < 0.5 ? 1 : -1,
        delay: Math.round(rnd() * 6),
      });
    }
    const LANES = ['far', 'mid', 'near'];
    let laneSlot = Math.floor(rnd() * 3);
    const walkers = [];
    for (let i = 0; i < count - sitCount; i++) {
      const prev = walkers[i - 1];
      const pair = prev && rnd() < 0.35;
      let lane, x0, x1, sz, b, dur, delay;
      if (pair) {
        const dx = (rnd() < 0.5 ? -1 : 1) * (5 + rnd() * 4);
        lane = prev.lane;
        x0 = Math.max(6, Math.min(82, prev.x0 + dx));
        x1 = Math.max(8, Math.min(88, prev.x1 + dx));
        sz = prev.sz * (0.97 + rnd() * 0.05);
        b = prev.b + rnd() * 4 - 2;
        dur = prev.dur;
        delay = prev.delay;
      } else {
        lane = LANES[laneSlot++ % 3];
        const dir = rnd() < 0.5 ? -1 : 1;
        x0 = 10 + rnd() * 72;
        x1 = Math.max(6, Math.min(88, x0 + dir * (18 + rnd() * 26)));
        if (Math.abs(x1 - x0) < 14) x1 = Math.max(6, Math.min(88, x0 - dir * 22));
        sz = lane === 'far' ? 0.66 + rnd() * 0.12 : lane === 'near' ? 0.96 + rnd() * 0.12 : 0.8 + rnd() * 0.12;
        b = lane === 'far' ? 84 + rnd() * 12 : lane === 'near' ? 46 + rnd() * 10 : 60 + rnd() * 14;
        dur = lane === 'far' ? 30 + rnd() * 14 : lane === 'near' ? 18 + rnd() * 10 : 24 + rnd() * 12;
        delay = -Math.round(rnd() * 40);
      }
      walkers.push({
        x0: Math.round(x0 * 10) / 10,
        x1: Math.round(x1 * 10) / 10,
        flip: x1 >= x0 ? 1 : -1,
        sz: Math.round(sz * 100) / 100,
        b: Math.round(b),
        dur: Math.round(dur),
        delay,
        lane,
        look: look(),
        hat: CROWD_HATS[Math.floor(rnd() * CROWD_HATS.length)],
        name: names[(sitCount + i) % names.length],
        flash: i === 0 ? 4 + Math.round(rnd() * 4) : 0,
      });
    }
    crowdCache = { id, count, sitters, walkers };
    return crowdCache;
  }

  function hatSvg(hat, L, cx, cy, r) {
    if (!hat || hat === 'none') return '';
    if (hat === 'cap') {
      return `<path d="M${cx - r * 0.98} ${cy - 2.2}a${r * 0.98} ${r * 1.06} 0 0 1 ${r * 1.96} 0z" fill="${L.cap}"/>`
        + `<rect x="${cx - r * 1.02}" y="${cy - 3}" width="${r * 2.04}" height="2.6" rx="1.3" fill="${L.cap}"/>`;
    }
    if (hat === 'hat') {
      return `<path d="M${cx - r * 0.8} ${cy - r * 0.24}a${r * 0.8} ${r * 0.8} 0 0 1 ${r * 1.6} 0z" fill="${L.cap}"/>`
        + `<ellipse cx="${cx}" cy="${cy - r * 0.2}" rx="${r * 1.3}" ry="${r * 0.3}" fill="${L.cap}"/>`;
    }
    return `<path d="M${cx} ${cy - r * 1.55}L${cx - r * 1.55} ${cy - r * 0.3}q${r * 1.55} ${r * 0.44} ${r * 3.1} 0z" fill="#e8cf94" stroke="#c9a961" stroke-width="1" stroke-linejoin="round"/>`;
  }

  function faceSvg(L, cx, cy, r) {
    const hair = L.hair === 'none' ? '' : `
      <path d="M${cx - r} ${cy}a${r} ${r} 0 0 1 ${r * 2} 0q${-r * 0.09} ${-r * 0.25} ${-r * 0.42} ${-r * 0.33}
        q${-r * 0.28} ${r * 0.11} ${-r * 0.58} ${r * 0.11}t${-r * 0.58} ${-r * 0.11}
        q${-r * 0.33} ${r * 0.08} ${-r * 0.42} ${r * 0.33}z" fill="${L.hair}"/>`;
    return `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${L.skin}"/>
      <ellipse cx="${cx - r * 0.28}" cy="${cy - r * 0.5}" rx="${r * 0.5}" ry="${r * 0.3}" fill="#fff" opacity=".12"/>
      ${hair}
      <circle cx="${cx - r * 0.35}" cy="${cy + r * 0.11}" r="${r * 0.115}" fill="#241c17"/>
      <circle cx="${cx + r * 0.35}" cy="${cy + r * 0.11}" r="${r * 0.115}" fill="#241c17"/>
      <circle cx="${cx - r * 0.31}" cy="${cy + r * 0.07}" r="${r * 0.042}" fill="#fff" opacity=".85"/>
      <circle cx="${cx + r * 0.39}" cy="${cy + r * 0.07}" r="${r * 0.042}" fill="#fff" opacity=".85"/>`;
  }

  function walkerSvg(v) {
    const L = v.look;
    return `
      <svg viewBox="0 0 40 64" focusable="false" aria-hidden="true">
        <ellipse class="cv-shadow" cx="20" cy="61.2" rx="9.2" ry="2.5"/>
        <g class="cv-leg cv-leg-a">
          <rect x="14.5" y="49.4" width="4.7" height="9.2" rx="2.35" fill="${L.skin}"/>
          <path d="M14 57.2h6.2v1.4a2.2 2.2 0 0 1-2.2 2.2h-1.8a2.2 2.2 0 0 1-2.2-2.2z" fill="#3a2c22"/>
        </g>
        <g class="cv-leg cv-leg-b">
          <rect x="20.8" y="49.4" width="4.7" height="9.2" rx="2.35" fill="${L.skin}"/>
          <path d="M20.3 57.2h6.2v1.4a2.2 2.2 0 0 1-2.2 2.2h-1.8a2.2 2.2 0 0 1-2.2-2.2z" fill="#33261d"/>
        </g>
        <g class="cv-body">
          <path d="M12.4 33.6q7.6-3.4 15.2 0l2.7 16.6q-10.3 4-20.6 0z" fill="${L.robe}"/>
          <path d="M24.3 34.1l2.9 15.6q-2.4 1-4.9 1.5l-1.3-16.5z" fill="${L.robeDark}" opacity=".45"/>
          <path d="M12.4 33.6q7.6-3.4 15.2 0l.6 2.9q-8.2-3.2-16.4 0z" fill="${L.trim}"/>
          <path d="M20 36.9l-3.5 4.9.8 1.5 2.7-3.5 2.7 3.5.8-1.5z" fill="${L.trim}"/>
          <path d="M11.6 43.9q8.4 3.2 16.8 0l.7 3.9q-9.1 3.3-18.2 0z" fill="${L.sash}"/>
          <path d="M12 46q8 3 16 0" fill="none" stroke="#b98f3f" stroke-width=".8" opacity=".75"/>
          <path d="M13.1 35.2q-1.6 7.2 5.2 10.2" fill="none" stroke="${L.robeDark}" stroke-width="5.2" stroke-linecap="round"/>
          <path d="M26.9 35.2q1.6 7.2-5.2 10.2" fill="none" stroke="${L.robeDark}" stroke-width="5.2" stroke-linecap="round"/>
          <ellipse cx="18.9" cy="45.7" rx="2.4" ry="2.6" fill="${L.skin}"/>
          <ellipse cx="21.1" cy="45.7" rx="2.4" ry="2.6" fill="${L.skin}"/>
          <path d="M20 43.4v4.6" stroke="#dfae7f" stroke-width=".55" opacity=".85"/>
          <path d="M19.5 44.2v1.1M22.5 44.2v1.1" stroke="#d7a476" stroke-width=".5" stroke-linecap="round" opacity=".7"/>
          ${faceSvg(L, 20, 21.2, 13.2)}
          ${hatSvg(v.hat, L, 20, 21.2, 13.2)}
        </g>
      </svg>`;
  }

  function sitterSvg(v) {
    const L = v.look;
    return `
      <svg viewBox="0 0 56 64" focusable="false" aria-hidden="true">
        <ellipse class="cv-shadow" cx="30" cy="61.4" rx="20" ry="2.7"/>
        <g class="cv-bench">
          <rect x="6" y="31.4" width="3.6" height="14.4" rx="1.6" fill="#5c4029"/>
          <rect x="46.4" y="31.4" width="3.6" height="14.4" rx="1.6" fill="#5c4029"/>
          <rect x="5" y="30" width="46" height="4" rx="2" fill="#7b5836"/>
          <rect x="5" y="44.6" width="46" height="4.6" rx="2.3" fill="#6f4f32"/>
          <rect x="5.5" y="49.2" width="4.2" height="10.6" rx="1.8" fill="#563a24"/>
          <rect x="46.4" y="49.2" width="4.2" height="10.6" rx="1.8" fill="#563a24"/>
        </g>
        <g class="cv-seated">
          <rect x="34" y="45.6" width="4.9" height="9.6" rx="2.45" fill="${L.skin}"/>
          <rect x="39.2" y="45.6" width="4.9" height="9.6" rx="2.45" fill="${L.skin}"/>
          <path d="M33.5 53.8h6.6v1.4a2.2 2.2 0 0 1-2.2 2.2h-2.2a2.2 2.2 0 0 1-2.2-2.2z" fill="#3a2c22"/>
          <path d="M38.7 53.8h6.6v1.4a2.2 2.2 0 0 1-2.2 2.2h-2.2a2.2 2.2 0 0 1-2.2-2.2z" fill="#33261d"/>
          <path d="M19.4 28.6q9.4-3.8 18.8 0l4.6 18q-13.9 4.4-27.8 0z" fill="${L.robe}"/>
          <path d="M33.3 28.9l4.3 17.3q-4.4 1.5-9 2L29 29.6z" fill="${L.robeDark}" opacity=".45"/>
          <path d="M19.4 28.6q9.4-3.8 18.8 0l.8 3.3q-10.2-3.6-20.4 0z" fill="${L.trim}"/>
          <path d="M29 30.2l-3.4 5.4.9 1.5 2.5-3.7 2.5 3.7.9-1.5z" fill="${L.trim}"/>
          <path d="M18.6 39.6q10.4 3.6 20.8 0l.8 4.2q-11.2 3.6-22.4 0z" fill="${L.sash}"/>
          <path d="M19 41.8q9.9 3.4 19.8 0" fill="none" stroke="#b98f3f" stroke-width=".85" opacity=".75"/>
          <path d="M20.2 30.4q-1.8 7.6 5.4 10.6" fill="none" stroke="${L.robeDark}" stroke-width="5.6" stroke-linecap="round"/>
          <path d="M37.4 30.4q1.8 7.6-5.6 10.6" fill="none" stroke="${L.robeDark}" stroke-width="5.6" stroke-linecap="round"/>
          <ellipse cx="31.8" cy="41.7" rx="2.6" ry="2.8" fill="${L.skin}"/>
          <ellipse cx="34.4" cy="41.7" rx="2.6" ry="2.8" fill="${L.skin}"/>
          <path d="M33.1 39.3v4.9" stroke="#dfae7f" stroke-width=".6" opacity=".85"/>
          <path d="M32.5 40.2v1.2M35.8 40.2v1.2" stroke="#d7a476" stroke-width=".55" stroke-linecap="round" opacity=".7"/>
          ${faceSvg(L, 27.5, 18.2, 14)}
          ${hatSvg(v.hat, L, 27.5, 18.2, 14)}
        </g>
      </svg>`;
  }

  function crowdHtml() {
    const c = crowdData();
    const lines = [I18N.t('tour.chat1'), I18N.t('tour.chat2'), I18N.t('tour.chat3')];
    const walk = c.walkers.map((v) => `
      <div class="crowd-visitor walk${v.flash ? ' ambient' : ''}" aria-hidden="true" style="--x0:${v.x0}%;--x1:${v.x1}%;--flip:${v.flip};--sz:${v.sz};--b:${v.b}px;--dur:${v.dur}s;--delay:${v.delay}s">
        ${walkerSvg(v)}
        <i class="cv-flash" style="--fd:${v.flash || 5}s"></i>
        <i class="cv-cam" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="2" y="7.5" width="20" height="12.5" rx="2.6" fill="#f2cf86"/><path d="M8.4 7.5 9.7 5h4.6l1.3 2.5z" fill="#e3b96c"/><circle cx="12" cy="13.6" r="4.1" fill="#20302c"/><circle cx="12" cy="13.6" r="2.4" fill="#6fc8e0"/><circle cx="10.9" cy="12.4" r=".9" fill="#fff" opacity=".9"/></svg></i>
      </div>`).join('');
    const sit = c.sitters.map((v) => `
      <div class="crowd-visitor sit" aria-hidden="true" style="--x0:${v.x}%;--flip:${v.flip};--sz:${v.sz};--b:58px">
        ${sitterSvg(v)}
        <span class="cv-say" style="--sd:${v.delay}s"><b>${esc(v.name)}</b> · ${esc(lines[v.line])}</span>
      </div>`).join('');
    return `<div class="tour-crowd">${walk}${sit}</div>`;
  }

  const ACT_KEYS = ['tour.actLook', 'tour.actWalk', 'tour.actCheckin', 'tour.actRest'];
  let liveTimer = null;

  function presenceHtml() {
    const c = crowdData();
    const who = c.sitters[0] ? c.sitters[0].name : (c.walkers[0] ? c.walkers[0].name : '');
    const act = I18N.t(c.sitters.length ? 'tour.actRest' : 'tour.actLook');
    return `<div class="tour-presence" title="${esc(I18N.t('tour.presenceTip'))}" aria-hidden="true">
      <i class="tp-dot"></i><span id="tourPresenceText"><b>${esc(who)}</b> · ${esc(act)}</span>
    </div>`;
  }

  function setPresence(name, act) {
    const el = document.getElementById('tourPresenceText');
    if (!el) return;
    el.innerHTML = `<b>${esc(name)}</b> · ${esc(act)}`;
    if (el.animate) {
      el.animate(
        [{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 360, easing: 'ease-out' }
      );
    }
  }

  function nextPresence(snap) {
    const c = crowdData();
    const pool = [...c.sitters.map((v) => v.name), ...c.walkers.map((v) => v.name)];
    let name = pool[Math.floor(Math.random() * pool.length)];
    if (snap) {
      const all = [...document.querySelectorAll('#tourPhoto .crowd-visitor.walk')];
      const free = all.filter((w) => !w.classList.contains('snap'));
      if (!free.length) return;
      const w = free[Math.floor(Math.random() * free.length)];
      const v = c.walkers[all.indexOf(w)];
      if (v) name = v.name;
      w.classList.add('snap');
      setTimeout(() => w.classList.remove('snap'), 2400);
      setPresence(name, I18N.t('tour.actPhoto'));
      return;
    }
    setPresence(name, I18N.t(ACT_KEYS[Math.floor(Math.random() * ACT_KEYS.length)]));
  }

  function startLive() {
    stopLive();
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    liveTimer = setInterval(() => {
      if (!place || document.hidden || !document.getElementById('tourPresenceText')) return;
      nextPresence(Math.random() < 0.45);
    }, 4200);
  }

  function stopLive() {
    if (liveTimer) clearInterval(liveTimer);
    liveTimer = null;
  }

  function motesHtml() {
    return `<div class="tour-motes">${MOTES.map(([x, d, s, dl, drift]) => (
      `<i style="--x:${x}%;--d:${d}s;--s:${s}px;--dl:${dl}s;--drift:${drift}px"></i>`
    )).join('')}</div>`;
  }

  function photoHtml(stop) {
    const crowd = crowdData();
    const shots = (stop.shots && stop.shots.length ? stop.shots : (stop.img ? [stop] : []))
      .filter((s) => s && s.img);
    const total = shots.length;
    const slides = shots.map((s, i) => `
      <div class="tour-slide" style="--i:${i};--n:${total}">
        <img class="tour-real spot-${stop.spot} kb-${i % 3}" src="${esc(s.img)}" alt="${i === 0 ? esc(place.name) : ''}" loading="eager" decoding="async">
        ${s.credit ? `<span class="tour-credit">${esc(s.credit)}</span>` : ''}
      </div>
    `).join('');
    return `
      ${panoOn
        ? `<div class="tour-pano">${Scene.area(place)}</div>`
        : `<div class="tour-scene spot-${stop.spot}">${Scene.render(place)}</div>
           ${total ? `<div class="tour-reel reel-n${Math.min(total, 3)}">${slides}</div>` : ''}`}
      <div class="tour-sheen"></div>
      <div class="tour-tint theme-${stop.kind}"></div>
      ${motesHtml()}
      ${filmOn ? `<div class="tour-film-shade"></div><span class="tour-live">${esc(I18N.t('tour.playing'))}</span>` : ''}
      ${crowdHtml()}
      ${tinyHtml()}
      <div class="tour-corner">
        <div class="tour-pin">${cfg.icons.pin}<span>${esc(place.name)} · ${esc(place.province)}</span></div>
        <div class="tour-chips">
          <span class="tour-crowd-count" title="${esc(I18N.t('tour.crowdTip'))}">${esc(I18N.t('tour.crowd', { n: crowd.count }))}</span>
          <button class="tour-pano-toggle${panoOn ? ' is-on' : ''}" data-act="tour-pano" aria-pressed="${panoOn}" title="${esc(I18N.t('tour.areaTip'))}">
            ${cfg.icons.area || cfg.icons.camera || ''}<span>${esc(I18N.t(panoOn ? 'tour.areaPhotos' : 'tour.area'))}</span>
          </button>
          ${!panoOn && total > 1 ? `<span class="tour-reel-count">${cfg.icons.camera || ''}<span>${esc(I18N.t('tour.reel', { n: total }))}</span></span>` : ''}
        </div>
      </div>
      <div class="tour-stamp">${esc(stop.stamp)}</div>
      ${presenceHtml()}
      <div class="tour-hashtag">#SắcViệt · ${esc(I18N.region(place.region))}</div>
      <button class="tour-film-btn" data-act="tour-film" aria-label="${esc(I18N.t(filmOn ? 'tour.pause' : 'tour.play'))}">
        ${filmOn ? cfg.icons.pause || '' : cfg.icons.play || ''}<span>${esc(I18N.t(filmOn ? 'tour.pause' : 'tour.play'))}</span>
      </button>
      ${filmOn ? '<div class="tour-film-progress"><i></i></div>' : ''}
    `;
  }

  function render() {
    const stop = stops[step];
    const total = stops.length;
    const overlay = $('#tour');
    if (overlay) {
      overlay.classList.toggle('film', filmOn);
      overlay.classList.toggle('pano', panoOn);
    }
    $('#tourTitle').textContent = place.name;
    $('#tourMeta').textContent = `${place.province} · ${I18N.region(place.region)} · ${I18N.kind(place.kind, place.kindLabel)}`;
    $('#tourPhoto').innerHTML = photoHtml(stop);
    $('#tourGuideImg').src = cfg.guide(stop.kind === 'checkin' ? 'ask' : 'celebrate');
    $('#tourStepLabel').textContent = I18N.t('tour.step', { n: step + 1, total });
    $('#tourDots').innerHTML = stops.map((s, i) => {
      const cls = ['tour-dot'];
      if (i < step) cls.push('done');
      if (i === step) cls.push('now');
      return `<button class="${cls.join(' ')}" data-act="tour-go" data-i="${i}" aria-label="${esc(I18N.t('tour.dot', { n: i + 1 }))}"></button>`;
    }).join('');
    const tag = $('#tourTag');
    tag.textContent = stop.tag;
    tag.className = `tour-tag tag-${stop.kind}`;
    $('#tourStopTitle').textContent = stop.title;
    $('#tourStopText').textContent = stop.text;
    $('#tourNote').innerHTML = `${cfg.icons.spark}<span>${esc(stop.note)}</span>`;
    const prev = $('#tourPrev');
    prev.disabled = step === 0;
    const next = $('#tourNext');
    next.innerHTML = step === total - 1
      ? `${esc(I18N.t('tour.finish'))}${cfg.icons.check}`
      : `${esc(I18N.t('tour.next'))}${cfg.icons.arrow}`;
  }

  function finish() {
    const overlay = $('#tour');
    if (!overlay || overlay.hidden) return;
    stopFilm();
    state().tours[place.id] = Date.now();
    cfg.save();
    const next = cfg.nextPlace?.(place);
    cfg.toast(next
      ? I18N.t('tour.savedNext', { place: place.name, next: next.name })
      : I18N.t('tour.saved', { place: place.name }), cfg.icons.spark);
    T.close();
    if (cfg.onFinish) cfg.onFinish(place);
  }

  function clearFilm() {
    if (filmTimer) clearTimeout(filmTimer);
    filmTimer = null;
  }

  function stopFilm(redraw = true) {
    if (!filmOn) return;
    filmOn = false;
    clearFilm();
    if (redraw && place) render();
  }

  function scheduleFilm() {
    clearFilm();
    if (!filmOn) return;
    filmTimer = setTimeout(() => {
      if (!filmOn) return;
      if (step < stops.length - 1) {
        step++;
        render();
        scheduleFilm();
      } else {
        filmOn = false;
        clearFilm();
        render();
        if (cfg.toast) cfg.toast(I18N.t('tour.filmEnd'), cfg.icons.spark);
      }
    }, FILM_MS);
  }

  function playFilm() {
    if (!place) return;
    if (filmOn) {
      stopFilm();
      U.audio.click();
      return;
    }
    filmOn = true;
    if (step === stops.length - 1) step = 0;
    render();
    scheduleFilm();
    U.audio.click();
  }

  T.film = playFilm;

  T.pano = function () {
    if (!place) return;
    panoOn = !panoOn;
    render();
    U.audio.click();
  };

  T.open = function (p, opts = {}) {
    if (!p) return;
    stopFilm(false);
    panoOn = false;
    place = p;
    step = Math.max(0, Math.min(opts.step || 0, 4));
    stops = buildStops(p);
    lastFocused = document.activeElement;
    const overlay = $('#tour');
    if (!overlay) return;
    overlay.hidden = false;
    overlay.scrollTop = 0;
    $('#tourName').value = state().name || '';
    render();
    startLive();
    document.body.classList.add('tour-open');
    setTimeout(() => overlay.classList.add('show'), 20);
    U.audio.click();
    const closeBtn = $('[data-act="tour-close"]');
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  };

  T.close = function () {
    const overlay = $('#tour');
    if (!overlay || overlay.hidden) return;
    stopFilm(false);
    stopLive();
    overlay.classList.remove('show');
    document.body.classList.remove('tour-open');
    setTimeout(() => { overlay.hidden = true; }, 260);
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus({ preventScroll: true });
    }
    lastFocused = null;
  };

  T.next = function () {
    if (!place) return;
    stopFilm(false);
    if (step < stops.length - 1) {
      step++;
      render();
      U.audio.click();
    } else {
      finish();
    }
  };

  T.prev = function () {
    if (step > 0) {
      stopFilm(false);
      step--;
      render();
      U.audio.click();
    }
  };

  T.go = function (index) {
    if (!Number.isFinite(index) || index < 0 || index >= stops.length) return;
    stopFilm(false);
    step = index;
    render();
    U.audio.click();
  };

  T.refresh = function () {
    if (!place) return;
    stops = buildStops(place);
    render();
  };

  T.init = function (config) {
    cfg = config;
    const input = $('#tourName');
    if (input) {
      input.addEventListener('input', U.debounce(() => {
        state().name = input.value.replace(/\s+/g, ' ').slice(0, 20);
        cfg.save();
        if (place) {
          stops = buildStops(place);
          render();
        }
      }, 160));
    }
    document.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]');
      if (!act) return;
      const a = act.dataset.act;
      if (a === 'tour-close') T.close();
      else if (a === 'tour-next') T.next();
      else if (a === 'tour-prev') T.prev();
      else if (a === 'tour-go') T.go(Number(act.dataset.i));
      else if (a === 'tour-film') T.film();
      else if (a === 'tour-pano') T.pano();
    });
    document.addEventListener('keydown', (e) => {
      const overlay = $('#tour');
      if (!overlay || overlay.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); T.close(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); T.next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); T.prev(); }
      else if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); T.film(); }
    });
  };

  window.Tour = T;
})();
