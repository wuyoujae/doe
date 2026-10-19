// Origin: layout-engine/components.js; media.composition


export function createComposition() {
  return {
      enabled: true,
      family: "media",
      allowedWith: ["narrative"],
      minWidth: 300,
      preferredWidth: 560,
      weight: 1.12,
      shrinkMode: "preserve-aspect",
    };
}
