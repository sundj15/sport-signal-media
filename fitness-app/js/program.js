/*
 * 12-week kettlebell + bodyweight program. 3 sessions per week (A/B/C), e.g. Mon/Wed/Fri.
 *
 *   Phase 1  Weeks 1–4   Foundation   learn the hinge, squat, press, row and get-up
 *   Phase 2  Weeks 5–8   Strength     heavier single-bell work, harder bodyweight levels
 *   Phase 3  Weeks 9–12  Power        ballistics (snatch, push press), complexes, conditioning
 *
 * The 4th week of every phase is a lighter deload week; week 12 doubles as a test week.
 * Each block lists sets and reps per week of the phase: [wk1, wk2, wk3, wk4].
 */
(function (root) {
  'use strict';

  var EXERCISES = {
    // ---- Kettlebell ----
    'kb-deadlift': { name: 'Kettlebell deadlift', equip: 'kb', pattern: 'Hinge',
      cues: ['Bell between the feet, shins vertical', 'Push hips back, flat back, chest proud', 'Stand by driving the floor away; squeeze glutes at the top'],
      easier: 'Elevate the bell on a step', harder: 'Single-leg deadlift' },
    'goblet-squat': { name: 'Goblet squat', equip: 'kb', pattern: 'Squat',
      cues: ['Hold the bell by the horns at the chest', 'Elbows track inside the knees', 'Sit between the heels, keep the chest up'],
      easier: 'Squat to a box', harder: 'Front-rack squat' },
    'swing-2h': { name: 'Two-hand swing', equip: 'kb', pattern: 'Hinge (ballistic)',
      cues: ['Hike the bell back high between the thighs', 'Snap the hips — arms are just ropes', 'Bell floats to chest height; brace at the top'],
      easier: 'Deadlift + hip snap without the bell', harder: 'One-arm swing' },
    'swing-1h': { name: 'One-arm swing', equip: 'kb', pattern: 'Hinge (ballistic)',
      cues: ['Same hip snap as the two-hand swing', 'Keep shoulders square, resist the rotation', 'Switch hands at the top when alternating'],
      easier: 'Two-hand swing', harder: 'Heavier bell' },
    'row-1a': { name: 'One-arm row', equip: 'kb', pattern: 'Pull',
      cues: ['Free hand on a bench or knee, flat back', 'Pull the elbow to the hip, not the shoulder', 'Pause at the top, lower slowly'],
      easier: 'Lighter bell', harder: 'Renegade row' },
    'renegade-row': { name: 'Renegade row', equip: 'kb', pattern: 'Pull + core',
      cues: ['High plank on the bell handles, feet wide', 'Row one bell without twisting the hips', 'Alternate sides'],
      easier: 'One-arm row', harder: 'Narrower stance' },
    'hk-press': { name: 'Half-kneeling press', equip: 'kb', pattern: 'Push (vertical)',
      cues: ['Down knee on the side of the pressing arm', 'Squeeze the glute of the down leg', 'Press up and slightly back; bicep by the ear'],
      easier: 'Lighter bell', harder: 'Standing press' },
    'clean-press': { name: 'Clean & press', equip: 'kb', pattern: 'Hinge + push',
      cues: ['Clean the bell to the rack — zip it up close to the body', 'Pause in the rack, brace', 'Press to lockout, lower to the rack, then back to the hike'],
      easier: 'Half-kneeling press', harder: 'Push press' },
    'push-press': { name: 'Push press', equip: 'kb', pattern: 'Push (power)',
      cues: ['Short quick dip at the knees from the rack', 'Drive with the legs, finish with the arm', 'Lower under control'],
      easier: 'Clean & press', harder: 'Heavier bell' },
    'floor-press': { name: 'Floor press', equip: 'kb', pattern: 'Push (horizontal)',
      cues: ['Lie on the floor, bell in one hand', 'Upper arm at 45° to the body', 'Press to lockout, lower until the elbow touches'],
      easier: 'Two hands on the bell', harder: 'Heavier bell' },
    'front-squat': { name: 'Front-rack squat', equip: 'kb', pattern: 'Squat',
      cues: ['Bell in the rack position, wrist straight', 'Brace and sit down between the heels', 'Do not let the bell pull you forward'],
      easier: 'Goblet squat', harder: 'Two bells' },
    'sl-rdl': { name: 'Single-leg RDL', equip: 'kb', pattern: 'Hinge (unilateral)',
      cues: ['Bell in the hand opposite the standing leg', 'Hips stay level; back leg reaches long', 'Soft standing knee, flat back'],
      easier: 'Kickstand RDL (back toe down)', harder: 'Heavier bell' },
    'tgu': { name: 'Turkish get-up', equip: 'kb', pattern: 'Full body',
      cues: ['Eyes on the bell the whole way up', 'Roll to elbow → hand → bridge → sweep the leg → stand', 'Reverse every step to come down; go slowly'],
      easier: 'Half get-up (to the hand only)', harder: 'Heavier bell' },
    'half-tgu': { name: 'Half get-up', equip: 'kb', pattern: 'Full body',
      cues: ['Press the bell up from the floor, arm locked', 'Roll to the elbow, then the hand', 'Bridge the hips, then reverse'],
      easier: 'Shoe balanced on the fist instead of a bell', harder: 'Full Turkish get-up' },
    'snatch': { name: 'Kettlebell snatch', equip: 'kb', pattern: 'Hinge (power)',
      cues: ['Swing path, then pull the elbow back', 'Punch the hand through so the bell lands softly', 'Lock out overhead, drop back into the hike'],
      easier: 'High pull', harder: 'Heavier bell' },
    'high-pull': { name: 'High pull', equip: 'kb', pattern: 'Hinge + pull',
      cues: ['Swing, then pull the elbow high and back at the top', 'Bell stays close to the body', 'Let it fall back into the swing'],
      easier: 'One-arm swing', harder: 'Snatch' },
    'suitcase-carry': { name: 'Suitcase carry', equip: 'kb', pattern: 'Carry',
      cues: ['Heavy bell in one hand', 'Walk tall — do not lean toward the bell', 'Slow, controlled steps'],
      easier: 'Lighter bell', harder: 'Overhead carry' },
    'lateral-lunge': { name: 'Goblet lateral lunge', equip: 'kb', pattern: 'Squat (lateral)',
      cues: ['Step wide, sit back into one hip', 'Other leg straight, foot flat', 'Push back to the start'],
      easier: 'Bodyweight', harder: 'Heavier bell' },
    'halo': { name: 'Halo', equip: 'kb', pattern: 'Shoulders',
      cues: ['Hold the bell upside-down by the horns', 'Circle it close around the head', 'Ribs down, glutes tight'],
      easier: 'Lighter bell', harder: 'Half-kneeling' },
    'kb-complex': { name: 'KB complex: clean → front squat → press → reverse lunge', equip: 'kb', pattern: 'Full body',
      cues: ['All reps on one side, then switch without putting the bell down if you can', 'Pick a bell you can press 8 times', 'Quality over speed'],
      easier: 'Drop the press', harder: 'Heavier bell' },

    // ---- Bodyweight ----
    'push-up': { name: 'Push-up', equip: 'bw', pattern: 'Push (horizontal)',
      cues: ['Hands under the shoulders, body in one line', 'Elbows 45° from the body', 'Chest to fist height, full lockout'],
      easier: 'Incline push-up (hands on a bench)', harder: 'Decline push-up' },
    'decline-push-up': { name: 'Decline push-up', equip: 'bw', pattern: 'Push (horizontal)',
      cues: ['Feet on a bench or step', 'Keep the hips from sagging', 'Full range of motion'],
      easier: 'Push-up', harder: 'Archer push-up' },
    'explosive-push-up': { name: 'Explosive push-up', equip: 'bw', pattern: 'Push (power)',
      cues: ['Lower under control', 'Push hard enough for the hands to leave the floor', 'Land soft, reset each rep'],
      easier: 'Fast push-up, hands stay down', harder: 'Clap push-up' },
    'pike-push-up': { name: 'Pike push-up', equip: 'bw', pattern: 'Push (vertical)',
      cues: ['Hips high, body in an upside-down V', 'Lower the head in front of the hands', 'Press back to the V'],
      easier: 'Hands on a bench', harder: 'Feet elevated' },
    'glute-bridge': { name: 'Glute bridge', equip: 'bw', pattern: 'Hinge',
      cues: ['Feet flat, close to the hips', 'Drive through the heels, ribs down', 'Squeeze the glutes for 1 s at the top'],
      easier: 'Smaller range', harder: 'Single-leg bridge' },
    'sl-bridge': { name: 'Single-leg glute bridge', equip: 'bw', pattern: 'Hinge (unilateral)',
      cues: ['One foot down, other knee to the chest', 'Hips stay level', 'Pause at the top'],
      easier: 'Glute bridge', harder: 'Shoulders on a bench' },
    'reverse-lunge': { name: 'Reverse lunge', equip: 'bw', pattern: 'Squat (unilateral)',
      cues: ['Step back, back knee kisses the floor', 'Front shin near vertical', 'Push through the front heel to stand'],
      easier: 'Hold a wall for balance', harder: 'Hold a bell goblet-style' },
    'split-squat': { name: 'Bulgarian split squat', equip: 'bw', pattern: 'Squat (unilateral)',
      cues: ['Rear foot on a bench', 'Drop straight down', 'Front knee tracks over the toes'],
      easier: 'Split squat with the rear foot on the floor', harder: 'Hold a bell' },
    'pistol-box': { name: 'Box pistol squat', equip: 'bw', pattern: 'Squat (unilateral)',
      cues: ['Stand on one leg in front of a box or chair', 'Sit to the box with the other leg out front', 'Stand without rocking'],
      easier: 'Higher box', harder: 'Lower box / full pistol' },
    'squat-jump': { name: 'Squat jump', equip: 'bw', pattern: 'Squat (power)',
      cues: ['Quarter-to-half squat, then jump', 'Land soft and quiet', 'Reset between reps'],
      easier: 'Bodyweight squat', harder: 'Higher jumps' },
    'plank': { name: 'Plank', equip: 'bw', pattern: 'Core',
      cues: ['Forearms down, body in one line', 'Squeeze glutes and quads', 'Breathe behind the brace'],
      easier: 'From the knees', harder: 'Plank with shoulder taps' },
    'side-plank': { name: 'Side plank', equip: 'bw', pattern: 'Core',
      cues: ['Elbow under the shoulder', 'Hips high, body straight', 'Hold each side'],
      easier: 'Bottom knee down', harder: 'Top leg raised' },
    'dead-bug': { name: 'Dead bug', equip: 'bw', pattern: 'Core',
      cues: ['Lower back pressed to the floor', 'Extend the opposite arm and leg slowly', 'Exhale fully on each rep'],
      easier: 'Legs only', harder: 'Hold a bell in the hands' },
    'hollow-hold': { name: 'Hollow hold', equip: 'bw', pattern: 'Core',
      cues: ['Lower back glued to the floor', 'Arms and legs long, shoulders off the floor', 'Bend the knees to make it easier'],
      easier: 'Tuck hollow', harder: 'Hollow rocks' },
    'plank-drag': { name: 'Plank pull-through', equip: 'kb', pattern: 'Core',
      cues: ['High plank with a bell beside you', 'Reach under and drag it to the other side', 'Hips stay level'],
      easier: 'Shoulder taps', harder: 'Heavier bell' },
    'mountain-climber': { name: 'Mountain climbers', equip: 'bw', pattern: 'Conditioning',
      cues: ['High plank, drive the knees fast', 'Hips low', 'Steady breathing'],
      easier: 'Slow climbers', harder: 'Cross-body climbers' },
    'burpee': { name: 'Burpee', equip: 'bw', pattern: 'Conditioning',
      cues: ['Squat, hands down, jump the feet back', 'Chest to the floor, push up', 'Jump the feet in and jump up'],
      easier: 'Step back instead of jumping, no push-up', harder: 'Add a tuck jump' }
  };

  var WARMUP = [
    'Halo — 5 each direction',
    'Prying goblet squat — 30 s',
    'Hip hinge drill (hands on hips) — 10',
    'Cat–cow — 8',
    'World’s greatest stretch — 3 each side',
    'Light two-hand swings — 10'
  ];

  function b(ex, sets, reps, rest, note) {
    return { ex: ex, sets: sets, reps: reps, rest: rest || 60, note: note || '' };
  }

  var PHASES = [
    {
      name: 'Foundation', weeks: [1, 2, 3, 4],
      goal: 'Learn the six key patterns with a moderate bell. Leave 2–3 reps in the tank every set.',
      days: [
        { name: 'A — Lower body & hinge', blocks: [
          b('kb-deadlift', [3, 3, 4, 2], ['10', '12', '10', '8'], 60),
          b('goblet-squat', [3, 3, 4, 2], ['8', '10', '10', '8'], 75),
          b('reverse-lunge', [2, 3, 3, 2], ['8/side', '10/side', '10/side', '8/side'], 60),
          b('glute-bridge', [3, 3, 3, 2], ['15', '15', '20', '12'], 45),
          b('plank', [3, 3, 3, 2], ['30 s', '40 s', '45 s', '30 s'], 45)
        ], finisher: { name: 'Swing intervals', byWeek: [
          '6 rounds: 10 two-hand swings, rest 30 s',
          '8 rounds: 10 two-hand swings, rest 30 s',
          '10 rounds: 10 two-hand swings, rest 30 s',
          '5 rounds: 10 two-hand swings, rest as needed'] } },
        { name: 'B — Upper body push & pull', blocks: [
          b('push-up', [3, 3, 4, 2], ['8', '10', '10', '8'], 60, 'Use the incline version if you cannot do 8 good reps'),
          b('row-1a', [3, 3, 4, 2], ['10/side', '12/side', '12/side', '8/side'], 60),
          b('hk-press', [3, 3, 3, 2], ['6/side', '8/side', '8/side', '5/side'], 75),
          b('halo', [2, 3, 3, 2], ['5 each way', '6 each way', '8 each way', '5 each way'], 45),
          b('dead-bug', [3, 3, 3, 2], ['6/side', '8/side', '10/side', '6/side'], 45)
        ], finisher: { name: 'Push-up + swing AMRAP', byWeek: [
          'As many rounds as possible in 6 min: 5 push-ups + 10 swings',
          'AMRAP 8 min: 5 push-ups + 10 swings',
          'AMRAP 10 min: 5 push-ups + 10 swings',
          'AMRAP 5 min: 5 push-ups + 10 swings'] } },
        { name: 'C — Full body & get-up', blocks: [
          b('half-tgu', [3, 3, 3, 2], ['2/side', '3/side', '3/side', '2/side'], 60, 'Slow and deliberate'),
          b('swing-2h', [5, 6, 8, 4], ['15', '15', '15', '15'], 45),
          b('split-squat', [2, 3, 3, 2], ['6/side', '8/side', '10/side', '6/side'], 60, 'Start with the rear foot on the floor'),
          b('suitcase-carry', [3, 3, 4, 2], ['30 s/side', '40 s/side', '40 s/side', '30 s/side'], 45),
          b('side-plank', [2, 3, 3, 2], ['20 s/side', '25 s/side', '30 s/side', '20 s/side'], 30)
        ], finisher: { name: 'Bodyweight Tabata', byWeek: [
          '4 min: 20 s squats / 10 s rest, then 4 min mountain climbers',
          '4 min squats + 4 min mountain climbers (20 s on / 10 s off)',
          '4 min squat jumps + 4 min mountain climbers',
          '4 min squats only (easy pace)'] } }
      ]
    },
    {
      name: 'Strength', weeks: [5, 6, 7, 8],
      goal: 'Move up a bell size where you can. Single-arm and single-leg work builds real strength.',
      days: [
        { name: 'A — Lower body strength', blocks: [
          b('front-squat', [4, 4, 5, 3], ['6/side', '8/side', '8/side', '5/side'], 90),
          b('sl-rdl', [3, 3, 4, 2], ['8/side', '8/side', '10/side', '6/side'], 75),
          b('split-squat', [3, 3, 3, 2], ['8/side', '10/side', '10/side', '6/side'], 75),
          b('swing-1h', [4, 5, 6, 3], ['10/side', '10/side', '10/side', '8/side'], 60),
          b('hollow-hold', [3, 3, 3, 2], ['20 s', '25 s', '30 s', '20 s'], 45)
        ], finisher: { name: 'Swing EMOM', byWeek: [
          'Every minute on the minute for 10 min: 15 two-hand swings',
          'EMOM 12 min: 15 swings',
          'EMOM 14 min: 15 swings',
          'EMOM 8 min: 12 swings'] } },
        { name: 'B — Upper body strength', blocks: [
          b('clean-press', [4, 4, 5, 3], ['5/side', '6/side', '6/side', '4/side'], 90),
          b('renegade-row', [3, 3, 4, 2], ['6/side', '8/side', '8/side', '5/side'], 75, 'One bell is fine — row it, then do a push-up'),
          b('decline-push-up', [3, 4, 4, 2], ['8', '8', '10', '6'], 60),
          b('floor-press', [3, 3, 3, 2], ['8/side', '10/side', '10/side', '6/side'], 60),
          b('side-plank', [3, 3, 3, 2], ['30 s/side', '35 s/side', '40 s/side', '25 s/side'], 30)
        ], finisher: { name: 'Press & push-up ladder', byWeek: [
          'Ladder 1–2–3 presses/side + same number of push-ups, 3 ladders',
          '1–2–3–4, 3 ladders',
          '1–2–3–4, 4 ladders',
          '1–2–3, 2 ladders'] } },
        { name: 'C — Get-ups & athletic', blocks: [
          b('tgu', [3, 3, 4, 2], ['1/side', '2/side', '2/side', '1/side'], 60),
          b('lateral-lunge', [3, 3, 3, 2], ['6/side', '8/side', '8/side', '6/side'], 60),
          b('pike-push-up', [3, 3, 4, 2], ['6', '8', '8', '5'], 60),
          b('row-1a', [3, 4, 4, 2], ['10/side', '10/side', '12/side', '8/side'], 60, 'Heavier than in Phase 1'),
          b('suitcase-carry', [3, 3, 4, 2], ['40 s/side', '45 s/side', '45 s/side', '30 s/side'], 45)
        ], finisher: { name: 'Burpee + swing intervals', byWeek: [
          '5 rounds: 5 burpees + 10 swings, rest 45 s',
          '6 rounds: 5 burpees + 12 swings, rest 45 s',
          '7 rounds: 6 burpees + 12 swings, rest 45 s',
          '4 rounds: 5 burpees + 10 swings, easy pace'] } }
      ]
    },
    {
      name: 'Power & conditioning', weeks: [9, 10, 11, 12],
      goal: 'Fast, crisp reps. Stop a set when speed drops. Week 12 is a lighter week with your final tests.',
      days: [
        { name: 'A — Lower body power', blocks: [
          b('snatch', [4, 5, 5, 3], ['5/side', '5/side', '6/side', '5/side'], 90, 'Learn the high pull first if the bell bangs your wrist'),
          b('pistol-box', [3, 3, 4, 2], ['5/side', '6/side', '6/side', '5/side'], 75),
          b('squat-jump', [3, 3, 4, 2], ['6', '8', '8', '5'], 60),
          b('sl-bridge', [3, 3, 3, 2], ['10/side', '12/side', '12/side', '8/side'], 45),
          b('hollow-hold', [3, 3, 3, 2], ['30 s', '35 s', '40 s', '25 s'], 45)
        ], finisher: { name: 'Snatch / swing test prep', byWeek: [
          '5 min: 10 one-arm swings each minute, alternating hands',
          '6 min: 6 snatches/side each minute',
          '8 min: 6 snatches/side each minute',
          'TEST: max two-hand swings in 5 minutes (log the number)'] } },
        { name: 'B — Upper body power', blocks: [
          b('push-press', [4, 5, 5, 3], ['5/side', '5/side', '6/side', '4/side'], 90),
          b('explosive-push-up', [3, 4, 4, 2], ['5', '6', '6', '5'], 60),
          b('high-pull', [3, 3, 4, 2], ['8/side', '8/side', '10/side', '6/side'], 60),
          b('renegade-row', [3, 3, 4, 2], ['8/side', '8/side', '10/side', '6/side'], 75),
          b('plank-drag', [3, 3, 3, 2], ['6/side', '8/side', '8/side', '5/side'], 45)
        ], finisher: { name: 'Push-up density', byWeek: [
          'Max push-ups in 3 sets, 60 s rest',
          'Max push-ups in 3 sets, 45 s rest',
          'Max push-ups in 4 sets, 45 s rest',
          'TEST: max push-ups in one set (log the number)'] } },
        { name: 'C — Complex & conditioning', blocks: [
          b('kb-complex', [3, 4, 4, 2], ['3/side', '3/side', '4/side', '3/side'], 120),
          b('tgu', [3, 3, 3, 2], ['2/side', '2/side', '3/side', '1/side'], 60, 'Heaviest bell you can control'),
          b('swing-1h', [4, 4, 5, 3], ['12/side', '15/side', '15/side', '10/side'], 60),
          b('burpee', [3, 3, 4, 2], ['8', '10', '10', '6'], 60),
          b('side-plank', [2, 3, 3, 2], ['40 s/side', '45 s/side', '45 s/side', '30 s/side'], 30)
        ], finisher: { name: 'Conditioning', byWeek: [
          '10 min AMRAP: 5 goblet squats, 5 push-ups, 10 swings',
          '12 min AMRAP: same circuit',
          '14 min AMRAP: same circuit',
          'TEST: max plank hold (log the time)'] } }
      ]
    }
  ];

  var TOTAL_WEEKS = 12;
  var DAYS_PER_WEEK = 3;

  function phaseForWeek(week) {
    for (var i = 0; i < PHASES.length; i++) {
      if (PHASES[i].weeks.indexOf(week) !== -1) return { phase: PHASES[i], index: i };
    }
    return null;
  }

  /** Fully resolved session for a week (1–12) and day (0–2). */
  function getSession(week, day) {
    var found = phaseForWeek(week);
    if (!found) return null;
    var phase = found.phase;
    var wi = phase.weeks.indexOf(week);
    var d = phase.days[day];
    if (!d) return null;
    return {
      key: sessionKey(week, day),
      week: week, day: day,
      phaseName: phase.name, phaseNumber: found.index + 1, phaseGoal: phase.goal,
      title: d.name,
      deload: wi === 3,
      warmup: WARMUP.slice(),
      blocks: d.blocks.map(function (blk) {
        return {
          ex: blk.ex, exercise: EXERCISES[blk.ex],
          sets: blk.sets[wi], reps: blk.reps[wi], rest: blk.rest, note: blk.note
        };
      }),
      finisher: { name: d.finisher.name, detail: d.finisher.byWeek[wi] }
    };
  }

  function sessionKey(week, day) { return 'w' + week + 'd' + day; }

  /** All sessions in order. */
  function allSessions() {
    var out = [];
    for (var w = 1; w <= TOTAL_WEEKS; w++) {
      for (var d = 0; d < DAYS_PER_WEEK; d++) out.push(getSession(w, d));
    }
    return out;
  }

  /** First session not yet completed, or null when the program is finished. */
  function nextSession(completed) {
    var list = allSessions();
    for (var i = 0; i < list.length; i++) {
      if (!completed[list[i].key]) return list[i];
    }
    return null;
  }

  var Program = {
    EXERCISES: EXERCISES, PHASES: PHASES, WARMUP: WARMUP,
    TOTAL_WEEKS: TOTAL_WEEKS, DAYS_PER_WEEK: DAYS_PER_WEEK,
    getSession: getSession, sessionKey: sessionKey,
    allSessions: allSessions, nextSession: nextSession
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Program;
  else root.Program = Program;
})(this);
