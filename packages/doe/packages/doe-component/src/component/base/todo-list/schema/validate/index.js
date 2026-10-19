// Origin: layout-engine/components.js; todo-list.validate


export function validate(props, warnings) {
      if (!Array.isArray(props.items) || !props.items.length || props.items.some(item => typeof item?.text !== "string" || typeof item.checked !== "boolean")) {
        warnings.push("todo-list.items requires text and checked for each item.");
      }
    }
