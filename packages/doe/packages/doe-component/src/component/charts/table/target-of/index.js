// Origin: public/yrkie-doe/components/data-table/data-table.js:10


export function targetOf(target) {
    const host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error("DataTable: target element was not found.");
    return host;
  }
