// Origin: public/yrkie-doe/work-editor/component-gallery.js:81


export function localCluster(id, direction, collectionKey, children) {
    return {
      id,
      type: "layout-group",
      kind: "cluster",
      layout: {
        variant: "composition",
        direction,
        columns: direction === "row" ? children.length : 1,
        maxColumns: 4,
        ratio: "auto",
        gap: "12pt",
        align: "stretch",
        origin: "explicit",
        intent: "local-cluster",
        collectionKey,
        cluster: true,
        keepGroup: true,
        textFit: { mode: "readable", minBodyPt: 11 },
      },
      children,
    };
  }
