// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7353


export function typographySpecLabel(spec, fallback = "comfortable") {
    if (typeof spec === "string") return spec;
    return spec?.to || spec?.from || fallback;
  }
