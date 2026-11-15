/* Sắc Việt – tiện ích chung */
(function () {
  const U = {};

  U.$ = (sel, root = document) => root.querySelector(sel);
  U.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  U.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  U.hash = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };

  U.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  U.pick = (arr, rnd = Math.random) => arr[Math.floor(rnd() * arr.length)];
  U.shuffle = (arr, rnd = Math.random) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  U.nf = (n) => new Intl.NumberFormat(window.I18N ? I18N.locale() : 'vi-VN').format(n);

  U.store = {
    read(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch { return fallback; }
    },
    write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* bỏ qua */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch { /* bỏ qua */ }
    },
  };

  U.debounce = (fn, ms) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  /* ---------- Âm thanh tổng hợp (không cần file) ---------- */
  const Audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (this.ctx) return this.ctx;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
      return this.ctx;
    },
    unlock() {
      const ctx = this.ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },
    setMuted(v) { this.muted = !!v; },
    tone(freq, dur = 0.18, type = 'sine', when = 0, gain = 0.5) {
      if (this.muted) return;
      const ctx = this.ensure(); if (!ctx) return;
      const t0 = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(this.master);
      osc.start(t0); osc.stop(t0 + dur + 0.05);
    },
    glide(f1, f2, dur = 0.25, type = 'sawtooth', gain = 0.35) {
      if (this.muted) return;
      const ctx = this.ensure(); if (!ctx) return;
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 1200;
      osc.type = type;
      osc.frequency.setValueAtTime(f1, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(filter); filter.connect(g); g.connect(this.master);
      osc.start(t0); osc.stop(t0 + dur + 0.05);
    },
    click() { this.tone(620, 0.06, 'triangle', 0, 0.25); },
    correct() {
      this.tone(784, 0.16, 'sine', 0, 0.4);
      this.tone(1046.5, 0.22, 'sine', 0.09, 0.35);
      this.tone(1568, 0.3, 'sine', 0.18, 0.28);
    },
    wrong() { this.glide(240, 150, 0.32, 'sawtooth', 0.25); },
    lotus() {
      this.tone(1318.5, 0.18, 'triangle', 0, 0.25);
      this.tone(1760, 0.28, 'sine', 0.07, 0.22);
    },
    fanfare() {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((f, i) => this.tone(f, 0.32, i === 4 ? 'sine' : 'triangle', i * 0.12, 0.32));
    },
    firework() {
      if (this.muted) return;
      const ctx = this.ensure(); if (!ctx) return;
      const t0 = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 0.55);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const decay = Math.pow(1 - i / len, 2.6);
        data[i] = (Math.random() * 2 - 1) * decay;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, t0);
      filter.frequency.exponentialRampToValueAtTime(300, t0 + 0.5);
      const g = ctx.createGain();
      g.gain.value = 0.5;
      src.connect(filter); filter.connect(g); g.connect(this.master);
      src.start(t0);
    },
  };
  U.audio = Audio;

  /* ---------- Toast ---------- */
  let toastTimer = null;
  U.toast = (msg, icon = '✦') => {
    let node = document.getElementById('toast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'toast';
      node.className = 'toast';
      document.body.appendChild(node);
    }
    node.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
    node.classList.remove('show');
    void node.offsetWidth;
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 2800);
  };

  window.U = U;
})();
