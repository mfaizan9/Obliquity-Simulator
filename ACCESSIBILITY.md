# Accessibility Notes — Obliquity Simulator

Target: WCAG 2.1 AA (AAA where reasonable). Built on the KL-UNL foundation, which
supplies the palette, focus-visible handling, the masthead dialog (focus trap +
Escape + focus restoration), and responsive layout classes.

## Structure & semantics
- One `<h1>` is rendered by the `<kl-unl-masthead>` component (the sim does not add
  a competing `h1`). Panels use `<section>` with `<h2 class="panel__heading">`
  headings in order: **Obliquity Diagram**, then **Controls**.
- `<main>` landmark; `<fieldset>/<legend>` group the control; a skip link
  ("Skip to controls") targets the Controls heading.
- `<html lang="en">`.

## Text alternatives (1.1.1)
- The `<canvas>` has `role="img"`, a static `aria-label`, and
  `aria-describedby="ob-desc"`. `#ob-desc` is an `aria-live="polite"` region that
  states the current diagram in words (e.g. *"Obliquity 23.5 degrees. The earth's
  rotation axis is tilted 23.5 degrees from the perpendicular to the plane of the
  ecliptic."*), updated when a change is committed.
- The decorative HTML label overlays (degree value, "plane of ecliptic") are
  `aria-hidden="true"`; their meaning is carried by `#ob-desc`, the slider's
  `aria-valuetext`, and the live status region.

## Mathematics (MathJax)
- All math is typeset by MathJax via the foundation's `kl-unl.js`
  (`klunlShowEquation` / `klunlInitEqn`) using LaTeX, never raster or ASCII:
  - the diagram **degree label** `\(<value>^{\circ}\)` (HTML overlay, not baked
    into the canvas, so it zooms and is reachable);
  - the **min/max ticks** `\(0^{\circ}\)` / `\(180^{\circ}\)` and the `\(^{\circ}\)`
    unit shown beside the editable value field.
- The MathJax contextual menu is left enabled (`enableMenu: true`) and not trapped
  — right-clicking any symbol opens *Show Math As → TeX / MathML*. MathJax is
  vendored locally (`assets/mathjax`, SVG output, `fontCache: 'local'`) — no CDN.

## Colour & contrast (1.4.1 / 1.4.3 / 1.4.11)
- The diagram is an astronomy "space" figure on black: white arc (21:1), cream
  axis/equator `#ffffcc` (~18:1), cyan dashed lines `#66ccff` (~9:1) — all exceed
  the 3:1 bar for graphical objects. Panel chrome, controls and text use the
  KL-UNL palette variables (≥ 4.5:1).
- **No state is conveyed by colour alone**: the tilt is given numerically (degree
  label + slider value) and in the live description. The
  "plane of ecliptic" line is explicitly labelled.

## Keyboard (2.1.1 / 2.1.2 / 2.4.7)
- Two controls drive the same value, both keyboard-operable:
  - a native `<input type="range">`: focusable, visible `:focus-visible` ring, fully
    operable by keyboard — Left/Down decrement, Right/Up increment (step 0.1),
    PageUp/PageDown for larger steps, Home/End for min/max; `aria-valuetext`
    announces "Obliquity X degrees";
  - an **editable text field** (`#ob-field`, `aria-label="obliquity, degrees"`):
    type a number and press Enter (or Tab/blur) to commit. When the field is
    focused it also steps like a spinner — ArrowUp/ArrowDown change it by 0.1 and
    the mouse wheel by 1 per notch (the wheel only acts while focused, so the page
    still scrolls otherwise). The value is clamped to [0, 180] and rounded to one
    decimal; invalid entries revert to the current value. Left/Right keep their
    normal caret behaviour.
- Both paths mutate one state object, so field, slider, diagram and announcements
  stay in sync. Tab moves between them and away cleanly; no keyboard traps, and no
  canvas pointer handlers compete for focus (the canvas is display-only).
- The masthead manages its own dialog focus trap / Escape / restoration.

## Timing & motion (2.2.2 / 2.3.3)
- There is no continuous animation and nothing flashes, so no Pause control is
  needed and `prefers-reduced-motion` has nothing to suppress. The diagram only
  changes in direct response to the user. **Reset** is provided by the masthead
  (the `sim-reset` event); no second Reset button is added.

## Live region (status)
- `#sr-status` (`aria-live="polite"`, `role="status"`) announces the committed
  result on slider `change` / Reset (not on every input tick). `#ob-desc` is the
  canvas's non-live `aria-describedby` description, kept current from state. See the
  AUDIO / SCREEN-READER PASS section for the full model.

## Responsive / touch
- Layout uses the KL-UNL grid and rem/%/clamp sizing; it reflows from desktop →
  iPad → phone portrait (single column below the foundation's 56 rem breakpoint),
  with no horizontal scroll at 375 px and usable at 200 % zoom. The canvas keeps
  its 600×400 internal coordinates and is CSS-scaled with a 3:2 aspect ratio.
- The range control meets the ≥ 44 px touch target; no hover-only affordances.

## Cross-browser
- Standards-only HTML/CSS/JS (no Chrome-only APIs); explicit `drawImage` width/
  height avoid Safari's `naturalWidth === 0` SVG issue; the Verdana font is
  self-hosted with safe fallbacks.

## Still required
- Human screen-reader QA (VoiceOver / NVDA / JAWS) and a manual keyboard pass are
  recommended before release; automated checks and code review do not fully
  substitute for testing with assistive technology.

## AUDIO / SCREEN-READER PASS

This pass made the sim usable by audio alone (NVDA on Windows, VoiceOver on macOS)
using standard ARIA only. No behaviour, layout, visuals, physics, on-screen text,
MathJax, responsiveness, or cross-browser handling were changed — narration only.
All new logic is in `simulation.js`; the foundation files are untouched.

### Values made units-complete (quantity + number + unit, units as words)
There is exactly one quantity in this sim — the obliquity, in degrees.

- **Obliquity slider** (`#ob-range`, native `<input type="range">`): the accessible
  name is "obliquity" (`aria-labelledby`), and `aria-valuetext` is set to the full
  spoken phrase and updated on every change, so each keyboard step
  (arrows / PageUp/Down / Home/End) speaks the quantity, number and unit:
  - `aria-valuetext = "Obliquity 23.5 degrees"` (e.g. "Obliquity 66.6 degrees").
  `aria-valuenow` stays the raw number; the unit is the **word** "degrees", never
  the `°` glyph (which screen readers skip/mis-read).
- **Editable value field** (`#ob-field`): `aria-label="obliquity, degrees"` carries
  the quantity + unit, so focus reads "obliquity, degrees, edit text, 23.5". The `°`
  shown beside it is an `aria-hidden` MathJax symbol.
- **Diagram degree label and min/max ticks** are MathJax visuals inside
  `aria-hidden="true"` containers (the `°` symbol is shown but not spoken), so they
  add no duplicate/garbled speech; their meaning is carried for audio by the field
  name, the slider's `aria-valuetext`, the live status region, and the canvas
  description — all of which spell the unit as the word "degrees".

Negative values do not occur (range is 0–180), so no "minus"/"negative" wording is
needed; if the range ever changes, the spoken phrase should add it explicitly.

### Unit-word mappings applied
- `°` (degree glyph) → spoken as the word **"degrees"** in `aria-valuetext` and the
  live status / canvas-description text (the on-screen `°` symbols are `aria-hidden`).

### Live status region (announces what changed)
- `#sr-status` is `aria-live="polite"` with `role="status"`. It is written **only on
  commit** (slider `change`) and on **Reset**, never on intermediate drag/`input`
  ticks, so audio users are not flooded:
  - on commit: `"Obliquity 66.6 degrees. The earth’s rotation axis is tilted 66.6
    degrees from the perpendicular to the plane of the ecliptic."`
  - on masthead Reset: the same sentence prefixed with `"Simulation reset. "`.
- It is empty on first load (no spurious announcement). Only one region announces,
  so there are no double-announcements.

### Canvas description approach
- The `<canvas>` (`role="img"`) is described by `#ob-desc` via `aria-describedby`.
  `#ob-desc` is a `.sr-only` element that is **kept current from state on every
  value change** but is **not** a live region — so navigating to the diagram always
  reads its present state ("Obliquity X degrees. The earth's rotation axis is tilted
  X degrees from the perpendicular to the plane of the ecliptic."), while the
  separate `#sr-status` region does the change announcements. Decorative overlays
  (degree label, "plane of ecliptic" text, ticks) are `aria-hidden="true"`.

### Keyboard
- The single control is a native range input: reachable in logical order, operable
  by arrows / PageUp-Down / Home / End, not stuck, with Tab moving away cleanly. Its
  name + value + unit are spoken on focus and on each step.

### Verification (accessibility tree, no real screen reader in this environment)
Confirmed in-browser via the accessibility-relevant DOM: `aria-valuetext` updates
to "Obliquity X degrees" per step; `#ob-desc` updates silently and stays current;
`#sr-status` stays empty during drag, announces the full units-complete sentence on
commit, and prefixes "Simulation reset." on Reset; all decorative MathJax is
`aria-hidden`. **This does not constitute verified screen-reader compatibility** —
final confirmation requires a human listening test on **NVDA (Windows, Chrome +
Firefox)** and **VoiceOver (macOS, Chrome + Safari)**.
