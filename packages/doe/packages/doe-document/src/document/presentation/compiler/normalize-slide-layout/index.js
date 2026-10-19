import { stripUnknownKeys as __doeFn_stripUnknownKeys } from '../strip-unknown-keys/index.js';
import { integerOrDefault as __doeFn_integerOrDefault } from '../integer-or-default/index.js';
import { normalizeCompression } from '../../layout/flow/compression/policy.js';
import { normalizeContentsReplacement } from '../../edit/contents-replacement/width-memory.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:391
import { scope as __doeScope } from "../runtime/context/index.js";

export function normalizeSlideLayout(source, diagnostics, slide) {
    // Runtime metadata survives canonicalization without joining AI author props.
    const { compression, contentsReplacement, ...authorLayout } = source && typeof source === 'object' ? source : {};
    const layout = (0, __doeFn_stripUnknownKeys)(
      authorLayout,
      __doeScope.PUBLIC_SLIDE_LAYOUT_PROPS,
      diagnostics,
      null,
      "slide.layout",
    );
    if (compression) layout.compression = normalizeCompression(compression);
    const replacement = slide && normalizeContentsReplacement(contentsReplacement, slide);
    if (replacement) layout.contentsReplacement = replacement;
    layout.preset = __doeScope.engine.layouts.has(layout.preset) ? layout.preset : "flow";
    layout.overflowPolicy = "reject-edit";
    layout.autoRepair = typeof layout.autoRepair === "boolean" ? layout.autoRepair : true;
    layout.maxRepairPasses = (0, __doeFn_integerOrDefault)(layout.maxRepairPasses, 1, 6, 4);
    layout.fallback = "needs-continuation";
    layout.allowEmergency8Pt = layout.allowEmergency8Pt === true;
    const presetSpacing = __doeScope.engine.layouts.get(layout.preset)?.spacing || {
      pagePadding: "36pt",
      sectionGap: "18pt",
      groupGap: "18pt",
      internalGap: "12pt",
    };
    const requestedSpacing = layout.spacing && typeof layout.spacing === "object"
      ? layout.spacing
      : {};
    layout.spacing = Object.fromEntries(
      ["pagePadding", "sectionGap", "groupGap", "internalGap"].map((key) => [
        key,
        __doeScope.SPACE_VALUES.has(requestedSpacing[key])
          ? requestedSpacing[key]
          : presetSpacing[key],
      ]),
    );
    return layout;
  }
