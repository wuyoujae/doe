// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5484


export function directTextEditEnabled(node) {
    return node.type === "text" &&
      document.documentElement.dataset.doeDirectTextEdit === "true";
  }
