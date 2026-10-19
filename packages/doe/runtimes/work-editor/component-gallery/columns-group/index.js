// Origin: public/yrkie-doe/work-editor/component-gallery.js:53


export function columnsGroup(id, columns, contents) {
    return {
      id, type: "layout-group", kind: "container",
      layout: { variant: "columns", columns, maxColumns: columns, gap: "18pt", align: "center", keepGroup: true },
      children: contents.map((children, index) => ({
        id: `${id}-column-${index + 1}`, type: "layout-group", kind: "container",
        layout: { variant: "stack", direction: "stack", gap: "12pt", align: "start", keepGroup: true },
        children,
      })),
    };
  }
