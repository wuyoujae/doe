// Origin: public/yrkie-doe/work-editor/thumbnail-coordinator.js:8


export function defaultSourceSignature(slide, index, total, pageNumber, logo) {
    return JSON.stringify({
      slide,
      logo,
      pageNumber: {
        enabled: pageNumber?.enabled !== false,
        format: pageNumber?.format === "fraction" ? "fraction" : "number",
        current: index + 1,
        total,
      },
    });
  }
