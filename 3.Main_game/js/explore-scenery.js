/* Sắc Việt – dựng cảnh 3D thủ tục cho hành trình khám phá.
   Mỗi điểm dừng có một phong cách riêng: thành cổ, vịnh karst, núi, phố cổ,
   dinh thự, chợ nổi, rừng ngập mặn, thác, ải, hồ, tháp Chăm, đồi cát. */
(function () {
  const THREEM = () => window.THREE;
  const matCache = new Map();

  function shade(hex, amt) {
    const n = parseInt(String(hex).replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    const b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function mat(color, opts) {
    const THREE = THREEM();
    const key = color + '|' + JSON.stringify(opts || {});
    if (matCache.has(key)) return matCache.get(key);
    const m = new THREE.MeshStandardMaterial(Object.assign({
      color: new THREE.Color(color), roughness: 0.92, metalness: 0.02,
    }, opts || {}));
    matCache.set(key, m);
    return m;
  }

  function glowMat(color, intensity) {
    const THREE = THREEM();
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color), emissive: new THREE.Color(color),
      emissiveIntensity: intensity == null ? 0.9 : intensity, roughness: 0.5,
    });
  }

  const texCache = new Map();
  function canvasTex(key, w, h, draw) {
    const THREE = THREEM();
    if (texCache.has(key)) return texCache.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    draw(canvas.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(canvas);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    texCache.set(key, tex);
    return tex;
  }

  function groundDetail(color) {
    const tex = canvasTex('ground|' + color, 256, 256, (c, w, h) => {
      const rnd = U.rng(U.hash(color + '|ground'));
      c.fillStyle = '#ffffff';
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 24; i++) {
        const x = rnd() * w, y = rnd() * h, r = 12 + rnd() * 40;
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rnd() < 0.5 ? 'rgba(0,0,0,.055)' : 'rgba(255,255,255,.06)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
      }
      for (let i = 0; i < 2400; i++) {
        const a = 0.03 + rnd() * 0.09;
        c.fillStyle = rnd() < 0.55 ? 'rgba(0,0,0,' + a.toFixed(3) + ')' : 'rgba(255,255,255,' + (a * 0.9).toFixed(3) + ')';
        c.beginPath(); c.arc(rnd() * w, rnd() * h, 0.6 + rnd() * 2, 0, 6.283); c.fill();
      }
    });
    tex.repeat.set(14, 14);
    return tex;
  }

  function softDot() {
    return canvasTex('soft-dot', 64, 64, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.45, 'rgba(255,255,255,.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
    });
  }

  function cloudTexture() {
    return canvasTex('cloud-soft', 256, 128, (c, w, h) => {
      const rnd = U.rng(551);
      c.clearRect(0, 0, w, h);
      for (let i = 0; i < 16; i++) {
        const x = 34 + rnd() * (w - 68), y = 46 + rnd() * (h - 72), r = 20 + rnd() * 36;
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,.95)');
        g.addColorStop(0.55, 'rgba(255,255,255,.5)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
      }
    });
  }

  function grassTexture() {
    return canvasTex('grass-blades', 128, 128, (c, w, h) => {
      const rnd = U.rng(313);
      c.clearRect(0, 0, w, h);
      c.lineCap = 'round';
      const tones = ['#3f6b34', '#4d7a3d', '#5f8f4a', '#719d54', '#83ab60'];
      for (let i = 0; i < 30; i++) {
        const x = 6 + rnd() * (w - 12);
        const len = 44 + rnd() * 76;
        const bend = (rnd() - 0.5) * 34;
        c.strokeStyle = tones[Math.floor(rnd() * tones.length)];
        c.lineWidth = 1.4 + rnd() * 1.8;
        c.beginPath();
        c.moveTo(x, h);
        c.quadraticCurveTo(x + bend * 0.4, h - len * 0.6, x + bend, h - len);
        c.stroke();
      }
    });
  }

  let GRASS_GEO = null;
  function grassGeo() {
    if (GRASS_GEO) return GRASS_GEO;
    const THREE = THREEM();
    const verts = [], uvs = [], indices = [];
    const quad = (ang) => {
      const cos = Math.cos(ang), sin = Math.sin(ang);
      const hw = 0.46, hh = 0.86;
      const base = verts.length / 3;
      verts.push(-hw * cos, 0, -hw * sin, hw * cos, 0, hw * sin, hw * cos, hh, hw * sin, -hw * cos, hh, -hw * sin);
      uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    quad(0);
    quad(Math.PI / 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    GRASS_GEO = g;
    return g;
  }

  function add(geo, material, x, y, z, parent, opts = {}) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    if (opts.rx) m.rotation.x = opts.rx;
    if (opts.ry) m.rotation.y = opts.ry;
    if (opts.rz) m.rotation.z = opts.rz;
    if (opts.sx != null) m.scale.x = opts.sx;
    if (opts.sy != null) m.scale.y = opts.sy;
    if (opts.sz != null) m.scale.z = opts.sz;
    m.castShadow = opts.cast !== false;
    m.receiveShadow = opts.receive !== false;
    (parent || sceneRoot).add(m);
    return m;
  }
  let sceneRoot = null;

  function box(w, h, d, color, x, y, z, parent, opts = {}) {
    return add(new THREE.BoxGeometry(w, h, d), mat(color, opts.mopts), x, y, z, parent, Object.assign({}, opts));
  }
  function cyl(rt, rb, h, seg, color, x, y, z, parent, opts = {}) {
    return add(new THREE.CylinderGeometry(rt, rb, h, seg || 12), mat(color, opts.mopts), x, y, z, parent, Object.assign({}, opts));
  }
  function cone(r, h, seg, color, x, y, z, parent, opts = {}) {
    return add(new THREE.ConeGeometry(r, h, seg || 7), mat(color, opts.mopts), x, y, z, parent, Object.assign({}, opts));
  }
  function sph(r, color, x, y, z, parent, opts = {}) {
    return add(new THREE.SphereGeometry(r, opts.seg || 12, opts.seg2 || 9), mat(color, opts.mopts), x, y, z, parent, Object.assign({}, opts));
  }
  function plane(w, h, color, x, y, z, parent, opts = {}) {
    return add(new THREE.PlaneGeometry(w, h), mat(color, Object.assign({ side: THREE.DoubleSide }, opts.mopts)), x, y, z, parent, Object.assign({ rx: -Math.PI / 2 }, opts));
  }

  function pyramidGeo(w, d, h) {
    const THREE = THREEM();
    const hw = w / 2, hd = d / 2;
    const v = new Float32Array([
      -hw, 0, -hd, hw, 0, -hd, hw, 0, hd, -hw, 0, hd, 0, h, 0,
    ]);
    const idx = [0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4, 0, 3, 2, 0, 2, 1];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(v, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  function pyramid(w, d, h, color, x, y, z, parent, opts = {}) {
    return add(pyramidGeo(w, d, h), mat(color, opts.mopts), x, y, z, parent, opts);
  }

  function flag(color, x, y, z, parent, scale = 1) {
    const g = new THREE.Group();
    const pole = cyl(0.06, 0.08, 7 * scale, 8, '#e8e0cc', 0, 3.5 * scale, 0, g, { cast: true });
    const cloth = box(2.4 * scale, 1.5 * scale, 0.06, color, 1.2 * scale, 5.9 * scale, 0, g, { cast: false });
    const star = new THREE.Mesh(starGeo(0.42 * scale, 0.19 * scale), glowMat('#ffd85e', 0.5));
    star.position.set(0.05 * scale, 0.06 * scale, 0.05);
    cloth.add(star);
    g.position.set(x, y, z);
    parent.add(g);
    return { group: g, cloth };
  }

  function starGeo(r1, r2) {
    const THREE = THREEM();
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? r2 : r1;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }

  function sky(scene, p) {
    const THREE = THREEM();
    const geo = new THREE.SphereGeometry(160, 40, 24);
    const sunDir = new THREE.Vector3(20, 32, 14).normalize();
    const horizon = new THREE.Color(p.sky2 || p.sky).lerp(new THREE.Color(p.sun || '#fff4d0'), 0.16);
    const m = new THREE.ShaderMaterial({
      uniforms: {
        top: { value: new THREE.Color(p.sky) },
        horizon: { value: horizon },
        sunColor: { value: new THREE.Color(p.sun || '#fff4d0') },
        sunDir: { value: sunDir },
      },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: [
        'uniform vec3 top; uniform vec3 horizon; uniform vec3 sunColor; uniform vec3 sunDir;',
        'varying vec3 vW;',
        'void main(){',
        '  vec3 d = normalize(vW);',
        '  float up = clamp(d.y, 0.0, 1.0);',
        '  vec3 col = mix(horizon, top, pow(up, 0.45));',
        '  col = mix(col, horizon, pow(1.0 - up, 7.0) * 0.4);',
        '  float s = max(dot(d, normalize(sunDir)), 0.0);',
        '  col += sunColor * (pow(s, 1200.0) * 2.2 + pow(s, 90.0) * 0.4 + pow(s, 9.0) * 0.12);',
        '  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);',
        '  col += (grain - 0.5) / 255.0;',
        '  gl_FragColor = vec4(col, 1.0);',
        '  #include <tonemapping_fragment>',
        '  #include <colorspace_fragment>',
        '}',
      ].join('\n'),
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    const dome = new THREE.Mesh(geo, m);
    scene.add(dome);
    scene.fog = new THREE.Fog(new THREE.Color(p.fog || p.sky2 || p.sky), 42, 118);
    return dome;
  }

  function ground(scene, p, radius, pool) {
    const geo = new THREE.CircleGeometry(radius || 36, 96);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const r = Math.hypot(x, z);
      if (r > 14) {
        const k = (r - 14) / Math.max(1, (radius || 36) - 14);
        pos.setY(i, (Math.sin(x * 0.21) + Math.cos(z * 0.17) + Math.sin((x + z) * 0.11)) * 0.34 * k);
      }
    }
    geo.computeVertexNormals();
    const gm = new THREE.MeshStandardMaterial({
      color: new THREE.Color(p.ground), roughness: 0.97, metalness: 0,
      map: groundDetail(p.ground),
    });
    const g = new THREE.Mesh(geo, gm);
    g.receiveShadow = true;
    scene.add(g);
    return g;
  }

  let waterMatCache = null;
  function waterMaterial(p) {
    const THREE = THREEM();
    const base = p.water || '#3f8f9f';
    const key = base + '|' + (p.sky2 || p.sky) + '|' + (p.sun || '');
    if (waterMatCache && waterMatCache.key === key) return waterMatCache.make();
    waterMatCache = {
      key,
      make() {
        return new THREE.ShaderMaterial({
          uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib.fog,
            {
              uTime: { value: 0 },
              uDeep: { value: new THREE.Color(shade(base, -62)) },
              uShallow: { value: new THREE.Color(shade(base, 18)) },
              uSky: { value: new THREE.Color(p.sky2 || p.sky) },
              uSunDir: { value: new THREE.Vector3(20, 32, 14).normalize() },
            },
          ]),
          vertexShader: [
            'uniform float uTime;',
            'varying vec3 vWorld;',
            '#include <fog_pars_vertex>',
            'void main(){',
            '  vec3 pos = position;',
            '  pos.y += sin(pos.x * 0.34 + uTime * 0.9) * 0.055 + sin(pos.z * 0.46 - uTime * 0.7) * 0.045;',
            '  vec4 wp = modelMatrix * vec4(pos, 1.0);',
            '  vWorld = wp.xyz;',
            '  vec4 mvPosition = viewMatrix * wp;',
            '  gl_Position = projectionMatrix * mvPosition;',
            '  #include <fog_vertex>',
            '}',
          ].join('\n'),
          fragmentShader: [
            'uniform float uTime;',
            'uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSky; uniform vec3 uSunDir;',
            'varying vec3 vWorld;',
            '#include <fog_pars_fragment>',
            'void main(){',
            '  vec3 viewDir = normalize(cameraPosition - vWorld);',
            '  float ripple = sin(vWorld.x * 1.45 + uTime * 1.1) * sin(vWorld.z * 1.25 - uTime * 0.9);',
            '  float ripple2 = sin(vWorld.x * 4.3 - uTime * 2.2) * sin(vWorld.z * 3.7 + uTime * 1.7);',
            '  vec3 col = mix(uDeep, uShallow, 0.42 + ripple * 0.16 + ripple2 * 0.05);',
            '  float fres = pow(1.0 - clamp(viewDir.y, 0.0, 1.0), 3.0);',
            '  col = mix(col, uSky, 0.10 + fres * 0.2);',
            '  float glint = pow(max(0.0, ripple * 0.6 + ripple2 * 0.4), 10.0);',
            '  col += vec3(1.0, 0.96, 0.84) * glint * 0.42;',
            '  vec3 refl = reflect(-viewDir, vec3(0.0, 1.0, 0.0));',
            '  float spec = pow(max(dot(refl, normalize(uSunDir)), 0.0), 70.0);',
            '  col += vec3(1.0, 0.94, 0.76) * spec * 0.72;',
            '  gl_FragColor = vec4(col, 0.95);',
            '  #include <tonemapping_fragment>',
            '  #include <colorspace_fragment>',
            '  #include <fog_fragment>',
            '}',
          ].join('\n'),
          transparent: true, fog: true, depthWrite: true,
        });
      },
    };
    return waterMatCache.make();
  }

  function water(scene, p, y, size, z, w, d) {
    const THREE = THREEM();
    const ww = w || size || 180, dd = d || size || 180;
    const seg = Math.min(64, Math.max(12, Math.round(Math.max(ww, dd) / 5)));
    const geo = new THREE.PlaneGeometry(ww, dd, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const m = waterMaterial(p);
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(0, y == null ? -0.22 : y, z || 0);
    mesh.receiveShadow = true;
    mesh.userData.waterMat = m;
    scene.add(mesh);
    return { mesh };
  }

  function clouds(scene, rnd, p, count) {
    const THREE = THREEM();
    const g = new THREE.Group();
    const tex = cloudTexture();
    const tint = new THREE.Color('#ffffff').lerp(new THREE.Color(p.sky2 || '#eaf2f5'), 0.28);
    const m = new THREE.SpriteMaterial({
      map: tex, color: tint, transparent: true, opacity: 0.6, depthWrite: false, fog: false,
    });
    for (let i = 0; i < (count || 7); i++) {
      const c = new THREE.Group();
      const n = 4 + Math.floor(rnd() * 3);
      for (let j = 0; j < n; j++) {
        const sp = new THREE.Sprite(m);
        const sc = 10 + rnd() * 15;
        sp.scale.set(sc * 1.7, sc * 0.72, 1);
        sp.position.set((j - n / 2) * (sc * 0.52) + rnd() * 4, rnd() * 3.2, (rnd() - 0.5) * 7);
        c.add(sp);
      }
      c.position.set((rnd() - 0.5) * 110, 25 + rnd() * 12, (rnd() - 0.5) * 95 - 10);
      g.add(c);
    }
    scene.add(g);
    return g;
  }

  function atmosphere(scene, rnd, p) {
    const THREE = THREEM();
    const dot = softDot();

    const count = 110;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rnd() - 0.5) * 50;
      pos[i * 3 + 1] = 0.4 + rnd() * 7.5;
      pos[i * 3 + 2] = (rnd() - 0.5) * 44 + 2;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pm = new THREE.PointsMaterial({
      map: dot, color: new THREE.Color('#ffe9ae'), size: 0.16, transparent: true,
      opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });
    const motes = new THREE.Points(pg, pm);
    motes.frustumCulled = false;
    scene.add(motes);

    const mist = new THREE.Group();
    const mm = new THREE.SpriteMaterial({
      map: dot, color: new THREE.Color(p.sky2 || '#eaf6f4'), transparent: true,
      opacity: 0.11, depthWrite: false, fog: false,
    });
    for (let i = 0; i < 8; i++) {
      const sp = new THREE.Sprite(mm);
      const sc = 16 + rnd() * 22;
      sp.scale.set(sc * 1.8, sc * 0.42, 1);
      sp.position.set((rnd() - 0.5) * 58, 0.8 + rnd() * 1.8, (rnd() - 0.5) * 46);
      sp.userData.drift = 0.25 + rnd() * 0.5;
      mist.add(sp);
    }
    scene.add(mist);

    const birds = [];
    const wingMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#2e3b38'), roughness: 0.9 });
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Group();
      const wl = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.16), wingMat);
      const wr = wl.clone();
      wl.position.x = -0.31;
      wr.position.x = 0.31;
      b.add(wl, wr);
      b.userData = {
        wl, wr, phase: rnd() * 6.28, radius: 26 + rnd() * 10,
        height: 22 + rnd() * 8, speed: (0.08 + rnd() * 0.06) * (i % 2 ? 1 : -1),
      };
      scene.add(b);
      birds.push(b);
    }
    return { motes, mist, birds };
  }

  function mountains(scene, rnd, p, count, color, hMin, hMax) {
    const THREE = THREEM();
    const haze = new THREE.Color(p.sky2 || p.sky);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rnd() * 0.3;
      const r = 32 + rnd() * 10;
      const h = hMin + rnd() * (hMax - hMin);
      const col = new THREE.Color(color).lerp(haze, 0.14 + ((r - 32) / 10) * 0.2 + rnd() * 0.1);
      if (i % 3 === 0) col.offsetHSL(0, 0.05, 0.06);
      const m = cone(5 + rnd() * 6, h, 6, '#' + col.getHexString(), Math.cos(a) * r, h / 2 - 1.5, Math.sin(a) * r, scene);
      m.rotation.y = rnd() * Math.PI;
      m.receiveShadow = false;
    }
  }

  function tree(x, z, parent, p, scale) {
    const s = scale || (0.85 + Math.random() * 0.5);
    const g = new THREE.Group();
    cyl(0.14 * s, 0.2 * s, 2.1 * s, 7, '#6b4a2f', 0, 1.05 * s, 0, g);
    sph(1.15 * s, p.foliage, 0, 2.6 * s, 0, g, { seg: 10, seg2: 8 });
    sph(0.8 * s, shade(p.foliage, 12), 0.6 * s, 3.2 * s, 0.1 * s, g, { seg: 9, seg2: 7 });
    sph(0.7 * s, shade(p.foliage, -8), -0.55 * s, 2.9 * s, -0.4 * s, g, { seg: 9, seg2: 7 });
    g.position.set(x, 0, z);
    parent.add(g);
    return g;
  }

  function pine(x, z, parent, p, scale) {
    const s = scale || (0.9 + Math.random() * 0.5);
    cyl(0.12 * s, 0.18 * s, 4.4 * s, 7, '#5b4128', 0, 2.2 * s, 0, parent);
    for (let i = 0; i < 3; i++) {
      cone(1.4 * s - i * 0.28 * s, 1.7 * s, 8, i === 2 ? shade(p.foliage, 10) : p.foliage, x, (2.4 + i * 1.05) * s, z, parent);
    }
  }

  function palm(x, z, parent, p, scale) {
    const s = scale || (0.9 + Math.random() * 0.4);
    const g = new THREE.Group();
    let px = 0, py = 0;
    for (let i = 0; i < 6; i++) {
      const seg = cyl(0.13 * s, 0.16 * s, 0.72 * s, 6, '#8a6a3f', px, py + 0.34 * s, 0, g);
      px += 0.09 * s; py += 0.66 * s;
      seg.rotation.z = -0.07;
    }
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.8 * s, 0.05 * s, 0.34 * s), mat(shade(p.foliage, 6)));
      leaf.position.set(px + Math.cos(a) * 0.8 * s, py + 0.35 * s - Math.sin(a * 2) * 0.15 * s, Math.sin(a) * 0.8 * s);
      leaf.rotation.y = -a;
      leaf.rotation.z = -0.32;
      leaf.castShadow = true;
      g.add(leaf);
    }
    sph(0.3 * s, '#7a5a32', px, py + 0.2 * s, 0, g);
    g.position.set(x, 0, z);
    parent.add(g);
    return g;
  }

  function bamboo(x, z, parent, p) {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const h = 3 + Math.random() * 2;
      const b = cyl(0.06, 0.08, h, 5, i % 2 ? '#7f9a4a' : '#8fae55', (Math.random() - 0.5) * 0.6, h / 2, (Math.random() - 0.5) * 0.6, g);
      b.rotation.z = (Math.random() - 0.5) * 0.12;
      sph(0.55, shade(p.foliage, 18), b.position.x, h - 0.1, b.position.z, g, { seg: 8, seg2: 6, sy: 0.7 });
    }
    g.position.set(x, 0, z);
    parent.add(g);
    return g;
  }

  function mangrove(x, z, parent, p) {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const root = cyl(0.04, 0.09, 1.5, 5, '#5a4a32', Math.cos(a) * 0.35, 0.65, Math.sin(a) * 0.35, g);
      root.rotation.z = Math.cos(a) * 0.42;
      root.rotation.x = -Math.sin(a) * 0.42;
    }
    cyl(0.1, 0.15, 1.4, 6, '#5f4a30', 0, 1.1, 0, g);
    sph(1.05, p.foliage, 0, 2.1, 0, g, { seg: 10, seg2: 8, sy: 0.7 });
    sph(0.65, shade(p.foliage, 12), 0.5, 2.5, 0.2, g, { seg: 8, seg2: 6, sy: 0.7 });
    g.position.set(x, 0, z);
    parent.add(g);
    return g;
  }

  function palmGrass(parent, p, count, r0, r1) {
    const THREE = THREEM();
    const geo = grassGeo();
    const gm = new THREE.MeshStandardMaterial({
      map: grassTexture(), alphaTest: 0.4, side: THREE.DoubleSide,
      roughness: 1, metalness: 0, color: new THREE.Color('#cfe0b4').lerp(new THREE.Color(p.foliage), 0.3),
    });
    const inst = new THREE.InstancedMesh(geo, gm, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = r0 + Math.random() * (r1 - r0);
      dummy.position.set(Math.cos(a) * r, 0, Math.sin(a) * r + 1);
      dummy.rotation.y = Math.random() * Math.PI;
      const sc = 0.45 + Math.random() * 0.5;
      dummy.scale.set(sc, sc * (0.7 + Math.random() * 0.35), sc);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.castShadow = false;
    inst.receiveShadow = false;
    parent.add(inst);
    return inst;
  }

  function labelSprite(text, opts = {}) {
    const THREE = THREEM();
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, 512, 128);
    c.font = '600 ' + (opts.font || 38) + 'px "Be Vietnam Pro","Noto Sans",sans-serif';
    const w = Math.min(496, Math.max(150, c.measureText(text).width + 56));
    const x = (512 - w) / 2;
    c.fillStyle = opts.bg || 'rgba(7,29,25,.82)';
    roundRect(c, x, 26, w, 74, 22);
    c.fill();
    c.strokeStyle = opts.border || 'rgba(240,201,124,.9)';
    c.lineWidth = 3;
    roundRect(c, x, 26, w, 74, 22);
    c.stroke();
    c.fillStyle = opts.color || '#f6e6c5';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, 256, 65);
    const tex = new THREE.CanvasTexture(canvas);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(m);
    sprite.scale.set(opts.scale || 3.6, (opts.scale || 3.6) * 0.25, 1);
    return sprite;
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  function person(opts = {}) {
    const g = new THREE.Group();
    const skin = opts.skin || '#e8b98f';
    const shirt = opts.shirt || '#f2e7d0';
    const pants = opts.pants || '#3d4d44';
    const hat = opts.hat !== false;
    const legL = cyl(0.075, 0.09, 0.72, 7, pants, -0.14, 0.36, 0, g);
    const legR = cyl(0.075, 0.09, 0.72, 7, pants, 0.14, 0.36, 0, g);
    cyl(0.23, 0.33, 0.82, 9, shirt, 0, 1.12, 0, g);
    cyl(0.245, 0.25, 0.09, 10, opts.belt || '#b23a2e', 0, 0.78, 0, g);
    const armL = cyl(0.06, 0.075, 0.62, 6, shirt, -0.31, 1.22, 0, g);
    const armR = cyl(0.06, 0.075, 0.62, 6, shirt, 0.31, 1.22, 0, g);
    armL.rotation.z = 0.18; armR.rotation.z = -0.18;
    const head = sph(0.18, skin, 0, 1.72, 0, g, { seg: 12, seg2: 10 });
    const hair = sph(0.19, opts.hair || '#241a16', 0, 1.78, -0.03, g, { seg: 12, seg2: 8, sy: 0.7 });
    if (hat) {
      const brim = cyl(0.44, 0.46, 0.05, 16, '#e7d3a0', 0, 1.9, 0, g);
      const crown = cone(0.34, 0.34, 16, '#e7d3a0', 0, 2.08, 0, g);
      brim.castShadow = crown.castShadow = true;
    }
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
    return { group: g, legL, legR, armL, armR, head };
  }

  function lotus(scale) {
    const s = scale || 1;
    const g = new THREE.Group();
    cyl(0.035, 0.05, 0.72 * s, 6, '#4f8a4f', 0, -0.3 * s, 0, g);
    const gold = glowMat('#f5c85e', 1.1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.16 * s, 8, 6), gold);
      petal.scale.set(0.7, 1.9, 0.34);
      petal.position.set(Math.cos(a) * 0.17 * s, 0.08 * s, Math.sin(a) * 0.17 * s);
      petal.rotation.z = Math.cos(a) * 0.5;
      petal.rotation.x = -Math.sin(a) * 0.5;
      g.add(petal);
    }
    const core = sph(0.12 * s, '#ffe9a8', 0, 0.16 * s, 0, g, { mopts: { emissive: new THREE.Color('#ffd25e'), emissiveIntensity: 1.2 } });
    core.castShadow = false;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42 * s, 0.025 * s, 6, 28), glowMat('#f0c97c', 0.8));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02 * s;
    g.add(ring);
    return { group: g, ring };
  }

  function scatter(ctx, flora) {
    if (!flora) return;
    const count = flora.count;
    for (let i = 0; i < count * 8 && ctx.treesMade < count; i++) {
      const a = ctx.rnd() * Math.PI * 2;
      const r = 6 + ctx.rnd() * 20;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r * 0.9 + 1;
      if (ctx.blocked(x, z, 1.6)) continue;
      // chừa khoảng sau lưng người chơi cho camera
      if (z > ctx.spawn.z - 1 && z < ctx.spawn.z + 12 && Math.abs(x - ctx.spawn.x) < 4.5) continue;
      let ok = true;
      for (const h of ctx.hotspotsMeta) {
        if (Math.hypot(h.pos[0] - x, h.pos[1] - z) < 3) { ok = false; break; }
      }
      if (!ok) continue;
      if (Math.hypot(x - ctx.spawn.x, z - ctx.spawn.z) < 3) continue;
      const kind = flora.kinds[Math.floor(ctx.rnd() * flora.kinds.length)];
      let obj = null;
      if (kind === 'pine') pine(x, z, ctx.scene, ctx.p, 0.8 + ctx.rnd() * 0.6);
      else if (kind === 'palm') obj = palm(x, z, ctx.scene, ctx.p, 0.85 + ctx.rnd() * 0.5);
      else if (kind === 'bamboo') obj = bamboo(x, z, ctx.scene, ctx.p);
      else if (kind === 'mangrove') obj = mangrove(x, z, ctx.scene, ctx.p);
      else obj = tree(x, z, ctx.scene, ctx.p, 0.8 + ctx.rnd() * 0.6);
      if (obj && ctx.sway) ctx.sway.push({ obj, phase: ctx.rnd() * 6.28, amp: 0.006 + ctx.rnd() * 0.01 });
      ctx.treesMade++;
    }
  }

  const FLORA = {
    citadel: { count: 16, kinds: ['tree', 'tree', 'bamboo'] },
    bay: { count: 16, kinds: ['palm', 'tree'] },
    mountain: { count: 18, kinds: ['pine', 'tree', 'tree'] },
    'ancient-town': { count: 14, kinds: ['bamboo', 'palm', 'tree'] },
    palace: { count: 18, kinds: ['palm', 'tree'] },
    market: { count: 20, kinds: ['palm', 'palm', 'bamboo'] },
    wetland: { count: 24, kinds: ['mangrove', 'mangrove', 'mangrove'] },
    waterfall: { count: 26, kinds: ['tree', 'bamboo', 'pine'] },
    pass: { count: 22, kinds: ['pine', 'pine', 'tree'] },
    lake: { count: 24, kinds: ['pine', 'pine', 'tree'] },
    tower: { count: 16, kinds: ['palm', 'tree'] },
    desert: { count: 10, kinds: ['palm'] },
  };

  /* ---------------------------------------------------------------- */
  /* Các kiểu cảnh                                                     */
  /* ---------------------------------------------------------------- */

  function buildCitadel(ctx, stop) {
    const { scene, p } = ctx;
    const z0 = -8;
    const stone = stop.variant === 'nguyen' ? '#b49a73' : stop.variant === 'dinh' ? '#8d7f62' : '#a99a7c';
    const wallTop = stop.variant === 'nguyen' ? '#b5523f' : stone;
    box(24, 0.14, 18, shade(p.ground, 24), 0, 0.07, z0 + 1, scene, { cast: false });
    box(15, 0.1, 11, '#b7a98c', 0, 0.14, z0, scene, { cast: false });
    // tường trước, chừa cổng giữa
    for (const sx of [-7.2, 7.2]) {
      box(8.4, 1.1, 2.4, stone, sx, 1.55, z0 + 6.5, scene);
      box(8.4, 1.8, 0.7, wallTop, sx, 2.55, z0 + 6.5, scene);
      for (let i = -3; i <= 3; i++) box(0.5, 0.7, 0.7, stone, sx + i * 1.16, 2.2, z0 + 6.85, scene);
      ctx.rect(sx < 0 ? -11.4 : 3, z0 + 5.3, sx < 0 ? -3 : 11.4, z0 + 7.7);
    }
    // cổng thành
    box(7.4, 4.6, 3.2, stop.variant === 'nguyen' ? '#a8342c' : '#8a3a2c', 0, 2.3, z0 + 6.5, scene);
    for (const x of [-2.2, 0, 2.2]) box(1.45, 2.5, 0.24, '#241a14', x, 1.25, z0 + 8.12, scene, { cast: false });
    box(6.4, 2.1, 2.7, '#8a3a2c', 0, 5.6, z0 + 6.5, scene);
    pyramid(9.2, 4.8, 1.35, p.roof, 0, 6.65, z0 + 6.5, scene);
    pyramid(6.6, 3.6, 1.25, p.roof, 0, 8.0, z0 + 6.5, scene);
    for (const sx of [-2.3, 2.3]) sph(0.2, p.roof, sx, 9.3, z0 + 6.5, scene, { mopts: { emissive: new THREE.Color(p.roof), emissiveIntensity: 0.35 } });
    // hai điện hai bên
    for (const sx of [-8.3, 8.3]) {
      box(4.6, 3.1, 4.6, stop.variant === 'nguyen' ? '#d8c9a8' : '#cbb992', sx, 1.55, z0 + 0.5, scene);
      pyramid(6.2, 6.2, 1.2, p.roof, sx, 3.1, z0 + 0.5, scene);
      ctx.rect(sx - 2.4, z0 - 1.9, sx + 2.4, z0 + 2.9);
    }
    // tường hai bên + hậu thành
    for (const sx of [-10.4, 10.4]) {
      box(2.4, 1.1, 12, stone, sx, 1.55, z0, scene);
      box(2.4, 1.7, 0.7, wallTop, sx, 2.5, z0, scene);
      ctx.rect(sx - 1.2, z0 - 6, sx + 1.2, z0 + 6);
    }
    box(18.4, 1.1, 2.4, stone, 0, 1.55, z0 - 6.4, scene);
    box(18.4, 1.7, 0.7, wallTop, 0, 2.5, z0 - 6.4, scene);
    ctx.rect(-9.2, z0 - 7.6, 9.2, z0 - 5.2);
    // sân, đồng đỉnh, cột cờ
    for (const x of [-4.5, 4.5]) {
      cyl(0.55, 0.7, 1.1, 10, '#6f5a33', x, 0.55, z0 - 1.5, scene);
      cyl(0.75, 0.55, 0.25, 10, '#7d673c', x, 1.2, z0 - 1.5, scene);
      ctx.circle(x, z0 - 1.5, 0.9);
    }
    const f = flag(stop.variant === 'nguyen' ? '#c8102e' : '#d23b2f', 7.4, 1.4, z0 - 3.2, scene, 0.9);
    ctx.flag = f.cloth;
    ctx.hotspotsMeta = [
      { id: 'h0', pos: [0, z0 + 9.7], radius: 3.7 },
      { id: 'h1', pos: [0, z0 + 1.2], radius: 3.4 },
      { id: 'h2', pos: [0, z0 - 9.2], radius: 3.2 },
    ];
    ctx.spawn = { x: 0, z: 12 };
  }

  function buildBay(ctx) {
    const { scene, p } = ctx;
    water(scene, p, -0.28, 220, 0);
    ctx.groundRadius = 27;
    // bến gỗ
    for (let z = 13; z > 1; z -= 1.8) {
      box(3.2, 0.16, 1.55, '#8a6a44', 0, 0.24, z, scene);
      cyl(0.09, 0.12, 1.2, 6, '#6b4f32', -1.5, 0.2, z, scene);
      cyl(0.09, 0.12, 1.2, 6, '#6b4f32', 1.5, 0.2, z, scene);
    }
    // cầu nổi dẫn ra mỏm đá nhìn vịnh
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const x = 7.5 * t;
      const z = 1 - 7.5 * t;
      const plank = box(2.1, 0.14, 1.1, '#8a6a44', x, 0.2, z, scene);
      plank.rotation.y = -Math.PI / 4;
      if (i % 2 === 0) {
        cyl(0.08, 0.1, 1, 6, '#6b4f32', x - 0.9, 0.1, z, scene);
        cyl(0.08, 0.1, 1, 6, '#6b4f32', x + 0.9, 0.1, z, scene);
      }
    }
    // đảo đá chính
    cone(7.5, 15, 7, p.rock, 0, 6.2, -11, scene);
    cone(4.6, 10, 6, shade(p.rock, 12), 5.4, 3.8, -10, scene);
    cone(5.4, 12, 7, shade(p.rock, -10), -7.5, 4.6, -12.5, scene);
    sph(2.4, p.foliage, 0, 13.2, -11, scene, { sy: 0.6 });
    sph(1.6, shade(p.foliage, 12), 4.4, 8.3, -10, scene, { sy: 0.6 });
    // cửa hang
    box(2.6, 3.1, 0.3, '#1d2320', 0, 1.55, -4.2, scene, { cast: false });
    box(6, 0.9, 2.2, p.rock, 0, 3.4, -4.4, scene);
    // thuyền rồng
    const boat = new THREE.Group();
    box(6.5, 1.1, 2.2, '#7a4b2c', 0, 0.55, 0, boat);
    box(6.5, 0.28, 2.4, '#c9a24a', 0, 1.08, 0, boat);
    cone(1.15, 1.8, 5, '#7a4b2c', 3.3, 0.55, 0, boat, { rz: -Math.PI / 2 });
    cone(1.15, 1.8, 5, '#7a4b2c', -3.3, 0.55, 0, boat, { rz: Math.PI / 2 });
    box(2.2, 1.1, 1.6, '#c9773f', 0.4, 1.75, 0, boat);
    cyl(0.08, 0.1, 5.2, 6, '#5d4028', -0.6, 3.4, 0, boat);
    const sailGeo = new THREE.BufferGeometry();
    sailGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 3.2, 0, 2.4, 1.2, 0], 3));
    sailGeo.computeVertexNormals();
    const sail = new THREE.Mesh(sailGeo, mat('#f1e2c2', { side: THREE.DoubleSide }));
    sail.position.set(-0.58, 3.2, 0.02);
    sail.castShadow = true;
    boat.add(sail);
    boat.position.set(9.5, -0.15, 2.5);
    boat.rotation.y = -0.3;
    scene.add(boat);
    // nhà nổi
    for (const [hx, hz, hr] of [[-12, -2, 0.3], [-16, 2, -0.2], [-10, 5, 0.5]]) {
      const h = new THREE.Group();
      box(3.4, 0.35, 2.6, '#8a6a44', 0, 0.2, 0, h);
      box(3, 1.6, 2.2, '#c9773f', 0, 1.15, 0, h);
      pyramid(3.8, 3, 0.8, '#9c4a35', 0, 1.95, 0, h);
      h.position.set(hx, -0.2, hz);
      h.rotation.y = hr;
      scene.add(h);
    }
    ctx.circle(0, -11, 8.5);
    ctx.circle(5.4, -10, 5);
    ctx.circle(-7.5, -12.5, 6);
    ctx.circle(-12, -2, 2.4);
    ctx.circle(-16, 2, 2.4);
    ctx.circle(-10, 5, 2.4);
    ctx.hotspotsMeta = [
      { id: 'h0', pos: [0, 2.2], radius: 3.6 },
      { id: 'h1', pos: [3.2, -2.2], radius: 3.4 },
      { id: 'h2', pos: [7.5, -6.5], radius: 3.4 },
    ];
    ctx.spawn = { x: 0, z: 12 };
    ctx.bounds = { x1: -2.2, x2: 9.4, z1: -9.2, z2: 13.6 };
    ctx.walkable = (x, z) => (Math.abs(x) < 1.5 && z > 0.4 && z < 13.4) ||
      (Math.abs(x + z - 1) < 1.05 && x > -1 && x < 8.3) ||
      Math.hypot(x - 7.2, z + 6.4) < 3.1;
    ctx.itemSpots = [{ x: 0, z: 10 }, { x: 0.8, z: 7 }, { x: -0.8, z: 4 }, { x: 0.9, z: 1.8 }, { x: 5.4, z: -4.4 }];
    ctx.npcSpots = [{ x: -0.9, z: 8.4 }, { x: 1, z: 5.2 }, { x: -0.8, z: 2.4 }, { x: 6.5, z: -5.5 }];
    ctx.guidePos = { x: 1.15, z: 11.2 };
    ctx.flora = { count: 16, kinds: ['palm', 'tree'] };
  }

  function buildMountain(ctx, stop) {
    const { scene, p } = ctx;
    const z0 = -12;
    // khối núi
    cone(8.5, 18, 7, p.rock, 0, 8, z0, scene);
    cone(5.6, 12, 6, shade(p.rock, 14), 6.2, 5.2, z0 + 1, scene);
    cone(6.4, 14, 7, shade(p.rock, -12), -7.4, 6, z0 - 1, scene);
    sph(3, p.foliage, 0, 15.8, z0, scene, { sy: 0.5 });
    sph(1.7, shade(p.foliage, 14), 5.8, 10.2, z0 + 1, scene, { sy: 0.6 });
    ctx.circle(0, z0, 9.5);
    ctx.circle(6.2, z0 + 1, 5.6);
    ctx.circle(-7.4, z0 - 1, 6.2);

    if (stop.variant === 'pagoda') {
      // chùa nhiều tầng
      box(7, 1.4, 7, '#a89a7d', 0, 0.7, -3.4, scene);
      box(5, 3.2, 5, '#d8c9a8', 0, 2.9, -3.4, scene);
      pyramid(7.2, 7.2, 1.15, p.roof, 0, 4.5, -3.4, scene);
      box(3.6, 2.4, 3.6, '#d8c9a8', 0, 6.5, -3.4, scene);
      pyramid(5.4, 5.4, 1.05, p.roof, 0, 7.7, -3.4, scene);
      box(2.2, 1.7, 2.2, '#d8c9a8', 0, 9, -3.4, scene);
      pyramid(3.4, 3.4, 0.9, p.roof, 0, 9.85, -3.4, scene);
      box(3.2, 2, 0.25, '#3a2a1e', 0, 1.9, -0.9, scene);
      for (let i = 0; i < 4; i++) box(0.6, 0.2, 0.6, '#b9b4a5', 0, 0.1 + i * 0.18, -0.6 + i * 0.36, scene);
      // hang đá bên trái
      box(3.2, 4.2, 0.4, '#1f2622', -5.6, 2.1, -6.2, scene, { cast: false, ry: 0.4 });
      box(4.6, 1.2, 1.2, p.rock, -5.6, 4.6, -6.4, scene, { ry: 0.4 });
      ctx.rect(-4.4, -5.6, 4.4, -1.2);
      ctx.circle(0, -3.4, 3.2);
    } else {
      // cột cờ trên đỉnh + bậc đá
      const base = cyl(3.4, 4.2, 1.2, 8, '#a89a7d', 0, 0.6, -5.4, scene);
      for (let i = 0; i < 7; i++) box(1.4, 0.5, 0.7, '#b9b4a5', 0, 1.1 + i * 0.5, -4.4 - i * 0.45, scene);
      const tower = cyl(1.5, 1.9, 3.2, 8, '#b8a98a', 0, 2.8, -7.2, scene);
      const f = flag('#d23b2f', 0, 4.4, -7.2, scene, 1.25);
      ctx.flag = f.cloth;
      ctx.circle(0, -5.4, 3.6);
      ctx.circle(0, -7.2, 2.4);
      // nhà đón khách nhỏ
      box(4, 2.4, 3, '#d8c9a8', -6.5, 1.2, 3, scene);
      pyramid(5, 4, 0.9, p.roof, -6.5, 2.4, 3, scene);
      ctx.rect(-8.6, 1.4, -4.4, 4.6);
    }
    ctx.hotspotsMeta = [
      { id: 'h0', pos: [0, 3.2], radius: 3.7 },
      { id: 'h1', pos: [-5.6, -2.4], radius: 3.4 },
      { id: 'h2', pos: [7.2, -1.2], radius: 3.4 },
    ];
    ctx.spawn = { x: 0, z: 12 };
    ctx.flora = { count: 20, kinds: ['pine', 'tree', 'tree'] };
  }

  function buildAncientTown(ctx) {
    const { scene, p } = ctx;
    box(11, 0.08, 28, '#b9a98b', 0, 0.05, 0, scene, { cast: false });
    const walls = ['#d9b56a', '#e0c07a', '#caa45f', '#d7b16b'];
    const roofs = ['#9c4a35', '#a85a3e', '#8f4030'];
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const z = -8 + i * 4;
        const w = walls[(i + (side > 0 ? 1 : 0)) % walls.length];
        const r = roofs[(i + (side > 0 ? 2 : 0)) % roofs.length];
        box(4.2, 3.2, 3.3, w, side * 7.2, 1.6, z, scene);
        pyramid(5.1, 4.2, 1.05, r, side * 7.2, 3.2, z, scene);
        box(1.2, 2.1, 0.16, '#4b3524', side * 5.35, 1.05, z, scene, { cast: false });
        box(2.2, 0.12, 1.1, r, side * 5.2, 2.8, z, scene, { cast: false });
        if (i % 2 === 0) {
          cyl(0.05, 0.05, 2.7, 5, '#6b4a2f', side * 5.9, 1.35, z + 1.4, scene);
          sph(0.22, '#f2b544', side * 5.9, 2.75, z + 1.4, scene, { mopts: { emissive: new THREE.Color('#f2b544'), emissiveIntensity: 1 } });
        }
      }
      ctx.rect(side > 0 ? 5.05 : -9.4, -10, side > 0 ? 9.4 : -5.05, 10);
    }
    // dây đèn lồng
    for (const z of [-6, -2, 2, 6, 10]) {
      for (const sx of [-4.8, 4.8]) cyl(0.05, 0.07, 4.6, 5, '#5b4028', sx, 2.3, z, scene);
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const x = -4.8 + t * 9.6;
        const y = 4.4 - Math.sin(t * Math.PI) * 0.5;
        const l = sph(0.19, i % 2 ? '#f2b544' : '#e8894d', x, y, z, scene, { mopts: { emissive: new THREE.Color(i % 2 ? '#f2b544' : '#e8894d'), emissiveIntensity: 1.2 } });
        l.castShadow = false;
      }
    }
    // chùa Cầu ở cuối phố
    water(scene, p, 0.04, 8, -12, 14, 7);
    box(13, 0.5, 3.6, '#7a4b2c', 0, 2.1, -12, scene);
    for (const sx of [-5.6, -2.8, 0, 2.8, 5.6]) {
      box(0.36, 2.2, 0.36, '#a34a35', sx, 1.05, -12, scene);
      box(0.36, 2.2, 0.36, '#a34a35', sx, 1.05, -13.6, scene);
    }
    pyramid(13.6, 4.8, 1.15, '#8f4030', 0, 2.6, -12, scene);
    box(2.2, 1.4, 0.18, '#3a2a1e', 0, 1.65, -10.18, scene, { cast: false });
    ctx.rect(-6.8, -12.7, 6.8, -11.3);
    // sông bên phải
    const river = water(scene, p, 0.04, 26, 0, 24, 60);
    river.mesh.position.x = 17;
    ctx.rect(14, -24, 30, 24);
    const boat = new THREE.Group();
    box(4.2, 0.7, 1.4, '#7a4b2c', 0, 0.35, 0, boat);
    cone(0.9, 1.3, 4, '#7a4b2c', 2.1, 0.35, 0, boat, { rz: -Math.PI / 2 });
    box(1.4, 0.9, 1.1, '#c9773f', -0.2, 1.05, 0, boat);
    boat.position.set(17, 0, 2);
    scene.add(boat);
    ctx.hotspotsMeta = [
      { id: 'h0', pos: [0, -12], radius: 3.8 },
      { id: 'h1', pos: [0, 0.5], radius: 3.5 },
      { id: 'h2', pos: [0, 8.6], radius: 3.4 },
    ];
    ctx.spawn = { x: 0, z: 14 };
    ctx.flora = { count: 12, kinds: ['bamboo', 'palm', 'tree'] };
  }

  function buildPalace(ctx) {
    const { scene, p } = ctx;
    box(60, 0.1, 60, '#7d9a68', 0, 0.05, 0, scene, { cast: false });
    box(10, 0.06, 26, '#9c9c94', 0, 0.11, 2, scene, { cast: false });
    // cổng
    for (const sx of [-4.5, 4.5]) {
      box(0.8, 2.6, 0.8, '#d8d2c4', sx, 1.3, 11, scene);
      ctx.circle(sx, 11, 0.8);
    }
    box(3.8, 0.7, 0.4, '#d8d2c4', 0, 2.7, 11, scene, { cast: false });
    // dinh chính
    box(18, 1.1, 13, '#cfc9ba', 0, 0.55, -8, scene);
    box(15, 6.4, 9.6, '#e3ddcd', 0, 4.3, -8, scene);
    box(15.4, 0.7, 10, '#b9b2a2', 0, 7.75, -8, scene);
    for (let i = 0; i < 6; i++) box(1.2, 5.6, 0.7, '#f0ebdf', -6 + i * 2.4, 3.6, -2.9, scene);
    for (let i = 0; i < 4; i++) box(13.6, 1.15, 0.18, '#5b6a72', 0, 3.1 + i * 1.35, -3.33, scene, { cast: false });
    box(5.4, 2.4, 2.1, '#e3ddcd', 0, 8.2, -8, scene);
    cyl(3.4, 3.6, 0.22, 20, '#8a8f8d', 0, 8.95, -8, scene);
    ctx.rect(-9.4, -14.4, 9.4, -1.6);
    // tăng thêm hai cánh
    for (const sx of [-11, 11]) {
      box(4.6, 4.2, 6, '#ded8c8', sx, 2.1, -7, scene);
      box(4.8, 0.5, 6.2, '#b9b2a2', sx, 4.35, -7, scene);
      ctx.rect(sx - 2.5, -10.2, sx + 2.5, -3.8);
    }
    // xe tăng
    const tank = new THREE.Group();
    box(3.6, 0.9, 2, '#5f6b4a', 0, 0.55, 0, tank);
    cyl(0.9, 1, 0.7, 10, '#6b7a52', 0, 1.25, 0, tank);
    cyl(0.09, 0.09, 2.6, 8, '#4f5a3d', 1.7, 1.25, 0, tank, { rz: Math.PI / 2 });
    for (const sx of [-1.2, 1.2]) for (const sz of [-0.8, 0.8]) cyl(0.42, 0.42, 0.32, 9, '#333a2c', sx, 0.42, sz, tank, { rz: Math.PI / 2 });
    tank.position.set(-8, 0, 3.5);
    tank.rotation.y = 0.4;
    scene.add(tank);
    ctx.circle(-8, 3.5, 2.2);
    // đài phun nước
    cyl(2.4, 2.7, 0.6, 18, '#c9c2b2', 7.5, 0.3, 4, scene);
    cyl(2.1, 2.1, 0.1, 18, '#6fa6b0', 7.5, 0.58, 4, scene, { cast: false });
    sph(0.3, '#e8e2d2', 7.5, 0.9, 4, scene);
    ctx.circle(7.5, 4, 2.7);
    const f = flag('#d23b2f', 6.8, 0.3, 11, scene, 0.85);
    ctx.flag = f.cloth;
    ctx.hotspotsMeta = [
      { id: 'h0', pos: [0, 13], radius: 3.8 },
      { id: 'h1', pos: [-8, 1], radius: 3.4 },
      { id: 'h2', pos: [7.5, 0], radius: 3.4 },
    ];
    ctx.spawn = { x: 0, z: 15 };
    ctx.flora = { count: 18, kinds: ['palm', 'tree'] };
  }

  function buildMarket(ctx) {
    const { scene, p } = ctx;
    // bờ sông
    box(80, 0.5, 44, p.ground, 0, -0.2, 18, scene, { cast: false });
    water(scene, p, 0.02, 40, -30, 120, 50);
    box(80, 0.35, 2, '#b7a16b', 0, 0.1, -4.2, scene, { cast: false });
    // bến gỗ
    for (let z = -3; z > -7.5; z -= 1.4) {
      box(4.2, 0.14, 1.2, '#8a6a44', 0, 0.16, z, scene);
      cyl(0.09, 0.11, 1.6, 6, '#6b4f32', -1.9, -0.3, z, scene);
      cyl(0.09, 0.11, 1.6, 6, '#6b4f32', 1.9, -0.3, z, scene);
    }
    // ghe chợ
    const boatData = [[-9, -12, 0.4], [-2, -17, -0.2], [6, -13, 0.15], [12, -19, -0.4], [-14, -18, 0.25]];
    for (let i = 0; i < boatData.length; i++) {
      const [bx, bz, br] = boatData[i];
      const b = new THREE.Group();
      box(5.2, 0.9, 1.9, '#7a4b2c', 0, 0.45, 0, b);
      box(5.2, 0.2, 2.05, '#c9a24a', 0, 0.9, 0, b);
      cone(1, 1.6, 5, '#7a4b2c', 2.6, 0.45, 0, b, { rz: -Math.PI / 2 });
      cone(1, 1.6, 5, '#7a4b2c', -2.6, 0.45, 0, b, { rz: Math.PI / 2 });
      box(2, 1.1, 1.4, '#c9773f', 0.2, 1.5, 0, b);
      const colors = ['#d9893f', '#8fb54a', '#d24a3a', '#e0b34a'];
      for (let j = 0; j < 5; j++) sph(0.28, colors[(i + j) % colors.length], -1.4 + j * 0.6, 1.06, (j % 2 ? 0.4 : -0.35), b, { seg: 8, seg2: 6 });
      cyl(0.04, 0.05, 3.4, 5, '#5b4028', -1.6, 2.4, 0, b);
      b.position.set(bx, 0.02, bz);
      b.rotation.y = br;
      scene.add(b);
    }
    // lán chợ
    for (const [sx, sz] of [[6, 5], [-6.5, 7], [10, 9]]) {
      box(4.4, 0.2, 3.2, '#8a6a44', sx, 0.9, sz, scene);
      for (const dx of [-1.8, 1.8]) for (const dz of [-1.2, 1.2]) cyl(0.07, 0.08, 2.2, 5, '#5b4028', sx + dx, 0.9, sz + dz, scene);
      pyramid(5.2, 4, 0.7, '#c9773f', sx, 1.9, sz, scene);
      const c = ['#d9893f', '#8fb54a', '#d24a3a', '#e0b34a', '#a06a3f'];
      for (let j = 0; j < 6; j++) sph(0.22, c[j % c.length], sx - 1.4 + (j % 3) * 1.3, 1.12, sz - 0.7 + Math.floor(j / 3) * 1.2, scene, { seg: 7, seg2: 5 });
      ctx.rect(sx - 2.4, sz - 1.8, sx + 2.4, sz + 1.8);
    }
    // nhà sàn ven bờ (chừa lối sau lưng người chơi cho camera)
    for (const [hx, hz] of [[-9, 14], [9, 14], [-14, 19]]) {
      box(4.2, 2.4, 3.4, '#a06a3f', hx, 1.5, hz, scene);
      pyramid(5.2, 4.4, 1, '#8f4030', hx, 2.7, hz, scene);
      ctx.rect(hx - 2.2, hz - 1.8, hx + 2.2, hz + 1.8);
    }
    ctx.rect(-40, -50, 40, -4.4);
    ctx.hotspotsMeta = [
      { id: 'h0', pos: [0, -3.2], radius: 3.6 },
      { id: 'h1', pos: [6, 2], radius: 3.6 },
      { id: 'h2', pos: [-9, 10.5], radius: 3.6 },
    ];
    ctx.spawn = { x: 0, z: 12 };
    ctx.flora = { count: 18, kinds: ['palm', 'palm', 'bamboo'] };
  }

  function buildWetland(ctx) {
    const { scene, p } = ctx;
    box(64, 0.35, 54, p.ground, 0, -0.15, 4, scene, { cast: false });
    // lạch nước hai bên
    for (const sx of [-22, 22]) {
      const w = water(scene, p, -0.05, 20, 0, 22, 60);
      w.mesh.position.x = sx;
    }
    // ván gỗ
    for (let z = 14; z > -13; z -= 1.5) {
      box(2.8, 0.14, 1.3, '#7a5a38', 0, 0.16, z, scene);
      for (const sx of [-1.5, 1.5]) cyl(0.06, 0.08, 1.1, 5, '#5b4028', sx, 0.5, z, scene);
    }
    // tháp canh
    const tw = new THREE.Group();
    for (const dx of [-1.4, 1.4]) for (const dz of [-1.4, 1.4]) cyl(0.1, 0.14, 4.2, 5, '#6b4f32', dx, 2.1, dz, tw);
    box(4, 0.25, 4, '#8a6a44', 0, 4.2, 0, tw);
    box(3.2, 1.4, 3.2, '#a06a3f', 0, 5, 0, tw);
    pyramid(4.4, 4.4, 0.9, '#6b5a3a', 0, 5.7, 0, tw);
    tw.position.set(-7.5, 0, 1);
    scene.add(tw);
    ctx.circle(-7.5, 1, 2.4);
    // cột mốc đất mũi
    cyl(2.2, 2.8, 0.8, 8, '#9c9180', 0, 0.4, -12, scene);
    box(2.6, 5.4, 1.4, '#d8d2c2', 0, 3.3, -12, scene);
    box(2.8, 0.5, 1.6, '#b23a2e', 0, 5.6, -12, scene);
    const star = new THREE.Mesh(starGeo(0.65, 0.28), glowMat('#ffd85e', 0.5));
    star.position.set(0, 3.6, -11.28);
    scene.add(star);
    ctx.circle(0, -12, 2.6);
    // thuyền nhỏ
    const boat = new THREE.Group();
    box(3.6, 0.6, 1.3, '#6b4f32', 0, 0.3, 0, boat);
    cone(0.8, 1.2, 4, '#6b4f32', 1.8, 0.3, 0, boat, { rz: -Math.PI / 2 });
    boat.position.set(16, 0, -4);
    scene.add(boat);
    ctx.rect(-40, -50, -14, 30);
    ctx.rect(14, -50, 40, 30);
    ctx.hotspotsMeta = [
      { id: 'h0', pos: [0, 10], radius: 3.8 },
      { id: 'h1', pos: [-7.5, 4.5], radius: 3.6 },
      { id: 'h2', pos: [0, -8], radius: 3.5 },
    ];
    ctx.spawn = { x: 0, z: 13 };
    ctx.flora = { count: 26, kinds: ['mangrove', 'mangrove', 'mangrove'] };
  }

  function buildWaterfall(ctx) {
    const { scene, p } = ctx;
    // vách đá
    box(24, 16, 6, p.rock, 0, 7, -16, scene);
    for (let i = 0; i < 5; i++) cone(4.5, 9 + i * 2, 6, shade(p.rock, i % 2 ? 8 : -10), -9 + i * 4.5, 7, -19, scene);
    // dải nước
    const falls = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const w = 2.8 + (i % 2) * 0.9;
      const waterMat = new THREE.MeshBasicMaterial({ color: 0xeaf6f2, transparent: true, opacity: 0.62 + (i % 2) * 0.12, depthWrite: false });
      const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(w, 13.4, 1, 8), waterMat);
      ribbon.position.set(-5 + i * 2.5, 6.6, -12.9);
      falls.add(ribbon);
    }
    scene.add(falls);
    // hồ nước
    const pool = water(scene, p, 0.02, 16, -3, 17, 14);
    pool.mesh.position.set(0, 0.02, -3);
    ctx.circle(0, -4, 7.5);
    // bến bè
    for (let z = 6; z > 0; z -= 1.4) box(3.4, 0.12, 1.2, '#8a6a44', 0, 0.14, z, scene);
    box(3, 0.5, 1.3, '#7a5a38', 5, 0.25, -1, scene);
    for (let i = 0; i < 5; i++) box(0.9, 0.09, 0.18, '#b9935a', 5, 0.58, -1 + (i - 2) * 0.24, scene, { cast: false });
    // đá quanh hồ
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const r = 7.8 + (i % 3) * 0.5;
      sph(0.7 + (i % 3) * 0.3, i % 2 ? '#8a8f82' : shade(p.rock, 10), Math.cos(a) * r, 0.4, -4 + Math.sin(a) * r, scene, { seg: 7, seg2: 5, sy: 0.7 });
    }
    ctx.hotspotsMeta = [
      { id: 'h0', pos: [0, 3.5], radius: 3.7 },
      { id: 'h1', pos: [5, 1.5], radius: 3.5 },
      { id: 'h2', pos: [9.5, 7], radius: 3.5 },
    ];
    ctx.spawn = { x: 0, z: 12 };
    ctx.flora = { count: 26, kinds: ['tree', 'bamboo', 'pine'] };
    ctx.falls = falls;
  }

  function buildPass(ctx) {
    const { scene, p } = ctx;
    box(9, 0.06, 40, '#a29a83', 0, 0.05, 0, scene, { cast: false });
    // vách núi hai bên
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const z = -14 + i * 6;
        const r = 5 + (i % 3);
        cone(r, 12 + (i % 4) * 3, 6, i % 2 ? shade(p.rock, 8) : p.rock, side * (10 + i % 2), 5.6, z, scene);
        ctx.rect(side * 9, z - 4.5, side * 18, z + 4.5);
      }
    }
    // cổng ải
    for (const sx of [-6.6, 6.6]) {
      box(4.6, 3.4, 3.2, '#8d7f62', sx, 1.7, -7, scene);
      box(4.8, 1.4, 0.8, '#a99a7c', sx, 3.6, -7, scene);
      ctx.rect(sx - 2.4, -8.7, sx + 2.4, -5.3);
    }
    box(7.4, 2.4, 2.2, '#8d7f62', 0, 2.6, -7, scene);
    box(3.6, 2.8, 0.28, '#1f2622', 0, 1.4, -5.84, scene, { cast: false });
    pyramid(8.8, 3.6, 1.2, '#6b5a3a', 0, 3.8, -7, scene);
    for (const sx of [-3.2, 3.2]) {
      box(0.22, 2.7, 1.4, '#5b4028', sx, 1.35, -5.6, scene);
      sph(0.24, '#6b5a3a', sx, 2.85, -5.6, scene);
    }
    // bia đá
    box(1.6, 0.5, 1.2, '#8d7f62', -5.5, 0.25, 3.5, scene);
    box(1.2, 1.9, 0.5, '#c9c2b2', -5.5, 1.45, 3.5, scene);
    ctx.rect(-6.5, 2.6, -4.5, 4.4);
    // tháp canh
    cyl(1.2, 1.6, 4.2, 6, '#8d7f62', 7.5, 2.1, -1, scene);
    pyramid(3.4, 3.4, 1, '#6b5a3a', 7.5, 4.2, -1, scene);
    ctx.circle(7.5, -1, 2);
    ctx.hotspotsMeta = [
      { id: 'h0', pos: [0, -3], radius: 3.7 },
      { id: 'h1', pos: [-5.5, 6], radius: 3.5 },
      { id: 'h2', pos: [7.5, 8.5], radius: 3.5 },
    ];
    ctx.spawn = { x: 0, z: 13 };
    ctx.flora = { count: 24, kinds: ['pine', 'pine', 'tree'] };
  }
  function sphereRing() { /* giữ chỗ cho tương thích */ }

  function buildLake(ctx) {
    const { scene, p } = ctx;
    const lake = water(scene, p, 0.02, 30, -4, 28, 24);
    lake.mesh.position.set(0, 0.02, -4);
    cyl(15, 15.4, 0.12, 40, '#b7a98c', 0, 0.02, -4, scene, { cast: false });
    ctx.circle(0, -4, 14.8);
    // nhà nghỉ kiểu Pháp
    const villa = new THREE.Group();
    box(7, 4.4, 6, '#e6dcc4', 0, 2.2, 0, villa);
    pyramid(8, 7, 1.25, '#9c4a35', 0, 4.4, 0, villa);
    for (let i = 0; i < 3; i++) box(1.2, 1.5, 0.16, '#5b6a72', -2 + i * 2, 2.6, 3.06, villa, { cast: false });
    box(8, 0.6, 1.4, '#d8cfb8', 0, 4.2, 3.3, villa, { cast: false });
    villa.position.set(-11, 0, 3);
    villa.rotation.y = 0.35;
    scene.add(villa);
    ctx.rect(-14.5, -0.6, -7.5, 6.6);
    // vườn hoa
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 8;
      const x = 7 + Math.cos(a) * r, z = 5 + Math.sin(a) * r * 0.7;
      sph(0.16, ['#e8899e', '#f2c95e', '#d96a4a', '#b38fd2'][i % 4], x, 0.3, z, scene, { seg: 6, seg2: 5 });
    }
    // thuyền thiên nga
    for (const [bx, bz] of [[4, -5], [-3, -8]]) {
      const b = new THREE.Group();
      box(2.4, 0.5, 1.1, '#f4efe4', 0, 0.35, 0, b);
      sph(0.5, '#f4efe4', 1.1, 0.8, 0, b);
      b.position.set(bx, 0.05, bz);
      scene.add(b);
    }
    // bến
    for (let z = 8; z > 3; z -= 1.4) box(3, 0.12, 1.2, '#8a6a44', 0, 0.14, z, scene);
    ctx.hotspotsMeta = [
      { id: 'h0', pos: [0, 8.6], radius: 3.8 },
      { id: 'h1', pos: [8, 9.5], radius: 3.6 },
      { id: 'h2', pos: [-10, 9], radius: 3.6 },
    ];
    ctx.spawn = { x: 0, z: 13 };
    ctx.flora = { count: 24, kinds: ['pine', 'pine', 'tree'] };
  }

  function buildTower(ctx) {
    const { scene, p } = ctx;
    // nền đồi
    cyl(13, 15, 1.6, 12, '#9a8a6a', 0, 0.8, -6, scene);
    box(16, 0.2, 12, '#8a7b5c', 0, 1.66, -6, scene, { cast: false });
    // tháp chính + hai tháp phụ
    const towerAt = (x, z, h, w) => {
      const g = new THREE.Group();
      box(w * 2.4, h, w * 2.4, '#a95535', 0, h / 2, 0, g);
      box(w * 2.6, 0.35, w * 2.6, '#8f3f2f', 0, h * 0.35, 0, g);
      box(w * 2.6, 0.35, w * 2.6, '#8f3f2f', 0, h * 0.7, 0, g);
      pyramid(w * 2.8, w * 2.8, h * 0.28, '#7d3228', 0, h, 0, g);
      box(w * 0.7, h * 0.55, 0.25, '#3a2018', 0, h * 0.28, w * 1.21, g, { cast: false });
      g.position.set(x, 1.7, z);
      scene.add(g);
      ctx.circle(x, z, w * 1.8);
      return g;
    };
    towerAt(0, -6, 10, 2.4);
    towerAt(-5.2, -4.4, 7, 1.8);
    towerAt(5.2, -4.4, 7, 1.8);
    // bậc thang
    for (let i = 0; i < 6; i++) box(1.6, 0.28, 0.7, '#b9a98a', 0, 0.3 + i * 0.27, 1.6 + i * 0.4, scene);
    // linga
    cyl(0.5, 0.7, 1.6, 8, '#c9bda6', -7.5, 0.8, 2, scene);
    // cây hoa sứ
    for (const [sx, sz] of [[-9, 5], [9, 3]]) {
      cyl(0.16, 0.22, 2, 6, '#6b4a2f', sx, 1, sz, scene);
      sph(1.2, '#4f6b3f', sx, 2.6, sz, scene, { sy: 0.8 });
      for (let i = 0; i < 5; i++) sph(0.15, '#f4e6c8', sx + (i - 2) * 0.35, 2.7 + (i % 2) * 0.4, sz + 0.5, scene, { seg: 6, seg2: 5 });
    }
    // biển xa
    water(scene, p, -0.3, 200, 0);
    ground(scene, p, 26);
    ctx.walkable = (x, z) => Math.hypot(x, z + 2) < 25;
    ctx.hotspotsMeta = [
      { id: 'h0', pos: [0, 3.8], radius: 3.8 },
      { id: 'h1', pos: [-5.2, 0.5], radius: 3.6 },
      { id: 'h2', pos: [8, 6], radius: 3.6 },
    ];
    ctx.spawn = { x: 0, z: 12 };
    ctx.flora = { count: 14, kinds: ['palm', 'tree'] };
  }

  function buildDesert(ctx) {
    const { scene, p } = ctx;
    box(40, 0.1, 48, '#e3c07a', 0, 0.02, 6, scene, { cast: false });
    water(scene, p, -0.25, 200, 0);
    ctx.walkable = (x, z) => x > -19 && x < 19 && z > -17 && z < 29;
    // cồn cát
    const dune = (x, z, sx, sy, sz, color) => sph(1, color, x, -0.2, z, scene, { sx, sy, sz, seg: 18, seg2: 12, cast: false });
    dune(-12, -12, 16, 4.2, 12, '#e0bb72');
    dune(10, -16, 15, 6.5, 11, '#e8c783');
    dune(18, 0, 9, 3, 9, '#d9b268');
    dune(-20, 4, 10, 2.6, 8, '#ecd08e');
    // tháp Chăm xa
    const t = new THREE.Group();
    box(3.2, 8, 3.2, '#a95535', 0, 4, 0, t);
    pyramid(3.8, 3.8, 1.6, '#7d3228', 0, 8, 0, t);
    t.position.set(-13, 0, -15);
    scene.add(t);
    ctx.circle(-13, -15, 3);
    // rặng dừa
    for (const [px, pz] of [[-7, 8], [-9, 10], [-5, 10], [8, 10], [10, 8]]) palm(px, pz, scene, p, 0.9 + Math.random() * 0.3);
    // thuyền trên biển
    for (const [bx, bz] of [[22, -2], [25, 4]]) {
      const b = new THREE.Group();
      box(3.6, 0.7, 1.3, '#6b4f32', 0, 0.35, 0, b);
      cone(0.9, 1.4, 4, '#6b4f32', 1.8, 0.35, 0, b, { rz: -Math.PI / 2 });
      b.position.set(bx, 0, bz);
      scene.add(b);
    }
    ctx.rect(19, -50, 40, 50);
    ctx.hotspotsMeta = [
      { id: 'h0', pos: [0, 8], radius: 3.8 },
      { id: 'h1', pos: [6, -2], radius: 3.6 },
      { id: 'h2', pos: [14, 8], radius: 3.6 },
    ];
    ctx.spawn = { x: 0, z: 14 };
    ctx.flora = { count: 8, kinds: ['palm'] };
  }

  const BUILDERS = {
    citadel: buildCitadel,
    bay: buildBay,
    mountain: buildMountain,
    'ancient-town': buildAncientTown,
    palace: buildPalace,
    market: buildMarket,
    wetland: buildWetland,
    waterfall: buildWaterfall,
    pass: buildPass,
    lake: buildLake,
    tower: buildTower,
    desert: buildDesert,
  };

  /* ---------------------------------------------------------------- */
  /* API                                                               */
  /* ---------------------------------------------------------------- */

  const SC = {};

  SC.person = person;
  SC.lotus = lotus;
  SC.labelSprite = labelSprite;
  SC.shade = shade;

  SC.build = function (scene, stop, cfg) {
    const THREE = THREEM();
    if (!THREE) return null;
    const p = stop.palette || {
      sky: '#afd0e4', sky2: '#e7eef2', fog: '#c9dce7', ground: '#6f8f5a',
      accent: '#b23a2e', roof: '#d9a441', rock: '#8b8f82', foliage: '#3f6d45',
      sun: '#fff3d6', water: '#3f8f9f',
    };
    const rnd = U.rng(U.hash(stop.id + '|scene'));
    sceneRoot = scene;
    const ctx = {
      scene, p, rnd, colliders: [], hotspotsMeta: [], spawn: { x: 0, z: 12 },
      treesMade: 0, groundRadius: 36, flora: null, sway: [],
      circle(x, z, r) { ctx.colliders.push({ type: 'circle', x, z, r }); },
      rect(x1, z1, x2, z2) { ctx.colliders.push({ type: 'rect', x1: Math.min(x1, x2), z1: Math.min(z1, z2), x2: Math.max(x1, x2), z2: Math.max(z1, z2) }); },
      blocked(x, z, pad) {
        const a = pad || 0;
        for (const c of ctx.colliders) {
          if (c.type === 'circle') { if (Math.hypot(x - c.x, z - c.z) < c.r + a) return true; }
          else if (x > c.x1 - a && x < c.x2 + a && z > c.z1 - a && z < c.z2 + a) return true;
        }
        return false;
      },
    };

    sky(scene, p);
    const sun = new THREE.DirectionalLight(0xfff1d4, 2.3);
    sun.position.set(20, 32, 14);
    sun.castShadow = true;
    const shadowRes = (typeof window !== 'undefined' && window.innerWidth > 900) ? 2048 : 1024;
    sun.shadow.mapSize.set(shadowRes, shadowRes);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 110;
    sun.shadow.camera.left = -34;
    sun.shadow.camera.right = 34;
    sun.shadow.camera.top = 34;
    sun.shadow.camera.bottom = -34;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);
    const hemi = new THREE.HemisphereLight(new THREE.Color(p.sky2 || p.sky), new THREE.Color(p.ground), 0.95);
    scene.add(hemi);
    const rim = new THREE.DirectionalLight(new THREE.Color(p.sun || '#fff4d8'), 0.6);
    rim.position.set(-18, 16, -24);
    scene.add(rim);
    const fill = new THREE.AmbientLight(new THREE.Color(p.sky2 || '#dfeef2'), 0.18);
    scene.add(fill);

    const builder = BUILDERS[stop.style] || buildAncientTown;
    builder(ctx, stop);

    // nền đất cho các cảnh không tự dựng mặt nền
    const NO_GROUND = { bay: 1, tower: 1, desert: 1, market: 1, wetland: 1 };
    if (!NO_GROUND[stop.style]) ground(scene, p, ctx.groundRadius);

    // cây cối
    const flora = ctx.flora || FLORA[stop.style];
    scatter(ctx, flora);
    // cỏ
    if (stop.style !== 'desert' && stop.style !== 'market' && stop.style !== 'wetland') {
      palmGrass(scene, p, stop.style === 'bay' ? 30 : 55, 10, 27);
    }
    if (stop.style !== 'bay' && stop.style !== 'market' && stop.style !== 'wetland' && stop.style !== 'lake' && stop.style !== 'tower') {
      mountains(scene, rnd, p, 12, p.rock, 7, 18);
    }
    const cloudGroup = clouds(scene, rnd, p, 8);
    const atmo = atmosphere(scene, rnd, p);

    // hotspot markers
    const visited = cfg.visited || [];
    const hotspots = [];
    for (let i = 0; i < ctx.hotspotsMeta.length; i++) {
      const meta = ctx.hotspotsMeta[i];
      const label = cfg.labels[i] || ('Điểm ' + (i + 1));
      const factKey = ['story', 'value', 'built'][i] || 'value';
      const isVisited = visited.indexOf(meta.id) >= 0;
      const marker = buildMarker(meta.pos[0], meta.pos[1], label, isVisited);
      scene.add(marker.group);
      hotspots.push({
        id: meta.id, index: i, label, factKey,
        pos: new THREE.Vector3(meta.pos[0], 0, meta.pos[1]),
        radius: meta.radius || 3.6,
        marker, visited: isVisited,
      });
    }

    // vật phẩm sen
    const collected = cfg.collected || [];
    const items = [];
    const itemSpots = ctx.itemSpots || findItemSpots(ctx, 5);
    for (let i = 0; i < itemSpots.length; i++) {
      const id = 'i' + i;
      const isCollected = collected.indexOf(id) >= 0;
      const lot = lotus(1);
      lot.group.position.set(itemSpots[i].x, 0.9, itemSpots[i].z);
      lot.group.visible = !isCollected;
      lot.group.traverse((o) => { if (o.isMesh) o.castShadow = false; });
      scene.add(lot.group);
      items.push({ id, pos: new THREE.Vector3(itemSpots[i].x, 0.9, itemSpots[i].z), group: lot.group, ring: lot.ring, collected: isCollected, baseY: 0.9, phase: rnd() * 6.28 });
    }

    // Mai đứng gần điểm xuất phát
    const gp = ctx.guidePos || { x: ctx.spawn.x + 3.6, z: ctx.spawn.z - 2.2 };
    const maiPerson = person({ shirt: '#3f8f6d', pants: '#2f4a3d', belt: '#f0c97c', hat: true, hair: '#2a1c16' });
    maiPerson.group.position.set(gp.x, 0, gp.z);
    maiPerson.group.rotation.y = -0.4;
    scene.add(maiPerson.group);
    const maiLabel = labelSprite('Mai · ' + (cfg.guideLabel || 'HDV'), { scale: 3.2, font: 34, border: 'rgba(116,211,164,.95)' });
    maiLabel.position.set(gp.x, 2.65, gp.z);
    scene.add(maiLabel);
    // vòng chỉ dẫn Mai
    const maiRing = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.04, 6, 32), glowMat('#74d3a4', 0.8));
    maiRing.rotation.x = Math.PI / 2;
    maiRing.position.set(gp.x, 0.03, gp.z);
    scene.add(maiRing);

    // dân phố mô phỏng
    const npcs = [];
    const npcColors = ['#d8c9a8', '#c9773f', '#7fa6a0', '#d9a05a', '#9ab07a', '#c98f8f'];
    const spots = ctx.npcSpots;
    const npcCount = spots ? spots.length : 7;
    for (let i = 0; i < npcCount; i++) {
      let x, z;
      if (spots) { x = spots[i].x; z = spots[i].z; }
      else {
        const a = rnd() * Math.PI * 2;
        const r = 7 + rnd() * 13;
        x = Math.cos(a) * r; z = Math.sin(a) * r * 0.85 + 2;
        // giữ khoảng trống sau lưng người chơi cho camera
        if (z > ctx.spawn.z - 1 && z < ctx.spawn.z + 12 && Math.abs(x - ctx.spawn.x) < 4.2) continue;
      }
      if (ctx.blocked(x, z, 1)) continue;
      const np = person({ shirt: npcColors[i % npcColors.length], pants: '#3d4d44', hat: i % 3 !== 0 });
      np.group.position.set(x, 0, z);
      np.group.scale.setScalar(0.86 + rnd() * 0.14);
      scene.add(np.group);
      npcs.push({ person: np, base: { x, z }, phase: rnd() * 6.28, radius: 2 + rnd() * 4, speed: 0.3 + rnd() * 0.35, dir: rnd() > 0.5 ? 1 : -1 });
    }

    // nước & mây
    const waterMats = [];
    scene.traverse((o) => { if (o.userData && o.userData.waterMat) waterMats.push(o.userData.waterMat); });

    const update = (t, dt) => {
      const time = t * 0.001;
      cloudGroup.children.forEach((c, i) => {
        c.position.x += dt * (0.35 + i * 0.03);
        if (c.position.x > 55) c.position.x = -55;
      });
      if (ctx.falls) {
        ctx.falls.children.forEach((r, i) => {
          r.position.y = 6.2 + Math.sin(time * 2 + i) * 0.06;
          r.material.opacity = 0.55 + Math.sin(time * 3 + i) * 0.08;
        });
      }
      waterMats.forEach((m, i) => { m.uniforms.uTime.value = time + i * 0.6; });
      (ctx.sway || []).forEach((s) => {
        s.obj.rotation.z = Math.sin(time * 0.9 + s.phase) * s.amp;
      });
      atmo.motes.rotation.y = time * 0.02;
      atmo.motes.position.y = Math.sin(time * 0.45) * 0.18;
      atmo.mist.children.forEach((sp) => {
        sp.position.x += dt * sp.userData.drift;
        if (sp.position.x > 34) sp.position.x = -34;
      });
      atmo.birds.forEach((b, i) => {
        const u = b.userData;
        u.phase += dt * u.speed;
        b.position.set(
          Math.cos(u.phase) * u.radius,
          u.height + Math.sin(time * 0.7 + i) * 0.6,
          Math.sin(u.phase) * u.radius + 2
        );
        b.rotation.y = -u.phase + (u.speed > 0 ? 0 : Math.PI);
        const flap = Math.sin(time * 7 + i) * 0.55;
        u.wl.rotation.z = flap;
        u.wr.rotation.z = -flap;
      });
      hotspots.forEach((h, i) => {
        const g = h.marker.group;
        const d = h.marker.diamond;
        d.position.y = h.marker.baseY + Math.sin(time * 1.8 + i) * 0.15;
        d.rotation.y = time * 1.1;
        h.marker.ring.rotation.z = time * 0.35;
        h.marker.beam.material.opacity = h.visited ? 0.06 : 0.12 + Math.sin(time * 2 + i) * 0.05;
        if (h.visited) {
          d.material = h.marker.greenMat;
          h.marker.ring.material = h.marker.greenMat;
        }
      });
      items.forEach((it, i) => {
        if (it.collected) return;
        it.group.position.y = it.baseY + Math.sin(time * 1.7 + it.phase) * 0.14;
        it.group.rotation.y = time * 0.85 + it.phase;
        it.ring.rotation.z = time * 1.4;
      });
      npcs.forEach((n) => {
        n.phase += dt * n.speed * n.dir;
        const x = n.base.x + Math.cos(n.phase) * n.radius;
        const z = n.base.z + Math.sin(n.phase * 0.8) * n.radius * 0.7;
        const dx = x - n.person.group.position.x;
        const dz = z - n.person.group.position.z;
        n.person.group.position.x = x;
        n.person.group.position.z = z;
        if (Math.abs(dx) + Math.abs(dz) > 0.001) n.person.group.rotation.y = Math.atan2(dx, dz);
        const swing = Math.sin(time * 6 + n.phase) * 0.4;
        n.person.legL.rotation.x = swing;
        n.person.legR.rotation.x = -swing;
        n.person.armL.rotation.x = -swing * 0.6;
        n.person.armR.rotation.x = swing * 0.6;
        n.person.group.position.y = Math.abs(Math.sin(time * 6 + n.phase)) * 0.03;
      });
      maiRing.rotation.z = time * 0.5;
      if (ctx.flag) ctx.flag.rotation.y = Math.sin(time * 2.2) * 0.08;
      if (window._svFlag) window._svFlag.rotation.y = Math.sin(time * 2.1) * 0.1;
    };

    return {
      hotspots, items, npcs,
      mai: { pos: new THREE.Vector3(gp.x, 0, gp.z), group: maiPerson.group },
      colliders: ctx.colliders,
      bounds: ctx.bounds || null,
      walkable: ctx.walkable || null,
      spawn: new THREE.Vector3(ctx.spawn.x, 0, ctx.spawn.z),
      update,
    };
  };

  function findItemSpots(ctx, n) {
    const THREE = THREEM();
    const out = [];
    const center = { x: 0, z: 4 };
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.35;
      let r = 10.5;
      let x = center.x + Math.cos(a) * r;
      let z = center.z + Math.sin(a) * r;
      let tries = 0;
      while (ctx.blocked(x, z, 1.2) && tries < 24) {
        r -= 0.7;
        x = center.x + Math.cos(a) * r;
        z = center.z + Math.sin(a) * r;
        tries++;
      }
      if (ctx.blocked(x, z, 1.2)) { x = center.x; z = center.z; }
      let ok = true;
      for (const h of ctx.hotspotsMeta) {
        if (Math.hypot(h.pos[0] - x, h.pos[1] - z) < 2.2) ok = false;
      }
      if (!ok) z += 2.2;
      out.push({ x, z });
    }
    return out;
  }

  function buildMarker(x, z, label, visited) {
    const THREE = THREEM();
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const gold = glowMat('#f0c97c', 1);
    const green = glowMat('#74d3a4', 0.8);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.045, 8, 36), visited ? green : gold);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.04;
    g.add(ring);
    const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), visited ? green : gold);
    diamond.position.y = 2.35;
    g.add(diamond);
    const beamMat = new THREE.MeshBasicMaterial({ color: visited ? 0x74d3a4 : 0xf0c97c, transparent: true, opacity: 0.12, depthWrite: false });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 2.6, 10, 1, true), beamMat);
    beam.position.y = 1.25;
    g.add(beam);
    const sprite = labelSprite(label, { scale: 3.4, font: 34 });
    sprite.position.y = 3.1;
    g.add(sprite);
    const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const hit = new THREE.Mesh(new THREE.SphereGeometry(1.25, 8, 6), hitMat);
    hit.position.y = 2.1;
    hit.userData.hotspot = true;
    g.add(hit);
    return { group: g, ring, diamond, beam, label: sprite, hit, baseY: 2.35, greenMat: green };
  }

  window.ExploreScenery = SC;
})();
