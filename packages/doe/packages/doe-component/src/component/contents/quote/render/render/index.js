import { typographyText as __doeFn_typographyText } from '../../../../../registry/base/typography-text/index.js';
// Origin: layout-engine/components.js; quote.render


export function render(component, { element }) {
      const root = element("figure", "component-quote");
      root.append(
        (0, __doeFn_typographyText)(
          element("blockquote", "", component.props.text || ""),
          "h4",
          { mode: "quote", maxLines: 8, weight: "semibold" },
        ),
      );
      if (component.props.source) {
        root.append(
          (0, __doeFn_typographyText)(
            element("figcaption", "component-quote__source", component.props.source),
            "large",
            { mode: "description", maxLines: 2 },
          ),
        );
      }
      return root;
    }
