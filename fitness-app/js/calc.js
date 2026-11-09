/* Nutrition and training math. Works in the browser (window.Calc) and in Node (require). */
(function (root) {
  'use strict';

  var KG_PER_LB = 0.45359237;
  var CM_PER_IN = 2.54;
  var KCAL_PER_KG_FAT = 7700;

  var ACTIVITY = {
    sedentary: { factor: 1.2, label: 'Sedentary (desk job, little exercise)' },
    light: { factor: 1.375, label: 'Light (exercise 1–3 days/week)' },
    moderate: { factor: 1.55, label: 'Moderate (exercise 3–5 days/week)' },
    active: { factor: 1.725, label: 'Active (hard exercise 6–7 days/week)' },
    athlete: { factor: 1.9, label: 'Very active (physical job + training)' }
  };

  function round(n, step) {
    step = step || 1;
    return Math.round(n / step) * step;
  }

  function lbToKg(lb) { return lb * KG_PER_LB; }
  function kgToLb(kg) { return kg / KG_PER_LB; }
  function inToCm(inches) { return inches * CM_PER_IN; }
  function cmToIn(cm) { return cm / CM_PER_IN; }

  /** Mifflin-St Jeor resting energy expenditure, kcal/day. */
  function bmr(p) {
    var base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
    return p.sex === 'female' ? base - 161 : base + 5;
  }

  /** Total daily energy expenditure, kcal/day. */
  function tdee(p) {
    var a = ACTIVITY[p.activity] || ACTIVITY.moderate;
    return bmr(p) * a.factor;
  }

  /**
   * Daily calorie target from goal and weekly rate (kg/week).
   * goal: 'lose' | 'maintain' | 'gain'. Never goes below a safe floor.
   */
  function calorieTarget(p) {
    var maintenance = tdee(p);
    var rate = Math.abs(Number(p.rateKgPerWeek) || 0);
    var dailyDelta = (rate * KCAL_PER_KG_FAT) / 7;
    var target = maintenance;
    if (p.goal === 'lose') target = maintenance - dailyDelta;
    if (p.goal === 'gain') target = maintenance + dailyDelta;
    var floor = p.sex === 'female' ? 1200 : 1500;
    var clamped = target < floor;
    return {
      bmr: round(bmr(p)),
      maintenance: round(maintenance),
      target: round(Math.max(target, floor), 10),
      clampedToFloor: clamped
    };
  }

  /**
   * Macro targets in grams. Protein scales with body weight (higher when cutting
   * to protect muscle), fat is 25% of calories, carbs fill the rest.
   */
  function macroTargets(p, kcal) {
    var proteinPerKg = p.goal === 'lose' ? 2.0 : 1.8;
    var protein = p.weightKg * proteinPerKg;
    var fat = (kcal * 0.25) / 9;
    var carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
    return { protein: round(protein), carbs: round(carbs), fat: round(fat) };
  }

  /** Nutrition for an amount (grams) of a food whose values are per 100 g. */
  function nutritionFor(food, grams) {
    var f = grams / 100;
    return {
      kcal: food.kcal * f,
      protein: food.protein * f,
      carbs: food.carbs * f,
      fat: food.fat * f
    };
  }

  function sumNutrition(entries) {
    return entries.reduce(function (acc, e) {
      acc.kcal += e.kcal; acc.protein += e.protein; acc.carbs += e.carbs; acc.fat += e.fat;
      return acc;
    }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  }

  /**
   * Estimated calories burned: MET x body weight (kg) x hours.
   * Kettlebell circuits ≈ 8 MET (vigorous circuit training); steady strength work ≈ 5.
   */
  function workoutBurn(weightKg, minutes, met) {
    return round((met || 6) * weightKg * (minutes / 60));
  }

  /** Estimated one-rep max (Epley). Used for personal-record tracking. */
  function estimated1RM(weight, reps) {
    if (!weight || !reps) return 0;
    return reps === 1 ? weight : weight * (1 + reps / 30);
  }

  /** Body mass index. */
  function bmi(weightKg, heightCm) {
    var m = heightCm / 100;
    return weightKg / (m * m);
  }

  /** Simple moving average over the last n points for a smoothed weight trend. */
  function movingAverage(values, n) {
    return values.map(function (_, i) {
      var start = Math.max(0, i - n + 1);
      var slice = values.slice(start, i + 1);
      return slice.reduce(function (a, b) { return a + b; }, 0) / slice.length;
    });
  }

  var Calc = {
    ACTIVITY: ACTIVITY,
    round: round,
    lbToKg: lbToKg, kgToLb: kgToLb, inToCm: inToCm, cmToIn: cmToIn,
    bmr: bmr, tdee: tdee, calorieTarget: calorieTarget, macroTargets: macroTargets,
    nutritionFor: nutritionFor, sumNutrition: sumNutrition,
    workoutBurn: workoutBurn, estimated1RM: estimated1RM, bmi: bmi,
    movingAverage: movingAverage
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Calc;
  else root.Calc = Calc;
})(this);
