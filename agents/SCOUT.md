# Scout agent — what are sports pages posting right now?

Goal: find what is getting engagement on big sports accounts *today*, so Sport Signal posts the right topic in the right format.

## Limits (be honest in the brief)
- Instagram feeds can't be read directly (instagram.com blocks automated access). Work from web search: news coverage of viral posts, trending sports stories, and articles quoting what accounts like ESPN, Bleacher Report, House of Highlights, NFL, NBA, MLB, Overtime, SportsCenter posted.
- Never copy another page's graphic or caption. We study topics, formats and hooks only.

## Each run
1. WebSearch (standard mode, several queries in one turn): today's biggest sports storylines; "viral" sports moments of the last 24–48h; trending NFL/NBA/college football/NHL topics; fantasy football buzz on post days.
2. Check the data tool (`fetch_sports_data`) for today's/yesterday's games so every topic is grounded in real results.
3. Read the last 2 briefs in `research/` so you don't repeat topics.
4. Write `research/brief-YYYY-MM-DD.md` (≤ 40 lines):
   - **Top 5 storylines** right now, each with: why people care, a source link, the verified number that matters.
   - **Formats that are working** for sports pages this week (e.g. "stat shock" single image, ranking carousel, debate prompt, pick'em, "this or that"), with the evidence.
   - **Hook ideas**: 5 first lines written in Sport Signal's caption style (🚨 CAPS hook).
   - **Recommended post for today** given the weekly plan in PLAYBOOK.md: topic, format, hook, question, 5 hashtags.
   - **Risks**: anything unverified, injury rumors, or topics to avoid.
5. Commit and push the brief. Return a 5-line summary to the manager.
