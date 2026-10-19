// Origin: public/yrkie-doe/components/item-cards/item-cards.js:7
import { scope as __doeScope } from "../runtime/context/index.js";

export function text(element, tag, className, value, style, mode) {
    const node = element(tag, className, value);
    __doeScope.engine.applyTypographyStyle(node, style);
    const options = { mode, render: "plaintext", maxLines: mode === "title" ? 4 : 24, minFontPt: __doeScope.engine.TYPOGRAPHY.styles[style].sizes.compact };
    if (__doeScope.global.SemanticTextLayout) __doeScope.global.SemanticTextLayout.prepareElement(node, options);
    else { node.dataset.semanticWrap = mode; node.dataset.semanticMaxLines = String(options.maxLines); }
    return node;
  }
