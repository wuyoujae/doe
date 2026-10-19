// Origin: public/yrkie-doe/layout-engine/components.js:272
import { scope as __doeScope } from "../../runtime/base/context/index.js";

export function normalizeCodeLanguage(value) {
    const language = String(value || "text").toLowerCase();
    return __doeScope.CODE_LANGUAGES.has(language) ? language : "text";
  }
