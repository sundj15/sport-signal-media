# Bell & Fork

A mobile-friendly fitness app that does two things:

1. **Calorie tracking.** It works out your daily calorie and macro targets from your stats and goal. You then log what you eat from a built-in food database or from your own custom foods.
2. **A 12-week kettlebell and bodyweight program.** Three sessions a week, with a workout logger, rest timer, personal bests and end-of-program tests.

There's no build step, no server and no account. All data stays in your browser (`localStorage`), and you can export or import a JSON backup.

## Run it

```bash
cd fitness-app
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly also works. On a phone, host the folder anywhere static (GitHub Pages, Netlify) and use "Add to Home Screen".

## Features

| Tab | What it does |
|---|---|
| **Today** | Calories eaten vs. target, protein/carbs/fat bars, next workout, quick weigh-in |
| **Food** | Log by meal (Breakfast/Lunch/Dinner/Snacks), browse past days, search ~75 foods, use servings or grams, add custom foods from a nutrition label |
| **Train** | The 12-week grid, session previews, exercise library with an animated demo, a video link, coaching cues and easier/harder options for every exercise, and the live workout logger (weight/reps per set, auto rest timer, survives page reloads) |
| **Progress** | Weight trend chart with 7-entry average, 7-day calorie chart vs. target, sessions done, personal bests (estimated 1RM), week-12 test results, workout history, backup/restore |
| **Profile** | Metric or imperial units, stats, activity, goal and rate, starting kettlebell size, plus your BMR, TDEE and targets |

## How targets are calculated

- **BMR:** Mifflin–St Jeor. **TDEE** = BMR × activity factor (1.2–1.9).
- **Calorie target** = TDEE ± (weekly rate × 7700 kcal / 7). It never drops below 1200 kcal (female) or 1500 kcal (male).
- **Protein:** 2.0 g/kg when losing fat, otherwise 1.8 g/kg. **Fat:** 25% of calories. **Carbs:** the rest.
- **Workout burn:** about 7 MET × body weight × hours. It's shown for information only, because your activity level already counts training.
- Logging a weigh-in updates the weight used for your targets.

## The program

| Phase | Weeks | Focus |
|---|---|---|
| 1 Foundation | 1–4 | Learn the deadlift, goblet squat, swing, press, row and half get-up |
| 2 Strength | 5–8 | Front squat, single-leg RDL, clean & press, full Turkish get-up, harder push-ups |
| 3 Power & conditioning | 9–12 | Snatch, push press, box pistols, complexes, conditioning |

Each week has three sessions (A lower body, B upper body, C full body/athletic). Each session has a warm-up, five exercises and a finisher. Volume builds over weeks 1–3 of each phase, and week 4 is a lighter deload. Week 12's finishers are tests: 5-minute swing count, max push-ups and max plank. The whole program is data in `js/program.js`, so you can edit sets, reps or exercises there.

## Files

```
index.html            app shell
css/styles.css        styles (light + dark)
js/calc.js            BMR/TDEE/macros, nutrition, 1RM, unit conversion
js/foods.js           food database (per 100 g)
js/program.js         exercises + 12-week program
js/demos.js           animated exercise demos (SVG figure + key poses) and video links
js/app.js             UI, storage, logging
test/run-tests.js     unit tests: node test/run-tests.js
```

Food values are approximations based on USDA FoodData Central. Calorie targets are estimates, so adjust by 100–200 kcal if your weekly average weight isn't moving as planned. This is not medical advice; check with a professional if you have a health condition.
