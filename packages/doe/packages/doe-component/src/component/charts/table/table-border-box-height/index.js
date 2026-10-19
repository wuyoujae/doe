// Origin: public/yrkie-doe/components/data-table/data-table.js:112


export function tableBorderBoxHeight(table) {
    const style = getComputedStyle(table);
    const borderHeight =
      (parseFloat(style.borderTopWidth) || 0) +
      (parseFloat(style.borderBottomWidth) || 0);
    return Math.ceil(
      Math.max(table.offsetHeight, table.scrollHeight + borderHeight),
    );
  }
