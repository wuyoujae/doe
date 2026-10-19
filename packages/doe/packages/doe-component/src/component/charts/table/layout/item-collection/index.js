// Origin: layout-engine/library-components.js; table.itemCollection


export function createItemCollection() {
  return {
      path: "content.rows",
      key: "table-row",
      reorderable: true,
      fixedLayout: true,
      showLayoutControls: false,
      maxColumns: 1,
    };
}
