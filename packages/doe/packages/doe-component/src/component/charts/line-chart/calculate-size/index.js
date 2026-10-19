// Origin: public/yrkie-doe/components/line-chart/line-chart.js:30
import { scope as __doeScope } from "../runtime/context/index.js";

export function calculateSize(config, scale) {
    const content = config.content;
    const showLegend = config.showLegend !== false;
    const titleWidth = __doeScope.utils.measureText(config.title, `${__doeScope.SEMIBOLD_WEIGHT} 26.667px ${__doeScope.FONT_STACK}`);
    const legendItemWidth = showLegend
      ? Math.max(
          108,
          ...content.series.map(
            (series) => __doeScope.utils.measureText(series.name, `${__doeScope.SEMIBOLD_WEIGHT} 14.667px ${__doeScope.FONT_STACK}`) + 54
          )
        )
      : 0;
    const tickWidth = Math.max(
      48,
      ...scale.ticks.map(
        (tick) =>
          __doeScope.utils.measureText(
            __doeScope.utils.formatValue(tick, content),
            `${__doeScope.NORMAL_FONT_SIZE}px ${__doeScope.FONT_STACK}`
          ) + 18
      )
    );
    const categoryWidth = Math.max(
      76,
      ...content.categories.map(
        (category) =>
          __doeScope.utils.measureText(category, `${__doeScope.NORMAL_FONT_SIZE}px ${__doeScope.FONT_STACK}`) + 30
      )
    );
    const plotDrivenWidth =
      28 + tickWidth + content.categories.length * categoryWidth;
    const textDrivenWidth = Math.max(titleWidth + 40, legendItemWidth + tickWidth + 28);
    const autoWidth = __doeScope.utils.clamp(
      Math.ceil(Math.max(480, plotDrivenWidth, textDrivenWidth)),
      480,
      1100
    );
    const width = Number(config.size?.width) || autoWidth;
    const legendAvailableWidth = Math.max(1, width - tickWidth - 28);
    const legendColumnGap = 22;
    const legendColumns = showLegend
      ? __doeScope.utils.clamp(
          Math.floor(
            (legendAvailableWidth + legendColumnGap) /
              (legendItemWidth + legendColumnGap),
          ),
          1,
          content.series.length,
        )
      : 1;
    const legendRows = showLegend
      ? Math.ceil(content.series.length / legendColumns)
      : 0;
    const plotHeight = __doeScope.utils.clamp(220 + scale.ticks.length * 6, 250, 320);
    const titleHeight = config.title ? 56 : 0;
    const legendHeight = legendRows ? legendRows * 18 + (legendRows - 1) * 8 + 10 : 0;
    const labels = content.series.flatMap(series => series.labels || []);
    const labelTop = labels.length ? Math.max(14, __doeScope.NORMAL_FONT_SIZE * 1.4 + Math.max(0, ...labels.map(label => -(label.dy ?? -9)))) : 14;
    const autoHeight = titleHeight + labelTop + plotHeight + 30 + legendHeight + 12;

    return {
      width,
      height: Number(config.size?.height) || autoHeight,
      plotHeight,
      legendColumns,
      yAxisWidth: Math.ceil(tickWidth),
    };
  }
