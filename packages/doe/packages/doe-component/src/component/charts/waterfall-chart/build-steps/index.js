// Origin: public/yrkie-doe/components/waterfall-chart/waterfall-chart.js:127
import { scope as __doeScope } from "../runtime/context/index.js";

export function buildSteps(content) {
    let running = 0;
    return content.items.map((item, index) => {
      const type = item.type === "total" ? "total" : "change";
      const numericValue = Number(item.value);
      let start;
      let end;

      if (type === "total") {
        start = 0;
        end = Number.isFinite(numericValue) ? numericValue : running;
        running = end;
      } else {
        start = running;
        end = running + numericValue;
        running = end;
      }

      const color =
        type === "total"
          ? index === content.items.length - 1
            ? __doeScope.END_COLOR
            : __doeScope.DEEP_COLOR
          : numericValue >= 0
            ? __doeScope.PRIMARY_COLOR
            : __doeScope.LIGHT_COLOR;

      return {
        item,
        index,
        type,
        value: type === "total" ? end : numericValue,
        start,
        end,
        color,
      };
    });
  }
