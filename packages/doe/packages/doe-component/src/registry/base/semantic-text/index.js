// Origin: public/yrkie-doe/layout-engine/components.js:20
import { scope as __doeScope } from "../../runtime/base/context/index.js";

export function semanticText(node, options = {}) {
    const service = __doeScope.global.SemanticTextLayout;
    if (service?.prepareElement) return service.prepareElement(node, options);
    node.dataset.semanticWrap = options.mode || "auto";
    if (options.maxLines) node.dataset.semanticMaxLines = String(options.maxLines);
    if (options.minFontPt) node.dataset.semanticMinPt = String(options.minFontPt);
    return node;
  }
