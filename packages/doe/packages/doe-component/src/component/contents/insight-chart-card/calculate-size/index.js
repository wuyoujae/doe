// Origin: public/yrkie-doe/components/insight-chart-card/insight-chart-card.js:8
import { scope as __doeScope } from "../runtime/context/index.js";

export function calculateSize(config, scale) {
    const chart = config.chart;
    const titleWidth = __doeScope.utils.measureText(config.title, "800 26.667px Arial");
    const subtitleWidth = __doeScope.utils.measureText(config.subtitle, "400 24px Arial");
    const categoryWidth = Math.max(
      64,
      ...chart.categories.map(
        (category) =>
          __doeScope.utils.measureText(category, "16px 'Times New Roman'") + 24
      )
    );
    const chartDrivenWidth = 58 + chart.categories.length * categoryWidth;
    const autoWidth = __doeScope.utils.clamp(
      Math.ceil(Math.max(330, chartDrivenWidth, Math.min(titleWidth + 80, 580), subtitleWidth + 30)),
      330,
      580
    );
    const titleAreaWidth = autoWidth - (config.index !== undefined ? 62 : 0);
    const titleLines = config.title
      ? Math.max(1, Math.ceil(titleWidth / Math.max(180, titleAreaWidth)))
      : 0;
    const headerHeight = config.title || config.index !== undefined
      ? Math.max(48, titleLines * 29)
      : 0;
    const subtitleLines = config.subtitle
      ? Math.max(1, Math.ceil(subtitleWidth / Math.max(200, autoWidth - 62)))
      : 0;
    const subtitleHeight = subtitleLines ? subtitleLines * 28 + 22 : 0;
    const chartHeight = chart.type === "bar" ? 285 : 255;
    const autoHeight = headerHeight + subtitleHeight + chartHeight;

    return {
      width: Number(config.size?.width) || autoWidth,
      height: Number(config.size?.height) || autoHeight,
      headerHeight,
      subtitleHeight,
      chartHeight,
    };
  }
