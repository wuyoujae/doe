// Origin: layout-engine/components.js; notice.validate


export function validate(props, warnings) { if (typeof props.text !== "string" || !props.text.trim()) warnings.push("notice.text requires non-empty text."); }
