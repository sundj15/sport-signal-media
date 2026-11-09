/*
 * Animated exercise demos: a side-view figure drawn as SVG and animated between key poses.
 *
 * Coordinates are y-up, ankle level ≈ 0. A pose gives the hip position, trunk angle t
 * (degrees from vertical, + = leaning forward), ankle targets for the near (N) and far (F)
 * leg, and hand targets (absolute [x, y], or R(dx, dy) relative to the shoulder).
 * Knees and elbows are solved with two-bone IK; the kN/kF/eN/eF fields pick the bend side
 * ('f' forward, 'b' back, 'u' up, 'd' down).
 */
(function (root) {
  'use strict';

  var L = { trunk: 52, head: 14, thigh: 42, shin: 42, upper: 30, fore: 28 };

  function R(dx, dy) { return { r: [dx, dy] }; }
  function P(base, over) { return Object.assign({}, base, over || {}); }

  // ---------- Base poses ----------
  var STAND = { hip: [0, 84], t: 0, fN: [3, 0], fF: [-3, 0], hN: R(3, -57), hF: R(-3, -57) };
  var GOBLET = { hN: R(15, -19), hF: R(13, -19), eN: 'd', eF: 'd', bN: 'chest' };
  var RACK = { hN: R(9, -13), eN: 'd', bN: 'arm', hF: R(4, -55) };
  var PRESS = { hN: R(2, 57), eN: 'b', bN: 'arm', hF: R(4, -55) };
  var HIKE = { hip: [-28, 62], t: 60, hN: R(-27, -49), hF: R(-25, -49), eN: 'f', eF: 'f' };
  var SWING_TOP = { hip: [0, 84], t: -4, hN: R(56, -6), hF: R(55, -6) };
  var SQUAT = { hip: [-20, 40], t: 25 };
  var DIP = { hip: [-6, 74], t: 4 };
  // Push-up family: ankles at x = -78, hands at x = 47.
  var PU_TOP = { hip: [-1, 38], t: 67, fN: [-78, 5], fF: [-80, 5], toeN: 'd', toeF: 'd', kN: 'd', kF: 'd', hN: [47, 0], hF: [45, 0], eN: 'b', eF: 'b' };
  var PU_BOTTOM = P(PU_TOP, { hip: [5, 13], t: 84, eN: 'u', eF: 'u' });
  var PLANK = P(PU_TOP, { hip: [4, 20], t: 79, hN: [84, 1], hF: [82, 1], eN: 'd', eF: 'd' });
  // Lying on the back, head toward +x.
  var LYING = { hip: [0, 8], t: 90, h: 10, fN: [-55, 2], fF: [-57, 2], kN: 'u', kF: 'u', hN: [8, 3], hF: [6, 3], eN: 'u', eF: 'u' };

  var hinge = function (bell) { return P(STAND, { hip: [-26, 56], t: 58, hN: R(1, -57), hF: R(-1, -57), bN: bell }); };

  // ---------- Exercise animations ----------
  // mode: 'pingpong' (A→B→A) or 'loop' (A→B→C→A). Optional caption explains the view.
  var ANIM = {
    'kb-deadlift': { frames: [P(STAND, { bN: 'both' }), hinge('both')] },
    'goblet-squat': { frames: [P(STAND, GOBLET), P(P(STAND, GOBLET), SQUAT)] },
    'swing-2h': { frames: [P(P(STAND, HIKE), { bN: 'both' }), P(SWING_TOP, { fN: [3, 0], fF: [-3, 0], bN: 'both' })] },
    'swing-1h': { frames: [P(P(STAND, HIKE), { bN: 'arm', hF: R(-10, -50) }), P(P(STAND, SWING_TOP), { bN: 'arm', hF: R(-6, -55) })] },
    'row-1a': { frames: [
      { hip: [-20, 62], t: 75, fN: [-30, 0], fF: [30, 0], hF: [22, 44], eF: 'b', hN: R(0, -56), bN: 'hang' },
      { hip: [-20, 62], t: 75, fN: [-30, 0], fF: [30, 0], hF: [22, 44], eF: 'b', hN: R(-16, -10), eN: 'u', bN: 'hang' }] },
    'renegade-row': { frames: [
      P(PU_TOP, { hip: [-1, 44], t: 70, hN: [47, 10], hF: [45, 10], bN: 'hang', bF: 'hang' }),
      P(PU_TOP, { hip: [-1, 44], t: 70, hN: [33, 36], eN: 'u', hF: [45, 10], bN: 'hang', bF: 'hang' })] },
    'hk-press': { caption: 'Down knee is on the pressing-arm side', frames: [
      P({ hip: [0, 42], t: 0, fF: [42, 0], kF: 'u', fN: [-40, 2], kN: 'd', toeN: 'b' }, RACK),
      P({ hip: [0, 42], t: 0, fF: [42, 0], kF: 'u', fN: [-40, 2], kN: 'd', toeN: 'b' }, PRESS)] },
    'clean-press': { mode: 'loop', frames: [
      P(P(STAND, HIKE), { bN: 'arm', hF: R(-10, -50) }), P(STAND, RACK), P(STAND, PRESS), P(STAND, RACK)] },
    'push-press': { mode: 'loop', frames: [P(STAND, RACK), P(P(STAND, RACK), DIP), P(STAND, PRESS), P(STAND, RACK)] },
    'floor-press': { frames: [
      P(LYING, { hN: R(0, 24), eN: 'd', bN: 'arm', hF: [20, 3] }),
      P(LYING, { hN: R(0, 57), bN: 'arm', hF: [20, 3] })] },
    'front-squat': { frames: [P(STAND, RACK), P(P(STAND, RACK), SQUAT)] },
    'sl-rdl': { frames: [
      P(STAND, { fF: [0, 0], fN: [-6, 6], bN: 'hang', hN: R(2, -57) }),
      { hip: [-8, 80], t: 80, fF: [0, 0], kF: 'f', fN: [-90, 66], toeN: 'd', hN: R(0, -56), bN: 'hang', hF: R(-4, -50) }] },
    'tgu': { caption: 'Eyes stay on the bell all the way up and down', frames: [
      P(LYING, { fN: [-38, 2], fF: [-82, 4], toeF: 'u', hN: R(0, 57), bN: 'arm', hF: [22, 2] }),
      P(LYING, { t: 62, fN: [-38, 2], fF: [-82, 4], toeF: 'u', hN: R(0, 57), bN: 'arm', hF: [62, 2], eF: 'd' }),
      P(LYING, { t: 38, fN: [-38, 2], fF: [-82, 4], toeF: 'u', hN: R(0, 57), bN: 'arm', hF: [10, 2] }),
      { hip: [-4, 42], t: 0, fN: [36, 0], kN: 'u', fF: [-44, 2], kF: 'd', toeF: 'b', hN: R(0, 57), bN: 'arm', hF: R(-2, -50) },
      P(STAND, { hip: [-4, 84], fN: [-1, 0], fF: [-7, 0], hN: R(0, 57), bN: 'arm', hF: R(-2, -56) })] },
    'half-tgu': { frames: [
      P(LYING, { fN: [-38, 2], fF: [-82, 4], toeF: 'u', hN: R(0, 57), bN: 'arm', hF: [22, 2] }),
      P(LYING, { t: 62, fN: [-38, 2], fF: [-82, 4], toeF: 'u', hN: R(0, 57), bN: 'arm', hF: [62, 2], eF: 'd' }),
      P(LYING, { t: 38, fN: [-38, 2], fF: [-82, 4], toeF: 'u', hN: R(0, 57), bN: 'arm', hF: [10, 2] })] },
    'snatch': { frames: [
      P(P(STAND, HIKE), { bN: 'arm', hF: R(-10, -50) }),
      P(STAND, { t: -2, hN: R(30, -18), eN: 'u', bN: 'arm', hF: R(-6, -55) }),
      P(STAND, { hN: R(2, 57), bN: 'arm', hF: R(-4, -55) })] },
    'high-pull': { frames: [
      P(P(STAND, HIKE), { bN: 'arm', hF: R(-10, -50) }),
      P(STAND, { t: -3, hN: R(22, -6), eN: 'u', bN: 'arm', hF: R(-6, -55) })] },
    'suitcase-carry': { frames: [
      P(STAND, { hip: [0, 82], fN: [20, 2], fF: [-20, 0], hN: R(1, -57), bN: 'hang', hF: R(-10, -55) }),
      P(STAND, { hip: [0, 82], fN: [-20, 0], fF: [20, 2], hN: R(1, -57), bN: 'hang', hF: R(10, -55) })] },
    'lateral-lunge': { caption: 'Side view: sit back into one hip, the other leg stays straight out to the side', frames: [
      P(STAND, GOBLET), P(P(STAND, GOBLET), { hip: [-22, 50], t: 28 })] },
    'halo': { mode: 'loop', frames: [
      P(STAND, GOBLET),
      P(STAND, { hN: R(14, 22), hF: R(12, 22), eN: 'f', eF: 'f', bN: 'chest' }),
      P(STAND, { hN: R(-14, 24), hF: R(-16, 24), eN: 'f', eF: 'f', bN: 'chest' }),
      P(STAND, { hN: R(-16, -6), hF: R(-18, -6), eN: 'd', eF: 'd', bN: 'chest' })] },
    'kb-complex': { mode: 'loop', caption: 'Clean → front squat → press → reverse lunge', frames: [
      P(P(STAND, HIKE), { bN: 'arm', hF: R(-10, -50) }), P(STAND, RACK), P(P(STAND, RACK), SQUAT), P(STAND, RACK), P(STAND, PRESS),
      P(STAND, RACK), P(P(STAND, RACK), { hip: [-22, 44], fF: [0, 0], fN: [-62, 4], toeN: 'd', kN: 'd' }), P(STAND, RACK)] },

    'push-up': { frames: [PU_TOP, PU_BOTTOM] },
    'decline-push-up': { box: { foot: 'N', frame: 0 }, frames: [
      P(PU_TOP, { hip: [-1, 51], t: 82, fN: [-78, 40], fF: [-80, 40] }),
      P(PU_TOP, { hip: [5, 28], t: 98, fN: [-78, 40], fF: [-80, 40], eN: 'u', eF: 'u' })] },
    'explosive-push-up': { frames: [PU_BOTTOM, P(PU_TOP, { lift: 10, hN: [47, 12], hF: [45, 12] })] },
    'pike-push-up': { frames: [
      { hip: [-12, 80], t: 125, fN: [-50, 4], fF: [-52, 4], kN: 'f', kF: 'f', toeN: 'd', toeF: 'd', hN: [32, 0], hF: [30, 0], eN: 'b', eF: 'b' },
      { hip: [-8, 70], t: 140, fN: [-50, 4], fF: [-52, 4], kN: 'f', kF: 'f', toeN: 'd', toeF: 'd', hN: [32, 0], hF: [30, 0], eN: 'b', eF: 'b' }] },
    'glute-bridge': { frames: [LYING, P(LYING, { hip: [0, 40], t: 125 })] },
    'sl-bridge': { frames: [
      P(LYING, { fN: [-12, 58], kN: 'f', toeN: 'u' }),
      P(LYING, { hip: [0, 40], t: 125, fN: [-30, 92], kN: 'f', toeN: 'u' })] },
    'reverse-lunge': { frames: [
      P(STAND, { hN: R(-4, -48), hF: R(-6, -48) }),
      P(STAND, { hip: [-22, 44], fF: [0, 0], fN: [-62, 4], toeN: 'd', kN: 'd', hN: R(-4, -48), hF: R(-6, -48) })] },
    'split-squat': { box: { foot: 'N', frame: 0 }, frames: [
      P(STAND, { hip: [-12, 80], fF: [0, 0], fN: [-55, 38], kN: 'd', toeN: 'b', hN: R(-2, -52), hF: R(-4, -52) }),
      P(STAND, { hip: [-15, 45], fF: [0, 0], fN: [-55, 38], kN: 'd', toeN: 'b', hN: R(-2, -52), hF: R(-4, -52) })] },
    'pistol-box': { box: { hip: true, frame: 1 }, frames: [
      P(STAND, { fF: [0, 0], fN: [22, 8], kN: 'f', hN: R(30, -40), hF: R(28, -40) }),
      { hip: [-25, 38], t: 32, fF: [0, 0], kF: 'f', fN: [56, 22], kN: 'u', hN: R(55, -8), hF: R(53, -8) }] },
    'squat-jump': { frames: [
      P(P(STAND, SQUAT), { hN: R(-22, -50), hF: R(-24, -50), eN: 'f', eF: 'f' }),
      P(STAND, { lift: 16, fN: [6, -6], fF: [0, -6], toeN: 'd', toeF: 'd', hN: R(24, 48), hF: R(22, 48) })] },
    'plank': { frames: [PLANK, P(PLANK, { hip: [4, 22] })] },
    'side-plank': { caption: 'Body stacked sideways on one forearm, top arm reaching up', frames: [
      P(PLANK, { hF: R(0, 55), eF: 'b', toeN: 'f', toeF: 'f' }),
      P(PLANK, { hip: [4, 24], hF: R(0, 55), eF: 'b', toeN: 'f', toeF: 'f' })] },
    'dead-bug': { frames: [
      P(LYING, { fN: [-42, 50], fF: [-44, 50], hN: R(0, 56), hF: R(-2, 56) }),
      P(LYING, { fN: [-84, 12], toeN: 'u', fF: [-44, 50], hN: R(0, 56), hF: R(54, 12) })] },
    'hollow-hold': { frames: [
      P(LYING, { t: 76, fN: [-82, 22], fF: [-84, 22], toeN: 'u', toeF: 'u', hN: R(52, 14), hF: R(50, 14) }),
      P(LYING, { t: 78, fN: [-82, 18], fF: [-84, 18], toeN: 'u', toeF: 'u', hN: R(52, 12), hF: R(50, 12) })] },
    'plank-drag': { frames: [
      P(PU_TOP, { hN: [8, 10], bN: 'hang' }),
      P(PU_TOP, { hN: [-14, 10], bN: 'hang' })] },
    'mountain-climber': { frames: [
      P(PU_TOP, { fN: [-12, 20], kN: 'f', toeN: 'd' }),
      P(PU_TOP, { fF: [-12, 20], kF: 'f', toeF: 'd' })] },
    'burpee': { mode: 'loop', frames: [
      STAND,
      P(STAND, { hip: [-18, 34], t: 50, hN: [36, 0], hF: [34, 0], eN: 'b', eF: 'b' }),
      PU_TOP, PU_BOTTOM, PU_TOP,
      P(STAND, { hip: [-18, 34], t: 50, hN: [36, 0], hF: [34, 0], eN: 'b', eF: 'b' }),
      P(STAND, { lift: 20, fN: [3, -6], fF: [-3, -6], toeN: 'd', toeF: 'd', hN: R(6, 56), hF: R(4, 56) })] }
  };

  // ---------- Geometry ----------
  function rad(d) { return d * Math.PI / 180; }
  function dir(deg) { return [Math.sin(rad(deg)), Math.cos(rad(deg))]; }
  function add(a, b, s) { s = s == null ? 1 : s; return [a[0] + b[0] * s, a[1] + b[1] * s]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function len(v) { return Math.hypot(v[0], v[1]); }
  function unit(v) { var l = len(v) || 1; return [v[0] / l, v[1] / l]; }

  function ik(rootPt, target, l1, l2, pref) {
    var v = sub(target, rootPt);
    var d = Math.min(Math.max(len(v), Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
    var base = Math.atan2(v[1], v[0]);
    var a = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
    var j1 = [rootPt[0] + l1 * Math.cos(base + a), rootPt[1] + l1 * Math.sin(base + a)];
    var j2 = [rootPt[0] + l1 * Math.cos(base - a), rootPt[1] + l1 * Math.sin(base - a)];
    var pick = { f: j1[0] >= j2[0], b: j1[0] < j2[0], u: j1[1] >= j2[1], d: j1[1] < j2[1] }[pref || 'f'] ? j1 : j2;
    var end = add(pick, unit(sub(target, pick)), l2);
    return [pick, end];
  }

  function neckOf(p) { return add(p.hip, dir(p.t), L.trunk); }

  /** Resolve relative hand targets so keyframes can be interpolated in absolute space. */
  function normalize(p) {
    var q = Object.assign({ h: 0, lift: 0, kN: 'f', kF: 'f', eN: 'b', eF: 'b', toeN: 'f', toeF: 'f' }, p);
    var neck = neckOf(q);
    ['hN', 'hF'].forEach(function (k) { if (q[k] && q[k].r) q[k] = add(neck, q[k].r); });
    return q;
  }

  function lerp(a, b, u) { return a + (b - a) * u; }
  function lerpPose(a, b, u) {
    var out = {};
    Object.keys(a).forEach(function (k) {
      var x = a[k], y = b[k];
      if (Array.isArray(x) && Array.isArray(y)) out[k] = [lerp(x[0], y[0], u), lerp(x[1], y[1], u)];
      else if (typeof x === 'number' && typeof y === 'number') out[k] = lerp(x, y, u);
      else out[k] = u < 0.5 ? x : y;
    });
    Object.keys(b).forEach(function (k) { if (!(k in out)) out[k] = u < 0.5 ? a[k] : b[k]; });
    return out;
  }

  var TOES = { f: [11, -3], d: [3, -8], u: [2, 10], b: [-10, -2] };

  /** Joint positions for a normalized pose. */
  function solve(p) {
    var lift = [0, p.lift || 0];
    var hip = add(p.hip, lift);
    var neck = add(neckOf(p), lift);
    var head = add(neck, dir(p.t + p.h), L.head);
    var legN = ik(hip, add(p.fN, lift), L.thigh, L.shin, p.kN);
    var legF = ik(hip, add(p.fF, lift), L.thigh, L.shin, p.kF);
    var armN = ik(neck, add(p.hN, lift), L.upper, L.fore, p.eN);
    var armF = ik(neck, add(p.hF, lift), L.upper, L.fore, p.eF);
    var j = {
      hip: hip, neck: neck, head: head,
      kneeN: legN[0], ankN: legN[1], toeN: add(legN[1], TOES[p.toeN] || TOES.f),
      kneeF: legF[0], ankF: legF[1], toeF: add(legF[1], TOES[p.toeF] || TOES.f),
      elbN: armN[0], wrN: armN[1], elbF: armF[0], wrF: armF[1], bells: []
    };
    function bellAt(style, wr, elb) {
      if (style === 'hang') return add(wr, [0, -10]);
      if (style === 'arm') return add(wr, unit(sub(wr, elb)), 9);
      return null;
    }
    if (p.bN === 'chest') j.bells.push({ c: add([(j.wrN[0] + j.wrF[0]) / 2, (j.wrN[1] + j.wrF[1]) / 2], [7, -3]), near: true });
    else if (p.bN === 'both') j.bells.push({ c: add([(j.wrN[0] + j.wrF[0]) / 2, (j.wrN[1] + j.wrF[1]) / 2], [0, -10]), near: true });
    else if (p.bN) j.bells.push({ c: bellAt(p.bN, j.wrN, j.elbN), w: j.wrN, near: true });
    if (p.bF) j.bells.unshift({ c: bellAt(p.bF, j.wrF, j.elbF), w: j.wrF, near: false });
    return j;
  }

  // ---------- SVG ----------
  var VIEW_W = 288, VIEW_H = 240, FLOOR = -5;
  var NS = 'http://www.w3.org/2000/svg';

  function boundsOf(frames) {
    var minX = Infinity, maxX = -Infinity;
    frames.forEach(function (p) {
      var j = solve(p);
      Object.keys(j).forEach(function (k) {
        if (Array.isArray(j[k]) && typeof j[k][0] === 'number') { minX = Math.min(minX, j[k][0]); maxX = Math.max(maxX, j[k][0]); }
      });
    });
    return { cx: (minX + maxX) / 2 };
  }

  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  var SEGMENTS = [
    // [from, to, near?, width]
    ['hip', 'kneeF', 0, 7], ['kneeF', 'ankF', 0, 6.5], ['ankF', 'toeF', 0, 5],
    ['neck', 'elbF', 0, 6], ['elbF', 'wrF', 0, 5.5],
    ['hip', 'kneeN', 1, 7.5], ['kneeN', 'ankN', 1, 7], ['ankN', 'toeN', 1, 5.5],
    ['hip', 'neck', 1, 10],
    ['neck', 'elbN', 1, 6.5], ['elbN', 'wrN', 1, 6]
  ];

  function build(svg, anim) {
    var frames = anim.frames.map(normalize);
    var b = boundsOf(frames);
    var x0 = b.cx - VIEW_W / 2;
    svg.setAttribute('viewBox', x0 + ' ' + (-VIEW_H + 12) + ' ' + VIEW_W + ' ' + VIEW_H);
    var g = el('g', { transform: 'scale(1,-1)' });
    svg.appendChild(g);
    g.appendChild(el('line', { x1: x0, x2: x0 + VIEW_W, y1: FLOOR - 3, y2: FLOOR - 3, class: 'demo-floor' }));
    if (anim.box) {
      var j = solve(frames[anim.box.frame]);
      var top, cx;
      if (anim.box.hip) { top = j.hip[1] - 9; cx = j.hip[0] - 4; }
      else { top = Math.min(j.ankN[1], j.toeN[1]) + 1; cx = j.ankN[0]; }
      g.appendChild(el('rect', { x: cx - 22, y: FLOOR - 3, width: 44, height: top - FLOOR + 3, rx: 3, class: 'demo-box' }));
    }
    var parts = { segs: [], head: null, bells: [] };
    SEGMENTS.forEach(function (s) {
      var line = el('line', { 'stroke-width': s[3], class: s[2] ? 'demo-near' : 'demo-far' });
      g.appendChild(line);
      parts.segs.push({ line: line, a: s[0], b: s[1] });
    });
    parts.head = el('circle', { r: 10.5, class: 'demo-head' });
    g.appendChild(parts.head);
    return { g: g, frames: frames, parts: parts, mode: anim.mode || 'pingpong' };
  }

  function draw(ctx, pose) {
    var j = solve(pose);
    ctx.parts.segs.forEach(function (s) {
      s.line.setAttribute('x1', j[s.a][0]); s.line.setAttribute('y1', j[s.a][1]);
      s.line.setAttribute('x2', j[s.b][0]); s.line.setAttribute('y2', j[s.b][1]);
    });
    ctx.parts.head.setAttribute('cx', j.head[0]); ctx.parts.head.setAttribute('cy', j.head[1]);
    // Bells: recreate only when the count changes.
    while (ctx.parts.bells.length > j.bells.length) ctx.g.removeChild(ctx.parts.bells.pop().node);
    while (ctx.parts.bells.length < j.bells.length) {
      var node = el('g', {});
      node.appendChild(el('line', { class: 'demo-bell-handle', 'stroke-width': 3.5 }));
      node.appendChild(el('circle', { r: 8.5, class: 'demo-bell' }));
      ctx.g.appendChild(node);
      ctx.parts.bells.push({ node: node });
    }
    j.bells.forEach(function (bl, i) {
      var node = ctx.parts.bells[i].node;
      var hl = node.firstChild, c = node.lastChild;
      c.setAttribute('cx', bl.c[0]); c.setAttribute('cy', bl.c[1]);
      var toward = bl.w ? unit(sub(bl.w, bl.c)) : [0, 1];
      hl.setAttribute('x1', bl.c[0]); hl.setAttribute('y1', bl.c[1]);
      hl.setAttribute('x2', bl.c[0] + toward[0] * 11); hl.setAttribute('y2', bl.c[1] + toward[1] * 11);
      node.setAttribute('opacity', bl.near ? 1 : 0.7);
    });
  }

  // ---------- Animation loop ----------
  var MOVE = 900, HOLD = 350;
  var active = [];
  var running = false;
  var reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ease(u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }

  function poseAt(ctx, ms) {
    var f = ctx.frames;
    if (f.length === 1) return f[0];
    var order = ctx.mode === 'loop' ? f.concat([f[0]]) : f.concat(f.slice(0, -1).reverse());
    var steps = order.length - 1;
    var per = MOVE + HOLD;
    var tt = ms % (steps * per);
    var i = Math.floor(tt / per);
    var into = tt - i * per;
    var u = into < HOLD ? 0 : ease((into - HOLD) / MOVE);
    return lerpPose(order[i], order[i + 1], u);
  }

  function tick(now) {
    active = active.filter(function (c) { return c.svg.isConnected; });
    active.forEach(function (c) {
      if (c.svg.getBoundingClientRect().width === 0) return; // inside a closed <details>
      if (c.start == null) c.start = now;
      draw(c, poseAt(c, now - c.start));
    });
    if (active.length) requestAnimationFrame(tick); else running = false;
  }

  /** Activate every unmounted demo placeholder under rootEl. */
  function mountAll(rootEl) {
    (rootEl || document).querySelectorAll('svg[data-demo]:not([data-mounted])').forEach(function (svg) {
      var anim = ANIM[svg.getAttribute('data-demo')];
      svg.setAttribute('data-mounted', '1');
      if (!anim) return;
      var ctx = build(svg, anim);
      ctx.svg = svg;
      var still = svg.hasAttribute('data-frame') ? Number(svg.getAttribute('data-frame')) : null;
      if (still != null) { draw(ctx, ctx.frames[Math.min(still, ctx.frames.length - 1)]); return; }
      draw(ctx, ctx.frames[0]);
      if (reduced) return;
      active.push(ctx);
      if (!running) { running = true; requestAnimationFrame(tick); }
    });
  }

  function videoUrl(exercise) {
    var q = exercise.name + (exercise.equip === 'kb' && !/kettlebell/i.test(exercise.name) ? ' kettlebell' : '') + ' exercise form';
    return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  }

  /** HTML for an exercise demo: animation (or key-pose strip with reduced motion) plus a video link. */
  function html(exId, exercise) {
    var anim = ANIM[exId];
    var label = 'Animated demonstration of ' + exercise.name;
    var figure = '';
    if (anim) {
      figure = reduced
        ? '<div class="demo-strip" role="img" aria-label="Key positions for ' + exercise.name + '">' + anim.frames.map(function (_, i) {
          return '<svg class="demo demo-small" data-demo="' + exId + '" data-frame="' + i + '" aria-hidden="true"></svg>';
        }).join('') + '</div>'
        : '<svg class="demo" data-demo="' + exId + '" role="img" aria-label="' + label + '"></svg>';
      if (anim.caption) figure += '<p class="demo-caption">' + anim.caption + '</p>';
    }
    return '<div class="demo-wrap">' + figure +
      '<a class="demo-video" href="' + videoUrl(exercise) + '" target="_blank" rel="noopener noreferrer">▶ Watch video demos</a></div>';
  }

  var Demos = { ANIM: ANIM, html: html, mountAll: mountAll, solve: solve, normalize: normalize, videoUrl: videoUrl };
  if (typeof module !== 'undefined' && module.exports) module.exports = Demos;
  else root.Demos = Demos;
})(this);
