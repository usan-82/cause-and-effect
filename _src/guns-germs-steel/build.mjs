// 『총, 균, 쇠』 크게 읽기 — book.md·lecture.md 를 ko/guns-germs-steel/ 의 HTML 쪽들로 만든다.
// 의존성 없음: node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../ko/guns-germs-steel');
const CSS = fs.readFileSync(path.join(HERE, 'style.css'), 'utf8');
const JS = fs.readFileSync(path.join(HERE, 'page.js'), 'utf8');

const BOOKS = [
  { key: 'lecture', name: '강연 정리', file: 'lecture.md' },
  { key: 'book', name: '책 정리', file: 'book.md' },
];

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = s => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
    const ext = /^https?:/.test(u.replace(/&amp;/g, '&'));
    return `<a href="${u}"${ext ? ' rel="noopener"' : ''}>${t}</a>`;
  });

// ── 쪽 나누기 ─────────────────────────────────────────────
function parsePages(md) {
  const pages = [];
  let cur = null;
  for (const line of md.split('\n')) {
    const h = line.match(/^# (.+)$/);
    if (h) { cur = { title: h[1].trim(), meta: {}, lines: [] }; pages.push(cur); continue; }
    if (!cur) continue;
    const m = line.match(/^@@(\w+) (.+)$/);
    if (m) { cur.meta[m[1]] = m[2].trim(); continue; }
    cur.lines.push(line);
  }
  for (const p of pages) if (!p.meta.id) throw new Error(`@@id 없음: ${p.title}`);
  return pages;
}

// ── 블록 ──────────────────────────────────────────────────
const SPEAKER = { '설민석': 'host', '민지': 'kid', '현무': 'panel', '이적': 'panel', '패널': 'panel' };

function renderBlocks(lines) {
  const out = [];
  let i = 0;
  const para = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para.length = 0; } };
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { flushPara(); i++; continue; }
    const fence = line.match(/^:::(\w+)\s*(.*)$/);
    if (fence) {
      flushPara();
      const body = [];
      i++;
      let depth = 0;
      while (i < lines.length) {
        if (/^:::\w/.test(lines[i])) depth++;
        else if (lines[i].trim() === ':::') { if (depth === 0) break; depth--; }
        body.push(lines[i]); i++;
      }
      i++;
      out.push(renderFence(fence[1], fence[2].trim(), body));
      continue;
    }
    let m;
    if ((m = line.match(/^(#{2,3}) (.+)$/))) { flushPara(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); i++; continue; }
    if ((m = line.match(/^@(\S+) (.+)$/))) {
      flushPara();
      const who = m[1];
      const base = who.replace(/\(.*$/, '');
      const cls = SPEAKER[base] ?? 'panel';
      const label = who.replace(/\((.+)\)$/, ' <small>($1)</small>');
      out.push(`<div class="say ${cls}"><div class="who">${label}</div><p>${inline(m[2])}</p></div>`);
      i++; continue;
    }
    if (/^> /.test(line)) {
      flushPara();
      const q = [];
      while (i < lines.length && /^> ?/.test(lines[i])) { q.push(lines[i].replace(/^> ?/, '')); i++; }
      out.push(`<div class="note">${q.filter(Boolean).map(t => `<p>${inline(t)}</p>`).join('')}</div>`);
      continue;
    }
    if (/^- /.test(line) || /^\d+\. /.test(line)) {
      flushPara();
      const ordered = /^\d+\. /.test(line);
      const items = [];
      while (i < lines.length && (ordered ? /^\d+\. /.test(lines[i]) : /^- /.test(lines[i]))) {
        items.push(lines[i].replace(ordered ? /^\d+\. / : /^- /, '')); i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map(t => `<li>${inline(t)}</li>`).join('')}</${tag}>`);
      continue;
    }
    para.push(line.trim()); i++;
  }
  flushPara();
  return out.join('\n');
}

function renderFence(kind, arg, body) {
  const lines = body.filter(l => l.trim());
  switch (kind) {
    case 'word':
      return `<aside class="words"><div class="box-t">낱말 풀이</div><dl>${lines.map(l => {
        const k = l.indexOf(': ');
        return `<dt>${inline(l.slice(0, k))}</dt><dd>${inline(l.slice(k + 2))}</dd>`;
      }).join('')}</dl></aside>`;
    case 'think':
      return `<aside class="think"><div class="box-t">생각해 볼 질문</div><ul>${lines.map(l => `<li>${inline(l.replace(/^- /, ''))}</li>`).join('')}</ul></aside>`;
    case 'flow': {
      const steps = [];
      for (const l of lines) {
        if (/^\s+- /.test(l)) steps[steps.length - 1].sub.push(l.replace(/^\s+- /, ''));
        else steps.push({ t: l.trim(), sub: [] });
      }
      return `<figure class="flow">${arg ? `<figcaption>${inline(arg)}</figcaption>` : ''}<ol>${steps.map(s => {
        const hi = s.t.startsWith('!') ? ' class="hi"' : '';
        const t = s.t.replace(/^!/, '');
        return `<li${hi}>${inline(t)}${s.sub.length ? `<ul>${s.sub.map(x => `<li>${inline(x)}</li>`).join('')}</ul>` : ''}</li>`;
      }).join('')}</ol></figure>`;
    }
    case 'bars': {
      const rows = lines.map(l => l.split('|').map(s => s.trim()));
      const max = Math.max(...rows.map(r => Number(r[1])));
      return `<figure class="bars">${arg ? `<figcaption>${inline(arg)}</figcaption>` : ''}${rows.map(([label, v, note]) => {
        const w = Math.max(0.6, (Number(v) / max) * 100);
        return `<div class="bar"><div class="bar-l">${inline(label)}</div><div class="bar-t"><span style="width:${w.toFixed(2)}%"></span></div>${note ? `<div class="bar-n">${inline(note)}</div>` : ''}</div>`;
      }).join('')}</figure>`;
    }
    case 'map':
      return MAP;
    case 'card':
      return `<section class="card"><h3>${inline(arg)}</h3>${renderBlocks(body)}</section>`;
    case 'details':
      return `<details><summary>${inline(arg)}</summary>${renderBlocks(body)}</details>`;
    default:
      throw new Error(`모르는 블록: ${kind}`);
  }
}

// 대륙 모양 그림: 가로로 긴 유라시아, 세로로 긴 아메리카·아프리카
const MAP = `<figure class="map"><svg viewBox="0 0 360 320" role="img" aria-label="유라시아는 가로로 길고 아메리카와 아프리카는 세로로 길다">
<line x1="0" y1="82" x2="360" y2="82" class="lat"/><line x1="0" y1="170" x2="360" y2="170" class="lat"/><line x1="0" y1="258" x2="360" y2="258" class="lat"/>
<text x="235" y="20" class="cap">가로로 길다</text>
<path d="M128 40 H342 M136 33 L128 40 L136 47 M334 33 L342 40 L334 47" class="arw"/>
<rect x="120" y="52" width="230" height="62" rx="18" class="land"/>
<text x="235" y="84" class="lb">유라시아</text>
<rect x="14" y="52" width="66" height="256" rx="18" class="land"/>
<text x="47" y="140" class="lb">아</text><text x="47" y="170" class="lb">메</text><text x="47" y="200" class="lb">리</text><text x="47" y="230" class="lb">카</text>
<rect x="138" y="128" width="66" height="180" rx="18" class="land"/>
<text x="171" y="180" class="lb">아</text><text x="171" y="210" class="lb">프</text><text x="171" y="240" class="lb">리</text><text x="171" y="270" class="lb">카</text>
<path d="M226 134 V302 M219 142 L226 134 L233 142 M219 294 L226 302 L233 294" class="arw"/>
<text x="290" y="205" class="cap">세로로</text><text x="290" y="232" class="cap">길다</text>
</svg><figcaption>점선은 위도입니다. 유라시아는 <strong>가로로 길어</strong> 같은 위도를 따라 퍼지고, 아메리카와 아프리카는 <strong>세로로 길어</strong> 위도가 계속 바뀝니다.</figcaption></figure>`;

// ── 쪽 틀 ─────────────────────────────────────────────────
const SITE = '『총, 균, 쇠』 크게 읽기';
function shell({ title, desc, body, bookKey = '', pageId = '' }) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta name="theme-color" content="#fbf8f1">
<style>${CSS}</style>
<script>${JS}</script>
</head>
<body data-book="${bookKey}" data-page="${pageId}">
<header class="topbar">
  <a class="home" href="./">처음 화면</a>
  <span class="size"><button type="button" data-size="-1" aria-label="글자 작게">가<small>−</small></button><button type="button" data-size="1" aria-label="글자 크게">가<b>+</b></button></span>
</header>
<main>
${body}
</main>
</body>
</html>
`;
}

const short = t => t.split(' — ')[0];
function titleHtml(t) {
  const [a, ...b] = t.split(' — ');
  return `<h1>${inline(a)}${b.length ? `<span class="sub">${inline(b.join(' — '))}</span>` : ''}</h1>`;
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));

const toc = {};
for (const [bi, b] of BOOKS.entries()) {
  const pages = parsePages(fs.readFileSync(path.join(HERE, b.file), 'utf8'));
  toc[b.key] = pages.map(p => ({ href: `${b.key}-${p.meta.id}.html`, label: short(p.title) }));
  pages.forEach((p, i) => {
    const href = toc[b.key][i].href;
    const prev = pages[i - 1] ? toc[b.key][i - 1] : null;
    const next = pages[i + 1] ? toc[b.key][i + 1] : null;
    const other = BOOKS[bi + 1];
    let nextBtn;
    if (next) nextBtn = `<a class="btn next" href="${next.href}">다음 쪽 →<span>${esc(next.label)}</span></a>`;
    else if (other) nextBtn = `<a class="btn next" href="${other.key}-intro.html">다 읽었어요<span>이제 ${other.name}로 넘어가기</span></a>`;
    else nextBtn = `<a class="btn next" href="./">다 읽었어요<span>처음 화면으로</span></a>`;
    const body = `<p class="where">${b.name} · <b>${i + 1}</b> / ${pages.length}</p>
${titleHtml(p.title)}
${p.meta.where ? `<p class="from">${inline(p.meta.where)}</p>` : ''}
${renderBlocks(p.lines)}
<nav class="pager">
${nextBtn}
${prev ? `<a class="btn prev" href="${prev.href}">← 앞 쪽<span>${esc(prev.label)}</span></a>` : `<a class="btn prev" href="./">← 처음 화면</a>`}
</nav>`;
    const desc = p.meta.desc ?? `${SITE} — ${b.name} ${i + 1}/${pages.length}`;
    fs.writeFileSync(path.join(OUT, href), shell({ title: `${short(p.title)} · ${b.name} · ${SITE}`, desc, body, bookKey: b.key, pageId: href }));
  });
}

// ── 처음 화면 ─────────────────────────────────────────────
const index = fs.readFileSync(path.join(HERE, 'index.md'), 'utf8');
const [introMd, ...cards] = index.split(/\n(?=:::entry )/);
const entry = cards.map(c => {
  const [, key, title] = c.match(/^:::entry (\w+) (.+)/);
  const inner = c.split('\n').slice(1).filter(l => l.trim() !== ':::');
  return `<section class="entry">
<h2>${inline(title)}</h2>
${renderBlocks(inner)}
<a class="btn next" href="${key}-intro.html">읽기 시작<span>${esc(toc[key][0].label)}부터</span></a>
<details><summary>차례 보기 (${toc[key].length}쪽)</summary><ol class="toc">${toc[key].map(t => `<li><a href="${t.href}">${esc(t.label)}</a></li>`).join('')}</ol></details>
</section>`;
}).join('\n');
const introLines = introMd.split('\n');
const h1 = introLines.find(l => l.startsWith('# ')).slice(2);
const desc = introLines.find(l => l.startsWith('@@desc ')).slice(7);
const body = `${titleHtml(h1)}
<div id="resume" hidden></div>
${renderBlocks(introLines.filter(l => !l.startsWith('# ') && !l.startsWith('@@')))}
${entry}`;
fs.writeFileSync(path.join(OUT, 'index.html'), shell({ title: SITE, desc, body }).replace('<a class="home" href="./">처음 화면</a>', '<span class="home"></span>'));
console.log('ok', Object.entries(toc).map(([k, v]) => `${k} ${v.length}쪽`).join(', '));
