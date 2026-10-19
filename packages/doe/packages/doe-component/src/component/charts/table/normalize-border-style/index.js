// Origin: public/yrkie-doe/components/data-table/data-table.js:148
import { scope as __doeScope } from "../runtime/context/index.js";

export function normalizeBorderStyle(config) {
    const requested = String(config.borderStyle || "").trim().toLowerCase();
    if (__doeScope.BORDER_STYLES.has(requested)) return requested;
    // Backward compatibility: `showLines` only controls whether ordinary
    // table rules are visible. Three-line tables must be requested explicitly
    // through borderStyle="three-line".
    return config.showLines === false ? "none" : "grid";
  }
