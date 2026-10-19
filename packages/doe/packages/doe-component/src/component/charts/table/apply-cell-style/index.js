// Origin: public/yrkie-doe/components/data-table/data-table.js:45


export function applyCellStyle(element, cell, align) {
    element.style.textAlign = ["left", "center", "right"].includes(align)
      ? align
      : "left";
    if (cell.bold) element.classList.add("ppt-data-table__cell--bold");
    if (cell.emphasis) {
      element.classList.add(`ppt-data-table__cell--${cell.emphasis}`);
    }
  }
