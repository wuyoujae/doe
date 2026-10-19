// Origin: public/yrkie-doe/work-editor/work-editor.js:1121
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function thumbnailItemById(slideId) {
    return [...__doeScope.elements.filmstrip.querySelectorAll(".work-editor__thumb")]
      .find((item) => item.dataset.slideId === slideId) || null;
  }
