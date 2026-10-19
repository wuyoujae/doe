// Origin: public/yrkie-doe/components/shape-contents/shape-contents.js:17
import { scope as __doeScope } from "../runtime/context/index.js";

export function copy(element, item, index) {
    const node = element("section", "shape-contents__copy"); node.dataset.collectionItemIndex = String(index);
    for (const [key, tag, style, mode] of [["title", "h4", "h4", "title"], ["text", "p", "large", "paragraph"]]) {
      const field = element(tag, `shape-contents__${key}`, item[key]); __doeScope.engine.applyTypographyStyle(field, style);
      __doeScope.global.SemanticTextLayout?.prepareElement(field, { mode, render: "plaintext", maxLines: mode === "title" ? 4 : 24, minFontPt: __doeScope.engine.TYPOGRAPHY.styles[style].sizes.compact });
      node.append(field);
    }
    return node;
  }
