// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7154


export function balancedAutoGridColumns(itemCount, maximumColumns = 4) {
    const count = Math.max(1, Math.round(Number(itemCount) || 1));
    const maximum = Math.max(
      1,
      Math.min(count, Math.round(Number(maximumColumns) || 1)),
    );
    const minimumRows = Math.ceil(count / maximum);

    // Keep the smallest possible row count, then remove avoidable empty cells.
    // This makes four items resolve to a symmetric 2×2 grid instead of 3+1.
    return Math.max(1, Math.ceil(count / minimumRows));
  }
