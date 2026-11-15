import fs from 'node:fs';
const places = JSON.parse(fs.readFileSync(new URL('../places.json', import.meta.url), 'utf8'));
const uniq = (k) => [...new Set(places.map(p => p[k]).filter(Boolean))];
const groups = { specialty: uniq('specialty'), culture: uniq('culture'), province: uniq('province'), figure: uniq('figure') };
const api = 'https://vi.wikipedia.org/w/api.php';
async function query(list) {
  const url = `${api}?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=800&redirects=1&titles=${encodeURIComponent(list.join('|'))}`;
  const res = await fetch(url); const j = await res.json();
  const out = {};
  for (const p of Object.values(j.query?.pages || {})) if (p.thumbnail) out[p.title] = p.thumbnail.source;
  return out;
}
for (const [k, list] of Object.entries(groups)) {
  let hit = 0; const misses = [];
  for (let i = 0; i < list.length; i += 40) {
    const map = await query(list.slice(i, i + 40));
    for (const t of list.slice(i, i + 40)) { if (map[t]) hit++; else misses.push(t); }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(k, list.length, 'hit', hit, (100 * hit / list.length).toFixed(0) + '%');
  console.log('  miss sample:', misses.slice(0, 8));
}
