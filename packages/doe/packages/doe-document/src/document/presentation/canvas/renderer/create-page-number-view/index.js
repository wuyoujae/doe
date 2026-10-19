import { element as __doeFn_element } from "../../../../../../../doe-core/src/runtime/element/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6971


export function createPageNumberView(state) {
    if (!state.pageNumber?.enabled) return null;
    const node = (0, __doeFn_element)("div", "schema-page-number");
    if (state.pageNumber.format === "fraction") {
      node.append(
        (0, __doeFn_element)(
          "span",
          "schema-page-number__current",
          String(state.pageNumber.current),
        ),
        (0, __doeFn_element)("span", "schema-page-number__separator", "/"),
        (0, __doeFn_element)(
          "span",
          "schema-page-number__total",
          String(state.pageNumber.total),
        ),
      );
    } else {
      node.textContent = String(state.pageNumber.current);
    }
    node.setAttribute("aria-label", `第 ${state.pageNumber.current} 页，共 ${state.pageNumber.total} 页`);
    node.dataset.pageNumberFormat = state.pageNumber.format;
    return node;
  }
