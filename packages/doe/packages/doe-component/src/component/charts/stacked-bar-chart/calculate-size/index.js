// Origin: public/yrkie-doe/components/stacked-bar-chart/stacked-bar-chart.js:37
import { scope as __doeScope } from "../runtime/context/index.js";

export function calculateSize(config, totals, scale) {
    const content = config.content;
    const categoryWidth = Math.max(
      66,
      ...content.categories.map(
        (category) =>
          __doeScope.utils.measureText(category, `16px ${__doeScope.FONT_STACK}`) + 24
      )
    );
    const legendItemWidth = Math.max(
      0,
      ...content.series.map(
        (series) => __doeScope.utils.measureText(series.name, `14.667px ${__doeScope.FONT_STACK}`) + 40
      )
    );
    const chartDrivenWidth = 42 + content.categories.length * categoryWidth;
    const autoWidth = __doeScope.utils.clamp(
      Math.ceil(
        Math.max(340, chartDrivenWidth, legendItemWidth + 20)
      ),
      340,
      720
    );
    const largestValueWidth = content.showValues === false ? 0 : Math.max(0,
      ...content.series.flatMap((series) => series.data.map((value) =>
        __doeScope.utils.measureText(__doeScope.utils.formatValue(value, content), `${__doeScope.NORMAL_FONT_SIZE}px ${__doeScope.FONT_STACK}`))));
    const width = config.tooltip?.enabled !== false ? Number(config.size?.width) || autoWidth : Math.max(Number(config.size?.width) || autoWidth,
      content.categories.length * (largestValueWidth + 22) + 60);
    const titleWidth = __doeScope.utils.measureText(config.title, `${__doeScope.SEMIBOLD_WEIGHT} 26.667px ${__doeScope.FONT_STACK}`);
    const titleLines = config.title
      ? Math.max(1, Math.ceil(titleWidth / Math.max(250, autoWidth)))
      : 0;
    const titleHeight = titleLines * 30 + (config.title ? 16 : 0);
    const subtitleWidth = __doeScope.utils.measureText(config.subtitle, `${__doeScope.SEMIBOLD_WEIGHT} 24px ${__doeScope.FONT_STACK}`);
    const subtitleLines = config.subtitle
      ? Math.max(1, Math.ceil(subtitleWidth / Math.max(250, autoWidth)))
      : 0;
    const subtitleHeight = subtitleLines * 28 + (config.subtitle ? 10 : 0);
    const legendColumns = config.showLegend === false
      ? 1
      : __doeScope.utils.clamp(
          Math.floor(
            Math.max(1, width - 24 + 22) /
              Math.max(1, legendItemWidth + 22),
          ),
          1,
          content.series.length,
        );
    const legendRows = config.showLegend === false
      ? 0
      : Math.ceil(content.series.length / legendColumns);
    const legendHeight = legendRows
      ? legendRows * 18 + Math.max(0, legendRows - 1) * 8 + 10
      : 0;
    const plotHeight = __doeScope.utils.clamp(
      250 + scale.ticks.length * 5,
      280,
      380
    );
    const autoHeight = titleHeight + subtitleHeight + legendHeight + plotHeight;

    return {
      width,
      height: Number(config.size?.height) || autoHeight,
      plotHeight,
      legendColumns,
      largestValueWidth,
    };
  }
