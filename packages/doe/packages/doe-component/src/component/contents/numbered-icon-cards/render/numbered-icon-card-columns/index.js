// Origin: public/yrkie-doe/components/process-diagrams/process-diagrams.js:812
import { scope as __doeScope } from "../../../../../shared/process-diagrams/runtime/context/index.js";

export function numberedIconCardColumns(config, itemCount) {
    return __doeScope.global.DOEContentsLayout.itemColumns(config, Number(config.size?.width) || 960, itemCount, 14);
  }
