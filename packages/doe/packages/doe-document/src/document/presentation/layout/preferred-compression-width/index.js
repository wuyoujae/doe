// Origin: public/yrkie-doe/layout-engine/layout-engine.js:740


export function preferredCompressionWidth(profile) {
    const minimumWidth = Math.max(1, Number(profile?.minWidth) || 1);
    const preferredWidth =
      Number(profile?.preferredWidth) || minimumWidth * 1.35;
    const weight = Math.max(0.5, Number(profile?.weight) || 1);
    return Math.max(minimumWidth, preferredWidth * weight);
  }
