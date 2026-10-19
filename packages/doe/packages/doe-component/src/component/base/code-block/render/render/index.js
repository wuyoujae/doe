import { normalizeCodeLanguage as __doeFn_normalizeCodeLanguage } from '../../../../../registry/base/normalize-code-language/index.js';
import { appendHighlightedLine as __doeFn_appendHighlightedLine } from '../../../../../registry/base/append-highlighted-line/index.js';
// Origin: layout-engine/components.js; code-block.render
import { scope as __doeScope } from "../../../../../registry/runtime/base/context/index.js";

export function render(component, { element }) {
      const language = (0, __doeFn_normalizeCodeLanguage)(component.props.language);
      const root = element("article", "component-code-block");
      root.dataset.language = language;
      root.dataset.wrap = String(component.props.wrap !== false);
      // Language remains metadata for syntax highlighting only. Code blocks
      // intentionally render no internal title, language badge, or line numbers.
      root.dataset.lineNumbers = "false";

      const pre = element("pre", "component-code-block__pre");
      const code = element("code", "component-code-block__code");
      __doeScope.engine.applyTypographyStyle(code, "normal");
      String(component.props.code || "")
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .forEach((line, index) => {
          const lineRoot = element("span", "component-code-block__line");
          lineRoot.dataset.line = String(index + 1);
          const lineContent = element(
            "span",
            "component-code-block__line-content",
          );
          (0, __doeFn_appendHighlightedLine)(lineContent, line, element);
          lineRoot.append(lineContent);
          code.append(lineRoot);
        });
      pre.append(code);
      root.append(pre);
      return root;
    }
