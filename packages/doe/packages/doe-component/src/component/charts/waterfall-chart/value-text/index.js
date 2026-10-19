// Origin: public/yrkie-doe/components/waterfall-chart/waterfall-chart.js:314
import { scope as __doeScope } from "../runtime/context/index.js";

export function valueText(step, content) {
    const value =
      step.type === "change" && content.showChangeSigns !== true
        ? Math.abs(step.value)
        : step.value;
    return __doeScope.utils.formatValue(value, content);
  }
