// Origin: layout-engine/components.js; quote.validate


export function validate(props, warnings) {
      if (!props.text) warnings.push("quote.text 为空。");
    }
