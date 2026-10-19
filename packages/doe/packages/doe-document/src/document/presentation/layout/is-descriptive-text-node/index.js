// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8088


export function isDescriptiveTextNode(node) {
    if (!(node instanceof Element)) return false;
    const semantic = `${node.tagName} ${node.className || ""}`.toLowerCase();
    return /figcaption|description|caption|source|note|footnote|meta|legend|detail|eyebrow|subtitle|footer/.test(semantic);
  }
