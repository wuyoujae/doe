// Origin: public/yrkie-doe/work-editor/work-editor.js:1117
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function slideIndexById(slideId) {
    return __doeScope.state.slides.findIndex((slideValue) => slideValue.id === slideId);
  }
