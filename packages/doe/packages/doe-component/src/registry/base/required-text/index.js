// Origin: public/yrkie-doe/layout-engine/components.js:14


export function requiredText(props, warnings, label) {
    if (!props.title && !props.label && !props.text) {
      warnings.push(`${label} 缺少主要文字。`);
    }
  }
