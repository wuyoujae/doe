// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7203


export function previousCollectionColumnCount(currentColumns) {
    return Math.max(1, Math.round(Number(currentColumns) || 1) - 1);
  }
