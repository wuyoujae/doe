// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1668


export function isCompositionGroup(node) {
    const layout = node?.layout;
    return (
      node?.type === "layout-group" &&
      (["composition", "compressed"].includes(layout?.variant) ||
        // Compatibility for the compact AI schema used by existing decks:
        // an explicit row ratio describes a heterogeneous composition, not an
        // ordinary collection grid. Keeping the ratio check prevents plain
        // `variant: row` collections from being reclassified.
        (layout?.variant === "row" &&
          layout?.direction === "row" &&
          layout?.ratio != null))
    );
  }
