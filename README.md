# Obliquity Simulator (Accessible HTML5)

An accessible HTML5 rebuild of the Flash *Obliquity Simulator*, on the shared
KL-UNL foundation.

## It must be served over HTTP — it will NOT run from a double-clicked file

Opening `index.html` directly (a `file://` path) shows an empty / broken
masthead. **Why:** the KL-UNL masthead (`foundation/kl-unl-masthead.js`) loads
its title / Help / About text with `fetch('foundation/contents.json')`, and
browsers block `fetch()` of local files over `file://` (same-origin policy).
Served over HTTP the fetch succeeds and the sim loads normally.

## How to run it locally

From **inside this `html5/` folder**, start any static server:

```
# Python
python3 -m http.server 8123
#   then open  http://localhost:8123/

# Node
npx serve
#   (or)  npx http-server

# VS Code
#   use the "Live Server" extension
```

Because you serve from inside `html5/`, the sim is at the server **root** — open
`http://localhost:8123/`, not `.../html5/index.html`.

## Production

Deployed to the cloud host (served over HTTP/HTTPS) it just works; the `file://`
limitation only affects local double-clicking.

## Layout

```
html5/
  index.html            KL-UNL scaffold (masthead + diagram + controls panels)
  styles/styles.css     sim-specific styles only (foundation CSS is untouched)
  simulation.js         all sim logic
  foundation/           KL-UNL files, copied in UNCHANGED
  assets/               reused exported art (globe bitmap, axis/arrow/shading
                        SVGs), the Verdana font, and a local MathJax build
  README.md / CONVERSION_NOTES.md / ACCESSIBILITY.md
```
