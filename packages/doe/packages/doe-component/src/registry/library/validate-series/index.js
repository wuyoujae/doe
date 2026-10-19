import { hasArray as __doeFn_hasArray } from '../has-array/index.js';
// Origin: public/yrkie-doe/layout-engine/library-components.js:43


export function validateSeries(props, warnings, type) {
    const content = props.content;
    if (!(0, __doeFn_hasArray)(content?.categories)) {
      warnings.push(`${type}.content.categories must contain data.`);
    }
    if (!(0, __doeFn_hasArray)(content?.series)) {
      warnings.push(`${type}.content.series must contain data.`);
    }
  }
