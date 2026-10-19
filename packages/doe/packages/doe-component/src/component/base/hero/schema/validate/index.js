// Origin: layout-engine/components.js; hero.validate


export function validate(props, warnings) {
      if (!props.title) warnings.push("hero.title 为空。");
    }
