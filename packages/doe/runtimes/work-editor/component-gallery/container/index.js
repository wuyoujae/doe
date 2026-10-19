// Origin: public/yrkie-doe/work-editor/component-gallery.js:32


export function container(id, direction, children, options = {}) {
    return {
      id,
      type: "layout-group",
      kind: "container",
      layout: {
        variant: "composition",
        direction,
        columns: direction === "row" ? children.length : 1,
        maxColumns: 4,
        ratio: options.ratio || "auto",
        gap: options.gap || "18pt",
        align: "stretch",
        origin: "explicit",
        keepGroup: options.keepGroup === true,
        textFit: options.textFit || { mode: "readable", minBodyPt: 11 },
      },
      children,
    };
  }
