// Origin: public/yrkie-doe/layout-engine/layout-engine.js:87
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.STATIC_EDITOR_REMOVE_SELECTOR = Object.freeze([
    "script",
    '[data-slide-export-ignore="true"]',
    "[data-editor-overlay]",
    "[data-editor-handle]",
    ".slide-editor__selection",
    ".slide-editor__toolbar",
    ".slide-editor__resize-handle",
    ".block-toolbar",
    ".block-handle",
    ".text-edit-toolbar",
    ".slide-background-controls",
    ".edge-media-divider",
    ".root-drop-shelf",
    ".composition-drop-preview",
    ".local-cluster-badge",
  ].join(","));
}
