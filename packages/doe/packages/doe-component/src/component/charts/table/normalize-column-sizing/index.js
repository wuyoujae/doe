// Origin: public/yrkie-doe/components/data-table/data-table.js:283
import { scope as __doeScope } from "../runtime/context/index.js";

export function normalizeColumnSizing(config, content) {
    const requested = String(config.columnSizing || content.columnSizing || "auto")
      .trim()
      .toLowerCase();
    return __doeScope.COLUMN_SIZING_MODES.has(requested) ? requested : "auto";
  }
