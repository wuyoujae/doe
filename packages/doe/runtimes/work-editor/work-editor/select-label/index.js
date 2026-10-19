import { customSelectEntry as __doeFn_customSelectEntry } from '../custom-select-entry/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:940


export function selectLabel(select, value) {
    const menu = (0, __doeFn_customSelectEntry)(select)?.menu;
    const option = [...(menu?.querySelectorAll("[data-value]") || [])].find(
      (item) => item.dataset.value === value,
    );
    return option?.childNodes?.[0]?.textContent?.trim() || option?.textContent?.trim() || value;
  }
