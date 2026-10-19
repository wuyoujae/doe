import { syncSlideSettings as __doeFn_syncSlideSettings } from '../../sync-slide-settings/index.js';
import { setSettingsOpen as __doeFn_setSettingsOpen } from '../../set-settings-open/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1482
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.elements.settingsTrigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    (0, __doeFn_syncSlideSettings)();
    (0, __doeFn_setSettingsOpen)(!__doeScope.state.settingsOpen);
  });
  __doeScope.elements.settingsClose?.addEventListener("click", () => (0, __doeFn_setSettingsOpen)(false, { focusTrigger: true }));
  __doeScope.elements.settingsBackdrop?.addEventListener("click", () => (0, __doeFn_setSettingsOpen)(false, { focusTrigger: true }));
  if (__doeScope.runtimeSurface === 'work') {
    __doeScope.elements.settingsTrigger?.remove();
    __doeScope.elements.settingsTrigger = null;
    __doeScope.elements.settingsPanel.setAttribute('role', 'dialog');
    __doeScope.elements.settingsPanel.setAttribute('aria-labelledby', 'slide-settings-title');
    __doeScope.elements.settingsPanel.inert = true;
  }
}
