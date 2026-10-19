import { closeCustomSelects as __doeFn_closeCustomSelects } from '../close-custom-selects/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:967
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function setSettingsSection(sectionName) {
    __doeScope.state.settingsSection = sectionName || null;
    (0, __doeFn_closeCustomSelects)();
    __doeScope.elements.settings?.querySelectorAll("[data-settings-section]").forEach((item) => {
      const work = __doeScope.runtimeSurface === 'work';
      const expanded = item.dataset.settingsSection === __doeScope.state.settingsSection
        || (work && sectionName === 'theme' && item.dataset.settingsSection === 'background');
      if (work) item.hidden = !expanded;
      if (work) {
        const trigger = item.querySelector('.work-editor__accordion-trigger');
        if (trigger) trigger.disabled = true;
      }
      item.querySelector(".work-editor__accordion-trigger")?.setAttribute(
        "aria-expanded",
        String(expanded),
      );
      item.querySelector(".work-editor__accordion-panel")?.setAttribute(
        "aria-hidden",
        String(!expanded),
      );
    });
  }
