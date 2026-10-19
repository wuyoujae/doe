// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7185


export function nextCollectionColumnCount(
    currentColumns,
    maximumColumns,
    itemCount = maximumColumns,
  ) {
    const maximum = Math.max(1, Math.round(Number(maximumColumns) || 1));
    const current = Math.max(
      1,
      Math.min(maximum, Math.round(Number(currentColumns) || 1)),
    );
    const count = Math.max(1, Math.round(Number(itemCount) || 1));
    const currentRows = Math.ceil(count / current);
    for (let columns = current + 1; columns <= maximum; columns += 1) {
      if (Math.ceil(count / columns) < currentRows) return columns;
    }
    return Math.min(maximum, current + 1);
  }
