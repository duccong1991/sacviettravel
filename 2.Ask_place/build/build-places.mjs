import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROVINCES, REGIONS } from '../data/province-profiles.mjs';
import { CURATED } from '../data/curated.mjs';
import { ICON_OVERRIDES } from '../data/icons.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const rawRows = JSON.parse(fs.readFileSync(path.join(root, '2.Ask_place', 'raw', 'relics-parsed.json'), 'utf8'));

const PROVINCE_FIX = {
  'Thành phố Quảng Ninh': 'Quảng Ninh',
  'Thành phố Bắc Ninh': 'Bắc Ninh',
  'Thành phố Hải Phòng': 'Hải Phòng',
  'Thành phố Huế': 'Huế',
  'Thành phố Đà Nẵng': 'Đà Nẵng',
  'Thành phố Hồ Chí Minh': 'TP. Hồ Chí Minh',
  'Thành phố Đồng Nai': 'Đồng Nai',
  'Thành phố Cần Thơ': 'Cần Thơ',
  'Đăk Lăk': 'Đắk Lắk',
};

const stripDiacritics = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
const slug = (s) => stripDiacritics(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const cleanName = (raw) => {
  let n = raw
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/^(Khu di tích lịch sử|Khu di tích|Di tích lịch sử|Di tích|Quần thể di tích danh thắng|Quần thể di tích|Danh thắng|Thắng cảnh|Khu danh thắng)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  n = n.replace(/^Đăk\b/, 'Đắk').replace(/\bĐăk\b/g, 'Đắk');
  if (/^khảo cổ\s/i.test(n)) n = 'Di chỉ ' + n;
  if (n) n = n.charAt(0).toUpperCase() + n.slice(1);
  return n;
};

const NAME_FIX = {
  'Văn Miếu - Quốc Tử Giám, Bia tiến sĩ Văn Miếu Thăng Long': 'Văn Miếu – Quốc Tử Giám',
  'Quần thể Hương Sơn': 'Chùa Hương',
  'Khu lưu niệm Chủ tịch Hồ Chí Minh tại Phủ Chủ tịch': 'Phủ Chủ tịch',
  'Đền Đồng Nhân / Đền Hai Bà Trưng': 'Đền Hai Bà Trưng',
  'Thành Nhà Hồ': 'Thành nhà Hồ',
};

const BAD_NAME = /^(Nhà thờ họ|Nghĩa trang|Bia |Đài tưởng niệm|Nhà bia|Mộ |Lăng mộ|Khu mộ|Phế tích|Cơ sở|Nơi |Địa điểm |Trụ sở|Căn cứ|Cơ quan|Nhà tù|Nhà lao|Nhà đày|Khu chứng tích|Chiến trường|Chiến thắng|Di chỉ khảo cổ|Địa đạo|Bến đò|Cụm di tích|Phòng tuyến|Trận địa|Hầm |Đồn |Lũy |Trường lũy|Tập đoàn cứ điểm|Xưởng|Nhà máy|Bệnh viện|Chỉ huy sở|Văn phòng|Sở |Bộ |Ủy ban|Hội |Liên |Đập |Khu công nghiệp|Mỏ |Bến |Bãi chôn|Nhà số|Ngã |Đài phát|Sân bay|Cảng|Trại |Khu tập thể|Khu phố|Phố )/i;
const GOOD_NAME = /chùa|đền|miếu|đình|thánh đường|nhà thờ|tháp|hang|động|thác|hồ|núi|đèo|bãi|biển|đảo|vịnh|chợ|làng|vườn quốc gia|rừng|thành cổ|đô thị cổ|phố cổ|bảo tàng|thánh địa|suối|ruộng bậc thang|quần thể|danh thắng|thắng cảnh|am|quán|từ đường/i;

const inferKind = (name, cls) => {
  const n = name.toLowerCase();
  if (/nhà thờ|thánh đường/.test(n)) return 'church';
  if (/chùa|am |tự viện|thiền viện/.test(n)) return 'pagoda';
  if (/^phủ\s|phủ tây hồ/.test(n)) return 'temple';
  if (/đền|miếu|đình|từ đường|thánh địa|quán/.test(n)) return 'temple';
  if (/tháp/.test(n)) return 'tower';
  if (/ruộng bậc thang/.test(n)) return 'terrace';
  if (/bãi đá|ghềnh đá|mỏ đá cổ|đá nổi/.test(n)) return 'rockfield';
  if (/bãi cọc|tàu không số/.test(n)) return 'relic';
  if (/khu bảo tồn|vườn quốc gia|rừng/.test(n)) return 'forest';
  const NOT_CAVE = /vận động|lao động|hoạt động|chuyển động|hành động|tự động|cảm động|rung động|di động|bất động|sinh động/;
  if (/(^|\s)(hang|động)(\s|$)/.test(n) && !NOT_CAVE.test(n)) return 'cave';
  if (/thác/.test(n)) return 'waterfall';
  if (/bảo tàng/.test(n)) return 'museum';
  if (/^nhà hát|^thành phố|thành phố hồ chí minh/.test(n)) return 'city';
  if (/(^|\s)hồ(\s|$)/.test(n) && !/chí minh|chủ tịch|bác hồ/.test(n)) return 'lake';
  if (/đèo/.test(n)) return 'pass';
  if (/núi/.test(n)) return 'mountain';
  if (/vịnh/.test(n)) return 'bay';
  if (/đảo/.test(n)) return 'island';
  if (/bãi|biển/.test(n)) return 'beach';
  if (/chợ/.test(n)) return 'market';
  if (/làng/.test(n)) return 'village';
  if (/cầu/.test(n)) return 'bridge';
  if (/thành/.test(n)) return 'citadel';
  if (/suối/.test(n)) return 'spring';
  return 'relic';
};

const relicFame = (name, cls, year) => {
  let f = 4;
  if (/đặc biệt/.test(cls)) f = 7;
  else if (/danh thắng|thắng cảnh/.test(cls)) f = 6;
  else if (/kiến trúc|văn hóa/.test(cls)) f = 5;
  if (year && Number(year) <= 1980) f += 1;
  if (/^(đình|miếu)/i.test(name)) f -= 1;
  return Math.max(2, Math.min(8, Math.round(f)));
};

const SCENIC = new Set(['bay', 'island', 'beach', 'cave', 'waterfall', 'mountain', 'peak', 'pass', 'lake', 'valley', 'terrace', 'plateau', 'river', 'lagoon', 'desert', 'rockfield', 'forest', 'wetland', 'spring', 'hotspring']);

const hashStr = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

// 1) Lọc di tích
const seen = new Set();
let relics = [];
for (const row of rawRows) {
  const province = PROVINCE_FIX[row.province] || row.province;
  if (!PROVINCES[province]) continue;
  const rawName = cleanName(row.name);
  const name = NAME_FIX[rawName] || rawName;
  if (!name || name.length < 4 || name.length > 62) continue;
  if (BAD_NAME.test(name) || !GOOD_NAME.test(name)) continue;
  if (/gồm|khu vực/i.test(name)) continue;
  const key = `${province}|${stripDiacritics(name).toLowerCase()}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const kind = inferKind(name, row.cls);
  const fame = relicFame(name, row.cls, row.year);
  relics.push({
    name, province, region: PROVINCES[province].region, kind, fame,
    area: cleanName(row.area || ''), cls: row.cls || '', year: row.year || '', source: 'relic',
  });
}

// 2) Chấm điểm & giới hạn mỗi tỉnh
const scoreRow = (r) => {
  let s = r.fame * 10;
  if (/đặc biệt/.test(r.cls)) s += 30;
  if (/danh thắng|thắng cảnh/.test(r.cls)) s += 12;
  if (SCENIC.has(r.kind)) s += 8;
  if (/^(chùa|đền|tháp)/i.test(r.name)) s += 3;
  if (r.name.length >= 6 && r.name.length <= 26) s += 2;
  s += hashStr(r.name) % 17 / 4;
  return s;
};
relics.sort((a, b) => scoreRow(b) - scoreRow(a));
const cap = 55;
const perProv = {};
const keptRelics = [];
for (const r of relics) {
  perProv[r.province] = (perProv[r.province] || 0) + 1;
  if (perProv[r.province] <= cap) keptRelics.push(r);
}

// 3) Gộp điểm đến bổ sung
const keyOf = (province, name) => `${province}|${stripDiacritics(cleanName(name)).toLowerCase().replace(/[^a-z0-9]/g, '')}`;
const byKey = new Map(keptRelics.map((r) => [keyOf(r.province, r.name), r]));
const ALIAS = {
  'Phố cổ Hội An': 'Đô thị cổ Hội An',
  'Chùa Bái Đính': 'Núi chùa Bái Đính',
  'Thánh địa Mỹ Sơn': 'Thánh địa Mỹ Sơn',
};
const mergedCuratedKeys = new Set();
for (const item of CURATED) {
  if (!PROVINCES[item.province]) throw new Error('Tỉnh lạ: ' + item.province);
  const aliasName = ALIAS[item.name] || item.name;
  const k = keyOf(item.province, aliasName);
  const k2 = keyOf(item.province, item.name);
  const found = byKey.get(k) || byKey.get(k2);
  if (found) {
    Object.assign(found, {
      name: found.name,
      kind: item.kind || found.kind,
      fame: Math.max(found.fame, item.fame),
      figure: item.figure || found.figure || '',
      story: item.story || found.story || '',
      curated: true,
    });
    mergedCuratedKeys.add(keyOf(found.province, found.name));
  } else {
    const row = {
      name: cleanName(item.name), province: item.province, region: PROVINCES[item.province].region,
      kind: item.kind, fame: item.fame, figure: item.figure || '', story: item.story || '',
      area: '', cls: 'Điểm đến du lịch', year: '', source: 'curated', curated: true,
    };
    keptRelics.push(row);
    byKey.set(keyOf(row.province, row.name), row);
  }
}

// 4) Ghi đè địa danh biểu tượng
for (const p of keptRelics) {
  const ov = ICON_OVERRIDES[`${p.province}|${p.name}`];
  if (!ov) continue;
  if (ov.fame) p.fame = ov.fame;
  if (ov.figure) p.figure = ov.figure;
  if (ov.story) p.story = ov.story;
  if (ov.kind) p.kind = ov.kind;
}

// 5) Bổ sung trường câu hỏi
const KIND_LABEL = {
  pagoda: 'ngôi chùa cổ', temple: 'đền, miếu thờ', church: 'nhà thờ', cave: 'hang động',
  waterfall: 'thác nước', lake: 'hồ nước', mountain: 'ngọn núi', peak: 'đỉnh núi',
  pass: 'con đèo', bay: 'vịnh biển', island: 'hòn đảo', beach: 'bãi biển',
  village: 'bản làng', market: 'khu chợ', bridge: 'cây cầu', citadel: 'thành cổ',
  relic: 'di tích', museum: 'bảo tàng', tower: 'ngọn tháp', forest: 'cánh rừng',
  spring: 'dòng suối', terrace: 'ruộng bậc thang', plateau: 'cao nguyên', valley: 'thung lũng',
  garden: 'khu vườn', wetland: 'vùng đầm lầy', rockfield: 'bãi đá', desert: 'đồi cát',
  lighthouse: 'hải đăng', 'fishing-village': 'làng chài', craft: 'làng nghề',
  'ancient-town': 'phố cổ', city: 'đô thị', town: 'thị trấn', field: 'cánh đồng',
  folk: 'lễ hội dân gian', theme: 'khu du lịch', lagoon: 'đầm phá', river: 'dòng sông',
  hotspring: 'suối khoáng', statue: 'tượng đài', harbor: 'bến cảng', eco: 'khu sinh thái',
  scenic: 'danh thắng',
};

const STORY_TEMPLATES = [
  (p, f) => `${p.name} là ${KIND_LABEL[p.kind] || 'điểm đến'} ở ${p.province}. Nơi đây gắn với ${f}, góp thêm một lớp ký ức cho vùng đất.`,
  (p, f) => `Giữa ${p.region.toLowerCase()}, ${p.name} hiện lên như một khoảng lặng của ${p.province}. Câu chuyện về ${f} vẫn được người địa phương kể lại mỗi mùa lễ hội.`,
  (p, f) => `Đến ${p.name}, du khách không chỉ ngắm cảnh mà còn nghe kể về ${f} – một phần ký ức làm nên bản sắc của ${p.province}.`,
  (p, f) => `${p.name} mang dáng dấp của ${p.province}: bình dị, giàu trầm tích. ${f} là sợi chỉ nối quá khứ với hiện tại của nơi này.`,
  (p, f) => `Ít người biết rằng ${p.name} gắn với ${f}. Đó là lý do nơi này vẫn giữ được vẻ nguyên sơ và câu chuyện riêng giữa ${p.region.toLowerCase()}.`,
];

const OLD_TEXT = (prov) => PROVINCES[prov].old.length ? PROVINCES[prov].old.join(', ') : '';

const finalPlaces = keptRelics.map((p) => {
  const prof = PROVINCES[p.province];
  const salt = hashStr(p.name + p.province);
  const figure = p.figure || prof.figures[salt % prof.figures.length];
  const specialty = prof.specialties[(salt >>> 3) % prof.specialties.length];
  const culture = prof.cultures[(salt >>> 7) % prof.cultures.length];
  const story = p.story || STORY_TEMPLATES[salt % STORY_TEMPLATES.length](p, figure);
  return {
    id: slug(p.name),
    name: p.name,
    province: p.province,
    oldProvince: OLD_TEXT(p.province),
    region: p.region,
    kind: p.kind,
    kindLabel: KIND_LABEL[p.kind] || 'điểm đến',
    fame: Math.max(2, Math.min(10, p.fame)),
    figure,
    specialty,
    culture,
    story,
    area: p.area || '',
    source: p.source,
  };
});

// 5) Sắp xếp: ít người biết -> nổi tiếng, ưu tiên cảnh quan đẹp trong cùng mức
const regionIndex = Object.fromEntries(REGIONS.map((r, i) => [r, i]));
finalPlaces.sort((a, b) => {
  if (a.fame !== b.fame) return a.fame - b.fame;
  const sa = (SCENIC.has(a.kind) ? 1 : 0) + (a.source === 'curated' ? 1 : 0);
  const sb = (SCENIC.has(b.kind) ? 1 : 0) + (b.source === 'curated' ? 1 : 0);
  if (sa !== sb) return sb - sa;
  if (regionIndex[a.region] !== regionIndex[b.region]) return regionIndex[a.region] - regionIndex[b.region];
  return a.name.localeCompare(b.name, 'vi');
});

// 6) ID duy nhất
const usedIds = new Set();
for (const p of finalPlaces) {
  let id = p.id, i = 2;
  while (usedIds.has(id)) id = `${p.id}-${i++}`;
  p.id = id;
  usedIds.add(id);
}

const outDir = path.join(root, '2.Ask_place');
fs.writeFileSync(path.join(outDir, 'places.json'), JSON.stringify(finalPlaces, null, 0));
fs.writeFileSync(path.join(outDir, 'places.data.js'), '/* Auto-generated by build/build-places.mjs */\nwindow.PLACES = ' + JSON.stringify(finalPlaces) + ';\n');

const byFame = {};
const byRegion = {};
const byProv = {};
for (const p of finalPlaces) {
  byFame[p.fame] = (byFame[p.fame] || 0) + 1;
  byRegion[p.region] = (byRegion[p.region] || 0) + 1;
  byProv[p.province] = (byProv[p.province] || 0) + 1;
}
console.log('TỔNG:', finalPlaces.length, 'địa danh');
console.log('Theo mức nổi tiếng:', byFame);
console.log('Theo vùng:', byRegion);
console.log('Theo tỉnh:', byProv);
console.log('ID trùng đã xử lý, file:', path.join(outDir, 'places.json'));
