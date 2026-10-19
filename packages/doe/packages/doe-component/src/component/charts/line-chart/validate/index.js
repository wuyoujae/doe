// Origin: public/yrkie-doe/components/line-chart/line-chart.js:15


export function validate(config) {
    const content = config && config.content;
    if (!content || !Array.isArray(content.categories)) {
      throw new Error("LineChart: content.categories must be an array.");
    }
    if (!Array.isArray(content.series) || !content.series.length) {
      throw new Error("LineChart: content.series must contain data.");
    }
    content.series.forEach((series) => {
      if (!Array.isArray(series.data) || series.data.length !== content.categories.length) {
        throw new Error(`LineChart: series '${series.name}' has invalid data length.`);
      }
    });
  }
