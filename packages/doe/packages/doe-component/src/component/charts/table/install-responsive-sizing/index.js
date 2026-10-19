import { responsiveColumnSizing as __doeFn_responsiveColumnSizing } from '../responsive-column-sizing/index.js';
import { fitCellSpacing as __doeFn_fitCellSpacing } from '../fit-cell-spacing/index.js';
import { applySemanticCells } from '../apply-semantic-cells/index.js';
// Origin: public/yrkie-doe/components/data-table/data-table.js:577
import { scope as __doeScope } from "../runtime/context/index.js";

export function installResponsiveSizing(
    host,
    table,
    colgroup,
    columns,
    requestedMode,
    locale,
    layoutOptions = {},
  ) {
    host.__pptDataTableResizeObserver?.disconnect?.();
    if (typeof __doeScope.global.ResizeObserver !== "function") return;

    let frame = 0;
    let lastWidth = Math.round(host.clientWidth);
    const observer = new __doeScope.global.ResizeObserver(() => {
      if (!host.isConnected) {
        observer.disconnect();
        return;
      }
      const width = Math.round(host.clientWidth);
      if (Math.abs(width - lastWidth) < 1) return;
      lastWidth = width;
      if (frame) __doeScope.global.cancelAnimationFrame(frame);
      frame = __doeScope.global.requestAnimationFrame(() => {
        frame = 0;
        (0, __doeFn_responsiveColumnSizing)(host, table, colgroup, columns, requestedMode, locale);
        if (layoutOptions.naturalFlow) applySemanticCells(table);
        else (0, __doeFn_fitCellSpacing)(host, table);
        // Spacing compression changes the usable text width. Re-measure once
        // more with the settled padding instead of falling back to equal cols.
        (0, __doeFn_responsiveColumnSizing)(host, table, colgroup, columns, requestedMode, locale);
        host.dataset.columnSizingTrigger = "resize";
      });
    });
    observer.observe(host);
    host.__pptDataTableResizeObserver = observer;
  }
