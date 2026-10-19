// Origin: public/yrkie-doe/layout-engine/layout-engine.js:258


export function typographyStyleToken(sizes, defaultWeight, allowedWeights) {
    return Object.freeze({
      sizes: Object.freeze(sizes),
      defaultWeight,
      allowedWeights: Object.freeze([...allowedWeights]),
    });
  }
