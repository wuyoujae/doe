// Origin: public/yrkie-doe/components/process-diagrams/process-diagrams.js:751
import { scope as __doeScope } from "../../../../../shared/process-diagrams/runtime/context/index.js";

export function capabilityCardColumns(config, itemCount) {
    return __doeScope.global.DOEContentsLayout.itemColumns(config, Number(config.size?.width) || 960, itemCount, 12);
  }
