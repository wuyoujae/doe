import { typographyText as __doeFn_typographyText } from '../../../../../registry/base/typography-text/index.js';
// Origin: layout-engine/components.js; heading.render


export function render(component, { element }) {
      const level = Math.max(1, Math.min(3, Number(component.props.level) || 1));
      const variant = ['section', 'plain', 'display'].includes(component.props.variant) ? component.props.variant : 'section';
      const root = element(
        level === 1 ? "h1" : level === 2 ? "h2" : "h3",
        `component-heading component-heading--${level}`,
        component.props.text || "",
      );
      if (component.props.variant !== undefined) root.dataset.headingVariant = variant;
      (0, __doeFn_typographyText)(
        root,
        variant === 'display' || level === 1 ? "h1" : level === 2 ? "h2" : "h3",
        { mode: "title", maxLines: 4, weight: "semibold" },
      );
      if (component.props.kicker) {
        root.dataset.kicker = component.props.kicker;
      }
      return root;
    }
