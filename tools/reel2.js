// Sport Signal animated Reel renderer (native 9:16, motion from frame 0).
// Usage: NODE_PATH=$(npm root -g) node tools/reel2.js spec.json out.mp4
// spec: {fps?:30, c1?, c2?, scenes:[...]}  scene types:
//  hook     {lines:["DALLAS HAD A","71.9% CHANCE."], accent:1, dur:1.6, kicker?:"WEEK 9"}
//  stat     {big:"33-30", label:"CARDINALS WIN IN DALLAS", team?:{abbr,c1,c2}, dur:1.8}   (numbers count up)
//  versus   {top:"THURSDAY NIGHT", left:{abbr,name,c1,c2,sub}, right:{...}, dur:2.0}
//  list     {title:"WEEK 9 IN 5", rows:[{tag:{abbr,c1,c2}, text, kicker}], dur:2.6}
//  question {lines:["MOST","IMPRESSIVE?"], options:["A ...","B ..."], dur:2.2}
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const outFile = process.argv[3] || 'reel.mp4';
const fps = spec.fps || 30;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}html,body{width:1080px;height:1920px;overflow:hidden;background:#05070d}
body{font-family:"DejaVu Sans Condensed","DejaVu Sans";color:#fff}
#bg{position:absolute;inset:-80px;transition:none}
#noise{position:absolute;inset:0;opacity:.18;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
#flash{position:absolute;inset:0;background:#d7ff3a;opacity:0;mix-blend-mode:screen}
.scene{position:absolute;left:0;top:0;width:1080px;height:1920px;display:none}
.mark{position:absolute;left:60px;top:150px;font:italic 700 34px/1 "DejaVu Sans Condensed";letter-spacing:1px;opacity:.85}.mark b{color:#d7ff3a}
.kick{display:inline-block;background:#d7ff3a;color:#05070c;font:italic 700 46px/1 "DejaVu Sans Condensed";padding:12px 26px;transform:skewX(-12deg);letter-spacing:2px}
.huge{font:italic 700 170px/.95 "DejaVu Sans Condensed";letter-spacing:-6px;white-space:nowrap;text-transform:uppercase;text-shadow:0 10px 0 #000a}
.huge b{color:#d7ff3a}
.center{position:absolute;left:60px;right:60px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:30px;padding-bottom:180px}
.big{font:italic 700 330px/.9 "DejaVu Sans Condensed";letter-spacing:-14px;color:#d7ff3a;text-shadow:0 14px 0 #000b}
.lab{font:700 64px/1.05 "DejaVu Sans Condensed";text-transform:uppercase;letter-spacing:-1px}
.tag{display:inline-grid;place-items:center;font:700 64px/1 "DejaVu Sans Condensed";color:#fff;clip-path:polygon(12% 0,100% 0,88% 100%,0 100%);width:190px;height:130px}
.vs{display:flex;width:100%;justify-content:space-between;align-items:center}
.side{text-align:center;width:420px}.side .nm{font:700 70px/1 "DejaVu Sans Condensed";margin-top:20px;text-transform:uppercase}.side .sb{font:700 40px/1 "DejaVu Sans";color:#d7ff3a;margin-top:16px}
.at{font:italic 700 120px/1 "DejaVu Sans Condensed";color:#d7ff3a}
.row{display:flex;align-items:center;gap:26px;width:100%;padding:22px 28px;background:linear-gradient(90deg,#ffffff1c,#0000);border-left:10px solid #d7ff3a}
.row .tag{width:120px;height:86px;font-size:40px}.row .tx{flex:1;font:700 54px/1.05 "DejaVu Sans Condensed";text-transform:uppercase;white-space:nowrap}.row .k{font:italic 700 66px/1 "DejaVu Sans Condensed";color:#d7ff3a}
.opt{display:flex;align-items:center;gap:24px;width:100%;padding:24px 30px;border:3px solid #ffffff40;background:#0007;font:700 60px/1 "DejaVu Sans Condensed";text-transform:uppercase}
.opt b{background:#d7ff3a;color:#05070c;width:76px;height:76px;display:grid;place-items:center}
.cta{font:700 46px/1 "DejaVu Sans";letter-spacing:6px;color:#d7ff3a}
</style></head><body><div id="bg"></div><div id="noise"></div><div id="flash"></div><div id="stage"></div>
<div class="mark">SPORT<b>.</b>SIGNAL</div></body></html>`;

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tagH = t => `<span class="tag" style="background:${t.c1};box-shadow:inset 0 -14px 0 ${t.c2}">${esc(t.abbr)}</span>`;
function sceneHTML(s, i) {
  const id = `s${i}`;
  if (s.type === 'hook') return `<div class="scene" id="${id}"><div class="center">${s.kicker ? `<span class="kick el">${esc(s.kicker)}</span>` : ''}${s.lines.map((l, j) => `<div class="huge el" data-fit>${j === s.accent ? `<b>${esc(l)}</b>` : esc(l)}</div>`).join('')}</div></div>`;
  if (s.type === 'stat') return `<div class="scene" id="${id}"><div class="center">${s.team ? `<span class="el">${tagH(s.team)}</span>` : ''}<div class="big el" data-count="${esc(s.big)}" data-fit>${esc(s.big)}</div><div class="lab el">${esc(s.label)}</div></div></div>`;
  if (s.type === 'versus') return `<div class="scene" id="${id}"><div class="center" style="align-items:center">${s.top ? `<span class="kick el">${esc(s.top)}</span>` : ''}<div class="vs"><div class="side el">${tagH(s.left)}<div class="nm">${esc(s.left.name)}</div>${s.left.sub ? `<div class="sb">${esc(s.left.sub)}</div>` : ''}</div><div class="at el">VS</div><div class="side el">${tagH(s.right)}<div class="nm">${esc(s.right.name)}</div>${s.right.sub ? `<div class="sb">${esc(s.right.sub)}</div>` : ''}</div></div>${s.bottom ? `<div class="lab el" style="text-align:center">${esc(s.bottom)}</div>` : ''}</div></div>`;
  if (s.type === 'list') return `<div class="scene" id="${id}"><div class="center" style="gap:22px"><div class="huge el" style="font-size:110px" data-fit>${esc(s.title)}</div>${s.rows.map(r => `<div class="row el">${r.tag ? tagH(r.tag) : ''}<div class="tx" data-fit>${esc(r.text)}</div>${r.kicker ? `<div class="k">${esc(r.kicker)}</div>` : ''}</div>`).join('')}</div></div>`;
  if (s.type === 'question') return `<div class="scene" id="${id}"><div class="center" style="gap:24px">${s.lines.map(l => `<div class="huge el" style="font-size:140px" data-fit>${esc(l)}</div>`).join('')}${(s.options || []).map((o, j) => `<div class="opt el"><b>${'ABCD'[j]}</b><span data-fit style="flex:1;white-space:nowrap">${esc(o)}</span></div>`).join('')}<div class="cta el">${esc(s.cta || 'COMMENT BELOW 👇')}</div></div></div>`;
  throw new Error('unknown scene ' + s.type);
}
const scenes = spec.scenes; let t0 = 0; const starts = scenes.map(s => { const a = t0; t0 += s.dur; return a; }); const total = t0;

(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(html);
  await p.evaluate(({ inner, scenes, starts, c1, c2 }) => {
    document.getElementById('stage').innerHTML = inner;
    document.querySelectorAll('.scene').forEach(sc => { sc.style.display = 'block'; sc.querySelectorAll('[data-fit]').forEach(e => { if (!e.closest('.opt') && !e.closest('.row')) e.style.display = 'block'; let f = parseFloat(getComputedStyle(e).fontSize); const par = e.parentElement; while (e.scrollWidth > (par.clientWidth || 960) - 4 && f > 24) { f -= 3; e.style.fontSize = f + 'px'; } }); sc.style.display = 'none'; });
    const ease = x => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
    window.setT = t => {
      let cur = 0; for (let i = 0; i < starts.length; i++) if (t >= starts[i]) cur = i;
      const s = scenes[cur], lt = t - starts[cur], el = document.getElementById('s' + cur);
      document.querySelectorAll('.scene').forEach(x => x.style.display = 'none'); el.style.display = 'block';
      const a = (s.team && s.team.c1) || (s.left && s.left.c1) || c1, z = (s.right && s.right.c1) || c2;
      document.getElementById('bg').style.background = `radial-gradient(ellipse 70% 45% at 30% 30%, ${a}cc, transparent 70%), radial-gradient(ellipse 60% 45% at 80% 75%, ${z}99, transparent 70%), linear-gradient(170deg,#0b1226,#05070d 70%)`;
      document.getElementById('bg').style.transform = `scale(${1 + 0.04 * (lt / s.dur)}) rotate(${0.4 * Math.sin(t * 2)}deg)`;
      // whip-in transition + per-element stagger
      const inX = cur === 0 ? 0 : (1 - ease(lt / 0.18)) * 260;
      el.style.transform = `translateX(${inX}px) scale(${1.08 - 0.08 * ease(lt / 0.25)})`; el.style.filter = cur === 0 ? 'none' : `blur(${(1 - ease(lt / 0.15)) * 14}px)`;
      el.querySelectorAll('.el').forEach((e, j) => { const k = cur === 0 && j < 3 ? 0.85 + 0.15 * ease(lt / 0.2) : ease((lt - 0.06 - j * (s.type === 'list' || s.type === 'question' ? 0.22 : 0.12)) / 0.22); e.style.opacity = k; e.style.transform = `translateY(${(1 - k) * 60}px) scale(${1.25 - 0.25 * k})`; });
      el.querySelectorAll('[data-count]').forEach(e => { const raw = e.dataset.count, m = raw.match(/^(\\D*)(\\d+(?:\\.\\d+)?)(.*)$/); if (!m || /-/.test(raw.replace(/^-/, ''))) { e.textContent = raw; return; } const n = parseFloat(m[2]), d = (m[2].split('.')[1] || '').length, k = ease(lt / 0.9); e.textContent = m[1] + (n * k).toFixed(d) + m[3]; });
      document.getElementById('flash').style.opacity = (cur === 0 ? Math.max(0, 0.12 - lt) : Math.max(0, 0.35 - lt * 2.5));
    };
  }, { inner: scenes.map(sceneHTML).join(''), scenes, starts, c1: spec.c1 || '#1b3a8a', c2: spec.c2 || '#7a1530' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-')); const n = Math.round(total * fps);
  for (let f = 0; f < n; f++) { await p.evaluate(t => window.setT(t), f / fps); await p.screenshot({ path: path.join(dir, `f${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 88 }); }
  await b.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(dir, 'f%04d.jpg'), '-f', 'lavfi', '-t', String(total), '-i', 'anullsrc=r=44100:cl=stereo', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', String(fps), '-c:a', 'aac', '-shortest', '-movflags', '+faststart', outFile]);
  // first frame + a few stills for review
  for (const [i, st] of starts.entries()) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(Math.min(st + scenes[i].dur * 0.7, total - 0.05)), '-i', outFile, '-frames:v', '1', '-vf', 'scale=360:640', outFile.replace(/\.mp4$/, `_scene${i + 1}.jpg`)]);
  fs.rmSync(dir, { recursive: true, force: true }); console.log(outFile, total.toFixed(1) + 's', n, 'frames');
})();
