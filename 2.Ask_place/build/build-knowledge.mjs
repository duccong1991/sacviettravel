// Sinh dữ liệu tri thức cho tab "Tri thức" của Sắc Việt.
// Nguồn: data/province-profiles.mjs (34 tỉnh sau sáp nhập) + mốc lịch sử biên soạn tay.
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROVINCES, REGIONS } from '../data/province-profiles.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../../3.Main_game/js/knowledge-data.js');

const REGION_KEYS = {
  'Miền núi phía Bắc': 'mien-nui-bac',
  'Đồng bằng Bắc Bộ': 'dong-bang-bac-bo',
  'Bắc Trung Bộ': 'bac-trung-bo',
  'Nam Trung Bộ & Tây Nguyên': 'nam-trung-tay-nguyen',
  'Đông Nam Bộ': 'dong-nam-bo',
  'Đồng bằng sông Cửu Long': 'dong-bang-song-cuu-long',
};

const HISTORY = [
  ['Chiến thắng Điện Biên Phủ', 'Điện Biên'],
  ['Hang Pác Bó', 'Cao Bằng'],
  ['Đình Tân Trào', 'Tuyên Quang'],
  ['Ải Chi Lăng', 'Lạng Sơn'],
  ['Nhà tù Sơn La', 'Sơn La'],
  ['Khu di tích Đền Hùng', 'Phú Thọ'],

  ['Hoàng thành Thăng Long', 'Hà Nội'],
  ['Cố đô Hoa Lư', 'Ninh Bình'],
  ['Chiến thắng Bạch Đằng', 'Quảng Ninh'],
  ['Phố Hiến', 'Hưng Yên'],
  ['Văn Miếu – Quốc Tử Giám', 'Hà Nội'],
  ['Chùa Dâu', 'Bắc Ninh'],

  ['Quần thể di tích Cố đô Huế', 'Huế'],
  ['Lam Kinh', 'Thanh Hóa'],
  ['Quê nội Chủ tịch Hồ Chí Minh', 'Nghệ An'],
  ['Khu lưu niệm Nguyễn Du', 'Hà Tĩnh'],
  ['Thành cổ Quảng Trị', 'Quảng Trị'],
  ['Địa đạo Vịnh Mốc', 'Quảng Trị'],

  ['Thánh địa Mỹ Sơn', 'Đà Nẵng'],
  ['Phố cổ Hội An', 'Đà Nẵng'],
  ['Tháp Bà Ponagar', 'Khánh Hòa'],
  ['Tháp Po Klong Garai', 'Khánh Hòa'],
  ['Chiến thắng Buôn Ma Thuột', 'Đắk Lắk'],
  ['Văn hóa Sa Huỳnh', 'Quảng Ngãi'],

  ['Địa đạo Củ Chi', 'TP. Hồ Chí Minh'],
  ['Dinh Độc Lập', 'TP. Hồ Chí Minh'],
  ['Bến Nhà Rồng', 'TP. Hồ Chí Minh'],
  ['Chiến khu D', 'Đồng Nai'],
  ['Căn cứ Tà Thiết', 'Đồng Nai'],
  ['Núi Bà Đen', 'Tây Ninh'],

  ['Văn hóa Óc Eo', 'An Giang'],
  ['Khu căn cứ Tức Dụp', 'An Giang'],
  ['Nhà tù Phú Quốc', 'An Giang'],
  ['Chợ nổi Cái Răng', 'Cần Thơ'],
  ['Chùa Dơi', 'Cần Thơ'],
  ['Khu di tích Gò Tháp', 'Đồng Tháp'],
];

const regions = REGIONS.map((name) => {
  const rows = Object.entries(PROVINCES)
    .filter(([, p]) => p.region === name)
    .map(([province, p]) => ({
      name: province,
      terrain: p.terrain,
      old: p.old.slice(),
      specialties: p.specialties.slice(),
      cultures: p.cultures.slice(),
      figures: p.figures.slice(),
    }));
  return { key: REGION_KEYS[name], name, provinces: rows };
});

const payload = {
  generated: '2026-11-14',
  source: 'province-profiles.mjs + biên soạn lịch sử',
  regions,
  history: HISTORY.map(([label, province]) => ({ label, province })),
};

const header = `/* Sắc Việt – dữ liệu tri thức vùng miền (sinh tự động, đừng sửa tay).
   Nguồn: 34 tỉnh sau sáp nhập 01/7/2025 + mốc lịch sử biên soạn. */\n`;
writeFileSync(out, header + 'window.KNOWLEDGE_DATA = ' + JSON.stringify(payload) + ';\n', 'utf8');

console.log(`Wrote ${out}`);
console.log(`regions: ${regions.length}, provinces: ${regions.reduce((n, r) => n + r.provinces.length, 0)}, history: ${payload.history.length}`);
