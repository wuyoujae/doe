// Origin: layout-engine/library-components.js; grouped-bar-chart.composition


export function createComposition() {
  return {
      enabled: true,
      family: "data",
      allowedWith: ["narrative", "metric"],
      minWidth: 440,
      preferredWidth: 660,
      weight: 1.18,
      shrinkMode: "preserve-chart-labels",
    };
}
