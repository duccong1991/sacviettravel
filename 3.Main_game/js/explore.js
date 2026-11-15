/* Sắc Việt – Khám phá 3D: chọn hành trình, đi bộ tham quan, thu thập sen,
   tương tác điểm đánh dấu và trò chuyện với AI hướng dẫn viên Mai.
   Mô hình dữ liệu: VIRTUAL_TOURS → VIRTUAL_TOUR_SCENES → HOTSPOTS/MEDIA,
   VIRTUAL_TOUR_GUIDES (câu trả lời kiểm duyệt), VIRTUAL_TOUR_QUIZZES (liên kết
   bộ trắc nghiệm vùng), VIRTUAL_TOUR_PROGRESS (lưu theo người chơi). */
(function () {
  const D = window.EXPLORE_DATA || { tours: [], ui: {} };
  const SC = window.ExploreScenery;

  const I = {
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L7.5 12l7 6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lotus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6c2 2.4 3 4.8 3 7.1 0 2.7-1.3 4.8-3 6.3-1.7-1.5-3-3.6-3-6.3 0-2.3 1-4.7 3-7.1z" fill="currentColor" opacity=".92"/><path d="M3.6 6.6c3 .2 5.3 1.3 6.9 3.3 1.3 1.7 1.8 3.9 1.6 6.1-2.2-.5-4-1.7-5.2-3.5-1.3-1.9-1.8-4-1.3-5.9z" fill="currentColor" opacity=".7"/><path d="M20.4 6.6c.5 1.9 0 4-1.3 5.9-1.2 1.8-3 3-5.2 3.5-.2-2.2.3-4.4 1.6-6.1 1.6-2 3.9-3.1 6.9-3.3z" fill="currentColor" opacity=".7"/><path d="M5.2 13.9c2.6 1.1 5 4.1 6.8 7.5 1.8-3.4 4.2-6.4 6.8-7.5-1.1 2.1-2.6 4-4.3 5.4-1.1.9-2 .9-2.5.9s-1.4 0-2.5-.9c-1.7-1.4-3.2-3.3-4.3-5.4z" fill="currentColor" opacity=".55"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6.2-5.6 6.2-10.2a6.2 6.2 0 1 0-12.4 0C5.8 15.4 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="10.6" r="2.2" fill="currentColor"/></svg>',
    voice: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3l4.5-3.5v12L7 14.5H4v-5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-7-6 16-3-7-7-2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.4c2.7-.8 5.4-.4 8 1.2 2.6-1.6 5.3-2 8-1.2v13c-2.7-.8-5.4-.4-8 1.2-2.6-1.6-5.3-2-8-1.2v-13z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  };

  const INTENTS = ['built', 'builder', 'value', 'story', 'next', 'specialty', 'culture'];
  const UI = D.ui || {};
  const MAX_SPEED = UI.walkSpeed || 4.4;
  const RUN_SPEED = UI.sprintSpeed || 6.8;
  const ITEMS_PER_SCENE = UI.itemsPerScene || 5;

  let hooks = null;
  let host = null;
  let active = false;
  let mode = 'menu';
  let routeId = null;
  let stopIdx = 0;
  let chatLog = [];
  let infoH = null;
  let infoStop = '';
  let engine = null;
  let engineToken = 0;
  let mem = { version: 1, routes: {}, last: null, voice: { auto: true, voiceURI: '', rate: 1 } };
  let voicesBound = false;

  const T = (key, vars) => I18N.t(key, vars);
  const N = (v) => U.esc(String(v == null ? '' : v));

  function pick(obj, code) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[code || I18N.code()] || obj.vi || obj.en || '';
  }

  /* ---------------- Trạng thái / tiến trình ---------------- */
  function exState() {
    let s = hooks && hooks.getProgress ? hooks.getProgress() : mem;
    if (!s || typeof s !== 'object') s = mem;
    if (!s.routes || typeof s.routes !== 'object') s.routes = {};
    if (!s.voice || typeof s.voice !== 'object') s.voice = { auto: true, voiceURI: '', rate: 1 };
    if (s.voice.auto == null) s.voice.auto = true;
    if (!s.voice.rate) s.voice.rate = 1;
    return s;
  }

  function saveState() {
    if (hooks && hooks.save) hooks.save();
  }

  function routeRec(id) {
    const s = exState();
    let r = s.routes[id];
    if (!r || typeof r !== 'object') r = s.routes[id] = {};
    if (!r.visited || typeof r.visited !== 'object') r.visited = {};
    if (!r.items || typeof r.items !== 'object') r.items = {};
    if (!r.hotspots || typeof r.hotspots !== 'object') r.hotspots = {};
    return r;
  }

  function curRoute() { return D.tours.find((r) => r.id === routeId) || null; }
  function curStop() {
    const r = curRoute();
    return r ? r.stops[stopIdx] || r.stops[0] : null;
  }

  function stats() {
    const ex = exState();
    let stops = 0, items = 0, tours = 0;
    for (const r of D.tours) {
      const rec = ex.routes[r.id];
      if (!rec) continue;
      for (const s of r.stops) {
        if (rec.visited && rec.visited[s.id]) stops++;
        if (rec.items && rec.items[s.id]) items += rec.items[s.id].length;
      }
      if (rec.complete) tours++;
    }
    return { stops, items, tours };
  }

  /* ---------------- Giọng đọc ---------------- */
  function synth() {
    return window.speechSynthesis || null;
  }

  function voices() {
    const s = synth();
    if (!s) return [];
    try { return s.getVoices() || []; } catch { return []; }
  }

  function autoVoice() {
    const list = voices();
    const vi = list.filter((v) => /^vi/i.test(v.lang || ''));
    const names = ['HoaiMy', 'Hoài My', 'Hoài', 'Google Tiếng Việt', 'Linh', 'Mai', 'Yến'];
    for (const name of names) {
      const hit = vi.find((v) => (v.name || '').indexOf(name) >= 0);
      if (hit) return hit;
    }
    return vi[0] || null;
  }

  function currentVoice() {
    const prefs = exState().voice || {};
    const list = voices();
    if (prefs.voiceURI) {
      const hit = list.find((v) => v.voiceURI === prefs.voiceURI);
      if (hit) return hit;
    }
    return autoVoice();
  }

  function voiceLang() {
    const v = currentVoice();
    if (v && v.lang) {
      const code = String(v.lang).slice(0, 2).toLowerCase();
      if (['vi', 'en', 'ja', 'zh', 'ko'].indexOf(code) >= 0) return code;
    }
    return 'vi';
  }

  function speak(text, langCode) {
    const s = synth();
    if (!s || !text) return;
    try {
      s.cancel();
      const clean = String(text).replace(/\s+/g, ' ').trim();
      if (!clean) return;
      const u = new SpeechSynthesisUtterance(clean);
      const v = currentVoice();
      if (v) { u.voice = v; u.lang = v.lang || 'vi-VN'; }
      else u.lang = (langCode || 'vi') === 'vi' ? 'vi-VN' : (langCode || 'vi');
      u.rate = Math.max(0.6, Math.min(1.6, Number(exState().voice.rate) || 1));
      u.pitch = 1.04;
      s.speak(u);
    } catch { /* bỏ qua */ }
  }

  function stopSpeech() {
    const s = synth();
    if (s) { try { s.cancel(); } catch { /* bỏ qua */ } }
  }

  /* ---------------- Câu trả lời của Mai ---------------- */
  function factText(kind, code) {
    const s = curStop();
    if (!s || !s.facts) return '';
    const key = s.facts[kind] ? kind : 'value';
    const obj = s.facts[key];
    if (!obj) return '';
    return obj[code] || obj.vi || '';
  }

  function buildAnswer(kind) {
    const s = curStop();
    const r = curRoute();
    if (!s || !r) return { text: '', speech: '' };
    const ui = I18N.code();
    const vl = voiceLang();
    const t = (key, vars) => T('explore.' + key, vars);
    const rt = (key, vars) => I18N.raw(vl, 'explore.' + key, vars);
    let text = '';
    let speech = '';
    if (kind === 'specialty' || kind === 'culture') {
      const key = 'knowledge.region.' + s.regionKey + '.' + kind;
      text = I18N.t(key);
      speech = vl === ui ? text : I18N.raw(vl, key);
    } else if (kind === 'next') {
      const nx = r.stops[stopIdx + 1];
      const region = I18N.region(r.region);
      if (!nx) {
        text = t('chat.nextLast', { stop: s.name, region });
        speech = rt('chat.nextLast', { stop: s.name, region: r.region });
      } else {
        text = t('chat.nextStop', { stop: nx.name, province: nx.province, route: pick(r.name, ui) });
        speech = rt('chat.nextStop', { stop: nx.name, province: nx.province, route: pick(r.name, vl) });
      }
    } else {
      text = factText(kind, ui);
      speech = vl === ui ? text : factText(kind, vl);
    }
    return { text, speech: speech || text };
  }

  function stripAccent(str) {
    return String(str || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase();
  }

  const INTENT_WORDS = [
    ['builder', ['ai xay', 'nguoi xay', 'vua nao', 'ai dung', 'who built', 'who constructed', 'builder', '누가', '谁建', '誰が']],
    ['built', ['khi nao', 'xay dung', 'xay tu', 'nam nao', 'bao lau', 'built', 'when was', 'constructed', 'いつ', '언제', '何时', '建于']],
    ['value', ['gia tri', 'vi sao', 'tai sao', 'y nghia', 'value', 'important', 'why', '价值', '価値', '가치']],
    ['story', ['cau chuyen', 'truyen thuyet', 'ky la', 'story', 'legend', '이야기', '故事', '物語']],
    ['next', ['tiep theo', 'o dau', 'diem tiep', 'next stop', 'where is next', 'next', '다음', '下一', '次は']],
    ['specialty', ['dac san', 'an gi', 'mon an', 'food', 'specialty', '특산', '特产', '名物']],
    ['culture', ['van hoa', 'le hoi', 'net co', 'culture', 'festival', '문화', '文化', '祭り']],
  ];

  function matchIntent(text) {
    const s = stripAccent(text);
    for (const [kind, words] of INTENT_WORDS) {
      if (words.some((w) => s.indexOf(stripAccent(w)) >= 0)) return kind;
    }
    return '';
  }

  /* ---------------- Chat ---------------- */
  function addMsg(who, text, speech, meta) {
    chatLog.push({ who, text: text || '', speech: speech || text || '', meta: meta || null });
    if (chatLog.length > 70) chatLog.splice(0, chatLog.length - 70);
    renderChat();
    if (who === 'mai' && exState().voice.auto !== false) speak(speech || text);
  }

  function renderChat() {
    if (!host) return;
    const el = host.querySelector('#exChat');
    if (!el) return;
    el.innerHTML = chatLog.map((m, i) => {
      if (m.who === 'mai') {
        return `<div class="ex-msg mai">
          <span class="ex-msg-av">M</span>
          <div class="ex-bubble"><p>${N(m.text)}</p>
          <button class="ex-read" data-ex-read="${i}" title="${N(T('explore.hud.speak'))}" aria-label="${N(T('explore.hud.speak'))}">${I.voice}</button></div>
        </div>`;
      }
      return `<div class="ex-msg you"><div class="ex-bubble"><p>${N(m.text)}</p></div></div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  function greet() {
    const s = curStop();
    if (!s) return;
    const ui = I18N.code();
    const vl = voiceLang();
    const factUi = factText('value', ui);
    const factVoice = factText('value', vl);
    const text = T('explore.chat.hello', { stop: s.name, fact: factUi });
    const speech = vl === ui ? text : I18N.raw(vl, 'explore.chat.hello', { stop: s.name, fact: factVoice });
    addMsg('mai', text, speech, { kind: 'hello' });
  }

  function askIntent(kind) {
    if (INTENTS.indexOf(kind) < 0 || !curStop()) return;
    addMsg('you', T('explore.intents.' + kind));
    const ans = buildAnswer(kind);
    setTimeout(() => addMsg('mai', ans.text, ans.speech, { kind }), 240);
    U.audio.click();
  }

  function handleAsk(raw) {
    const text = String(raw || '').trim();
    if (!text || !curStop()) return;
    addMsg('you', text);
    const s = curStop();
    const kind = matchIntent(text);
    let ans = null;
    if (kind) {
      ans = buildAnswer(kind);
    } else if (infoH) {
      const factUi = factText(infoH.factKey, I18N.code());
      const factVoice = factText(infoH.factKey, voiceLang());
      ans = {
        text: T('explore.chat.hotspotAsk', { label: infoH.label, fact: factUi }),
        speech: voiceLang() === I18N.code() ? '' : I18N.raw(voiceLang(), 'explore.chat.hotspotAsk', { label: infoH.label, fact: factVoice }),
      };
    } else {
      ans = {
        text: T('explore.chat.offTopic', { stop: s.name }),
        speech: voiceLang() === I18N.code() ? '' : I18N.raw(voiceLang(), 'explore.chat.offTopic', { stop: s.name }),
      };
    }
    setTimeout(() => addMsg('mai', ans.text, ans.speech || ans.text), 260);
    U.audio.click();
  }

  function openTalk() {
    if (!host) return;
    const side = host.querySelector('.ex-side');
    if (side) side.classList.add('is-talk');
    const s = curStop();
    const last = chatLog[chatLog.length - 1];
    if (s && (!last || last.meta == null || last.meta.kind !== 'tip')) {
      addMsg('mai', T('explore.chat.askTip', { stop: s.name }), T('explore.chat.askTip', { stop: s.name }), { kind: 'tip' });
    }
    const input = host.querySelector('#exAsk');
    if (input && window.matchMedia && window.matchMedia('(min-width: 861px)').matches) {
      setTimeout(() => input.focus(), 60);
    }
  }

  /* ---------------- Ảnh / thẻ thông tin ---------------- */
  function stopPhoto(s) {
    if (!hooks) return null;
    try {
      if (hooks.photo) {
        const entry = hooks.photo({ id: s.placeId, name: s.name, province: s.province });
        if (entry && entry.img) return { img: entry.img, credit: entry.credit || '' };
      }
      if (hooks.provincePhoto) {
        const src = hooks.provincePhoto({ id: s.placeId, name: s.name, province: s.province });
        if (src) return { img: src, credit: hooks.creditFor ? hooks.creditFor(src) : '' };
      }
    } catch { /* bỏ qua */ }
    return null;
  }

  function renderInfo() {
    if (!host) return;
    const el = host.querySelector('#exInfo');
    if (!el) return;
    const s = curStop();
    if (!infoH || !s || infoStop !== s.id) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    const ph = stopPhoto(s);
    el.hidden = false;
    el.innerHTML = `<button class="ex-info-x" data-ex-act="info-close" aria-label="${N(T('explore.info.close'))}">${I.close}</button>
      ${ph ? `<div class="ex-info-img"><img src="${U.esc(ph.img)}" alt="${N(s.name)}" loading="lazy" decoding="async">${ph.credit ? `<span>${N(I18N.credit(ph.credit))}</span>` : ''}</div>` : ''}
      <div class="ex-info-body">
        <span class="ex-kicker">${N(T('explore.info.label'))}</span>
        <h4>${N(infoH.label)}</h4>
        <p>${N(factText(infoH.factKey, I18N.code()))}</p>
        ${s.sources && s.sources.length ? `<p class="ex-info-src">${N(T('explore.info.source'))}: ${s.sources.map(N).join(' · ')}</p>` : ''}
        <button class="btn ghost small" data-ex-act="ask-more">${N(T('explore.info.askMore'))}</button>
      </div>`;
  }

  /* ---------------- Menu ---------------- */
  function menuHtml() {
    const st = stats();
    return `<div class="page-head ex-head">
      <div>
        <div class="eyebrow">${N(T('explore.eyebrow'))}</div>
        <h1>${N(T('explore.title'))}</h1>
        <p class="page-lede">${N(T('explore.lede'))}</p>
      </div>
    </div>
    <div class="ex-stats">
      <div class="ex-stat"><span class="ex-stat-ic">${I.pin}</span><b>${U.nf(st.stops)}</b><span>${N(T('explore.stats.stops'))}</span></div>
      <div class="ex-stat"><span class="ex-stat-ic">${I.lotus}</span><b>${U.nf(st.items)}</b><span>${N(T('explore.stats.items'))}</span></div>
      <div class="ex-stat"><span class="ex-stat-ic">${I.book}</span><b>${U.nf(st.tours)}</b><span>${N(T('explore.stats.tours'))}</span></div>
    </div>
    <div class="ex-routes">${D.tours.map((r, i) => routeCard(r, i)).join('')}</div>
    <p class="ex-credit">${N(D.credit || '')}</p>`;
  }

  function routeCard(r, index) {
    const rec = exState().routes[r.id];
    const total = r.stops.length;
    let done = 0, items = 0;
    if (rec) {
      for (const s of r.stops) {
        if (rec.visited && rec.visited[s.id]) done++;
        if (rec.items && rec.items[s.id]) items += rec.items[s.id].length;
      }
    }
    const complete = !!(rec && rec.complete);
    return `<article class="ex-route-card ${complete ? 'is-complete' : ''}" style="--rc:${r.color}">
      <div class="ex-route-head">
        <span class="ex-route-no">${String(index + 1).padStart(2, '0')}</span>
        <span class="ex-route-state ${complete ? 'is-done' : ''}">${N(complete ? T('explore.route.done') : T('explore.route.progress', { done, total }))}</span>
      </div>
      <h3>${N(pick(r.name))}</h3>
      <p>${N(pick(r.tagline))}</p>
      <ul class="ex-stoplist">
        ${r.stops.map((s, si) => {
          const seen = rec && rec.visited && rec.visited[s.id];
          return `<li class="${seen ? 'is-seen' : ''}"><i>${si + 1}</i><div><b>${N(s.name)}</b><small>${N(s.province)}</small></div>${seen ? I.check : ''}</li>`;
        }).join('')}
      </ul>
      <div class="ex-route-foot">
        <span>${I.lotus}<b>${U.nf(items)}</b>/${U.nf(total * ITEMS_PER_SCENE)}</span>
        <button class="btn primary small" data-ex-open="${r.id}">${N(done || complete || rec ? T('explore.route.resume') : T('explore.route.start'))}${I.arrow}</button>
      </div>
    </article>`;
  }

  /* ---------------- Sân khấu ---------------- */
  function sceneHtml() {
    const r = curRoute();
    const s = curStop();
    if (!r || !s) return '';
    const rec = routeRec(r.id);
    const items = (rec.items[s.id] || []).length;
    const hots = (rec.hotspots[s.id] || []).length;
    const guideSrc = hooks && hooks.guide ? hooks.guide('ask') : '';
    const chips = r.stops.map((st, i) => `<button class="ex-chip ${i === stopIdx ? 'is-on' : ''} ${rec.visited[st.id] ? 'is-seen' : ''}" data-ex-stop="${i}"><i>${i + 1}</i><span>${N(st.name)}</span></button>`).join('');
    const intents = INTENTS.map((k) => `<button class="ex-intent" data-ex-intent="${k}">${N(T('explore.intents.' + k))}</button>`).join('');
    const last = stopIdx >= r.stops.length - 1;
    return `<div class="ex-scene">
      <div class="ex-viewport" id="exViewport">
        <div class="ex-canvas" id="exCanvas"></div>
        <div class="ex-topbar">
          <button class="ex-pill" data-ex-act="menu">${I.back}<span>${N(T('explore.scene.back'))}</span></button>
          <div class="ex-heading">
            <span class="ex-route-name" style="--rc:${r.color}">${N(pick(r.name))}</span>
            <b>${N(s.name)}</b>
            <small>${N(s.province)}</small>
          </div>
          <div class="ex-meters">
            <span class="ex-meter" title="${N(T('explore.stats.items'))}">${I.lotus}<b id="exItemCount">${items}/${ITEMS_PER_SCENE}</b></span>
            <span class="ex-meter" title="${N(T('explore.info.label'))}">${I.pin}<b id="exHotCount">${hots}/3</b></span>
          </div>
          <button class="ex-round" data-ex-act="help" aria-label="${N(T('explore.scene.help'))}">?</button>
        </div>
        <div class="ex-stops">${chips}</div>
        <div class="ex-help" id="exHelp" hidden>
          <div class="ex-help-card">
            <h4>${N(T('explore.help.title'))}</h4>
            <ul>
              <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>${N(T('explore.help.move'))}</span></li>
              <li><kbd>⇧</kbd><span>${N(T('explore.help.run'))}</span></li>
              <li><kbd>E</kbd><span>${N(T('explore.help.interact'))}</span></li>
              <li><kbd>Q</kbd><span>${N(T('explore.help.talk'))}</span></li>
              <li><kbd>🖱</kbd><span>${N(T('explore.help.camera'))}</span></li>
              <li><kbd>✦</kbd><span>${N(T('explore.help.collect'))}</span></li>
            </ul>
            <button class="btn primary small" data-ex-act="help-close">${N(T('explore.help.close'))}</button>
          </div>
        </div>
        <div class="ex-loading" id="exLoading"><span class="ex-spin"></span>${N(T('explore.loading'))}</div>
        <div class="ex-prompt" id="exPrompt" hidden></div>
        <div class="ex-joy" id="exJoy" aria-hidden="true"><span class="ex-joy-knob"></span></div>
        <div class="ex-actions">
          <button class="ex-round ex-ebtn" data-ex-act="interact" title="E">E</button>
          <button class="ex-round ex-ebtn alt" data-ex-act="talk" title="Q">Q</button>
        </div>
        <div class="ex-info" id="exInfo" hidden></div>
      </div>
      <aside class="ex-side">
        <header class="ex-guide">
          <img class="ex-guide-av" src="${U.esc(guideSrc)}" alt="Mai" loading="lazy">
          <div class="ex-guide-meta"><b>Mai</b><span>${N(T('explore.hud.guideRole'))}</span></div>
          <button class="ex-round" data-ex-act="voice" aria-label="${N(T('explore.hud.voice'))}">${I.voice}</button>
        </header>
        <div class="ex-voice" id="exVoice" hidden>${voicePanelHtml()}</div>
        <div class="ex-chat" id="exChat" aria-live="polite"></div>
        <div class="ex-intents">${intents}</div>
        <form class="ex-form" id="exForm" autocomplete="off">
          <input id="exAsk" type="text" maxlength="160" placeholder="${N(T('explore.chat.placeholder'))}">
          <button type="submit" class="ex-send" aria-label="${N(T('explore.chat.send'))}">${I.send}</button>
        </form>
        <div class="ex-nav">
          <button class="btn ghost small" data-ex-act="prev" ${stopIdx === 0 ? 'disabled' : ''}>${I.prev}${N(T('explore.nav.prev'))}</button>
          <button class="btn ghost small" data-ex-act="quiz">${I.book}${N(T('explore.nav.quiz'))}</button>
          <button class="btn primary small" data-ex-act="${last ? 'finish' : 'next'}">${N(T(last ? 'explore.nav.finish' : 'explore.nav.next'))}${I.arrow}</button>
        </div>
      </aside>
    </div>`;
  }

  function voicePanelHtml() {
    const supported = !!synth();
    const list = voices();
    const prefs = exState().voice;
    const vi = list.filter((v) => /^vi/i.test(v.lang || ''));
    const other = list.filter((v) => !/^vi/i.test(v.lang || ''));
    const sorted = vi.concat(other);
    const opts = [`<option value="">${N(T('explore.hud.autoVoice'))}</option>`]
      .concat(sorted.map((v) => `<option value="${N(v.voiceURI)}" ${prefs.voiceURI === v.voiceURI ? 'selected' : ''}>${N(v.name)} · ${N(v.lang)}</option>`))
      .join('');
    return `<div class="ex-voice-grid">
      <label class="ex-check"><input type="checkbox" data-ex-auto ${prefs.auto !== false ? 'checked' : ''}><span>${N(T('explore.hud.autoRead'))}</span></label>
      <label class="ex-field"><span>${N(T('explore.hud.voiceTitle'))}</span>
        <select data-ex-voicelist ${supported ? '' : 'disabled'}>${opts}</select>
      </label>
      <label class="ex-field"><span>${N(T('explore.hud.rate'))}</span><input type="range" min="0.7" max="1.4" step="0.05" value="${Number(prefs.rate) || 1}" data-ex-rate></label>
      <div class="ex-voice-actions">
        <button type="button" class="btn ghost small" data-ex-act="voice-test">${N(T('explore.hud.test'))}</button>
        <button type="button" class="btn ghost small" data-ex-act="voice-close">${N(T('explore.hud.close'))}</button>
      </div>
      ${supported ? (list.length ? '' : `<p class="ex-voice-note">${N(T('explore.hud.noVoice'))}</p>`) : `<p class="ex-voice-note">${N(T('explore.hud.notSupported'))}</p>`}
    </div>`;
  }

  /* ---------------- Vòng đời màn hình ---------------- */
  function render() {
    if (!active || !host) return;
    const r = curRoute();
    if (mode === 'scene' && r && curStop()) {
      renderScene(false);
    } else {
      mode = 'menu';
      teardownEngine();
      host.innerHTML = menuHtml();
    }
  }

  function renderScene(isEntry) {
    if (!host) return;
    const r = curRoute();
    const s = curStop();
    if (!r || !s) { mode = 'menu'; host.innerHTML = menuHtml(); return; }
    teardownEngine();
    if (isEntry) {
      chatLog = [];
      infoH = null;
      infoStop = '';
    }
    const rec = routeRec(r.id);
    const firstVisit = !rec.visited[s.id];
    rec.visited[s.id] = rec.visited[s.id] || Date.now();
    rec.lastStop = stopIdx;
    exState().last = { routeId: r.id, stop: stopIdx };
    saveState();
    host.innerHTML = sceneHtml();
    renderChat();
    renderInfo();
    if (isEntry || !chatLog.length) greet();
    if (firstVisit) setTimeout(() => U.audio.lotus(), 220);
    checkComplete();
    startEngine();
  }

  function openRoute(id) {
    const r = D.tours.find((x) => x.id === id);
    if (!r) return;
    routeId = id;
    const rec = routeRec(id);
    let idx = Number(rec.lastStop) || 0;
    if (idx < 0 || idx >= r.stops.length) idx = 0;
    stopIdx = idx;
    mode = 'scene';
    renderScene(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function switchStop(i) {
    const r = curRoute();
    if (!r) return;
    stopIdx = Math.max(0, Math.min(r.stops.length - 1, i));
    mode = 'scene';
    renderScene(true);
  }

  function backToMenu() {
    stopSpeech();
    teardownEngine();
    mode = 'menu';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextStop() {
    const r = curRoute();
    if (!r) return;
    if (stopIdx >= r.stops.length - 1) { backToMenu(); return; }
    switchStop(stopIdx + 1);
  }

  function prevStop() {
    if (stopIdx > 0) switchStop(stopIdx - 1);
  }

  function finishRoute() {
    const r = curRoute();
    if (r) {
      const rec = routeRec(r.id);
      rec.lastStop = r.stops.length - 1;
      saveState();
    }
    mode = 'menu';
    teardownEngine();
    render();
    U.audio.fanfare();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openQuiz() {
    const r = curRoute();
    if (!r || !hooks || !hooks.openKnowledgeQuiz) return;
    const scope = r.quizRegion != null ? r.quizRegion : r.region;
    hooks.openKnowledgeQuiz(scope, r.regionKey);
  }

  function checkComplete() {
    const r = curRoute();
    if (!r) return;
    const rec = routeRec(r.id);
    const done = r.stops.every((s) => rec.visited && rec.visited[s.id]);
    if (!done || rec.complete) return;
    rec.complete = true;
    rec.doneAt = Date.now();
    saveState();
    if (hooks && hooks.addLotus) hooks.addLotus(5);
    U.audio.fanfare();
    U.toast(T('explore.reward.tourDone', { route: pick(r.name) }), I.lotus);
  }

  function syncHud() {
    if (!host) return;
    const s = curStop();
    if (!s) return;
    const rec = routeRec(routeId);
    const el = host.querySelector('#exItemCount');
    const eh = host.querySelector('#exHotCount');
    if (el) el.textContent = (rec.items[s.id] || []).length + '/' + ITEMS_PER_SCENE;
    if (eh) eh.textContent = (rec.hotspots[s.id] || []).length + '/3';
  }

  /* ---------------- Tương tác ---------------- */
  function openHotspot(h) {
    const s = curStop();
    const r = curRoute();
    if (!h || !s || !r) return;
    if (infoH === h && infoStop === s.id) return;
    const rec = routeRec(r.id);
    const list = rec.hotspots[s.id] || (rec.hotspots[s.id] = []);
    const first = list.indexOf(h.id) < 0;
    if (first) list.push(h.id);
    h.visited = true;
    saveState();
    infoH = h;
    infoStop = s.id;
    renderInfo();
    syncHud();
    const factUi = factText(h.factKey, I18N.code());
    const factVoice = factText(h.factKey, voiceLang());
    addMsg('mai', factUi, voiceLang() === I18N.code() ? factUi : factVoice, { kind: 'hotspot', hotspot: h.id });
    if (first) U.audio.click();
    if (list.length >= 3) {
      if (!rec.hotBonus) {
        rec.hotBonus = true;
        saveState();
        if (hooks && hooks.addLotus) hooks.addLotus(2);
      }
      U.toast(T('explore.reward.allHotspots', { stop: s.name }), I.lotus);
    } else if (first) {
      U.toast(T('explore.reward.hotspot'), I.pin);
    }
    checkComplete();
  }

  function closeInfo() {
    infoH = null;
    renderInfo();
  }

  function collectItem(it) {
    const s = curStop();
    const r = curRoute();
    if (!it || !s || !r || it.collected) return;
    it.collected = true;
    it.group.visible = false;
    const rec = routeRec(r.id);
    const list = rec.items[s.id] || (rec.items[s.id] = []);
    if (list.indexOf(it.id) < 0) list.push(it.id);
    saveState();
    if (hooks && hooks.addLotus) hooks.addLotus(1);
    U.audio.lotus();
    U.toast(T('explore.reward.item'), I.lotus);
    syncHud();
    if (list.length >= ITEMS_PER_SCENE && !rec.itemsBonus) {
      rec.itemsBonus = true;
      saveState();
      if (hooks && hooks.addLotus) hooks.addLotus(2);
      U.toast(T('explore.reward.allItems'), I.lotus);
    }
    checkComplete();
  }

  /* ---------------- Engine 3D ---------------- */
  function startEngine() {
    const token = ++engineToken;
    const mount = host.querySelector('#exCanvas');
    if (!mount) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (token !== engineToken || !active || mode !== 'scene') return;
      buildEngine(token, mount);
    }));
  }

  function engineFail(msg) {
    if (!host) return;
    const el = host.querySelector('#exLoading');
    if (el) {
      el.classList.add('is-error');
      el.innerHTML = `<p>${N(msg)}</p>`;
    }
  }

  function buildEngine(token, mount) {
    const THREE = window.THREE;
    const s = curStop();
    if (!s || !THREE || !SC) { engineFail(T('explore.engineError')); return; }
    const width = mount.clientWidth || 720;
    const height = mount.clientHeight || 420;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch (err) {
      engineFail(T('explore.engineError'));
      return;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, height);
    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'ex-gl';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const p = s.palette || {};
    scene.fog = new THREE.FogExp2(p.fog || '#c9dce7', 0.0115);
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 280);

    const rec = routeRec(routeId);
    let world = null;
    try {
      world = SC.build(scene, s, {
        labels: (I18N.spots(s.kind) || []).slice(0, 3),
        visited: rec.hotspots[s.id] || [],
        collected: rec.items[s.id] || [],
        guideLabel: T('explore.hud.guideShort'),
      });
    } catch (err) {
      engineFail(T('explore.engineError'));
      try { renderer.dispose(); } catch (e2) { /* bỏ qua */ }
      try { renderer.domElement.remove(); } catch (e2) { /* bỏ qua */ }
      return;
    }
    if (!world) {
      engineFail(T('explore.engineError'));
      try { renderer.domElement.remove(); } catch (e2) { /* bỏ qua */ }
      return;
    }

    const player = SC.person({ shirt: '#2e8576', pants: '#2f4a3d', belt: '#f0c97c', hat: false, hair: '#221812' });
    player.group.position.copy(world.spawn);
    player.group.position.y = 0;
    scene.add(player.group);

    const cam = { yaw: 0, pitch: 0.3, dist: 8.6 };
    const ac = new AbortController();
    const signal = ac.signal;

    const keys = { w: false, a: false, s: false, d: false, run: false };
    const joy = { x: 0, y: 0 };
    const state = {
      last: performance.now(),
      raf: 0,
      near: { hotspot: null, mai: false },
      promptKey: '',
      walkPhase: 0,
      heading: 0,
      moving: false,
    };

    const canvas = renderer.domElement;
    let dragging = false;
    let lastX = 0, lastY = 0;

    canvas.addEventListener('pointerdown', (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch { /* bỏ qua */ }
      canvas.classList.add('is-grab');
    }, { signal });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      cam.yaw -= dx * 0.005;
      cam.pitch = Math.max(0.08, Math.min(1.1, cam.pitch + dy * 0.0035));
    }, { signal });
    const endDrag = () => { dragging = false; canvas.classList.remove('is-grab'); };
    canvas.addEventListener('pointerup', endDrag, { signal });
    canvas.addEventListener('pointercancel', endDrag, { signal });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      cam.dist = Math.max(4.6, Math.min(15, cam.dist + e.deltaY * 0.006));
    }, { passive: false, signal });

    const joyEl = host.querySelector('#exJoy');
    if (joyEl) {
      const knob = joyEl.querySelector('.ex-joy-knob');
      let joyId = null;
      const updateJoy = (ev) => {
        const rect = joyEl.getBoundingClientRect();
        let dx = (ev.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        let dy = (ev.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        const len = Math.hypot(dx, dy);
        if (len > 1) { dx /= len; dy /= len; }
        joy.x = dx;
        joy.y = -dy;
        if (knob) knob.style.transform = `translate(${dx * 30}px, ${dy * 30}px)`;
      };
      joyEl.addEventListener('pointerdown', (ev) => {
        joyId = ev.pointerId;
        try { joyEl.setPointerCapture(joyId); } catch { /* bỏ qua */ }
        updateJoy(ev);
        ev.preventDefault();
      }, { signal });
      joyEl.addEventListener('pointermove', (ev) => { if (joyId === ev.pointerId) updateJoy(ev); }, { signal });
      const endJoy = () => {
        joyId = null;
        joy.x = 0;
        joy.y = 0;
        if (knob) knob.style.transform = '';
      };
      joyEl.addEventListener('pointerup', endJoy, { signal });
      joyEl.addEventListener('pointercancel', endJoy, { signal });
    }

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    try { ro.observe(mount); } catch { /* bỏ qua */ }

    function blockedAt(x, z) {
      const rad = 0.42;
      if (world.walkable && !world.walkable(x, z)) return true;
      const b = world.bounds;
      if (b) {
        if (x < b.x1 + rad || x > b.x2 - rad || z < b.z1 + rad || z > b.z2 - rad) return true;
      } else if (Math.hypot(x, z - 3) > 30) {
        return true;
      }
      for (const c of world.colliders || []) {
        if (c.type === 'circle') {
          if (Math.hypot(x - c.x, z - c.z) < c.r + rad) return true;
        } else if (x > c.x1 - rad && x < c.x2 + rad && z > c.z1 - rad && z < c.z2 + rad) {
          return true;
        }
      }
      if (Math.hypot(x - world.mai.pos.x, z - world.mai.pos.z) < 0.9) return true;
      return false;
    }

    function setPrompt(hotspot, maiNear) {
      const el = host && host.querySelector('#exPrompt');
      if (!el) return;
      const key = (hotspot ? 'h' + hotspot.id : '') + '|' + (maiNear ? 'm' : '');
      if (key === state.promptKey) return;
      state.promptKey = key;
      if (!hotspot && !maiNear) { el.hidden = true; el.innerHTML = ''; return; }
      const rows = [];
      if (hotspot) rows.push(`<span class="ex-key">E</span><span class="ex-prompt-tx">${N(hotspot.label)}</span>`);
      if (maiNear) rows.push(`<span class="ex-key q">Q</span><span class="ex-prompt-tx">${N(T('explore.hud.talk'))} · Mai</span>`);
      el.innerHTML = rows.join('');
      el.hidden = false;
    }

    function interact() {
      if (state.near.hotspot) openHotspot(state.near.hotspot);
      else if (state.near.mai) openTalk();
      else U.toast(T('explore.reward.needNear'), I.pin);
    }

    function tick(now) {
      const dt = Math.min(0.05, Math.max(0.001, (now - state.last) / 1000));
      state.last = now;

      let ix = (keys.d ? 1 : 0) - (keys.a ? 1 : 0) + joy.x;
      let iy = (keys.w ? 1 : 0) - (keys.s ? 1 : 0) + joy.y;
      const len = Math.hypot(ix, iy);
      if (len > 1) { ix /= len; iy /= len; }
      const moving = Math.hypot(ix, iy) > 0.06;

      if (moving) {
        const sin = Math.sin(cam.yaw);
        const cos = Math.cos(cam.yaw);
        const dx = (-sin * iy) + (cos * ix);
        const dz = (-cos * iy) - (sin * ix);
        const dl = Math.hypot(dx, dz) || 1;
        const speed = (keys.run ? RUN_SPEED : MAX_SPEED) * Math.min(1, Math.hypot(ix, iy));
        const nx = player.group.position.x + (dx / dl) * speed * dt;
        const nz = player.group.position.z + (dz / dl) * speed * dt;
        if (!blockedAt(nx, player.group.position.z)) player.group.position.x = nx;
        if (!blockedAt(player.group.position.x, nz)) player.group.position.z = nz;
        state.heading = Math.atan2(dx, dz);
        state.walkPhase += dt * (keys.run ? 11 : 8);
      }
      let diff = state.heading - player.group.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      player.group.rotation.y += diff * Math.min(1, dt * 12);
      const swing = moving ? Math.sin(state.walkPhase) * (keys.run ? 0.75 : 0.52) : 0;
      player.legL.rotation.x = swing;
      player.legR.rotation.x = -swing;
      player.armL.rotation.x = -swing * 0.7;
      player.armR.rotation.x = swing * 0.7;
      player.group.position.y = moving ? Math.abs(Math.sin(state.walkPhase)) * 0.035 : 0;

      const px = player.group.position.x;
      const pz = player.group.position.z;
      let best = null;
      let bestDist = Infinity;
      for (const h of world.hotspots || []) {
        const d = Math.hypot(px - h.pos.x, pz - h.pos.z);
        if (d < (h.radius || 3.4) && d < bestDist) { best = h; bestDist = d; }
      }
      const maiNear = Math.hypot(px - world.mai.pos.x, pz - world.mai.pos.z) < 2.7;
      state.near.hotspot = best;
      state.near.mai = maiNear;
      setPrompt(best, maiNear);

      for (const it of world.items || []) {
        if (it.collected) continue;
        if (Math.hypot(px - it.pos.x, pz - it.pos.z) < 1.35) collectItem(it);
      }

      const wantX = px + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist;
      const wantZ = pz + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist;
      const wantY = 1.25 + Math.sin(cam.pitch) * cam.dist;
      const k = 1 - Math.pow(0.0015, dt);
      camera.position.x += (wantX - camera.position.x) * k;
      camera.position.y += (wantY - camera.position.y) * k;
      camera.position.z += (wantZ - camera.position.z) * k;
      camera.lookAt(px, 1.25, pz);

      world.update(now, dt);
      renderer.render(scene, camera);
      if (engine && engine.token === token) {
        state.raf = requestAnimationFrame(tick);
        engine.raf = state.raf;
      }
    }

    camera.position.set(world.spawn.x, 4.4, world.spawn.z + 8.6);
    camera.lookAt(world.spawn.x, 1.25, world.spawn.z);

    engine = {
      token, renderer, scene, camera, world, player, cam, keys, joy,
      ac, ro, state,
      interact,
      raf: 0,
    };
    const loading = host.querySelector('#exLoading');
    if (loading) loading.classList.add('is-gone');
    setTimeout(() => { if (loading && loading.parentNode) loading.remove(); }, 500);
    state.raf = requestAnimationFrame(tick);
    engine.raf = state.raf;
  }

  function teardownEngine() {
    engineToken++;
    if (!engine) return;
    const e = engine;
    engine = null;
    cancelAnimationFrame(e.raf);
    try { e.ac.abort(); } catch { /* bỏ qua */ }
    try { e.ro.disconnect(); } catch { /* bỏ qua */ }
    try { e.renderer.dispose(); } catch { /* bỏ qua */ }
    try {
      const c = e.renderer.domElement;
      if (c && c.parentNode) c.parentNode.removeChild(c);
    } catch { /* bỏ qua */ }
    stopSpeech();
  }

  function engineInteract() {
    if (engine && engine.interact) engine.interact();
  }

  /* ---------------- Sự kiện ---------------- */
  function isTyping(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function onKeyDown(e) {
    if (!active || !engine) return;
    const input = e.target && e.target.id === 'exAsk';
    if (input && e.key !== 'Escape') return;
    const moveKey = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', ArrowUp: 'w', ArrowLeft: 'a', ArrowDown: 's', ArrowRight: 'd' }[e.code];
    if (moveKey) {
      engine.keys[moveKey] = true;
      e.preventDefault();
      return;
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { engine.keys.run = true; return; }
    if (e.code === 'KeyE') { e.preventDefault(); engineInteract(); return; }
    if (e.code === 'KeyQ') { e.preventDefault(); openTalk(); return; }
    if (e.code === 'Escape') {
      const help = host.querySelector('#exHelp');
      const voice = host.querySelector('#exVoice');
      if (help && !help.hidden) { help.hidden = true; return; }
      if (voice && !voice.hidden) { voice.hidden = true; return; }
      if (infoH) closeInfo();
    }
  }

  function onKeyUp(e) {
    if (!engine) return;
    const moveKey = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', ArrowUp: 'w', ArrowLeft: 'a', ArrowDown: 's', ArrowRight: 'd' }[e.code];
    if (moveKey) engine.keys[moveKey] = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') engine.keys.run = false;
  }

  function clearKeys() {
    if (!engine) return;
    engine.keys.w = engine.keys.a = engine.keys.s = engine.keys.d = engine.keys.run = false;
    engine.joy.x = 0;
    engine.joy.y = 0;
  }

  function handleAction(a) {
    if (a === 'menu') backToMenu();
    else if (a === 'help') {
      const el = host.querySelector('#exHelp');
      if (el) el.hidden = !el.hidden;
    } else if (a === 'help-close') {
      const el = host.querySelector('#exHelp');
      if (el) el.hidden = true;
    } else if (a === 'voice') {
      const el = host.querySelector('#exVoice');
      if (el) {
        el.hidden = !el.hidden;
        if (!el.hidden) el.innerHTML = voicePanelHtml();
      }
    } else if (a === 'voice-close') {
      const el = host.querySelector('#exVoice');
      if (el) el.hidden = true;
    } else if (a === 'voice-test') {
      const s = curStop();
      if (s) speak(T('explore.chat.hello', { stop: s.name, fact: factText('value', voiceLang()) }));
    } else if (a === 'info-close') {
      closeInfo();
    } else if (a === 'ask-more') {
      closeInfo();
      openTalk();
    } else if (a === 'interact') {
      engineInteract();
    } else if (a === 'talk') {
      openTalk();
    } else if (a === 'prev') {
      prevStop();
    } else if (a === 'next') {
      nextStop();
    } else if (a === 'finish') {
      finishRoute();
    } else if (a === 'quiz') {
      openQuiz();
    }
  }

  function bind() {
    host.addEventListener('click', (e) => {
      const open = e.target.closest('[data-ex-open]');
      if (open) { openRoute(open.dataset.exOpen); return; }
      const chip = e.target.closest('[data-ex-stop]');
      if (chip) { switchStop(Number(chip.dataset.exStop)); return; }
      const intent = e.target.closest('[data-ex-intent]');
      if (intent) { askIntent(intent.dataset.exIntent); return; }
      const read = e.target.closest('[data-ex-read]');
      if (read) {
        const m = chatLog[Number(read.dataset.exRead)];
        if (m) speak(m.speech || m.text);
        return;
      }
      const act = e.target.closest('[data-ex-act]');
      if (act) handleAction(act.dataset.exAct);
    });

    host.addEventListener('submit', (e) => {
      if (!e.target || e.target.id !== 'exForm') return;
      e.preventDefault();
      const input = host.querySelector('#exAsk');
      if (!input) return;
      const val = input.value.trim();
      if (!val) return;
      input.value = '';
      handleAsk(val);
    });

    host.addEventListener('change', (e) => {
      const el = e.target;
      if (!el) return;
      if (el.matches('[data-ex-auto]')) {
        exState().voice.auto = !!el.checked;
        saveState();
      } else if (el.matches('[data-ex-voicelist]')) {
        exState().voice.voiceURI = el.value || '';
        saveState();
        if (el.value) setTimeout(() => speak(T('explore.hud.voiceTitle')), 60);
      }
    });

    host.addEventListener('input', (e) => {
      const el = e.target;
      if (el && el.matches('[data-ex-rate]')) {
        exState().voice.rate = Number(el.value) || 1;
        saveState();
      }
    });

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearKeys);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopSpeech(); });

    if (synth() && !voicesBound) {
      voicesBound = true;
      try {
        synth().addEventListener('voiceschanged', () => {
          const el = host && host.querySelector('#exVoice');
          if (el && !el.hidden) el.innerHTML = voicePanelHtml();
        });
      } catch { /* bỏ qua */ }
    }
  }

  /* ---------------- API ---------------- */
  const E = {};

  E.init = function (opts) {
    hooks = opts || {};
    host = U.$('#exploreBody');
    if (host && !host.dataset.bound) {
      host.dataset.bound = '1';
      bind();
    }
  };

  E.render = function () {
    active = true;
    if (!host) host = U.$('#exploreBody');
    if (!routeId) {
      const ex = exState();
      const last = ex.last;
      if (last && D.tours.some((r) => r.id === last.routeId)) {
        routeId = last.routeId;
        stopIdx = Number(last.stop) || 0;
        mode = 'scene';
      }
    }
    if (mode === 'scene' && routeId) renderScene(false);
    else render();
  };

  E.leave = function () {
    active = false;
    stopSpeech();
    teardownEngine();
  };

  E.refresh = function () {
    if (!active || !host) return;
    if (mode === 'menu') { host.innerHTML = menuHtml(); return; }
    const hello = chatLog.find((m) => m.meta && m.meta.kind === 'hello');
    const s = curStop();
    if (hello && s) {
      const ui = I18N.code();
      const vl = voiceLang();
      hello.text = T('explore.chat.hello', { stop: s.name, fact: factText('value', ui) });
      hello.speech = vl === ui ? hello.text : I18N.raw(vl, 'explore.chat.hello', { stop: s.name, fact: factText('value', vl) });
    }
    renderScene(false);
  };

  E.reset = function () {
    stopSpeech();
    teardownEngine();
    mode = 'menu';
    routeId = null;
    stopIdx = 0;
    chatLog = [];
    infoH = null;
    infoStop = '';
    if (active) render();
  };

  window.Explore = E;
})();
