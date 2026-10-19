import { setSettingsOpen as __doeFn_setSettingsOpen } from '../set-settings-open/index.js';
import { clearGenerationDecoration as __doeFn_clearGenerationDecoration } from '../clear-generation-decoration/index.js';
import { reconcileContinuousView, pauseContinuousView } from '../continuous-view/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:696
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function setGenerationReadOnly(enabled) {
    document.documentElement.dataset.slideGeneration = enabled ? "true" : "false";
    __doeScope.elements.add.disabled = enabled || __doeScope.state.hostReadOnly;
    if (__doeScope.elements.settingsTrigger) __doeScope.elements.settingsTrigger.disabled = enabled || __doeScope.state.hostReadOnly;
    if (enabled) (0, __doeFn_setSettingsOpen)(false);
    else (0, __doeFn_clearGenerationDecoration)();
    if (enabled) pauseContinuousView();
    reconcileContinuousView();
  }
