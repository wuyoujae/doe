import { customSelectEntry as __doeFn_customSelectEntry } from '../custom-select-entry/index.js';
import { selectLabel as __doeFn_selectLabel } from '../select-label/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:948
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function setCustomSelectValue(name, value) {
    const select = __doeScope.elements.settings?.querySelector(`[data-slide-select="${name}"]`);
    if (!select) return;
    const trigger = select.querySelector(".work-editor__custom-select-trigger");
    const label = select.querySelector("[data-select-label]");
    (0, __doeFn_customSelectEntry)(select)?.menu.querySelectorAll("[data-value]").forEach((option) => {
      option.setAttribute("aria-selected", String(option.dataset.value === value));
    });
    if (label) label.textContent = (0, __doeFn_selectLabel)(select, value);
    if (trigger) trigger.dataset.value = value;
  }
