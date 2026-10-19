// Origin: public/yrkie-doe/work-editor/component-gallery.js:65


export function autoContainer(id, children, intent = "auto-compose") {
    return {
      id,
      type: "layout-group",
      kind: "container",
      layout: {
        variant: "auto",
        direction: "auto",
        intent,
        gap: "18pt",
        textFit: { mode: "readable", minBodyPt: 11, optionalMinBodyPt: 8 },
      },
      children,
    };
  }
