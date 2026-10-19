// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1240


export function roleRank(role) {
    return { flow: 0, compact: 1, collection: 2, wide: 3, media: 4 }[role] ?? 2;
  }
