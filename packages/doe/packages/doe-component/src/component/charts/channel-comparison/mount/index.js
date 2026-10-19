import { targetOf as __doeFn_targetOf } from '../target-of/index.js';
import { positiveNumber as __doeFn_positiveNumber } from '../positive-number/index.js';
// Origin: public/yrkie-doe/components/channel-comparison/channel-comparison.js:72
import { scope as __doeScope } from "../runtime/context/index.js";

export function mount(target, config) {
    const host = (0, __doeFn_targetOf)(target);
    const content = config?.content || {};
    const periods = content.periods;
    if (!Array.isArray(periods) || !periods.length) {
      throw new Error("ChannelComparisonChart: content.periods is required.");
    }
    periods.forEach((period) => {
      if (!Array.isArray(period.segments) || !period.segments.length) {
        throw new Error("ChannelComparisonChart: every period requires segments.");
      }
    });

    const width = (0, __doeFn_positiveNumber)(config.size?.width, 520);
    const height = (0, __doeFn_positiveNumber)(config.size?.height, 570);
    const titleHeight = config.title ? 36 : 0;
    host.replaceChildren();
    host.className = "ppt-channel-comparison";
    host.style.width = `${width}px`;
    host.style.height = `${height}px`;
    host.setAttribute("role", "img");
    host.setAttribute("aria-label", config.title || "Channel comparison chart");
    if (config.title) host.append(__doeScope.utils.element("h2", "ppt-channel-comparison__title", config.title));

    const svgHeight = height - titleHeight;
    const svg = __doeScope.utils.svgElement("svg", {
      class: "ppt-channel-comparison__svg",
      viewBox: `0 0 ${width} ${svgHeight}`,
      preserveAspectRatio: "xMidYMid meet",
      "aria-hidden": "true",
    });
    const margin = { top: 20, right: 10, bottom: 54, left: 16 };
    const barsFieldWidth = width - margin.left - margin.right;
    const plotHeight = svgHeight - margin.top - margin.bottom;
    const slotWidth = barsFieldWidth / periods.length;
    const barWidth = Math.min(106, slotWidth * 0.76);
    const normalize = content.normalize || "percent";
    const totals = periods.map((period) =>
      period.segments.reduce((sum, segment) => sum + Math.max(0, Number(segment.value) || 0), 0)
    );
    const sharedMax = Math.max(...totals, 1);

    periods.forEach((period, periodIndex) => {
      const x = margin.left + periodIndex * slotWidth + (slotWidth - barWidth) / 2;
      const baseline = margin.top + plotHeight;
      const denominator = normalize === "shared" ? sharedMax : Math.max(1, totals[periodIndex]);
      let cursor = baseline;
      period.segments.forEach((segment, segmentIndex) => {
        const value = Math.max(0, Number(segment.value) || 0);
        const segmentHeight = (value / denominator) * plotHeight;
        const y = cursor - segmentHeight;
        const color = `var(--yrkie-color-chart-${(segmentIndex % 5) + 1})`;
        svg.append(
          __doeScope.utils.svgElement("rect", {
            x,
            y,
            width: barWidth,
            height: Math.max(0, segmentHeight),
            fill: color,
          })
        );
        const centerY = y + segmentHeight / 2;
        if (segmentHeight >= 24 && segment.valueLabel !== false) {
          const valueLabel = segment.valueLabel ?? __doeScope.utils.formatValue(value, content);
          const valueText = __doeScope.utils.svgElement("text", {
            x: x + barWidth / 2,
            y: centerY + 2,
            class: "ppt-channel-comparison__value",
            style: "fill:var(--yrkie-color-on-primary)",
          });
          valueText.textContent = valueLabel;
          svg.append(valueText);
          if (segment.detailLabel && segmentHeight >= 53) {
            const detail = __doeScope.utils.svgElement("text", {
              x: x + barWidth / 2,
              y: centerY + 19,
              class: "ppt-channel-comparison__detail",
              style: "fill:var(--yrkie-color-on-primary)",
            });
            detail.textContent = segment.detailLabel;
            svg.append(detail);
          }
        }
        cursor = y;
      });
      svg.append(
        __doeScope.utils.svgElement("rect", {
          x,
          y: baseline - (totals[periodIndex] / denominator) * plotHeight,
          width: barWidth,
          height: (totals[periodIndex] / denominator) * plotHeight,
          fill: "none",
          stroke: "var(--yrkie-color-auxiliary)",
          "stroke-width": 1.5,
        })
      );
      const label = __doeScope.utils.svgElement("text", {
        x: x + barWidth / 2,
        y: svgHeight - 15,
        class: "ppt-channel-comparison__period",
      });
      label.textContent = period.label || "";
      svg.append(label);
    });

    host.append(svg);
    return { element: host, size: { width, height }, totals };
  }
