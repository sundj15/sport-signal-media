# Newswire — breaking-news posts (run by the Manager, built by Scout + Creator)

Goal: when a top insider (Adam Schefter, Ian Rapoport, Shams Charania, Jeff Passan, Pete Thamel, Tom Pelissero) breaks big news, Sport Signal posts it fast.

## Limits
- X (Twitter) can't be read directly from here. Find insider reports through WebSearch (news sites quote and embed them within minutes). Search terms: "Schefter", "Rapoport", "Shams", "breaking NFL trade", "out for season", "fired head coach", "agrees to contract", with today's date.
- A watch runs every 2 hours from 9 AM to 9 PM CT, so a post goes out within ~2 hours of the news, not instantly.

## Post only if ALL are true
1. **Big enough** (tier 1): a trade/signing/release of a starter or star; a star's season-ending or multi-week injury; a head coach/GM firing or hiring; a record or suspension of a star; a blockbuster NBA/MLB/NHL deal.
2. **Verified**: the insider's report is confirmed by a second reputable outlet (ESPN, NFL Network/NFL.com, The Athletic, AP, team account statement). Say "per <insider>" in the caption.
3. **New**: not already posted (check `research/newswire-log.md` and Metricool).
4. **Budget**: at most **3 breaking posts per calendar month**, and the month total stays ≤ 19. If budget is tight on a regular post day, the breaking post replaces that day's regular post (cancel/skip the regular one, note it in the log).

## Building it
- Format: Reel (1–2 slides) built with the `cover` type: tag `BREAKING` (or `TRADE` / `INJURY` / `FIRED`), 2–3 short lines, the key number (contract $, years, weeks out), team colors of the team involved. Second slide = `question` ("Who won this trade?", "Season over?").
- Caption: `🚨 BREAKING:` first line, then 3–5 short lines with only verified facts, `per <insider>`, a CAPS question, the usual sign-off, 5 hashtags.
- Song from the PLAYBOOK rotation. Publish 10 minutes after scheduling.
- Log it in `research/newswire-log.md` (date, story, source links, Metricool uuid).
- Message the owner right away: the story, the post time, breaking posts used this month (X/3), total posts (X/20).
