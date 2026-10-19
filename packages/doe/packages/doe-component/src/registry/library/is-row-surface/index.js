// Origin: public/yrkie-doe/layout-engine/library-components.js:31


export function isRowSurface(element) {
    return Boolean(
      element &&
        (element.dataset?.compositionDirection === "row" ||
          element.dataset?.layoutVariant === "row"),
    );
  }
