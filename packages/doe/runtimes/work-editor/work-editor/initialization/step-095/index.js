import { clearCanvasSelection as __doeFn_clearCanvasSelection } from '../../clear-canvas-selection/index.js';
import { setSettingsOpen as __doeFn_setSettingsOpen } from '../../set-settings-open/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1588
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
document.addEventListener("click", (event) => {
    if (event.button === 0 && event.target instanceof Element && event.target.matches(
      ".work-editor, .work-editor__stage",
    )) (0, __doeFn_clearCanvasSelection)();
    if (__doeScope.state.settingsOpen && !__doeScope.elements.settings.contains(event.target)) (0, __doeFn_setSettingsOpen)(false);
  });
}
