// Origin: layout-engine/components.js; question-card.validate


export function validate(props, warnings) {
      if (!props.title) warnings.push("question-card.title 为空。");
    }
