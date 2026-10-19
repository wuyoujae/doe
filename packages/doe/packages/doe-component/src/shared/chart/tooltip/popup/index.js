import { visibleViewport } from './viewport/index.js';
const instances = new WeakMap();

// One top-layer tooltip per document also works inside the presentation iframe.
export function chartTooltip(doc) {
  if (instances.has(doc)) return instances.get(doc);
  let active = null, panel = null;
  const clear = () => { active?.(); active = null; panel?.remove(); panel = null; };
  const api = {
    clear,
    show(owner, content, cleanup) {
      clear(); active = cleanup;
      panel = doc.createElement('div'); panel.className = 'doe-chart-tooltip'; panel.id = 'doe-chart-tooltip';
      panel.setAttribute('role','tooltip'); panel.setAttribute('popover','manual'); panel.dataset.slideExportIgnore = 'true';
      const style = getComputedStyle(owner);
      for (const name of ['--yrkie-color-title','--yrkie-color-light','--yrkie-line-strong-solid','--font-sans-cn','--yrkie-radius-component']) panel.style.setProperty(name, style.getPropertyValue(name));
      panel.append(content); doc.body.append(panel); panel.showPopover?.();
      return panel;
    },
    move(x, y) {
      if (!panel) return;
      const bounds = visibleViewport(doc.defaultView), width = bounds.right - bounds.left, height = bounds.bottom - bounds.top;
      const originX = bounds.left, originY = bounds.top, pad = 8, gap = 16;
      panel.style.minWidth = `min(12rem, ${Math.max(1,width-pad*2)}px)`;
      panel.style.maxWidth = `min(20rem, ${Math.max(1,width-pad*2)}px)`; panel.style.maxHeight = `${Math.max(1,height-pad*2)}px`;
      const rect = panel.getBoundingClientRect();
      let left = x - gap - rect.width, top = y - rect.height / 2;
      panel.dataset.placement = 'left';
      if (left < originX + pad) {
        left = x + gap; panel.dataset.placement = 'right';
        if (left + rect.width > originX + width - pad) {
          left = x - rect.width / 2; top = y - gap - rect.height; panel.dataset.placement = 'top';
          if (top < originY + pad) { top = y + gap; panel.dataset.placement = 'bottom'; }
        }
      }
      left = Math.max(originX+pad,Math.min(left,originX+width-rect.width-pad));
      top = Math.max(originY+pad,Math.min(top,originY+height-rect.height-pad));
      Object.assign(panel.style,{left:`${left}px`,top:`${top}px`});
    },
  };
  doc.addEventListener('keydown', e => { if (e.key === 'Escape') clear(); }, true);
  doc.addEventListener('scroll', event => { if (!panel?.contains(event.target)) clear(); }, true);
  doc.addEventListener('pointerdown', clear, true);
  doc.defaultView.addEventListener('blur', clear);
  doc.defaultView.addEventListener('resize', clear);
  doc.addEventListener('visibilitychange', clear);
  doc.addEventListener('fullscreenchange', clear);
  instances.set(doc,api); return api;
}
