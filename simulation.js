/* ==========================================================================
   Obliquity Simulator  --  Accessible HTML5 port
   Ported from obliquity004 (Adobe Flash / AS1).

   GROUND TRUTH for behaviour is the decompiled ActionScript. All geometry,
   constants and text below are copied verbatim from that source:

     scripts/DefineSprite_28/frame_1/DoAction.as   (the diagram's update() +
                                                    the MovieClip.drawArc helper)
     scripts/DefineSprite_28/.../on(initialize)    (slider configuration)
     scripts/SliderV3Symbol.as                     (slider value rounding/format)

   The original is a single-control demonstrator: an "obliquity" slider
   (0..180, start 23.5, precision 1) drives update(obliquity), which:
     - draws a 3px white arc of radius 120 from (90deg - obliquity) to 90deg,
     - rotates the earth assembly (globe + axis + equator) by `obliquity` degrees,
     - positions a degree label of the form `obliquity + "°"` on a circle of
       radius 150 at angle (90deg + obliquity/2).
   There is no animation loop; the diagram is redrawn only when the value changes.

   Rendering is reproduced on an HTML5 <canvas> in the original 600x400 stage
   coordinates; the slider is a native, keyboard-operable control; the degree /
   value read-outs are typeset by MathJax.
   ========================================================================== */
'use strict';
(function () {

  /* ---- constants copied verbatim from the AS source ----------------------- */
  var D2R        = 0.017453292519943295;   // deg -> rad
  var HALF_PI    = 1.5707963267948966;      // 90 deg in radians
  var TWO_PI     = 6.283185307179586;
  var HALF_DEG_R = 0.008726646259971648;    // (deg/2) -> rad, used for label angle
  var MAX_ARC_STEP = 0.5;                    // MovieClip.prototype.maxArcStep

  // slider config -- from on(initialize): initMin/initMax/initValue/initPrecision
  var MIN = 0, MAX = 180, INIT = 23.5, PREC = 1;

  /* ---- original Flash stage geometry (kept exactly; CSS scales the canvas) -
     Earth centre is the registration point (0,0) of the diagram clip; the arc
     (r=120) and the degree label (r=150) are measured from it. */
  var STAGE_W = 600, STAGE_H = 400;
  var CX = 300, CY = 185;            // earth centre on the stage
  var GLOBE_R = 50;                  // displayed globe radius (earth symbol scale)
  var ARC_R   = 120;                 // white tilt arc radius          (verbatim)
  var LABEL_R = 150;                 // degree-label radius            (verbatim)

  // colours: white arc 16777215 (verbatim); cream axis/equator #ffffcc and dashed
  // ecliptic/vertical lines #66ccff are the verbatim exported shape colours.
  var ARC_COLOR = '#ffffff', ECLIPTIC_COLOR = '#66ccff';

  /* ---- state: one plain object; render() redraws everything from it -------- */
  var state = { obliquity: INIT };

  /* ---- number formatting -------------------------------------------------- */
  // SliderV3 value label uses a toFixed(prec) polyfill (Math.round(x*10^d),
  // zero-padded) -> "23.5", "24.0", "0.0".
  function asFixed(x, d) {
    if (isNaN(x)) return 'NaN';
    var s = ''; if (x < 0) { s = '-'; x = -x; }
    var n = Math.round(x * Math.pow(10, d)), str = (n === 0) ? '0' : String(n);
    if (d > 0) {
      var k = str.length;
      if (k <= d) { var z = ''; for (var i = 0; i < d + 1 - k; i++) z += '0'; str = z + str; k = d + 1; }
      str = str.substr(0, k - d) + '.' + str.substr(k - d);
    }
    return s + str;
  }
  // The diagram degree label is `obliquity + "°"` -- plain Number->String (no
  // forced trailing zero), e.g. 23.5 -> "23.5", 24 -> "24".
  function numStr(x) { return String(x); }

  /* ---- port of SliderV3.setValue: round to precision, clamp to [min,max] -- */
  function setObliquity(v) {
    v = Number(v);
    if (!isFinite(v)) return;
    var k = Math.pow(10, PREC);
    v = Math.round(k * v) / k;
    if (v < MIN) v = MIN; else if (v > MAX) v = MAX;
    state.obliquity = v;
  }

  /* ---- exported assets, reused as-is (never redrawn) ----------------------
     earth.png   : the globe sprite (continents + ocean), exported bitmap.
     axis.svg    : earth rotation axis + front equator arc (exported vector).
     arrow.svg   : equator spin-direction arrow (exported vector).
     shading.svg : globe limb shading gradient (exported vector).
     Explicit draw width/height are passed to drawImage so rendering does not
     depend on naturalWidth (Safari reports 0 for some SVGs). */
  var IMG = {};
  // [drawWidth, drawHeight, offsetX, offsetY] -- offsets place each asset's own
  // origin at the earth centre (from each SVG's translate transform).
  var ASSET = {
    earth:   { src: 'assets/earth.png',   w: 2 * GLOBE_R, h: 2 * GLOBE_R, ox: -GLOBE_R, oy: -GLOBE_R },
    shading: { src: 'assets/shading.svg', w: 90,    h: 90,    ox: -45,   oy: -45 },
    axis:    { src: 'assets/axis.svg',    w: 100.7, h: 238.9, ox: -50.3, oy: -132.4 },
    equator: { src: 'assets/equator.svg', w: 100.7, h: 238.9, ox: -50.3, oy: -132.4 },
    arrow:   { src: 'assets/arrow.svg',   w: 75.05, h: 12.7,  ox: -47.65, oy: 47 }
  };
  (function loadAssets() {
    for (var key in ASSET) (function (k) {
      var im = new Image();
      im.onload = requestRender;
      im.src = ASSET[k].src;
      IMG[k] = im;
    })(key);
  })();
  function drawAsset(ctx, k) {
    var a = ASSET[k], im = IMG[k];
    if (im && im.complete) ctx.drawImage(im, a.ox, a.oy, a.w, a.h);
  }

  /* ---- faithful port of MovieClip.prototype.drawArc ----------------------
     Tessellates an arc with quadratic curves. AS plots with screen-Y-down and
     sin negated (y - r*sin), which we mirror so the arc matches the source. */
  function drawArcPath(ctx, x, y, radius, startAngle, endAngle) {
    if (startAngle < 0) startAngle = startAngle % TWO_PI + TWO_PI; else startAngle %= TWO_PI;
    if (endAngle   < 0) endAngle   = endAngle   % TWO_PI + TWO_PI; else endAngle   %= TWO_PI;
    var range = endAngle - startAngle; if (range < 0) range = TWO_PI + range;
    var n = Math.ceil(range / MAX_ARC_STEP), step = range / n, half = step / 2;
    var cos = Math.cos, sin = Math.sin, cRadius = radius / cos(half);
    var aAngle = startAngle, cAngle = startAngle - half;
    ctx.moveTo(x + radius * cos(startAngle), y - radius * sin(startAngle));
    for (var i = 0; i < n; i++) {
      aAngle += step; cAngle += step;
      ctx.quadraticCurveTo(x + cRadius * cos(cAngle), y - cRadius * sin(cAngle),
                           x + radius * cos(aAngle), y - radius * sin(aAngle));
    }
  }

  /* ---- dashed reference lines (static; centred on the earth) --------------
     Horizontal = plane of the ecliptic (+/-221 from centre); vertical = the
     perpendicular to it. Verbatim shape colour #66ccff, width 2, 6px dashes. */
  function drawDashedCross(ctx) {
    ctx.save();
    ctx.strokeStyle = ECLIPTIC_COLOR;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(CX - 221, CY); ctx.lineTo(CX + 221, CY);   // ecliptic plane
    ctx.moveTo(CX, CY - 134); ctx.lineTo(CX, CY + 107);   // perpendicular
    ctx.stroke();
    ctx.restore();
  }

  /* ============================ RENDERING ================================= */
  var canvas = document.getElementById('ob-canvas');
  var ctx = canvas.getContext('2d');
  var degreeLabel = document.getElementById('degree-label');

  function fitCanvas() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = STAGE_W * dpr; canvas.height = STAGE_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    requestRender();
  }

  // The diagram is static between user actions (no animation loop), so we draw
  // synchronously on demand. Canvas drawing is cheap; this also avoids relying on
  // requestAnimationFrame, which is throttled/paused when the page is not visible.
  function requestRender() { render(); }

  function render() {
    var ob = state.obliquity;

    ctx.clearRect(0, 0, STAGE_W, STAGE_H);
    // deep-space background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);

    // static dashed reference lines
    drawDashedCross(ctx);

    // ---- earth assembly. The globe, rotation axis and equator tilt with the
    // obliquity (port of earth._rotation = obliquity); the day/night shading does
    // NOT -- it is fixed by the Sun's direction (off-screen to the right), so the
    // dark hemisphere always faces away from the Sun (the left side). The axis is
    // drawn BEHIND the globe so it emerges from the poles and is occluded by the
    // sphere in between, preserving the 3-D depiction. ----

    // 1) BEHIND the globe (tilted): the rotation axis and the FAR half of the
    // spin circle (equator.svg). The globe then occludes their mid-sections, so
    // the axis emerges from the poles and the far arc of the spin ring passes
    // behind the Earth -- that occlusion is what disambiguates the spin direction
    // (without it the ring reads as an ambiguous flat ellipse on top of the globe).
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(ob * D2R);                 // _rotation is degrees, clockwise (y-down)
    drawAsset(ctx, 'axis');
    drawAsset(ctx, 'equator');
    drawAsset(ctx, 'earth');
    ctx.restore();

    // 2) night-side shading -- fixed in space (NOT rotated), clipped to the globe
    ctx.save();
    ctx.translate(CX, CY);
    ctx.beginPath(); ctx.arc(0, 0, GLOBE_R, 0, TWO_PI); ctx.clip();
    drawAsset(ctx, 'shading');
    ctx.restore();

    // 3) IN FRONT of the globe (tilted): the NEAR half of the spin circle plus its
    // arrowhead (arrow.svg), so the visible near arc reads as rotation to the east.
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(ob * D2R);
    drawAsset(ctx, 'arrow');
    ctx.restore();

    // ---- white tilt arc (parent layer; not rotated):
    // drawArc(0,0,120, 90deg - obliquity, 90deg), 3px white. ----
    ctx.save();
    ctx.translate(CX, CY);
    ctx.strokeStyle = ARC_COLOR;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    drawArcPath(ctx, 0, 0, ARC_R, HALF_PI - ob * D2R, HALF_PI);
    ctx.stroke();
    ctx.restore();

    // ---- degree label position (HTML overlay), matching the AS formula:
    // _x = -150*cos(90deg + obliquity/2),  _y = -150*sin(90deg + obliquity/2). ----
    var ang = HALF_PI + ob * HALF_DEG_R;
    var lx = CX + (-LABEL_R * Math.cos(ang));
    var ly = CY + (-LABEL_R * Math.sin(ang));
    degreeLabel.style.left = (lx / STAGE_W * 100) + '%';
    degreeLabel.style.top  = (ly / STAGE_H * 100) + '%';
  }

  /* ===================== read-outs + a11y text ==================== */
  var range    = document.getElementById('ob-range');
  var field    = document.getElementById('ob-field');         // editable value input
  var obDesc   = document.getElementById('ob-desc');          // persistent canvas description
  var liveStatus = document.getElementById('sr-status');      // live announcer (on commit)

  // Audio: every spoken value carries quantity + number + unit, with units as
  // WORDS ("degrees", never the degree glyph, which screen readers skip/mis-read).
  function description() {
    var v = asFixed(state.obliquity, 1);
    return 'Obliquity ' + v + ' degrees. The earth’s rotation axis is tilted '
         + v + ' degrees from the perpendicular to the plane of the ecliptic.';
  }

  function syncReadouts() {
    var ob = state.obliquity;
    // Diagram degree label: `obliquity + "°"` (verbatim AS format), typeset.
    if (window.klunlShowEquation) {
      klunlShowEquation(['degree-label', '\\(' + numStr(ob) + '^{\\circ}\\)']);
    }
    // Editable value field: show the normalized value (skip while the user is
    // actively typing in it, so we don't overwrite mid-edit).
    if (field && document.activeElement !== field) field.value = asFixed(ob, 1);
    // Slider spoken value: quantity name + number + unit-as-word, so each keyboard
    // step (arrows / Page / Home / End) announces "Obliquity X degrees".
    range.setAttribute('aria-valuetext', 'Obliquity ' + asFixed(ob, 1) + ' degrees');
    // Keep the canvas description current (silently; it is not a live region).
    if (obDesc) obDesc.textContent = description();
  }

  // Announce the committed state through the live region (units + context).
  function announce(prefix) {
    if (liveStatus) liveStatus.textContent = (prefix || '') + description();
  }

  /* ============================ CONTROLS ================================== */
  // Native <input type="range"> -> full keyboard support for free
  // (arrows = step 0.1, PageUp/Down = larger, Home/End = min/max).
  range.addEventListener('input', function () {
    setObliquity(range.value);
    requestRender();
    syncReadouts();
  });
  // Announce the committed result on release / change (not on every tick).
  range.addEventListener('change', function () { announce(); });

  // Editable field: commit on Enter / blur ("change"). Parse, clamp/round to the
  // slider's rules, then sync the slider and the rest of the UI. Invalid input
  // reverts to the current value. Both control paths mutate the same state.
  function commitField() {
    var v = parseFloat(field.value);
    if (isNaN(v)) v = state.obliquity;      // revert non-numeric entries
    setObliquity(v);                         // clamps to [0,180], rounds to prec
    range.value = state.obliquity;
    field.value = asFixed(state.obliquity, 1);   // show the normalized value
    requestRender();
    syncReadouts();
    announce();
  }
  field.addEventListener('change', commitField);

  // When the field is focused (via Tab or click), let ArrowUp/Down and the mouse
  // wheel nudge the value like a spinner. ArrowUp/Down step by the slider's fine
  // increment (0.1); the wheel steps by 1 per notch for quicker scrubbing. The
  // step is applied to the value currently shown in the field. Announcements are
  // debounced so rapid wheel/held-arrow changes don't flood the screen reader.
  var announceTimer = null;
  function announceDebounced() {
    if (announceTimer) clearTimeout(announceTimer);
    announceTimer = setTimeout(function () { announce(); }, 250);
  }
  function fieldNudge(delta) {
    var base = parseFloat(field.value);
    if (isNaN(base)) base = state.obliquity;
    setObliquity(base + delta);                  // clamps to [0,180], rounds to prec
    range.value = state.obliquity;
    field.value = asFixed(state.obliquity, 1);   // field is focused -> set explicitly
    requestRender();
    syncReadouts();
    announceDebounced();
  }
  field.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowUp')        { ev.preventDefault(); fieldNudge(0.1); }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); fieldNudge(-0.1); }
  });
  field.addEventListener('wheel', function (ev) {
    if (document.activeElement !== field) return;   // only when the field is selected
    ev.preventDefault();                             // don't scroll the page instead
    fieldNudge(ev.deltaY < 0 ? 1 : -1);
  }, { passive: false });

  // Restore the exact initial state. `announceReset` true -> speak "Simulation
  // reset." (used for the masthead Reset); false -> silent (used at startup).
  function reset(announceReset) {
    setObliquity(INIT);
    range.value = INIT;
    requestRender();
    syncReadouts();
    if (announceReset) announce('Simulation reset. ');
  }
  // Reset comes from the shared masthead component (the "sim-reset" event).
  document.addEventListener('sim-reset', function () { reset(true); });

  /* ============================ STARTUP ================================== */
  // klunlInitEqn is called by the foundation on load; redefine it to set up our
  // math (dynamic read-outs + a one-time typeset of the static tick labels).
  window.klunlInitEqn = function () {
    syncReadouts();
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise().catch(function (e) { console.error(e); });
    }
  };

  window.addEventListener('resize', requestRender);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestRender);

  fitCanvas();
  reset(false);   // initial state, no "reset" announcement on first load

  // Typeset once MathJax is ready (it loads asynchronously after this script).
  if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
    MathJax.startup.promise.then(function () { window.klunlInitEqn(); });
  } else {
    syncReadouts();
  }

})();
