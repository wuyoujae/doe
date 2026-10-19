// Origin: public/yrkie-doe/work-editor/work-editor.js:252
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.elements = {
    frame: document.getElementById("active-frame"),
    scale: document.getElementById("active-scale"),
    canvas: document.getElementById("active-canvas"),
    loading: document.getElementById("active-loading"),
    filmstrip: document.getElementById("filmstrip"),
    previous: document.getElementById("previous-slide"),
    next: document.getElementById("next-slide"),
    add: document.getElementById("add-slide"),
    settings: document.getElementById("slide-settings"),
    settingsTrigger: document.getElementById("slide-settings-trigger"),
    settingsPanel: document.getElementById("slide-settings-panel"),
    settingsClose: document.getElementById("slide-settings-close"),
    settingsTitle: document.getElementById("slide-settings-title"),
    settingsBackdrop: document.getElementById("slide-settings-backdrop"),
    pageNumberEnabled: document.getElementById("page-number-enabled"),
    pageNumberFormatField: document.getElementById("page-number-format-field"),
    backgroundReplace: document.getElementById("slide-background-replace"),
    backgroundRemove: document.getElementById("slide-background-remove"),
    backgroundOptions: document.getElementById("slide-background-options"),
    backgroundContentWidthField: document.getElementById("background-content-width-field"),
    backgroundContentWidth: document.getElementById("slide-background-content-width"),
    backgroundContentWidthOutput: document.getElementById("slide-background-content-width-output"),
    backgroundContentAlignField: document.getElementById("background-content-align-field"),
    backgroundTextSurfaceField: document.getElementById("background-text-surface-field"),
    backgroundOpacityField: document.getElementById("background-opacity-field"),
    backgroundOpacity: document.getElementById("slide-background-opacity"),
    backgroundOpacityOutput: document.getElementById("slide-background-opacity-output"),
    backgroundDirectionField: document.getElementById("background-direction-field"),
    backgroundNote: document.getElementById("slide-background-note"),
  };
}
