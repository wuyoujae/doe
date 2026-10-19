// Origin: public/yrkie-doe/layout-engine/layout-engine.js:3006


export function orderedPair(sourceNode, targetNode, placement, sourceBeforeTarget) {
    const sourceFirst =
      placement === "left" ||
      placement === "top" ||
      (placement === "auto" && sourceBeforeTarget);
    return sourceFirst
      ? [sourceNode, targetNode]
      : [targetNode, sourceNode];
  }
