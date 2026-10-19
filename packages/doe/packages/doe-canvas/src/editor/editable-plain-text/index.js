// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5379
import { scope as __doeScope } from "../../../../doe-core/src/runtime/browser-context/index.js";

export function editablePlainText(target) {
    if (target?.dataset.semanticRender === "plaintext") {
      return __doeScope.global.DOETextFields?.plainText(target) ?? target.textContent ?? "";
    }
    return String(target?.innerText ?? target?.textContent ?? "")
      .replace(/\r\n/g, "\n")
      .trim();
  }
