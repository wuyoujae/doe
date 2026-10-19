import { isTextualStatValue as __doeFn_isTextualStatValue } from '../../../../../registry/base/is-textual-stat-value/index.js';
import { typographyText as __doeFn_typographyText } from '../../../../../registry/base/typography-text/index.js';
// Origin: layout-engine/components.js; stat.render


export function render(component, { element }) {
      const root = element("article", "component-stat");
      const textualValue = (0, __doeFn_isTextualStatValue)(component.props.value);
      const value = element(
        "div",
        textualValue
          ? "component-stat__value component-stat__value--textual"
          : "component-stat__value",
        component.props.value ?? "",
      );
      root.dataset.statValueKind = textualValue ? "text" : "metric";
      root.append(
        (0, __doeFn_typographyText)(
          value,
          "h1",
          {
            mode: textualValue ? "title" : "metric",
            maxLines: 2,
          },
        ),
        (0, __doeFn_typographyText)(
          element("h2", "component-stat__label", component.props.label || ""),
          "h4",
          { mode: "short-label", maxLines: 2 },
        ),
      );
      if (component.props.description) {
        root.append(
            (0, __doeFn_typographyText)(
              element(
                "p",
                "component-stat__description",
                component.props.description,
              ),
              "large",
              { mode: "description", maxLines: 3 },
            ),
        );
      }
      return root;
    }
