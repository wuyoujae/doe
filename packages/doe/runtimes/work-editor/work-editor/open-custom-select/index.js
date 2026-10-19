import { customSelectEntry as __doeFn_customSelectEntry } from '../custom-select-entry/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:906

export function openCustomSelect(select) {
    const entry = (0, __doeFn_customSelectEntry)(select);
    const trigger = select?.querySelector(".work-editor__custom-select-trigger");
    if (!entry || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const view = select.ownerDocument.defaultView;
    const viewportGap = 8;
    const menuGap = 5;
    const desiredHeight = Math.min(220, Math.max(80, entry.menu.scrollHeight || 0));
    const availableBelow = Math.max(0, view.innerHeight - rect.bottom - viewportGap - menuGap);
    const availableAbove = Math.max(0, rect.top - viewportGap - menuGap);
    const placement = availableBelow >= Math.min(desiredHeight, 150) || availableBelow >= availableAbove
      ? "bottom"
      : "top";
    const availableHeight = placement === "bottom" ? availableBelow : availableAbove;
    const width = Math.min(rect.width, view.innerWidth - viewportGap * 2);
    const left = Math.max(viewportGap, Math.min(rect.left, view.innerWidth - width - viewportGap));

    select.ownerDocument.body.append(entry.menu);
    entry.menu.classList.add("is-floating");
    entry.menu.dataset.placement = placement;
    entry.menu.style.setProperty("--select-menu-left", `${left}px`);
    entry.menu.style.setProperty("--select-menu-width", `${width}px`);
    entry.menu.style.setProperty("--select-menu-max-height", `${Math.max(72, Math.min(220, availableHeight))}px`);
    if (placement === "bottom") {
      entry.menu.style.setProperty("--select-menu-top", `${rect.bottom + menuGap}px`);
      entry.menu.style.removeProperty("--select-menu-bottom");
    } else {
      entry.menu.style.setProperty("--select-menu-bottom", `${view.innerHeight - rect.top + menuGap}px`);
      entry.menu.style.removeProperty("--select-menu-top");
    }
    trigger.setAttribute("aria-expanded", "true");
    entry.menu.setAttribute("aria-hidden", "false");
  }
