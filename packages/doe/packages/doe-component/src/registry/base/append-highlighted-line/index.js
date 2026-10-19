import { codeTokenClass as __doeFn_codeTokenClass } from '../code-token-class/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:287
import { scope as __doeScope } from "../../runtime/base/context/index.js";

export function appendHighlightedLine(lineRoot, source, element) {
    let cursor = 0;
    for (const match of source.matchAll(__doeScope.CODE_TOKEN_PATTERN)) {
      if (match.index > cursor) {
        lineRoot.append(
          element("span", "component-code-block__plain", source.slice(cursor, match.index)),
        );
      }
      const token = match[0];
      lineRoot.append(
        element(
          "span",
          `component-code-block__token component-code-block__token--${(0, __doeFn_codeTokenClass)(token)}`,
          token,
        ),
      );
      cursor = match.index + token.length;
    }
    if (cursor < source.length) {
      lineRoot.append(
        element("span", "component-code-block__plain", source.slice(cursor)),
      );
    }
    if (!source.length) {
      lineRoot.append(element("span", "component-code-block__plain", " "));
    }
  }
