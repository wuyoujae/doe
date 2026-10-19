// Origin: layout-engine/components.js; list.itemCollection


export function createItemCollection() {
  return {
      path: "items",
      key: "unordered-list-item",
      reorderable: true,
      layouts: ["stack", "grid", "auto-grid"],
      maxColumns: 2,
      autoColumnOrder: [1, 2],
    };
}
