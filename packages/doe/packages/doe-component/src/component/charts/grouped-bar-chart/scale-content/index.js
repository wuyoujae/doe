// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:144


export function scaleContent(content, scaleModel) {
    if (scaleModel.mode !== "series-index") return content;
    return {
      ...content,
      valuePrefix: "",
      valueSuffix: "",
      maxValue: undefined,
      tickInterval: undefined,
      series: scaleModel.plotSeries.map((item) => ({
        ...item,
        data: item.plotData,
      })),
    };
  }
