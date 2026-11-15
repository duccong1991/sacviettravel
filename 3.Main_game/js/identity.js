/* Sắc Việt – hồ sơ người chơi: ID thiết bị, ID ngẫu nhiên, Google, Facebook.
   Thành tích được lưu theo từng ID trong localStorage của trình duyệt này. */
(function () {
  const PLAYERS_KEY = 'sacviet.players.v1';
  const DEVICE_KEY = 'sacviet.device.v1';
  const ALLOWED = ['device', 'random', 'google', 'facebook'];

  let state = null;
  let deviceCache = '';
  let fbReady = false;
  let gisReady = null;

  const cfg = () => window.SACVIET_AUTH || {};
  const now = () => Date.now();

  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

  function makePlayer(id, provider, save, extra = {}) {
    return {
      id,
      provider,
      name: typeof extra.name === 'string' ? extra.name.slice(0, 60) : '',
      avatar: typeof extra.avatar === 'string' && /^(https?:\/\/|data:image\/)/.test(extra.avatar) ? extra.avatar : '',
      email: typeof extra.email === 'string' ? extra.email.slice(0, 120) : '',
      createdAt: now(),
      lastSeen: now(),
      save: isObj(save) ? save : {},
    };
  }

  function readState() {
    const raw = U.store.read(PLAYERS_KEY, null);
    if (!isObj(raw) || !isObj(raw.players)) return null;
    const players = {};
    for (const [id, p] of Object.entries(raw.players)) {
      if (!isObj(p) || typeof p.id !== 'string' || !ALLOWED.includes(p.provider)) continue;
      players[id] = {
        id,
        provider: p.provider,
        name: typeof p.name === 'string' ? p.name : '',
        avatar: typeof p.avatar === 'string' ? p.avatar : '',
        email: typeof p.email === 'string' ? p.email : '',
        createdAt: Number(p.createdAt) || now(),
        lastSeen: Number(p.lastSeen) || 0,
        save: isObj(p.save) ? p.save : {},
      };
    }
    if (!Object.keys(players).length) return null;
    return { version: 1, activeId: typeof raw.activeId === 'string' ? raw.activeId : '', players };
  }

  function writeState() {
    U.store.write(PLAYERS_KEY, state);
  }

  function fingerprint() {
    const n = navigator || {};
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { tz = ''; }
    return [
      n.userAgent || '',
      n.language || '',
      (n.languages || []).join(','),
      n.platform || '',
      n.hardwareConcurrency || 0,
      n.deviceMemory || 0,
      n.maxTouchPoints || 0,
      screen.width || 0,
      screen.height || 0,
      screen.colorDepth || 0,
      tz,
    ].join('|');
  }

  function hex12(str) {
    const a = U.hash(str + '|a').toString(16).padStart(8, '0');
    const b = U.hash(str + '|b').toString(16).padStart(8, '0');
    return (a + b).slice(0, 12);
  }

  function deviceId() {
    if (deviceCache) return deviceCache;
    const saved = U.store.read(DEVICE_KEY, '');
    if (typeof saved === 'string' && /^SV(:[0-9A-F]{2}){6}$/.test(saved)) {
      deviceCache = saved;
      return saved;
    }
    const id = 'SV:' + (hex12(fingerprint()).match(/.{2}/g) || []).join(':').toUpperCase();
    U.store.write(DEVICE_KEY, id);
    deviceCache = id;
    return id;
  }

  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rndPool = [];
  function randInt(max) {
    if (!rndPool.length) {
      if (window.crypto && crypto.getRandomValues) {
        const buf = new Uint8Array(32);
        crypto.getRandomValues(buf);
        rndPool = Array.from(buf, (b) => b % max);
      } else {
        for (let i = 0; i < 32; i++) rndPool.push(Math.floor(Math.random() * max));
      }
    }
    return rndPool.pop();
  }
  function randomBlock() {
    let s = '';
    for (let i = 0; i < 4; i++) s += ALPHABET[randInt(ALPHABET.length)];
    return s;
  }
  function randomId() {
    for (let i = 0; i < 12; i++) {
      const id = `SV-${randomBlock()}-${randomBlock()}`;
      if (!state || !state.players[id]) return id;
    }
    return `SV-${randomBlock()}-${randomBlock()}`;
  }

  function normalizeId(input) {
    let s = String(input || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!s) return '';
    if (/^SV(:[0-9A-F]{2}){6}$/.test(s)) return s;
    s = s.replace(/^SV[-_:]*/, '').replace(/[^A-Z0-9]/g, '');
    if (/^[A-Z0-9]{8}$/.test(s)) return `SV-${s.slice(0, 4)}-${s.slice(4)}`;
    return '';
  }

  function providerOfId(id) {
    return id.startsWith('SV:') ? 'device' : 'random';
  }

  function ensureDevicePlayer(legacySave) {
    const did = deviceId();
    if (!state.players[did]) {
      state.players[did] = makePlayer(did, 'device', legacySave || {});
    }
    return did;
  }

  function init(opts = {}) {
    state = readState();
    if (!state) {
      const did = deviceId();
      state = {
        version: 1,
        activeId: did,
        players: { [did]: makePlayer(did, 'device', opts.save || {}) },
      };
      writeState();
    }
    const did = ensureDevicePlayer(opts.save);
    if (!state.players[state.activeId]) state.activeId = did;
    const active = state.players[state.activeId];
    active.lastSeen = now();
    writeState();
    return active;
  }

  function active() {
    if (!state) return null;
    return state.players[state.activeId] || null;
  }

  function list() {
    if (!state) return [];
    return Object.values(state.players)
      .slice()
      .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
  }

  function activate(id) {
    if (!state || !state.players[id]) return null;
    state.activeId = id;
    state.players[id].lastSeen = now();
    writeState();
    return state.players[id];
  }

  function saveActive(save) {
    if (!state) return;
    const p = active();
    if (!p) return;
    p.save = save;
    p.lastSeen = now();
    writeState();
  }

  function createRandom(save) {
    const id = randomId();
    const p = makePlayer(id, 'random', save || {});
    state.players[id] = p;
    state.activeId = id;
    writeState();
    return p;
  }

  function useId(rawId, save) {
    const id = normalizeId(rawId);
    if (!id) return { error: 'invalid' };
    if (state.players[id]) return { player: activate(id), created: false };
    const p = makePlayer(id, providerOfId(id), save || {});
    state.players[id] = p;
    state.activeId = id;
    writeState();
    return { player: p, created: true };
  }

  function upsertProvider(profile, save) {
    const id = (profile.provider === 'google' ? 'g:' : 'f:') + String(profile.uid || '');
    const existing = state.players[id];
    if (existing) {
      if (profile.name) existing.name = String(profile.name).slice(0, 60);
      if (profile.avatar) existing.avatar = profile.avatar;
      if (profile.email) existing.email = String(profile.email).slice(0, 120);
      activate(id);
      return { player: existing, isNew: false };
    }
    const p = makePlayer(id, profile.provider, save || {}, profile);
    state.players[id] = p;
    state.activeId = id;
    writeState();
    return { player: p, isNew: true };
  }

  function useDevice() {
    const did = ensureDevicePlayer();
    return activate(did);
  }

  function providers() {
    const c = cfg();
    return {
      google: !!c.googleClientId,
      facebook: !!c.facebookAppId,
    };
  }

  function prepare() {
    const p = providers();
    if (p.google) googleReady().catch(() => {});
    if (p.facebook) facebookReady().catch(() => {});
  }

  /* ---------- Google Identity Services ---------- */
  function loadScript(src, id) {
    return new Promise((resolve, reject) => {
      const found = id ? document.getElementById(id) : null;
      if (found) return resolve();
      const exists = Array.from(document.scripts).find((s) => s.src === src);
      if (exists) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.defer = true;
      if (id) s.id = id;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('script-load'));
      document.head.appendChild(s);
    });
  }

  function b64urlJson(part) {
    const b64 = String(part || '').replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = atob(pad);
    let out = '';
    for (let i = 0; i < raw.length; i++) out += '%' + raw.charCodeAt(i).toString(16).padStart(2, '0');
    return JSON.parse(decodeURIComponent(out));
  }

  function randomToken(len) {
    const bytes = new Uint8Array(len);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function googleReady() {
    const c = cfg();
    if (!c.googleClientId) throw new Error('not-configured');
    if (window.google && google.accounts && google.accounts.id) return google;
    if (!gisReady) {
      gisReady = loadScript('https://accounts.google.com/gsi/client', 'gsi-client')
        .then(() => window.google)
        .catch((e) => { gisReady = null; throw e; });
    }
    return gisReady;
  }

  const GIS_LOCALE = { vi: 'vi', en: 'en', ja: 'ja', zh: 'zh-CN', ko: 'ko' };

  function renderGoogle(host, opts = {}) {
    if (!host) return;
    const lang = opts.locale || 'vi';
    googleReady().then((google) => {
      const nonce = randomToken(16);
      const clientId = cfg().googleClientId;
      google.accounts.id.initialize({
        client_id: clientId,
        nonce,
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
        locale: GIS_LOCALE[lang] || 'en',
        callback: (res) => {
          try {
            if (!res || !res.credential) throw new Error('no-credential');
            const p = b64urlJson(res.credential.split('.')[1]);
            if (p.aud !== clientId) throw new Error('audience');
            if (p.nonce && p.nonce !== nonce) throw new Error('nonce');
            if (p.exp && p.exp * 1000 < Date.now()) throw new Error('expired');
            opts.onProfile({
              provider: 'google',
              uid: p.sub,
              name: p.name || p.email || '',
              email: p.email || '',
              avatar: p.picture || '',
            });
          } catch (err) {
            if (opts.onError) opts.onError(err);
          }
        },
      });
      host.innerHTML = '';
      const available = host.clientWidth || host.parentElement?.clientWidth || (window.innerWidth - 72);
      const width = Math.min(300, Math.max(200, Math.round(available)));
      google.accounts.id.renderButton(host, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'left',
        width,
        locale: GIS_LOCALE[lang] || 'en',
      });
    }).catch((err) => { if (opts.onError) opts.onError(err); });
  }

  /* ---------- Facebook ---------- */
  async function facebookReady() {
    const c = cfg();
    if (!c.facebookAppId) throw new Error('not-configured');
    if (fbReady && window.FB) return window.FB;
    await loadScript(`https://connect.facebook.net/${c.facebookLocale || 'vi_VN'}/sdk.js`, 'fb-sdk');
    if (!window.FB) throw new Error('fb-load');
    FB.init({
      appId: c.facebookAppId,
      cookie: true,
      xfbml: false,
      status: false,
      version: c.facebookVersion || 'v21.0',
    });
    fbReady = true;
    return FB;
  }

  async function loginFacebook() {
    await facebookReady();
    return new Promise((resolve, reject) => {
      FB.login((res) => {
        if (!res || !res.authResponse) return reject(new Error('cancelled'));
        FB.api('/me', { fields: 'id,name,picture.type(large)' }, (me) => {
          if (!me || me.error || !me.id) return reject(new Error('profile'));
          resolve({
            provider: 'facebook',
            uid: me.id,
            name: me.name || '',
            email: '',
            avatar: (me.picture && me.picture.data && me.picture.data.url) || '',
          });
        });
      }, { scope: 'public_profile' });
    });
  }

  window.Identity = {
    init,
    active,
    list,
    activate,
    saveActive,
    createRandom,
    useId,
    upsertProvider,
    useDevice,
    providers,
    prepare,
    deviceId,
    normalizeId,
    renderGoogle,
    loginFacebook,
  };
})();
