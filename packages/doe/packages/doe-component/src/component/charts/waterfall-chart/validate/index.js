// Origin: public/yrkie-doe/components/waterfall-chart/waterfall-chart.js:112


export function validate(config) {
    const items = config?.content?.items;
    if (!Array.isArray(items) || items.length < 2) {
      throw new Error("WaterfallChart: content.items must contain at least two items.");
    }
    items.forEach((item, index) => {
      if (!item || !item.label) {
        throw new Error(`WaterfallChart: item ${index} requires a label.`);
      }
      if (item.type !== "total" && !Number.isFinite(Number(item.value))) {
        throw new Error(`WaterfallChart: item '${item.label}' requires a numeric value.`);
      }
    });
  }
