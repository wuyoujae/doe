// Origin: layout-engine/components.js; list.validate


export function validate(props, warnings) {
      if (!Array.isArray(props.items)) warnings.push("list.items 必须是数组。");
    }
