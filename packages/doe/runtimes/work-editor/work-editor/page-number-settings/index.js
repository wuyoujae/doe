// Origin: public/yrkie-doe/work-editor/work-editor.js:848
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function pageNumberSettings() {
    const source = __doeScope.state.pageNumber && typeof __doeScope.state.pageNumber === "object"
      ? __doeScope.state.pageNumber
      : {};
    return {
      enabled: source.enabled !== false,
      format: source.format === "fraction" ? "fraction" : "number",
    };
  }
