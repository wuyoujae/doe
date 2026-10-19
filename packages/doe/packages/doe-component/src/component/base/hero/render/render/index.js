import { typographyText as __doeFn_typographyText } from '../../../../../registry/base/typography-text/index.js';
// Origin: layout-engine/components.js; hero.render
import { scope as __doeScope } from "../../../../../registry/runtime/base/context/index.js";

export function render(component, { element }) {
      const root = element("header", "component-hero");
      const content = element("div", "component-hero__content");
      if (component.props.eyebrow != null) {
        const eyebrow = element(
          "div",
          "component-hero__eyebrow",
          component.props.eyebrow,
        );
        __doeScope.engine.applyTypographyStyle(eyebrow, "small");
        const iconName = component.props.icon || "Handshake";
        const iconData = __doeScope.global.lucide?.icons?.[iconName] || __doeScope.global.lucide?.[iconName];
        if (iconData && typeof __doeScope.global.lucide?.createElement === "function") {
          eyebrow.prepend(
            __doeScope.global.lucide.createElement(iconData, {
              class: "component-hero__eyebrow-icon",
              "data-lucide": iconName.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(),
              "aria-hidden": "true",
              "stroke-width": 1.75,
            }),
          );
        }
        content.append(eyebrow);
      }
      content.append(
          (0, __doeFn_typographyText)(
            element("h1", "component-hero__title", component.props.title || ""),
            "h1",
            { mode: "title", maxLines: 4, weight: "semibold" },
          ),
      );
      if (component.props.subtitle) {
        content.append(
            (0, __doeFn_typographyText)(
              element(
                "p",
                "component-hero__subtitle",
                component.props.subtitle,
              ),
              "large",
              { mode: "body", maxLines: 6 },
            ),
        );
      }
      root.append(content);
      return root;
    }
