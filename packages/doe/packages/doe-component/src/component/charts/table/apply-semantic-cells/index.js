// Origin: public/yrkie-doe/components/data-table/data-table.js:98
import { scope as __doeScope } from "../runtime/context/index.js";

export function applySemanticCells(table) {
    const service = __doeScope.global.SemanticTextLayout;
    if (!service?.applyElement) return { applied: 0, blocked: 0 };
    let applied = 0;
    let blocked = 0;
    table.querySelectorAll('[data-semantic-owner="data-table"]').forEach((cell) => {
      const result = service.applyElement(cell);
      if (!result) return;
      applied += 1;
      if (result.status === "blocked") blocked += 1;
    });
    return { applied, blocked };
  }
