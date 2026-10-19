import { preferredCompressionWidth as __doeFn_preferredCompressionWidth } from '../preferred-compression-width/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:589


export function compositionRequirements(
    profiles,
    gap,
    densityId = "comfortable",
  ) {
    const minimums = profiles.map((profile) =>
      Math.max(1, Number(profile.minWidth) || 1),
    );
    const preferred = profiles.map((profile, index) =>
      Math.max(minimums[index], (0, __doeFn_preferredCompressionWidth)(profile)),
    );
    const minimumScales = profiles.map((profile, index) =>
      Math.min(1, minimums[index] / preferred[index]),
    );
    return {
      minimums,
      preferred,
      minimumScales,
      requiredWidth:
        minimums.reduce((sum, width) => sum + width, 0) +
        gap * (profiles.length - 1),
      densityId,
    };
  }
