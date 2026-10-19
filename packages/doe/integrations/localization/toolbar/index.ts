import { appI18n } from "@yrkie/application/i18n/i18n.ts";
import { supportedLocales } from "@yrkie/application/i18n/locales.ts";
import { toolbarLabelKeys } from "../../../packages/doe-canvas/src/host/toolbar-labels/index.ts";
import type { ToolbarLocale } from '../../../packages/doe-canvas/src/toolbar/locale/index.ts';
import { translateInteractionLabel } from '../interaction/index.ts';

export const toolbarLocale: ToolbarLocale = {
  on: (event, listener) => appI18n.on(event, listener),
  off: (event, listener) => appI18n.off(event, listener),
  localizeToolbar,
};

// The content-editor bridge already emits localized labels; retain their identity on language changes.
const contentLabelKeys = new Map<string, string>(supportedLocales.flatMap(locale => [
  [appI18n.getResource(locale, 'doeEditor', 'sheet.title'), 'editContent'],
  [appI18n.getResource(locale, 'doeEditor', 'source.replace'), 'replace'],
]));
const replacementNames = new Map(Object.entries(appI18n.getResource('zh-CN', 'doeEditor', 'replacement.names') as Record<string, string>).map(([key, value]) => [value, key]));

export function translateToolbarLabel(source: string): string {
  const interaction = translateInteractionLabel(source, translateToolbarLabel);
  if (interaction !== undefined) return interaction;
  if (source === '更换样式') return appI18n.t('replacement.title', { ns: 'doeEditor' });
  const key = toolbarLabelKeys[source] ?? contentLabelKeys.get(source);
  const t = (key: string, values?: Record<string, unknown>) => appI18n.t(key, { ns: 'doeToolbar', ...values });
  if (key) return t(key);
  const replacementName = replacementNames.get(source);
  if (replacementName) return appI18n.t(`replacement.names.${replacementName}`, { ns: 'doeEditor' });
  const columns = /^(\d+)列$/.exec(source);
  if (columns) return t('columns', { count: Number(columns[1]) });
  const pending = /^(.*)（即将接入）$/.exec(source);
  if (pending) return t('comingSoon', { action: translateToolbarLabel(pending[1]) });
  const selected = /^(.+?)：(.+)$/.exec(source);
  if (selected) return t('selectedValue', { label: translateToolbarLabel(selected[1]), value: translateToolbarLabel(selected[2]) });
  const edit = /^编辑(.+)$/.exec(source);
  if (edit) return t('edit', { name: translateToolbarLabel(edit[1]) });
  const imageRatio = /^图片 (\d+%)$/.exec(source);
  if (imageRatio) return `${t('image')} ${imageRatio[1]}`;
  return source;
}

/** Translate only toolbar-owned text/attributes while retaining the original nodes and handlers. */
export function localizeToolbar(roots: HTMLElement[]) {
  const textNodes: Array<{ node: Text; original: string }> = [];
  const attributes: Array<{ node: Element; name: string; original: string }> = [];
  const languages = roots.map(node => ({ node, original: node.getAttribute('lang') }));
  for (const root of roots) {
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.parentElement?.closest('svg') || !node.data.trim()) continue;
      textNodes.push({ node, original: node.data });
    }
    for (const node of [root, ...root.querySelectorAll('[aria-label], [title]')]) {
      for (const name of ['aria-label', 'title']) {
        const original = node.getAttribute(name);
        if (original) attributes.push({ node, name, original });
      }
    }
  }
  const refresh = () => {
    languages.forEach(({ node }) => { node.lang = appI18n.resolvedLanguage || appI18n.language; });
    textNodes.forEach(({ node, original }) => {
      const translated = original.replace(original.trim(), translateToolbarLabel(original.trim()));
      if (node.data !== translated) node.data = translated;
    });
    attributes.forEach(({ node, name, original }) => {
      const translated = translateToolbarLabel(original);
      if (node.getAttribute(name) !== translated) node.setAttribute(name, translated);
    });
  };
  refresh();
  return {
    refresh,
    dispose() {
      textNodes.forEach(({ node, original }) => { node.data = original; });
      attributes.forEach(({ node, name, original }) => node.setAttribute(name, original));
      languages.forEach(({ node, original }) => { if (original === null) node.removeAttribute('lang'); else node.setAttribute('lang', original); });
    },
  };
}
