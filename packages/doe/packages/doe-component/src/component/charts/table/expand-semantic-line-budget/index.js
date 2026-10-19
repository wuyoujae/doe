// Origin: public/yrkie-doe/components/data-table/data-table.js:179


export function expandSemanticLineBudget(table) {
    table.querySelectorAll('[data-semantic-owner="data-table"]').forEach((cell) => {
      // A row-height rebound explicitly trades vertical space for readable
      // typography. The ordinary three-line budget must therefore expand as
      // well; otherwise a valid four-line cell remains marked "blocked" even
      // though the row has ample height.
      cell.dataset.semanticMaxLines = cell.tagName === "TH" ? "6" : "8";
    });
  }
