import { applySemanticCells as __doeFn_applySemanticCells } from '../apply-semantic-cells/index.js';
import { tableBorderBoxHeight as __doeFn_tableBorderBoxHeight } from '../table-border-box-height/index.js';
// Origin: public/yrkie-doe/components/data-table/data-table.js:122
import { scope as __doeScope } from "../runtime/context/index.js";

export function fitCellSpacing(host, table) {
    let selected = __doeScope.SPACE_DENSITIES[__doeScope.SPACE_DENSITIES.length - 1];
    let fits = false;
    let semantic = { applied: 0, blocked: 0 };
    for (const density of __doeScope.SPACE_DENSITIES) {
      host.dataset.spaceDensity = density;
      // Force the table to resolve wrapping with the current cell padding.
      // Typography is deliberately untouched: the outer layout solver may
      // reduce semantic font tokens only after every spacing tier fails.
      void table.offsetHeight;
      semantic = (0, __doeFn_applySemanticCells)(table);
      void table.offsetHeight;
      const widthFits = table.scrollWidth <= host.clientWidth + 1;
      const heightFits = (0, __doeFn_tableBorderBoxHeight)(table) <= host.clientHeight + 1;
      if (widthFits && heightFits && semantic.blocked === 0) {
        selected = density;
        fits = true;
        break;
      }
    }
    host.dataset.spaceDensity = selected;
    host.dataset.spaceFits = String(fits);
    host.dataset.semanticBlocked = String(semantic.blocked);
    return { density: selected, fits, semantic };
  }
