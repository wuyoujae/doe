import { hasArray as __doeFn_hasArray } from '../has-array/index.js';
// Origin: public/yrkie-doe/layout-engine/library-components.js:53


export function validateItems(props, warnings, type) {
    if (!(0, __doeFn_hasArray)(props.content?.items)) {
      warnings.push(`${type}.content.items must contain data.`);
    }
  }
