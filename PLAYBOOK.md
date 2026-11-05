# Sport Signal posting playbook

Instagram: @sport.signal — "SPORTS WITHOUT THE NOISE."
Graphics are made with `tools/render.js` (spec JSON → 1080x1350 PNG slides) and `tools/reel.sh` (slides → 9:16 MP4 Reel).
This repo is public: it only holds post graphics and these tools. Nothing private goes here.

## Weekly plan (4 posts/week, Metricool free plan = 20/month, never go past 19)
| Day | Time (CT) | Post | Format |
|---|---|---|---|
| Mon | 10:00 AM | NFL Sunday recap: `final` card (biggest upset/SNF) → `list` (other results) → `question` | **Reel** |
| Tue | 10:00 AM | Fantasy: `cover` → `list` top PPR scorer QB/RB/WR/TE + overall → `list` who to watch → `question` | Carousel |
| Thu | 5:45 PM | Pick'em: `matchup` for TNF (+ optional 2nd `matchup` for weekend games) | **Reel** |
| Fri | 10:00 AM | Biggest story of the week, any league: `final` card or carousel | **Reel** |

A huge moment (title clinched, record) can replace that day's topic. Never add extra posts.

## Rules
- No Canva or paid tools. No team logos, player photos or league marks — team abbreviations in team colors only.
- Every score/stat/time/win chance comes from fetched data (sports data tool first; otherwise two reputable sources). If unsure, leave it out.
- No betting advice, no fake giveaways, no "like for like".
- Open every rendered slide and check for cut-off or overlapping text and wrong numbers before posting.

## Caption style
```
🚨 HOOK LINE IN CAPS.

Short punchy lines, one idea each.

emoji bullets for results/stats

👇 ONE QUESTION IN CAPS

Follow @Sport.Signal ⚡
SPORTS WITHOUT THE NOISE.

#Max5Hashtags #SportSignal
```
First comment: an emoji vote, e.g. `🔵 = Giants, 🔴 = Texans`.

## Publishing steps
1. Render: `NODE_PATH=$(npm root -g) node tools/render.js spec.json out`
2. Reel days: `tools/reel.sh out/reel.mp4 out/slide1.png out/slide2.png ...`
3. Save to `posts/YYYY-MM-DD-slug/` (slides, reel.mp4, spec.json), commit, push.
4. Schedule in Metricool with media `https://raw.githubusercontent.com/sundj15/sport-signal-media/main/posts/<folder>/<file>`.
   - Reel: media = [reel.mp4], instagramData `{"type":"REEL","showReelOnFeed":true}`, `videoCoverMilliseconds: 500`.
   - Carousel: media = slides in order, instagramData `{"type":"POST"}`.
5. Check `getScheduledPosts` first so nothing is scheduled twice.
