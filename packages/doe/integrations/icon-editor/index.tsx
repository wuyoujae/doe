import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { LucideIconPicker } from "@yrkie/application/components/LucideIconPicker.tsx";
import { appI18n } from "@yrkie/application/i18n/i18n.ts";
import { loadLucideIconCatalog } from "@yrkie/application/lib/pptxPreview/lucideIcons.ts";
import type { ContentEditorDefinition } from "../../packages/doe-component/src/shared/editor/types/index.ts";
import "./index.css";

export const iconEditor: ContentEditorDefinition = {
  get label() { return appI18n.t('quick.picker.label', { ns: 'editor' }); },
  renderer: 'icon',
  placement: 'right',
  createForm(base, onChange) {
    let icon = base.icon;
    const available = new Set<string>(base.availableIcons);
    const element = document.createElement('form');
    element.className = 'doe-icon-form';
    const root = createRoot(element);
    let disposed = false;
    root.render(<I18nextProvider i18n={appI18n}><LucideIconPicker isAvailable={candidate => available.has(candidate.name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(''))} onSelect={selected => {
      if (disposed) return;
      icon = selected.name;
      onChange();
    }} /></I18nextProvider>);
    return { element, read: () => ({ props: { icon } }), dispose: () => {
      if (disposed) return;
      disposed = true;
      // A host React cleanup can run during commit; unmount this independent root afterwards.
      queueMicrotask(() => root.unmount());
    } };
  },
  createPreview(container, source) {
    let disposed = false;
    const initial = source.cloneNode(true) as unknown as SVGElement;
    initial.removeAttribute('tabindex'); initial.removeAttribute('role');
    initial.removeAttribute('aria-label'); initial.setAttribute('aria-hidden', 'true');
    initial.removeAttribute('class'); initial.removeAttribute('style');
    initial.removeAttribute('x'); initial.removeAttribute('y');
    container.classList.add('doe-icon-preview');
    const computed = source.ownerDocument.defaultView!.getComputedStyle(source);
    // The preview uses the authored foreground and the nearest painted badge.
    container.style.color = computed.color;
    let ancestor: Element | null = source.parentElement;
    while (ancestor) {
      const background = source.ownerDocument.defaultView!.getComputedStyle(ancestor).backgroundColor;
      if (background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent') {
        container.style.backgroundColor = background; break;
      }
      ancestor = ancestor.parentElement;
    }
    return {
      async render(props) {
        let glyph = initial.cloneNode(true) as SVGElement;
        if (props.icon) {
          const catalog = await loadLucideIconCatalog();
          if (disposed) return false;
          const definition = catalog.byName.get(props.icon);
          if (!definition) return false;
          glyph = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': initial.getAttribute('stroke-width') || '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) glyph.setAttribute(key, value);
          for (const [tag, attributes] of definition.nodes) {
            const node = document.createElementNS(glyph.namespaceURI, tag);
            for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
            glyph.append(node);
          }
        }
        if (disposed) return false;
        container.replaceChildren(glyph);
        return true;
      },
      dispose() { disposed = true; container.replaceChildren(); },
    };
  },
};
