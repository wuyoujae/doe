import { effectiveTextStyle as __doeFn_effectiveTextStyle } from '../effective-text-style/index.js';
import { defaultTextStyle as __doeFn_defaultTextStyle } from '../default-text-style/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5355


export function toggleTextStyle(node, key) {
    const nextValue = !(0, __doeFn_effectiveTextStyle)(node, key);
    const defaultValue = (0, __doeFn_defaultTextStyle)(node, key);
    const nextStyle = { ...(node.props?.textStyle || {}) };
    if (nextValue === defaultValue) delete nextStyle[key];
    else nextStyle[key] = nextValue;
    if (Object.keys(nextStyle).length) node.props.textStyle = nextStyle;
    else delete node.props.textStyle;
    return nextValue;
  }
