// Origin: public/yrkie-doe/layout-engine/layout-engine.js:294
import { scope as __doeScope } from "../../runtime/context/index.js";

export function applyTypographySizeMode(element, sizeMode = "default") {
    if (!element?.style) {
      throw new TypeError("SlideEngine.applyTypographySizeMode: 需要有效的 DOM 元素。");
    }
    if (!__doeScope.TYPOGRAPHY_SIZE_MODE_SET.has(sizeMode)) {
      throw new TypeError(`未知字体字号模式: '${sizeMode}'。`);
    }
    element.dataset.typographySizeMode = sizeMode;
    Object.entries(__doeScope.TYPOGRAPHY_STYLES).forEach(([styleId, token]) => {
      element.style.setProperty(
        `--typography-${styleId}-size`,
        `${token.sizes[sizeMode]}pt`,
      );
      element.style.setProperty(
        `--typography-${styleId}-weight`,
        String(__doeScope.TYPOGRAPHY_WEIGHTS[token.defaultWeight]),
      );
    });
    return element;
  }
