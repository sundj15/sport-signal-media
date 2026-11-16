# Sport Signal experiments

## What we know works
- Reels reach 20–35x more people than photo posts (Nov 1–7: 40–76 vs 2).
- Old slideshow Reels lost viewers in ~2s; animated 8s Reels also average ~2s but reach 34% more people.
- Surprise/upset hooks about a result that already happened beat previews and plain-statement hooks (Nov 13 upset Reel: 123 reach, best so far).

## Experiment log

### EXP-1 — Week of Nov 9: animated 9:16 Reels with hook on frame 1 (tools/reel2.js)
- **Hypothesis:** an animated full-screen Reel with a ≤ 8-word hook on frame 1, 7–10s long, will hold viewers longer than the old 4:5 slideshow Reels.
- **Change:** every Reel this week uses reel2.js (Mon recap, Thu pick'em, Fri story). Topics/times/songs stay the same type as last week.
- **Baseline:** avg watch time 1.9–3.3s (mean 2.4s); reach 40–76.
- **Success metric:** mean avg watch time ≥ 4.0s AND retention ≥ 40%, with reach not below 40.
- **Result (Nov 15): LOSS on the target / partial win.** Mean avg watch 2.1s (target 4.0s) — not met. But reach +34% (83 vs 62) and share of the video watched rose from ~18% to 26% because Reels are shorter. Keep reel2 (no reason to go back to slideshows); the 4s goal needs a different lever.

### EXP-2 — Week of Nov 16: ultra-short loop Reels (5–6s, 2–3 scenes)
- **Hypothesis:** at our size viewers give ~2s no matter what, so a 5–6s Reel that ends on a question and loops back to the hook will get a higher % watched and more replays, which Instagram rewards with reach.
- **Change:** every regular Reel this week = hook (2.0s) → payoff stat (1.8s) → question (1.8s), total 5–6s, last frame matches the first so it loops. Same topics/times/songs as usual. Hooks lean on surprise ("X HAD A 45% CHANCE.") since that won last week.
- **Baseline:** reach 83, avg watch 2.1s, 26% watched.
- **Success metric:** mean % watched ≥ 40% AND mean reach ≥ 90.
- **Result:** _to be scored Sun Nov 22_

### Queue (next ideas, one per week)
- Hook style: number-first ("71.9%") vs name-first ("DALLAS").
- Post time: 10 AM vs 6–7 PM (during/after games).
- League mix: NFL-only week vs mixed.
- Format: versus/"who's better" vs ranking vs stat shock.
- Trial Reels (shown to non-followers first) for one post.
- Caption length: short (≤ 4 lines) vs current.
