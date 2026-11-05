// Sport Signal post renderer. Usage: node render.js spec.json outdir
// spec: {slides:[{type:"final"|"cover"|"list"|"matchup"|"question", ...}]}
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3] || 'out'; fs.mkdirSync(out, { recursive: true });
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CSS = `*{margin:0;box-sizing:border-box}
:root{--lime:#d7ff3a;--ink:#070b14}
body{width:1080px;height:1350px;background:var(--ink);color:#fff;font-family:"DejaVu Sans",sans-serif;position:relative;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(ellipse 60% 45% at 30% 30%,color-mix(in srgb,var(--c1) 90%,#fff 10%) 0%,transparent 70%),radial-gradient(ellipse 50% 40% at 85% 62%,color-mix(in srgb,var(--c2) 55%,transparent) 0%,transparent 70%),linear-gradient(160deg,#0c1530 0%,#060a14 70%)}
.lights{position:absolute;inset:0;background:radial-gradient(circle at 18% 12%,#ffffffcc 0 6px,#ffffff55 14px,transparent 60px),radial-gradient(circle at 26% 10%,#ffffffaa 0 5px,#ffffff44 12px,transparent 50px),radial-gradient(circle at 78% 8%,#ffffffaa 0 5px,#ffffff33 12px,transparent 55px);filter:blur(1px)}
.crowd{position:absolute;left:0;right:0;top:330px;height:300px;opacity:.18;background-image:radial-gradient(circle,#cfe0ff 1.2px,transparent 1.8px);background-size:9px 7px;-webkit-mask-image:linear-gradient(transparent,#000 40%,transparent)}
.noise{position:absolute;inset:0;opacity:.22;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.slash{position:absolute;background:var(--lime);transform:rotate(-58deg);box-shadow:0 0 30px #d7ff3a88}
.giant{position:absolute;left:-30px;top:120px;font:700 520px/.8 "DejaVu Sans Condensed";letter-spacing:-30px;color:transparent;-webkit-text-stroke:3px color-mix(in srgb,var(--c1) 40%,#fff 25%);opacity:.5;transform:skewX(-8deg);white-space:nowrap}
.giant.fill{color:color-mix(in srgb,var(--c1) 85%,transparent);-webkit-text-stroke:0;opacity:.9;left:20px;top:210px;font-size:440px;filter:drop-shadow(0 30px 60px #000)}
.brand{position:absolute;top:52px;left:56px;display:flex;align-items:center;gap:14px}
.mark{width:58px;height:46px;position:relative;transform:skewX(-18deg)}
.mark i{position:absolute;left:0;right:0;height:12px;background:var(--lime);border-radius:2px}
.mark i:nth-child(1){top:0;right:12px}.mark i:nth-child(2){top:17px;left:12px;right:0;background:#fff}.mark i:nth-child(3){top:34px;right:12px}
.wm{font:italic 700 40px/1 "DejaVu Sans Condensed";letter-spacing:-1px}.wm b{color:var(--lime)}
.wm small{display:block;font:700 12px/1 "DejaVu Sans";letter-spacing:5px;color:#c9d1dc;margin-top:8px;font-style:normal}
.side{position:absolute;font:700 15px/1.75 "DejaVu Sans";letter-spacing:5px;color:#d8dde5;text-transform:uppercase}
.side em{display:block;width:16px;height:4px;background:var(--lime);transform:skewX(-30deg);margin-top:12px}
.boxes{position:absolute;right:56px;top:270px;width:440px}
.box{height:200px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;padding:0 34px;background:linear-gradient(135deg,#ffffff14,#00000066);border:2px solid #ffffff30;box-shadow:inset 0 0 0 1px #00000080,0 20px 40px #0008;transform:skewX(-6deg)}
.tm{transform:skewX(6deg);text-align:center}
.chip{width:130px;height:110px;display:grid;place-items:center;font:700 56px/1 "DejaVu Sans Condensed";letter-spacing:-2px;color:#fff;clip-path:polygon(12% 0,100% 0,88% 100%,0 100%)}
.tm span{display:block;margin-top:12px;font:700 20px/1 "DejaVu Sans";letter-spacing:4px;white-space:nowrap}
.num{transform:skewX(6deg);font:700 170px/1 "DejaVu Sans Condensed";letter-spacing:-8px;background:linear-gradient(#fff,#c5ccd6);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 6px 0 #0007)}
.lose .num{background:linear-gradient(#9aa3b0,#5d6672);-webkit-background-clip:text}
.final{position:absolute;left:150px;top:745px;padding:4px 70px;background:var(--lime);transform:skewX(-14deg);box-shadow:0 0 50px #d7ff3a66}
.final span{display:block;transform:skewX(14deg);font:italic 700 150px/1 "DejaVu Sans Condensed";letter-spacing:-6px;color:#05070c;white-space:nowrap}
.head{position:absolute;left:40px;right:40px;text-align:center;white-space:nowrap;font:italic 700 96px/.95 "DejaVu Sans Condensed";letter-spacing:-5px;text-transform:uppercase;background:linear-gradient(#fff 30%,#b9c1cc 70%,#fff);-webkit-background-clip:text;color:transparent;transform:scaleY(1.38) skewX(-7deg);filter:drop-shadow(0 8px 0 #000a)}
.big{position:absolute;left:56px;right:56px;font:italic 700 150px/.92 "DejaVu Sans Condensed";letter-spacing:-6px;text-transform:uppercase;background:linear-gradient(#fff 30%,#b9c1cc 70%,#fff);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 8px 0 #000a)}
.big b{background:var(--lime);-webkit-background-clip:text}
.stat{position:absolute;left:0;right:0;top:1090px;white-space:nowrap;display:flex;justify-content:center;align-items:center;gap:20px;font:700 30px/1 "DejaVu Sans Condensed";color:#e8ecf1;text-transform:uppercase}
.stat b{color:var(--lime);font-size:62px;font-style:italic}.stat i{width:4px;height:56px;background:var(--lime)}
.q{position:absolute;left:40px;right:40px;top:1178px;text-align:center;font:700 23px/1 "DejaVu Sans";letter-spacing:6px;text-transform:uppercase;white-space:nowrap}
.ul{position:absolute;left:390px;width:300px;top:1216px;height:3px;background:var(--lime)}
.nav{position:absolute;left:56px;right:56px;bottom:34px;display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #ffffff30;padding-top:18px}
.nav ul{display:flex;list-style:none;padding:0;font:700 15px/1 "DejaVu Sans";letter-spacing:3px;color:#d8dde5}
.nav li{padding:0 18px;border-left:1px solid #ffffff55}.nav li:first-child{padding-left:0;border:0}
.nav p{font:700 15px/1.6 "DejaVu Sans";letter-spacing:5px}.nav p b{color:var(--lime)}
.pill{position:absolute;left:56px;top:175px;background:var(--lime);color:#05070c;padding:10px 26px;font:italic 700 34px/1 "DejaVu Sans Condensed";transform:skewX(-14deg);letter-spacing:1px}
.pill span{display:inline-block;transform:skewX(14deg)}
.rows{position:absolute;left:56px;right:56px}
.row{display:flex;align-items:center;gap:22px;padding:18px 26px;margin-bottom:14px;background:linear-gradient(90deg,#ffffff16,#00000055);border-left:8px solid var(--lime);transform:skewX(-6deg)}
.row>*{transform:skewX(6deg)}
.row .t{flex:1;min-width:0}.row .m{font:700 54px/1.05 "DejaVu Sans Condensed";letter-spacing:-1px;text-transform:uppercase;white-space:nowrap}
.row .s{font:400 24px/1.2 "DejaVu Sans";color:#aeb6c1;margin-top:6px}
.row .k{font:italic 700 58px/1 "DejaVu Sans Condensed";color:var(--lime);white-space:nowrap}
.row .tag{width:88px;height:70px;display:grid;place-items:center;font:700 32px/1 "DejaVu Sans Condensed";clip-path:polygon(12% 0,100% 0,88% 100%,0 100%);flex:none}
.note{position:absolute;left:56px;right:56px;top:1150px;font:400 22px/1.3 "DejaVu Sans";color:#9aa3ae;letter-spacing:1px}
.swipe{position:absolute;right:56px;top:190px;font:700 20px/1 "DejaVu Sans";letter-spacing:6px;color:var(--lime)}
.mu{display:flex;align-items:center;justify-content:space-between;padding:22px 30px;margin-bottom:18px;background:linear-gradient(135deg,#ffffff14,#00000066);border:2px solid #ffffff30;transform:skewX(-6deg)}
.mu>*{transform:skewX(6deg)}
.mu .side2{text-align:center;width:300px}.mu .nm{font:700 44px/1 "DejaVu Sans Condensed";text-transform:uppercase;margin-top:10px;white-space:nowrap}
.mu .pc{font:700 22px/1 "DejaVu Sans";color:#aeb6c1;margin-top:8px;letter-spacing:2px}
.mu .vs{text-align:center}.mu .vs b{display:block;font:italic 700 64px/1 "DejaVu Sans Condensed";color:var(--lime)}.mu .vs span{font:700 20px/1 "DejaVu Sans";letter-spacing:3px;color:#d8dde5}
.mu .chip{margin:0 auto;width:120px;height:92px;font-size:46px}
.opt{display:flex;align-items:center;gap:22px;padding:20px 28px;margin-bottom:14px;border:2px solid #ffffff35;background:#00000055;transform:skewX(-6deg);font:700 50px/1 "DejaVu Sans Condensed";text-transform:uppercase}
.opt>*{transform:skewX(6deg)}.opt b{width:60px;height:60px;display:grid;place-items:center;background:var(--lime);color:#05070c;font-size:36px;flex:none}
`;
const chrome = (s, inner) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
<body style="--c1:${s.c1 || '#13306b'};--c2:${s.c2 || '#7a1530'}"><div class="bg"></div><div class="lights"></div><div class="crowd"></div>
${s.bg_text ? `<div class="giant">${esc(s.bg_text)}</div><div class="giant fill">${esc(s.bg_text)}</div>` : ''}
<div class="slash" style="width:6px;height:360px;left:600px;top:-170px;opacity:.7"></div>
<div class="slash" style="width:14px;height:260px;left:1050px;top:1120px"></div>
<div class="noise"></div>
<div class="brand"><div class="mark"><i></i><i></i><i></i></div><div class="wm">SPORT<b>.</b>SIGNAL<small>SPORTS WITHOUT THE NOISE</small></div></div>
<div class="side" style="right:56px;top:60px">Same game.<br>Bigger<br>perspective.<em></em></div>
${inner}
<div class="nav"><ul><li>NFL</li><li>NBA</li><li>MLB</li><li>NHL</li><li>CFB</li><li>MORE</li></ul><p>FOLLOW<br>THE <b>SIGNAL.</b></p></div>
<script>document.querySelectorAll('[data-fit]').forEach(e=>{let f=parseFloat(getComputedStyle(e).fontSize);const w=e.parentElement?e.clientWidth:1000;while(e.scrollWidth>e.clientWidth+2&&f>20){f-=2;e.style.fontSize=f+'px'}});</script>
</body></html>`;
const chip = t => `<div class="chip" style="background:${t.c1};box-shadow:inset 0 -10px 0 ${t.c2}">${esc(t.abbr)}</div>`;
const tag = t => `<div class="tag" style="background:${t.c1};box-shadow:inset 0 -8px 0 ${t.c2}">${esc(t.abbr)}</div>`;

const T = {
  final: s => chrome({ ...s, c1: s.teams[0].c1, c2: s.teams[1].c1, bg_text: s.teams[0].abbr }, `
<div class="side" style="left:58px;top:150px">${(s.side || ['News', 'Analysis', 'Debate', 'All sports']).map(esc).join('<br>')}<em></em></div>
<div class="boxes">${s.teams.map((t, i) => `<div class="box ${i ? 'lose' : ''}"><div class="tm">${chip(t)}<span>${esc(t.name)}</span></div><div class="num">${esc(t.score)}</div></div>`).join('')}</div>
<div class="side" style="left:58px;top:560px">${(s.label || []).map(esc).join('<br>')}<em></em></div>
<div class="final"><span>${esc(s.banner || 'FINAL')}</span></div>
<div class="head" data-fit style="top:930px">${esc(s.headline)}</div>
${s.stat ? `<div class="stat"><b>${esc(s.stat.big)}</b> ${esc(s.stat.a)} <i></i> ${esc(s.stat.b)}</div>` : ''}
<div class="q">${esc(s.question)}</div><div class="ul"></div>`),
  cover: s => chrome({ ...s }, `
<div class="pill"><span>${esc(s.tag)}</span></div>${s.swipe !== false ? '<div class="swipe">SWIPE →</div>' : ''}
<div class="big" style="top:300px">${s.lines.map((l, i) => i === s.accent_line ? `<b>${esc(l)}</b>` : esc(l)).join('<br>')}</div>
${s.sub ? `<div class="stat" style="top:1040px">${esc(s.sub)}</div>` : ''}
${s.question ? `<div class="q" style="top:1120px">${esc(s.question)}</div><div class="ul" style="top:1158px"></div>` : ''}`),
  list: s => chrome(s, `
<div class="pill"><span>${esc(s.tag)}</span></div>${s.swipe !== false ? '<div class="swipe">SWIPE →</div>' : ''}
<div class="big" data-fit style="top:250px;font-size:${s.title_size || 110}px;white-space:nowrap">${esc(s.title)}</div>
<div class="rows" style="top:${s.rows_top || 420}px">${s.rows.map(r => `<div class="row">${r.team ? tag(r.team) : ''}<div class="t"><div class="m" data-fit>${esc(r.main)}</div>${r.sub ? `<div class="s">${esc(r.sub)}</div>` : ''}</div>${r.kicker ? `<div class="k">${esc(r.kicker)}</div>` : ''}</div>`).join('')}</div>
${s.note ? `<div class="note">${esc(s.note)}</div>` : ''}`),
  matchup: s => chrome(s, `
<div class="pill"><span>${esc(s.tag)}</span></div>${s.swipe !== false ? '<div class="swipe">SWIPE →</div>' : ''}
<div class="big" data-fit style="top:250px;font-size:110px;white-space:nowrap">${esc(s.title)}</div>
${s.question ? `<div class="q" style="top:1150px">${esc(s.question)}</div><div class="ul" style="top:1188px"></div>` : ''}
<div class="rows" style="top:${s.games.length === 1 ? 640 : 420}px">${s.games.map(g => `<div class="mu"><div class="side2">${chip(g.away)}<div class="nm">${esc(g.away.name)}</div>${g.away.pct ? `<div class="pc">${esc(g.away.pct)} WIN CHANCE</div>` : ''}</div><div class="vs"><b>@</b><span>${esc(g.time)}</span></div><div class="side2">${chip(g.home)}<div class="nm">${esc(g.home.name)}</div>${g.home.pct ? `<div class="pc">${esc(g.home.pct)} WIN CHANCE</div>` : ''}</div></div>`).join('')}</div>
${s.note ? `<div class="note">${esc(s.note)}</div>` : ''}`),
  question: s => chrome(s, `
<div class="pill"><span>${esc(s.tag || 'YOUR CALL')}</span></div>
<div class="big" style="top:280px;font-size:${s.title_size || 130}px">${s.lines.map(esc).join('<br>')}</div>
<div class="rows" style="top:${s.opts_top || 720}px">${s.options.map((o, i) => `<div class="opt"><b>${'ABCDEFG'[i]}</b><span data-fit style="display:block;white-space:nowrap;flex:1;min-width:0">${esc(o)}</span></div>`).join('')}</div>
<div class="q" style="top:1205px">${esc(s.cta || 'DROP YOUR ANSWER BELOW 👇')}</div>`)
};

(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  const files = [];
  for (const [i, s] of spec.slides.entries()) {
    const html = T[s.type](s); const f = path.join(out, `slide${i + 1}.png`);
    await p.setContent(html); await p.waitForTimeout(250); await p.screenshot({ path: f }); files.push(f);
  }
  await b.close(); console.log(files.join('\n'));
})();
