// Origin: public/yrkie-doe/layout-engine/components.js:153
import { scope as __doeScope } from "../../runtime/base/context/index.js";

export function mediaFlowHeightBudget(root) {
    if (
      typeof root.closest !== "function" ||
      typeof __doeScope.global.getComputedStyle !== "function"
    ) {
      return 0;
    }
    const flowBlock = root.closest(".flow-block");
    const layout = flowBlock?.parentElement;
    if (!flowBlock || !layout?.classList?.contains("schema-layout")) return 0;
    const siblings = [...layout.children].filter((child) =>
      child.classList?.contains("flow-block"),
    );
    const style = __doeScope.global.getComputedStyle(layout);
    const padding =
      (Number.parseFloat(style.paddingTop) || 0) +
      (Number.parseFloat(style.paddingBottom) || 0);
    const gap = Number.parseFloat(style.rowGap || style.gap) || 0;
    const occupied = siblings.reduce(
      (total, sibling) =>
        sibling === flowBlock ? total : total + (Number(sibling.offsetHeight) || 0),
      0,
    );
    return Math.max(
      1,
      (Number(layout.clientHeight) || 0) -
        padding -
        occupied -
        gap * Math.max(0, siblings.length - 1),
    );
  }
