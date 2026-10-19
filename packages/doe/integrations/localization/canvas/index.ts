import { appI18n } from '@yrkie/application/i18n/i18n.ts';
import { translateToolbarLabel } from '../toolbar/index.ts';
import { interactionT } from '../interaction/index.ts';

const attributes = ['aria-label', 'title', 'data-drop-label', 'data-drop-reason', 'data-item-drop-label', 'data-limit-label', 'data-overflow-label'];
const controls = '.block-handle, .doe-item-handle, .doe-item-add, [data-item-editor-attached], .edge-media-divider, [contenteditable="true"], [contenteditable="plaintext-only"], [data-grouping-preview], [data-item-drop-label], [data-overflow-label], .doe-text-selection-toolbar, .doe-text-selection-toolbar [aria-label], .doe-text-selection-toolbar [title], .work-editor, .work-editor__nav, .work-editor__add, .work-editor__filmstrip, .work-editor__thumb-preview, .work-editor__thumb-delete, .work-editor__continuous-page, #slide-settings-trigger, #slide-settings-panel, #slide-settings-close, #slide-settings-backdrop';
const messages = '.doe-text-edit-hint, .doe-item-add-hint, .edge-media-divider__status, .edge-media-divider__readout, .doe-text-selection-toolbar option, .doe-text-selection-toolbar button, .doe-text-color__label, .work-editor__loading, .work-editor__add small, #slide-settings-trigger > span';

/** Only renderer-owned controls participate. Authored text, tables and tooltips stay untouched. */
export function installWorkCanvasLocale(frame: HTMLIFrameElement): () => void {
  const runtime = frame.contentWindow as (Window & { DOEWorkLocale?: { t: typeof interactionT } }) | null;
  if (!runtime || runtime.location.origin !== location.origin) return () => {};
  const doc = runtime.document;
  const originals = new WeakMap<Node, Map<string, { source: string; translated: string }>>();
  const bridge = { t: interactionT };
  runtime.DOEWorkLocale = bridge;
  function translate(node: Node, name: string, current: string, write: (value: string) => void) {
    let record = originals.get(node);
    if (!record) { record = new Map(); originals.set(node, record); }
    const previous = record.get(name);
    const source = previous?.translated === current ? previous.source : current;
    const size = node.parentElement?.matches('.doe-text-selection-toolbar option') ? node.parentElement.getAttribute('value') : null;
    const label = size && ['small', 'normal', 'large'].includes(size) ? interactionT(`format.${size}`) : translateToolbarLabel(source.trim());
    const translated = source.replace(source.trim(), label);
    record.set(name, { source, translated });
    if (translated !== current) write(translated);
  }
  function update(element: Element) {
    if (element.matches(controls)) {
      for (const name of attributes) {
        const current = element.getAttribute(name);
        if (current !== null) translate(element, name, current, value => element.setAttribute(name, value));
        else originals.get(element)?.delete(name);
      }
    }
    if (element.matches(messages)) for (const child of element.childNodes) {
      if (child.nodeType === 3) translate(child, 'text', child.textContent || '', value => { child.textContent = value; });
    }
  }
  function scan(root: Element) {
    update(root);
    root.querySelectorAll(`${controls}, ${messages}`).forEach(update);
  }
  const refresh = () => {
    doc.documentElement.lang = appI18n.resolvedLanguage || appI18n.language;
    doc.title = interactionT('editorAria');
    scan(doc.documentElement);
  };
  const observer = new MutationObserver(records => {
    for (const record of records) {
      const target = record.target.nodeType === 1 ? record.target as Element : record.target.parentElement;
      if (target) update(target);
      for (const node of record.addedNodes) if (node.nodeType === 1) scan(node as Element);
    }
  });
  observer.observe(doc.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });
  appI18n.on('languageChanged', refresh);
  refresh();
  return () => {
    observer.disconnect(); appI18n.off('languageChanged', refresh);
    if (runtime.DOEWorkLocale === bridge) delete runtime.DOEWorkLocale;
  };
}
