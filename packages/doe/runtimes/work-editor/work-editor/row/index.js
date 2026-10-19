// Origin: public/yrkie-doe/work-editor/work-editor.js:83


export function row(id, children, ratio = "balanced") {
    return {
      id,
      type: "layout-group",
      kind: "container",
      layout: {
        variant: "composition",
        direction: "row",
        columns: children.length,
        maxColumns: 4,
        ratio,
        gap: "18pt",
        align: "stretch",
        origin: "explicit",
        textFit: { mode: "readable", minBodyPt: 11 },
      },
      children,
    };
  }
