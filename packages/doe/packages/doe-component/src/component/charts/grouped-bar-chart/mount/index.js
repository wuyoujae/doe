import { attachChartInteraction } from '../../../../shared/chart/tooltip/runtime/index.js';
import { validate as __doeFn_validate } from '../validate/index.js';
import { resolveTarget as __doeFn_resolveTarget } from '../resolve-target/index.js';
import { resolveScaleModel as __doeFn_resolveScaleModel } from '../resolve-scale-model/index.js';
import { calculateScale as __doeFn_calculateScale } from '../calculate-scale/index.js';
import { scaleContent as __doeFn_scaleContent } from '../scale-content/index.js';
import { calculateSize as __doeFn_calculateSize } from '../calculate-size/index.js';
import { element as __doeFn_element } from '../element/index.js';
import { measureText as __doeFn_measureText } from '../measure-text/index.js';
import { formatScaleTick as __doeFn_formatScaleTick } from '../format-scale-tick/index.js';
import { svgElement as __doeFn_svgElement } from '../svg-element/index.js';
import { resolveSeriesColor as __doeFn_resolveSeriesColor } from '../resolve-series-color/index.js';
import { clamp as __doeFn_clamp } from '../clamp/index.js';
import { formatValue as __doeFn_formatValue } from '../format-value/index.js';
import { fitLabels as __doeFn_fitLabels } from '../fit-labels/index.js';
// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:354
import { scope as __doeScope } from "../runtime/context/index.js";

export function mount(target, config) {
    (0, __doeFn_validate)(config);

    const host = (0, __doeFn_resolveTarget)(target);
    if (!host) throw new Error("GroupedBarChart: target element was not found.");

    const content = config.content;
    const categories = content.categories;
    const seriesList = content.series;
    const showLegend = config.showLegend !== false;
    const scaleModel = (0, __doeFn_resolveScaleModel)(content);
    const scale = (0, __doeFn_calculateScale)((0, __doeFn_scaleContent)(content, scaleModel));
    const size = (0, __doeFn_calculateSize)(config, scale, scaleModel.mode);

    host.replaceChildren();
    delete host.dataset.titleWrap;
    host.classList.add("ppt-grouped-bar-chart");
    host.dataset.hasTitle = String(Boolean(config.title));
    host.dataset.scaleMode = scaleModel.mode;
    host.style.width = `${size.width}px`;
    host.style.height = `${size.height}px`;
    host.style.setProperty("--category-count", categories.length);
    host.style.setProperty("--series-count", seriesList.length);
    host.style.setProperty("--y-axis-width", `${size.yAxisWidth}px`);
    host.style.setProperty("--legend-columns", size.legendColumns);
    const barMaxWidth = seriesList.length <= 1 ? 72 : seriesList.length === 2 ? 50 : 38;
    host.style.setProperty("--bar-max-width", `${barMaxWidth}px`);
    host.setAttribute("role", "img");
    host.setAttribute(
      "aria-label",
      [
        config.title,
        config.subtitle,
        scaleModel.mode === "series-index"
          ? "Grouped bar chart, each series indexed to its first period"
          : "Grouped bar chart",
      ]
        .filter(Boolean)
        .join(". ")
    );

    if (config.title) {
      const title = (0, __doeFn_element)("header", "ppt-grouped-bar-chart__title", config.title);
      host.append(title);

      // Preserve the semantic title size whenever it fits, then choose the
      // largest safe size down to the 21pt title floor. Only after that floor
      // is reached may the title wrap; the grid header grows with it instead
      // of clipping half a line.
      const computed = __doeScope.global.getComputedStyle(title);
      const desired =
        Number.parseFloat(computed.fontSize) ||
        __doeScope.global.PPTTheme.theme.typography.styles.h4.sizes.default * (4 / 3);
      const available = Math.max(80, size.width - 32);
      const font = `${computed.fontWeight || __doeScope.SEMIBOLD_WEIGHT} ${desired}px ${computed.fontFamily || __doeScope.FONT_STACK}`;
      const measured = (0, __doeFn_measureText)(config.title, font);
      if (measured > available) {
        host.dataset.titleWrap = "true";
      }
    }

    const body = (0, __doeFn_element)("div", "ppt-grouped-bar-chart__body");

    if (config.subtitle) {
      body.append(
        (0, __doeFn_element)("h2", "ppt-grouped-bar-chart__subtitle", config.subtitle)
      );
    }

    const plot = (0, __doeFn_element)("div", "ppt-grouped-bar-chart__plot");
    const yAxis = (0, __doeFn_element)("div", "ppt-grouped-bar-chart__y-axis");
    const field = (0, __doeFn_element)("div", "ppt-grouped-bar-chart__field");
    const xAxis = (0, __doeFn_element)("div", "ppt-grouped-bar-chart__x-axis");

    scale.ticks.forEach((value) => {
      const percent = (value / scale.maxValue) * 100;
      const tick = (0, __doeFn_element)(
        "span",
        "ppt-grouped-bar-chart__y-tick",
        (0, __doeFn_formatScaleTick)(value, content, scaleModel.mode)
      );
      tick.style.setProperty("--tick-percent", `${percent}%`);
      tick.dataset.zero = String(value === 0);
      yAxis.append(tick);
    });

    const grid = (0, __doeFn_svgElement)("svg", {
      class: "ppt-grouped-bar-chart__grid",
      viewBox: "0 0 100 100",
      preserveAspectRatio: "none",
      "aria-hidden": "true",
    });

    scale.ticks.forEach((value) => {
      const y = 100 - (value / scale.maxValue) * 100;
      grid.append(
        (0, __doeFn_svgElement)("line", {
          x1: "0",
          y1: y,
          x2: "100",
          y2: y,
          class:
            value === 0
              ? "ppt-grouped-bar-chart__grid-line ppt-grouped-bar-chart__grid-line--baseline"
              : "ppt-grouped-bar-chart__grid-line",
        })
      );
    });

    const groups = (0, __doeFn_element)("div", "ppt-grouped-bar-chart__groups");
    categories.forEach((category, categoryIndex) => {
      const group = (0, __doeFn_element)("div", "ppt-grouped-bar-chart__group");

      seriesList.forEach((series, seriesIndex) => {
        const seriesColor = (0, __doeFn_resolveSeriesColor)(series, seriesIndex);
        const value = Number(series.data[categoryIndex]) || 0;
        const plotValue = Number(
          scaleModel.plotSeries[seriesIndex]?.plotData?.[categoryIndex],
        ) || 0;
        const percent = (0, __doeFn_clamp)((plotValue / scale.maxValue) * 100, 0, 100);
        const slot = (0, __doeFn_element)("div", "ppt-grouped-bar-chart__bar-slot");
        const valueLabel = (0, __doeFn_element)(
          "span",
          "ppt-grouped-bar-chart__value",
          (0, __doeFn_formatValue)(value, content)
        );
        const bar = (0, __doeFn_element)("i", "ppt-grouped-bar-chart__bar");

        slot.style.setProperty("--series-color", seriesColor);
        slot.style.setProperty("--bar-height", `${percent}%`);
        slot.dataset.zero = String(value === 0);
        slot.append(valueLabel, bar);
        group.append(slot);
      });

      groups.append(group);
      xAxis.append((0, __doeFn_element)("span", "ppt-grouped-bar-chart__category", category));
    });

    field.append(grid, groups);
    plot.append(yAxis, field, xAxis);
    body.append(plot);
    if (showLegend) {
      const legend = (0, __doeFn_element)("ul", "ppt-grouped-bar-chart__legend");
      legend.setAttribute("aria-label", "Data series");
      seriesList.forEach((series, seriesIndex) => {
        const seriesColor = (0, __doeFn_resolveSeriesColor)(series, seriesIndex);
        const item = (0, __doeFn_element)("li", "ppt-grouped-bar-chart__legend-item");
        const swatch = (0, __doeFn_element)("span", "ppt-grouped-bar-chart__swatch");
        swatch.style.color = seriesColor;
        item.append(swatch, document.createTextNode(series.name));
        legend.append(item);
      });
      body.append(legend);
    }
    host.append(body);
    (0, __doeFn_fitLabels)(host, field, size, config.tooltip?.enabled !== false);

    attachChartInteraction(host, config, 'grouped-bar-chart');

    return {
      element: host,
      size: { width: size.width, height: size.height },
      scale: { maxValue: scale.maxValue, tickInterval: scale.interval },
      scaleMode: scaleModel.mode,
    };
  }
