// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1821


export function isPrimaryHeadingNode(node) {
    return (
      node?.type === "heading" &&
      Math.max(1, Math.min(3, Number(node.props?.level) || 1)) === 1
    );
  }
