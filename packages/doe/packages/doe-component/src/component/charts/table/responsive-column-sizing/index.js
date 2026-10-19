import { resolveColumnWidths as __doeFn_resolveColumnWidths } from '../resolve-column-widths/index.js';
import { applyColumnWidths as __doeFn_applyColumnWidths } from '../apply-column-widths/index.js';
// Origin: public/yrkie-doe/components/data-table/data-table.js:560


export function responsiveColumnSizing(host, table, colgroup, columns, requestedMode, locale, options = {}) {
    const retainAdaptive = requestedMode === "auto" && (
      options.retainAdaptive === true || host.dataset.columnSizingResolved === "adaptive"
    );
    const effectiveMode = retainAdaptive ? "adaptive" : requestedMode;
    const result = (0, __doeFn_resolveColumnWidths)(
      table,
      columns,
      Math.max(1, host.clientWidth),
      effectiveMode,
      locale,
    );
    if (retainAdaptive) result.reason = "responsive-adaptive-retained";
    (0, __doeFn_applyColumnWidths)(host, colgroup, result);
    return result;
  }
