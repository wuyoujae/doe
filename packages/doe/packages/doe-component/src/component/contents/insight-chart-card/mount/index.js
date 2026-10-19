import { calculateSize as __doeFn_calculateSize } from '../calculate-size/index.js';
// Origin: public/yrkie-doe/components/insight-chart-card/insight-chart-card.js:48
import { scope as __doeScope } from "../runtime/context/index.js";

export function mount(target, config) {
    const host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error("InsightChartCard: target element was not found.");
    const chart = config && config.chart;
    if (!chart || !Array.isArray(chart.categories) || !Array.isArray(chart.data)) {
      throw new Error("InsightChartCard: chart.categories and chart.data are required.");
    }
    if (chart.categories.length !== chart.data.length) {
      throw new Error("InsightChartCard: chart data must match categories length.");
    }

    __doeScope.instanceCount += 1;
    const scale = __doeScope.utils.niceScale(chart.data, {
      includeZero: chart.includeZero !== false,
      minValue: Number.isFinite(chart.minValue) ? chart.minValue : undefined,
      maxValue: Number.isFinite(chart.maxValue) ? chart.maxValue : undefined,
      tickInterval: chart.tickInterval,
      targetTicks: 4,
    });
    const size = (0, __doeFn_calculateSize)(config, scale);
    const svgWidth = size.width;
    const svgHeight = size.chartHeight;
    const showYAxis = chart.showYAxis !== false;
    const margin = {
      top: 22,
      right: 18,
      bottom: 34,
      left: showYAxis ? 42 : 14,
    };
    const fieldWidth = svgWidth - margin.left - margin.right;
    const fieldHeight = svgHeight - margin.top - margin.bottom;
    const yRange = scale.maxValue - scale.minValue;
    const xFor = (index) =>
      margin.left + ((index + 0.5) / chart.categories.length) * fieldWidth;
    const yFor = (value) =>
      margin.top + ((scale.maxValue - value) / yRange) * fieldHeight;

    host.replaceChildren();
    host.classList.add("ppt-insight-card");
    host.dataset.hasIndex = String(config.index !== undefined);
    host.style.width = `${size.width}px`;
    host.style.height = `${size.height}px`;
    host.setAttribute("role", "img");
    host.setAttribute(
      "aria-label",
      [config.title, config.subtitle, `${chart.type} insight chart`]
        .filter(Boolean)
        .join(". ")
    );

    if (config.title || config.index !== undefined) {
      const header = __doeScope.utils.element("header", "ppt-insight-card__header");
      if (config.index !== undefined) {
        header.append(
          __doeScope.utils.element("span", "ppt-insight-card__badge", config.index)
        );
      }
      if (config.title) {
        header.append(
          __doeScope.utils.element("h2", "ppt-insight-card__title", config.title)
        );
      }
      host.append(header);
    }

    if (config.subtitle) {
      host.append(
        __doeScope.utils.element("p", "ppt-insight-card__subtitle", config.subtitle)
      );
    }

    const svg = __doeScope.utils.svgElement("svg", {
      class: "ppt-insight-card__svg",
      viewBox: `0 0 ${svgWidth} ${svgHeight}`,
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
          class: "ppt-insight-card__grid-line",
        })
      );
      if (showYAxis) {
        const tickLabel = __doeScope.utils.svgElement("text", {
          x: margin.left - 12,
          y: y + 5,
          "text-anchor": "end",
          class: "ppt-insight-card__axis-label",
        });
        tickLabel.textContent = __doeScope.utils.formatValue(tick, chart);
        svg.append(tickLabel);
      }
    });

    chart.categories.forEach((category, index) => {
      const label = __doeScope.utils.svgElement("text", {
        x: xFor(index),
        y: svgHeight - 8,
        class: "ppt-insight-card__category-label",
      });
      label.textContent = category;
      svg.append(label);
    });

    if (chart.type === "bar") {
      const slotWidth = fieldWidth / chart.categories.length;
      const barWidth = Math.min(46, slotWidth * 0.48);
      chart.data.forEach((value, index) => {
        const x = xFor(index) - barWidth / 2;
        const y = yFor(value);
        const baselineY = yFor(Math.max(0, scale.minValue));
        svg.append(
          __doeScope.utils.svgElement("rect", {
            x,
            y,
            width: barWidth,
            height: Math.max(0, baselineY - y),
            fill: "var(--yrkie-color-primary)",
          })
        );
        const valueLabel = __doeScope.utils.svgElement("text", {
          x: xFor(index),
          y: chart.valuePosition === "above" ? y - 8 : baselineY - 12,
          class:
            chart.valuePosition === "above"
              ? "ppt-insight-card__value-label"
              : "ppt-insight-card__bar-value",
        });
        valueLabel.textContent = __doeScope.utils.formatValue(value, chart);
        svg.append(valueLabel);
      });

    } else {
      const points = chart.data.map((value, index) => ({
        x: xFor(index),
        y: yFor(value),
        value,
      }));
      svg.append(
        __doeScope.utils.svgElement("path", {
          d: __doeScope.utils.smoothPath(points, chart.smooth ?? true),
          stroke: "var(--yrkie-color-primary)",
          class: "ppt-insight-card__line",
        })
      );
      points.forEach((point) => {
        const valueLabel = __doeScope.utils.svgElement("text", {
          x: point.x,
          y: point.y - 9,
          class: "ppt-insight-card__value-label",
        });
        valueLabel.textContent = __doeScope.utils.formatValue(point.value, chart);
        svg.append(valueLabel);
      });
    }

    host.append(svg);
    return { element: host, size: { width: size.width, height: size.height }, scale };
  }
