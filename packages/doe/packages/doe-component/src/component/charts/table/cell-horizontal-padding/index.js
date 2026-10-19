// Origin: public/yrkie-doe/components/data-table/data-table.js:342


export function cellHorizontalPadding(cell) {
    const style = getComputedStyle(cell);
    return (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
  }
