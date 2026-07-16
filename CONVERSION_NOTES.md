# Conversion Notes — Obliquity Simulator

## Behavior model (one paragraph)

The Obliquity Simulator is a single-control demonstrator of axial tilt. A globe
of the earth sits at the centre of the stage with its rotation axis and an
equator/spin indicator drawn through it. A dashed horizontal line marks the
**plane of the ecliptic**; a dashed vertical line marks the perpendicular to it.
One slider, *obliquity* (range 0–180, start 23.5, precision 0.1), drives a single
`update(obliquity)` routine that: (1) draws a 3-px white arc of radius 120 from
angle `90° − obliquity` to `90°`, indicating the tilt between the vertical and the
axis; (2) rotates the whole earth assembly (globe + axis + equator) by `obliquity`
degrees; and (3) places a degree read-out of the form `obliquity + "°"` on a
circle of radius 150 at angle `90° + obliquity/2`. There is **no** animation loop
— the diagram is redrawn only when the slider value changes.

## Source → HTML5 mapping

| ActionScript (source) | HTML5 port |
|---|---|
| `DefineSprite_28/frame_1/DoAction.as` — `update(obliquity)` | `render()` + `syncReadouts()` in `simulation.js` |
| `MovieClip.prototype.drawArc` (curveTo tessellation) | `drawArcPath()` — faithful port using `quadraticCurveTo`, same `maxArcStep = 0.5`, same `y - r·sin` screen-Y-down convention |
| `lineStyle(3, 16777215, 100)` + `drawArc(0,0,120, …)` | white (`#ffffff`) 3-px arc, radius 120 |
| `earth._rotation = obliquity` | `ctx.rotate(obliquity · π/180)` around the earth centre |
| `degreeLabel._x/_y = -150·cos/sin(90° + obliquity/2)` | HTML overlay positioned in % of the stage at the same coordinates |
| `degreeLabel.labelText = obliquity + "°"` | MathJax `\(<value>^{\circ}\)` overlay (plain `Number→String`, no forced decimal — verbatim) |
| `on(initialize)` — `initMin 0 / initMax 180 / initValue 23.5 / initPrecision 1 / title "obliquity"` | `<input type="range" min=0 max=180 step=0.1 value=23.5>` + `MIN/MAX/INIT/PREC` constants |
| `SliderV3.setValue` (round to precision, clamp) | `setObliquity()` — `Math.round(k·v)/k`, clamp `[0,180]` |
| `SliderV3.toFixed` polyfill | `asFixed()` — used for the slider value label (`23.5`, `0.0`, …) and spoken text |
| `SliderV3Bar` / `SliderV3Grabber` drag + auto-repeat | replaced by the native range input (mouse, touch, **and** full keyboard for free); the Flash component framework is not ported (only its observable behaviour) |

All numeric constants (radii 120 / 150, the radian factors `0.017453292519943295`
and `0.008726646259971648`, `maxArcStep 0.5`) are copied verbatim from the source.

### Assets reused as-is vs. code-drawn

Reused exported assets (copied to `assets/`, never redrawn):

- **`earth.png`** — the globe (oceans + continents). The continents are not present
  as a vector shape in `shapes/` (the source globe uses a bitmap fill that did not
  export to `images/`); the complete, correct globe **was** available as the
  decompiler's rendered sprite `sprites/DefineSprite_21/1.png`, which is reused
  directly as the globe bitmap.
- **`axis.svg`** + **`equator.svg`** — the exported `shapes/17.svg` contains two
  paths (the rotation-axis line and the front equator arc) bundled in one shape.
  The exact path data is split into two files so they can be composited at
  different depths (axis behind the globe, equator in front) for a correct 3-D
  look — see *Deviations* below. No path data was redrawn or altered.
- **`arrow.svg`** (`shapes/22.svg`) — the equator spin-direction arrow.
- **`shading.svg`** (`shapes/24.svg`) — the globe day/night shading gradient.
- **`fonts/Verdana.ttf`** (`fonts/1_Verdana.ttf`) — the sim's interface font.

Code-drawn (no exported file exists — these are built in AS at runtime):

- the white tilt **arc** (`drawArc`), reproduced on the 2-D canvas;
- the dashed **ecliptic / vertical reference lines** (verbatim colour `#66ccff`,
  width 2, 6-px dashes). These are static background art centred on the earth.

The earth assembly is composited in the original z-order — globe, shading, axis,
spin arrow — inside a `ctx.rotate(obliquity)` transform, so it tilts as one unit
exactly like `earth._rotation` in the source.

## contents.json entry

The shared `contents.json` already contains the `obliquity` entry (sim-id
`obliquity`, title *Obliquity Simulator*, with Help and About text), so **no new
entry was added**. The masthead is wired with
`sim-id="obliquity" json-url="foundation/contents.json"`.

### Repair of malformed JSON in the provided foundation copy (required)

The `foundation/contents.json` shipped in the linked folder is **not valid JSON**:
several string values contain raw control characters (un-escaped newlines) and a
few HTML `href="…"` attributes contain un-escaped double-quotes. `JSON.parse`
(used by `kl-unl-masthead.js`) rejects the whole file, which breaks the masthead
for *every* sim, not just this one. The reference foundation copy in the sibling
*Celestial Equatorial System Demo* is already valid but does not contain the
`obliquity` entry, so it could not be substituted.

The copied `html5/foundation/contents.json` was therefore minimally repaired: a
scanner walked the file and, **inside string values only**, replaced raw
newline/tab characters with a single space and escaped stray `"` characters. This
touched **9 spots total** (5 control chars + 4 quotes); no entry's wording, keys,
ordering, or meaning was changed, and the `obliquity` entry is byte-for-byte
intact. `kl-unl-masthead.js`, `kl-unl.css`, and `kl-unl.js` are copied in
**unchanged**. (If the foundation is meant to be a single shared file maintained
elsewhere, apply the same escaping fix upstream and this local repair becomes
unnecessary.)

## Deviations from the original

- **Layout follows the KL-UNL shell, not the Flash pixel layout.** The diagram is
  a `<canvas>` in one panel (original 600×400 internal coordinates, CSS-scaled,
  preserving aspect ratio); the slider is a native control in a separate
  *Controls* panel rather than a draw-in-stage Flash component. Panel grouping and
  reading order mirror the original (diagram, then control). Earth centre is placed
  at stage (300, 185) to match the screenshot composition (ecliptic line through
  the centre, tilt arc and degree label above).
- **No animation / requestAnimationFrame loop.** The original has none either; the
  diagram is redrawn synchronously on each value change.
- **Editable value field added (at user request).** The original slider's value
  label was display-only. An accessible numeric text field (`#ob-field`) now lets
  the user type an obliquity directly (0–180, one decimal), matching the KL-UNL
  pipeline convention of pairing a field with a slider. Entries are clamped/rounded
  by the same `setObliquity()` used by the slider, so both paths share one state and
  stay in sync; the field and slider carry a MathJax `°` unit / tick labels.
- **3-D correctness fixes (at user request).** The original Flash clip rotated the
  whole assembly — including the shading and the axis — as one unit, which (a) spun
  the day/night shading with the tilt and (b) painted the axis as a line lying on
  top of the globe. Both break the intended 3-D depiction, so:
  - The **day/night shading is now fixed in space**, not rotated with the obliquity.
    It represents the hemisphere facing away from the Sun (the Sun is off-screen to
    the right), so the dark side always stays on the **left**. (`shading.svg` is
    drawn outside the `ctx.rotate(obliquity)` transform, clipped to the globe.)
  - The **rotation axis is drawn behind the globe**, so it emerges from the north
    and south poles and is occluded by the sphere in between, instead of overlaying
    it. (The axis path is drawn before the globe.)
  - The **spin-direction ring is depth-sorted around the globe**: its FAR half
    (`equator.svg`) is drawn *behind* the globe (occluded by the sphere in the
    middle, peeking out at the sides) and its NEAR half + arrowhead (`arrow.svg`)
    *in front*. Drawing the whole ring on top made it a flat ellipse that flipped
    ambiguously between clockwise/counter-clockwise; hiding the far half behind the
    Earth (as the original did, via a mask) fixes the read as rotation toward the
    east.
  These change only the *compositing order / rotation* of already-exported art;
  no geometry, colour, physics, or numeric behaviour changed.
- The degree label and value read-outs are typeset by **MathJax** (so they are
  zoomable and screen-reader friendly) instead of being baked into the canvas.

## Verification performed (served over HTTP, no emulator)

- Masthead loads title + Reset/Help/About from `contents.json`; Help button shown
  (obliquity has Help text).
- Diagram renders: globe centred, cream axis tilted through centre, dashed
  ecliptic/vertical cross, white arc spanning exactly `90°−obliquity … 90°`
  (verified absent below/left of that range), degree label at the computed point.
- Slider drives the arc, earth rotation and labels; positions verified at
  obliquity 0 / 90 / 180 / 23.5 against the AS formulas; **Reset** (via the
  `sim-reset` event) restores 23.5.
- `aria-valuetext` and the spoken read-out update on commit.
- Mobile (375 px) reflows to a single column with no horizontal overflow.
