// Origin: layout-engine/library-components.js; numbered-icon-cards.composition


export function createComposition() {
  return {
      enabled: true,
      family: "data",
      allowedWith: ["narrative", "data"],
      minWidth: 240,
      preferredWidth: 1000,
      weight: 1.18,
      allowMicroText: false,
      shrinkMode: "reflow-numbered-icon-cards",
    };
}
