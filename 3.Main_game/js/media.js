/* Sắc Việt – cấu hình media (ảnh hướng dẫn viên + ảnh địa danh thật) */
(function () {
  const base = '../1.Media_place/';
  const index = window.MEDIA_INDEX || {};
  const indexPlaces = index.places || {};
  const indexProvinces = index.provinces || {};
  const indexFood = index.food || {};
  const indexCulture = index.culture || {};

  const MEDIA = {
    guide: {
      welcome: base + 'guide/mai-welcome.png',
      ask: base + 'guide/mai-ask.png',
      celebrate: base + 'guide/mai-celebrate.png',
    },
    places: {
      'vinh-ha-long': base + 'places/vinh-ha-long.png',
      'do-thi-co-hoi-an': base + 'places/hoi-an.png',
      'thi-tran-sa-pa': base + 'places/sapa.png',
      'dong-phong-nha': base + 'places/phong-nha.png',
    },
    traveler: {
      selfie: base + 'traveler/selfie.jpg',
      walk: base + 'traveler/walk.jpg',
      culture: base + 'traveler/culture.jpg',
      food: base + 'traveler/food.jpg',
    },
    credit: 'Ảnh minh hoạ: Sắc Việt · Dữ liệu di tích: Wikipedia tiếng Việt (CC BY-SA)',
  };

  function normalize(path) {
    if (!path) return '';
    if (/^(https?:|data:|\.\.?\/)/.test(path)) return path;
    return base + path.replace(/^\/+/, '');
  }

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const asset = (entry) => (entry && entry.src ? normalize(entry.src) : '');

  const M = {
    data: MEDIA,
    index,
    guide(kind = 'welcome') {
      return MEDIA.guide[kind] || MEDIA.guide.welcome || '';
    },
    photo(placeId) {
      return asset(indexPlaces[placeId]) || MEDIA.places[placeId] || '';
    },
    placeEntry(placeId) {
      const e = indexPlaces[placeId];
      if (e && e.src) return { img: normalize(e.src), credit: e.credit || '' };
      const src = MEDIA.places[placeId];
      return src ? { img: src, credit: '' } : null;
    },
    provinceGallery(place) {
      return M.provincePhotos(place)
        .map((e) => (e && e.src ? { img: normalize(e.src), credit: e.credit || '' } : null))
        .filter(Boolean);
    },
    creditFor(src) {
      if (!src) return '';
      const all = [
        ...Object.values(indexPlaces),
        ...Object.values(indexFood),
        ...Object.values(indexCulture),
        ...Object.values(indexProvinces).flatMap((p) => [p.hero, ...(p.extras || [])]),
      ];
      const hit = all.find((e) => e && normalize(e.src) === src);
      return hit?.credit || '';
    },
    provincePhotos(place) {
      const rec = place ? indexProvinces[place.province] : null;
      if (!rec) return [];
      return [rec.hero, ...(rec.extras || [])].filter((e) => e && e.src);
    },
    provincePhoto(place, variant = 0) {
      const list = M.provincePhotos(place);
      if (!list.length) return '';
      const own = normalize(M.photo(place.id));
      const pool = list.filter((e) => normalize(e.src) !== own);
      const use = pool.length ? pool : list;
      const i = (hash(String(place.id)) + variant * 7) % use.length;
      return normalize(use[i].src);
    },
    foodPhoto(place) {
      return asset(place ? indexFood[place.specialty] : null);
    },
    culturePhoto(place) {
      return asset(place ? indexCulture[place.culture] : null);
    },
    traveler(pose = 'selfie') {
      return MEDIA.traveler[pose] || MEDIA.traveler.selfie || '';
    },
    async refresh() {
      try {
        const res = await fetch(base + 'manifest.json', { cache: 'no-cache' });
        if (!res.ok) return false;
        const data = await res.json();
        if (data.guide) {
          for (const k of Object.keys(data.guide)) MEDIA.guide[k] = normalize(data.guide[k]);
        }
        if (data.places) {
          for (const k of Object.keys(data.places)) MEDIA.places[k] = normalize(data.places[k]);
        }
        if (data.traveler) {
          for (const k of Object.keys(data.traveler)) MEDIA.traveler[k] = normalize(data.traveler[k]);
        }
        if (data.credit) MEDIA.credit = data.credit;
        return true;
      } catch {
        return false;
      }
    },
  };

  window.Media = M;
})();
