import { fontLadder } from './policy.js';
import { continuousFontPt } from './continuous.js';
import { textTargets, rememberGlyphFloor } from './targets.js';
import { scope } from '../../../runtime/context/index.js';
import { restoreTextOverflow } from '../../../../../../../doe-core/src/text/overflow/index.js';

/** Restore only styles owned by the solver; never reset a component stylesheet. */
export function clearCompressionStyles(state) {
  for (const field of state.flowTextTargets || []) restoreTextOverflow(field.target);
  for (const [element, properties] of state.flowStyleRestore || []) {
    for (const [property, value, priority] of properties) {
      if (value) element.style.setProperty(property, value, priority);
      else element.style.removeProperty(property);
    }
    delete element.dataset.flowPaintScale;
    delete element.dataset.flowFontPt;
    delete element.dataset.semanticResolvedFontSize;
  }
  state.flowStyleRestore = new Map();
  state.flowTextTargets = [];
  state.flowScaleRejections = [];
}

function ownedStyle(state, element, property, value) {
  const saved = state.flowStyleRestore.get(element) || [];
  if (!saved.some(([name]) => name === property)) saved.push([property, element.style.getPropertyValue(property), element.style.getPropertyPriority(property)]);
  state.flowStyleRestore.set(element, saved);
  element.style.setProperty(property, value);
}

export function applyTextCompression(state, record) {
  const fields = textTargets(record, state);
  state.flowTextTargets.push(...fields);
  for (const field of fields) {
    if (field.constraintOnly || field.typographyLocked) continue;
    if (field.target.dataset.semanticWrap && field.target.dataset.semanticOriginalInlineFontSize === undefined) {
      field.target.dataset.semanticOriginalInlineFontSize = field.target.style.fontSize || '';
    }
    const step = Math.min(field.ladder.length - 1, state.flowCompression.text[field.key] || 0);
    const continuous = state.previewEnumTextFit ? undefined : state.flowCompression.textRatio[field.key];
    if (!step && !(continuous < 1)) continue;
    const pt = continuous === undefined ? field.ladder[step] : continuousFontPt(field.basePt, continuous, field.ladder.at(-1));
    // Authored rich-text enums remain enums. Their inherited tokens follow the
    // same local adjustment when semantic rendering recreates run spans.
    const style = getComputedStyle(field.target);
    const tokens = Object.keys(scope.TYPOGRAPHY_STYLES).map(id => [id, parseFloat(style.getPropertyValue(`--typography-${id}-size`))]);
    for (const [id, base] of tokens) if (Number.isFinite(base)) {
      const ladder = fontLadder(base, scope.TYPOGRAPHY_STYLES, state.slide.typography.sizeMode, field.minimumPt);
      const size = continuous === undefined ? ladder[Math.min(step, ladder.length - 1)] : continuousFontPt(base, continuous, ladder.at(-1));
      ownedStyle(state, field.target, `--typography-${id}-size`, `${size}pt`);
    }
    ownedStyle(state, field.target, 'font-size', `${pt}pt`);
    field.target.dataset.flowFontPt = String(pt);
    field.target.dataset.semanticResolvedFontSize = `${pt}pt`;
    // Inline semantic sizes keep their relative hierarchy, with the same small floor.
    const floor = field.ladder.at(-1), ratio = pt / field.basePt;
    for (const child of field.target.querySelectorAll('[style*="font-size"]:not([data-doe-text-run])')) {
      const childPt = parseFloat(getComputedStyle(child).fontSize) * 72 / 96;
      ownedStyle(state, child, 'font-size', `${Math.max(Math.min(floor, childPt), childPt * ratio)}pt`);
      rememberGlyphFloor(field, child, Math.min(floor, childPt));
    }
  }
}

export function applySurfaceScale(state, element, scale, width, contract) {
  if (!(scale < 1)) return false;
  if (contract?.surfaceScale === 'reflow') {
    (state.flowScaleRejections ||= []).push({ componentId: element.dataset.componentId || null, scale });
    return false;
  }
  ownedStyle(state, element, 'zoom', String(scale));
  ownedStyle(state, element, 'width', `${width}px`);
  ownedStyle(state, element, 'max-width', 'none');
  ownedStyle(state, element, 'flex-shrink', '0');
  element.dataset.flowPaintScale = String(scale);
  return true;
}

