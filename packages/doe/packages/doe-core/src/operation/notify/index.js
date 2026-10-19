// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2745


export function notify(state, extra = {}) {
    const detail = {
      result: state.result,
      report: state.report,
      slide: state.slide,
      ...extra,
    };
    state.host.dispatchEvent(
      new CustomEvent("slideengine:change", { detail }),
    );
  }
