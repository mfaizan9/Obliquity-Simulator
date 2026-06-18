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
  `aria-hidden="true"`; their meaning is carried by `#ob-desc` and the read-out.

## Mathematics (MathJax)
- All math is typeset by MathJax via the foundation's `kl-unl.js`
  (`klunlShowEquation` / `klunlInitEqn`) using LaTeX, never raster or ASCII:
  - the diagram **degree label** `\(<value>^{\circ}\)` (HTML overlay, not baked
    into the canvas, so it zooms and is reachable);
  - the slider **value** `\(<value>\)` and the **min/max ticks** `\(0\)` / `\(180\)`;
  - the **read-out** `\(\text{obliquity} = <value>^{\circ}\)`, paired with a
    spoken string (`#ob-eqn-sr`).
- The MathJax contextual menu is left enabled (`enableMenu: true`) and not trapped
  — right-clicking any symbol opens *Show Math As → TeX / MathML*. MathJax is
  vendored locally (`assets/mathjax`, SVG output, `fontCache: 'local'`) — no CDN.

## Colour & contrast (1.4.1 / 1.4.3 / 1.4.11)
- The diagram is an astronomy "space" figure on black: white arc (21:1), cream
  axis/equator `#ffffcc` (~18:1), cyan dashed lines `#66ccff` (~9:1) — all exceed
  the 3:1 bar for graphical objects. Panel chrome, controls and text use the
  KL-UNL palette variables (≥ 4.5:1).
- **No state is conveyed by colour alone**: the tilt is given numerically (degree
  label + read-out), as the slider value, and in the live description. The
  "plane of ecliptic" line is explicitly labelled.

## Keyboard (2.1.1 / 2.1.2 / 2.4.7)
- The sole control is a native `<input type="range">`: focusable, with a visible
  `:focus-visible` ring (from the foundation), and fully operable by keyboard —
  Left/Down decrement, Right/Up increment (step 0.1), PageUp/PageDown for larger
  steps, Home/End for min/max. `aria-valuetext` announces the formatted value
  ("23.5 degrees"). Tab moves away cleanly; there are no keyboard traps and no
  canvas pointer handlers competing for focus (the canvas is display-only).
- The masthead manages its own dialog focus trap / Escape / restoration.

## Timing & motion (2.2.2 / 2.3.3)
- There is no continuous animation and nothing flashes, so no Pause control is
  needed and `prefers-reduced-motion` has nothing to suppress. The diagram only
  changes in direct response to the user. **Reset** is provided by the masthead
  (the `sim-reset` event); no second Reset button is added.

## Live region (status)
- `#ob-desc` (`aria-live="polite"`) announces the committed result on slider
  `change` (not on every input tick), keeping wording consistent with the visible
  read-out.

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
