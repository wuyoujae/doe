import { customSelectEntry as __doeFn_customSelectEntry } from '../custom-select-entry/index.js';
import { restoreCustomSelectMenu as __doeFn_restoreCustomSelectMenu } from '../restore-custom-select-menu/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:898


export function closeCustomSelect(select) {
    const entry = (0, __doeFn_customSelectEntry)(select);
    if (!entry) return;
    select.querySelector(".work-editor__custom-select-trigger")?.setAttribute("aria-expanded", "false");
    entry.menu.setAttribute("aria-hidden", "true");
    (0, __doeFn_restoreCustomSelectMenu)(select);
  }
