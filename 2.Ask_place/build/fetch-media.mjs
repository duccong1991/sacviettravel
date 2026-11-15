/* Sắc Việt – tải ảnh thật từ Wikipedia/Wikimedia Commons cho địa danh, tỉnh, đặc sản, văn hoá.
   Chạy: node 2.Ask_place/build/fetch-media.mjs [--dry] [--only=places|provinces|food|culture]
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PLACES_FILE = path.join(ROOT, '2.Ask_place', 'places.json');
const MEDIA_ROOT = path.join(ROOT, '1.Media_place');
const PHOTO_ROOT = path.join(MEDIA_ROOT, 'photos');
const CACHE_FILE = path.join(ROOT, '2.Ask_place', 'build', 'media-cache.json');
const INDEX_FILE = path.join(MEDIA_ROOT, 'media-index.json');
const GAME_INDEX = path.join(ROOT, '3.Main_game', 'js', 'media-index.js');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const OFFLINE = args.includes('--offline');
const RESOLVE = args.includes('--resolve');
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1] || '';

const UA = 'SacVietLocalGame/1.0 (offline educational game; Vietnamese travel quiz)';
const VI_API = 'https://vi.wikipedia.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;

async function api(base, params, attempt = 0) {
  const wait = Math.max(0, 1250 - (Date.now() - lastCall));
  if (wait) await sleep(wait);
  lastCall = Date.now();
  const url = base + '?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
    const text = await res.text();
    if (res.status === 429 || /too many requests|rate limit/i.test(text.slice(0, 200))) {
      const back = 15000 * (attempt + 1);
      console.warn(`  ! rate limited, chờ ${back / 1000}s`);
      await sleep(back);
      if (attempt > 4) throw new Error('API rate limited');
      return api(base, params, attempt + 1);
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return JSON.parse(text);
  } catch (err) {
    if (attempt > 3) throw err;
    await sleep(2500 * (attempt + 1));
    return api(base, params, attempt + 1);
  }
}

const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (s) => norm(s).replace(/\s+/g, '-').slice(0, 80) || 'x';
const tokens = (s) => norm(s).split(' ').filter((t) => t.length > 1);
const stripTags = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

function placeVariants(name) {
  const out = [name];
  const push = (v) => { const t = String(v || '').trim(); if (t.length > 2 && !out.includes(t)) out.push(t); };
  push(name.replace(/\s*\([^)]*\)\s*$/, ''));
  push(name.replace(/^(Khu di tích|Di tích|Danh thắng|Thắng cảnh|Quần thể|Cụm di tích|Khu danh thắng|Khu du lịch|Điểm du lịch)\s+/i, ''));
  const and = name.split(/\s+và\s+/i);
  if (and.length === 2) { push(and[0]); push(and[1].replace(/^./, (c) => c.toUpperCase())); }
  return out;
}

async function resolveImages(titles) {
  const unique = [...new Set(titles.map((t) => t.replace(/_/g, ' ').trim()).filter(Boolean))];
  const found = new Map();
  const batches = [];
  for (let i = 0; i < unique.length; i += 40) batches.push(unique.slice(i, i + 40));
  let done = 0;
  for (const batch of batches) {
    const j = await api(VI_API, {
      action: 'query', prop: 'pageimages', piprop: 'thumbnail|name', pithumbsize: '1000',
      redirects: '1', titles: batch.join('|'),
    });
    const chain = new Map(batch.map((t) => [t, t]));
    for (const r of j.query?.normalized || []) chain.set(r.from, r.to);
    for (const r of j.query?.redirects || []) chain.set(r.from, r.to);
    const byTitle = new Map();
    for (const p of j.query?.pages || []) {
      byTitle.set(p.title, p.missing ? null : (p.thumbnail ? { thumb: p.thumbnail.source, file: p.pageimage || null, page: p.title } : null));
    }
    for (const t of batch) {
      let cur = t;
      for (let i = 0; i < 5 && chain.has(cur); i++) { const nx = chain.get(cur); if (nx === cur) break; cur = nx; }
      const hit = byTitle.get(cur) || null;
      if (hit) found.set(t, hit);
    }
    done += batch.length;
    console.log(`  ảnh: ${done}/${unique.length}`);
  }
  return found;
}

async function provinceGallery(title) {
  const j = await api(VI_API, {
    action: 'query', generator: 'images', titles: title, gimlimit: '30',
    prop: 'imageinfo', iiprop: 'url|size|mime', iiurlwidth: '1000',
  });
  const items = [];
  for (const p of j.query?.pages || []) {
    if (!/^File:/i.test(p.title || '')) continue;
    const ii = p.imageinfo?.[0];
    if (!ii || !ii.thumburl) continue;
    if (!/^image\/(jpeg|png)$/.test(ii.mime || '')) continue;
    if ((ii.width || 0) < 900 || (ii.height || 0) < 450) continue;
    const ratio = (ii.width || 1) / (ii.height || 1);
    if (ratio < 1.15 || ratio > 2.8) continue;
    if (/(map|bản đồ|flag|logo|seal|coat|icon|signature|banner|nhãn|biểu trưng)/i.test(p.title)) continue;
    items.push({ file: p.title.replace(/^File:/i, ''), thumb: ii.thumburl, title: p.title });
  }
  return items;
}

function junkHit(hit) {
  const file = String(hit?.file || '');
  if (!file) return false;
  if (/\.svg$/i.test(file)) return true;
  return /(map|bản đồ|ban do|locator|relief|flag|logo|seal|coat of arms|icon|diagram|banner|biểu trưng|sơ đồ|vị trí)/i.test(file);
}

function safeName(entry) {
  return `${slug(entry.title || entry.file || 'photo')}`;
}

const smallThumb = (url) => {
  const s = String(url || '');
  if (/\/thumb\/\d+px-/.test(s)) return s.replace(/\/(\d+)px-/, '/960px-');
  const m = s.match(/upload\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/([^?#]+)/i);
  if (m) return `https://thumb.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/${m[3]}/960px-${m[3]}`;
  return s;
};

async function download(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 4096) return true;
  const urls = [];
  const small = smallThumb(url);
  if (small !== url) urls.push(small);
  urls.push(url);
  console.log('  ↓', path.basename(dest));
  for (let u = 0; u < urls.length; u++) {
    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        const res = await fetch(urls[u], { headers: { 'User-Agent': UA, Accept: 'image/*' }, signal: AbortSignal.timeout(10000) });
        if (res.status === 429) {
          if (attempt >= 1) { const err = new Error('429'); err.fatal = true; throw err; }
          await sleep(6000);
          continue;
        }
        if (!res.ok) {
          const err = new Error('HTTP ' + res.status);
          if (res.status < 500) err.fatal = true;
          throw err;
        }
        const type = res.headers.get('content-type') || '';
        if (!/^image\//i.test(type)) { const err = new Error('not image: ' + type); err.fatal = true; throw err; }
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 4096) { const err = new Error('too small'); err.fatal = true; throw err; }
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, buf);
        await sleep(180);
        return true;
      } catch (err) {
        if (err.fatal || attempt >= 1) {
          if (u === urls.length - 1) console.warn('  ! tải lỗi', path.basename(dest), err.message);
          break;
        }
        await sleep(1500);
      }
    }
  }
  return false;
}

async function fetchCredits(fileTitles) {
  const unique = [...new Set(fileTitles.filter(Boolean))];
  const credits = new Map();
  for (let i = 0; i < unique.length; i += 40) {
    const batch = unique.slice(i, i + 40);
    let j;
    try {
      j = await api(COMMONS_API, {
        action: 'query', prop: 'imageinfo', iiprop: 'extmetadata|url',
        titles: batch.map((f) => 'File:' + f).join('|'),
      });
    } catch { continue; }
    for (const p of j.query?.pages || []) {
      const name = (p.title || '').replace(/^File:/i, '');
      const meta = p.imageinfo?.[0]?.extmetadata;
      if (!meta) continue;
      const artist = stripTags(meta.Artist?.value || '').slice(0, 60);
      const license = stripTags(meta.LicenseShortName?.value || '');
      const credit = `Ảnh: ${artist ? artist + ' / ' : ''}${license || 'Wikimedia Commons'}`.trim();
      credits.set(name, { credit, page: p.imageinfo?.[0]?.descriptionurl || '' });
    }
    console.log(`  credit: ${Math.min(i + 40, unique.length)}/${unique.length}`);
  }
  return credits;
}

async function main() {
  const places = JSON.parse(fs.readFileSync(PLACES_FILE, 'utf8'));
  const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
  fs.mkdirSync(PHOTO_ROOT, { recursive: true });

  const wantPlaces = !ONLY || ONLY === 'places';
  const wantProvinces = !ONLY || ONLY === 'provinces';
  const wantFood = !ONLY || ONLY === 'food';
  const wantCulture = !ONLY || ONLY === 'culture';

  const provinceList = [...new Set(places.map((p) => p.province).filter(Boolean))];
  const foodList = [...new Set(places.map((p) => p.specialty).filter(Boolean))];
  const cultureList = [...new Set(places.map((p) => p.culture).filter(Boolean))];

  // 1) Ảnh địa danh: dùng cache nếu có, ngược lại thử tên gốc và biến thể
  const placeTitleMap = new Map(); // place.id -> resolved title
  if (wantPlaces) {
    console.log('Địa danh:', places.length);
    if (cache.placeTitles && Object.keys(cache.placeTitles).length) {
      for (const p of places) {
        const hit = cache.placeTitles[p.id];
        if (hit) placeTitleMap.set(p.id, hit);
      }
      console.log(`=> dùng cache: ${placeTitleMap.size}/${places.length} địa danh có ảnh`);
    } else if (OFFLINE) {
      console.log('=> offline: chưa có cache ảnh địa danh');
    } else {
      const variantsByPlace = new Map();
      const allTitles = [];
      for (const p of places) {
        const v = placeVariants(p.name);
        variantsByPlace.set(p.id, v);
        allTitles.push(...v);
      }
      const found = await resolveImages(allTitles);
      for (const p of places) {
        const hit = (variantsByPlace.get(p.id) || []).map((t) => found.get(t)).find(Boolean);
        if (hit) placeTitleMap.set(p.id, hit);
      }
      const hitCount = placeTitleMap.size;
      console.log(`=> ${hitCount}/${places.length} địa danh có ảnh (${Math.round(100 * hitCount / places.length)}%)`);
      cache.placeTitles = Object.fromEntries([...placeTitleMap].map(([id, hit]) => [id, { file: hit.file, thumb: hit.thumb, title: hit.page }]));
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1));
    }
  }

  // 2) Tỉnh: ảnh đại diện (bỏ thư viện ảnh để tiết kiệm request)
  const provinceData = {};
  if (wantProvinces) {
    console.log('Tỉnh/thành:', provinceList.length);
    for (const prov of provinceList) {
      const title = prov === 'TP. Hồ Chí Minh' ? 'Thành phố Hồ Chí Minh' : prov;
      if (!cache.province?.[prov]) {
        if (OFFLINE) {
          console.log(`  ${prov}: offline, sẽ dùng ảnh địa danh cùng tỉnh`);
          provinceData[prov] = { hero: null, gallery: [] };
          continue;
        }
        const heroRes = await resolveImages([title]);
        cache.province = cache.province || {};
        cache.province[prov] = { hero: heroRes.get(title) || null, gallery: [] };
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1));
      }
      const rec = cache.province[prov];
      provinceData[prov] = { hero: rec.hero, gallery: rec.gallery || [] };
      console.log(`  ${prov}: ${rec.hero ? 'hero' : 'no-hero'}`);
    }
  }

  // 3) Đặc sản + văn hoá: ảnh bài viết
  let foodFound = new Map();
  let cultureFound = new Map();
  if (cache.food) foodFound = new Map(Object.entries(cache.food));
  else if (wantFood && !OFFLINE) {
    console.log('Đặc sản:', foodList.length);
    foodFound = await resolveImages(foodList);
    cache.food = Object.fromEntries([...foodFound].map(([k, v]) => [k, { file: v.file, thumb: v.thumb, title: v.page }]));
    console.log(`=> ${foodFound.size}/${foodList.length} đặc sản có ảnh`);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1));
  }
  if (cache.culture) cultureFound = new Map(Object.entries(cache.culture));
  else if (wantCulture && !OFFLINE) {
    console.log('Văn hoá:', cultureList.length);
    cultureFound = await resolveImages(cultureList);
    cache.culture = Object.fromEntries([...cultureFound].map(([k, v]) => [k, { file: v.file, thumb: v.thumb, title: v.page }]));
    console.log(`=> ${cultureFound.size}/${cultureList.length} nét văn hoá có ảnh`);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1));
  }

  if (RESOLVE) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1));
    console.log('RESOLVE – chỉ cập nhật cache, chưa tải ảnh.');
    return;
  }

  if (DRY) {
    console.log('DRY RUN – chưa tải ảnh.');
    return;
  }

  // 4) Tải ảnh
  const index = { generatedAt: new Date().toISOString(), base: 'photos/', places: {}, provinces: {}, food: {}, culture: {} };
  const fileCredits = new Map(); // file title -> local path + credit key
  const register = (src, file, title) => {
    if (file) fileCredits.set(file, { src, title: title || file });
    return src;
  };

  fs.mkdirSync(path.join(PHOTO_ROOT, 'places'), { recursive: true });
  if (wantPlaces) {
    let n = 0, ok = 0;
    const used = new Map();
    for (const place of places) {
      const hit = cache.placeTitles?.[place.id];
      if (!hit || junkHit(hit)) continue;
      let rel = used.get(hit.file);
      if (!rel) {
        rel = `photos/places/${place.id}.jpg`;
        const dest = path.join(MEDIA_ROOT, rel.replace(/^photos\//, 'photos/'));
        if (await download(hit.thumb, dest)) used.set(hit.file, rel);
        else continue;
        register(rel, hit.file, hit.title);
      }
      index.places[place.id] = { src: rel };
      ok++;
      if (++n % 10 === 0) console.log(`  tải địa danh ${ok}`);
    }
    console.log(`=> đã tải ${ok} ảnh địa danh`);
  }

  if (wantProvinces) {
    for (const prov of provinceList) {
      const rec = provinceData[prov];
      if (!rec) continue;
      const key = slug(prov);
      const entry = {};
      if (rec.hero?.thumb) {
        const rel = `photos/provinces/${key}.jpg`;
        if (await download(rec.hero.thumb, path.join(MEDIA_ROOT, rel))) {
          entry.hero = { src: rel };
          register(rel, rec.hero.file, rec.hero.page);
        }
      }
      entry.extras = [];
      let i = 0;
      for (const img of rec.gallery || []) {
        if (i >= 6) break;
        const rel = `photos/provinces/${key}-${i + 2}.jpg`;
        if (await download(img.thumb, path.join(MEDIA_ROOT, rel))) {
          entry.extras.push({ src: rel, title: img.title });
          register(rel, img.file, img.title);
          i++;
        }
      }
      // Bù ảnh tỉnh bằng ảnh thật của các địa danh cùng tỉnh (đã tải ở bước 1)
      if (wantPlaces) {
        const pool = [];
        for (const p of places) {
          const rel = p.province === prov ? index.places[p.id]?.src : '';
          if (rel && !pool.includes(rel)) pool.push(rel);
        }
        if (pool.length) {
          if (!entry.hero) entry.hero = { src: pool.shift() };
          for (const src of pool) {
            if (entry.extras.length >= 6) break;
            if (src !== entry.hero.src) entry.extras.push({ src });
          }
        }
      }
      index.provinces[prov] = entry;
      console.log(`  tỉnh ${prov}: ${entry.hero ? 1 : 0}+${entry.extras.length}`);
    }
  }

  if (wantFood) {
    let ok = 0;
    for (const [name, hit] of foodFound) {
      if (!hit?.thumb) continue;
      const rel = `photos/food/${slug(name)}.jpg`;
      if (await download(hit.thumb, path.join(MEDIA_ROOT, rel))) {
        index.food[name] = { src: rel };
        register(rel, hit.file, hit.page);
        ok++;
      }
    }
    console.log(`=> đã tải ${ok} ảnh đặc sản`);
  }

  if (wantCulture) {
    let ok = 0;
    for (const [name, hit] of cultureFound) {
      if (!hit?.thumb) continue;
      const rel = `photos/culture/${slug(name)}.jpg`;
      if (await download(hit.thumb, path.join(MEDIA_ROOT, rel))) {
        index.culture[name] = { src: rel };
        register(rel, hit.file, hit.page);
        ok++;
      }
    }
    console.log(`=> đã tải ${ok} ảnh văn hoá`);
  }

  // 5) Credit
  let credits = new Map();
  if (!OFFLINE && fileCredits.size) {
    console.log('Lấy credit:', fileCredits.size, 'ảnh');
    credits = await fetchCredits([...fileCredits.keys()]);
  }
  for (const [file, rec] of fileCredits) {
    const c = credits.get(file);
    const credit = c?.credit || 'Ảnh: Wikimedia Commons';
    const target = rec.src;
    const apply = (holder) => { if (holder && holder.src === target) holder.credit = credit; };
    Object.values(index.places).forEach(apply);
    Object.values(index.provinces).forEach((p) => { apply(p.hero); (p.extras || []).forEach(apply); });
    Object.values(index.food).forEach(apply);
    Object.values(index.culture).forEach(apply);
  }
  const fillCredit = (holder) => { if (holder && holder.src && !holder.credit) holder.credit = 'Ảnh: Wikimedia Commons'; };
  Object.values(index.places).forEach(fillCredit);
  Object.values(index.provinces).forEach((p) => { fillCredit(p.hero); (p.extras || []).forEach(fillCredit); });
  Object.values(index.food).forEach(fillCredit);
  Object.values(index.culture).forEach(fillCredit);

  fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 1));
  fs.mkdirSync(path.dirname(GAME_INDEX), { recursive: true });
  fs.writeFileSync(GAME_INDEX, '/* Tự sinh bởi fetch-media.mjs */\nwindow.MEDIA_INDEX = ' + JSON.stringify(index) + ';\n');

  // Dọn ảnh không còn được index tham chiếu (bản đồ, ảnh lỗi của lần chạy trước)
  const used = new Set();
  const mark = (e) => { if (e && e.src) used.add(path.normalize(e.src)); };
  Object.values(index.places).forEach(mark);
  Object.values(index.provinces).forEach((p) => { mark(p.hero); (p.extras || []).forEach(mark); });
  Object.values(index.food).forEach(mark);
  Object.values(index.culture).forEach(mark);
  let removed = 0;
  for (const rel of fs.readdirSync(PHOTO_ROOT, { recursive: true })) {
    if (!/\.(jpg|jpeg|png|webp)$/i.test(rel)) continue;
    const normRel = path.normalize(path.posix.join('photos', rel.replace(/\\/g, '/')));
    if (used.has(normRel)) continue;
    fs.rmSync(path.join(PHOTO_ROOT, rel), { force: true });
    removed++;
  }
  if (removed) console.log('Đã dọn', removed, 'ảnh không dùng');

  console.log('Đã ghi', INDEX_FILE);
  console.log('Đã ghi', GAME_INDEX);
  console.log('Tổng ảnh địa danh:', Object.keys(index.places).length, '| tỉnh:', Object.keys(index.provinces).length, '| đặc sản:', Object.keys(index.food).length, '| văn hoá:', Object.keys(index.culture).length);
}

main().catch((e) => { console.error(e); process.exit(1); });
