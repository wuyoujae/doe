// Origin: public/yrkie-doe/layout-engine/layout-engine.js:315
import { scope as __doeScope } from "../../runtime/context/index.js";

export function applyTypographyStyle(element, styleId, weightId) {
    if (!element?.dataset) {
      throw new TypeError("SlideEngine.applyTypographyStyle: 需要有效的 DOM 元素。");
    }
    if (!Object.hasOwn(__doeScope.TYPOGRAPHY_STYLES, styleId)) {
      throw new TypeError(`未知字体样式: '${styleId}'。`);
    }
    const hasExplicitWeight = !(
      weightId === undefined || weightId === null || weightId === ""
    );
    if (
      hasExplicitWeight &&
      !__doeScope.TYPOGRAPHY_STYLES[styleId].allowedWeights.includes(weightId)
    ) {
      throw new TypeError(
        `字体样式 '${styleId}' 不允许字重 '${weightId}'。`,
      );
    }
    element.dataset.typographyStyle = styleId;
    if (!hasExplicitWeight) {
      delete element.dataset.typographyWeight;
      return element;
    }
    element.dataset.typographyWeight = weightId;
    return element;
  }
