import { attachChartInteraction } from '../../../../shared/chart/tooltip/runtime/index.js';
import { seriesColor as __doeFn_seriesColor } from '../series-color/index.js';
import { calculateSize as __doeFn_calculateSize } from '../calculate-size/index.js';
import { contrastTextColor as __doeFn_contrastTextColor } from '../contrast-text-color/index.js';
// Origin: public/yrkie-doe/components/stacked-bar-chart/stacked-bar-chart.js:118
import { scope as __doeScope } from "../runtime/context/index.js";

export function mount(target, config) {
    const host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error("StackedBarChart: target element was not found.");
    const content = config && config.content;
    if (!content?.categories?.length || !content?.series?.length) {
      throw new Error("StackedBarChart: categories and series are required.");
    }
    content.series.forEach((series) => {
      if (!Array.isArray(series.data) || series.data.length !== content.categories.length) {
        throw new Error(`StackedBarChart: series '${series.name}' has invalid data length.`);
      }
    });
    const resolvedSeries = content.series.map((series, index) => ({
      ...series,
      color: (0, __doeFn_seriesColor)(series, index),
    }));

    __doeScope.instanceCount += 1;
    const totals = content.categories.map((_, categoryIndex) =>
      resolvedSeries.reduce(
        (total, series) => total + (Number(series.data[categoryIndex]) || 0),
        0
      )
    );
    const scale = __doeScope.utils.niceScale(totals, {
      includeZero: true,
      maxValue: Number.isFinite(content.maxValue) ? content.maxValue : undefined,
      tickInterval: content.tickInterval,
      targetTicks: 5,
    });
    const size = (0, __doeFn_calculateSize)(config, totals, scale);
    const showYAxis = content.showYAxis === true;
    const svgWidth = size.width;
    let svgHeight = size.plotHeight;

    host.replaceChildren();
    host.classList.add("ppt-stacked-bar-chart");
    host.style.width = `${size.width}px`;
    host.style.height = `${size.height}px`;
    host.style.setProperty("--stacked-chart-legend-columns", size.legendColumns);
    host.setAttribute("role", "img");
    host.setAttribute(
      "aria-label",
      [config.title, config.subtitle, "Stacked bar chart"].filter(Boolean).join(". ")
    );

    if (config.title) {
      host.append(
        __doeScope.utils.element("h2", "ppt-stacked-bar-chart__title", config.title)
      );
    }
    if (config.subtitle) {
      host.append(
        __doeScope.utils.element("p", "ppt-stacked-bar-chart__subtitle", config.subtitle)
      );
    }
    let legend = null;
    if (config.showLegend !== false) {
      legend = __doeScope.utils.element("ul", "ppt-stacked-bar-chart__legend");
      legend.setAttribute("aria-label", "Data series");
      const legendSeries = content.legendReversed
        ? [...resolvedSeries].reverse()
        : resolvedSeries;
      legendSeries.forEach((series) => {
        const item = __doeScope.utils.element("li", "ppt-stacked-bar-chart__legend-item");
        const swatch = __doeScope.utils.element("span", "ppt-stacked-bar-chart__swatch");
        swatch.style.color = series.color;
        item.append(swatch, document.createTextNode(series.name));
        legend.append(item);
      });
    }

    const svg = __doeScope.utils.svgElement("svg", {
      class: "ppt-stacked-bar-chart__svg",
      viewBox: `0 0 ${svgWidth} ${svgHeight}`,
      preserveAspectRatio: "xMidYMid meet",
      "aria-hidden": "true",
    });

    // The layout engine can make a chart shorter than its natural height.  Keep
    // the SVG coordinate system matched to the space that flexbox actually
    // assigned; otherwise `xMidYMid meet` scales the whole plot down and leaves
    // large blank gutters on both sides of the component.
    host.append(svg);
    if (legend) host.append(legend);
    const renderedSvgHeight = Math.round(svg.clientHeight);
    if (renderedSvgHeight > 0) svgHeight = renderedSvgHeight;
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    svg.dataset.fit = "available-space";

    const margin = {
      top: __doeScope.utils.clamp(Math.round(svgHeight * 0.08), 12, 20),
      right: __doeScope.utils.clamp(Math.round(svgWidth * 0.025), 12, 18),
      bottom: __doeScope.utils.clamp(Math.round(svgHeight * 0.15), 26, 34),
      left: showYAxis
        ? Math.max(42, ...scale.ticks.map((tick) => __doeScope.utils.measureText(__doeScope.utils.formatValue(tick, content), `${__doeScope.NORMAL_FONT_SIZE}px ${__doeScope.FONT_STACK}`) + 16))
        : __doeScope.utils.clamp(Math.round(svgWidth * 0.025), 10, 18),
    };
    const fieldWidth = Math.max(1, svgWidth - margin.left - margin.right);
    const categoryLines = content.categories.map((category) => __doeScope.utils.wrapText(
      category, Math.max(20, fieldWidth / content.categories.length - 10), `${__doeScope.NORMAL_FONT_SIZE}px ${__doeScope.FONT_STACK}`));
    const categoryLineHeight = __doeScope.NORMAL_FONT_SIZE * 1.2;
    margin.bottom = Math.max(margin.bottom, Math.max(...categoryLines.map((lines) => lines.length)) * categoryLineHeight + 12);
    const fieldHeight = Math.max(1, svgHeight - margin.top - margin.bottom);
    const xFor = (index) =>
      margin.left + ((index + 0.5) / content.categories.length) * fieldWidth;
    const yFor = (value) =>
      margin.top + ((scale.maxValue - value) / scale.maxValue) * fieldHeight;
    const defs = __doeScope.utils.svgElement("defs");
    svg.append(defs);

    scale.ticks.forEach((tick) => {
      const y = yFor(tick);
      svg.append(
        __doeScope.utils.svgElement("line", {
          x1: margin.left,
          y1: y,
          x2: margin.left + fieldWidth,
          y2: y,
          class: "ppt-stacked-bar-chart__grid-line",
        })
      );
      if (showYAxis) {
        const tickLabel = __doeScope.utils.svgElement("text", {
          x: margin.left - 10,
          y: y + 5,
          "text-anchor": "end",
          class: "ppt-stacked-bar-chart__axis-label",
        });
        tickLabel.textContent = __doeScope.utils.formatValue(tick, content);
        svg.append(tickLabel);
      }
    });

    const slotWidth = fieldWidth / content.categories.length;
    const barWidth = Math.min(Math.max(44, size.largestValueWidth + 12), slotWidth * 0.82);
    content.categories.forEach((category, categoryIndex) => {
      const clipId = `stacked-bar-${__doeScope.instanceCount}-${categoryIndex}`;
      const clipPath = __doeScope.utils.svgElement("clipPath", { id: clipId });
      const stackTop = yFor(totals[categoryIndex]);
      const stackBottom = yFor(0);
      clipPath.append(
        __doeScope.utils.svgElement("rect", {
          x: xFor(categoryIndex) - barWidth / 2,
          y: stackTop,
          width: barWidth,
          height: Math.max(0, stackBottom - stackTop),
          rx: 8,
          ry: 8,
          class: "ppt-stacked-bar-chart__bar-clip",
        })
      );
      defs.append(clipPath);
      const barGroup = __doeScope.utils.svgElement("g", {
        "clip-path": `url(#${clipId})`,
        class: "ppt-stacked-bar-chart__bar",
      });
      const labels = [];
      let cumulative = 0;
      resolvedSeries.forEach((series) => {
        const value = Number(series.data[categoryIndex]) || 0;
        const segmentTop = cumulative + value;
        const y = yFor(segmentTop);
        const height = yFor(cumulative) - y;
        barGroup.append(
          __doeScope.utils.svgElement("rect", {
            x: xFor(categoryIndex) - barWidth / 2,
            y,
            width: barWidth,
            height,
            fill: series.color,
          })
        );
        if (content.showValues !== false && height >= 18) {
          const label = __doeScope.utils.svgElement("text", {
            x: xFor(categoryIndex),
            y: y + height / 2 + 6,
            class: "ppt-stacked-bar-chart__segment-label",
            style: `fill: ${(0, __doeFn_contrastTextColor)(series.color)}`,
          });
          label.textContent = __doeScope.utils.formatValue(value, content);
          label.dataset.chartLabelMaxWidth = String(Math.max(0, barWidth - 6));
          labels.push(label);
        }
        cumulative = segmentTop;
      });
      svg.append(barGroup, ...labels);

      const categoryLabel = __doeScope.utils.svgElement("text", {
        x: xFor(categoryIndex),
        y: svgHeight - margin.bottom + categoryLineHeight,
        class: "ppt-stacked-bar-chart__category-label",
      });
      categoryLines[categoryIndex].forEach((line, index) => {
        const span = __doeScope.utils.svgElement("tspan", { x: xFor(categoryIndex), dy: index ? categoryLineHeight : 0 });
        span.textContent = line; categoryLabel.append(span);
      });
      svg.append(categoryLabel);
    });

    attachChartInteraction(host, config, 'stacked-bar-chart');

    return { element: host, size: { width: size.width, height: size.height }, scale };
  }
