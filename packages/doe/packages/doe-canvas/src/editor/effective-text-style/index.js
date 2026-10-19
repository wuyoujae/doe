import { defaultTextStyle as __doeFn_defaultTextStyle } from '../default-text-style/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5350


export function effectiveTextStyle(node, key) {
    const authored = node.props?.textStyle?.[key];
    return typeof authored === "boolean" ? authored : (0, __doeFn_defaultTextStyle)(node, key);
  }
