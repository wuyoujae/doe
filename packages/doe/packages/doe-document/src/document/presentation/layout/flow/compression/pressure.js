import { paintedScale, visibleTextTargets } from './targets.js';
import { contentGridCapacities } from './content-grid.js';
import { validNestedFactors } from './policy.js';
import { scope } from '../../../runtime/context/index.js';
import { countOverlaps } from '../../../../../../../doe-canvas/src/measurement/count-overlaps/index.js';
import { paintedSurface } from '../../../canvas/renderer/image-surface/index.js';
import { logicalContentCapacity } from '../../../../../../../doe-component/src/layout/flow/contract.js';

const px = value => parseFloat(value) || 0;
const tolerance = 1;
// Browser layout quantizes fractional coordinates to 1/64 CSS px. Accept one
// layout quantum, never a whole pixel of SafeArea overflow.
export const SAFE_EDGE_EPSILON = 1 / 64;
const visible = node => node.getClientRects().length && !node.closest('[hidden], [data-slide-export-ignore], defs');

function paintBounds(element) {
  const box = element.getBoundingClientRect();
  const bounds = { left: box.left, top: box.top, right: box.right, bottom: box.bottom };
  for (const child of element.querySelectorAll('[data-semantic-wrap], [data-typography-style], svg, img, video, canvas')) {
    if (!visible(child) || child.closest('.component-media')) continue;
    const rect = child.getBoundingClientRect();
    bounds.left = Math.min(bounds.left, rect.left); bounds.right = Math.max(bounds.right, rect.right);
    bounds.top = Math.min(bounds.top, rect.top); bounds.bottom = Math.max(bounds.bottom, rect.bottom);
  }
  return bounds;
}

/** Remaining height belongs to a slot, not to the last node crossing the page. */
export function slotBudgets(state) {
  const records = new Map([...state.groupRecords, ...state.leafRecords].map(r => [r.node.id, r]));
  const budgets = new Map();
  const viewport = state.slideElement.getBoundingClientRect().width / scope.CANVAS.renderWidth;
  const height = node => records.get(node.id).shell.getBoundingClientRect().height / viewport;
  function visit(nodes, available, columns = 1, gap = 0, root = false) {
    const rows = [];
    for (let i = 0; i < nodes.length; i += columns) rows.push(nodes.slice(i, i + columns));
    const heights = rows.map(row => Math.max(0, ...row.map(height)));
    const gaps = root ? nodes.reduce((sum, node) => {
      const shell = records.get(node.id).shell;
      return sum + px(shell.style.marginBottom) * paintedScale(shell);
    }, 0) : Math.max(0, rows.length - 1) * gap;
    const total = heights.reduce((a, b) => a + b, 0) + gaps;
    rows.forEach((row, index) => row.forEach(node => {
      const capacity = Math.max(0, available - total + heights[index]);
      budgets.set(node.id, capacity);
      const record = records.get(node.id);
      if (node.children) visit(node.children, capacity, record.resolvedColumns || 1,
        (record.gap || 0) * paintedScale(record.content || record.element));
    }));
  }
  visit(state.flowTopRecords.map(r => r.node), state.flowSafeArea.content.height, 1, 0, true);
  return budgets;
}

function contentOwner(field, record) {
  const target = field.target;
  const surface = record.flowContract?.contentGrid?.surface;
  if (surface && target.closest(surface)) return target.closest(surface);
  return target.closest('.component-stat, .item-cards__surface, .shape-contents__copy, .doe-diagram__value-box, td, th, [data-collection-item-index]') || record.element;
}

/** Compare text and capacity in the same unscaled surface coordinates. */
export function contentPressure(state, pendingTruncation = new Set()) {
  const failures = [];
  const viewport = state.slideElement.getBoundingClientRect().width / scope.CANVAS.renderWidth;
  for (const record of state.leafRecords) {
    const fields = state.flowTextTargets.filter(field => field.id === record.node.id && !field.constraintOnly && visible(field.target));
    const owners = new Map();
    for (const field of fields) {
      const owner = contentOwner(field, record);
      if (!owners.has(owner)) owners.set(owner, []);
      owners.get(owner).push(field);
    }
    const geometry = state.flowGeometry.get(record.node.id);
    if (!geometry || !fields.length) continue;
    const budget = logicalContentCapacity(state.flowContentBudgets?.get(record.node.id) ?? geometry.availableHeight,
      geometry.insetY || 0, geometry.paintScale ?? paintedScale(record.element));
    const gridCapacities = contentGridCapacities(record, budget, viewport * paintedScale(record.element));
    const shapeRows = [...record.element.querySelectorAll('.shape-contents__row')];
    const chart = record.definition.category === 'charts' && !record.definition.independentItemText;
    for (const [owner, members] of owners) {
      const bounded = ['fixed', 'bounded'].includes(record.flowContract?.itemGeometry) && owner !== record.element;
      const scale = viewport * paintedScale(owner);
      const style = getComputedStyle(owner);
      // A heading/text can itself own the box. Its measured border box already
      // includes chrome; adding that chrome again creates false font pressure.
      let inset = members.some(field => field.target === owner) ? 0
        : px(style.paddingTop) + px(style.paddingBottom) + px(style.borderTopWidth) + px(style.borderBottomWidth);
      const measurements = members.map(field => {
        const box = field.target.getBoundingClientRect(), css = getComputedStyle(field.target);
        const chrome = px(css.paddingTop) + px(css.paddingBottom) + px(css.borderTopWidth) + px(css.borderBottomWidth);
        return { field, top: box.top / scale, bottom: box.bottom / scale, visibleHeight: box.height / scale,
          // Auto-height fields already expose all line boxes. scrollHeight also
          // includes font ink outside tight line-height (e.g. metric numbers).
          // Only bounded fields/editors need their hidden scrollable content.
          // scrollHeight and clientHeight round to integers together. Only
          // their difference indicates hidden content; keep visible fractions.
          height: box.height / scale + (bounded || field.target.dataset.semanticEditing === 'true'
            ? Math.max(0, field.target.scrollHeight - field.target.clientHeight) : 0),
          line: (px(css.lineHeight) || px(css.fontSize) * 1.2) + chrome,
          margins: px(css.marginTop) + px(css.marginBottom) };
      });
      const span = Math.max(...measurements.map(m => m.bottom)) - Math.min(...measurements.map(m => m.top));
      // The browser quantum is in painted CSS coordinates. Convert it back
      // through preview/component scale before comparing logical capacities.
      const heightTolerance = Math.max(SAFE_EDGE_EPSILON, SAFE_EDGE_EPSILON / scale) + 1e-6;
      const measuredGrid = gridCapacities.has(owner);
      if (measuredGrid) {
        // The measured remainder includes icons, chrome, and row stretching.
        // Summing computed CSS insets reintroduces zoom rounding: a naturally
        // fitting card could otherwise report pressure at every font size.
        inset = Math.max(0, owner.getBoundingClientRect().height / scale - span);
      }
      const rowGap = Math.max(0, span - measurements.reduce((sum, m) => sum + (measuredGrid ? m.visibleHeight : m.height), 0));
      // Grid insets already contain margins outside the measured text span;
      // gaps/margins inside it are already in span. Count neither twice.
      const textSpacing = measuredGrid ? rowGap : Math.max(rowGap, measurements.reduce((sum, m) => sum + m.margins, 0));
      const contract = record.definition.resolveLayoutContract?.(record.node.props) || record.definition.layoutContract;
      // Lack of page space is external pressure. It cannot erase the item's
      // default geometry, nested padding, or gaps between already fitting fields.
      const reflow = record.flowContract?.surfaceScale === 'reflow' && !bounded;
      const minimumLine = m => reflow && m.field.basePt > 0
        ? m.line * Math.min(1, m.field.ladder.at(-1) / (px(getComputedStyle(m.field.target).fontSize) * .75)) : m.line;
      const retained = m => reflow ? minimumLine(m) : Math.max(m.line, state.flowCompression.height[m.field.key] || 0);
      const minimum = Math.max(gridCapacities.has(owner) ? 0 : Number(contract?.minHeight) || 0,
        inset + rowGap + measurements.reduce((sum, m) => sum + Math.min(m.height, minimumLine(m)), 0));
      let capacity = Math.max(minimum, budget);
      if (bounded) {
        // inset includes borders, so capacity must use the same border box.
        capacity = owner.getBoundingClientRect().height / scale;
      } else if (gridCapacities.has(owner)) {
        capacity = Math.max(minimum, gridCapacities.get(owner));
      } else if (shapeRows.length) {
        const rowGap = shapeRows.reduce((sum, row) => sum + px(getComputedStyle(row).marginBottom), 0);
        const gap = px(getComputedStyle(record.element).getPropertyValue('--shape-contents-gap'));
        capacity = Math.max(minimum, 80 - gap, (budget - rowGap) / shapeRows.length - gap);
      } else if (owner.matches('.shape-contents__copy')) {
        capacity = Math.max(minimum, owner.offsetHeight - Math.max(0, geometry.height - (geometry.insetY || 0) - budget));
      }
      // Charts own their native label boxes. Adding data rows/series is external
      // geometry pressure, not permission to shrink all labels on the page.
      if (chart) capacity = Infinity;
      const contentHeight = measuredGrid
        ? span + measurements.reduce((sum, m) => sum + m.height - m.visibleHeight, 0)
        : Math.max(span, measurements.reduce((sum,m)=>sum+m.height+m.margins,0));
      const vertical = Math.max(0, contentHeight + inset - capacity);
      const allowed = m => bounded ? Math.max(0, capacity - inset - rowGap - measurements.filter(other=>other!==m).reduce((sum,other)=>sum+Math.min(other.height,other.line),0)) + heightTolerance : Math.max(retained(m),
        capacity - inset - rowGap - measurements.filter(other => other !== m).reduce((sum, other) => sum + Math.min(other.height, minimumLine(other)), 0)) + heightTolerance;
      const tooTall = measurements.filter(m => m.height > allowed(m));
      if (vertical > heightTolerance && !tooTall.length) {
        const growing = measurements.filter(m => m.height > retained(m) + heightTolerance);
        const source = growing.find(m => (state.flowChanges || []).some(change => change.id === m.field.id &&
          change.paths?.some(path => path.every((part, i) => m.field.path[i] === part))));
        // A multi-line title is not the culprit merely because it precedes a
        // much longer body. Keep solving the field consuming the extra room.
        const largest = growing.sort((a, b) =>
          (b.height - retained(b)) - (a.height - retained(a)))[0];
        if (source || largest) tooTall.push(source || largest);
      }
      for (const m of measurements) {
        const field = m.field, target = field.target;
        const svg = target.namespaceURI === 'http://www.w3.org/2000/svg' ? target.ownerSVGElement : null;
        const svgBox = svg?.getBoundingClientRect(), textBox = target.getBoundingClientRect();
        const horizontal = svgBox
          ? Math.max(0, (textBox.right - svgBox.right) / scale, (svgBox.left - textBox.left) / scale)
          : Math.max(0, target.scrollWidth - target.clientWidth - 2);
        const blocked = target.dataset.semanticWrapStatus === 'blocked' && target.dataset.semanticEditing !== 'true';
        // A short peer never inherits the tallest item's text pressure.
        const ownsHeight = vertical > heightTolerance && tooTall.includes(m);
        const truncated = target.dataset.flowTruncated === 'true';
        if (horizontal > tolerance || (blocked && !truncated) || ownsHeight) failures.push({ key: field.key, id: field.id, path: field.path,
          // Truncation is a final projection: reserve actual sibling lines, not
          // their hypothetical one-line minimum, including all field margins.
          // Only peers awaiting projection in THIS pass reserve their minimum;
          // subsequent projections see the actual boxes already produced.
          availableHeight: Math.max(0, capacity - inset - textSpacing
            - measurements.filter(other => other !== m).reduce((sum, other) => sum + (pendingTruncation.has(other.field.key) ? Math.min(other.height, other.line) : other.height), 0)),
          overflowX: horizontal, overflowY: ownsHeight ? vertical : 0, blocked });
      }
    }
  }
  return failures;
}

export function measureCompressionPressure(state, density, spacing) {
  const viewport = state.slideElement.getBoundingClientRect().width / scope.CANVAS.renderWidth;
  // Match content capacity's painted-coordinate quantum at thumbnail zoom.
  const edgeTolerance = Math.max(SAFE_EDGE_EPSILON, SAFE_EDGE_EPSILON / viewport) + 1e-6;
  const page = state.slideElement.getBoundingClientRect(), area = state.flowSafeArea.content;
  const bottom = page.top + (area.y + area.height) * viewport;
  const top = page.top + area.y * viewport;
  let pageOverflowY = 0, overflowX = 0;
  for (const record of state.flowTopRecords) {
    const box = record.shell.getBoundingClientRect();
    pageOverflowY = Math.max(pageOverflowY, (box.bottom - bottom) / viewport, (top - box.top) / viewport);
  }
  const external = [];
  for (const record of [...state.groupRecords, ...state.leafRecords]) {
    const geometry = state.flowGeometry.get(record.node.id);
    if (!geometry) continue; // Intentional full-bleed viewport.
    const element = record.node.children ? record.content : paintedSurface(record);
    // Child surfaces are measured below. A Group also contains editor controls;
    // their asynchronously mounted icons are not part of its painted content.
    const box = record.node.children ? element.getBoundingClientRect() : paintBounds(element);
    const slot = record.shell.getBoundingClientRect();
    const widthOverflow = Math.max(0, (box.right - slot.right) / viewport, (slot.left - box.left) / viewport);
    const heightOverflow = Math.max(0, (box.bottom - bottom) / viewport, (top - box.top) / viewport);
    // Normalize each axis before exposing pressure to layout decisions. A real
    // height overflow must not carry a sub-quantum width residue into reflow.
    const amount = widthOverflow > edgeTolerance ? widthOverflow : 0;
    const vertical = heightOverflow > edgeTolerance ? heightOverflow : 0;
    if (amount || vertical) external.push({ id: record.node.id, overflowX: amount, overflowY: vertical });
    overflowX = Math.max(overflowX, amount);
    pageOverflowY = Math.max(pageOverflowY, (box.bottom - bottom) / viewport, (top - box.top) / viewport);
  }
  const internal = contentPressure(state);
  const nestedFits = validNestedFactors(state.slide.blocks, state.flowCompression.factor);
  const overflowY = pageOverflowY <= edgeTolerance ? 0 : pageOverflowY;
  overflowX = overflowX <= edgeTolerance ? 0 : overflowX;
  const overlaps = countOverlaps(state.siblingSets);
  const fontPressure = visibleFontPressure(state.flowTextTargets, viewport);
  const scaleRejections = state.flowScaleRejections || [];
  const fits = !overflowX && !overflowY && !internal.length && nestedFits && !overlaps && !fontPressure.length && !scaleRejections.length;
  const minimumFontPx = state.flowTextTargets.filter(field => visible(field.target)).flatMap(visibleTextTargets)
    .filter(glyph => visible(glyph.target)).reduce((minimum, glyph) => Math.min(minimum, visibleFontPx(glyph.target, viewport)), Infinity);
  return { density: density.id, densityIndex: 0, fits, overflowX, overflowY, pageOverflowY: overflowY,
    componentOverflowX: overflowX, componentOverflowY: 0, internalPressure: internal, externalPressure: external,
    overlaps, minWidthViolations: 0, compressionFitViolations: Number(!nestedFits) + scaleRejections.length, diagramFitViolations: 0,
    semanticWrapViolations: internal.filter(p => p.blocked).length, minFontViolations: fontPressure.length, fontPressure, scaleRejections,
    minimumFontPx: Number.isFinite(minimumFontPx) ? minimumFontPx : null, unusedHeight: 0,
    measurementMode: 'flow-local-v4', score: overflowX + overflowY + internal.reduce((sum, p) => sum + p.overflowX + p.overflowY + Number(p.blocked), 0) + fontPressure.length * 1000 + scaleRejections.length * 1000, spacing };
}

function visibleFontPx(target, viewport) {
  let scale = paintedScale(target);
  if (target.namespaceURI === 'http://www.w3.org/2000/svg') {
    const matrix = target.getScreenCTM?.();
    if (matrix && [matrix.a, matrix.b, matrix.c, matrix.d].every(Number.isFinite) && viewport > 0) {
      // Screen CTM includes nested SVG viewBoxes, CSS zoom and transforms. Its
      // smallest singular value catches squashed glyphs on either axis; remove
      // only the slide preview scale, without counting component zoom twice.
      const {a, b, c, d} = matrix;
      const sum = a*a + b*b + c*c + d*d;
      const determinant = a*d - b*c;
      scale = Math.sqrt(Math.max(0, (sum - Math.sqrt(Math.max(0, sum*sum - 4*determinant*determinant))) / 2)) / viewport;
    }
  }
  return px(getComputedStyle(target).fontSize) * scale;
}

/** Theme/author floors apply to final glyph pixels, including SVG transforms. */
export function visibleFontPressure(fields, viewport = 1) {
  return fields.filter(field => visible(field.target)).flatMap(field => {
    const violation = visibleTextTargets(field).filter(glyph => visible(glyph.target)).map(({ target, minimumPt }) => ({
      minimumPt, actualPt: visibleFontPx(target, viewport) * .75,
    })).find(({ minimumPt, actualPt }) => Number.isFinite(minimumPt) && actualPt + .011 < minimumPt);
    return violation ? [{ id: field.id, path: field.path, key: field.key, ...violation }] : [];
  });
}
