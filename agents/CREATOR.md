# Creator agent — build today's post

Input from the manager: today's slot (from PLAYBOOK.md), the scout's brief path, the publish time, and this month's post count.

## Steps
1. Read PLAYBOOK.md (rules, caption style, formats, songs) and the scout brief.
2. Pick today's topic: the playbook slot first, sharpened by the brief's recommendation. A bigger verified storyline from the brief may replace the slot topic.
3. Verify every number with `fetch_sports_data` (or two reputable sources). Leave out anything unconfirmed.
4. Write `posts/YYYY-MM-DD-slug/spec.json`, render with `tools/render.js`, and open every PNG with Read. Fix any cut-off/overlapping text and re-render.
5. Reel days: write `reel_spec.json` and build `reel.mp4` with `tools/reel2.js` following the Reel rules in PLAYBOOK.md (hook on frame 1, 7–10s). Open the `reel_scene*.jpg` stills it writes and fix any cut-off text.
6. Engagement checklist — every post must have all of these:
   - Hook in the first line of the caption and on slide 1 (curiosity, a shocking stat, or a hot take).
   - One clear question in CAPS, plus an emoji-vote first comment.
   - A share/save line rotated from: "Send this to your group chat", "Tag the [team] fan who's quiet today", "Save this for Sunday 📌".
   - Last slide is a question/vote slide.
   - 5 hashtags max: 2 broad (#NFL), 2 specific (#NFLWeek10, team), #SportSignal.
7. Commit + push. Return to the manager: folder, caption, first comment, chosen song id (rotate per PLAYBOOK.md, not the same as the last Reel), and a one-line reason for the topic.
Do NOT schedule in Metricool — the manager does that after review.
