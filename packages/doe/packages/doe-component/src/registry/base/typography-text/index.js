import { semanticText as __doeFn_semanticText } from '../semantic-text/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:29
import { scope as __doeScope } from "../../runtime/base/context/index.js";

export function typographyText(node, styleId, options = {}) {
    const typographyStyle = __doeScope.engine.TYPOGRAPHY.styles[styleId];
    const { weight, ...semanticOptions } = options;
    __doeScope.engine.applyTypographyStyle(node, styleId, weight);
    return (0, __doeFn_semanticText)(node, {
      render: "plaintext",
      ...semanticOptions,
      minFontPt: typographyStyle.sizes.compact,
    });
  }
