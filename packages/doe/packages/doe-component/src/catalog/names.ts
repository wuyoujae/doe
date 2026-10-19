import entries from './names.json';

export const COMPONENT_NAMES = entries;
export type ComponentName = typeof entries[number];
const legacyPresentations: Readonly<Record<string, string>> = {
  list: 'list:unordered', 'ordered-list': 'list:ordered', stat: 'metrics',
  'image-text': 'image-text', 'icon-text': 'icon-text', quote: 'quotation',
  'question-card': 'question', 'capability-cards': 'capability',
  'numbered-icon-cards': 'numbered', 'item-cards': 'cards:filled', 'shape-contents': 'shape:semicircle',
};

export function presentationName(presentation: string | undefined): ComponentName | undefined {
  return presentation ? entries.find(entry => entry.presentation === presentation) : undefined;
}

export function componentName(type: string): ComponentName | undefined {
  if (type.startsWith('contents-')) return presentationName(type.slice(9));
  if (type.startsWith('item-cards-')) return presentationName(`cards:${type.slice(11)}`);
  if (type.startsWith('shape-contents-')) return presentationName(`shape:${type.slice(15)}`);
  return entries.find(entry => entry.type === type && !entry.presentation)
    ?? presentationName(legacyPresentations[type]);
}

export function componentLabel(entry: ComponentName, locale: string): string {
  return locale.toLowerCase().startsWith('zh') ? entry.zh : entry.en;
}

export function catalogLabel(type: string, locale: string, fallback: string): string {
  const entry = componentName(type);
  if (entry) return componentLabel(entry, locale);
  const zh = locale.toLowerCase().startsWith('zh');
  if (type === 'contents') return zh ? '内容集合' : 'Contents collection';
  if (type === 'layout-group') return zh ? '自动布局组' : 'Auto layout group';
  if (/^columns-[234]$/.test(type)) {
    const count = Number(type.slice(-1));
    return zh ? `${['', '', '两', '三', '四'][count]}栏布局` : `${count}-column layout`;
  }
  return fallback;
}
