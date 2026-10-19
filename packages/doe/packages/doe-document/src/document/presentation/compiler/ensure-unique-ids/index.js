import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:713


export function ensureUniqueIds(slide, diagnostics) {
    const seen = new Set();
    let generated = 0;
    function visit(node, path) {
      const base = String(node.id || `${node.type || "block"}-${path.join("-")}`)
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/-+/g, "-") || `block-${++generated}`;
      let candidate = base;
      let suffix = 2;
      while (seen.has(candidate)) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
      }
      if (candidate !== node.id) {
        diagnostics.push({
          code: "id-normalized",
          level: "repair",
          nodeId: node.id || null,
          message: `节点 ID 已规范化为 ${candidate}`,
        });
      }
      node.id = candidate;
      seen.add(candidate);
      if ((0, __doeFn_isGroup)(node)) {
        (node.children || []).forEach((child, index) =>
          visit(child, [...path, index + 1]),
        );
      }
    }
    (slide.blocks || []).forEach((block, index) => visit(block, [index + 1]));
  }
