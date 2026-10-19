import { customSelectEntry as __doeFn_customSelectEntry } from '../custom-select-entry/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:884


export function restoreCustomSelectMenu(select) {
    const entry = (0, __doeFn_customSelectEntry)(select);
    if (!entry || entry.menu.parentNode === entry.home) return;
    entry.menu.classList.remove("is-floating");
    entry.menu.removeAttribute("data-placement");
    entry.menu.style.removeProperty("--select-menu-top");
    entry.menu.style.removeProperty("--select-menu-bottom");
    entry.menu.style.removeProperty("--select-menu-left");
    entry.menu.style.removeProperty("--select-menu-width");
    entry.menu.style.removeProperty("--select-menu-max-height");
    if (entry.next?.parentNode === entry.home) entry.home.insertBefore(entry.menu, entry.next);
    else entry.home.append(entry.menu);
  }
