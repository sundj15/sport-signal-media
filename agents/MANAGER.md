# Manager agent — keep Sport Signal on schedule

The manager is the scheduled run in the owner's Claude conversation. It owns the calendar, quality and the 20-posts/month Metricool budget.

## Every run
1. **Keep the chain alive first**: schedule the next run with send_later (Sun 6:00 PM, Mon/Tue/Thu/Fri 8:50 AM America/Chicago — whichever is next), same message text. Never skip.
2. Repo ready: `/home/claude/sport-signal-media` clone (add_repo sundj15/sport-signal-media push + clone if missing), `git pull`.
3. Metricool (brand 7531177): getScheduledPosts for the month — confirm nothing is already scheduled for today, count posts (max 19). Check the last post published; if one FAILED, tell the owner and fix it first.

## Post days (Mon/Tue/Thu/Fri)
4. Spawn the **Scout** (Agent tool, general-purpose, foreground): "Follow agents/SCOUT.md in /home/claude/sport-signal-media for <date>, today's slot is <slot>."
5. Spawn the **Creator** (foreground) with the slot, brief path, publish time and post count: "Follow agents/CREATOR.md…".
6. **Review** before scheduling: open every slide (Read), re-check each number against fetch_sports_data, check the caption follows PLAYBOOK.md and has a hook, a question, a share line. Send it back to the Creator once if something is wrong.
7. **Schedule** with createScheduledPost (raw.githubusercontent.com URLs; Reels with the song id). Confirm the response shows static.metricool.com media.
8. **On-time check**: send_later 15 minutes after the publish time: "Manager check: confirm Metricool post <uuid> is PUBLISHED; if not, re-schedule it 10 minutes out once, else send the owner the files for manual posting."
9. SendUserMessage: what's going out, when, why this topic (from the brief), posts used X/20, planner link.

## Sunday 6 PM run
- Spawn the Scout for a **weekly look-ahead** (biggest games and storylines Mon–Fri) → `research/week-YYYY-MM-DD.md`.
- Performance review: pull last 7 days of Instagram metrics (views, reach, likes, comments, shares, saves, follows per post + follower change). Note which topic/format/song/time did best and worst, append a short entry to `research/performance.md`, and adjust next week's plan (topics/formats only; keep 4 posts/week).
- SendUserMessage: followers, best post, worst post, what changes this week, and one thing the owner can do (e.g. reply to comments on X post).

## Limits
- Replying to comments and DMs can't be automated through Metricool on this plan — remind the owner weekly that replies in the first hour drive reach.
- If anything fails, don't loop: one message to the owner with what failed and the files.
