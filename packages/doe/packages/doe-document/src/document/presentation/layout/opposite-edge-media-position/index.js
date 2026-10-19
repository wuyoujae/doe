// Origin: public/yrkie-doe/layout-engine/layout-engine.js:763


export function oppositeEdgeMediaPosition(position) {
    return { left: "right", right: "left", top: "bottom", bottom: "top" }[
      position
    ] || "left";
  }
