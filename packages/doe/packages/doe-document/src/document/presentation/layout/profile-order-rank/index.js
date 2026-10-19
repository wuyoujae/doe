// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2086


export function profileOrderRank(profile) {
    return { flow: 0, compact: 1, collection: 2, wide: 3, media: 4 }[
      profile?.role
    ] ?? 2;
  }
