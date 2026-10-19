// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:337


export function validate(config) {
    const content = config && config.content;
    if (!content || !Array.isArray(content.categories)) {
      throw new Error("GroupedBarChart: content.categories must be an array.");
    }
    if (!Array.isArray(content.series) || content.series.length === 0) {
      throw new Error("GroupedBarChart: content.series must contain data.");
    }
    content.series.forEach((series) => {
      if (!Array.isArray(series.data) || series.data.length !== content.categories.length) {
        throw new Error(
          `GroupedBarChart: series '${series.name}' must match categories length.`
        );
      }
    });
  }
