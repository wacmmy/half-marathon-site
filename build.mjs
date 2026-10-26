// 零依赖构建：读取 content/*.md，生成 dist/ 静态站点
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'content';
const OUT = 'dist';
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const linkify = (s) => esc(s).replace(/(https?:\/\/[^\s<，。）)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

function frontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('缺少 frontmatter');
  const fm = {};
  for (const l of m[1].split('\n')) {
    const i = l.indexOf(':');
    if (i < 0) continue;
    let v = l.slice(i + 1).trim();
    if (v.startsWith('"')) v = JSON.parse(v);
    fm[l.slice(0, i).trim()] = v;
  }
  return { fm, body: m[2].trim() };
}

function kvLines(text) {
  const o = {};
  for (const l of text.split('\n')) {
    const t = l.trim();
    if (!t.startsWith('- ')) continue;
    const s = t.slice(2);
    const i = s.indexOf(':');
    if (i < 0) continue;
    o[s.slice(0, i).trim()] = s.slice(i + 1).trim();
  }
  return o;
}

function sections(body) {
  const map = {};
  for (const p of body.split(/^## /m)) {
    const t = p.trim();
    if (!t) continue;
    const i = t.indexOf('\n');
    const name = (i < 0 ? t : t.slice(0, i)).trim();
    map[name] = (i < 0 ? '' : t.slice(i + 1)).trim();
  }
  return map;
}

function bullets(text) {
  return text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim());
}

function parseSides(text) {
  return text.split(/^### /m).map((s) => s.trim()).filter(Boolean).map((block) => {
    const i = block.indexOf('\n');
    const title = (i < 0 ? block : block.slice(0, i)).trim();
    const kv = kvLines(i < 0 ? '' : block.slice(i + 1));
    if (!kv.text || !kv.href) throw new Error('侧栏缺少 text 或 href: ' + title);
    return { title, ...kv };
  });
}

function parseRaces(text) {
  const groups = text.split(/^### /m).map((s) => s.trim()).filter(Boolean).map((block) => {
    const nl = block.indexOf('\n');
    const head = (nl < 0 ? block : block.slice(0, nl)).trim();
    const rest = nl < 0 ? '' : block.slice(nl + 1);
    const [key, label] = head.split('|').map((x) => x.trim());
    const races = rest.split(/^#### /m).slice(1).map((rb) => {
      const j = rb.indexOf('\n');
      const name = (j < 0 ? rb : rb.slice(0, j)).trim();
      const kv = kvLines(j < 0 ? '' : rb.slice(j + 1));
      for (const f of ['place', 'fee', 'kind', 'status', 'summary']) {
        if (!kv[f]) throw new Error(`${name} 缺少 ${f}`);
      }
      return { name, id: kv.id || name, ...kv };
    });
    if (!races.length) throw new Error('日期组没有赛事: ' + head);
    return { key, label: label || key, races };
  });
  groups.sort((a, b) => {
    const da = /^\d{4}-\d{2}-\d{2}$/.test(a.key);
    const db = /^\d{4}-\d{2}-\d{2}$/.test(b.key);
    if (da && db) return a.key.localeCompare(b.key);
    if (da) return -1;
    if (db) return 1;
    return 0;
  });
  return groups;
}

const fmtDate = (d) => {
  const [y, m, dd] = d.split('-');
  return `${y}年${+m}月${+dd}日`;
};

function page(title, inner, root = '') {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="沪苏杭半程马拉松报名简报。只写核对过的日期、费用和报名状态，未知标待公布。"><title>${esc(title)}</title><link rel="stylesheet" href="${root}style.css"></head><body>
<header class="top"><div class="wrap nav"><a class="brand" href="${root}index.html">半马简报</a><nav>
<a href="${root}index.html">首页</a><a href="${root}index.html#cal">赛事</a></nav></div></header>
<main class="wrap">${inner}</main><footer class="wrap foot">按上海时间整理 · 未知写「待公布」· 报名以组委会最新公告为准</footer></body></html>`;
}

function raceCard(r) {
  const src = r.source
    ? `<a class="read" href="${esc(r.source)}" target="_blank" rel="noopener">依据 →</a>`
    : '<span></span>';
  return `<article class="card" id="${esc(r.id)}"><div class="meta"><span class="tag ${esc(r.kind)}">${esc(r.status)}</span><span class="when">${esc(r.place)}</span></div><h3>${esc(r.name)}</h3><p>${esc(r.summary)}</p><div class="cf"><span>${esc(r.fee)}</span>${src}</div></article>`;
}

function render(issue, { linkTitle = false, root = '' } = {}) {
  const points = bullets(issue.sections['要点'] || '');
  const sides = parseSides(issue.sections['侧栏'] || '');
  const groups = parseRaces(issue.sections['赛事'] || '');
  const notes = (issue.sections['附注'] || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const srcItems = bullets(issue.sections['来源'] || '');
  const h1 = linkTitle
    ? `<a href="${root}p/${issue.slug}.html">${esc(issue.fm.headline)}</a>`
    : esc(issue.fm.headline);
  const sideHtml = sides.map((s) => `<a class="card side ${esc(s.kind || '')}" href="#${esc(s.href)}"><div class="meta"><span class="tag ${esc(s.kind || 'open')}">${esc(s.status || '')}</span><span class="when">${esc(s.kicker || '')}</span></div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><div class="cf"><span>${esc(s.fee || '')}</span><span class="read">查看 →</span></div></a>`).join('');
  const grid = groups.map((g) => `<section class="day"><h2 class="dh">${esc(g.label)}</h2><div class="grid">${g.races.map(raceCard).join('')}</div></section>`).join('');
  const noteHtml = notes.length ? `<div class="note">${notes.map((n) => `<p>${linkify(n)}</p>`).join('')}</div>` : '';
  const srcHtml = srcItems.length ? `<h2 class="sec">依据</h2><ul class="srcs">${srcItems.map((x) => `<li>${linkify(x)}</li>`).join('')}</ul>` : '';
  return `<section class="hero"><div class="kicker">${fmtDate(issue.fm.date)} · 上海</div><h1>${h1}</h1><p class="lede">${esc(issue.fm.lead)}</p>${points.length ? `<div class="points"><div class="ph">要点</div><ul>${points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}</section>
<div class="subs">${sideHtml}</div><h2 class="sec" id="cal">沪苏杭半程</h2>${grid}${noteHtml}${srcHtml}`;
}

function parseFile(file) {
  const raw = fs.readFileSync(path.join(SRC, file), 'utf8');
  const { fm, body } = frontmatter(raw);
  for (const k of ['date', 'headline', 'lead']) if (!fm[k]) throw new Error(`${file} 缺少 ${k}`);
  const secs = sections(body);
  for (const k of ['要点', '侧栏', '赛事']) if (!secs[k]) throw new Error(`${file} 缺少 ## ${k}`);
  return { fm, sections: secs, slug: file.replace(/\.md$/, '') };
}

const posts = fs.readdirSync(SRC).filter((f) => f.endsWith('.md')).map(parseFile)
  .sort((a, b) => b.fm.date.localeCompare(a.fm.date));
if (!posts.length) throw new Error('content/ 里没有简报');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'p'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'style.css'), fs.readFileSync('src/style.css', 'utf8'));

const top = posts[0];
fs.writeFileSync(path.join(OUT, 'index.html'), page('半马简报', render(top, { linkTitle: true })));
for (const p of posts) {
  const inner = render(p) + '<a class="back" href="../index.html">← 返回首页</a>';
  fs.writeFileSync(path.join(OUT, 'p', `${p.slug}.html`), page(`${p.fm.headline} · 半马简报`, inner, '../'));
}
const n = parseRaces(top.sections['赛事']).reduce((sum, g) => sum + g.races.length, 0);
console.log(`构建完成：${posts.length} 期，${n} 场 → ${OUT}/`);
