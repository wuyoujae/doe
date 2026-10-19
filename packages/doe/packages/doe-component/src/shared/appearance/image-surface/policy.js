/** Surface ownership is independent of wrapper transparency and author aliases. */
const roots = new Set(['hero', 'heading', 'text', 'todo-list', 'math-formula', 'list', 'ordered-list', 'stat',
  'image-text', 'icon-text', 'shape-contents', '3d-funnel', 'layered-funnel', 'concentric-circles',
  'folded-arrow', 'wave-arrow', 'layered-cube', 'double-ring', 'droplet-process', 'serpentine-process',
  'recycling-arrows', 'vertical-progress', 'icon-columns', 'table', 'grouped-bar-chart', 'line-chart',
  'stacked-bar-chart', 'radar-chart', 'risk-matrix', 'waterfall-chart', 'donut-chart', 'mind-map']);
const native = new Set(['text-panel', 'notice', 'code-block', 'numbered-icon-cards', 'question-card', 'quote', 'badge-cards']);
const cardItems = new Set(['outline', 'side-rule', 'top-rule', 'top-icon', 'quote']);
const cardNative = new Set(['filled', 'filled-icon', 'connected', 'connected-icon', 'leaf', 'bubble']);
const contentsNative = new Set(['dot-card', 'timeline-dot-cards', 'alternating', 'numbered', 'question', 'quotation']);
const contentsRoot = new Set(['dot-list', 'numbered-parallelogram', 'numbered-pill', 'numbered-chevron', 'ascending-bar',
  'ascending-arrow', 'ascending-numbered', 'numbered-top-rule', 'numbered-inline', 'timeline-numbered', 'timeline-dots',
  'icon-horizontal', 'image-text', 'icon-text', 'list:unordered', 'list:ordered', 'bullets', 'columns', 'metrics',
  'shape:semicircle', 'shape:petals', 'shape:cycle-arrows', 'shape:full-circle', 'shape:ring', 'shape:stairs',
  'shape:pyramid', 'shape:inverted-pyramid']);

export const IMAGE_SURFACE_VERSION = 'image-surface-v1';
export const imageSurfaceBackground = slide => typeof slide?.background?.src === 'string' && Boolean(slide.background.src.trim());

export function imageSurfacePolicy(type, props = {}) {
  if (type === 'media') return 'media';
  if (type === 'capability-cards') return 'items';
  if (roots.has(type)) return 'root';
  if (native.has(type)) return 'native';
  if (type === 'item-cards') return cardItems.has(props.variant) ? 'items' : cardNative.has(props.variant || 'filled') ? 'native' : null;
  if (type === 'contents') {
    const value = props.presentation || 'cards:filled';
    if (value.startsWith('cards:')) return imageSurfacePolicy('item-cards', { variant: value.slice(6) });
    if (value === 'capability') return 'items';
    if (contentsNative.has(value)) return 'native';
    if (contentsRoot.has(value)) return 'root';
  }
  return null;
}
