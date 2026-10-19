// Origin: public/yrkie-doe/layout-engine/library-components.js:364
import { scope as __doeScope } from "../../runtime/library/context/index.js";

export function verticalReserveAfter(shell, layoutElement, scaleY) {
    let reserve = 0;
    let current = shell;
    const visited = new Set();

    while (current && current !== layoutElement && !visited.has(current)) {
      visited.add(current);
      const parent = current.parentElement;
      if (!parent) break;
      const isLayoutFlow = parent === layoutElement;
      const isGroupFlow = parent.classList?.contains("layout-group__content");
      const direction =
        parent.dataset?.compositionDirection ||
        parent.dataset?.layoutVariant ||
        "stack";
      const stacksVertically = isLayoutFlow || (isGroupFlow && direction !== "row");

      if (stacksVertically) {
        const siblings = [];
        const rowHeights = new Map();
        const multicolumn = isGroupFlow && Number(parent.dataset.columns) > 1;
        const currentRect = current.getBoundingClientRect();
        let sibling = current.nextElementSibling;
        while (sibling) {
          const style = __doeScope.global.getComputedStyle?.(sibling);
          const rect = sibling.getBoundingClientRect?.();
          if (style?.display !== "none" && rect && rect.height > 0) {
            if (!multicolumn) siblings.push(rect.height * scaleY);
            else if (rect.top >= currentRect.bottom - 0.5) {
              const row = Math.round(rect.top * scaleY);
              rowHeights.set(row, Math.max(rowHeights.get(row) || 0, rect.height * scaleY));
            }
          }
          sibling = sibling.nextElementSibling;
        }
        siblings.push(...rowHeights.values());
        if (siblings.length) {
          const parentStyle = __doeScope.global.getComputedStyle?.(parent);
          const rowGap = Number.parseFloat(parentStyle?.rowGap || parentStyle?.gap) || 0;
          reserve += siblings.reduce((sum, value) => sum + value, 0);
          reserve += rowGap * siblings.length;
        }
      }

      if (parent === layoutElement) break;
      current = parent.closest?.(".flow-block, .group-item") || null;
    }
    return reserve;
  }
