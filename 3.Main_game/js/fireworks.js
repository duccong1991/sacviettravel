/* Sắc Việt – pháo hoa canvas cho màn chúc mừng 5/5 */
(function () {
  const F = {};
  let canvas = null;
  let ctx = null;
  let raf = null;
  let running = false;
  let particles = [];
  let rockets = [];
  let lastSpawn = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let hueSeed = Math.random() * 360;

  const HUES = [45, 168, 8, 200, 330, 285, 52];

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth || window.innerWidth || 900;
    height = canvas.clientHeight || window.innerHeight || 600;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnRocket() {
    const x = width * (0.16 + Math.random() * 0.68);
    rockets.push({
      x,
      y: height + 12,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(height * (0.011 + Math.random() * 0.005)),
      targetY: height * (0.12 + Math.random() * 0.34),
      hue: HUES[Math.floor(Math.random() * HUES.length)],
      trail: 0,
    });
  }

  function explode(x, y, hue) {
    const count = 90 + Math.floor(Math.random() * 60);
    const speed = 2.4 + Math.random() * 2.3;
    const spread = Math.random() * 0.35 + 0.8;
    const ringBias = Math.random() < 0.3;
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.12;
      const v = speed * (ringBias ? 1 : 0.4 + Math.random() * 0.9);
      particles.push({
        x, y,
        vx: Math.cos(a) * v * spread,
        vy: Math.sin(a) * v * spread,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        hue: hue + (Math.random() - 0.5) * 34,
        size: 1.3 + Math.random() * 2,
        gravity: 0.028,
        drag: 0.982,
        twinkle: Math.random() * 2,
      });
    }
    if (U.audio && !U.audio.muted) U.audio.firework();
  }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    if (now - lastSpawn > 210 + Math.random() * 170) {
      lastSpawn = now;
      if (rockets.length < 6) spawnRocket();
      if (Math.random() < 0.22) spawnRocket();
    }

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.x += r.vx;
      r.y += r.vy;
      r.vy += 0.045;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${r.hue}, 90%, 78%, 0.95)`;
      ctx.arc(r.x, r.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = `hsla(${r.hue}, 90%, 70%, 0.3)`;
      ctx.lineWidth = 1.4;
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - r.vx * 6, r.y - r.vy * 6);
      ctx.stroke();
      if (r.y <= r.targetY || r.vy >= -0.6) {
        explode(r.x, r.y, r.hue);
        rockets.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      const alpha = Math.max(0, p.life);
      const flick = p.life > 0.5 ? 1 : 0.65 + 0.35 * Math.sin((p.life + p.twinkle) * 40);
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 100%, ${44 + 22 * alpha}%, ${alpha * flick * 0.92})`;
      ctx.arc(p.x, p.y, p.size * (0.6 + alpha * 0.7), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  F.start = function (el, opts = {}) {
    canvas = el;
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    running = true;
    particles = [];
    rockets = [];
    lastSpawn = performance.now();
    hueSeed += 37;
    window.addEventListener('resize', resize);

    const count = opts.count || 5;
    for (let i = 0; i < count; i++) {
      setTimeout(() => { if (running) spawnRocket(); }, i * 280);
    }
    explode(width * 0.32, height * 0.3, HUES[hueSeed % HUES.length]);
    setTimeout(() => { if (running) explode(width * 0.68, height * 0.24, HUES[(hueSeed + 3) % HUES.length]); }, 260);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  };

  F.burst = function (n = 3) {
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        if (!running) return;
        explode(width * (0.2 + Math.random() * 0.6), height * (0.18 + Math.random() * 0.3), HUES[Math.floor(Math.random() * HUES.length)]);
      }, i * 220);
    }
  };

  F.stop = function () {
    running = false;
    cancelAnimationFrame(raf);
    raf = null;
    window.removeEventListener('resize', resize);
    if (ctx && canvas) {
      ctx.clearRect(0, 0, width, height);
    }
    particles = [];
    rockets = [];
    canvas = null;
    ctx = null;
  };

  window.Fireworks = F;
})();
