import { measureText as __doeFn_measureText } from '../measure-text/index.js';
import { formatScaleTick as __doeFn_formatScaleTick } from '../format-scale-tick/index.js';
import { formatValue as __doeFn_formatValue } from '../format-value/index.js';
import { clamp as __doeFn_clamp } from '../clamp/index.js';
// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:181
import { scope as __doeScope } from "../runtime/context/index.js";

export function calculateSize(config, scale, scaleMode) {
    const content = config.content;
    const categories = content.categories;
    const series = content.series;
    const showLegend = config.showLegend !== false;
    const normalPx = __doeScope.global.PPTTheme.theme.typography.styles.normal.sizes.default * (4 / 3);
    const titleWidth = (0, __doeFn_measureText)(config.title, `${__doeScope.SEMIBOLD_WEIGHT} 26.667px ${__doeScope.FONT_STACK}`);
    const subtitleWidth = (0, __doeFn_measureText)(
      config.subtitle,
      `italic ${__doeScope.SEMIBOLD_WEIGHT} 24px ${__doeScope.FONT_STACK}`
    );
    const longestCategoryWidth = Math.max(
      0,
      ...categories.map((category) =>
        (0, __doeFn_measureText)(category, `${normalPx}px ${__doeScope.FONT_STACK}`)
      )
    );
    const tickLabelWidth = Math.max(
      0,
      ...scale.ticks.map((tick) =>
        (0, __doeFn_measureText)(
          (0, __doeFn_formatScaleTick)(tick, content, scaleMode),
          `${normalPx}px ${__doeScope.FONT_STACK}`,
        )
      )
    );
    const yAxisWidth = Math.ceil(Math.max(48, tickLabelWidth + 20));
    const valueWidth = Math.max(34, ...series.flatMap(item => item.data.map(value =>
      (0, __doeFn_measureText)((0, __doeFn_formatValue)(Number(value), content), `${__doeScope.SEMIBOLD_WEIGHT} ${normalPx}px ${__doeScope.FONT_STACK}`))));
    const barClusterWidth = series.length * (valueWidth + 8) + 28;
    const categoryWidth = Math.max(
      82,
      Math.ceil(longestCategoryWidth + 24),
      barClusterWidth
    );
    const plotDrivenWidth =
      yAxisWidth + categories.length * categoryWidth + 36;
    const legendItemWidth = showLegend
      ? Math.max(
          112,
          ...series.map(
            (item) => (0, __doeFn_measureText)(item.name, `14.667px ${__doeScope.FONT_STACK}`) + 26,
          ),
        )
      : 0;
    // Width is driven by the longest legend item, not by the sum of every
    // item. The legend is allowed to form multiple rows inside narrow slots.
    const legendWidth = showLegend ? yAxisWidth + legendItemWidth + 28 : 0;
    const textDrivenWidth = Math.max(
      titleWidth + 40,
      subtitleWidth + 44,
      legendWidth
    );
    const autoWidth = (0, __doeFn_clamp)(
      Math.ceil(Math.max(380, plotDrivenWidth, textDrivenWidth)),
      380,
      1500
    );

    const width = Number(config.size && config.size.width) || autoWidth;
    const legendAvailableWidth = Math.max(1, width - yAxisWidth - 28);
    const legendColumnGap = 20;
    const legendColumns = showLegend
      ? (0, __doeFn_clamp)(
          Math.floor(
            (legendAvailableWidth + legendColumnGap) /
              (legendItemWidth + legendColumnGap),
          ),
          1,
          series.length,
        )
      : 1;
    const legendRows = showLegend ? Math.ceil(series.length / legendColumns) : 0;
    const plotHeight = (0, __doeFn_clamp)(260 + scale.ticks.length * 5, 285, 340);
    const titleHeight = config.title ? 56 : 0;
    const subtitleHeight = config.subtitle ? 34 : 0;
    const legendHeight = showLegend ? legendRows * 22 : 0;
    const visibleRows = Number(Boolean(config.subtitle)) + Number(showLegend);
    const sectionGap = 12;
    const gapsHeight = visibleRows * sectionGap;
    const autoHeight =
      titleHeight +
      sectionGap +
      subtitleHeight +
      legendHeight +
      gapsHeight +
      plotHeight +
      12;

    return {
      width,
      height: Number(config.size && config.size.height) || autoHeight,
      yAxisWidth,
      legendColumns,
    };
  }
