// 패권의 지도, 쉽게 읽기 — {ko,en,id}/hegemony/atlas-simple/ 생성
// 지도는 패권의 지도(hegemony/atlas)의 빌드 결과를 읽어, 장마다 주인공 나라는 나라별로 하나씩, 나머지 땅은 하나로 합친다.
// 사용: node build.mjs [언어...]   (언어를 주지 않으면 세 언어 모두)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as tc from 'topojson-client';
import * as ts from 'topojson-server';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const ATLAS_SRC = path.resolve(HERE, '../atlas');
const ATLAS_OUT = path.join(ROOT, 'ko/hegemony/atlas'); // 지도 데이터는 언어와 무관(세 언어 모두 같은 파일)
const LANGS = [['ko', '한국어'], ['en', 'English'], ['id', 'Bahasa Indonesia']];
const ONLY = process.argv.slice(2);
const KEYS = ['gb','fr','es','pt','nl','ru','ot','cn','us','de','at','jp','it','be','mg'];

const J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const struct = J(path.join(HERE, 'struct.json'));
const css = fs.readFileSync(path.join(HERE, 'style.css'), 'utf8');
const tpl = fs.readFileSync(path.join(HERE, 'template.html'), 'utf8');

// ---------- 지도 데이터 ----------
function buildMaps(years, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const ch of struct.chapters) {
    if (!years.includes(ch.year)) continue;
    const topo = J(path.join(ATLAS_OUT, 'data', `${ch.year}.json`));
    const geoms = topo.objects.w.geometries;
    const feats = [];
    for (const k of ch.stars) {
      const g = geoms.filter(x => x.properties.p === k);
      if (!g.length) throw new Error(`${ch.year}: 주인공 ${k}가 지도에 없음`);
      feats.push({ type: 'Feature', properties: { k }, geometry: tc.merge(topo, g) });
    }
    const rest = geoms.filter(x => !ch.stars.includes(x.properties.p));
    feats.push({ type: 'Feature', properties: { k: null }, geometry: tc.merge(topo, rest) });
    const out = ts.topology({ w: { type: 'FeatureCollection', features: feats } }, 1e5);
    fs.writeFileSync(path.join(outDir, `${ch.year}.json`), JSON.stringify(out));
  }
}

// ---------- 글 검사 ----------
function sentences(s) { return s.split(/(?<=[.!?。])\s+/).map(x => x.trim()).filter(Boolean); }
function check(lang, txt, pg) {
  const errs = [];
  const unit = pg.sentenceUnit || 'char'; // ko: 글자 수, en·id: 낱말 수
  const len = s => unit === 'word' ? s.split(/\s+/).length : [...s.replace(/\[[^\]]*\]/g, '')].length;
  for (const ch of struct.chapters) {
    const c = txt.chapters[ch.year];
    if (!c) { errs.push(`${ch.year}: 글 없음`); continue; }
    const where = `${lang} ${ch.year}`;
    for (const f of ['title', 'sum', 'why', 'stars', 'words']) if (!c[f]) errs.push(`${where}: ${f} 없음`);
    if (!c.why || c.why.length !== 3) errs.push(`${where}: why는 3단계여야 함`);
    const sk = Object.keys(c.stars || {});
    if (sk.join() !== ch.stars.join()) errs.push(`${where}: stars 키(${sk}) ≠ struct(${ch.stars})`);
    const texts = [c.sum, ...(c.why || []), ...Object.values(c.stars || {})];
    for (const t of texts) for (const s of sentences(t))
      if (len(s) > pg.maxSentence) errs.push(`${where}: 문장이 김(${len(s)}>${pg.maxSentence}) — ${s}`);
    const yrs = new Set(texts.join(' ').match(/(?<!\d)1\d{3}(?!\d)|(?<!\d)20\d{2}(?!\d)/g) || []);
    if (yrs.size > pg.maxYears) errs.push(`${where}: 연도가 많음(${[...yrs].join(', ')})`);
    const words = new Set((c.words || []).map(w => w[0]));
    const all = texts.join(' ');
    for (const term of pg.explain || []) {
      const re = new RegExp(unit === 'word' ? `\\b${term}\\b` : `(^|[^가-힣])${term}`, unit === 'word' ? 'i' : '');
      if (re.test(all) && !words.has(term)) errs.push(`${where}: '${term}' 낱말 풀이 필요`);
    }
  }
  return errs;
}

// ---------- 페이지 ----------
let failed = false;
const langs = LANGS.filter(([l]) => !ONLY.length || ONLY.includes(l));
const ready = LANGS.filter(([l]) => fs.existsSync(path.join(HERE, `${l}.json`)));
for (const [lang] of langs) {
  const txtFile = path.join(HERE, `${lang}.json`);
  if (!fs.existsSync(txtFile)) { console.log(`${lang}: 글 파일 없음 — 건너뜀`); continue; }
  const txt = J(txtFile), pg = J(path.join(HERE, `${lang}.page.json`)), at = J(path.join(ATLAS_SRC, `${lang}.json`));
  const errs = check(lang, txt, pg);
  const done = struct.chapters.filter(ch => txt.chapters[ch.year]);
  if (errs.length) {
    const fatal = errs.filter(e => !/글 없음$/.test(e));
    for (const e of errs) console.log((/글 없음$/.test(e) ? '  · ' : '  ✗ ') + e);
    if (fatal.length) { failed = true; continue; }
  }
  const outDir = path.join(ROOT, lang, 'hegemony/atlas-simple');
  buildMaps(done.map(c => c.year), path.join(outDir, 'data'));
  fs.mkdirSync(path.join(outDir, 'lib'), { recursive: true });
  for (const f of ['d3.min.js', 'topojson-client.min.js'])
    fs.copyFileSync(path.join(ATLAS_OUT, 'lib', f), path.join(outDir, 'lib', f));
  const content = {
    chapters: done.map(ch => ({ ...ch, ...txt.chapters[ch.year] })),
    short: at.short, full: at.full,
  };
  const langNav = ready.map(([c, n]) => c === lang ? `<span aria-current="page">${esc(n)}</span>`
    : `<a href="../../../${c}/hegemony/atlas-simple/" hreflang="${c}" lang="${c}">${esc(n)}</a>`).join('');
  const data = JSON.stringify({ ui: pg.ui, content, keys: KEYS }).replace(/</g, '\\u003c');
  let html = tpl.replace('{{css}}', css.replace(/\{\{(\w+)\}\}/g, (_, k) => pg[k] ?? ''))
    .replace('{{langs}}', langNav).replace('{{data}}', data);
  html = html.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (k === 'footHtml' || k === 'fontLink') return pg[k];
    if (pg[k] != null) return esc(pg[k]);
    if (pg.ui[k] != null) return esc(pg.ui[k]);
    throw new Error(`${lang}: 문구 ${k} 없음`);
  });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  console.log(`${lang}: ${done.length}/${struct.chapters.length}장 → ${path.relative(ROOT, outDir)}`);
}
if (failed) { console.error('검사 실패'); process.exit(1); }
