// Origin: layout-engine/library-components.js; donut-chart.composition


export function createComposition() {
  return {
      enabled: true,
      family: "data",
      allowedWith: ["narrative", "data", "metric"],
      minWidth: 390,
      preferredWidth: 600,
      weight: 1.08,
      allowMicroText: false,
      shrinkMode: "preserve-chart-labels",
    };
}
