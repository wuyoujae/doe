// Origin: layout-engine/library-components.js; capability-cards.composition


export function createComposition() {
  return {
      enabled: true,
      family: "data",
      allowedWith: ["narrative", "data"],
      minWidth: 240,
      preferredWidth: 720,
      weight: 1.05,
      allowMicroText: false,
      shrinkMode: "reflow-capability-items",
    };
}
