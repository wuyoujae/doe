import { attachChartInteraction } from '../../../../shared/chart/tooltip/runtime/index.js';
import { validate as __doeFn_validate } from '../validate/index.js';
import { calculateSize as __doeFn_calculateSize } from '../calculate-size/index.js';
import { resolveSeriesColor as __doeFn_resolveSeriesColor } from '../resolve-series-color/index.js';
// Origin: public/yrkie-doe/components/line-chart/line-chart.js:97
import { scope as __doeScope } from "../runtime/context/index.js";

export function mount(target, config) {
    (0, __doeFn_validate)(config);
    const host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error("LineChart: target element was not found.");

    const content = config.content;
    const showLegend = config.showLegend !== false;
    const values = content.series.flatMap((series) => series.data);
    const scale = __doeScope.utils.niceScale(values, {
      includeZero: content.includeZero !== false,
      minValue: Number.isFinite(content.minValue) ? content.minValue : undefined,
      maxValue: Number.isFinite(content.maxValue) ? content.maxValue : undefined,
      tickInterval: content.tickInterval,
      targetTicks: 6,
    });
    const size = (0, __doeFn_calculateSize)(config, scale);
    const bodyHorizontalPadding = 28;
    const plotWidth =
      size.width - bodyHorizontalPadding - size.yAxisWidth;
    const fieldWidth = Math.max(180, plotWidth);
    const fieldHeight = size.plotHeight;
    const yRange = scale.maxValue - scale.minValue;
    const xFor = (index) =>
      ((index + 0.5) / content.categories.length) * fieldWidth;
    const yFor = (value) =>
      ((scale.maxValue - Number(value)) / yRange) * fieldHeight;

    host.replaceChildren();
    host.classList.add("ppt-line-chart");
    host.dataset.hasTitle = String(Boolean(config.title));
    host.dataset.showLegend = String(showLegend);
    const valueLabels = content.series.flatMap(series => series.labels || []);
    host.dataset.hasValueLabels = String(valueLabels.length > 0);
    host.style.setProperty('--line-chart-label-rise', `${Math.max(0, ...valueLabels.map(label => -(label.dy ?? -9)))}px`);
    host.style.width = `${size.width}px`;
    host.style.height = `${size.height}px`;
    host.style.setProperty("--line-chart-y-axis-width", `${size.yAxisWidth}px`);
    host.style.setProperty("--line-chart-legend-columns", size.legendColumns);
    host.style.setProperty("--line-chart-category-count", content.categories.length);
    host.setAttribute("role", "img");
    host.setAttribute(
      "aria-label",
      [config.title, "Line chart"].filter(Boolean).join(". ")
    );

    if (config.title) {
      const title = __doeScope.utils.element("header", "ppt-line-chart__title", config.title);
      host.append(title);
      const computed = __doeScope.global.getComputedStyle(title);
      const desired =
        Number.parseFloat(computed.fontSize) ||
        __doeScope.global.PPTTheme.theme.typography.styles.h4.sizes.default * (4 / 3);
      const available = Math.max(80, size.width - 36);
      const measured = __doeScope.utils.measureText(
        config.title,
        `${computed.fontWeight || __doeScope.SEMIBOLD_WEIGHT} ${desired}px ${computed.fontFamily || __doeScope.FONT_STACK}`
      );
      if (measured > available) {
        host.dataset.titleWrap = "true";
      }
    }

    const body = __doeScope.utils.element("div", "ppt-line-chart__body");

    const main = __doeScope.utils.element("div", "ppt-line-chart__main");
    const plot = __doeScope.utils.element("div", "ppt-line-chart__plot");
    const yAxis = __doeScope.utils.element("div", "ppt-line-chart__y-axis");
    const field = __doeScope.utils.element("div", "ppt-line-chart__field");
    const xAxis = __doeScope.utils.element("div", "ppt-line-chart__x-axis");
    const svg = __doeScope.utils.svgElement("svg", {
      class: "ppt-line-chart__svg",
      viewBox: `0 0 ${fieldWidth} ${fieldHeight}`,
      preserveAspectRatio: "none",
      "aria-hidden": "true",
    });
    // Percent anchors follow the plot; no viewBox means glyphs and dx/dy remain
    // in real CSS pixels while the adjacent geometry SVG can stretch freely.
    const labels = __doeScope.utils.svgElement("svg", {
      class: "ppt-line-chart__labels",
      "aria-hidden": "true",
    });

    scale.ticks.forEach((tickValue) => {
      const y = yFor(tickValue);
      const tick = __doeScope.utils.element(
        "span",
        "ppt-line-chart__y-tick",
        __doeScope.utils.formatValue(tickValue, content)
      );
      tick.style.setProperty("--tick-position", `${(y / fieldHeight) * 100}%`);
      yAxis.append(tick);
      svg.append(
        __doeScope.utils.svgElement("line", {
          x1: 0,
          y1: y,
          x2: fieldWidth,
          y2: y,
          class:
            tickValue === 0
              ? "ppt-line-chart__grid-line ppt-line-chart__grid-line--zero"
              : "ppt-line-chart__grid-line",
        })
      );
    });

    content.series.forEach((series, seriesIndex) => {
      const seriesColor = (0, __doeFn_resolveSeriesColor)(series, seriesIndex);
      const points = series.data.map((value, index) => ({
        x: xFor(index),
        y: yFor(value),
        value,
      }));
      svg.append(
        __doeScope.utils.svgElement("path", {
          d: __doeScope.utils.smoothPath(points, config.smooth ?? true),
          class: "ppt-line-chart__series-path",
          stroke: seriesColor,
        })
      );

      points.forEach((point) => {
        svg.append(
          __doeScope.utils.svgElement("circle", {
            cx: point.x,
            cy: point.y,
            r: series.pointRadius || 4,
            fill: seriesColor,
            class: "ppt-line-chart__point",
          })
        );
      });

      (series.labels || []).forEach((label) => {
        const point = points[label.index];
        if (!point) return;
        const text = __doeScope.utils.svgElement("text", {
          x: `${point.x / fieldWidth * 100}%`,
          y: `${point.y / fieldHeight * 100}%`,
          dx: label.dx || 0,
          dy: label.dy ?? -9,
          "text-anchor": label.anchor || "middle",
          class: "ppt-line-chart__value-label",
          style: `fill: ${seriesColor}`,
        });
        text.textContent = label.text ?? __doeScope.utils.formatValue(point.value, content);
        labels.append(text);
      });
    });

    content.categories.forEach((category) => {
      xAxis.append(__doeScope.utils.element("span", "ppt-line-chart__category", category));
    });

    field.append(svg, labels);
    plot.append(yAxis, field, xAxis);
    main.append(plot);
    if (showLegend) {
      const legend = __doeScope.utils.element("ul", "ppt-line-chart__legend");
      legend.setAttribute("aria-label", "Data series");
      content.series.forEach((series, seriesIndex) => {
        const seriesColor = (0, __doeFn_resolveSeriesColor)(series, seriesIndex);
        const item = __doeScope.utils.element("li", "ppt-line-chart__legend-item");
        const line = __doeScope.utils.element("span", "ppt-line-chart__legend-line");
        line.style.color = seriesColor;
        item.append(line, document.createTextNode(series.name));
        legend.append(item);
      });
      main.append(legend);
    }
    body.append(main);
    host.append(body);
    // Wrapped categories consume their own row; keep a usable plotting area.
    if (field.clientWidth && field.clientHeight < 120) {
      size.height += 120 - field.clientHeight;
      host.style.height = `${size.height}px`;
    }

    attachChartInteraction(host, config, 'line-chart');

    return {
      element: host,
      size: { width: size.width, height: size.height },
      scale,
    };
  }
