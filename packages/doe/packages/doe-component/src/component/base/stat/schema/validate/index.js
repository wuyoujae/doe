// Origin: layout-engine/components.js; stat.validate


export function validate(props, warnings) {
      if (props.value === undefined) warnings.push("stat.value 不能为空。");
    }
