import { itemIcon } from '../../../../../shared/item-icon/index.js';
import { typographyText as __doeFn_typographyText } from '../../../../../registry/base/typography-text/index.js';
// Origin: layout-engine/components.js; question-card.render


export function render(component, { element }) {
      const root = element("article", "component-question-card");
      const authoredIndex = component.props.index;
      const indexLabel =
        authoredIndex === undefined ||
        authoredIndex === null ||
        String(authoredIndex).trim() === ""
          ? undefined
          : authoredIndex;
      const badge = element("div", "component-question-card__index", indexLabel);
      if (indexLabel === undefined) {
        badge.dataset.questionIcon = 'true';
        badge.append(itemIcon(root.ownerDocument, component.props.icon, 'CircleHelp'));
      } else (0, __doeFn_typographyText)(badge, "large", { mode: "title", maxLines: 4 });
      root.append(badge);
      const body = element("div", "component-question-card__body");
      body.append(
        (0, __doeFn_typographyText)(
          element("h3", "component-question-card__title", component.props.title || ""),
          "h4",
          { mode: "title", maxLines: 6 },
        ),
      );
      if (component.props.text) {
        body.append(
          (0, __doeFn_typographyText)(
            element("p", "component-question-card__text", component.props.text),
            "large",
            {
              mode: "body",
              maxLines: 12,
              widthSafety: 0.92,
            },
          ),
        );
      }
      root.append(body);
      return root;
    }
