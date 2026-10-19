// Origin: public/yrkie-doe/work-editor/work-editor.js:1488
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.elements.settingsPanel.addEventListener("click", (event) => event.stopPropagation());
  __doeScope.elements.settingsPanel.addEventListener('keydown', event => {
    if (__doeScope.runtimeSurface !== 'work' || !__doeScope.state.settingsOpen || event.key !== 'Tab') return;
    if (__doeScope.elements.settings.ownerDocument !== document) return;
    const controls = [...__doeScope.elements.settingsPanel.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex="0"]')]
      .filter(control => !control.closest('[hidden]') && control.getClientRects().length > 0);
    const first = controls[0]; const last = controls[controls.length - 1];
    if ((event.shiftKey && event.target === first) || (!event.shiftKey && event.target === last)) {
      event.preventDefault(); (event.shiftKey ? last : first)?.focus();
    }
  });
}
