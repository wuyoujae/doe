// Origin: public/yrkie-doe/layout-engine/components.js:185
import { scope as __doeScope } from "../../runtime/base/context/index.js";

export function mediaCompositionStackHeightBudget(root, flowHeightBudget) {
    if (
      !flowHeightBudget ||
      typeof root.closest !== "function" ||
      typeof __doeScope.global.getComputedStyle !== "function"
    ) {
      return 0;
    }
    let item = root.closest(".group-item");
    const content = root.closest(".block-content");
    const contentStyle = content ? __doeScope.global.getComputedStyle(content) : null;
    let remaining = flowHeightBudget -
      (Number.parseFloat(contentStyle?.paddingTop) || 0) -
      (Number.parseFloat(contentStyle?.paddingBottom) || 0);
    while (item) {
      const surface = item.parentElement;
      if (!surface?.classList?.contains("layout-group__content")) break;
      const vertical = surface.dataset.compositionDirection === "stack" ||
        surface.dataset.layoutVariant === "stack";
      if (vertical) {
        const siblings = [...surface.children].filter((child) => child !== item);
        const style = __doeScope.global.getComputedStyle(surface);
        const gap = Number.parseFloat(style.rowGap || style.gap) || 0;
        remaining -= siblings.reduce(
          (total, sibling) => total + (Number(sibling.offsetHeight) || 0), 0,
        ) + gap * siblings.length;
      }
      item = surface.parentElement?.closest(".group-item");
    }
    // Keep the existing standalone image floor: a nearly invisible image
    // must not make an otherwise overflowing stack appear to fit.
    return Math.max(168, remaining);
  }
