// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2757


export function reportWorsened(next, previous) {
    if (!previous) return !next.fits;
    return (
      next.overflowX > previous.overflowX + 1 ||
      next.overflowY > previous.overflowY + 1 ||
      next.overlaps > previous.overlaps ||
      next.minWidthViolations > previous.minWidthViolations ||
      next.compressionFitViolations > previous.compressionFitViolations ||
      next.minFontViolations > previous.minFontViolations
    );
  }
