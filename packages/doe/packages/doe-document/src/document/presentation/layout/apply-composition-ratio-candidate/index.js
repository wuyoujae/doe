// Origin: public/yrkie-doe/layout-engine/layout-engine.js:4939


export function applyCompositionRatioCandidate(state, candidate) {
    const layouts = candidate?.layouts || new Map();
    state.groupRecords.forEach((record) => {
      if (!layouts.has(record.node.id)) return;
      const layout = layouts.get(record.node.id);
      record.node.layout.direction = layout.direction;
      record.node.layout.ratio = layout.ratio;
    });
  }
