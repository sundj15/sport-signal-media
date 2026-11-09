/* Run with: node test/run-tests.js */
'use strict';
var assert = require('assert');
var Calc = require('../js/calc.js');
var FOODS = require('../js/foods.js');
var Program = require('../js/program.js');

var passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + '\n    ' + e.message); process.exitCode = 1; }
}
function near(a, b, tol, msg) { assert.ok(Math.abs(a - b) <= tol, (msg || '') + ' expected ' + b + ' ± ' + tol + ', got ' + a); }

console.log('Calc');
var male = { sex: 'male', age: 30, heightCm: 180, weightKg: 80, activity: 'moderate', goal: 'lose', rateKgPerWeek: 0.5 };

test('Mifflin–St Jeor BMR (male)', function () { near(Calc.bmr(male), 1780, 0.01); });
test('Mifflin–St Jeor BMR (female)', function () {
  near(Calc.bmr({ sex: 'female', age: 30, heightCm: 165, weightKg: 60 }), 10 * 60 + 6.25 * 165 - 150 - 161, 0.01);
});
test('TDEE applies activity factor', function () { near(Calc.tdee(male), 1780 * 1.55, 0.01); });
test('0.5 kg/week loss = 550 kcal/day deficit', function () {
  var t = Calc.calorieTarget(male);
  near(t.target, 1780 * 1.55 - 550, 10);
  assert.strictEqual(t.clampedToFloor, false);
});
test('target never drops below the safe floor', function () {
  var t = Calc.calorieTarget({ sex: 'female', age: 60, heightCm: 150, weightKg: 45, activity: 'sedentary', goal: 'lose', rateKgPerWeek: 0.75 });
  assert.strictEqual(t.target, 1200);
  assert.strictEqual(t.clampedToFloor, true);
});
test('maintain ignores rate; gain adds surplus', function () {
  assert.strictEqual(Calc.calorieTarget(Object.assign({}, male, { goal: 'maintain' })).target, Calc.round(Calc.tdee(male), 10));
  assert.ok(Calc.calorieTarget(Object.assign({}, male, { goal: 'gain', rateKgPerWeek: 0.25 })).target > Calc.tdee(male));
});
test('macros add back up to the calorie target', function () {
  var m = Calc.macroTargets(male, 2200);
  near(m.protein * 4 + m.carbs * 4 + m.fat * 9, 2200, 15);
  assert.strictEqual(m.protein, 160);
});
test('nutritionFor scales per-100g values', function () {
  var n = Calc.nutritionFor({ kcal: 165, protein: 31, carbs: 0, fat: 3.6 }, 200);
  near(n.kcal, 330, 0.001); near(n.protein, 62, 0.001);
});
test('unit conversions round-trip', function () {
  near(Calc.kgToLb(Calc.lbToKg(180)), 180, 1e-9);
  near(Calc.inToCm(70), 177.8, 1e-9);
});
test('workout burn = MET × kg × hours', function () { assert.strictEqual(Calc.workoutBurn(80, 45, 7), 420); });
test('estimated 1RM (Epley)', function () { near(Calc.estimated1RM(16, 10), 21.33, 0.01); assert.strictEqual(Calc.estimated1RM(24, 1), 24); });
test('moving average', function () { assert.deepStrictEqual(Calc.movingAverage([2, 4, 6, 8], 2), [2, 3, 5, 7]); });

console.log('Foods');
test('ids are unique', function () {
  var ids = FOODS.map(function (f) { return f.id; });
  assert.strictEqual(new Set(ids).size, ids.length);
});
test('every food has sane numbers and at least one serving', function () {
  FOODS.forEach(function (f) {
    ['kcal', 'protein', 'carbs', 'fat'].forEach(function (k) { assert.ok(typeof f[k] === 'number' && f[k] >= 0, f.id + '.' + k); });
    assert.ok(f.protein + f.carbs + f.fat <= 100.5, f.id + ' macros exceed 100 g per 100 g');
    assert.ok(f.servings.length && f.servings.every(function (s) { return s.grams > 0; }), f.id + ' servings');
  });
});
test('calories roughly match 4/4/9 macro math (allowing for fibre/alcohol)', function () {
  FOODS.forEach(function (f) {
    if (f.category === 'Drinks') return; // alcohol carries 7 kcal/g
    var est = f.protein * 4 + f.carbs * 4 + f.fat * 9;
    assert.ok(Math.abs(est - f.kcal) <= Math.max(25, f.kcal * 0.15), f.id + ': listed ' + f.kcal + ', macros give ' + Math.round(est));
  });
});

console.log('Program');
test('12 weeks × 3 sessions = 36 sessions', function () { assert.strictEqual(Program.allSessions().length, 36); });
test('every block references a known exercise and has 4 weeks of sets/reps', function () {
  Program.PHASES.forEach(function (ph) {
    assert.strictEqual(ph.weeks.length, 4);
    ph.days.forEach(function (d) {
      d.blocks.forEach(function (b) {
        assert.ok(Program.EXERCISES[b.ex], 'unknown exercise ' + b.ex);
        assert.strictEqual(b.sets.length, 4, b.ex + ' sets'); assert.strictEqual(b.reps.length, 4, b.ex + ' reps');
      });
      assert.strictEqual(d.finisher.byWeek.length, 4, d.name + ' finisher');
    });
  });
});
test('4th week of every phase is a deload with fewer total sets', function () {
  Program.PHASES.forEach(function (ph) {
    var vol = function (w) { var t = 0; for (var d = 0; d < 3; d++) Program.getSession(w, d).blocks.forEach(function (b) { t += b.sets; }); return t; };
    assert.ok(Program.getSession(ph.weeks[3], 0).deload);
    assert.ok(vol(ph.weeks[3]) < vol(ph.weeks[2]), ph.name + ' deload volume');
  });
});
test('week 12 contains the three tests', function () {
  for (var d = 0; d < 3; d++) assert.ok(/^TEST/.test(Program.getSession(12, d).finisher.detail));
});
test('nextSession walks forward and ends at null', function () {
  var done = {};
  assert.strictEqual(Program.nextSession(done).key, 'w1d0');
  done.w1d0 = 'x';
  assert.strictEqual(Program.nextSession(done).key, 'w1d1');
  Program.allSessions().forEach(function (s) { done[s.key] = 'x'; });
  assert.strictEqual(Program.nextSession(done), null);
});
test('every exercise has cues and easier/harder options', function () {
  Object.keys(Program.EXERCISES).forEach(function (id) {
    var ex = Program.EXERCISES[id];
    assert.ok(ex.cues.length >= 2 && ex.easier && ex.harder && /^(kb|bw)$/.test(ex.equip), id);
  });
});

console.log('Demos');
var Demos = require('../js/demos.js');
test('every exercise has an animated demo with valid joint positions', function () {
  Object.keys(Program.EXERCISES).forEach(function (id) {
    var anim = Demos.ANIM[id];
    assert.ok(anim && anim.frames.length >= 1, 'missing demo for ' + id);
    anim.frames.forEach(function (f, i) {
      var j = Demos.solve(Demos.normalize(f));
      Object.keys(j).forEach(function (k) {
        if (Array.isArray(j[k]) && typeof j[k][0] === 'number') assert.ok(isFinite(j[k][0]) && isFinite(j[k][1]), id + ' frame ' + i + ' ' + k);
      });
    });
  });
});
test('video links search YouTube for the exercise', function () {
  assert.ok(/^https:\/\/www\.youtube\.com\/results\?search_query=Turkish/.test(Demos.videoUrl(Program.EXERCISES.tgu)));
});

console.log('\n' + passed + ' passed' + (process.exitCode ? ', some FAILED' : ''));
