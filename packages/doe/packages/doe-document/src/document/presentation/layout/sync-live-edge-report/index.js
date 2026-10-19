// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2531


export function syncLiveEdgeReport(state, report) {
    report.autoRepairs = [];
    report.fallback = report.fits
      ? null
      : {
          status: "unsafe",
          reason: "edge-media-resize-exceeds-safe-content-area",
          destructive: false,
        };
    state.report = report;
    if (state.result) {
      state.result.element = state.slideElement;
      state.result.layoutElement = state.layoutElement;
      state.result.report = report;
      state.result.slide = state.slide;
    }
    return report;
  }
