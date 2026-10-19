// Origin: layout-engine/components.js; code-block.composition


export function createComposition() {
  return {
      enabled: true,
      family: "data",
      allowedWith: ["narrative", "media", "data"],
      minWidth: 300,
      preferredWidth: 560,
      weight: 1.08,
      shrinkMode: "wrap-code-before-type",
      allowMicroText: false,
    };
}
