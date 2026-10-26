// 零依赖构建：content/*.md → dist/。报名状态按上海时间与报名窗口比较，不读手写标签。
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'content';
const OUT = 'dist';
const BRAND = '上海及周边地区半马赛事';
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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

// 上海时间，无夏令时。日期串 2026-11-03T18:00 表示上海当地。
function parseWhen(value, { dateOnlyEnd = false } = {}) {
  if (!value) return null;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/);
  if (!m) throw new Error('时间格式应为 YYYY-MM-DD 或 YYYY-MM-DDTHH:mm：' + value);
  const y = +m[1];
  const mo = +m[2];
  const d = +m[3];
  const hasTime = m[4] != null;
  let hh = hasTime ? +m[4] : 0;
  let mm = hasTime ? +m[5] : 0;
  if (!hasTime && dateOnlyEnd) {
    hh = 23;
    mm = 59;
  }
  return {
    ms: Date.UTC(y, mo - 1, d, hh - 8, mm, 0),
    hasTime,
    label: hasTime ? `${y}年${mo}月${d}日 ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}` : `${y}年${mo}月${d}日`,
    short: hasTime ? `${mo}月${d}日 ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}` : `${mo}月${d}日`,
    dayKey: `${m[1]}-${m[2]}-${m[3]}`,
    dayLabel: `${mo}月${d}日`,
  };
}

function nowShanghai() {
  const raw = process.env.BRIEFING_DATE;
  if (!raw) return { ms: Date.now(), pinned: false };
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?$/);
  if (!m) throw new Error('BRIEFING_DATE 需为 YYYY-MM-DD 或 YYYY-MM-DDTHH:mm');
  const clock = m[2] ? `${m[2]}:${m[3]}` : '12:00';
  const when = parseWhen(`${m[1]}T${clock}`);
  return { ms: when.ms, pinned: true, assumedNoon: !m[2] };
}

function fmtNow(ms) {
  const shifted = new Date(ms + 8 * 3600 * 1000);
  const y = shifted.getUTCFullYear();
  const mo = shifted.getUTCMonth() + 1;
  const d = shifted.getUTCDate();
  const hh = String(shifted.getUTCHours()).padStart(2, '0');
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0');
  return `${y}年${mo}月${d}日 ${hh}:${mm}`;
}

function fmtMast(ms) {
  const shifted = new Date(ms + 8 * 3600 * 1000);
  const y = shifted.getUTCFullYear();
  const mo = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}.${mo}.${d}`;
}

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function cardWhen(start) {
  if (!start) return '日期待公布';
  const shifted = new Date(start.ms + 8 * 3600 * 1000);
  const y = shifted.getUTCFullYear();
  const mo = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  const time = start.hasTime
    ? ` ${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`
    : '';
  return `${y}.${mo}.${d}（${WEEK[shifted.getUTCDay()]}）${time}`;
}

function countdown(race, nowMs) {
  if (race.outcome === 'cancel') return '已取消';
  if (race.outcome === 'off') return '本年度不办';
  if (!race.start) return '日期待公布';
  const day = 86400000;
  const n = Math.floor((race.start.ms + 8 * 3600 * 1000) / day) - Math.floor((nowMs + 8 * 3600 * 1000) / day);
  if (n > 0) return `距开赛 ${n} 天`;
  if (n === 0) return '今日开跑';
  return '已开跑';
}

function assess(race, now) {
  if (race.outcome === 'cancel') return { kind: 'cancel', label: '取消', open: false };
  if (race.outcome === 'off') return { kind: 'cancel', label: '不办', open: false };
  if (!race.regEnd) return { kind: 'pending', label: '待公布', open: false };
  const end = race.closedAt && race.closedAt.ms < race.regEnd.ms ? race.closedAt : race.regEnd;
  if (race.regStart && now < race.regStart.ms) return { kind: 'pending', label: '未开始', open: false };
  if (now <= end.ms) {
    if (!race.entry) return { kind: 'pending', label: '待公布', open: true };
    return { kind: 'open', label: '还能报名', open: true };
  }
  if (race.draw) {
    if (now < race.draw.ms) return { kind: 'draw', label: '待抽签', open: false };
    return { kind: 'drawn', label: '抽签已出', open: false };
  }
  return { kind: 'closed', label: '已截止', open: false };
}

function windowText(race) {
  if (!race.regStart && !race.regEnd) return '报名窗口待公布';
  const a = race.regStart ? race.regStart.short : '待公布';
  const b = race.regEnd ? race.regEnd.short : '待公布';
  const gate = race.gate ? ` · ${race.gate}` : '';
  let s = `${a} – ${b}${gate}`;
  if (race.closedAt && race.regEnd && race.closedAt.ms < race.regEnd.ms) {
    s += `；官网在 ${race.closedAt.short} 前已关窗`;
  }
  return s;
}

function parseRaces(text) {
  const races = [];
  for (const block of text.split(/^### /m).map((s) => s.trim()).filter(Boolean)) {
    for (const rb of block.split(/^#### /m).slice(1)) {
      const j = rb.indexOf('\n');
      const name = (j < 0 ? rb : rb.slice(0, j)).trim();
      const kv = kvLines(j < 0 ? '' : rb.slice(j + 1));
      for (const f of ['place', 'fee', 'summary']) if (!kv[f]) throw new Error(`${name} 缺少 ${f}`);
      if (!kv.start && !kv.outcome) throw new Error(`${name} 需要 start 或 outcome`);
      races.push({
        name,
        id: kv.id || name,
        place: kv.place,
        fee: kv.fee,
        summary: kv.summary,
        gate: kv.gate || '',
        entry: kv.entry || '',
        source: kv.source || '',
        outcome: kv.outcome || '',
        start: parseWhen(kv.start),
        regStart: parseWhen(kv.reg_start),
        regEnd: parseWhen(kv.reg_end),
        draw: parseWhen(kv.draw),
        closedAt: parseWhen(kv.closed_at),
      });
    }
  }
  if (!races.length) throw new Error('没有赛事');
  return races;
}

function page(title, inner) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(BRAND)}。近期半程按开跑日排列，还能报名按上海时间对报名截止自动判断。"><title>${esc(title)}</title><link rel="stylesheet" href="style.css"></head><body>
${inner}
<footer class="wrap foot"><p class="colophon"><span class="rule" aria-hidden="true"></span>数据来源：赛事官网及公开信息<span class="rule" aria-hidden="true"></span></p><p>报名是否开放，用上海时间对每场写死的起止时间自动比较。只写日期的判断时刻按当天 12:00。没有报名链接标「待公布」。报名以组委会最新公告为准。</p></footer></body></html>`;
}

const PIN = '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 1.2a4.3 4.3 0 0 0-4.3 4.3C3.7 9 8 14.8 8 14.8s4.3-5.8 4.3-9.3A4.3 4.3 0 0 0 8 1.2zm0 5.8a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2z"/></svg>';
const CAL = '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4.5 1h1.4v1.6h4.2V1h1.4v1.6H14v11.2H2V2.6h2.5V1zM3.4 6.2v6.2h9.2V6.2H3.4z"/></svg>';

function raceCard(r, nowMs) {
  const link = r.entry
    ? `<a class="go" href="${esc(r.entry)}" target="_blank" rel="noopener">报名入口</a>`
    : (r.source ? `<a class="go" href="${esc(r.source)}" target="_blank" rel="noopener">官方页</a>` : '');
  return `<article class="card ${esc(r.status.kind)}" id="${esc(r.id)}"><div class="card-top"><span class="tag">${esc(r.status.label)}</span><span class="card-date">${esc(cardWhen(r.start))}</span></div><h3>${esc(r.name)}</h3><p class="place">${PIN}${esc(r.place)}</p><dl class="stats"><div><dt>半程</dt><dd>21.0975公里</dd></div><div><dt>费用</dt><dd>${esc(r.fee)}</dd></div><div><dt>报名状态</dt><dd class="st">${esc(r.status.label)}</dd></div></dl><p class="sum">${esc(r.summary)}</p><div class="footline"><p class="win">★ ${esc(windowText(r))}</p><div class="aside"><span class="away">${CAL}${esc(countdown(r, nowMs))}</span>${link}</div></div></article>`;
}

function raceList(races, nowMs) {
  const dated = races.filter((r) => r.start).sort((a, b) => a.start.ms - b.start.ms);
  const rest = races.filter((r) => !r.start);
  return `<div class="grid">${[...dated, ...rest].map((r) => raceCard(r, nowMs)).join('')}</div>`;
}

function shell(active, mastDate, lede, body) {
  const tab = (id, href, text) => `<a href="${href}" class="${active === id ? 'on' : ''}">${text}</a>`;
  return `<header class="mast"><div class="wrap mast-row"><p class="dateline">${mastDate}</p></div>
<h1 class="wrap">${esc(BRAND)}</h1>
<div class="mark" aria-hidden="true"></div>
<nav class="tabs wrap" aria-label="分页">${tab('recent', 'index.html', '近期赛事')}${tab('open', 'open.html', '还能报名')}</nav></header>
<main><div class="wrap sheet"><p class="lede">${lede}</p>${body}</div></main>`;
}

const now = nowShanghai();
const file = fs.readdirSync(SRC).filter((f) => f.endsWith('.md')).sort().at(-1);
if (!file) throw new Error('content/ 里没有赛事数据');
const raw = fs.readFileSync(path.join(SRC, file), 'utf8');
const { fm, body } = frontmatter(raw);
const secs = sections(body);
if (!secs['赛事']) throw new Error('缺少 ## 赛事');
const races = parseRaces(secs['赛事']).map((r) => ({ ...r, status: assess(r, now.ms) }));
const openRaces = races.filter((r) => r.status.open).sort((a, b) => (a.regEnd?.ms || 0) - (b.regEnd?.ms || 0));
const notes = (secs['附注'] || '').split('\n').map((l) => l.trim()).filter(Boolean);
const srcItems = bullets(secs['来源'] || '');
const clock = `${fmtNow(now.ms)}（上海${now.pinned && now.assumedNoon ? '，只给了日期，按 12:00' : ''}）`;
const noteHtml = notes.length ? `<div class="note">${notes.map((n) => `<p>${esc(n)}</p>`).join('')}</div>` : '';
const srcHtml = srcItems.length ? `<h2 class="sec">依据</h2><ul class="srcs">${srcItems.map((x) => `<li>${esc(x).replace(/(https?:\/\/[^\s<，。）)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')}</li>`).join('')}</ul>` : '';

const recent = shell(
  'recent',
  fmtMast(now.ms),
  `${races.length} 场，按开跑日排列。判断时间 ${esc(clock)}。`,
  `${raceList(races, now.ms)}${noteHtml}${srcHtml}`,
);
const openBody = openRaces.length
  ? `${raceList(openRaces, now.ms)}${noteHtml}`
  : `<div class="empty">这个时间点，名单里没有仍处在报名窗口内的半马。</div>`;
const open = shell(
  'open',
  fmtMast(now.ms),
  `报名截止仍晚于 ${esc(clock)} 的半马。没有公开报名链接的标「待公布」。`,
  openBody,
);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'style.css'), fs.readFileSync('src/style.css', 'utf8'));
fs.mkdirSync(path.join(OUT, 'fonts'), { recursive: true });
fs.copyFileSync('src/fonts/ma-shan-zheng.ttf', path.join(OUT, 'fonts/ma-shan-zheng.ttf'));
fs.copyFileSync('src/fonts/OFL.txt', path.join(OUT, 'fonts/OFL.txt'));
fs.writeFileSync(path.join(OUT, 'index.html'), page(BRAND, recent));
fs.writeFileSync(path.join(OUT, 'open.html'), page(`还能报名 · ${BRAND}`, open));
console.log(`构建完成：近期 ${races.length} 场，还能报名 ${openRaces.length} 场，判断时间 ${fmtNow(now.ms)} → ${OUT}/`);
