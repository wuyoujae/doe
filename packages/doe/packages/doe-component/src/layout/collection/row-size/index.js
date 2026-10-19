// Origin: public/yrkie-doe/core/contents-layout.js:17


export function rowSize(count, columns, index) {
    return Math.min(columns, count - Math.floor(index / columns) * columns);
  }
