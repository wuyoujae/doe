// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5073


export function compareStructureFirstAttempts(a, b) {
    const hardA =
      a.minWidthViolations +
      a.compressionFitViolations +
      a.minFontViolations +
      a.overlaps;
    const hardB =
      b.minWidthViolations +
      b.compressionFitViolations +
      b.minFontViolations +
      b.overlaps;
    return (
      Number(!a.fits) - Number(!b.fits) ||
      hardA - hardB ||
      a.overflowY - b.overflowY ||
      a.overflowX - b.overflowX ||
      (a.localTypographyCost || 0) - (b.localTypographyCost || 0) ||
      (a.localTypographyWorstStep || 0) -
        (b.localTypographyWorstStep || 0) ||
      (a.localTypographySteps || 0) - (b.localTypographySteps || 0) ||
      (a.spacingCompression || 0) - (b.spacingCompression || 0) ||
      (a.structuralFallbackSteps || 0) -
        (b.structuralFallbackSteps || 0) ||
      (a.layoutFallbackSteps || 0) - (b.layoutFallbackSteps || 0) ||
      a.unusedHeight - b.unusedHeight ||
      a.score - b.score
    );
  }
