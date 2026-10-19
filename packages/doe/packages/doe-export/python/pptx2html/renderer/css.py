"""CSS generation for the pptx2html slide viewer.

Produces a complete CSS string that covers the viewer chrome,
slide frames, shapes, text, images, tables, and navigation.
All positional values use **pt** for pixel-perfect round‑tripping
with PowerPoint.
"""

# ======================================================================
# Viewer chrome
# ======================================================================

VIEWER_CSS = """
.pptx-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  background: #f0f0f0;
  font-family: system-ui, -apple-system, sans-serif;
  user-select: none;
}

/* ---- slide stage ------------------------------------------------- */
.pptx-stage {
  position: relative;
  width: 100%;
  max-width: 100vw;
  overflow: hidden;
  display: flex;
  justify-content: center;
  padding: 16pt 0;
}

.pptx-slide {
  position: relative;
  margin: 0 auto;
  background: #ffffff;
  box-shadow: 0 2pt 8pt rgba(0,0,0,0.18);
  display: none;
  transform-origin: top left;
}
.pptx-slide.active {
  display: block;
}

/* ---- shapes ------------------------------------------------------ */
.pptx-shape {
  position: absolute;
  box-sizing: border-box;
  overflow: visible;
}
.pptx-geometry-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

/* ---- text frame -------------------------------------------------- */
.pptx-text-frame {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: visible;
  display: flex;
  flex-direction: column;
  font-kerning: normal;
  text-rendering: geometricPrecision;
  line-break: strict;
}

.pptx-paragraph {
  margin: 0;
  line-height: 1;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: normal;
  word-break: normal;
}

.pptx-run {
  white-space: pre-wrap;
  font-kerning: normal;
}
.pptx-bullet {
  white-space: pre;
  font-kerning: normal;
}
.pptx-field {
  white-space: pre-wrap;
}

/* ---- picture ----------------------------------------------------- */
.pptx-image-clip {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.pptx-picture .pptx-image-clip img {
  display: block;
  object-fit: fill;
}
.pptx-image-tile {
  position: absolute;
  inset: 0;
}

/* ---- group ------------------------------------------------------- */
.pptx-group {
  overflow: visible;
}

/* ---- table ------------------------------------------------------- */
.pptx-table {
  width: 100%;
  height: 100%;
  border-collapse: collapse;
}
.pptx-table td {
  border: 0;
  padding: 4pt;
  vertical-align: top;
  font-size: 10pt;
}

/* Placeholder provenance is retained in the DOM for editing/debugging.
   PowerPoint does not draw placeholder bounds during playback/export, so the
   fidelity renderer must not add a visible debugging outline. */
.pptx-placeholder {
  outline: none;
}

/* ---- navigation -------------------------------------------------- */
.pptx-nav {
  display: flex;
  align-items: center;
  gap: 12pt;
  padding: 8pt 0 24pt;
}
.pptx-nav button {
  cursor: pointer;
  padding: 6pt 16pt;
  font-size: 18pt;
  border: 1pt solid #ccc;
  background: #fff;
  border-radius: 4pt;
  transition: background 0.15s;
}
.pptx-nav button:hover {
  background: #e8e8e8;
}
.pptx-nav button:disabled {
  opacity: 0.4;
  cursor: default;
}
.pptx-page-info {
  font-size: 11pt;
  color: #555;
  min-width: 60pt;
  text-align: center;
}

/* ---- connector placeholder --------------------------------------- */
.pptx-connector {
  overflow: visible;
}
.pptx-connector svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* ---- chart placeholder ------------------------------------------- */
.pptx-chart-placeholder {
  background: #fafafa;
  color: #333;
  font-size: 9pt;
  border: 1pt dashed #ccc;
  box-sizing: border-box;
  overflow: auto;
  padding: 6pt;
}
.pptx-chart-title {
  font-weight: 700;
  margin-bottom: 2pt;
}
.pptx-chart-type {
  color: #777;
  font-size: 8pt;
  margin-bottom: 5pt;
}
.pptx-chart-data {
  width: 100%;
  border-collapse: collapse;
}
.pptx-chart-data th,
.pptx-chart-data td {
  border: 0.5pt solid #d0d0d0;
  padding: 2pt 3pt;
  text-align: left;
  vertical-align: top;
}

/* ---- thumbnail / small mode -------------------------------------- */
.pptx-viewer.thumbnail .pptx-slide {
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}
.pptx-viewer.thumbnail .pptx-slide.active {
  opacity: 1;
}
"""

# ======================================================================
# Shape geometry presets → CSS
# ======================================================================

# Common preset geometry names and their CSS equivalents.
# Maps `prst` attribute value to a (border-radius, clip-path) tuple.
GEOMETRY_CSS: dict[str, str] = {
    "rect": "",
    "roundRect": "border-radius: 8pt;",
    "ellipse": "border-radius: 50%;",
    "diamond": "clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);",
    "triangle": "clip-path: polygon(50% 0%, 0% 100%, 100% 100%);",
    "rtTriangle": "clip-path: polygon(0% 0%, 100% 0%, 0% 100%);",
    "pentagon": "clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);",
    "hexagon": "clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);",
    "octagon": "clip-path: polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%);",
    "star5": "clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);",
    "rightArrow": "clip-path: polygon(0% 0%, 75% 0%, 75% 25%, 100% 50%, 75% 75%, 75% 100%, 0% 100%);",
    "leftArrow": "clip-path: polygon(25% 0%, 100% 0%, 100% 100%, 25% 100%, 25% 75%, 0% 50%, 25% 25%);",
    "upArrow": "clip-path: polygon(50% 0%, 100% 25%, 75% 25%, 75% 100%, 25% 100%, 25% 25%, 0% 25%);",
    "downArrow": "clip-path: polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 50% 100%, 25% 75%, 0% 75%);",
    "arrowRight": "clip-path: polygon(0% 0%, 75% 0%, 75% 25%, 100% 50%, 75% 75%, 75% 100%, 0% 100%);",
    "arrowLeft": "clip-path: polygon(25% 0%, 100% 0%, 100% 100%, 25% 100%, 25% 75%, 0% 50%, 25% 25%);",
    "arrowUp": "clip-path: polygon(50% 0%, 100% 25%, 75% 25%, 75% 100%, 25% 100%, 25% 25%, 0% 25%);",
    "arrowDown": "clip-path: polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 50% 100%, 25% 75%, 0% 75%);",
    "chevron": "clip-path: polygon(0% 0%, 65% 0%, 85% 50%, 65% 100%, 0% 100%, 20% 50%);",
    "homePlate": "clip-path: polygon(0% 10%, 10% 0%, 90% 0%, 100% 10%, 100% 90%, 50% 100%, 0% 90%);",
    "sun": "clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);",
    "moon": "clip-path: circle(50% at 60% 50%);",
    "cloud": "border-radius: 50%;",  # approximate
    "heart": "clip-path: path('M50,30 A20,20,0,0,1,90,30 A20,20,0,0,1,50,80 A20,20,0,0,1,10,30 A20,20,0,0,1,50,30');",
    "lightningBolt": "clip-path: polygon(30% 0%, 15% 45%, 35% 45%, 20% 100%, 75% 40%, 50% 40%, 70% 0%);",
    "flowChartProcess": "",
    "flowChartDecision": "clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);",
    "flowChartInputOutput": "clip-path: polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%);",
    "flowChartPredefinedProcess": "",
    "flowChartDocument": "clip-path: polygon(0% 0%, 100% 0%, 100% 80%, 70% 100%, 0% 80%);",
}

# FIXME: more geometry presets — see FIXME.md
