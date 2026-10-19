import { IMAGE_SURFACE_VERSION, imageSurfaceBackground, imageSurfacePolicy } from '../../../../../../../doe-component/src/shared/appearance/image-surface/policy.js';
/** Compact deterministic change stamps; these are cache keys, not security hashes. */
const stamp = value => {
  let a = 2166136261, b = 5381;
  for (const char of JSON.stringify(value ?? null)) {
    a = Math.imul(a ^ char.charCodeAt(0), 16777619);
    b = Math.imul(b, 33) ^ char.charCodeAt(0);
  }
  return `${(a >>> 0).toString(16).padStart(8,'0')}${(b >>> 0).toString(16).padStart(8,'0')}`;
};

function fontMetrics(state) {
  const doc = state.slideElement?.ownerDocument;
  if (!doc?.fonts) return [];
  const context = doc.createElement('canvas').getContext('2d'), samples = new Map();
  for (const field of state.flowTextTargets) {
    const css = getComputedStyle(field.target), font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
    if (!samples.has(font)) samples.set(font, new Set());
    const characters = samples.get(font);
    for (const char of (field.target.dataset.semanticSource || field.target.textContent || '').replace(/\s/g, '')) characters.add(char);
  }
  return [...samples].map(([font, characters]) => {
    // Include every used character: a late CJK subset may contain none of the
    // first few glyphs. One deduplicated measurement per font keeps this bounded.
    const text = [...characters].join('');
    context.font = font;
    return [font, context.measureText(text).width, doc.fonts.check(font, text)];
  });
}

export function compressionInputs(state) {
  const nodes = new Map(state.leafRecords.map(record => [record.node.id, record.node]));
  const inputs = Object.fromEntries(state.flowTextTargets.map(field => {
    const props = nodes.get(field.id)?.props;
    let value = props;
    // Native chart/table labels have a DOM index instead of an author path.
    // Their source is the native props; hashing undefined hid table edits and
    // kept stale compression after rows were shortened or removed.
    if (field.path[0] !== '$label') for (const part of field.path) value = value?.[part];
    return [field.key, stamp([value, nodes.get(field.id)?.textOverrides])];
  }));
  inputs.$context = stamp([IMAGE_SURFACE_VERSION, imageSurfaceBackground(state.slide), fontMetrics(state), state.slideElement?.getBoundingClientRect().width, state.flowSafeArea.content, state.slide.typography, state.theme,
    state.flowTextTargets.map(field => [field.key, field.basePt, field.ladder?.at(-1), Boolean(field.typographyLocked), Boolean(field.constraintOnly)]),
    state.groupRecords.map(record=>[record.node.id,record.node.layout]),
    state.leafRecords.map(record=>[record.node.id,record.node.type,record.node.props,record.node.layout, imageSurfacePolicy(record.node.type, record.node.props),
      ...(record.flowContract?.orientationFallback ? ['process-orientation-v2-horizontal-first'] : []),
      ...(/^(timeline-numbered|timeline-dots|timeline-dot-cards|alternating)$/.test(record.node.props?.presentation || '') ? ['timeline-compact-v1-per-node'] : []),
      ...(record.flowContract?.layoutRevision ? [record.flowContract.layoutRevision] : [])]),
    ...(state.slide.background ? [state.slide.background.contentAlign, state.slide.background.contentVerticalAlign] : []),
    ...(state.slide.background?.contentWidth !== undefined ? [state.slide.background.contentWidth] : []),
    ...(state.slide.background?.textSurface !== undefined ? [state.slide.background.textSurface] : [])]);
  return inputs;
}

export function inputChanges(previous, current) {
  return Object.entries(current).filter(([key,value]) => key !== '$context' && previous[key] !== value)
    .map(([key]) => {const [id,path]=JSON.parse(key);return {id,paths:[path]};});
}

/** Include render context that need not change the authored text fields. */
export function compressionCacheKey(state, inputs) {
  const { compression, ...layout } = state.slide.layout;
  // Browser zoom quantization differs between editor, thumbnail and export surfaces.
  return stamp([inputs, layout, state.pageNumber, state.logo, state.slide.background, state.flowLayout,
    state.slideElement.getBoundingClientRect().width]);
}
