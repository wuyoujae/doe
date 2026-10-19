// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1828


export function isHeadingSupportNode(node) {
    if (node?.type !== "text") return false;
    const text = String(node.props?.text || "").trim();
    if (!text) return false;
    return true;
  }
