import fs from 'node:fs';

const raw = JSON.parse(fs.readFileSync(new URL('../raw/relics.json', import.meta.url), 'utf8'));
let text = raw.parse.wikitext;

const clean = (s) => {
  s = s.replace(/<ref[^>]*\/>/g, '');
  s = s.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '');
  s = s.replace(/\{\{[\s\S]*?\}\}/g, '');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  s = s.replace(/\[\[([^\]]+)\]\]/g, '$1');
  s = s.replace(/'{2,}/g, '');
  s = s.replace(/&nbsp;/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
};

const lines = text.split('\n');
let region = '';
let province = '';
const rows = [];
for (const line of lines) {
  const h2 = line.match(/^==([^=].*?)==\s*$/);
  const h3 = line.match(/^===([^=].*?)===\s*$/);
  if (h3) { province = h3[1].trim(); continue; }
  if (h2) {
    const title = h2[1].replace(/\(.*?\)/g, '').trim();
    if (title === 'Thủ đô Hà Nội') { province = 'Hà Nội'; region = 'Đồng bằng sông Hồng'; continue; }
    region = title; province = ''; continue;
  }
  if (!line.startsWith('|') || line.startsWith('|-') || line.startsWith('|}') || line.startsWith('|+')) continue;
  let parts = line.slice(1).split('||').map(clean);
  if (parts.length < 3) {
    parts = line.slice(1).split(/\s\|\s?/).map(clean);
  }
  const name = parts[0]?.replace(/^\|\s*/, '').trim();
  if (!name || name.length > 120) continue;
  const area = parts[1] || '';
  const cls = parts[2] || '';
  const year = (parts[3] || '').match(/\d{4}/)?.[0] || '';
  if (!province) continue;
  rows.push({ name, area, cls, year, province, region });
}
console.log('ROWS', rows.length);
const byProv = {};
for (const r of rows) byProv[r.province] = (byProv[r.province] || 0) + 1;
console.log(byProv);
const cls = {};
for (const r of rows) cls[r.cls] = (cls[r.cls] || 0) + 1;
console.log(Object.entries(cls).sort((a,b)=>b[1]-a[1]).slice(0,25));
console.log(rows.slice(0,8));
fs.writeFileSync(new URL('../raw/relics-parsed.json', import.meta.url), JSON.stringify(rows, null, 1));
