import { setSettingsOpen as __doeFn_setSettingsOpen } from '../../set-settings-open/index.js';
import { closeCustomSelects } from '../../close-custom-selects/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1596
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
document.addEventListener("keydown", (event) => {
    __doeScope.state.thumbnailCoordinator?.interrupt();
    if (event.key !== "Escape" || !__doeScope.state.settingsOpen) return;
    event.preventDefault();
    const select = __doeScope.elements.settings?.querySelector('.work-editor__custom-select-trigger[aria-expanded="true"]')?.closest('.work-editor__custom-select');
    if (select) {
      closeCustomSelects();
      select.querySelector('.work-editor__custom-select-trigger')?.focus();
      return;
    }
    (0, __doeFn_setSettingsOpen)(false, { focusTrigger: true });
  });
}
