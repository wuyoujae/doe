// Origin: layout-engine/components.js; heading.validate


export function validate(props, warnings) {
      if (!props.text) warnings.push("heading.text 为空。");
    }
