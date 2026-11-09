/* Bell & Fork — calorie tracking + kettlebell/bodyweight program. All data stays in this browser (localStorage). */
(function () {
  'use strict';

  var STORAGE_KEY = 'bellfork.v1';
  var MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  var WORKOUT_MET = 7; // kettlebell + bodyweight sessions with short rests

  // ---------- State ----------
  var state = load();
  var ui = { view: state.profile ? 'today' : 'profile', foodDate: todayISO(), preview: null };
  var restTimer = null;
  var clockTimer = null;

  function defaultState() {
    return { version: 1, profile: null, customFoods: [], foodLog: {}, weights: [], completed: {}, workouts: [], active: null };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) {
      return defaultState();
    }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { toast('Could not save — browser storage is unavailable.'); }
  }

  // ---------- Helpers ----------
  function $(sel, rootEl) { return (rootEl || document).querySelector(sel); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function toISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayISO() { return toISO(new Date()); }
  function parseISO(iso) { var p = iso.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDays(iso, n) { var d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); }
  function prettyDate(iso) {
    if (iso === todayISO()) return 'Today';
    if (iso === addDays(todayISO(), -1)) return 'Yesterday';
    return parseISO(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  function r0(n) { return Math.round(n); }
  function r1(n) { return Math.round(n * 10) / 10; }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }

  function imperial() { return state.profile && state.profile.units === 'imperial'; }
  function wUnit() { return imperial() ? 'lb' : 'kg'; }
  function kgToDisplay(kg) { return imperial() ? Calc.kgToLb(kg) : kg; }
  function displayToKg(v) { return imperial() ? Calc.lbToKg(v) : v; }
  function fmtW(kg) { return r1(kgToDisplay(kg)) + ' ' + wUnit(); }

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  function allFoods() { return state.customFoods.concat(FOODS); }
  function findFood(id) { return allFoods().find(function (f) { return f.id === id; }); }

  function targets() {
    var p = state.profile;
    var t = Calc.calorieTarget(p);
    return Object.assign(t, Calc.macroTargets(p, t.target));
  }

  function dayEntries(iso) { return state.foodLog[iso] || []; }
  function dayTotals(iso) { return Calc.sumNutrition(dayEntries(iso)); }

  function latestWeightKg() {
    if (state.weights.length) return state.weights[state.weights.length - 1].kg;
    return state.profile ? state.profile.weightKg : 0;
  }

  // ---------- Rendering ----------
  function render() {
    if (!state.profile && ui.view !== 'profile') ui.view = 'profile';
    document.querySelectorAll('#tabs button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.view === ui.view);
      b.disabled = !state.profile && b.dataset.view !== 'profile';
    });
    var views = { today: viewToday, food: viewFood, train: viewTrain, progress: viewProgress, profile: viewProfile };
    $('#main').innerHTML = views[ui.view]();
    var next = state.profile ? Program.nextSession(state.completed) : null;
    $('#topbar-sub').textContent = state.profile && next ? 'Week ' + next.week + ' of ' + Program.TOTAL_WEEKS : '';
    syncClock();
    Demos.mountAll($('#main'));
  }

  function macroBar(cls, label, eaten, target) {
    var pct = target ? Math.min(100, (eaten / target) * 100) : 0;
    return '<div class="macro ' + cls + '"><div class="macro-label"><span>' + label + '</span><span>' +
      r0(eaten) + ' / ' + target + ' g</span></div><div class="bar"><div style="width:' + pct + '%"></div></div></div>';
  }

  function calorieCard(iso) {
    var t = targets();
    var tot = dayTotals(iso);
    var remaining = t.target - tot.kcal;
    var pct = Math.min(100, (tot.kcal / t.target) * 100);
    var over = remaining < 0;
    return '<section class="card">' +
      '<div class="card-head"><h3>Calories</h3><small>Target ' + t.target + ' kcal</small></div>' +
      '<div class="row"><div><div class="big-number">' + r0(tot.kcal) + '</div><small>eaten</small></div><div class="spacer"></div>' +
      '<div style="text-align:right"><div class="big-number" style="color:' + (over ? 'var(--warn)' : 'var(--accent)') + '">' +
      r0(Math.abs(remaining)) + '</div><small>' + (over ? 'over' : 'left') + '</small></div></div>' +
      '<div class="bar' + (over ? ' over' : '') + '" style="margin-top:10px"><div style="width:' + pct + '%"></div></div>' +
      macroBar('protein', 'Protein', tot.protein, t.protein) +
      macroBar('carbs', 'Carbs', tot.carbs, t.carbs) +
      macroBar('fat', 'Fat', tot.fat, t.fat) +
      '</section>';
  }

  function viewToday() {
    var iso = todayISO();
    var next = Program.nextSession(state.completed);
    var todaysWorkouts = state.workouts.filter(function (w) { return w.date === iso; });
    var burned = todaysWorkouts.reduce(function (a, w) { return a + w.burn; }, 0);
    var name = state.profile.name ? ', ' + esc(state.profile.name) : '';

    var workoutCard;
    if (state.active) {
      workoutCard = '<p><strong>' + esc(state.active.title) + '</strong> is in progress.</p>' +
        '<button class="btn btn-block" data-action="goto" data-view="train">Resume workout</button>';
    } else if (todaysWorkouts.length) {
      workoutCard = '<p>Done today: <strong>' + todaysWorkouts.map(function (w) { return esc(w.title); }).join(', ') +
        '</strong> · about ' + burned + ' kcal burned.</p>' +
        (next ? '<small>Next up: Week ' + next.week + ', ' + esc(next.title) + '. Rest a day between sessions.</small>' : '');
    } else if (next) {
      workoutCard = '<p><span class="pill">Phase ' + next.phaseNumber + ' · ' + esc(next.phaseName) + '</span> ' +
        (next.deload ? '<span class="pill warn">Lighter week</span>' : '') + '</p>' +
        '<p><strong>Week ' + next.week + ' · ' + esc(next.title) + '</strong><br><small>' +
        next.blocks.map(function (b) { return esc(b.exercise.name); }).join(' · ') + '</small></p>' +
        '<button class="btn btn-block" data-action="start" data-key="' + next.key + '">Start workout</button>';
    } else {
      workoutCard = '<p>You finished all 12 weeks. 🎉 Compare your week 12 test results in Progress, then restart the program with a heavier bell from the Train tab.</p>';
    }

    return '<h2>Hi' + name + '</h2>' +
      calorieCard(iso) +
      '<section class="card"><div class="card-head"><h3>Workout</h3>' +
      '<small>' + Object.keys(state.completed).length + ' / ' + (Program.TOTAL_WEEKS * Program.DAYS_PER_WEEK) + ' sessions</small></div>' +
      workoutCard + '</section>' +
      '<section class="card"><div class="card-head"><h3>Body weight</h3><small>Latest ' + fmtW(latestWeightKg()) + '</small></div>' +
      '<form class="row" data-form="weight"><label style="flex:1;margin:0">Today’s weigh-in (' + wUnit() + ')' +
      '<input type="number" name="w" step="0.1" min="20" inputmode="decimal" required placeholder="' + r1(kgToDisplay(latestWeightKg())) + '"></label>' +
      '<button class="btn" style="align-self:flex-end">Log</button></form>' +
      '<small>Weigh in first thing in the morning for the most consistent trend.</small></section>' +
      '<button class="btn btn-ghost btn-block" data-action="goto" data-view="food">+ Log food</button>';
  }

  function viewFood() {
    var iso = ui.foodDate;
    var entries = dayEntries(iso);
    var meals = MEALS.map(function (meal) {
      var items = entries.filter(function (e) { return e.meal === meal; });
      var kcal = items.reduce(function (a, e) { return a + e.kcal; }, 0);
      return '<section class="card"><div class="card-head"><h3>' + meal + '</h3><small>' + r0(kcal) + ' kcal</small></div>' +
        (items.length ? '<ul class="list">' + items.map(function (e) {
          return '<li><div class="grow"><div class="name">' + esc(e.name) + '</div><small>' + esc(e.amountLabel) +
            ' · P ' + r0(e.protein) + ' · C ' + r0(e.carbs) + ' · F ' + r0(e.fat) + '</small></div>' +
            '<span class="kcal">' + r0(e.kcal) + '</span>' +
            '<button class="icon-btn" aria-label="Remove ' + esc(e.name) + '" data-action="del-entry" data-id="' + e.id + '">×</button></li>';
        }).join('') + '</ul>' : '') +
        '<button class="btn btn-ghost btn-small" data-action="add-food" data-meal="' + meal + '">+ Add food</button></section>';
    }).join('');

    return '<div class="date-nav"><button class="btn btn-ghost btn-small" data-action="day" data-delta="-1" aria-label="Previous day">‹</button>' +
      '<strong>' + prettyDate(iso) + '</strong>' +
      '<button class="btn btn-ghost btn-small" data-action="day" data-delta="1" aria-label="Next day"' + (iso >= todayISO() ? ' disabled' : '') + '>›</button></div>' +
      calorieCard(iso) + meals;
  }

  // ----- Train -----
  function viewTrain() {
    if (state.active) return viewLogger();
    var next = Program.nextSession(state.completed);
    var dayLetters = ['A', 'B', 'C'];
    var grid = '<div class="week-grid">';
    Program.PHASES.forEach(function (ph, pi) {
      grid += '<div class="phase-row">Phase ' + (pi + 1) + ' · ' + esc(ph.name) + '</div>';
      ph.weeks.forEach(function (w) {
        grid += '<div class="wk">Wk ' + w + (ph.weeks.indexOf(w) === 3 ? ' ↓' : '') + '</div>';
        for (var d = 0; d < 3; d++) {
          var key = Program.sessionKey(w, d);
          var cls = state.completed[key] ? ' done' : (next && next.key === key ? ' next' : '');
          grid += '<button class="session-cell' + cls + '" data-action="preview" data-key="' + key + '" aria-label="Week ' + w + ' day ' + dayLetters[d] + (state.completed[key] ? ', done' : '') + '">' +
            (state.completed[key] ? '✓ ' : '') + dayLetters[d] + '</button>';
        }
      });
    });
    grid += '</div>';

    var previewKey = ui.preview || (next && next.key);
    var preview = previewKey ? sessionPreview(keyToSession(previewKey)) : '<p>Program complete.</p>';

    var lib = Object.keys(Program.EXERCISES).map(function (id) {
      var ex = Program.EXERCISES[id];
      return '<details><summary>' + esc(ex.name) + ' <small>· ' + (ex.equip === 'kb' ? 'Kettlebell' : 'Bodyweight') + ' · ' + esc(ex.pattern) + '</small></summary>' +
        exerciseDetail(ex, id) + '</details>';
    }).join('');

    return '<h2>12-week program</h2>' +
      '<div class="notice">3 sessions a week on non-consecutive days (e.g. Mon/Wed/Fri). Start every session with the warm-up. ' +
      '↓ marks a lighter recovery week. Stop any exercise that causes sharp pain.</div>' +
      preview +
      '<section class="card"><h3>Your progress</h3>' + grid +
      (Object.keys(state.completed).length ? '<p style="margin-top:12px"><button class="btn btn-danger btn-small" data-action="restart-program">Restart program</button></p>' : '') +
      '</section>' +
      '<section class="card"><h3>Exercise library</h3>' + lib + '</section>';
  }

  function keyToSession(key) {
    var m = /^w(\d+)d(\d+)$/.exec(key);
    return Program.getSession(Number(m[1]), Number(m[2]));
  }

  function exerciseDetail(ex, id) {
    return Demos.html(id, ex) + '<ul>' + ex.cues.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>' +
      '<p style="margin:.4rem 0 .6rem;font-size:.85rem"><strong>Easier:</strong> ' + esc(ex.easier) + ' · <strong>Harder:</strong> ' + esc(ex.harder) + '</p>';
  }

  function sessionPreview(s) {
    var done = state.completed[s.key];
    var log = done && state.workouts.find(function (w) { return w.id === done; });
    return '<section class="card"><div class="card-head"><h3>Week ' + s.week + ' · ' + esc(s.title) + '</h3>' +
      (s.deload ? '<span class="pill warn">Lighter week</span>' : '<span class="pill">' + esc(s.phaseName) + '</span>') + '</div>' +
      '<p><small>' + esc(s.phaseGoal) + '</small></p>' +
      '<ul class="list">' + s.blocks.map(function (b) {
        return '<li><div class="grow"><div>' + esc(b.exercise.name) + '</div><small>' + b.sets + ' × ' + esc(b.reps) + ' · rest ' + b.rest + ' s' +
          (b.note ? ' · ' + esc(b.note) : '') + '</small></div></li>';
      }).join('') +
      '<li><div class="grow"><div>Finisher: ' + esc(s.finisher.name) + '</div><small>' + esc(s.finisher.detail) + '</small></div></li></ul>' +
      (log ? '<p><small>Completed ' + prettyDate(log.date) + ' · ' + log.minutes + ' min</small></p>' : '') +
      '<button class="btn btn-block" data-action="start" data-key="' + s.key + '">' + (done ? 'Do it again' : 'Start workout') + '</button></section>';
  }

  /** Most recent weight/reps logged for an exercise, to prefill the next session. */
  function lastPerformance(exId) {
    for (var i = state.workouts.length - 1; i >= 0; i--) {
      var sets = state.workouts[i].sets.filter(function (s) { return s.ex === exId && s.done; });
      if (sets.length) return sets[sets.length - 1];
    }
    return null;
  }

  function startWorkout(key) {
    var s = keyToSession(key);
    var sets = [];
    s.blocks.forEach(function (b) {
      var last = lastPerformance(b.ex);
      var targetReps = parseInt(b.reps, 10);
      for (var i = 0; i < b.sets; i++) {
        sets.push({
          ex: b.ex, set: i + 1,
          weightKg: b.exercise.equip === 'kb' ? (last && last.weightKg) || state.profile.bellKg || 0 : 0,
          reps: isFinite(targetReps) ? targetReps : '', done: false
        });
      }
    });
    state.active = { key: key, title: 'Week ' + s.week + ' · ' + s.title, startedAt: Date.now(), sets: sets, finisherResult: '', notes: '' };
    save();
    ui.view = 'train';
    render();
    window.scrollTo(0, 0);
  }

  function viewLogger() {
    var a = state.active;
    var s = keyToSession(a.key);
    var blocks = s.blocks.map(function (b) {
      var isKb = b.exercise.equip === 'kb';
      var timed = /\d+\s*s\b/.test(b.reps); // e.g. "30 s" or "30 s/side"
      var rows = a.sets.map(function (st, idx) {
        if (st.ex !== b.ex) return '';
        return '<tr class="' + (st.done ? 'done' : '') + '"><td>' + st.set + '</td>' +
          (isKb ? '<td><input type="number" step="0.5" min="0" inputmode="decimal" aria-label="Weight set ' + st.set + '" data-set="' + idx + '" data-field="weight" value="' + (st.weightKg ? r1(kgToDisplay(st.weightKg)) : '') + '"></td>' : '') +
          '<td><input type="number" min="0" inputmode="numeric" aria-label="' + (timed ? 'Seconds' : 'Reps') + ' set ' + st.set + '" data-set="' + idx + '" data-field="reps" value="' + esc(st.reps) + '"></td>' +
          '<td><input type="checkbox" aria-label="Set ' + st.set + ' done" data-set="' + idx + '" data-field="done" data-rest="' + b.rest + '"' + (st.done ? ' checked' : '') + '></td></tr>';
      }).join('');
      return '<div class="exercise"><div class="card-head"><h3>' + esc(b.exercise.name) + '</h3><small>' + b.sets + ' × ' + esc(b.reps) + '</small></div>' +
        (b.note ? '<small>' + esc(b.note) + '</small>' : '') +
        '<details><summary>How to do it</summary>' + exerciseDetail(b.exercise, b.ex) + '</details>' +
        '<table class="set-table"><thead><tr><th>Set</th>' + (isKb ? '<th>' + wUnit() + '</th>' : '') +
        '<th>' + (timed ? 'Sec' : 'Reps') + (/side/.test(b.reps) ? '/side' : '') + '</th><th>Done</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<small>Rest ' + b.rest + ' s between sets</small></div>';
    }).join('');

    return '<section class="card"><div class="card-head"><h2 style="margin:0">' + esc(a.title) + '</h2><span class="timer" id="clock">0:00</span></div>' +
      (s.deload ? '<p><span class="pill warn">Lighter week</span> <small>Keep the bell a size lighter or stop well short of failure.</small></p>' : '') +
      '<details><summary>Warm-up (5 min)</summary><ul>' + s.warmup.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul></details></section>' +
      '<section class="card">' + blocks + '</section>' +
      '<section class="card"><h3>Finisher: ' + esc(s.finisher.name) + '</h3><p>' + esc(s.finisher.detail) + '</p>' +
      '<label>Result (rounds, reps or time)<input type="text" data-field="finisher" value="' + esc(a.finisherResult) + '"></label>' +
      '<label>Notes<textarea rows="2" data-field="notes">' + esc(a.notes) + '</textarea></label></section>' +
      '<button class="btn btn-block" data-action="finish">Finish workout</button>' +
      '<p style="margin-top:10px"><button class="btn btn-danger btn-block" data-action="discard">Discard workout</button></p>';
  }

  function finishWorkout() {
    var a = state.active;
    var minutes = Math.max(1, Math.round((Date.now() - a.startedAt) / 60000));
    var log = {
      id: uid(), key: a.key, title: a.title, date: todayISO(), minutes: minutes,
      burn: Calc.workoutBurn(latestWeightKg(), minutes, WORKOUT_MET),
      sets: a.sets.map(function (s) { return { ex: s.ex, set: s.set, weightKg: s.weightKg, reps: num(s.reps), done: s.done }; }),
      finisherResult: a.finisherResult, notes: a.notes
    };
    state.workouts.push(log);
    state.completed[a.key] = log.id;
    state.active = null;
    ui.preview = null;
    save();
    stopRest();
    toast('Workout saved · ' + minutes + ' min · ~' + log.burn + ' kcal');
    ui.view = 'today';
    render();
  }

  function syncClock() {
    clearInterval(clockTimer);
    if (!state.active || !$('#clock')) return;
    var tick = function () {
      var el = $('#clock');
      if (!el || !state.active) return clearInterval(clockTimer);
      var sec = Math.floor((Date.now() - state.active.startedAt) / 1000);
      el.textContent = Math.floor(sec / 60) + ':' + pad(sec % 60);
    };
    tick();
    clockTimer = setInterval(tick, 1000);
  }

  function startRest(seconds) {
    stopRest();
    var end = Date.now() + seconds * 1000;
    var bar = $('#rest-bar');
    bar.hidden = false;
    var tick = function () {
      var left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      $('#rest-time').textContent = Math.floor(left / 60) + ':' + pad(left % 60);
      if (left <= 0) {
        stopRest();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        toast('Rest over — next set');
      }
    };
    tick();
    restTimer = setInterval(tick, 250);
  }
  function stopRest() { clearInterval(restTimer); restTimer = null; $('#rest-bar').hidden = true; }

  // ----- Progress -----
  function viewProgress() {
    var weights = state.weights.slice(-90);
    var start = state.weights.length ? state.weights[0].kg : state.profile.weightKg;
    var current = latestWeightKg();
    var change = current - start;
    var bmi = Calc.bmi(current, state.profile.heightCm);

    var weightChart = weights.length >= 2 ? lineChart(weights) : '<p class="empty">Log your weight on at least two days to see a trend.</p>';

    var t = targets();
    var days = [];
    for (var i = 6; i >= 0; i--) {
      var iso = addDays(todayISO(), -i);
      days.push({ iso: iso, kcal: dayTotals(iso).kcal, logged: dayEntries(iso).length > 0 });
    }
    var loggedDays = days.filter(function (d) { return d.logged; });
    var avg = loggedDays.length ? loggedDays.reduce(function (a, d) { return a + d.kcal; }, 0) / loggedDays.length : 0;

    var totalSessions = Program.TOTAL_WEEKS * Program.DAYS_PER_WEEK;
    var doneCount = Object.keys(state.completed).length;
    var totalMin = state.workouts.reduce(function (a, w) { return a + w.minutes; }, 0);

    return '<h2>Progress</h2>' +
      '<section class="card"><div class="card-head"><h3>Body weight</h3><small>last 90 entries</small></div>' +
      '<div class="grid-3" style="margin-bottom:10px">' +
      stat(fmtW(current), 'Current') +
      stat((change > 0 ? '+' : '') + r1(kgToDisplay(change)) + ' ' + wUnit(), 'Since start') +
      stat(r1(bmi), 'BMI') + '</div>' + weightChart + '</section>' +
      '<section class="card"><div class="card-head"><h3>Calories, last 7 days</h3><small>avg ' + r0(avg) + ' kcal on logged days</small></div>' +
      barChart(days, t.target) + '</section>' +
      '<section class="card"><h3>Training</h3><div class="grid-3">' +
      stat(doneCount + '/' + totalSessions, 'Sessions') + stat(totalMin < 60 ? totalMin + ' min' : r1(totalMin / 60) + ' h', 'Time trained') +
      stat(state.workouts.reduce(function (a, w) { return a + w.burn; }, 0), 'kcal burned') + '</div></section>' +
      personalBests() + testResults() + workoutHistory() + dataCard();
  }

  function stat(value, label) { return '<div class="stat"><strong>' + esc(value) + '</strong><span>' + esc(label) + '</span></div>'; }

  function lineChart(points) {
    var W = 600, H = 220, P = { l: 40, r: 10, t: 10, b: 24 };
    var vals = points.map(function (p) { return kgToDisplay(p.kg); });
    var avg = Calc.movingAverage(vals, 7);
    var min = Math.floor(Math.min.apply(null, vals) - 1), max = Math.ceil(Math.max.apply(null, vals) + 1);
    var x = function (i) { return P.l + (i / (points.length - 1)) * (W - P.l - P.r); };
    var y = function (v) { return P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b); };
    var svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Body weight trend from ' +
      r1(vals[0]) + ' to ' + r1(vals[vals.length - 1]) + ' ' + wUnit() + '">';
    for (var g = 0; g <= 4; g++) {
      var gv = min + (g / 4) * (max - min);
      svg += '<line class="grid" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y(gv) + '" y2="' + y(gv) + '"/>' +
        '<text x="' + (P.l - 6) + '" y="' + (y(gv) + 4) + '" text-anchor="end">' + r1(gv) + '</text>';
    }
    vals.forEach(function (v, i) { svg += '<circle class="dot" cx="' + x(i) + '" cy="' + y(v) + '" r="3"><title>' + points[i].date + ': ' + r1(v) + ' ' + wUnit() + '</title></circle>'; });
    svg += '<polyline class="line" points="' + avg.map(function (v, i) { return x(i) + ',' + y(v); }).join(' ') + '"/>';
    svg += '<text x="' + P.l + '" y="' + (H - 6) + '">' + esc(prettyDate(points[0].date)) + '</text>' +
      '<text x="' + (W - P.r) + '" y="' + (H - 6) + '" text-anchor="end">' + esc(prettyDate(points[points.length - 1].date)) + '</text></svg>';
    return svg + '<div class="legend"><span>● daily weigh-in</span><span>━ 7-entry average (the trend that matters)</span></div>';
  }

  function barChart(days, target) {
    var W = 600, H = 200, P = { l: 40, r: 10, t: 10, b: 24 };
    var max = Math.ceil(Math.max(target * 1.2, Math.max.apply(null, days.map(function (d) { return d.kcal; }))) / 500) * 500;
    var bw = (W - P.l - P.r) / days.length;
    var y = function (v) { return P.t + (1 - v / max) * (H - P.t - P.b); };
    var svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Daily calories for the last 7 days against a target of ' + target + '">';
    [0, 0.5, 1].forEach(function (f) {
      var v = Math.round(max * f);
      svg += '<line class="grid" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
        '<text x="' + (P.l - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '</text>';
    });
    days.forEach(function (d, i) {
      var h = (H - P.t - P.b) - (y(d.kcal) - P.t);
      svg += '<rect class="' + (d.kcal > target ? 'bar-over' : 'bar-ok') + '" x="' + (P.l + i * bw + bw * 0.2) + '" y="' + y(d.kcal) +
        '" width="' + (bw * 0.6) + '" height="' + Math.max(0, h) + '" rx="4"><title>' + d.iso + ': ' + r0(d.kcal) + ' kcal</title></rect>' +
        '<text x="' + (P.l + i * bw + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + parseISO(d.iso).toLocaleDateString(undefined, { weekday: 'short' }) + '</text>';
    });
    svg += '<line class="target" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y(target) + '" y2="' + y(target) + '"/></svg>';
    return svg + '<div class="legend"><span>┄ target ' + target + ' kcal</span><span style="color:var(--warn)">■ over target</span></div>';
  }

  function personalBests() {
    var best = {};
    state.workouts.forEach(function (w) {
      w.sets.forEach(function (s) {
        if (!s.done || !s.reps) return;
        var ex = Program.EXERCISES[s.ex];
        if (!ex) return;
        var score = ex.equip === 'kb' ? Calc.estimated1RM(s.weightKg, s.reps) : s.reps;
        if (!best[s.ex] || score > best[s.ex].score) best[s.ex] = { score: score, set: s, date: w.date };
      });
    });
    var ids = Object.keys(best);
    if (!ids.length) return '';
    return '<section class="card"><h3>Personal bests</h3><ul class="list">' + ids.map(function (id) {
      var ex = Program.EXERCISES[id], b = best[id];
      var label = ex.equip === 'kb' ? fmtW(b.set.weightKg) + ' × ' + b.set.reps : b.set.reps + ' reps / sec';
      return '<li><div class="grow">' + esc(ex.name) + '<br><small>' + prettyDate(b.date) + '</small></div><span class="kcal">' + label + '</span></li>';
    }).join('') + '</ul></section>';
  }

  function testResults() {
    var tests = state.workouts.filter(function (w) { return /^w12d/.test(w.key) && w.finisherResult; });
    if (!tests.length) return '';
    return '<section class="card"><h3>Week 12 test results</h3><ul class="list">' + tests.map(function (w) {
      return '<li><div class="grow">' + esc(keyToSession(w.key).finisher.detail) + '</div><span class="kcal">' + esc(w.finisherResult) + '</span></li>';
    }).join('') + '</ul></section>';
  }

  function workoutHistory() {
    if (!state.workouts.length) return '';
    return '<section class="card"><h3>Recent workouts</h3><ul class="list">' + state.workouts.slice(-10).reverse().map(function (w) {
      var done = w.sets.filter(function (s) { return s.done; }).length;
      return '<li><div class="grow"><div class="name">' + esc(w.title) + '</div><small>' + prettyDate(w.date) + ' · ' + w.minutes + ' min · ' +
        done + '/' + w.sets.length + ' sets' + (w.finisherResult ? ' · finisher: ' + esc(w.finisherResult) : '') + '</small></div>' +
        '<button class="icon-btn" aria-label="Delete workout" data-action="del-workout" data-id="' + w.id + '">×</button></li>';
    }).join('') + '</ul></section>';
  }

  function dataCard() {
    return '<section class="card"><h3>Your data</h3><p><small>Everything is stored only in this browser. Back it up to keep it safe or move it to another device.</small></p>' +
      '<div class="row"><button class="btn btn-ghost btn-small" data-action="export">Back up my data</button>' +
      '<button class="btn btn-ghost btn-small" data-action="restore">Restore backup</button>' +
      '<div class="spacer"></div><button class="btn btn-danger btn-small" data-action="reset">Erase all</button></div></section>';
  }

  // ----- Profile -----
  function viewProfile() {
    var p = state.profile || { name: '', sex: 'male', age: 30, heightCm: 175, weightKg: 80, activity: 'moderate', goal: 'lose', rateKgPerWeek: 0.5, units: 'metric', bellKg: 12 };
    var imp = p.units === 'imperial';
    var heightIn = Calc.cmToIn(p.heightCm);
    var opt = function (val, cur, label) { return '<option value="' + val + '"' + (String(val) === String(cur) ? ' selected' : '') + '>' + label + '</option>'; };
    var rates = imp ? [[0.25, '0.5 lb / week'], [0.5, '1 lb / week'], [0.75, '1.5 lb / week']] : [[0.25, '0.25 kg / week'], [0.5, '0.5 kg / week'], [0.75, '0.75 kg / week']];
    var bells = imp ? [[8, '18 lb'], [12, '26 lb'], [16, '35 lb'], [20, '44 lb'], [24, '53 lb'], [28, '62 lb'], [32, '70 lb']]
      : [[8, '8 kg'], [12, '12 kg'], [16, '16 kg'], [20, '20 kg'], [24, '24 kg'], [28, '28 kg'], [32, '32 kg']];

    return '<h2>' + (state.profile ? 'Profile & targets' : 'Welcome — let’s set your targets') + '</h2>' +
      (state.profile ? '' : '<div class="notice">Your calorie and protein targets are worked out from these details. Nothing leaves your device.</div>') +
      '<form class="card" data-form="profile">' +
      '<label>Name (optional)<input name="name" value="' + esc(p.name) + '" autocomplete="given-name"></label>' +
      '<div class="grid-2"><label>Units<select name="units" data-live>' + opt('metric', p.units, 'Metric (kg, cm)') + opt('imperial', p.units, 'Imperial (lb, ft/in)') + '</select></label>' +
      '<label>Sex (for the BMR formula)<select name="sex">' + opt('male', p.sex, 'Male') + opt('female', p.sex, 'Female') + '</select></label></div>' +
      '<div class="grid-2"><label>Age<input name="age" type="number" min="14" max="100" required value="' + p.age + '"></label>' +
      '<label>Weight (' + (imp ? 'lb' : 'kg') + ')<input name="weight" type="number" step="0.1" min="30" required value="' + r1(imp ? Calc.kgToLb(p.weightKg) : p.weightKg) + '"></label></div>' +
      (imp
        ? '<div class="grid-2"><label>Height (ft)<input name="ft" type="number" min="3" max="8" required value="' + Math.floor(heightIn / 12) + '"></label>' +
          '<label>Height (in)<input name="in" type="number" min="0" max="11.9" step="0.5" required value="' + r1(heightIn % 12) + '"></label></div>'
        : '<label>Height (cm)<input name="height" type="number" min="120" max="230" required value="' + r0(p.heightCm) + '"></label>') +
      '<label>Activity level (outside these workouts too)<select name="activity">' + Object.keys(Calc.ACTIVITY).map(function (k) { return opt(k, p.activity, Calc.ACTIVITY[k].label); }).join('') + '</select></label>' +
      '<div class="grid-2"><label>Goal<select name="goal">' + opt('lose', p.goal, 'Lose fat') + opt('maintain', p.goal, 'Maintain') + opt('gain', p.goal, 'Build muscle') + '</select></label>' +
      '<label>Rate<select name="rate">' + rates.map(function (r) { return opt(r[0], p.rateKgPerWeek, r[1]); }).join('') + '</select></label></div>' +
      '<label>Kettlebell you’ll start with<select name="bell">' + bells.map(function (b) { return opt(b[0], p.bellKg, b[1]); }).join('') + '</select></label>' +
      '<p><small>Not sure? Most beginners start with 12 kg (26 lb) for women or 16 kg (35 lb) for men. You can log any weight per set.</small></p>' +
      '<button class="btn btn-block">' + (state.profile ? 'Save' : 'Calculate my targets') + '</button></form>' +
      (state.profile ? targetsCard() : '');
  }

  function targetsCard() {
    var t = targets();
    return '<section class="card"><h3>Your daily targets</h3><div class="grid-2">' +
      stat(t.bmr + ' kcal', 'Resting burn (BMR)') + stat(t.maintenance + ' kcal', 'Maintenance (TDEE)') +
      stat(t.target + ' kcal', 'Daily target') + stat(t.protein + ' g', 'Protein') +
      stat(t.carbs + ' g', 'Carbs') + stat(t.fat + ' g', 'Fat') + '</div>' +
      (t.clampedToFloor ? '<p style="margin-top:10px"><small>Your target was raised to a safe minimum. Pick a slower rate or raise your activity instead.</small></p>' : '') +
      '<p style="margin-top:10px"><small>Mifflin–St Jeor equation × activity factor. These are estimates: if your weekly average weight isn’t moving as planned after 2–3 weeks, adjust the target by about 100–200 kcal.</small></p></section>';
  }

  function readProfileForm(form) {
    var units = new FormData(form).get('units');
    var p = readProfileFormIn(form, units);
    p.units = units;
    return p;
  }

  // ---------- Add-food modal ----------
  var modalState = null;

  function openAddFood(meal) {
    modalState = { meal: meal, query: '', food: null, servingIdx: 0, qty: 1 };
    var dlg = $('#modal');
    dlg.innerHTML = '<div class="card-head"><h3>Add to ' + esc(meal) + '</h3><button class="icon-btn" data-action="close-modal" aria-label="Close">×</button></div>' +
      '<div id="modal-body"></div>';
    renderFoodSearch();
    dlg.showModal();
    var q = $('#food-q');
    if (q) q.focus();
  }

  function recentFoodIds() {
    var seen = {}, out = [];
    Object.keys(state.foodLog).sort().reverse().forEach(function (d) {
      state.foodLog[d].slice().reverse().forEach(function (e) {
        if (!seen[e.foodId] && findFood(e.foodId)) { seen[e.foodId] = 1; out.push(e.foodId); }
      });
    });
    return out.slice(0, 8);
  }

  function renderFoodSearch() {
    $('#modal-body').innerHTML =
      '<input id="food-q" type="search" placeholder="Search foods (e.g. chicken, oats, banana)" aria-label="Search foods" autocomplete="off" value="' + esc(modalState.query) + '">' +
      '<div class="food-results" id="food-results"></div>' +
      '<p style="margin-top:10px"><button class="btn btn-ghost btn-small" data-action="custom-food">+ Create a custom food</button></p>';
    renderFoodResults();
  }

  function renderFoodResults() {
    var q = modalState.query.trim().toLowerCase();
    var list;
    if (!q) {
      var recent = recentFoodIds().map(findFood);
      list = recent.length ? recent : allFoods().slice(0, 20);
    } else {
      var terms = q.split(/\s+/);
      list = allFoods().filter(function (f) {
        var hay = (f.name + ' ' + f.category).toLowerCase();
        return terms.every(function (t) { return hay.indexOf(t) !== -1; });
      }).slice(0, 40);
    }
    $('#food-results').innerHTML = (!q && recentFoodIds().length ? '<small>Recent</small>' : '') +
      (list.length ? list.map(function (f) {
        var s = f.servings[0];
        return '<button type="button" data-action="pick-food" data-id="' + esc(f.id) + '"><span>' + esc(f.name) +
          (f.custom ? ' <span class="pill">mine</span>' : '') + '</span><small>' + r0(f.kcal * s.grams / 100) + ' kcal / ' + esc(s.label) + '</small></button>';
      }).join('') : '<p class="empty">No match. Try another word or create a custom food.</p>');
  }

  function servingOptions(food) {
    return food.servings.concat([{ label: 'grams', grams: 1 }]);
  }

  function renderFoodDetail() {
    var f = modalState.food;
    var opts = servingOptions(f);
    var s = opts[modalState.servingIdx];
    var grams = s.grams * modalState.qty;
    var n = Calc.nutritionFor(f, grams);
    $('#modal-body').innerHTML =
      '<p><button class="btn btn-ghost btn-small" data-action="back-search">‹ Back</button></p>' +
      '<h3>' + esc(f.name) + '</h3><p><small>' + r0(f.kcal) + ' kcal per 100 g · ' + esc(f.category) + '</small></p>' +
      '<div class="grid-2"><label>Amount<input id="food-qty" type="number" min="0" step="any" inputmode="decimal" value="' + modalState.qty + '"></label>' +
      '<label>Unit<select id="food-serving">' + opts.map(function (o, i) {
        return '<option value="' + i + '"' + (i === modalState.servingIdx ? ' selected' : '') + '>' + esc(o.label) + (o.grams !== 1 ? ' (' + o.grams + ' g)' : '') + '</option>';
      }).join('') + '</select></label></div>' +
      '<div class="grid-2" id="food-preview">' + previewStats(n, grams) + '</div>' +
      '<p style="margin-top:12px"><button class="btn btn-block" data-action="add-entry">Add to ' + esc(modalState.meal) + '</button></p>';
  }

  function previewStats(n, grams) {
    return stat(r0(n.kcal) + ' kcal', r0(grams) + ' g') + stat(r1(n.protein) + ' g', 'Protein') + stat(r1(n.carbs) + ' g', 'Carbs') + stat(r1(n.fat) + ' g', 'Fat');
  }

  function updateFoodPreview() {
    var opts = servingOptions(modalState.food);
    var grams = opts[modalState.servingIdx].grams * modalState.qty;
    $('#food-preview').innerHTML = previewStats(Calc.nutritionFor(modalState.food, grams), grams);
  }

  function addEntry() {
    var f = modalState.food;
    var s = servingOptions(f)[modalState.servingIdx];
    var grams = s.grams * modalState.qty;
    if (!(grams > 0)) return toast('Enter an amount above zero');
    var n = Calc.nutritionFor(f, grams);
    var label = s.grams === 1 ? r0(grams) + ' g' : modalState.qty + ' × ' + s.label;
    var iso = ui.foodDate;
    (state.foodLog[iso] = state.foodLog[iso] || []).push({
      id: uid(), foodId: f.id, name: f.name, meal: modalState.meal, grams: grams, amountLabel: label,
      kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat
    });
    save();
    $('#modal').close();
    toast('Added ' + f.name + ' · ' + r0(n.kcal) + ' kcal');
    render();
  }

  function renderCustomFoodForm() {
    $('#modal-body').innerHTML =
      '<p><button class="btn btn-ghost btn-small" data-action="back-search">‹ Back</button></p>' +
      '<form data-form="custom-food"><p><small>Copy the numbers from the nutrition label. Enter values for one serving.</small></p>' +
      '<label>Food name<input name="name" required></label>' +
      '<div class="grid-2"><label>Serving name<input name="slabel" placeholder="1 bar" required></label>' +
      '<label>Serving size (g or ml)<input name="sgrams" type="number" min="1" step="any" required></label></div>' +
      '<div class="grid-2"><label>Calories<input name="kcal" type="number" min="0" step="any" required></label>' +
      '<label>Protein (g)<input name="protein" type="number" min="0" step="any" value="0"></label>' +
      '<label>Carbs (g)<input name="carbs" type="number" min="0" step="any" value="0"></label>' +
      '<label>Fat (g)<input name="fat" type="number" min="0" step="any" value="0"></label></div>' +
      '<button class="btn btn-block">Save food</button></form>';
  }

  // ---------- Events ----------
  document.addEventListener('click', function (e) {
    var tab = e.target.closest('#tabs button');
    if (tab) { ui.view = tab.dataset.view; ui.preview = null; render(); window.scrollTo(0, 0); return; }

    var el = e.target.closest('[data-action]');
    if (!el) return;
    var action = el.dataset.action;

    switch (action) {
      case 'goto': ui.view = el.dataset.view; render(); window.scrollTo(0, 0); break;
      case 'day':
        ui.foodDate = addDays(ui.foodDate, Number(el.dataset.delta));
        if (ui.foodDate > todayISO()) ui.foodDate = todayISO();
        render(); break;
      case 'add-food': openAddFood(el.dataset.meal); break;
      case 'close-modal': $('#modal').close(); break;
      case 'pick-food':
        modalState.food = findFood(el.dataset.id); modalState.servingIdx = 0; modalState.qty = 1;
        renderFoodDetail(); break;
      case 'back-search': renderFoodSearch(); break;
      case 'custom-food': renderCustomFoodForm(); break;
      case 'add-entry': addEntry(); break;
      case 'del-entry':
        state.foodLog[ui.foodDate] = dayEntries(ui.foodDate).filter(function (x) { return x.id !== el.dataset.id; });
        save(); render(); break;
      case 'preview': ui.preview = el.dataset.key; render(); window.scrollTo(0, 0); break;
      case 'start':
        var key = el.dataset.key;
        if (state.active) return ask('You have a workout in progress. Discard it and start this one?', 'Discard and start', function () { startWorkout(key); });
        startWorkout(key); break;
      case 'finish':
        if (!state.active.sets.some(function (s) { return s.done; })) return ask('No sets are ticked as done. Save the workout anyway?', 'Save workout', finishWorkout);
        finishWorkout(); break;
      case 'discard':
        ask('Discard this workout? Nothing will be saved.', 'Discard', function () { state.active = null; save(); stopRest(); render(); });
        break;
      case 'rest-skip': stopRest(); break;
      case 'restart-program':
        ask('Clear all program check-marks and start again from week 1? Your workout history is kept.', 'Restart program', function () {
          state.completed = {}; ui.preview = null; save(); render();
        });
        break;
      case 'del-workout':
        var wid = el.dataset.id;
        ask('Delete this workout from your history?', 'Delete', function () {
          state.workouts = state.workouts.filter(function (w) { return w.id !== wid; });
          Object.keys(state.completed).forEach(function (k) { if (state.completed[k] === wid) delete state.completed[k]; });
          save(); render();
        });
        break;
      case 'export': exportData(); break;
      case 'download-backup': downloadBackup(); break;
      case 'copy-backup': copyBackup(); break;
      case 'restore': openRestore(); break;
      case 'restore-go': restoreFromText($('#restore-text').value); break;
      case 'reset':
        ask('Erase ALL data (profile, food log, workouts)? This cannot be undone.', 'Erase everything', function () {
          state = defaultState(); save(); ui.view = 'profile'; render();
        });
        break;
    }
  });

  /** In-page confirmation (native confirm() is blocked in some embedded viewers). */
  function ask(message, yesLabel, onYes) {
    var dlg = $('#modal');
    dlg.innerHTML = '<p>' + esc(message) + '</p><div class="row" style="justify-content:flex-end">' +
      '<button type="button" class="btn btn-ghost" data-action="close-modal">Cancel</button>' +
      '<button type="button" class="btn" id="ask-yes">' + esc(yesLabel) + '</button></div>';
    $('#ask-yes').onclick = function () { dlg.close(); onYes(); };
    if (!dlg.open) dlg.showModal();
  }

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'food-q') { modalState.query = t.value; renderFoodResults(); return; }
    if (t.id === 'food-qty') { modalState.qty = num(t.value); updateFoodPreview(); return; }
    if (state.active && t.dataset.field) updateActive(t);
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'food-serving') {
      var prev = servingOptions(modalState.food)[modalState.servingIdx].grams * modalState.qty;
      modalState.servingIdx = Number(t.value);
      // Switching to grams keeps the same amount of food.
      if (servingOptions(modalState.food)[modalState.servingIdx].grams === 1) { modalState.qty = r0(prev); $('#food-qty').value = modalState.qty; }
      updateFoodPreview(); return;
    }
    if (t.name === 'units' && t.hasAttribute('data-live')) {
      // Re-render the profile form in the chosen units, keeping what was typed.
      var prevUnits = t.value === 'imperial' ? 'metric' : 'imperial'; // values on screen are still in the old units
      var vals = readProfileFormIn(t.form, prevUnits);
      vals.units = t.value;
      var keep = state.profile;
      state.profile = vals;
      $('#main').innerHTML = viewProfile();
      state.profile = keep;
      return;
    }
    if (t.dataset.action === 'import' && t.files[0]) importData(t.files[0]);
    if (state.active && t.dataset.field === 'done') {
      updateActive(t);
      t.closest('tr').classList.toggle('done', t.checked);
      if (t.checked) startRest(Number(t.dataset.rest));
    }
  });

  function readProfileFormIn(form, units) {
    var f = new FormData(form);
    var weight = num(f.get('weight'));
    return {
      name: String(f.get('name') || '').trim(), sex: f.get('sex'), age: num(f.get('age')),
      weightKg: units === 'imperial' ? Calc.lbToKg(weight) : weight,
      heightCm: units === 'imperial' ? Calc.inToCm(num(f.get('ft')) * 12 + num(f.get('in'))) : num(f.get('height')),
      activity: f.get('activity'), goal: f.get('goal'), rateKgPerWeek: num(f.get('rate')), bellKg: num(f.get('bell'))
    };
  }

  function updateActive(t) {
    var a = state.active;
    if (t.dataset.field === 'finisher') a.finisherResult = t.value;
    else if (t.dataset.field === 'notes') a.notes = t.value;
    else {
      var s = a.sets[Number(t.dataset.set)];
      if (t.dataset.field === 'weight') {
        s.weightKg = displayToKg(num(t.value));
        // Carry a new weight forward to later, untouched sets of the same exercise.
        a.sets.forEach(function (o, i) {
          if (i > Number(t.dataset.set) && o.ex === s.ex && !o.done) {
            o.weightKg = s.weightKg;
            var inp = document.querySelector('[data-set="' + i + '"][data-field="weight"]');
            if (inp) inp.value = t.value;
          }
        });
      }
      if (t.dataset.field === 'reps') s.reps = t.value;
      if (t.dataset.field === 'done') s.done = t.checked;
    }
    save();
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    var kind = form.dataset.form;
    if (!kind) return;
    e.preventDefault();
    if (kind === 'profile') {
      var first = !state.profile;
      state.profile = readProfileForm(form);
      if (first && !state.weights.length) state.weights.push({ date: todayISO(), kg: state.profile.weightKg });
      save();
      toast(first ? 'Targets set — you’re ready to go' : 'Profile saved');
      ui.view = first ? 'today' : 'profile';
      render();
    } else if (kind === 'weight') {
      var kg = displayToKg(num(form.w.value));
      if (!(kg > 20)) return toast('Enter a valid weight');
      var iso = todayISO();
      state.weights = state.weights.filter(function (w) { return w.date !== iso; });
      state.weights.push({ date: iso, kg: kg });
      state.weights.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      state.profile.weightKg = kg; // keeps calorie targets current
      save();
      toast('Weight logged: ' + fmtW(kg));
      render();
    } else if (kind === 'custom-food') {
      var f = new FormData(form);
      var g = num(f.get('sgrams'));
      var per100 = function (v) { return r1(num(v) * 100 / g); };
      var food = {
        id: 'custom-' + uid(), custom: true, name: String(f.get('name')).trim(), category: 'My foods',
        kcal: per100(f.get('kcal')), protein: per100(f.get('protein')), carbs: per100(f.get('carbs')), fat: per100(f.get('fat')),
        servings: [{ label: String(f.get('slabel')).trim(), grams: g }]
      };
      state.customFoods.unshift(food);
      save();
      modalState.food = food; modalState.servingIdx = 0; modalState.qty = 1;
      renderFoodDetail();
    }
  });

  // ---------- Backup ----------
  function backupText() { return JSON.stringify(state); }

  function exportData() {
    var dlg = $('#modal');
    dlg.innerHTML = '<div class="card-head"><h3>Backup</h3><button class="icon-btn" data-action="close-modal" aria-label="Close">×</button></div>' +
      '<p><small>Copy this text and keep it somewhere safe (a note or an email to yourself). Paste it into “Restore backup” on any device.</small></p>' +
      '<textarea id="backup-text" rows="6" readonly>' + esc(backupText()) + '</textarea>' +
      '<div class="row" style="margin-top:10px"><button type="button" class="btn" data-action="copy-backup">Copy</button>' +
      '<button type="button" class="btn btn-ghost" data-action="download-backup">Download file</button></div>';
    dlg.showModal();
  }

  function copyBackup() {
    var ta = $('#backup-text');
    var fallback = function () { ta.focus(); ta.select(); toast('Selected — copy it with your keyboard or long-press'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ta.value).then(function () { toast('Backup copied'); }, fallback);
    } else fallback();
  }

  function downloadBackup() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bell-and-fork-backup-' + todayISO() + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function openRestore() {
    var dlg = $('#modal');
    dlg.innerHTML = '<div class="card-head"><h3>Restore backup</h3><button class="icon-btn" data-action="close-modal" aria-label="Close">×</button></div>' +
      '<p><small>Paste your backup text, or choose a backup file. This replaces everything currently in the app.</small></p>' +
      '<textarea id="restore-text" rows="6" placeholder="Paste backup here"></textarea>' +
      '<label style="margin-top:10px">Or choose a file<input id="restore-file" type="file" accept="application/json,.json" data-action="import"></label>' +
      '<button type="button" class="btn btn-block" data-action="restore-go">Replace my data with this backup</button>';
    dlg.showModal();
  }

  function restoreFromText(text) {
    try {
      var data = JSON.parse(text);
      if (!data || data.version !== 1) throw new Error('bad backup');
      state = Object.assign(defaultState(), data);
      save(); $('#modal').close(); ui.view = 'today'; render(); toast('Backup restored');
    } catch (err) { toast('That isn’t a valid backup. Paste the full text you copied.'); }
  }

  function importData(file) {
    var reader = new FileReader();
    reader.onload = function () { $('#restore-text').value = reader.result; };
    reader.readAsText(file);
  }

  render();
})();
