// Origin: layout-engine/library-components.js; table.composition


export function createComposition() {
  return {
      enabled: true,
      family: "data",
      allowedWith: ["narrative", "data"],
      minWidth: 480,
      preferredWidth: 840,
      weight: 1.16,
      allowMicroText: false,
      shrinkMode: "wrap-table-cells",
    };
}
