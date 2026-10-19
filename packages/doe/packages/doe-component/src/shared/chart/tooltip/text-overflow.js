import { chartTooltip } from './popup/index.js';
import { editingText } from '../../../../../doe-core/src/text/editing-text/index.js';

/** Read-only item preview sharing the charts' top-layer popup and positioning. */
export function installOverflowTooltip(host) {
  const events = new AbortController(), options = {signal:events.signal};
  const popup = chartTooltip(host.ownerDocument);
  let active = null;
  const clear = () => { if (active) popup.clear(); active = null; };
  const truncated = target => [target, ...target.querySelectorAll('[data-flow-truncated]')]
    .some(field => field.__doeTextOverflow);
  const editing = target => target.matches('[contenteditable="plaintext-only"], [contenteditable="true"], [data-semantic-editing="true"]')
    || target.querySelector('[contenteditable="plaintext-only"], [contenteditable="true"], [data-semantic-editing="true"]');
  const resolve = element => {
    const target = element.closest('[data-collection-item-index]') || element.closest('[data-flow-truncated]');
    return target && host.contains(target) && truncated(target) && !editing(target) ? target : null;
  };
  const show = (target, x, y) => {
    if (!target) { clear(); return; }
    if (active !== target) {
      const content = host.ownerDocument.createElement('div');
      content.className = 'doe-chart-tooltip__full-text';
      const selector = '.doe-text-content, [data-flow-truncated]';
      const fields = target.matches(selector) ? [target] : [...target.querySelectorAll(selector)];
      content.textContent = fields.filter(field => !fields.some(parent => parent !== field && parent.contains(field)))
        .map(field => {
          const saved = field.__doeTextOverflow;
          return editingText(saved ? { textContent: saved.fullText, __semanticProjection: saved.projection } : field).source();
        }).filter(Boolean).join('\n\n');
      popup.show(target, content, () => { active?.removeAttribute('aria-describedby'); active = null; });
      active = target; target.setAttribute('aria-describedby','doe-chart-tooltip');
    }
    popup.move(x,y);
  };
  host.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch' && !event.buttons) show(resolve(event.target),event.clientX,event.clientY);
  }, options);
  host.addEventListener('pointerleave', clear, options);
  host.addEventListener('focusin', event => {
    const target = resolve(event.target);
    if (target) { const rect = target.getBoundingClientRect(); show(target,rect.right,rect.top+rect.height/2); }
  }, options);
  host.addEventListener('focusout', clear, options);
  host.addEventListener('wheel', event => {
    if (!active) return;
    const panel = host.ownerDocument.getElementById('doe-chart-tooltip');
    if (panel && panel.scrollHeight > panel.clientHeight) { event.preventDefault(); panel.scrollTop += event.deltaY; }
  }, {...options,passive:false});
  host.addEventListener('doe:interaction-reset', clear, options);
  const observer = new MutationObserver(records => {
    if (active && (!host.contains(active) || !truncated(active) || editing(active)
      || records.some(record => record.type === 'childList' && active.contains(record.target)))) clear();
  });
  observer.observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['data-flow-truncated','data-semantic-editing','contenteditable']});
  return () => { clear(); events.abort(); observer.disconnect(); };
}
