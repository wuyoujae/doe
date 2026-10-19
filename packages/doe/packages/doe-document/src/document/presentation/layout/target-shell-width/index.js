// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2050


export function targetShellWidth(state, targetId) {
    const record = [
      ...(state.leafRecords || []),
      ...(state.groupRecords || []),
    ].find((item) => item.node.id === targetId);
    return record?.shell.clientWidth || state.layoutElement?.clientWidth || 0;
  }
