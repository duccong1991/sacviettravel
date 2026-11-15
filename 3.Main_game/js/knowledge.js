/* Sắc Việt – tri thức vùng miền & sinh câu hỏi trắc nghiệm */
(function () {
  const KD = window.KNOWLEDGE_DATA || { regions: [], history: [] };
  const TOPICS = ['history', 'geography', 'culture', 'festival', 'specialty'];
  const ROUND_SIZE = 10;
  const FESTIVAL_RE = /Hội|Lễ hội|Chọi|Đua|Tết|Giỗ|Ok Om Bok|Kate/;
  const REGION_OPTION_TYPES = new Set(['placeRegion', 'provinceRegion', 'festivalRegion', 'specialtyRegion']);

  const K = {};
  let provinces = [];
  let byName = new Map();
  let regionNames = [];
  let banks = {};
  let allSpecs = [];
  let placeRegionSpecs = [];

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function unique(list) {
    return [...new Set(list)];
  }

  function festivalList(cultures) {
    return cultures.filter((c) => FESTIVAL_RE.test(c));
  }

  function optionsWith(correct, pool, count = 4) {
    const out = [correct];
    const used = new Set([correct]);
    for (const value of shuffle(pool)) {
      if (out.length >= count) break;
      if (used.has(value)) continue;
      used.add(value);
      out.push(value);
    }
    return shuffle(out);
  }

  function provinceOptions(correct) {
    const pool = provinces.map((p) => p.name).filter((n) => n !== correct);
    return optionsWith(correct, pool);
  }

  function regionOptions(correct) {
    const pool = regionNames.filter((r) => r !== correct);
    return optionsWith(correct, pool);
  }

  function makeSpec(type, topic, region, vars, options, answer) {
    return { type, topic, region, vars, options, answer };
  }

  K.init = function (placeList) {
    provinces = [];
    byName = new Map();
    regionNames = [];

    for (const region of KD.regions || []) {
      regionNames.push(region.name);
      for (const p of region.provinces) {
        const rec = {
          name: p.name,
          region: region.name,
          terrain: p.terrain,
          old: p.old || [],
          specialties: unique(p.specialties || []),
          cultures: unique(p.cultures || []),
          figures: unique(p.figures || []),
          festivals: unique(festivalList(p.cultures || [])),
        };
        provinces.push(rec);
        byName.set(rec.name, rec);
      }
    }

    const allSpecialties = unique(provinces.flatMap((p) => p.specialties));
    const allCultures = unique(provinces.flatMap((p) => p.cultures));
    const allFestivals = unique(provinces.flatMap((p) => p.festivals));
    const allFigures = unique(provinces.flatMap((p) => p.figures));
    const provinceNames = provinces.map((p) => p.name);

    const owners = { specialty: new Map(), culture: new Map(), figure: new Map(), festival: new Map() };
    provinces.forEach((p) => {
      for (const [key, list] of [['specialty', p.specialties], ['culture', p.cultures], ['figure', p.figures], ['festival', p.festivals]]) {
        list.forEach((v) => {
          if (!owners[key].has(v)) owners[key].set(v, []);
          owners[key].get(v).push(p.name);
        });
      }
    });
    const soleOwner = (key, value) => {
      const list = owners[key].get(value) || [];
      return list.length === 1 ? list[0] : '';
    };

    banks = { history: [], geography: [], culture: [], festival: [], specialty: [] };

    /* ---------- Lịch sử ---------- */
    (KD.history || []).forEach((fact) => {
      const p = byName.get(fact.province);
      if (!p) return;
      banks.history.push(makeSpec('factProvince', 'history', p.region,
        { label: fact.label, province: p.name }, provinceOptions(p.name), p.name));
    });
    allFigures.forEach((figure) => {
      const province = soleOwner('figure', figure);
      if (!province) return;
      const p = byName.get(province);
      banks.history.push(makeSpec('figureProvince', 'history', p.region,
        { figure, province }, provinceOptions(province), province));
    });
    provinces.forEach((p) => {
      if (!p.figures.length) return;
      const correct = p.figures[0];
      const pool = allFigures.filter((f) => !p.figures.includes(f));
      banks.history.push(makeSpec('provinceFigure', 'history', p.region,
        { province: p.name }, optionsWith(correct, pool), correct));
    });

    /* ---------- Địa lý ---------- */
    const seenPlace = new Set();
    (placeList || [])
      .filter((pl) => pl && pl.fame >= 7 && pl.name && !seenPlace.has(pl.name))
      .sort((a, b) => b.fame - a.fame)
      .forEach((pl) => {
        if (seenPlace.has(pl.name)) return;
        seenPlace.add(pl.name);
        placeRegionSpecs.push(makeSpec('placeRegion', 'geography', pl.region,
          { place: pl.name }, regionOptions(pl.region), pl.region));
      });
    banks.geography.push(...placeRegionSpecs.slice(0, 220));
    provinces.forEach((p) => {
      banks.geography.push(makeSpec('provinceRegion', 'geography', p.region,
        { province: p.name }, regionOptions(p.region), p.region));
      const terrainPool = unique(provinces.map((x) => x.terrain)).filter((t) => t !== p.terrain);
      banks.geography.push(makeSpec('provinceTerrain', 'geography', p.region,
        { province: p.name }, optionsWith(p.terrain, terrainPool), p.terrain));
    });
    regionNames.forEach((region) => {
      const own = provinces.filter((p) => p.region === region);
      const other = provinces.filter((p) => p.region !== region);
      own.forEach((p) => {
        banks.geography.push(makeSpec('regionProvince', 'geography', region,
          { region }, optionsWith(p.name, other.map((x) => x.name)), p.name));
      });
    });

    /* ---------- Văn hóa ---------- */
    allCultures.forEach((culture) => {
      const province = soleOwner('culture', culture);
      if (!province || byName.get(province).festivals.includes(culture)) return;
      const p = byName.get(province);
      banks.culture.push(makeSpec('cultureProvince', 'culture', p.region,
        { culture, province }, provinceOptions(province), province));
    });
    provinces.forEach((p) => {
      const list = p.cultures.filter((c) => !p.festivals.includes(c));
      if (!list.length) return;
      const correct = list[0];
      const pool = allCultures.filter((c) => !p.cultures.includes(c));
      banks.culture.push(makeSpec('provinceCulture', 'culture', p.region,
        { province: p.name }, optionsWith(correct, pool), correct));
    });

    /* ---------- Lễ hội ---------- */
    allFestivals.forEach((festival) => {
      const province = soleOwner('festival', festival);
      if (!province) return;
      const p = byName.get(province);
      banks.festival.push(makeSpec('festivalProvince', 'festival', p.region,
        { festival, province }, provinceOptions(province), province));
      banks.festival.push(makeSpec('festivalRegion', 'festival', p.region,
        { festival }, regionOptions(p.region), p.region));
    });
    provinces.forEach((p) => {
      if (!p.festivals.length) return;
      const correct = p.festivals[0];
      const pool = allFestivals.filter((f) => !p.festivals.includes(f));
      banks.festival.push(makeSpec('provinceFestival', 'festival', p.region,
        { province: p.name }, optionsWith(correct, pool), correct));
    });

    /* ---------- Đặc sản ---------- */
    allSpecialties.forEach((specialty) => {
      const province = soleOwner('specialty', specialty);
      if (!province) return;
      const p = byName.get(province);
      banks.specialty.push(makeSpec('specialtyProvince', 'specialty', p.region,
        { specialty, province }, provinceOptions(province), province));
      banks.specialty.push(makeSpec('specialtyRegion', 'specialty', p.region,
        { specialty }, regionOptions(p.region), p.region));
    });
    provinces.forEach((p) => {
      if (!p.specialties.length) return;
      const correct = p.specialties[0];
      const pool = allSpecialties.filter((s) => !p.specialties.includes(s));
      banks.specialty.push(makeSpec('provinceSpecialty', 'specialty', p.region,
        { province: p.name }, optionsWith(correct, pool), correct));
    });

    /* Bỏ câu hỏi trùng hoàn toàn (cùng đề + cùng đáp án) */
    const seen = new Set();
    TOPICS.forEach((topic) => {
      banks[topic] = banks[topic].filter((s) => {
        const key = `${s.type}|${JSON.stringify(s.vars)}|${s.answer}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });

    allSpecs = TOPICS.flatMap((topic) => banks[topic].map((s) => ({ ...s, topic })));
    K.ready = true;
  };

  K.topics = TOPICS.slice();
  K.roundSize = ROUND_SIZE;
  K.regions = () => (KD.regions || []).map((r) => ({ key: r.key, name: r.name }));
  K.regionByName = (name) => (KD.regions || []).find((r) => r.name === name) || null;
  K.provincesOf = (region) => provinces.filter((p) => !region || p.region === region);
  K.terrainKey = (terrain) => 'knowledge.terrain.' + terrain;

  K.regionInfo = function (regionName) {
    const list = provinces.filter((p) => p.region === regionName);
    return {
      provinces: list.map((p) => p.name),
      specialties: unique(list.flatMap((p) => p.specialties)).sort((a, b) => a.localeCompare(b, 'vi')),
      cultures: unique(list.flatMap((p) => p.cultures)).sort((a, b) => a.localeCompare(b, 'vi')),
      festivals: unique(list.flatMap((p) => p.festivals)).sort((a, b) => a.localeCompare(b, 'vi')),
      figures: unique(list.flatMap((p) => p.figures)).sort((a, b) => a.localeCompare(b, 'vi')),
      history: (KD.history || []).filter((f) => {
        const p = byName.get(f.province);
        return p && p.region === regionName;
      }),
      terrains: unique(list.map((p) => p.terrain)),
    };
  };

  K.stats = function () {
    return {
      regions: regionNames.length,
      provinces: provinces.length,
      specialties: unique(provinces.flatMap((p) => p.specialties)).length,
      festivals: unique(provinces.flatMap((p) => p.festivals)).length,
      cultures: unique(provinces.flatMap((p) => p.cultures)).length,
      facts: (KD.history || []).length,
    };
  };

  function scopedPool(topic, region) {
    const base = banks[topic] || [];
    return region ? base.filter((s) => s.region === region) : base.slice();
  }

  K.bankSize = function (topic, region) {
    if (topic === 'mixed') {
      return TOPICS.reduce((n, t) => n + Math.min(scopedPool(t, region).length, 2), 0);
    }
    return scopedPool(topic, region).length;
  };

  K.newRound = function (topic, region, size) {
    const wanted = size || ROUND_SIZE;
    let picked = [];
    if (topic === 'mixed') {
      const per = Math.max(1, Math.floor(wanted / TOPICS.length));
      TOPICS.forEach((t) => { picked.push(...shuffle(scopedPool(t, region)).slice(0, per)); });
      const used = new Set(picked);
      const rest = shuffle(TOPICS.flatMap((t) => scopedPool(t, region)).filter((s) => !used.has(s)));
      while (picked.length < wanted && rest.length) picked.push(rest.shift());
    } else {
      picked = shuffle(scopedPool(topic, region)).slice(0, wanted);
    }
    return {
      topic,
      region: region || '',
      specs: picked,
      index: 0,
      score: 0,
      answered: null,
      choice: null,
      done: false,
      total: picked.length,
    };
  };

  K.prompt = function (spec) {
    return I18N.t('knowledge.quiz.q.' + spec.type, spec.vars);
  };

  K.optionLabel = function (spec, value) {
    if (spec.type === 'provinceTerrain') return I18N.t(K.terrainKey(value));
    if (REGION_OPTION_TYPES.has(spec.type)) return I18N.region(value);
    return value;
  };

  K.explain = function (spec) {
    const vars = { ...spec.vars, answer: K.optionLabel(spec, spec.answer) };
    vars.region = I18N.region(spec.region);
    if (spec.type === 'provinceTerrain') vars.terrain = I18N.t(K.terrainKey(spec.answer));
    return I18N.t('knowledge.quiz.explain.' + spec.type, vars);
  };

  K.topicLabel = function (topic) {
    return I18N.t('knowledge.topics.' + topic);
  };

  window.Knowledge = K;
})();
