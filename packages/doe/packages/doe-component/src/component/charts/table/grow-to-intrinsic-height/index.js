import { tableBorderBoxHeight as __doeFn_tableBorderBoxHeight } from '../table-border-box-height/index.js';
// Origin: public/yrkie-doe/components/data-table/data-table.js:157


export function growToIntrinsicHeight(host, table, authoredHeight) {
    const borderBoxExtra = Math.max(0, host.offsetHeight - host.clientHeight);
    const needed = (0, __doeFn_tableBorderBoxHeight)(table) + borderBoxExtra;
    const current = Math.ceil(host.offsetHeight);
    if (needed <= current) {
      host.dataset.intrinsicHeight = String(current);
      host.dataset.intrinsicHeightGrown = "false";
      return current;
    }
    const resolved = Math.max(Math.ceil(authoredHeight), needed);
    host.style.height = `${resolved}px`;
    host.dataset.intrinsicHeight = String(resolved);
    host.dataset.intrinsicHeightGrown = "true";
    return resolved;
  }
