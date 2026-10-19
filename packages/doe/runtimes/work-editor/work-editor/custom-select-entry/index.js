// Origin: public/yrkie-doe/work-editor/work-editor.js:873
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function customSelectEntry(select) {
    if (!select) return null;
    const existing = __doeScope.customSelectMenus.get(select);
    if (existing) return existing;
    const menu = select.querySelector(".work-editor__custom-select-menu");
    if (!menu) return null;
    const entry = { menu, home: menu.parentNode, next: menu.nextSibling };
    __doeScope.customSelectMenus.set(select, entry);
    return entry;
  }
