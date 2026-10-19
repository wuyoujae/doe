import { scope } from '../runtime/context/index.js';
import { currentChoice } from '../current-choice/index.js';

// Only declared Contents collections participate. Chart/table arrays are data.
export function groupingCollection(node) {
  const path = ['capability-cards', 'numbered-icon-cards'].includes(node?.type) ? ['content', 'items'] : ['items'];
  if (!['contents', 'item-cards', 'shape-contents', 'capability-cards', 'numbered-icon-cards', 'list', 'ordered-list'].includes(node?.type)) return null;
  const items = path.reduce((value, key) => value?.[key], node.props);
  // The editor and component model are separate runtime bundles.
  const model = globalThis.DOEContentsModel;
  const choice = (model?.CHOICES || scope.CHOICES)?.find(value => value.id === (model?.currentChoice || currentChoice)(node));
  return Array.isArray(items) && choice ? { items, path, choice } : null;
}

/** Explicit drag conversion differs from the lossless style picker. */
export function adaptGroupingItem(value, choice) {
  const source = typeof value === 'string' ? { text: value } : value;
  const item = {}, fields = {}, offsets = {};
  const supported = new Set(choice.fields);
  if (choice.id.startsWith('list:')) supported.delete('title');
  if (!choice.icons) supported.delete('icon');
  for (const [key, value] of Object.entries(source)) {
    if (key === 'id' || supported.has(key)) { item[key] = value; fields[key] = key; }
  }
  // Retain textual information that the target has no separate slot for.
  const extra = ['title', 'label', 'bullets', 'source'].filter(key => !supported.has(key) && source[key]);
  if (extra.length) {
    const parts = [];
    for (const key of [...extra, 'text']) {
      if (!source[key]) continue;
      const value = Array.isArray(source[key]) ? source[key].join('\n') : String(source[key]);
      offsets[key] = parts.join('\n').length + (parts.length ? 1 : 0);
      if (Array.isArray(source[key])) {
        let offset = offsets[key];
        source[key].forEach((line, index) => { offsets[`${key}.${index}`] = offset; offset += line.length + 1; });
      }
      fields[key] = 'text'; parts.push(value);
    }
    item.text = parts.join('\n');
  }
  if (choice.icons && !item.icon) item.icon = '';
  if (choice.id === 'image-text' && !item.src) item.src = '';
  for (const key of choice.required) if (item[key] === undefined && key !== 'bullets') item[key] = '';
  return { item, fields, offsets };
}

export function canonicalizeGroupingCollection(node) {
  const contract = groupingCollection(node);
  if (!contract) return null;
  if (node.type !== 'contents') {
    const props = node.props;
    node.props = { presentation: contract.choice.id, items: contract.items.map(value => typeof value === 'string' ? { text: value } : value) };
    for (const key of ['itemColumns', 'itemLayout', 'columnPreference', 'orientation', 'staggered', 'connectors']) {
      if (props[key] !== undefined) node.props[key] = props[key];
    }
    node.type = 'contents';
  }
  return groupingCollection(node);
}
