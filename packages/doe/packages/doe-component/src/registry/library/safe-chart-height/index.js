import { verticalReserveAfter as __doeFn_verticalReserveAfter } from '../vertical-reserve-after/index.js';
import { rootFlowCapacityFor as __doeFn_rootFlowCapacityFor } from '../root-flow-capacity-for/index.js';
// Origin: public/yrkie-doe/layout-engine/library-components.js:476
import { scope as __doeScope } from "../../runtime/library/context/index.js";

export function safeChartHeight(root, shell, { settledReserve } = {}) {
    if (!root || !shell) return 0;
    const layoutElement = root.closest(".schema-layout");
    const slide = root.closest(".schema-slide");
    if (!layoutElement || !slide) return 0;
    const slideRect = slide.getBoundingClientRect();
    const layoutRect = layoutElement.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    if (!slideRect.height || !layoutRect.height || !shellRect.height) return 0;

    // Studio scales the 1280×720 renderer with a CSS transform. Convert
    // visual rectangles back to layout pixels before comparing them with the
    // native component's requested size.
    const scaleY = slide.clientHeight / slideRect.height;
    const layoutStyle = __doeScope.global.getComputedStyle?.(layoutElement);
    // The layout box spans the whole slide. Its bottom padding is the slide's
    // safe-area inset, not usable chart space. Subtract it in layout pixels;
    // otherwise a stretched row chart grows into the safety gutter and then
    // makes the solver report overflow even though the row itself was valid.
    const safeBottomInset =
      Number.parseFloat(layoutStyle?.paddingBottom || "0") || 0;
    const availableToSafeBottom = Math.max(
      0,
      (layoutRect.bottom - shellRect.top) * scaleY - safeBottomInset,
    );
    const reservedFollowingContent = (0, __doeFn_verticalReserveAfter)(
      shell,
      layoutElement,
      scaleY,
    );
    const rootFlowCapacity = (0, __doeFn_rootFlowCapacityFor)(
      shell,
      layoutElement,
      scaleY,
    );
    const rowSurface = root.closest(__doeScope.ROW_SURFACE_SELECTOR);
    const nestedStackInsideRow =
      rowSurface && shell.parentElement !== rowSurface;
    // Text below a chart can gain a line after the chart's first mount (font
    // refinement and semantic wrapping settle one frame later). Keep a small
    // local reserve only for this nested chart+copy branch. Direct row charts
    // still use the full assigned slot, while the nested chart remains the
    // largest size that cannot push its branch beyond the slide safe bottom.
    const settledTextReserve = settledReserve ?? (nestedStackInsideRow ? 24 : 2);
    return Math.max(
      0,
      Math.floor(
        Math.max(
          availableToSafeBottom - reservedFollowingContent,
          rootFlowCapacity,
        ) - settledTextReserve,
      ),
    );
  }
