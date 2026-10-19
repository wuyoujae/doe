import { isHomogeneousCollectionGrid as __doeFn_isHomogeneousCollectionGrid } from '../is-homogeneous-collection-grid/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7294


export function expandAutoGridSingletonSpans(groupNode, spans, columns) {
    const maximum = Math.max(1, Number(columns) || 1);
    const resolved = spans.map((span) =>
      Math.max(1, Math.min(maximum, Number(span) || 1)),
    );
    if (
      maximum <= 1 ||
      groupNode?.layout?.variant !== "auto-grid" ||
      (0, __doeFn_isHomogeneousCollectionGrid)(groupNode)
    ) {
      return resolved;
    }

    const rows = [];
    let current = { indexes: [], occupied: 0 };
    resolved.forEach((span, index) => {
      if (current.indexes.length && current.occupied + span > maximum) {
        rows.push(current);
        current = { indexes: [], occupied: 0 };
      }
      current.indexes.push(index);
      current.occupied += span;
      if (current.occupied >= maximum) {
        rows.push(current);
        current = { indexes: [], occupied: 0 };
      }
    });
    if (current.indexes.length) rows.push(current);

    rows.forEach((row) => {
      if (row.indexes.length !== 1) return;
      const index = row.indexes[0];
      const requested = groupNode.children?.[index]?.layout?.span ?? "auto";
      if (requested === "auto") resolved[index] = maximum;
    });
    return resolved;
  }
