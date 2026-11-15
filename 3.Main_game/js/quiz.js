/* Sắc Việt – sinh gói 5 câu hỏi cho từng địa danh */
(function () {
  const Q = {};

  let places = [];
  let byProvince = new Map();
  let provincesOfRegion = new Map();
  const valuePools = { figure: new Map(), specialty: new Map(), culture: new Map() };

  Q.init = function (list) {
    places = list;
    byProvince = new Map();
    provincesOfRegion = new Map();
    const seen = { figure: new Map(), specialty: new Map(), culture: new Map() };

    for (const p of places) {
      if (!byProvince.has(p.province)) {
        byProvince.set(p.province, { region: p.region, values: { figure: new Set(), specialty: new Set(), culture: new Set() } });
      }
      const entry = byProvince.get(p.province);
      for (const k of ['figure', 'specialty', 'culture']) {
        const v = String(p[k] || '').trim();
        if (!v) continue;
        entry.values[k].add(v);
        if (!seen[k].has(v)) seen[k].set(v, new Set());
        seen[k].get(v).add(p.province);
      }
      if (!provincesOfRegion.has(p.region)) provincesOfRegion.set(p.region, new Set());
      provincesOfRegion.get(p.region).add(p.province);
    }
    valuePools.figure = seen.figure;
    valuePools.specialty = seen.specialty;
    valuePools.culture = seen.culture;
  };

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function toOptions(correct, pool, count = 4) {
    const out = [correct];
    const used = new Set([correct]);
    for (const v of shuffle(pool)) {
      if (out.length >= count) break;
      if (used.has(v)) continue;
      used.add(v);
      out.push(v);
    }
    return shuffle(out);
  }

  function answerOf(options, correct) {
    return options.indexOf(correct);
  }

  const TIER_LABELS = { Master: 'Master', Pro: 'Pro', Task: 'Task' };

  Q.build = function (place) {
    const region = place.region;
    const regionProvinces = Array.from(provincesOfRegion.get(region) || []);
    const otherProvinces = Array.from(byProvince.keys()).filter((p) => p !== place.province);

    /* ---------- Câu 1: tên địa danh ---------- */
    const namePool = places
      .filter((p) => p.region === region && p.id !== place.id && p.name !== place.name)
      .map((p) => p.name);
    const nameOptions = toOptions(place.name, namePool);

    /* ---------- Câu 2: tỉnh / thành ---------- */
    const sameRegion = regionProvinces.filter((p) => p !== place.province);
    const provincePool = shuffle(sameRegion).concat(shuffle(otherProvinces));
    const provinceOptions = toOptions(place.province, provincePool);

    /* ---------- Câu 3–5: nhân vật, đặc sản, văn hoá ---------- */
    const own = byProvince.get(place.province);
    const poolFor = (key) => {
      const ownValues = own ? own.values[key] : new Set();
      const all = Array.from(valuePools[key].keys());
      const fresh = all.filter((v) => !ownValues.has(v) && v !== place[key]);
      return fresh.length >= 3 ? fresh : all.filter((v) => v !== place[key]);
    };

    const figureOptions = toOptions(place.figure, poolFor('figure'));
    const specialtyOptions = toOptions(place.specialty, poolFor('specialty'));
    const cultureOptions = toOptions(place.culture, poolFor('culture'));

    const oldProvince = place.oldProvince && place.oldProvince !== place.province
      ? I18N.t('quiz.oldProvince', { oldProvince: place.oldProvince })
      : '';
    const regionName = I18N.region(region);

    const questions = [
      {
        key: 'name',
        no: 1,
        title: I18N.t('quiz.name.title'),
        short: I18N.t('quiz.name.short'),
        prompt: I18N.t('quiz.name.prompt'),
        options: nameOptions,
        answer: answerOf(nameOptions, place.name),
        answerText: place.name,
        meaning: I18N.t('quiz.name.meaning', { text: I18N.placeStory(place) }),
        ask: I18N.t('quiz.name.ask'),
      },
      {
        key: 'province',
        no: 2,
        title: I18N.t('quiz.province.title'),
        short: I18N.t('quiz.province.short'),
        prompt: I18N.t('quiz.province.prompt', { place: place.name }),
        options: provinceOptions,
        answer: answerOf(provinceOptions, place.province),
        answerText: place.province,
        meaning: I18N.t('quiz.province.meaning', { place: place.name, province: place.province, region: regionName, old: oldProvince }),
        ask: I18N.t('quiz.province.ask'),
      },
      {
        key: 'figure',
        no: 3,
        title: I18N.t('quiz.figure.title'),
        short: I18N.t('quiz.figure.short'),
        prompt: I18N.t('quiz.figure.prompt', { place: place.name }),
        options: figureOptions,
        answer: answerOf(figureOptions, place.figure),
        answerText: place.figure,
        meaning: I18N.t('quiz.figure.meaning', { figure: place.figure, place: place.name }),
        ask: I18N.t('quiz.figure.ask'),
      },
      {
        key: 'specialty',
        no: 4,
        title: I18N.t('quiz.specialty.title'),
        short: I18N.t('quiz.specialty.short'),
        prompt: I18N.t('quiz.specialty.prompt', { province: place.province }),
        options: specialtyOptions,
        answer: answerOf(specialtyOptions, place.specialty),
        answerText: place.specialty,
        meaning: I18N.t('quiz.specialty.meaning', { specialty: place.specialty, province: place.province }),
        ask: I18N.t('quiz.specialty.ask'),
      },
      {
        key: 'culture',
        no: 5,
        title: I18N.t('quiz.culture.title'),
        short: I18N.t('quiz.culture.short'),
        prompt: I18N.t('quiz.culture.prompt', { province: place.province }),
        options: cultureOptions,
        answer: answerOf(cultureOptions, place.culture),
        answerText: place.culture,
        meaning: I18N.t('quiz.culture.meaning', { culture: place.culture, province: place.province }),
        ask: I18N.t('quiz.culture.ask'),
      },
    ];

    return {
      place,
      questions,
      intro: I18N.t('quiz.intro', { region: regionName }),
      tierFor: (correct) => (correct >= 5 ? 'Master' : correct >= 4 ? 'Pro' : correct >= 3 ? 'Task' : null),
      tierLabel: (tier) => `${tier} · ${I18N.t('tier.' + tier.toLowerCase() + '.sub')}`,
      tierLabels: TIER_LABELS,
    };
  };

  /* Câu dẫn của Mai theo từng trạng thái */
  Q.guide = {
    intro(place) {
      return I18N.t('guide.intro', { region: I18N.region(place.region) });
    },
    ask(question) { return question.ask; },
    correct(question, first) {
      const lines = I18N.data('guide.correct') || [];
      const line = lines[question.no % lines.length] || '';
      return I18N.format(line, { answer: question.answerText })
        + I18N.t(first ? 'guide.awarded' : 'guide.earned');
    },
    wrong(question) {
      return I18N.t('guide.wrong', { answer: question.answerText });
    },
    understand(question) { return question.meaning; },
    summary(correct, tier, place) {
      const key = correct === 5 ? 'master' : correct === 4 ? 'pro' : correct === 3 ? 'safe' : 'low';
      return I18N.t('guide.summary.' + key, { place: place.name, correct });
    },
    locked(place, cost) {
      return I18N.t('guide.locked', { place: place.name, cost });
    },
  };

  window.Quiz = Q;
})();
