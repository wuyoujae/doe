import { typographyText as __doeFn_typographyText } from '../../../../../registry/base/typography-text/index.js';
// Origin: layout-engine/components.js; text.render


export function render(component, { element }) {
      const root = element("article", "component-text");
      if (component.props.title) {
        root.append(
          (0, __doeFn_typographyText)(
            element("h2", "component-title", component.props.title),
            "h4",
            { mode: "title", maxLines: 4 },
          ),
        );
      }
      const body = element(
        "p",
        "component-text__body",
        component.props.text || "",
      );
      (0, __doeFn_typographyText)(body, "large", { mode: "body", maxLines: 24 });
      root.append(body);
      return root;
    }
