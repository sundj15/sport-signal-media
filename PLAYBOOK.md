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
- **Week numbers must be verified** from NFL.com/ESPN before using "Week N" anywhere (we mislabeled Oct 25 as Week 8 and Nov 1 as Week 9; they were Weeks 7 and 8). NFL Week 9 = Thu Nov 5 – Mon Nov 9, 2026.
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
2. Reel days: build an **animated** Reel with `NODE_PATH=$(npm root -g) node tools/reel2.js reel_spec.json reel.mp4` (see Reel rules below). `tools/reel.sh` (slideshow) is retired for Reels.
3. Save to `posts/YYYY-MM-DD-slug/` (slides, reel.mp4, spec.json), commit, push.
4. Schedule in Metricool with media `https://raw.githubusercontent.com/sundj15/sport-signal-media/main/posts/<folder>/<file>`.
   - Reel: media = [reel.mp4], instagramData `{"type":"REEL","showReelOnFeed":true,"audioConfiguration":{"audioId":"<id>","audioVolume":100,"videoVolume":0}}`, `videoCoverMilliseconds: 1200`.
     Every Reel gets an Instagram-catalog song. Rotate through these (verified ids), never the same one twice in a row:
     `1477454630815990` Born For This (Auralux) · `470234301018709` Unstoppable (Instrumental) (Mike Floss) · `1177466663826304` Legends (stereogully) · `303178789177383` Burn It Down (Instrumental) (Jonny Houlihan) · `2245316862885720` Awards Night (Danny Peter Wolf).
     To find new tracks, pass a search term as audioId; Metricool returns candidate ids. If audio is rejected with 403, post the Reel without audio and tell the owner the Instagram/Facebook link needs checking.
   - Carousel: media = slides in order, instagramData `{"type":"POST"}`.
5. Check `getScheduledPosts` first so nothing is scheduled twice.

## Agents
Posting is run by three agents — see `agents/`: **Scout** (what sports pages are posting, writes `research/` briefs), **Creator** (builds the post), **Manager** (schedule, review, budget, on-time checks, weekly review). The Manager is the scheduled run and follows `agents/MANAGER.md`.

## Reel rules (since Nov 7 — first Reels had ~2s average watch time on 10–16s videos)
Data: Reels reached 40–76 people each (photos reached 2), so Reels stay the main format, but viewers left in under 2 seconds. Sports pages that win on Reels (House of Highlights, Bleacher Report, StatMuse-style accounts) open with one shocking line and keep it moving.
- Native 9:16 with `tools/reel2.js` — never letterboxed 4:5 slides.
- **Frame 1 = the hook**, already on screen: ≤ 8 words, contains a number or a surprise ("DALLAS HAD A 71.9% CHANCE."). Lines ≤ 14 characters so they stay huge.
- **7–10 seconds total**, 3–5 scenes, a new beat every ~1.5–2s: hook → payoff stat (count-up) → context (list/versus) → question. The question scene should make people want to rewatch/answer.
- One idea per Reel. Lead with the biggest audience: NFL > NBA > college football > others; star players and big-market teams in the hook (names only, no photos).
- Formats to rotate: **stat shock**, **who's better / versus**, **ranking (top 3)**, **pick'em**, **upset alert**.
- Caption short: hook line, 2–4 lines, CAPS question, sign-off, 5 hashtags.
- Song: from the rotation; if Metricool shows a trending sports track in search results, prefer it.
- The Manager's Sunday review tracks per Reel: views, reach, **average watch time** (target > 4s), **retention %** (target > 40%), shares, follows — and keeps what works.
