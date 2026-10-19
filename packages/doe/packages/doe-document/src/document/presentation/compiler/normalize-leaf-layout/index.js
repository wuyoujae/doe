import { stripUnknownKeys as __doeFn_stripUnknownKeys } from '../strip-unknown-keys/index.js';
import { normalizeLayoutLock as __doeFn_normalizeLayoutLock } from '../normalize-layout-lock/index.js';
import { normalizeTextFit as __doeFn_normalizeTextFit } from '../normalize-text-fit/index.js';
import { normalizeSlotSpace as __doeFn_normalizeSlotSpace } from '../normalize-slot-space/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:274
import { scope as __doeScope } from "../runtime/context/index.js";

export function normalizeLeafLayout(source, diagnostics, nodeId) {
    const layout = (0, __doeFn_stripUnknownKeys)(
      source,
      __doeScope.PUBLIC_LEAF_LAYOUT_PROPS,
      diagnostics,
      nodeId,
      "layout",
    );
    const spanNumber = Number(layout.span);
    layout.span = ["auto", "full", "half"].includes(layout.span)
      ? layout.span
      : Number.isInteger(spanNumber) && spanNumber > 0
        ? spanNumber
        : "auto";
    layout.priority = Number.isFinite(Number(layout.priority))
      ? Number(layout.priority)
      : 50;
    layout.region = ["content", "media"].includes(layout.region)
      ? layout.region
      : null;
    layout.lock = (0, __doeFn_normalizeLayoutLock)(layout.lock);
    layout.textFit = (0, __doeFn_normalizeTextFit)(layout.textFit);
    const slotSpace = (0, __doeFn_normalizeSlotSpace)(layout.slotSpace);
    if (slotSpace) layout.slotSpace = slotSpace;
    else delete layout.slotSpace;
    return layout;
  }
