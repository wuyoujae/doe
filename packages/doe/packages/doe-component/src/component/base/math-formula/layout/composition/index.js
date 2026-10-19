// Origin: layout-engine/library-components.js; math-formula.composition


export function createComposition() {
  return {
      enabled: true,
      family: "data",
      allowedWith: ["narrative", "data"],
      minWidth: 380,
      preferredWidth: 620,
      weight: 1.0,
      allowMicroText: false,
      shrinkMode: "preserve-math",
    };
}
