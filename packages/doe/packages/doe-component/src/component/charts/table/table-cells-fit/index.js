// Origin: public/yrkie-doe/components/data-table/data-table.js:173


export function tableCellsFit(table) {
    return Array.from(table.querySelectorAll("th, td")).every(
      (cell) => cell.scrollWidth <= cell.clientWidth + 1,
    );
  }
