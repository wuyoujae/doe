import { isHomogeneousCollectionGrid as __doeFn_isHomogeneousCollectionGrid } from '../is-homogeneous-collection-grid/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7266


export function resolvedChildSpan(groupNode, leafNode, definition, columns) {
    const maximum = Math.max(1, Number(columns) || 1);
    if (definition?.fullRow) return maximum;
    const requested = leafNode?.layout?.span ?? "auto";
    if (requested === "full") return maximum;
    if (requested === "half") return Math.max(1, Math.ceil(maximum / 2));
    if (requested !== "auto") {
      return Math.max(1, Math.min(maximum, Number(requested) || 1));
    }

    // An explicit row describes sibling tracks, so every child owns exactly
    // one track unless the schema explicitly overrides layout.span. A
    // standalone component's defaultSpan (for example a full-width table)
    // must not silently turn `table + chart` into a two-row stack.
    if (groupNode?.layout?.variant === "row") return 1;

    // A grid of semantically identical items is a collection even when the
    // AI omitted kind/collectionKey. Every item therefore owns one cell.
    // This prevents media (whose standalone default is full-width) from
    // silently becoming a tall one-column stack.
    if ((0, __doeFn_isHomogeneousCollectionGrid)(groupNode)) return 1;

    const fallback = definition?.defaultSpan;
    if (fallback === "full") return maximum;
    if (fallback === "half") return Math.max(1, Math.ceil(maximum / 2));
    return Math.max(1, Math.min(maximum, Number(fallback) || 1));
  }
