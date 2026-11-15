/* Sắc Việt – điều phối game */
(function () {
  const { $, $$ } = U;
  const SAVE_KEY = 'sacviet.save.v1';
  const LETTERS = ['A', 'B', 'C', 'D'];
  const UNLOCK_COST = { 8: 8, 9: 14, 10: 20 };
  const FREE_MAX = 7;

  const CHAPTERS = [
    { fame: 3 },
    { fame: 4 },
    { fame: 5 },
    { fame: 6 },
    { fame: 7 },
    { fame: 8, lock: true, cost: 8 },
    { fame: 9, lock: true, cost: 14 },
    { fame: 10, lock: true, cost: 20 },
  ];

  const TIERS = { Master: 'Master', Pro: 'Pro', Task: 'Task' };

  const ICON = {
    lotus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6c2 2.4 3 4.8 3 7.1 0 2.7-1.3 4.8-3 6.3-1.7-1.5-3-3.6-3-6.3 0-2.3 1-4.7 3-7.1z" fill="currentColor" opacity=".92"/><path d="M3.6 6.6c3 .2 5.3 1.3 6.9 3.3 1.3 1.7 1.8 3.9 1.6 6.1-2.2-.5-4-1.7-5.2-3.5-1.3-1.9-1.8-4-1.3-5.9z" fill="currentColor" opacity=".7"/><path d="M20.4 6.6c.5 1.9 0 4-1.3 5.9-1.2 1.8-3 3-5.2 3.5-.2-2.2.3-4.4 1.6-6.1 1.6-2 3.9-3.1 6.9-3.3z" fill="currentColor" opacity=".7"/><path d="M5.2 13.9c2.6 1.1 5 4.1 6.8 7.5 1.8-3.4 4.2-6.4 6.8-7.5-1.1 2.1-2.6 4-4.3 5.4-1.1.9-2 .9-2.5.9s-1.4 0-2.5-.9c-1.7-1.4-3.2-3.3-4.3-5.4z" fill="currentColor" opacity=".55"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="15.5" r="1.5" fill="currentColor"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8L12 3.2z" fill="currentColor"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.4 4.4L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 6.5l5.5-2 6 2 5.5-2v13l-5.5 2-6-2-5.5 2v-13z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 4.5v13M15 6.5v13" stroke="currentColor" stroke-width="1.6"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0V4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 5.5H4.5v2A3.5 3.5 0 0 0 8 11M16 5.5h3.5v2A3.5 3.5 0 0 1 16 11M12 13v4M8.5 20h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3l4.5-3.5v12L7 14.5H4v-5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3l4.5-3.5v12L7 14.5H4v-5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M20 4.5V10h-5.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.6 9.6h16.8M3.6 14.4h16.8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 3.4c2.3 2.4 3.5 5.3 3.5 8.6s-1.2 6.2-3.5 8.6c-2.3-2.4-3.5-5.3-3.5-8.6S9.7 5.8 12 3.4z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    compass: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.2 6.2l2.8 2.8M15 15l2.8 2.8M17.8 6.2L15 9M9 15l-2.8 2.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6.2-5.6 6.2-10.2a6.2 6.2 0 1 0-12.4 0C5.8 15.4 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="10.6" r="2.2" fill="currentColor"/></svg>',
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 8.5h3.2l1.8-2.8h7l1.8 2.8h3.2v10h-17v-10z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="13.2" r="3.3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5l11 6.5-11 6.5v-13z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="5" width="3.6" height="14" rx="1.2" fill="currentColor"/><rect x="13.4" y="5" width="3.6" height="14" rx="1.2" fill="currentColor"/></svg>',
    area: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18.5l5.4-8.2 3.4 4.6 2.6-3.4 6.6 7H3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="17.6" cy="6.6" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    layers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6L20.5 8 12 12.4 3.5 8 12 3.6z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M3.8 12.2L12 16.4l8.2-4.2M3.8 16.2L12 20.4l8.2-4.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.4c2.7-.8 5.4-.4 8 1.2 2.6-1.6 5.3-2 8-1.2v13c-2.7-.8-5.4-.4-8 1.2-2.6-1.6-5.3-2-8-1.2v-13z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 6.6v13" stroke="currentColor" stroke-width="1.5"/></svg>',
    mountain: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.8 19.2L8.9 8.4l3.4 5.4 2.9-4.2 6 9.6H2.8z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M7.2 11.2l1.7 1.4 1.7-1.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    music: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 17.6V6.2l9.2-1.9v11.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="6.9" cy="17.8" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="16.1" cy="15.7" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V3.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M6 4.8c3.6-2 6.6 2 10.2 0v8c-3.6 2-6.6-2-10.2 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    bowl: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 11.6h16.8c-.4 4.6-3.8 7.6-8.4 7.6s-8-3-8.4-7.6z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8.2 8.4c0-1.6 1-2.1 1-3.6M12 8.4c0-1.6 1-2.1 1-3.6M15.8 8.4c0-1.6 1-2.1 1-3.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    google: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.35z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.75-5.6-4.1H3.06v2.58A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.93a6 6 0 0 1 0-3.86V7.49H3.06a10 10 0 0 0 0 9.02l3.34-2.58z"/><path fill="#EA4335" d="M12 6.03c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.34 2.58C7.2 7.75 9.4 6.03 12 6.03z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#1877F2"/><path fill="#fff" d="M15.4 12.6h-2.3V20h-3v-7.4H8.4V10h1.7V8.5c0-2 .9-3.2 3.2-3.2h2.1v2.6h-1.4c-.8 0-.9.3-.9.9V10h2.4l-.1 2.6z"/></svg>',
  };

  const PLACES = (window.PLACES || []).slice();
  const byId = new Map(PLACES.map((p) => [p.id, p]));
  Quiz.init(PLACES);
  if (window.Knowledge) Knowledge.init(PLACES);

  const chapters = CHAPTERS.map((c) => {
    const list = PLACES.filter((p) => p.fame === c.fame);
    return { ...c, places: list };
  });

  /* ---------------- Bản đồ 34 tỉnh thành ---------------- */
  const REGION_ORDER = [
    'Đồng bằng Bắc Bộ',
    'Miền núi phía Bắc',
    'Bắc Trung Bộ',
    'Nam Trung Bộ & Tây Nguyên',
    'Đông Nam Bộ',
    'Đồng bằng sông Cửu Long',
  ];

  function foldName(value) {
    return String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/^(tp|thanh pho|tinh)\s+/, '')
      .replace(/\s+/g, ' ');
  }

  const provIndex = new Map();
  PLACES.forEach((p) => {
    const key = foldName(p.province);
    let rec = provIndex.get(key);
    if (!rec) {
      rec = { key, name: p.province, region: p.region, places: [], olds: new Set() };
      provIndex.set(key, rec);
    }
    rec.places.push(p);
    String(p.oldProvince || '').split(/[,;]/).forEach((old) => {
      const v = old.trim();
      if (v) rec.olds.add(v);
    });
  });

  const mapRows = (window.PROVINCES34 || []).map((row) => {
    const key = foldName(row.n);
    const rec = provIndex.get(key);
    return {
      ...row,
      key,
      name: rec ? rec.name : row.n,
      region: rec ? rec.region : '',
      count: rec ? rec.places.length : 0,
    };
  });

  function provincePlaces(rec) {
    return rec.places.slice().sort((a, b) => b.fame - a.fame || a.name.localeCompare(b.name, 'vi'));
  }

  function provinceProgress(rec) {
    let visited = 0, mastered = 0;
    rec.places.forEach((p) => {
      if (S.visited[p.id]) visited++;
      const b = S.best[p.id];
      if (b && b.tier === 'Master') mastered++;
    });
    return { visited, mastered };
  }

  function clip(text, max = 168) {
    const s = String(text || '').trim();
    if (s.length <= max) return s;
    const cut = s.slice(0, max);
    const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '), cut.lastIndexOf(' '));
    return cut.slice(0, stop > 60 ? stop : max).replace(/[\s,;.]+$/, '') + '…';
  }

  const bootPlayer = Identity.init({ save: loadState() });
  let S = normalizeState(bootPlayer.save);
  Identity.saveActive(S);
  I18N.set(S.lang);
  let currentId = null;
  let round = null;
  let stageFor = null;
  let openChapters = new Set();
  let view = 'play';
  let mapSel = null;
  let knowTab = 'explore';
  let knowRegion = '';
  let knowTopic = 'mixed';
  let knowScope = '';
  let knowQuiz = null;
  let mapQuery = '';
  let mapShowAll = false;
  let mapApi = null;
  let mapLang = null;

  function normalizeExplore(raw) {
    const base = { version: 1, routes: {}, last: null, voice: { auto: true, voiceURI: '', rate: 1 } };
    if (!raw || typeof raw !== 'object') return base;
    const voice = raw.voice && typeof raw.voice === 'object' ? raw.voice : {};
    return {
      version: 1,
      routes: raw.routes && typeof raw.routes === 'object' ? raw.routes : {},
      last: raw.last && typeof raw.last === 'object' ? raw.last : null,
      voice: {
        auto: voice.auto !== false,
        voiceURI: typeof voice.voiceURI === 'string' ? voice.voiceURI : '',
        rate: Number(voice.rate) > 0 ? Number(voice.rate) : 1,
      },
    };
  }

  function normalizeState(raw) {
    const base = {
      version: 1,
      lotus: 0,
      best: {},
      earned: {},
      visited: {},
      unlocked: {},
      tours: {},
      knowledge: { plays: 0, best: {} },
      explore: normalizeExplore(null),
      name: '',
      sound: true,
      lang: 'vi',
      stageMode: 'auto',
      lastPlaceId: null,
      plays: 0,
    };
    if (!raw || typeof raw !== 'object') return base;
    return {
      ...base,
      ...raw,
      lang: I18N.supported(raw.lang) ? raw.lang : 'vi',
      best: raw.best && typeof raw.best === 'object' ? raw.best : {},
      earned: raw.earned && typeof raw.earned === 'object' ? raw.earned : {},
      visited: raw.visited && typeof raw.visited === 'object' ? raw.visited : {},
      unlocked: raw.unlocked && typeof raw.unlocked === 'object' ? raw.unlocked : {},
      tours: raw.tours && typeof raw.tours === 'object' ? raw.tours : {},
      knowledge: {
        plays: Number(raw.knowledge && raw.knowledge.plays) || 0,
        best: raw.knowledge && raw.knowledge.best && typeof raw.knowledge.best === 'object' ? raw.knowledge.best : {},
      },
      explore: normalizeExplore(raw.explore),
      name: typeof raw.name === 'string' ? raw.name : '',
      lotus: Number(raw.lotus) || 0,
      plays: Number(raw.plays) || 0,
      stageMode: raw.stageMode === 'scene' ? 'scene' : 'auto',
    };
  }

  function loadState() {
    return normalizeState(U.store.read(SAVE_KEY, null));
  }

  function save() {
    U.store.write(SAVE_KEY, S);
    Identity.saveActive(S);
  }

  function currentPlace() { return currentId ? byId.get(currentId) : null; }
  function chapterOf(place) { return chapters.find((c) => c.fame === place.fame) || chapters[0]; }
  function chapterIndex(fame) { return Math.max(0, Math.min(7, fame - 3)); }
  function chapterName(fame) { return I18N.chapter(chapterIndex(fame)).title; }
  function chapterSub(fame) { return I18N.chapter(chapterIndex(fame)).sub; }
  function kindName(place) { return I18N.kindTitle(place.kind, place.kindLabel); }
  function isLocked(place) { return place.fame > FREE_MAX && !S.unlocked[place.id]; }
  function unlockCost(place) { return UNLOCK_COST[place.fame] || 0; }
  function indexOf(place) { return PLACES.indexOf(place); }
  function escapeReg(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function stars(fame) {
    const n = Math.max(1, Math.min(5, Math.round(fame / 2)));
    let out = '';
    for (let i = 0; i < 5; i++) out += `<span class="star ${i < n ? 'on' : ''}">${ICON.star}</span>`;
    return `<span class="stars" title="${U.esc(I18N.t('stage.fame', { fame }))}">${out}</span>`;
  }

  function photoOf(place) {
    if (!place) return '';
    return Media.photo(place.id) || Media.provincePhoto(place) || '';
  }

  function thumbHtml(place, cls) {
    const src = photoOf(place) || (window.Scene ? Scene.thumb(place) : '');
    if (!src) return `<span class="${cls} fallback">${ICON.pin}</span>`;
    return `<span class="${cls}"><img src="${U.esc(src)}" alt="" loading="lazy" decoding="async"></span>`;
  }

  function suggestPlaces(anchor, count = 3) {
    const startIndex = anchor ? indexOf(anchor) : 0;
    const pool = PLACES.filter((p) => p !== anchor && !isLocked(p));
    const scored = pool.map((p) => {
      let s = 0;
      if (anchor) {
        if (p.region === anchor.region) s += 6;
        if (p.province === anchor.province) s += 2;
        s -= Math.abs(p.fame - anchor.fame) * 1.5;
        s -= Math.min(10, Math.abs(indexOf(p) - startIndex) / 45);
      }
      const best = S.best[p.id];
      if (best && best.tier === 'Master') s -= 8;
      else if (best && best.tier) s -= 3;
      if (S.tours[p.id]) s -= 4;
      if (S.visited[p.id]) s -= 1.5;
      return { p, s };
    });
    scored.sort((a, b) => b.s - a.s || indexOf(a.p) - indexOf(b.p));
    const out = scored.slice(0, count).map((x) => x.p);
    if (out.length) return out;
    return Array.from({ length: count }, (_, i) => PLACES[(startIndex + i + 1) % PLACES.length]).filter(Boolean);
  }

  function redactName(text, name) {
    let out = String(text || '');
    const full = escapeReg(name);
    out = out.replace(new RegExp(full, 'gi'), 'nơi này');
    const short = name.replace(/^(Khu di tích|Di tích|Danh thắng|Quần thể|Thắng cảnh)\s+/i, '').replace(/^(Chùa|Đền|Đình|Miếu|Thác|Hồ|Núi|Đèo|Bãi|Vịnh|Động|Hang|Bản|Làng|Chợ|Cầu|Thành|Phố|Cố đô)\s+/i, '');
    if (short && short !== name && short.length > 2) {
      out = out.replace(new RegExp(escapeReg(short), 'gi'), 'nơi này');
    }
    return out.replace(/(nơi này[\s,.]*){2,}/gi, 'nơi này ');
  }

  function redactIntro(text, place) {
    let out = redactName(text, place.name);
    const swap = (value, label) => {
      if (!value) return;
      out = out.replace(new RegExp(escapeReg(value), 'gi'), label);
    };
    swap(place.province, 'vùng đất quanh đây');
    swap(String(place.province || '').replace(/^(TP\.|Thành phố|Tỉnh)\s+/i, ''), 'vùng đất quanh đây');
    String(place.oldProvince || '').split(/[,;]/).forEach((old) => swap(old.trim(), 'vùng đất quanh đây'));
    swap(place.figure, 'những con người nơi đây');
    swap(place.specialty, 'hương vị nơi đây');
    swap(place.culture, 'nét văn hoá nơi đây');
    out = out.replace(/(vùng đất quanh đây[\s,.]*){2,}/gi, 'vùng đất quanh đây ').trim();
    return out.replace(/(^|[.!?]\s+)(\p{Ll})/gu, (m, pre, ch) => pre + ch.toUpperCase());
  }

  /* ---------------- Trạng thái khởi đầu ---------------- */
  function chooseStart() {
    if (S.lastPlaceId && byId.has(S.lastPlaceId)) return byId.get(S.lastPlaceId);
    const unvisited = PLACES.find((p) => !S.visited[p.id]);
    return unvisited || PLACES[0];
  }

  function goPlace(place, opts = {}) {
    if (!place) return;
    currentId = place.id;
    S.lastPlaceId = place.id;
    if (!S.visited[place.id]) S.visited[place.id] = Date.now();
    save();
    if (opts.keepRound && round && round.placeId === place.id) {
      /* giữ lượt đang chơi */
    } else {
      round = null;
    }
    openChapters.add(place.fame);
    setView('play');
    renderPlay(opts.forceStage);
  }

  function nextPlace() {
    const place = currentPlace();
    if (!place) return;
    const i = indexOf(place);
    const next = PLACES[(i + 1) % PLACES.length];
    if (!next) return;
    if (i === PLACES.length - 1) U.toast(I18N.t('toast.loop'), ICON.spark);
    closeFx();
    goPlace(next);
  }

  /* ---------------- Render chung ---------------- */
  function setView(next, opts = {}) {
    const prev = view;
    view = next;
    document.body.dataset.screen = next;
    $$('.view').forEach((el) => el.classList.toggle('active', el.id === 'view-' + next));
    $$('[data-view]').forEach((b) => {
      const on = b.dataset.view === next;
      b.classList.toggle('active', on);
      if (b.classList.contains('tab')) {
        if (on) b.setAttribute('aria-current', 'page');
        else b.removeAttribute('aria-current');
      }
    });
    if (next === 'explore') {
      if (window.Explore) Explore.render();
    } else if (prev === 'explore' && window.Explore) {
      Explore.leave();
    }
    if (next === 'map') renderMap();
    if (next === 'knowledge') renderKnowledge();
    if (next === 'journey') renderJourney();
    if (next === 'achv') renderAchv();
    if (next === 'play') renderPlay();
    if (opts.scroll !== false) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateHud() {
    const el = $('#lotusCount');
    if (el) el.textContent = U.nf(S.lotus);
    const snd = $('#btnSound');
    if (snd) {
      snd.innerHTML = S.sound ? ICON.sound : ICON.muted;
      snd.setAttribute('aria-label', I18N.t(S.sound ? 'hud.soundOn' : 'hud.soundOff'));
    }
    const langBtn = $('#btnLang');
    if (langBtn) langBtn.setAttribute('aria-label', I18N.t('hud.lang'));
    const player = Identity.active();
    if (player) {
      const label = playerLabel(player);
      const av = $('#playerAvatar');
      const nm = $('#playerName');
      const chip = $('#btnPlayer');
      if (av) av.innerHTML = avatarHtml(player, label);
      if (nm) nm.textContent = label;
      if (chip) chip.setAttribute('aria-label', `${I18N.t('acct.open')} – ${label}`);
    }
    $$('#langMenu [data-lang]').forEach((item) => {
      const active = item.dataset.lang === I18N.code();
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
  }

  function playerLabel(p) {
    if (!p) return I18N.t('acct.guestName');
    if (p.name) return p.name;
    if (p.provider === 'device') return I18N.t('acct.guestName');
    return I18N.t('acct.provider.' + p.provider);
  }

  function avatarHtml(p, label) {
    if (p && p.avatar) return `<img src="${U.esc(p.avatar)}" alt="">`;
    const ch = String(label || '?').trim().charAt(0).toUpperCase();
    return U.esc(ch || '?');
  }

  function buildLangMenu() {
    const menu = $('#langMenu');
    if (!menu) return;
    menu.innerHTML = I18N.LANGS.map((l) => {
      const active = l.code === I18N.code();
      return `<button class="lang-item ${active ? 'active' : ''}" role="option" aria-selected="${active}" data-lang="${l.code}">
        <span>${U.esc(l.label)}</span><small>${l.short}</small>
      </button>`;
    }).join('');
  }

  function closeLangMenu() {
    const menu = $('#langMenu');
    const btn = $('#btnLang');
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function setLang(code) {
    if (!I18N.supported(code)) return;
    S.lang = code;
    save();
    I18N.set(code);
    closeLangMenu();
    updateHud();
  }

  /* ---------------- Hồ sơ người chơi ---------------- */
  let acctGoogleLang = '';
  let acctCloseTimer = null;

  function prefState() {
    return { ...normalizeState(null), lang: S.lang, sound: S.sound, stageMode: S.stageMode };
  }

  function applyPlayer(player) {
    if (!player) return;
    const pref = { lang: S.lang, sound: S.sound, stageMode: S.stageMode };
    S = normalizeState(player.save);
    S.lang = pref.lang;
    S.sound = pref.sound;
    S.stageMode = pref.stageMode;
    I18N.set(S.lang);
    round = null;
    stageFor = null;
    currentId = null;
    knowQuiz = null;
    const start = chooseStart();
    if (start) {
      currentId = start.id;
      S.lastPlaceId = start.id;
      if (!S.visited[start.id]) S.visited[start.id] = Date.now();
    }
    openChapters = new Set([start ? start.fame : 3]);
    save();
    U.audio.setMuted(!S.sound);
    updateHud();
    closeFx();
    if (view === 'map') renderMap();
    else if (view === 'knowledge') renderKnowledge();
    else if (view === 'journey') renderJourney();
    else if (view === 'achv') renderAchv();
    else renderPlay(true);
    renderAcct();
  }

  function openAcct() {
    const el = $('#acct');
    if (!el) return;
    clearTimeout(acctCloseTimer);
    setAcctWarn('acctGuestWarn', '');
    el.hidden = false;
    renderAcct();
    document.body.classList.add('acct-open');
    requestAnimationFrame(() => el.classList.add('show'));
    const btn = $('#btnPlayer');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    U.audio.click();
  }

  function closeAcct() {
    const el = $('#acct');
    if (!el || el.hidden) return;
    el.classList.remove('show');
    document.body.classList.remove('acct-open');
    const btn = $('#btnPlayer');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    clearTimeout(acctCloseTimer);
    acctCloseTimer = setTimeout(() => { el.hidden = true; }, 260);
  }

  function setAcctWarn(sel, msg) {
    const el = $('#' + sel);
    if (!el) return;
    el.textContent = msg || '';
    el.hidden = !msg;
  }

  async function writeClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch { /* dùng cách dự phòng */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-100px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch { return false; }
  }

  async function copyCurrentId() {
    const p = Identity.active();
    if (!p) return;
    if (await writeClipboard(p.id)) {
      U.toast(I18N.t('acct.copied', { id: p.id }), ICON.check);
    } else {
      U.toast(I18N.t('acct.copyFail'), ICON.close);
    }
  }

  function newRandomProfile() {
    save();
    const player = Identity.createRandom(prefState());
    applyPlayer(player);
    U.toast(I18N.t('acct.randomDone', { id: player.id }), ICON.spark);
  }

  function restoreProfile() {
    const input = $('#acctRestore');
    if (!Identity.normalizeId(input ? input.value : '')) {
      setAcctWarn('acctGuestWarn', I18N.t('acct.restoreInvalid'));
      if (input) input.focus();
      return;
    }
    save();
    const res = Identity.useId(input ? input.value : '', prefState());
    if (res.error) {
      setAcctWarn('acctGuestWarn', I18N.t('acct.restoreInvalid'));
      if (input) input.focus();
      return;
    }
    setAcctWarn('acctGuestWarn', '');
    if (input) input.value = '';
    applyPlayer(res.player);
    U.toast(I18N.t(res.created ? 'acct.created' : 'acct.restored', { id: res.player.id }), ICON.check);
  }

  function useDeviceProfile() {
    save();
    const player = Identity.useDevice();
    if (!player) return;
    applyPlayer(player);
    U.toast(I18N.t('acct.switched', { name: playerLabel(player) }), ICON.check);
  }

  function switchProfile(id) {
    const cur = Identity.active();
    if (!cur || !id || id === cur.id) return;
    save();
    const player = Identity.activate(id);
    if (!player) return;
    applyPlayer(player);
    U.toast(I18N.t('acct.switched', { name: playerLabel(player) }), ICON.check);
  }

  async function loginFacebook() {
    const btn = $('#acctFacebookBtn');
    if (!Identity.providers().facebook) {
      setAcctWarn('acctLoginWarn', I18N.t('acct.facebookUnavailable'));
      return;
    }
    setAcctWarn('acctLoginWarn', '');
    if (btn) btn.disabled = true;
    try {
      const profile = await Identity.loginFacebook();
      finishProviderLogin(profile);
    } catch (err) {
      setAcctWarn('acctLoginWarn', I18N.t(err && err.message === 'not-configured' ? 'acct.facebookUnavailable' : 'acct.loginFail'));
    } finally {
      if (btn) btn.disabled = !Identity.providers().facebook;
    }
  }

  function finishProviderLogin(profile) {
    save();
    const res = Identity.upsertProvider(profile, prefState());
    if (!res || !res.player) {
      setAcctWarn('acctLoginWarn', I18N.t('acct.loginFail'));
      return;
    }
    applyPlayer(res.player);
    closeAcct();
    U.toast(I18N.t(res.isNew ? 'acct.created' : 'acct.switched', {
      id: res.player.id,
      name: playerLabel(res.player),
    }), ICON.spark);
  }

  function renderAcct() {
    if (!$('#acct')) return;
    const cur = Identity.active();
    if (!cur) return;
    const label = playerLabel(cur);
    const curWrap = $('#acctCurrent');
    if (curWrap) {
      curWrap.innerHTML = `
        <span class="acct-avatar">${avatarHtml(cur, label)}</span>
        <div class="acct-who">
          <b>${U.esc(label)}</b>
          <code>${U.esc(cur.id)}</code>
          <div class="acct-stats">
            <span>${ICON.lotus}${U.esc(I18N.t('acct.stat.lotus', { n: U.nf(S.lotus) }))}</span>
            <span>${ICON.pin}${U.esc(I18N.t('acct.stat.places', { n: U.nf(Object.keys(S.best).length) }))}</span>
          </div>
        </div>
        <span class="acct-tag">${U.esc(I18N.t('acct.provider.' + cur.provider))}</span>`;
    }

    const dev = $('#acctDeviceId');
    if (dev) dev.textContent = Identity.deviceId();

    const prov = Identity.providers();
    const gBtn = $('#acctGoogleBtn');
    const fBtn = $('#acctFacebookBtn');
    const gHost = $('#acctGoogleHost');
    if (gBtn) {
      gBtn.hidden = prov.google;
      gBtn.disabled = !prov.google;
      gBtn.title = prov.google ? '' : I18N.t('acct.googleUnavailable');
    }
    if (fBtn) {
      fBtn.disabled = !prov.facebook;
      fBtn.title = prov.facebook ? '' : I18N.t('acct.facebookUnavailable');
    }
    if (gHost) gHost.hidden = !prov.google;
    if (prov.google || prov.facebook) Identity.prepare();
    const warnEl = $('#acctLoginWarn');
    if (warnEl) {
      const auto = [I18N.t('acct.notConfigured'), I18N.t('acct.googleUnavailable'), I18N.t('acct.facebookUnavailable')];
      if (auto.includes(warnEl.textContent)) setAcctWarn('acctLoginWarn', '');
      if (!prov.google && !prov.facebook) setAcctWarn('acctLoginWarn', I18N.t('acct.notConfigured'));
    }
    if (prov.google && gHost && acctGoogleLang !== I18N.code()) {
      acctGoogleLang = I18N.code();
      Identity.renderGoogle(gHost, {
        locale: I18N.code(),
        onProfile: finishProviderLogin,
        onError: () => {
          acctGoogleLang = '';
          setAcctWarn('acctLoginWarn', I18N.t('acct.googleUnavailable'));
        },
      });
    }

    const host = $('#acctProfiles');
    if (host) {
      const list = Identity.list();
      host.innerHTML = list.length ? list.map((p) => {
        const active = p.id === cur.id;
        const name = playerLabel(p);
        return `<div class="acct-profile ${active ? 'active' : ''}">
          <span class="acct-avatar sm">${avatarHtml(p, name)}</span>
          <div class="acct-pinfo"><b>${U.esc(name)}</b><small>${U.esc(I18N.t('acct.provider.' + p.provider))} · ${U.esc(p.id)}</small></div>
          ${active
            ? `<span class="acct-tag">${U.esc(I18N.t('acct.active'))}</span>`
            : `<button class="btn ghost" data-act="acct-switch" data-id="${U.esc(p.id)}">${U.esc(I18N.t('acct.use'))}</button>`}
        </div>`;
      }).join('') : `<p class="acct-empty">${U.esc(I18N.t('acct.localNote'))}</p>`;
    }
  }

  function pulseLotus() {
    const chip = $('#hudLotus');
    if (!chip) return;
    chip.classList.remove('pulse');
    void chip.offsetWidth;
    chip.classList.add('pulse');
    const fly = document.createElement('span');
    fly.className = 'lotus-fly';
    fly.innerHTML = ICON.lotus + '<b>+1</b>';
    chip.appendChild(fly);
    setTimeout(() => fly.remove(), 1000);
  }

  function setGuide(kind, text) {
    const img = $('#guideImg');
    if (img) {
      const src = Media.guide(kind);
      if (src) {
        img.src = src;
        img.classList.remove('hide');
      } else {
        img.classList.add('hide');
      }
    }
    const t = $('#guideText');
    if (t) t.textContent = text;
  }

  /* ---------------- Màn chơi ---------------- */
  function renderStage(place, force = false) {
    const stage = $('#stage');
    if (!stage) return;
    if (!force && stageFor === place.id) return;
    stageFor = place.id;
    const ownPhoto = Media.photo(place.id);
    const photo = ownPhoto || Media.provincePhoto(place);
    const fallback = !ownPhoto && !!photo;
    const mode = photo && S.stageMode !== 'scene' ? 'photo' : 'scene';
    stage.innerHTML = `
      <div class="stage-media" data-mode="${mode}">
        ${Scene.render(place)}
        ${photo ? `<img class="stage-photo" alt="${U.esc(place.name)}" src="${U.esc(photo)}">` : ''}
      </div>
      <div class="stage-vignette"></div>
      <div class="stage-badges">
        <span class="stage-badge">${U.esc(chapterName(place.fame))}</span>
        <span class="stage-badge flame">${stars(place.fame)}</span>
      </div>
      <div class="stage-counter">${U.esc(I18N.t('stage.counter', { n: indexOf(place) + 1, total: U.nf(PLACES.length) }))}</div>
      ${photo ? `<button class="stage-mode" data-act="stage-mode" aria-label="${U.esc(I18N.t(mode === 'photo' ? 'stage.view3d' : 'stage.viewPhoto'))}" title="${U.esc(I18N.t(mode === 'photo' ? 'stage.modePhoto' : 'stage.mode3d'))}">
        ${mode === 'photo' ? ICON.layers : ICON.camera}<span>${U.esc(I18N.t(mode === 'photo' ? 'stage.view3d' : 'stage.viewPhoto'))}</span>
      </button>` : ''}
      ${fallback && mode === 'photo' ? `<span class="stage-credit">${ICON.camera}${U.esc(I18N.t('stage.fallbackPhoto', { province: place.province }))}</span>` : ''}
    `;
    const img = $('.stage-photo', stage);
    if (img) img.addEventListener('error', () => {
      img.remove();
      const btn = $('.stage-mode', stage);
      if (btn) btn.remove();
    });
  }

  function toggleStageMode() {
    const place = currentPlace();
    if (!place || !photoOf(place)) return;
    S.stageMode = S.stageMode === 'scene' ? 'auto' : 'scene';
    save();
    stageFor = null;
    renderStage(place, true);
    U.audio.click();
  }

  function initSceneParallax() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let host = null;
    const reset = (el) => {
      if (!el) return;
      el.style.setProperty('--px', '0px');
      el.style.setProperty('--py', '0px');
      el.style.setProperty('--tiltx', '0deg');
      el.style.setProperty('--tilty', '0deg');
    };
    document.addEventListener('pointermove', (e) => {
      const el = e.target && e.target.closest ? e.target.closest('.stage, .tour-photo') : null;
      if (!el) {
        if (host) { reset(host); host = null; }
        return;
      }
      host = el;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const nx = Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / r.width - 0.5));
      const ny = Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / r.height - 0.5));
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--px', (nx * 26).toFixed(2) + 'px');
        el.style.setProperty('--py', (ny * 18).toFixed(2) + 'px');
        el.style.setProperty('--tiltx', (-ny * 2.4).toFixed(2) + 'deg');
        el.style.setProperty('--tilty', (nx * 3).toFixed(2) + 'deg');
      });
    }, { passive: true });
    document.addEventListener('pointerout', (e) => {
      const el = e.target && e.target.closest ? e.target.closest('.stage, .tour-photo') : null;
      if (!el || el.contains(e.relatedTarget)) return;
      reset(el);
    });
  }

  function renderPlay(forceStage = false) {
    if (!PLACES.length) return;
    if (!currentPlace()) {
      goPlace(chooseStart(), { forceStage: true });
      return;
    }
    const place = currentPlace();
    renderStage(place, forceStage);

    if (isLocked(place)) {
      setGuide('welcome', Quiz.guide.locked(place, unlockCost(place)));
      renderLockedPanel(place);
      updateHud();
      return;
    }

    if (!round) {
      setGuide('welcome', Quiz.guide.intro(place));
      renderIntroPanel(place);
    } else if (round.done) {
      setGuide(round.correct === 5 ? 'celebrate' : 'ask', Quiz.guide.summary(round.correct, round.tier, place));
      renderSummaryPanel(place);
    } else {
      const q = round.quiz.questions[round.qi];
      if (round.answered == null) {
        setGuide('ask', Quiz.guide.ask(q));
      } else {
        const ok = round.answered === q.answer;
        setGuide(ok ? 'celebrate' : 'ask', ok ? Quiz.guide.correct(q, round.lastAwarded > 0) : Quiz.guide.wrong(q));
      }
      renderQuizPanel(place);
    }
    updateHud();
  }

  function renderIntroPanel(place) {
    const panel = $('#panel');
    const best = S.best[place.id];
    const introText = I18N.code() === 'vi' ? redactIntro(place.story, place) : I18N.placeStory(place);
    panel.innerHTML = `
      <div class="panel-inner">
        <div class="eyebrow">${ICON.compass}<span>${U.esc(chapterName(place.fame))}</span></div>
        <h2 class="panel-title">${U.esc(I18N.t('panel.intro.eyebrow'))} <small>#${indexOf(place) + 1}</small></h2>
        <p class="panel-lede">${U.esc(introText)}</p>
        ${photoOf(place) ? `<div class="intro-teaser ${best ? 'open' : ''}">
          <img src="${U.esc(photoOf(place))}" alt="" loading="lazy" decoding="async">
          <span>${ICON.camera}${U.esc(I18N.t(best ? 'panel.intro.teaserOpen' : 'panel.intro.teaserClosed'))}</span>
        </div>` : ''}
        <div class="meta-row">
          <span class="meta-chip">${U.esc(I18N.region(place.region))}</span>
          <span class="meta-chip">${U.esc(kindName(place))}</span>
          <span class="meta-chip fame">${stars(place.fame)} ${place.fame}/10</span>
        </div>
        <div class="best-line ${best ? 'has' : ''}">
          ${best ? `${ICON.trophy}<span>${I18N.t('panel.intro.bestLine', { score: best.correct })}${best.tier ? ' · ' + best.tier : ''}</span>` : `${ICON.spark}<span>${U.esc(I18N.t('panel.intro.bestNone'))}</span>`}
        </div>
        <div class="panel-actions">
          <button class="btn primary" data-act="start">${U.esc(I18N.t(best ? 'panel.intro.replay' : 'panel.intro.start'))}</button>
          ${S.tours[place.id] ? `<button class="btn ghost" data-act="tour">${ICON.camera}${U.esc(I18N.t('panel.intro.tourReview'))}</button>` : ''}
          <button class="btn ghost" data-act="skip">${U.esc(I18N.t('panel.intro.skip'))}</button>
        </div>
        <p class="panel-note">${U.esc(I18N.t('panel.intro.note'))}</p>
      </div>
    `;
  }

  function renderQuizPanel(place) {
    const panel = $('#panel');
    const quiz = round.quiz;
    const q = quiz.questions[round.qi];
    const answered = round.answered != null;
    const isLast = round.qi === quiz.questions.length - 1;
    const dots = quiz.questions.map((item, i) => {
      let cls = '';
      if (i < round.qi) cls = round.results[i] ? 'ok' : 'no';
      if (i === round.qi) cls += ' now';
      return `<span class="dot ${cls}">${i < round.qi ? (round.results[i] ? ICON.check : ICON.close) : i + 1}</span>`;
    }).join('');

    const options = q.options.map((text, i) => {
      let cls = '';
      if (answered) {
        if (i === q.answer) cls = 'is-right';
        else if (i === round.answered) cls = 'is-wrong';
        else cls = 'is-dim';
      }
      const mark = answered && i === q.answer ? `<span class="opt-mark">${ICON.check}</span>`
        : answered && i === round.answered ? `<span class="opt-mark">${ICON.close}</span>` : '';
      return `<button class="opt ${cls}" data-act="pick" data-i="${i}" ${answered ? 'disabled' : ''}>
        <span class="opt-key">${LETTERS[i]}</span>
        <span class="opt-text">${U.esc(text)}</span>
        ${mark}
      </button>`;
    }).join('');

    const ok = answered && round.answered === q.answer;
    const feedback = answered ? `
      <div class="feedback ${ok ? 'ok' : 'no'}">
        <div class="fb-head">
          <span class="fb-icon">${ok ? ICON.check : ICON.close}</span>
          <span>${U.esc(I18N.t(ok ? 'panel.quiz.right' : 'panel.quiz.wrong'))} · <b>${U.esc(q.answerText)}</b></span>
          ${round.lastAwarded > 0 ? `<span class="fb-lotus">${ICON.lotus}${U.esc(I18N.t('panel.quiz.lotus'))}</span>` : ''}
        </div>
        <p class="fb-meaning">${U.esc(q.meaning)}</p>
        <button class="btn primary wide" data-act="nextq">${U.esc(I18N.t(isLast ? 'panel.quiz.results' : 'panel.quiz.nextq'))}${ICON.arrow}</button>
      </div>
    ` : '';

    panel.innerHTML = `
      <div class="panel-inner quiz">
        <div class="quiz-top">
          <div class="dots">${dots}</div>
          <span class="qcount">${I18N.t('panel.quiz.qcount', { n: round.qi + 1 })}</span>
        </div>
        <div class="eyebrow">${ICON.spark}<span>${U.esc(q.title)}</span></div>
        <h2 class="panel-title question">${U.esc(q.prompt)}</h2>
        <div class="options">${options}</div>
        ${feedback}
        ${!answered ? `<button class="btn ghost small" data-act="quit">${U.esc(I18N.t('panel.quiz.quit'))}</button>` : ''}
      </div>
    `;
  }

  function renderSummaryPanel(place) {
    const panel = $('#panel');
    const tier = round.tier;
    const pct = Math.round((round.correct / 5) * 100);
    const summaryPhoto = photoOf(place);
    const summaryCredit = summaryPhoto ? I18N.credit(Media.creditFor(summaryPhoto)) : '';
    const next = suggestPlaces(place, 1)[0];
    const nextPhoto = next ? photoOf(next) : '';
    const nextLocked = next ? isLocked(next) : false;
    const nextClue = next ? String(I18N.code() === 'vi' ? next.story || '' : I18N.placeStory(next)).replace(/\s+/g, ' ').trim() : '';
    const tierHtml = tier ? `
      <div class="tier-badge tier-${tier.toLowerCase()}">
        <span class="tier-icon">${tier === 'Master' ? ICON.trophy : tier === 'Pro' ? ICON.spark : ICON.check}</span>
        <span class="tier-main">${TIERS[tier]}</span>
        <span class="tier-sub">${U.esc(I18N.t('tier.' + tier.toLowerCase() + '.sub'))}</span>
      </div>` : `<div class="tier-badge tier-none">${U.esc(I18N.t('panel.summary.tierNone'))}</div>`;

    panel.innerHTML = `
      <div class="panel-inner summary">
        <div class="score-wrap">
          <div class="score-ring" style="--pct:${pct}">
            <div class="score-inner"><b>${round.correct}</b><span>/5</span></div>
          </div>
          <div class="score-side">
            <div class="eyebrow">${ICON.compass}<span>${U.esc(I18N.t('panel.summary.eyebrow'))}</span></div>
            <h2 class="panel-title reveal">${U.esc(place.name)}</h2>
            <p class="muted">${U.esc(place.province)} · ${U.esc(I18N.region(place.region))}</p>
          </div>
        </div>
        ${summaryPhoto ? `<figure class="summary-photo">
          <img src="${U.esc(summaryPhoto)}" alt="${U.esc(place.name)}" loading="lazy" decoding="async">
          <figcaption>${ICON.camera}<span>${U.esc(summaryCredit || I18N.t('panel.summary.credit'))}</span></figcaption>
        </figure>` : ''}
        ${tierHtml}
        <p class="panel-lede">${U.esc(Quiz.guide.summary(round.correct, tier, place))}</p>
        <div class="reward-line">
          <span class="reward-lotus">${ICON.lotus}<b>+${round.awarded}</b></span>
          <span>${U.esc(I18N.t('panel.summary.awarded'))}</span>
          <span class="reward-total">${U.esc(I18N.t('panel.summary.total', { n: U.nf(S.lotus) }))}</span>
        </div>
        <div class="panel-actions">
          <button class="btn primary" data-act="tour">${ICON.camera}${U.esc(I18N.t('panel.summary.tour'))}</button>
          <button class="btn ghost" data-act="next">${U.esc(I18N.t(round.correct >= 3 ? 'panel.summary.next' : 'panel.intro.skip'))}${ICON.arrow}</button>
          <button class="btn ghost small" data-act="retry">${U.esc(I18N.t('panel.summary.retry'))}</button>
        </div>
        ${next ? `<div class="next-teaser">
          <div class="next-kicker">${ICON.compass}<span>${U.esc(I18N.t('panel.summary.nextKicker'))}</span><small>${U.esc(I18N.region(next.region))}</small></div>
          <button class="next-card" data-open="${next.id}">
            ${thumbHtml(next, 'next-img' + (nextLocked ? ' locked' : ''))}
            <span class="next-main">
              <b>${U.esc(next.name)}</b>
              <small>${U.esc(next.province)} · ${U.esc(kindName(next))}</small>
              <em>${U.esc(nextClue.slice(0, 104))}${nextClue.length > 104 ? '…' : ''}</em>
            </span>
            <span class="next-go">${nextLocked ? `${ICON.lock}${U.esc(I18N.t('panel.summary.lockedCost', { n: unlockCost(next) }))}` : U.esc(I18N.t('panel.summary.discover'))}${ICON.arrow}</span>
          </button>
        </div>` : ''}
        <p class="panel-note">${U.esc(I18N.t('panel.summary.note'))}</p>
      </div>
    `;
  }

  function renderLockedPanel(place) {
    const panel = $('#panel');
    const cost = unlockCost(place);
    const enough = S.lotus >= cost;
    const pct = Math.min(100, Math.round((S.lotus / cost) * 100));
    panel.innerHTML = `
      <div class="panel-inner locked">
        <div class="lock-badge">${ICON.lock}</div>
        <div class="eyebrow">${ICON.spark}<span>${U.esc(I18N.t('panel.locked.eyebrow'))}</span></div>
        <h2 class="panel-title reveal">${U.esc(place.name)}</h2>
        <p class="muted">${U.esc(place.province)} · ${U.esc(I18N.region(place.region))}</p>
        <p class="panel-lede">${I18N.t('panel.locked.lede', { chapter: U.esc(chapterName(place.fame)) })}</p>
        <div class="unlock-meter">
          <div class="meter-head"><span>${U.esc(I18N.t('panel.locked.meter'))}</span><b>${U.nf(S.lotus)} / ${cost}</b></div>
          <div class="meter-bar"><i style="width:${pct}%"></i></div>
        </div>
        <div class="panel-actions">
          <button class="btn primary" data-act="unlock" ${enough ? '' : 'disabled'}>${ICON.lotus}${U.esc(I18N.t('panel.locked.unlock', { cost }))}</button>
          <button class="btn ghost" data-act="skip">${U.esc(I18N.t('panel.intro.skip'))}</button>
        </div>
        <p class="panel-note">${U.esc(I18N.t(enough ? 'panel.locked.enough' : 'panel.locked.need'))}</p>
      </div>
    `;
  }

  /* ---------------- Vòng chơi ---------------- */
  function startRound() {
    const place = currentPlace();
    if (!place || isLocked(place)) return;
    round = {
      placeId: place.id,
      quiz: Quiz.build(place),
      qi: 0,
      correct: 0,
      awarded: 0,
      lastAwarded: 0,
      answered: null,
      results: [],
      done: false,
      tier: null,
      startedAt: Date.now(),
    };
    U.audio.unlock();
    U.audio.click();
    renderPlay();
  }

  function pickAnswer(index) {
    if (!round || round.done || round.answered != null) return;
    const place = currentPlace();
    const q = round.quiz.questions[round.qi];
    const ok = index === q.answer;
    round.answered = index;
    round.results[round.qi] = ok;
    round.lastAwarded = 0;

    if (ok) {
      round.correct++;
      const earnedForPlace = S.earned[place.id] || (S.earned[place.id] = []);
      if (!earnedForPlace.includes(q.key)) {
        earnedForPlace.push(q.key);
        S.lotus++;
        round.awarded++;
        round.lastAwarded = 1;
        save();
        U.audio.lotus();
        pulseLotus();
      }
      U.audio.correct();
    } else {
      U.audio.wrong();
    }
    save();
    renderPlay();
  }

  function nextQuestion() {
    if (!round || round.answered == null) return;
    if (round.qi < round.quiz.questions.length - 1) {
      round.qi++;
      round.answered = null;
      round.lastAwarded = 0;
      U.audio.click();
      renderPlay();
    } else {
      finishRound();
    }
  }

  function finishRound() {
    const place = currentPlace();
    round.done = true;
    round.tier = round.quiz.tierFor(round.correct);
    const prev = S.best[place.id];
    const record = { correct: round.correct, tier: round.tier, date: Date.now() };
    if (!prev || record.correct > prev.correct) S.best[place.id] = record;
    S.plays++;
    S.visited[place.id] = S.visited[place.id] || Date.now();
    save();
    renderPlay();

    if (round.correct >= 3) {
      U.audio.fanfare();
    }
    if (round.correct === 5) {
      setTimeout(() => openFx(place), 420);
    }
  }

  /* ---------------- Pháo hoa ---------------- */
  let fxTimer = null;
  function openFx(place) {
    const fx = $('#fx');
    if (!fx) return;
    $('#fxPlace').textContent = place.name;
    fx.hidden = false;
    setTimeout(() => fx.classList.add('show'), 20);
    Fireworks.start($('#fw'), { count: 4 });
    clearInterval(fxTimer);
    fxTimer = setInterval(() => Fireworks.burst(2), 2400);
    U.audio.firework();
  }

  function closeFx() {
    const fx = $('#fx');
    if (!fx || fx.hidden) return;
    clearInterval(fxTimer);
    fxTimer = null;
    Fireworks.stop();
    fx.classList.remove('show');
    setTimeout(() => { fx.hidden = true; }, 260);
  }

  /* ---------------- Hành trình ---------------- */
  function unlockedCount() { return Object.keys(S.unlocked).length; }
  function masteredCount() {
    return Object.values(S.best).filter((b) => b.tier === 'Master').length;
  }
  function tierCount(tier) {
    return Object.values(S.best).filter((b) => b.tier === tier).length;
  }

  function placeCard(place) {
    const best = S.best[place.id];
    const locked = isLocked(place);
    const toured = !!S.tours[place.id];
    const cls = ['place-card'];
    if (locked) cls.push('locked');
    if (best && best.tier) cls.push('tier-' + best.tier.toLowerCase());
    if (best && best.correct === 5) cls.push('perfect');
    if (S.visited[place.id]) cls.push('visited');
    if (toured) cls.push('toured');
    const badge = locked ? `<span class="pc-badge lock">${ICON.lock}${unlockCost(place)}</span>`
      : best ? `<span class="pc-badge score">${best.correct}/5</span>` : '';
    const tourMark = toured ? `<span class="pc-tour" title="${U.esc(I18N.t('journey.toured'))}">${ICON.camera}</span>` : '';
    return `<button class="${cls.join(' ')}" data-open="${place.id}" title="${U.esc(place.name)} – ${U.esc(place.province)}">
      ${thumbHtml(place, 'pc-thumb')}
      <span class="pc-main">
        <span class="pc-name">${U.esc(place.name)}</span>
        <span class="pc-province">${U.esc(place.province)}</span>
      </span>
      ${badge}${tourMark}
    </button>`;
  }

  function renderJourney() {
    const wrap = $('#journeyBody');
    const search = $('#journeySearch');
    if (!wrap) return;
    const stats = $('#journeyStats');
    if (stats) {
      stats.innerHTML = `
        <div class="jstat"><span class="jstat-ic">${ICON.compass}</span><b>${U.nf(Object.keys(S.visited).length)}</b><span>${U.esc(I18N.t('journey.stat.visited'))}</span></div>
        <div class="jstat"><span class="jstat-ic">${ICON.trophy}</span><b>${U.nf(masteredCount())}</b><span>Master</span></div>
        <div class="jstat"><span class="jstat-ic lotus">${ICON.lotus}</span><b>${U.nf(S.lotus)}</b><span>${U.esc(I18N.t('journey.stat.lotus'))}</span></div>
        <div class="jstat"><span class="jstat-ic">${ICON.lock}</span><b>${U.nf(unlockedCount())}</b><span>${U.esc(I18N.t('journey.stat.unlocked'))}</span></div>
      `;
    }

    const q = (search ? search.value : '').trim().toLowerCase();
    if (q.length >= 2) {
      const results = PLACES.filter((p) => p.name.toLowerCase().includes(q) || p.province.toLowerCase().includes(q)).slice(0, 48);
      wrap.innerHTML = results.length
        ? `<div class="search-head">${U.esc(I18N.t('journey.results', { n: results.length, q: search.value.trim() }))}</div><div class="place-grid">${results.map(placeCard).join('')}</div>`
        : `<div class="empty">${U.esc(I18N.t('journey.empty'))}</div>`;
      return;
    }

    const current = currentPlace();
    const rail = suggestPlaces(current || chooseStart(), 4).map((p) => `
      <button class="rail-card" data-open="${p.id}">
        ${thumbHtml(p, 'rail-thumb')}
        <span class="rail-main">
          <b>${U.esc(p.name)}</b>
          <small>${U.esc(p.province)} · ${U.esc(p.kindLabel)}</small>
        </span>
        <span class="rail-stars">${stars(p.fame)}</span>
      </button>`).join('');
    wrap.innerHTML = `<section class="rail-wrap">
      <div class="rail-head">
        <span class="rail-title">${ICON.compass}${U.esc(I18N.t('journey.railTitle'))}</span>
        <span class="rail-sub">${U.esc(I18N.t('journey.railSub'))}</span>
      </div>
      <div class="suggest-rail">${rail}</div>
    </section>` + chapters.map((ch) => {
      const open = openChapters.has(ch.fame);
      const done = ch.places.filter((p) => S.best[p.id] && S.best[p.id].tier).length;
      const locked = ch.lock;
      return `<section class="chapter ${open ? 'open' : ''} ${locked ? 'chapter-locked' : ''}">
        <button class="chapter-head" data-act="toggle-chapter" data-fame="${ch.fame}">
          <span class="ch-fame">${stars(ch.fame)}</span>
          <span class="ch-main">
            <span class="ch-title">${U.esc(chapterName(ch.fame))} ${locked ? `<span class="ch-lock">${ICON.lock}</span>` : ''}</span>
            <span class="ch-sub">${U.esc(chapterSub(ch.fame))}</span>
          </span>
          <span class="ch-progress">${done}/${ch.places.length}</span>
          <span class="ch-chev">${ICON.arrow}</span>
        </button>
        ${open ? `<div class="chapter-body"><div class="place-grid">${ch.places.map(placeCard).join('')}</div></div>` : ''}
      </section>`;
    }).join('');

    if (current) openChapters.add(current.fame);
  }

  function toggleChapter(fame) {
    if (openChapters.has(fame)) openChapters.delete(fame);
    else openChapters.add(fame);
    renderJourney();
  }

  /* ---------------- Thành tích ---------------- */
  function renderAchv() {
    const wrap = $('#achvBody');
    if (!wrap) return;
    const tiers = ['Master', 'Pro', 'Task'].map((tier) => `
      <div class="tier-card tier-${tier.toLowerCase()}">
        <div class="tier-card-top">
          <span class="tier-medal">${tier === 'Master' ? ICON.trophy : tier === 'Pro' ? ICON.spark : ICON.check}</span>
          <span class="tier-card-name">${TIERS[tier]}</span>
          <span class="tier-card-sub">${U.esc(I18N.t('tier.' + tier.toLowerCase() + '.sub'))}</span>
        </div>
        <b class="tier-count">${U.nf(tierCount(tier))}</b>
        <span class="tier-unit">${U.esc(I18N.t('achv.tierUnit', { tier: TIERS[tier] }))}</span>
      </div>`).join('');

    const recent = Object.entries(S.best)
      .filter(([, b]) => b && b.tier)
      .sort((a, b) => (b.date || 0) - (a.date || 0))
      .slice(0, 24)
      .map(([id, b]) => {
        const p = byId.get(id);
        if (!p) return '';
        return `<button class="recent-row" data-open="${id}">
          <span class="recent-name">${U.esc(p.name)}<small>${U.esc(p.province)}</small></span>
          <span class="tier-pill tier-pill-${b.tier.toLowerCase()}">${b.tier}</span>
          <span class="recent-score">${b.correct}/5</span>
          <span class="recent-date">${U.esc(I18N.date(b.date))}</span>
        </button>`;
      }).join('');

    const played = Object.keys(S.best).length;
    const player = Identity.active();
    const playerStrip = player ? `
      <div class="achv-player">
        <span class="acct-avatar sm">${avatarHtml(player, playerLabel(player))}</span>
        <div class="acct-who"><b>${U.esc(playerLabel(player))}</b><code>${U.esc(player.id)}</code></div>
        <button class="btn ghost small" data-act="acct-open">${U.esc(I18N.t('acct.open'))}</button>
      </div>` : '';
    wrap.innerHTML = `
      ${playerStrip}
      <div class="achv-stats">
        <div class="astat"><b>${U.nf(S.lotus)}</b><span>${U.esc(I18N.t('achv.stat.lotus'))}</span></div>
        <div class="astat"><b>${U.nf(played)}</b><span>${U.esc(I18N.t('achv.stat.done'))}</span></div>
        <div class="astat"><b>${U.nf(S.plays)}</b><span>${U.esc(I18N.t('achv.stat.plays'))}</span></div>
        <div class="astat"><b>${U.nf(Object.keys(S.tours).length)}</b><span>${U.esc(I18N.t('achv.stat.tours'))}</span></div>
        <div class="astat"><b>${U.nf(unlockedCount())}</b><span>${U.esc(I18N.t('achv.stat.unlocked'))}</span></div>
      </div>
      <div class="tier-grid">${tiers}</div>
      <div class="achv-section">
        <h3>${U.esc(I18N.t('achv.recent'))}</h3>
        ${recent ? `<div class="recent-list">${recent}</div>` : `<div class="empty">${U.esc(I18N.t('achv.empty'))}</div>`}
      </div>
      <div class="achv-foot">
        <button class="btn ghost danger" data-act="reset">${ICON.reset}${U.esc(I18N.t('achv.reset'))}</button>
      </div>
    `;
  }

  /* ---------------- Bản đồ: dựng giao diện ---------------- */
  function renderMapStats() {
    const wrap = $('#mapStats');
    if (!wrap) return;
    let visitedProv = 0;
    provIndex.forEach((rec) => { if (rec.places.some((p) => S.visited[p.id])) visitedProv++; });
    const regions = REGION_ORDER.filter((r) => [...provIndex.values()].some((rec) => rec.region === r)).length;
    wrap.innerHTML = `
      <div class="jstat"><span class="jstat-ic">${ICON.map}</span><b>${U.nf(mapRows.length)}</b><span>${U.esc(I18N.t('map.stat.provinces'))}</span></div>
      <div class="jstat"><span class="jstat-ic">${ICON.pin}</span><b>${U.nf(PLACES.length)}</b><span>${U.esc(I18N.t('map.stat.places'))}</span></div>
      <div class="jstat"><span class="jstat-ic">${ICON.layers}</span><b>${U.nf(regions)}</b><span>${U.esc(I18N.t('map.stat.regions'))}</span></div>
      <div class="jstat"><span class="jstat-ic lotus">${ICON.lotus}</span><b>${U.nf(visitedProv)}</b><span>${U.esc(I18N.t('map.stat.visited'))}</span></div>
    `;
  }

  function renderMapLegend() {
    const el = $('#mapLegend');
    if (!el) return;
    el.innerHTML = `<span class="ml-label">${U.esc(I18N.t('map.legendLess'))}</span>
      <span class="ml-scale" aria-hidden="true"><i class="lvl-1"></i><i class="lvl-2"></i><i class="lvl-3"></i><i class="lvl-4"></i></span>
      <span class="ml-label">${U.esc(I18N.t('map.legendMore'))}</span>`;
  }

  function renderMap() {
    const canvas = $('#mapCanvas');
    if (!canvas) return;
    if (!mapRows.length || !window.ProvincesMap) {
      canvas.innerHTML = `<div class="empty">${U.esc(I18N.t('map.empty'))}</div>`;
      return;
    }
    if (!mapApi || mapLang !== I18N.code()) {
      mapApi = ProvincesMap.render(canvas, mapRows, {
        aria: I18N.t('map.aria', { n: mapRows.length }),
        ariaFor: (row) => I18N.t('map.ariaProv', { name: row.name, n: row.count, region: I18N.region(row.region) }),
        titleFor: (row) => `${row.name} · ${I18N.t('map.places', { n: row.count })}`,
        tipFor: (row) => `<b>${U.esc(row.name)}</b><span>${U.esc(I18N.t('map.tip', { n: row.count, region: I18N.region(row.region) }))}</span>`,
        onSelect: (key) => selectProvince(key, true),
        selected: mapSel,
        tipEl: $('#mapTip'),
      });
      mapLang = I18N.code();
    } else {
      mapApi.select(mapSel);
    }
    renderMapStats();
    renderMapLegend();
    renderMapSide();
  }

  function provincePill(rec) {
    const stat = provinceProgress(rec);
    return `<button class="ms-pill ${mapSel === rec.key ? 'is-on' : ''} ${stat.visited ? 'has-visit' : ''}" data-prov="${rec.key}">
      <span class="ms-pill-name">${U.esc(rec.name)}</span>
      <span class="ms-pill-count">${U.nf(rec.places.length)}</span>
    </button>`;
  }

  function mapListHtml() {
    const groups = REGION_ORDER.map((region) => ({
      region,
      items: [...provIndex.values()].filter((rec) => rec.region === region)
        .sort((a, b) => b.places.length - a.places.length || a.name.localeCompare(b.name, 'vi')),
    })).filter((g) => g.items.length);
    return `<div class="ms-head">
        <span class="ms-kicker">${U.esc(I18N.t('map.eyebrow'))}</span>
        <h2>${U.esc(I18N.t('map.all'))}</h2>
        <p class="ms-sub">${U.esc(I18N.t('map.allSub'))}</p>
      </div>
      <div class="ms-regions">${groups.map((g) => `
        <section class="ms-region">
          <h3>${U.esc(I18N.region(g.region))}<span>${g.items.length}</span></h3>
          <div class="ms-pills">${g.items.map(provincePill).join('')}</div>
        </section>`).join('')}
      </div>`;
  }

  function mapPlaceRow(place) {
    const best = S.best[place.id];
    const meta = best && best.tier
      ? `<span class="tier-pill tier-pill-${best.tier.toLowerCase()}">${best.tier}</span>`
      : S.visited[place.id]
        ? `<span class="ms-flag">${ICON.check}</span>`
        : `<span class="ms-fame">${ICON.star}${place.fame}</span>`;
    const sub = [kindName(place), place.specialty].filter(Boolean).join(' · ');
    return `<button class="ms-place" data-open="${place.id}">
      ${thumbHtml(place, 'ms-thumb')}
      <span class="ms-place-main">
        <b>${U.esc(place.name)}</b>
        <small>${U.esc(sub)}</small>
      </span>
      <span class="ms-place-meta">${meta}</span>
    </button>`;
  }

  function mapSearchHtml(raw) {
    const q = foldName(raw);
    const provs = [...provIndex.values()].filter((rec) =>
      foldName(rec.name).includes(q) || [...rec.olds].some((old) => foldName(old).includes(q))
    ).sort((a, b) => b.places.length - a.places.length || a.name.localeCompare(b.name, 'vi'));
    const places = PLACES.filter((p) =>
      foldName(p.name).includes(q) || foldName(p.specialty || '').includes(q) || foldName(p.province).includes(q)
    ).slice(0, 30);
    const none = !provs.length && !places.length;
    return `<div class="ms-head compact">
        <span class="ms-kicker">${U.esc(I18N.t('map.search'))}</span>
        <h2>${U.esc(raw.trim())}</h2>
      </div>
      ${provs.length ? `<section class="ms-sec">
        <h3>${U.esc(I18N.t('map.resultsProv'))}<span>${provs.length}</span></h3>
        <div class="ms-pills">${provs.map(provincePill).join('')}</div>
      </section>` : ''}
      ${places.length ? `<section class="ms-sec">
        <h3>${U.esc(I18N.t('map.resultsPlace'))}<span>${places.length}</span></h3>
        <div class="ms-places">${places.map(mapPlaceRow).join('')}</div>
      </section>` : ''}
      ${none ? `<div class="empty">${U.esc(I18N.t('map.empty'))}</div>` : ''}`;
  }

  function mapDetailHtml(key) {
    const rec = provIndex.get(key);
    const row = mapRows.find((r) => r.key === key) || { a: 0 };
    const list = provincePlaces(rec);
    const stat = provinceProgress(rec);
    const hero = list[0] ? Media.provincePhoto(list[0]) : '';
    const credit = hero ? Media.creditFor(hero) : '';
    const feature = list[0];
    const rest = list.slice(1);
    const shown = mapShowAll ? rest : rest.slice(0, 6);
    const area = row.a ? ` · ${I18N.t('map.area', { n: U.nf(row.a) })}` : '';
    const moreLabel = mapShowAll ? I18N.t('map.collapse') : I18N.t('map.showAll', { n: rest.length });
    return `<button class="ms-back" data-act="map-clear">${ICON.arrow}<span>${U.esc(I18N.t('map.back'))}</span></button>
      <div class="ms-hero">
        ${hero ? `<img src="${U.esc(hero)}" alt="" loading="lazy" decoding="async">` : ''}
        <span class="ms-hero-shade"></span>
        <div class="ms-hero-copy">
          <span class="ms-kicker">${U.esc(I18N.region(rec.region))}</span>
          <h2>${U.esc(rec.name)}</h2>
          <p>${U.esc(I18N.t('map.places', { n: rec.places.length }))}${U.esc(area)}</p>
        </div>
        ${credit ? `<span class="ms-credit">${U.esc(I18N.credit(credit))}</span>` : ''}
      </div>
      <p class="ms-lede">${U.esc(I18N.t('map.sideLede', { name: rec.name, region: I18N.region(rec.region), n: rec.places.length }))}</p>
      <div class="ms-stats">
        <div><b>${U.nf(stat.visited)}</b><span>${U.esc(I18N.t('map.explored'))}</span></div>
        <div><b>${U.nf(stat.mastered)}</b><span>Master</span></div>
        <div><b>${U.nf(rec.places.length)}</b><span>${U.esc(I18N.t('map.stat.places'))}</span></div>
      </div>
      ${feature ? `<div class="ms-feature">
        <span class="ms-feature-tag">${ICON.spark}${U.esc(I18N.t('map.highlights'))}</span>
        <h3>${U.esc(feature.name)}</h3>
        <p>${U.esc(clip(feature.story))}</p>
        <button class="btn ghost small" data-open="${feature.id}">${U.esc(I18N.t('map.openPlace'))}${ICON.arrow}</button>
      </div>` : ''}
      ${rest.length ? `<section class="ms-sec">
        <h3>${U.esc(I18N.t('map.resultsPlace'))}<span>${rest.length}</span></h3>
        <div class="ms-places">${shown.map(mapPlaceRow).join('')}</div>
        ${rest.length > 6 ? `<button class="btn ghost wide ms-more" data-act="${mapShowAll ? 'map-collapse' : 'map-all'}">${U.esc(moreLabel)}</button>` : ''}
      </section>` : ''}`;
  }

  function renderMapSide() {
    const side = $('#mapSide');
    if (!side) return;
    const q = mapQuery.trim();
    if (q.length >= 2) side.innerHTML = mapSearchHtml(q);
    else if (mapSel && provIndex.has(mapSel)) side.innerHTML = mapDetailHtml(mapSel);
    else side.innerHTML = mapListHtml();
  }

  function selectProvince(key, fromMap) {
    if (!provIndex.has(key)) return;
    mapSel = key;
    mapShowAll = false;
    mapQuery = '';
    const input = $('#mapSearch');
    if (input) input.value = '';
    if (mapApi) mapApi.select(key);
    renderMapStats();
    renderMapSide();
    if (fromMap && window.matchMedia('(max-width: 980px)').matches) {
      const side = $('#mapSide');
      if (side) setTimeout(() => {
        const bar = $('.topbar');
        const top = side.getBoundingClientRect().top + window.scrollY - ((bar ? bar.offsetHeight : 0) + 10);
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }, 80);
    }
  }

  function clearMapSel() {
    mapSel = null;
    mapShowAll = false;
    mapQuery = '';
    const input = $('#mapSearch');
    if (input) input.value = '';
    if (mapApi) mapApi.select(null);
    renderMapStats();
    renderMapSide();
  }

  /* ---------------- Tri thức vùng miền ---------------- */
  const TOPIC_ICON = {
    mixed: ICON.spark,
    history: ICON.book,
    geography: ICON.mountain,
    culture: ICON.music,
    festival: ICON.flag,
    specialty: ICON.bowl,
  };

  function knowRegionKey(name) {
    const rec = Knowledge.regionByName(name);
    return rec ? rec.key : '';
  }

  function knowPhoto(regionName) {
    const list = PLACES.filter((p) => p.region === regionName)
      .sort((a, b) => b.fame - a.fame || a.name.localeCompare(b.name, 'vi'));
    const withPhoto = list.find((p) => Media.photo(p.id)) || list.find((p) => Media.provincePhoto(p));
    const place = withPhoto || list[0] || null;
    const img = place ? (Media.photo(place.id) || Media.provincePhoto(place)) : '';
    return { place, img, credit: img ? Media.creditFor(img) : '' };
  }

  function knowProvinceCount(name) {
    const rec = provIndex.get(foldName(name));
    return rec ? rec.places.length : 0;
  }

  function knowProvincePill(name) {
    return `<button class="ms-pill know-prov" data-kprov="${U.esc(name)}">
      <span>${U.esc(name)}</span>
      <span class="ms-pill-count">${U.nf(knowProvinceCount(name))}</span>
    </button>`;
  }

  function knowChips(list, max = 14) {
    if (!list.length) return '';
    const shown = list.slice(0, max);
    const more = list.length - shown.length;
    return `<div class="know-chips">${shown.map((v) => `<span class="know-chip">${U.esc(v)}</span>`).join('')}
      ${more > 0 ? `<span class="know-chip more">+${more}</span>` : ''}</div>`;
  }

  function knowTimeline(facts) {
    if (!facts.length) return '';
    return `<div class="know-timeline">${facts.map((f) => `
      <button class="know-fact" data-kprov="${U.esc(f.province)}">
        <span class="know-fact-dot"></span>
        <span class="know-fact-main"><b>${U.esc(f.label)}</b><small>${U.esc(f.province)}</small></span>
        ${ICON.arrow}
      </button>`).join('')}</div>`;
  }

  function knowTopicCard(topic, text, extra) {
    return `<section class="know-topic">
      <header>
        <span class="know-topic-ic">${TOPIC_ICON[topic] || ICON.spark}</span>
        <h3>${U.esc(I18N.t('knowledge.topics.' + topic))}</h3>
      </header>
      <p>${U.esc(text)}</p>
      ${extra || ''}
    </section>`;
  }

  function knowRegionCard(region) {
    const info = Knowledge.regionInfo(region.name);
    const hero = knowPhoto(region.name);
    const key = region.key;
    return `<button class="know-card" data-kregion="${U.esc(region.name)}">
      <span class="know-card-media">
        ${hero.img ? `<img src="${U.esc(hero.img)}" alt="" loading="lazy" decoding="async">` : ''}
        <span class="know-card-shade"></span>
      </span>
      <span class="know-card-copy">
        <span class="know-card-kicker">${info.provinces.length} ${U.esc(I18N.t('knowledge.stat.provincesShort'))} · ${U.nf(PLACES.filter((p) => p.region === region.name).length)} ${U.esc(I18N.t('knowledge.stat.placesShort'))}</span>
        <b>${U.esc(I18N.region(region.name))}</b>
        <span class="know-card-tag">${U.esc(I18N.t('knowledge.region.' + key + '.tagline'))}</span>
        <span class="know-card-meta">
          <span>${info.specialties.length} ${U.esc(I18N.t('knowledge.stat.specialtiesShort'))}</span>
          <span>${info.festivals.length} ${U.esc(I18N.t('knowledge.stat.festivalsShort'))}</span>
        </span>
        <span class="know-card-go">${U.esc(I18N.t('knowledge.detail.open'))}${ICON.arrow}</span>
      </span>
    </button>`;
  }

  function knowHomeHtml() {
    const stats = Knowledge.stats();
    const cards = Knowledge.regions().map(knowRegionCard).join('');
    return `<div class="journey-stats">
        <div class="jstat"><span class="jstat-ic">${ICON.layers}</span><b>${U.nf(stats.regions)}</b><span>${U.esc(I18N.t('knowledge.stat.regions'))}</span></div>
        <div class="jstat"><span class="jstat-ic">${ICON.map}</span><b>${U.nf(stats.provinces)}</b><span>${U.esc(I18N.t('knowledge.stat.provinces'))}</span></div>
        <div class="jstat"><span class="jstat-ic">${ICON.bowl}</span><b>${U.nf(stats.specialties)}</b><span>${U.esc(I18N.t('knowledge.stat.specialties'))}</span></div>
        <div class="jstat"><span class="jstat-ic">${ICON.flag}</span><b>${U.nf(stats.festivals)}</b><span>${U.esc(I18N.t('knowledge.stat.festivals'))}</span></div>
      </div>
      <div class="know-grid">${cards}</div>
      <div class="know-quiz-promo">
        <span class="know-quiz-promo-ic">${TOPIC_ICON.mixed}</span>
        <div>
          <b>${U.esc(I18N.t('knowledge.quiz.promoTitle'))}</b>
          <p>${U.esc(I18N.t('knowledge.quiz.promoText'))}</p>
        </div>
        <button class="btn primary" data-ktab="quiz">${U.esc(I18N.t('knowledge.quiz.start'))}${ICON.arrow}</button>
      </div>`;
  }

  function knowRegionHtml() {
    const name = knowRegion;
    const region = Knowledge.regionByName(name);
    if (!region) return knowHomeHtml();
    const key = region.key;
    const info = Knowledge.regionInfo(name);
    const provs = info.provinces.slice().sort((a, b) => knowProvinceCount(b) - knowProvinceCount(a) || a.localeCompare(b, 'vi'));
    const hero = knowPhoto(name);
    const placeCount = PLACES.filter((p) => p.region === name).length;
    const area = mapRows.filter((r) => r.region === name).reduce((n, r) => n + Number(r.a || 0), 0);
    const terrainCount = {};
    Knowledge.provincesOf(name).forEach((p) => { terrainCount[p.terrain] = (terrainCount[p.terrain] || 0) + 1; });
    const terrainChips = `<div class="know-chips">${Object.entries(terrainCount)
      .sort((a, b) => b[1] - a[1])
      .map(([t, n]) => `<span class="know-chip terrain"><i>${U.esc(I18N.t('knowledge.terrain.' + t))}</i>${n}</span>`).join('')}</div>`;
    const top = PLACES.filter((p) => p.region === name)
      .sort((a, b) => b.fame - a.fame || a.name.localeCompare(b.name, 'vi')).slice(0, 6);
    const copy = (field) => I18N.t('knowledge.region.' + key + '.' + field);
    const quizSize = Math.min(Knowledge.roundSize, Knowledge.bankSize('mixed', name));
    return `<button class="ms-back" data-act="know-back">${ICON.arrow}<span>${U.esc(I18N.t('knowledge.detail.back'))}</span></button>
      <div class="know-hero">
        ${hero.img ? `<img src="${U.esc(hero.img)}" alt="" loading="lazy" decoding="async">` : ''}
        <span class="know-hero-shade"></span>
        <div class="know-hero-copy">
          <span class="ms-kicker">${U.esc(I18N.t('knowledge.eyebrow'))}</span>
          <h2>${U.esc(I18N.region(name))}</h2>
          <p>${U.esc(copy('tagline'))}</p>
        </div>
        ${hero.credit ? `<span class="ms-credit">${U.esc(I18N.credit(hero.credit))}</span>` : ''}
      </div>
      <div class="know-rstats">
        <div><b>${info.provinces.length}</b><span>${U.esc(I18N.t('knowledge.stat.provinces'))}</span></div>
        <div><b>${U.nf(placeCount)}</b><span>${U.esc(I18N.t('knowledge.stat.places'))}</span></div>
        <div><b>${U.nf(area)}</b><span>${U.esc(I18N.t('knowledge.stat.area'))}</span></div>
        <div><b>${info.festivals.length}</b><span>${U.esc(I18N.t('knowledge.stat.festivals'))}</span></div>
      </div>
      <div class="know-topics">
        ${knowTopicCard('history', copy('history'), knowTimeline(info.history))}
        ${knowTopicCard('geography', copy('geography'), terrainChips)}
        ${knowTopicCard('culture', copy('culture'), knowChips(info.cultures))}
        ${knowTopicCard('festival', copy('festival'), knowChips(info.festivals))}
        ${knowTopicCard('specialty', copy('specialty'), knowChips(info.specialties))}
      </div>
      <section class="know-sec">
        <h2>${U.esc(I18N.t('knowledge.detail.provinces'))}<span>${info.provinces.length}</span></h2>
        <p class="know-hint">${U.esc(I18N.t('knowledge.detail.provinceHint'))}</p>
        <div class="ms-pills">${provs.map(knowProvincePill).join('')}</div>
      </section>
      <section class="know-sec">
        <h2>${U.esc(I18N.t('knowledge.detail.places'))}<span>${placeCount}</span></h2>
        <div class="ms-places">${top.map(mapPlaceRow).join('')}</div>
      </section>
      <button class="know-quiz-cta" data-act="know-region-quiz" data-region="${U.esc(name)}">
        <span class="know-quiz-cta-ic">${TOPIC_ICON.mixed}</span>
        <span class="know-quiz-cta-copy">
          <b>${U.esc(I18N.t('knowledge.detail.quizCta'))}</b>
          <small>${U.esc(I18N.t('knowledge.detail.quizCtaSub', { n: quizSize }))}</small>
        </span>
        ${ICON.arrow}
      </button>`;
  }

  function knowBestKey(topic, region) {
    return topic + (region ? '@' + foldName(region) : '');
  }

  function knowQuizHomeHtml() {
    const topics = ['mixed'].concat(Knowledge.topics);
    const scopeLabel = knowScope ? I18N.t('knowledge.quiz.scopeRegion', { region: I18N.region(knowScope) }) : I18N.t('knowledge.quiz.scopeAll');
    const cards = topics.map((tp) => {
      const n = Knowledge.bankSize(tp, knowScope);
      return `<button class="kq-topic ${knowTopic === tp ? 'is-on' : ''}" data-ktopic="${tp}">
        <span class="kq-topic-ic">${TOPIC_ICON[tp] || ICON.spark}</span>
        <b>${U.esc(I18N.t('knowledge.topics.' + tp))}</b>
        <small>${U.esc(I18N.t('knowledge.topicDesc.' + tp))}</small>
        <span class="kq-topic-n">${U.esc(I18N.t('knowledge.quiz.questionCount', { n }))}</span>
      </button>`;
    }).join('');
    const size = Math.min(Knowledge.roundSize, Knowledge.bankSize(knowTopic, knowScope));
    const best = S.knowledge.best[knowBestKey(knowTopic, knowScope)];
    return `<div class="kq-home">
      <div class="kq-scope">
        <span>${U.esc(I18N.t('knowledge.quiz.scope'))}</span>
        <b>${U.esc(scopeLabel)}</b>
        ${knowScope ? `<button class="btn ghost small" data-act="know-scope-clear">${U.esc(I18N.t('knowledge.quiz.scopeClear'))}</button>` : ''}
      </div>
      <div class="kq-topics">${cards}</div>
      <div class="kq-start">
        <div class="kq-start-info">
          <b>${U.esc(I18N.t('knowledge.quiz.ready', { n: size }))}</b>
          <small>${U.esc(I18N.t('knowledge.quiz.readySub'))}</small>
          ${best ? `<span class="kq-best">${U.esc(I18N.t('knowledge.quiz.best', { score: best.score, total: best.total }))}</span>` : ''}
        </div>
        <button class="btn primary" data-act="know-start" ${size ? '' : 'disabled'}>${U.esc(I18N.t('knowledge.quiz.start'))}${ICON.arrow}</button>
      </div>
    </div>`;
  }

  function knowResultHtml() {
    const r = knowQuiz;
    const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
    const rank = pct >= 90 ? 'master' : pct >= 70 ? 'explorer' : pct >= 50 ? 'traveler' : 'rookie';
    const best = S.knowledge.best[knowBestKey(r.topic, r.region)];
    return `<div class="kq-result">
      <div class="kq-ring" style="--p:${pct}"><b>${r.score}</b><span>/${r.total}</span></div>
      <span class="kq-kicker">${U.esc(I18N.t('knowledge.quiz.resultKicker'))}</span>
      <h2>${U.esc(I18N.t('knowledge.quiz.rank.' + rank))}</h2>
      <p>${U.esc(I18N.t('knowledge.quiz.resultText', { score: r.score, total: r.total, topic: I18N.t('knowledge.topics.' + r.topic) }))}</p>
      ${best ? `<span class="kq-best">${U.esc(I18N.t('knowledge.quiz.best', { score: best.score, total: best.total }))}</span>` : ''}
      <div class="kq-actions">
        <button class="btn primary" data-act="know-replay">${U.esc(I18N.t('knowledge.quiz.replay'))}</button>
        <button class="btn ghost" data-act="know-exit">${U.esc(I18N.t('knowledge.quiz.exit'))}</button>
      </div>
    </div>`;
  }

  function knowQuizHtml() {
    const r = knowQuiz;
    if (r.done) return knowResultHtml();
    const spec = r.specs[r.index];
    if (!spec) return '';
    const correctIndex = spec.options.indexOf(spec.answer);
    const answered = r.answered != null;
    const good = answered && r.answered === correctIndex;
    const options = spec.options.map((value, i) => {
      let cls = '';
      if (answered) {
        if (i === correctIndex) cls = 'is-right';
        else if (i === r.answered) cls = 'is-wrong';
      }
      return `<button class="kq-opt ${cls}" data-kpick="${i}" ${answered ? 'disabled' : ''}>
        <span class="kq-letter">${LETTERS[i]}</span>
        <span class="kq-opt-text">${U.esc(Knowledge.optionLabel(spec, value))}</span>
        ${answered && i === correctIndex ? `<span class="kq-mark">${ICON.check}</span>` : ''}
        ${answered && i === r.answered && i !== correctIndex ? `<span class="kq-mark bad">${ICON.close}</span>` : ''}
      </button>`;
    }).join('');
    const pct = Math.round(((r.index + (answered ? 1 : 0)) / r.total) * 100);
    const last = r.index + 1 >= r.total;
    return `<div class="kq-run">
      <div class="kq-bar">
        <span>${U.esc(I18N.t('knowledge.quiz.question', { n: r.index + 1, total: r.total }))}</span>
        <div class="kq-prog"><i style="width:${pct}%"></i></div>
        <b>${r.score}</b>
      </div>
      <div class="kq-card">
        <div class="kq-tags">
          <span class="kq-tag">${U.esc(Knowledge.topicLabel(spec.topic))}</span>
          ${r.region ? `<span class="kq-tag ghost">${U.esc(I18N.region(r.region))}</span>` : ''}
        </div>
        <h2 class="kq-q">${U.esc(Knowledge.prompt(spec))}</h2>
        <div class="kq-opts">${options}</div>
        ${answered ? `<div class="kq-feedback ${good ? 'is-good' : 'is-bad'}">
          <b>${U.esc(I18N.t(good ? 'knowledge.quiz.right' : 'knowledge.quiz.wrong'))}</b>
          <p>${U.esc(Knowledge.explain(spec))}</p>
        </div>` : `<p class="kq-hint">${U.esc(I18N.t('knowledge.quiz.hint'))}</p>`}
        <div class="kq-actions">
          ${answered ? `<button class="btn primary" data-act="know-next">${U.esc(I18N.t(last ? 'knowledge.quiz.seeResult' : 'knowledge.quiz.next'))}${ICON.arrow}</button>` : ''}
        </div>
      </div>
    </div>`;
  }

  function renderKnowledge() {
    const body = $('#knowledgeBody');
    if (!body) return;
    $$('.ktab').forEach((b) => {
      const on = b.dataset.ktab === knowTab;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
    });
    body.innerHTML = knowTab === 'quiz'
      ? (knowQuiz ? knowQuizHtml() : knowQuizHomeHtml())
      : (knowRegion ? knowRegionHtml() : knowHomeHtml());
  }

  function switchKnowTab(tab) {
    knowTab = tab === 'quiz' ? 'quiz' : 'explore';
    renderKnowledge();
  }

  function openKnowRegion(name) {
    knowRegion = name || '';
    knowTab = 'explore';
    renderKnowledge();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startKnowQuiz(topic, region) {
    knowTopic = topic || knowTopic;
    if (region != null) knowScope = region;
    knowTab = 'quiz';
    knowQuiz = Knowledge.newRound(knowTopic, knowScope, Knowledge.roundSize);
    if (!knowQuiz.total) {
      knowQuiz = null;
      U.toast(I18N.t('knowledge.quiz.empty'), ICON.spark);
    }
    renderKnowledge();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function pickKnowAnswer(i) {
    if (!knowQuiz || knowQuiz.done || knowQuiz.answered != null) return;
    const spec = knowQuiz.specs[knowQuiz.index];
    if (!spec) return;
    knowQuiz.answered = i;
    const good = i === spec.options.indexOf(spec.answer);
    if (good) {
      knowQuiz.score++;
      U.audio.lotus();
    } else {
      U.audio.click();
    }
    renderKnowledge();
  }

  function nextKnowQuestion() {
    if (!knowQuiz || knowQuiz.done || knowQuiz.answered == null) return;
    if (knowQuiz.index + 1 >= knowQuiz.total) {
      const r = knowQuiz;
      r.done = true;
      const key = knowBestKey(r.topic, r.region);
      const prev = S.knowledge.best[key];
      if (!prev || r.score > prev.score) S.knowledge.best[key] = { score: r.score, total: r.total, at: Date.now() };
      S.knowledge.plays += 1;
      save();
      U.audio.lotus();
    } else {
      knowQuiz.index += 1;
      knowQuiz.answered = null;
    }
    renderKnowledge();
  }

  /* ---------------- Sự kiện ---------------- */
  document.addEventListener('click', (e) => {
    U.audio.unlock();
    const tab = e.target.closest('[data-view]');
    if (tab) {
      setView(tab.dataset.view);
      return;
    }
    const ktab = e.target.closest('[data-ktab]');
    if (ktab) {
      switchKnowTab(ktab.dataset.ktab);
      return;
    }
    const kregion = e.target.closest('[data-kregion]');
    if (kregion) {
      openKnowRegion(kregion.dataset.kregion);
      return;
    }
    const ktopic = e.target.closest('[data-ktopic]');
    if (ktopic) {
      knowTopic = ktopic.dataset.ktopic;
      renderKnowledge();
      return;
    }
    const kpick = e.target.closest('[data-kpick]');
    if (kpick) {
      pickKnowAnswer(Number(kpick.dataset.kpick));
      return;
    }
    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'start') startRound();
      else if (a === 'skip') nextPlace();
      else if (a === 'pick') pickAnswer(Number(act.dataset.i));
      else if (a === 'nextq') nextQuestion();
      else if (a === 'next') nextPlace();
      else if (a === 'retry') { round = null; startRound(); }
      else if (a === 'quit') { round = null; renderPlay(); U.toast(I18N.t('panel.quiz.quitToast')); }
      else if (a === 'unlock') unlockCurrent();
      else if (a === 'stage-mode') toggleStageMode();
      else if (a === 'tour') openTour();
      else if (a === 'fx-next') { closeFx(); nextPlace(); }
      else if (a === 'fx-close') closeFx();
      else if (a === 'toggle-chapter') toggleChapter(Number(act.dataset.fame));
      else if (a === 'map-clear') clearMapSel();
      else if (a === 'map-all') { mapShowAll = true; renderMapSide(); }
      else if (a === 'map-collapse') { mapShowAll = false; renderMapSide(); }
      else if (a === 'know-back') openKnowRegion('');
      else if (a === 'know-start') startKnowQuiz(knowTopic);
      else if (a === 'know-region-quiz') startKnowQuiz('mixed', act.dataset.region || '');
      else if (a === 'know-next') nextKnowQuestion();
      else if (a === 'know-replay') startKnowQuiz(knowTopic, knowScope);
      else if (a === 'know-exit') { knowQuiz = null; switchKnowTab('explore'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      else if (a === 'know-scope-clear') { knowScope = ''; renderKnowledge(); }
      else if (a === 'reset') resetProgress();
      else if (a === 'acct-open') openAcct();
      else if (a === 'acct-close') closeAcct();
      else if (a === 'acct-copy') copyCurrentId();
      else if (a === 'acct-random') newRandomProfile();
      else if (a === 'acct-restore') restoreProfile();
      else if (a === 'acct-device') useDeviceProfile();
      else if (a === 'acct-switch') switchProfile(act.dataset.id);
      else if (a === 'acct-google') setAcctWarn('acctLoginWarn', I18N.t('acct.googleUnavailable'));
      else if (a === 'acct-facebook') loginFacebook();
      return;
    }
    const prov = e.target.closest('[data-prov]');
    if (prov) {
      selectProvince(prov.dataset.prov, false);
      return;
    }
    const kprov = e.target.closest('[data-kprov]');
    if (kprov) {
      const name = kprov.dataset.kprov;
      setView('map');
      selectProvince(foldName(name), true);
      return;
    }
    const open = e.target.closest('[data-open]');
    if (open) {
      const place = byId.get(open.dataset.open);
      if (place) goPlace(place);
    }
  });

  $('#btnSound').addEventListener('click', () => {
    S.sound = !S.sound;
    U.audio.setMuted(!S.sound);
    if (S.sound) U.audio.click();
    save();
    updateHud();
  });

  $('#btnReset').addEventListener('click', resetProgress);

  $('#journeySearch').addEventListener('input', U.debounce(() => renderJourney(), 180));

  const mapSearch = $('#mapSearch');
  if (mapSearch) mapSearch.addEventListener('input', U.debounce(() => {
    mapQuery = mapSearch.value;
    renderMapSide();
  }, 160));

  function openTour() {
    const place = currentPlace();
    if (!place) return;
    Tour.open(place);
  }

  function unlockCurrent() {
    const place = currentPlace();
    if (!place || !isLocked(place)) return;
    const cost = unlockCost(place);
    if (S.lotus < cost) {
      U.toast(I18N.t('toast.needLotus', { cost, have: S.lotus }), ICON.lotus);
      return;
    }
    S.lotus -= cost;
    S.unlocked[place.id] = Date.now();
    save();
    U.audio.lotus();
    U.toast(I18N.t('toast.unlocked', { place: place.name }), ICON.spark);
    renderPlay(true);
  }

  function resetProgress() {
    if (!window.confirm(I18N.t('toast.resetConfirm'))) return;
    if (window.Explore) Explore.reset();
    S = normalizeState(null);
    S.sound = true;
    S.lang = I18N.code();
    save();
    round = null;
    stageFor = null;
    knowQuiz = null;
    const first = PLACES[0];
    currentId = first ? first.id : null;
    openChapters = new Set([first ? first.fame : 3]);
    U.audio.setMuted(false);
    updateHud();
    closeFx();
    if (first) goPlace(first, { forceStage: true });
    renderJourney();
    renderAchv();
    if (view === 'knowledge') renderKnowledge();
    if (view === 'explore' && window.Explore) Explore.render();
    U.toast(I18N.t('toast.reset'), ICON.reset);
  }

  document.addEventListener('keydown', (e) => {
    if (!round || round.done) return;
    if (round.answered == null && /^[1-4]$/.test(e.key)) {
      pickAnswer(Number(e.key) - 1);
    } else if (round.answered != null && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      nextQuestion();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (view !== 'knowledge' || !knowQuiz || knowQuiz.done) return;
    if (knowQuiz.answered == null && /^[1-4]$/.test(e.key)) {
      e.preventDefault();
      pickKnowAnswer(Number(e.key) - 1);
    } else if (knowQuiz.answered != null && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      nextKnowQuestion();
    }
  });

  window.addEventListener('beforeunload', () => {
    if (currentPlace()) {
      S.lastPlaceId = currentPlace().id;
      save();
    }
  });

  /* ---------------- Khởi động ---------------- */
  const brandMark = $('#brandMark');
  if (brandMark) brandMark.innerHTML = ICON.lotus;
  const hudIcon = $('#hudLotusIcon');
  if (hudIcon) hudIcon.innerHTML = ICON.lotus;
  $$('.search-ic').forEach((el) => { el.innerHTML = ICON.compass; });
  const btnReset = $('#btnReset');
  if (btnReset) btnReset.innerHTML = ICON.reset;
  const guideImg = $('#guideImg');
  if (guideImg) guideImg.addEventListener('error', () => guideImg.classList.add('hide'));
  const tourClose = $('[data-act="tour-close"]');
  if (tourClose) tourClose.innerHTML = ICON.close;
  const acctClose = $('[data-act="acct-close"]');
  if (acctClose) acctClose.innerHTML = ICON.close;
  const googleIc = $('#acctGoogleIc');
  if (googleIc) googleIc.innerHTML = ICON.google;
  const facebookIc = $('#acctFacebookIc');
  if (facebookIc) facebookIc.innerHTML = ICON.facebook;

  const acctEl = $('#acct');
  if (acctEl) {
    acctEl.addEventListener('click', (e) => {
      if (e.target === acctEl) closeAcct();
    });
  }
  const acctRestore = $('#acctRestore');
  if (acctRestore) {
    acctRestore.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        restoreProfile();
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && acctEl && !acctEl.hidden) closeAcct();
  });

  const btnLang = $('#btnLang');
  const langMenu = $('#langMenu');
  if (btnLang) {
    btnLang.innerHTML = ICON.globe;
    btnLang.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = langMenu.hidden;
      closeLangMenu();
      if (willOpen) {
        buildLangMenu();
        langMenu.hidden = false;
        btnLang.setAttribute('aria-expanded', 'true');
      }
      U.audio.click();
    });
  }
  if (langMenu) {
    langMenu.addEventListener('click', (e) => {
      const item = e.target.closest('[data-lang]');
      if (item) setLang(item.dataset.lang);
    });
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang-wrap')) closeLangMenu();
  });

  I18N.onChange(() => {
    I18N.apply();
    updateHud();
    if (view === 'explore') { if (window.Explore) Explore.refresh(); }
    else if (view === 'map') renderMap();
    else if (view === 'knowledge') renderKnowledge();
    else if (view === 'journey') renderJourney();
    else if (view === 'achv') renderAchv();
    else renderPlay(true);
    if (acctEl && !acctEl.hidden) renderAcct();
    if (Tour.refresh) Tour.refresh();
  });

  I18N.apply();
  buildLangMenu();

  Tour.init({
    getState: () => S,
    save,
    icons: ICON,
    photo: (id) => Media.photo(id),
    guide: (kind) => Media.guide(kind),
    media: {
      place: (id) => Media.photo(id),
      province: (p, v) => Media.provincePhoto(p, v),
      food: (p) => Media.foodPhoto(p),
      culture: (p) => Media.culturePhoto(p),
      credit: (src) => Media.creditFor(src),
      placeGallery: (p) => {
        const own = Media.placeEntry(p.id);
        const others = [];
        for (const x of PLACES) {
          if (x.id === p.id || x.province !== p.province) continue;
          const entry = Media.placeEntry(x.id);
          if (entry) others.push(entry);
          if (others.length >= 4) break;
        }
        return [own, ...others].filter(Boolean);
      },
      provinceGallery: (p) => Media.provinceGallery(p),
    },
    toast: (msg, icon) => U.toast(msg, icon),
    nextPlace: (p) => suggestPlaces(p, 1)[0] || null,
    onFinish: () => { renderJourney(); renderAchv(); },
  });

  if (window.Explore) {
    Explore.init({
      getProgress: () => S.explore,
      save,
      addLotus: (n) => {
        const add = Number(n) || 0;
        if (!add) return;
        S.lotus += add;
        save();
        updateHud();
      },
      guide: (kind) => Media.guide(kind),
      photo: (p) => Media.placeEntry(p.id),
      provincePhoto: (p) => Media.provincePhoto(p),
      creditFor: (src) => Media.creditFor(src),
      openKnowledgeQuiz: (region) => {
        setView('knowledge');
        startKnowQuiz('mixed', region);
      },
    });
  }

  U.audio.setMuted(!S.sound);
  Identity.prepare();
  initSceneParallax();
  updateHud();

  const start = chooseStart();
  if (start) {
    currentId = start.id;
    S.lastPlaceId = start.id;
    S.visited[start.id] = S.visited[start.id] || Date.now();
    save();
    openChapters = new Set([start.fame]);
  }
  setView('play');
  updateHud();

  Media.refresh().then((ok) => {
    if (ok) {
      stageFor = null;
      renderPlay(true);
    }
  });
})();
