import { runtimeIcon as __doeFn_runtimeIcon } from '../../../../../registry/base/runtime-icon/index.js';
import { typographyText as __doeFn_typographyText } from '../../../../../registry/base/typography-text/index.js';
// Origin: layout-engine/components.js; notice.render


export function render(component, { element }) {
      const root = element("aside", "component-notice");
      const iconName = !component.props.icon || component.props.icon === "StickyNote" ? "Triangle" : component.props.icon;
      let icon = (0, __doeFn_runtimeIcon)(iconName, "component-notice__icon");
      if (!icon) {
        icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("viewBox", "0 0 24 24"); icon.setAttribute("class", "component-notice__icon"); icon.setAttribute("aria-hidden", "true");
        const path = document.createElementNS(icon.namespaceURI, "path");
        path.setAttribute("d", "M10.27 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.73 3.86a2 2 0 0 0-3.46 0z"); icon.append(path);
      }
      root.append(icon, (0, __doeFn_typographyText)(element("div", "component-notice__text", component.props.text), "large", { mode: "paragraph", maxLines: 24 }));
      return root;
    }
