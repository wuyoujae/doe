import { attachChartInteraction } from '../../../../shared/chart/tooltip/runtime/index.js';
import { validate as __doeFn_validate } from '../validate/index.js';
import { resolveTarget as __doeFn_resolveTarget } from '../resolve-target/index.js';
import { buildSteps as __doeFn_buildSteps } from '../build-steps/index.js';
import { calculateScale as __doeFn_calculateScale } from '../calculate-scale/index.js';
import { calculateWidth as __doeFn_calculateWidth } from '../calculate-width/index.js';
import { prepareLabels as __doeFn_prepareLabels } from '../prepare-labels/index.js';
import { roundedTopBarPath as __doeFn_roundedTopBarPath } from '../rounded-top-bar-path/index.js';
import { valueText as __doeFn_valueText } from '../value-text/index.js';
import { contrastTextColor as __doeFn_contrastTextColor } from '../contrast-text-color/index.js';
import { appendMultilineText as __doeFn_appendMultilineText } from '../append-multiline-text/index.js';
// Origin: public/yrkie-doe/components/waterfall-chart/waterfall-chart.js:322
import { scope as __doeScope } from "../runtime/context/index.js";

export function mount(target, config) {
    (0, __doeFn_validate)(config);
    const host = (0, __doeFn_resolveTarget)(target);
    if (!host) throw new Error("WaterfallChart: target element was not found.");

    const content = config.content;
    const steps = (0, __doeFn_buildSteps)(content);
    const scale = (0, __doeFn_calculateScale)(content, steps);
    const width = (0, __doeFn_calculateWidth)(config);
    const showYAxis = content.showYAxis !== false;
    const axisLabelWidth = Math.max(0, ...scale.ticks.map((tick) =>
      __doeScope.utils.measureText(__doeScope.utils.formatValue(tick, content), `${__doeScope.NORMAL_FONT_SIZE}px ${__doeScope.FONT_STACK}`)
    ));
    const margin = { left: showYAxis ? Math.max(58, Math.ceil(axisLabelWidth) + 16) : 12, right: 12 };
    const fieldWidth = width - margin.left - margin.right;
    const slotWidth = fieldWidth / steps.length;
    const xFor = (index) => margin.left + (index + 0.5) * slotWidth;
    const labels = (0, __doeFn_prepareLabels)(content, slotWidth);
    const topBand = 10;
    const bottomBand = 8;
    const desiredPlotHeight = __doeScope.utils.clamp(235 + scale.ticks.length * 5, 260, 340);
    const titleHeight = config.title ? 38 : 0;
    const subtitleHeight = config.subtitle ? 34 : 0;
    const autoSvgHeight = topBand + desiredPlotHeight + bottomBand + labels.height;
    const autoHeight = titleHeight + subtitleHeight + autoSvgHeight;
    const height = Number(config.size?.height) || autoHeight;
    const availableSvgHeight = Math.max(
      260,
      height - titleHeight - subtitleHeight
    );
    const plotHeight = Math.max(
      120,
      availableSvgHeight - topBand - bottomBand - labels.height
    );
    const svgHeight = topBand + plotHeight + bottomBand + labels.height;
    const plotTop = topBand;
    const plotBottom = plotTop + plotHeight;
    const scaleSpan = scale.maxValue - scale.minValue;
    const yFor = (value) =>
      plotTop + ((scale.maxValue - value) / scaleSpan) * plotHeight;
    const barWidth = Math.min(62, slotWidth * 0.72);

    host.replaceChildren();
    host.classList.add("ppt-waterfall-chart");
    host.style.width = `${width}px`;
    host.style.height = `${height}px`;
    host.setAttribute("role", "img");
    host.setAttribute(
      "aria-label",
      [config.title, config.subtitle, "Waterfall chart"].filter(Boolean).join(". ")
    );

    if (config.title) {
      host.append(__doeScope.utils.element("h2", "ppt-waterfall-chart__title", config.title));
    }
    if (config.subtitle) {
      host.append(__doeScope.utils.element("p", "ppt-waterfall-chart__subtitle", config.subtitle));
    }

    const svg = __doeScope.utils.svgElement("svg", {
      class: "ppt-waterfall-chart__svg",
      viewBox: `0 0 ${width} ${svgHeight}`,
      preserveAspectRatio: "xMidYMid meet",
      "aria-hidden": "true",
    });

    scale.ticks.forEach((tick) => {
      const y = yFor(tick);
      svg.append(
        __doeScope.utils.svgElement("line", {
          x1: margin.left,
          y1: y,
          x2: margin.left + fieldWidth,
          y2: y,
          class:
            tick === 0
              ? "ppt-waterfall-chart__grid-line ppt-waterfall-chart__grid-line--baseline"
              : "ppt-waterfall-chart__grid-line",
        })
      );
      if (showYAxis) {
        const tickLabel = __doeScope.utils.svgElement("text", {
          x: margin.left - 12,
          y: y + 5,
          "text-anchor": "end",
          class: "ppt-waterfall-chart__axis-label",
        });
        tickLabel.textContent = __doeScope.utils.formatValue(tick, content);
        svg.append(tickLabel);
      }
    });

    steps.slice(0, -1).forEach((step, index) => {
      if (step.item.connectToNext === false) return;
      const y = yFor(step.end);
      svg.append(
        __doeScope.utils.svgElement("line", {
          x1: xFor(index) + barWidth / 2,
          y1: y,
          x2: xFor(index + 1) - barWidth / 2,
          y2: y,
          class: "ppt-waterfall-chart__connector",
        })
      );
    });

    steps.forEach((step) => {
      const rawTop = Math.min(yFor(step.start), yFor(step.end));
      const rawBottom = Math.max(yFor(step.start), yFor(step.end));
      const rawHeight = rawBottom - rawTop;
      const barHeight = Math.max(step.type === "change" && step.value === 0 ? 3 : rawHeight, 3);
      const y = rawHeight < 3 ? yFor(step.end) - barHeight / 2 : rawTop;
      const touchesZeroAtBottom =
        Math.abs(Math.min(step.start, step.end)) <= __doeScope.ZERO_EPSILON &&
        Math.max(step.start, step.end) > __doeScope.ZERO_EPSILON;
      const baselineGap = touchesZeroAtBottom
        ? Math.min(__doeScope.BASELINE_GAP, Math.max(0, barHeight - 1))
        : 0;
      const paintedHeight = barHeight - baselineGap;
      const x = xFor(step.index) - barWidth / 2;
      const barRadius = Math.min(8, barWidth / 2, paintedHeight / 2);
      const barAttributes = {
        class: "ppt-waterfall-chart__bar",
        "data-baseline-attached": touchesZeroAtBottom ? "true" : "false",
        "data-baseline-gap": String(baselineGap),
        fill: step.color,
      };
      svg.append(
        touchesZeroAtBottom
          ? __doeScope.utils.svgElement("path", {
              ...barAttributes,
              d: (0, __doeFn_roundedTopBarPath)(x, y, barWidth, paintedHeight, barRadius),
            })
          : __doeScope.utils.svgElement("rect", {
              ...barAttributes,
              x,
              y,
              width: barWidth,
              height: paintedHeight,
              rx: barRadius,
              ry: barRadius,
            })
      );

      if (content.showValues === false || step.item.showValue === false) return;
      const formatted = (0, __doeFn_valueText)(step, content);
      const textWidth = __doeScope.utils.measureText(formatted, `16px ${__doeScope.FONT_STACK}`);
      const requestedPosition = step.item.valuePosition;
      const canFitInside = paintedHeight >= 24 && textWidth + 8 <= barWidth;
      const position =
        requestedPosition ||
        (step.type === "total" && step.index === 0
          ? "above"
          : canFitInside
            ? "inside"
            : "badge");
      let labelY;
      let className = "ppt-waterfall-chart__value-label";

      if (position === "inside") {
        labelY = y + paintedHeight / 2 + 5;
        className += " ppt-waterfall-chart__value-label--inside";
      } else if (position === "above") {
        labelY = y - 8;
      } else {
        const badgeWidth = Math.max(24, textWidth + 8);
        const badgeY = __doeScope.utils.clamp(yFor(step.end) - 10, plotTop, plotBottom - 20);
        svg.append(
          __doeScope.utils.svgElement("rect", {
            x: xFor(step.index) - badgeWidth / 2,
            y: badgeY,
            width: badgeWidth,
            height: 20,
            rx: 8,
            ry: 8,
            fill: step.color,
            class: "ppt-waterfall-chart__value-badge",
          })
        );
        labelY = badgeY + 15;
        className += " ppt-waterfall-chart__value-label--badge";
      }

      const valueLabel = __doeScope.utils.svgElement("text", {
        x: xFor(step.index),
        y: labelY,
        class: className,
        style:
          position === "inside" || position === "badge"
            ? `fill:${(0, __doeFn_contrastTextColor)(step.color)}`
            : "",
      });
      valueLabel.textContent = formatted;
      svg.append(valueLabel);
    });

    labels.labels.forEach((label) => {
      const labelY = plotBottom + bottomBand + labels.tierOffsets[label.tier];
      if (label.tier > 0) {
        svg.append(
          __doeScope.utils.svgElement("line", {
            x1: xFor(label.index),
            y1: plotBottom + 2,
            x2: xFor(label.index),
            y2: labelY - 17,
            class: "ppt-waterfall-chart__category-leader",
          })
        );
      }
      (0, __doeFn_appendMultilineText)(svg, {
        x: xFor(label.index),
        y: labelY,
        lines: label.lines,
        lineHeight: 18,
        anchor: "middle",
        className: "ppt-waterfall-chart__category-label",
      });
    });

    host.append(svg);
    attachChartInteraction(host, config, 'waterfall-chart');

    return {
      element: host,
      size: { width, height },
      scale: {
        minValue: scale.minValue,
        maxValue: scale.maxValue,
        tickInterval: scale.interval,
      },
      values: steps.map((step) => step.end),
    };
  }
