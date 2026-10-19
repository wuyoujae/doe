import { currentChoice } from '../../../../../../doe-component/src/component/contents/contents/model/current-choice/index.js';
import { findNode } from '../../../../../../doe-component/src/component/contents/contents/model/find-node/index.js';

const COLUMN_KEYS = ['itemColumns', 'itemLayout', 'columnPreference'];
const clone = value => JSON.parse(JSON.stringify(value));
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const width = value => typeof value === 'number' && Number.isFinite(value) && value >= .2 && value < 1;

export function replacementBackgroundContext(slide) {
  const bg = slide.background;
  if (!bg || bg.enabled === false || typeof bg.src !== 'string' || !bg.src.trim() || slide.layout?.allowsBleed
    || slide.blocks?.some(node => node.layout?.variant === 'edge-media')) return undefined;
  return { src: bg.src.trim(), fit: bg.fit === 'cover' ? 'cover' : 'contain', position: typeof bg.position === 'string' && bg.position.trim() || '50% 50%',
    contentAlign: ['left', 'center', 'right'].includes(bg.contentAlign) ? bg.contentAlign : 'center',
    contentVerticalAlign: ['top', 'center', 'bottom'].includes(bg.contentVerticalAlign) ? bg.contentVerticalAlign : 'center',
    textSurface: bg.textSurface === 'none' ? 'none' : 'auto' };
}

function columnSettings(node) {
  if (node.type === 'layout-group') return { itemColumns: node.layout?.columns || 'auto', columnPreference: node.layout?.columns || 'auto' };
  return Object.fromEntries(COLUMN_KEYS.filter(key => Object.hasOwn(node.props || {}, key)).map(key => [key, node.props[key]]));
}

function validColumns(columns) {
  return object(columns) && Object.entries(columns).every(([key, value]) => COLUMN_KEYS.includes(key) && (key === 'itemLayout'
    ? ['grid', 'stack', 'auto'].includes(value)
    : value === 'auto' || Number.isInteger(value) && value >= 1 && value <= 12));
}

/** Optional editor state: never apply stale memory to a manually changed page. */
export function normalizeContentsReplacement(input, slide) {
  const context = replacementBackgroundContext(slide);
  if (!context || slide.background.contentWidth !== 1 || !object(input) || input.version !== 1 || !width(input.width)
    || !object(input.context) || Object.keys(context).some(key => context[key] !== input.context[key])
    || !Array.isArray(input.entries) || input.entries.length > 256) return undefined;
  const seen = new Set(), entries = [];
  for (const entry of input.entries) {
    if (!object(entry) || typeof entry.id !== 'string' || seen.has(entry.id) || typeof entry.presentation !== 'string'
      || !/^[a-z][a-z0-9:-]{0,63}$/.test(entry.presentation) || !validColumns(entry.columns)) return undefined;
    seen.add(entry.id);
    const node = findNode(slide.blocks || [], entry.id), choice = node && currentChoice(node);
    if (choice && choice !== entry.presentation) entries.push({ id: entry.id, presentation: entry.presentation, columns: clone(entry.columns) });
  }
  return entries.length ? { version: 1, width: input.width, context, entries } : undefined;
}

/** The menu preview and committed transaction must use this exact candidate. */
export function planContentsReplacement(slide, nodeId, next) {
  const draft = clone(slide), source = findNode(draft.blocks, nodeId);
  if (!source) throw new Error('组件已变化，请重新打开菜单。');
  const choice = currentChoice(source), target = currentChoice(next);
  let memory = normalizeContentsReplacement(draft.layout?.contentsReplacement, draft);
  draft.layout ||= {};
  delete draft.layout.contentsReplacement;
  const context = replacementBackgroundContext(draft);
  const replacement = clone(next);
  if (context && choice && target && choice !== target) {
    if (!memory && width(draft.background.contentWidth)) memory = {
      version: 1, width: draft.background.contentWidth, context, entries: [],
    };
    if (memory) {
      const entry = memory.entries.find(value => value.id === nodeId);
      if (entry?.presentation === target) {
        for (const key of COLUMN_KEYS) delete replacement.props[key];
        Object.assign(replacement.props, entry.columns);
        memory.entries = memory.entries.filter(value => value.id !== nodeId);
      } else if (!entry) {
        memory.entries.push({ id: nodeId, presentation: choice, columns: columnSettings(source) });
      }
      draft.background.contentWidth = memory.entries.length ? 1 : memory.width;
    }
  }
  if (memory?.entries.length) draft.layout.contentsReplacement = memory;
  Object.keys(source).forEach(key => delete source[key]);
  Object.assign(source, replacement);
  return draft;
}

/** Settings changes take precedence over earlier automatic expansion. */
export function clearChangedReplacementMemory(before, after) {
  if ((before.background?.contentWidth ?? 1) !== (after.background?.contentWidth ?? 1)
    || JSON.stringify(replacementBackgroundContext(before)) !== JSON.stringify(replacementBackgroundContext(after))) {
    if (after.layout) delete after.layout.contentsReplacement;
  }
}
