// Origin: public/yrkie-doe/layout-engine/layout-engine.js:769


export function normalizeCollectionProps(type, props) {
    props = props && typeof props === "object" ? props : {};
    // Historical/model-authored collections sometimes omit the content wrapper.
    // Normalize before validation, measurement and editing so all consumers agree.
    const contentKey = {
      "capability-cards": "items", "numbered-icon-cards": "items",
      "donut-chart": "items", "risk-matrix": "items", "waterfall-chart": "items",
    }[type];
    if (contentKey && Array.isArray(props.content)) {
      props = { ...props, content: { [contentKey]: props.content } };
    } else if (contentKey && Array.isArray(props[contentKey]) &&
      (props.content == null || (typeof props.content === "object" && props.content[contentKey] == null))) {
      props = { ...props, content: { ...props.content, [contentKey]: props[contentKey] } };
      delete props[contentKey];
    }
    return props;
  }
