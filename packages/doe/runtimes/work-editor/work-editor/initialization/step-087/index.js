import { setSettingsSection as __doeFn_setSettingsSection } from '../../set-settings-section/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1490
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.elements.settings.querySelectorAll("[data-settings-section]").forEach((item) => {
    const trigger = item.querySelector(".work-editor__accordion-trigger");
    trigger?.addEventListener("click", () => {
      const sectionName = item.dataset.settingsSection;
      (0, __doeFn_setSettingsSection)(__doeScope.state.settingsSection === sectionName ? null : sectionName);
    });
  });
}
