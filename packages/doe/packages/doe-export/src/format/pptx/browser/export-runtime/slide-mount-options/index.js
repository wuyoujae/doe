// Origin: public/yrkie-doe/export-runtime/export-runtime.js:75


export function slideMountOptions(index, total) {
    return {
      editor: false,
      pageNumber: { enabled: false, format: "number" },
      slideIndex: index,
      slideCount: total,
      waitForFonts: true,
    };
  }
