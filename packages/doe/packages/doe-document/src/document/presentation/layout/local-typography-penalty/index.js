// Origin: public/yrkie-doe/layout-engine/layout-engine.js:4949


export function localTypographyPenalty(node) {
    if (!node) return 1;
    if (node.type === "layout-group") {
      return Math.max(
        1,
        (node.children || []).reduce(
          (sum, child) => sum + (0, localTypographyPenalty)(child),
          0,
        ),
      );
    }
    if (node.type === "heading" || node.type === "hero") return 12;
    if (["text", "list", "ordered-list", "todo-list", "notice", "quote", "question-card"].includes(node.type)) {
      return 6;
    }
    if (node.type === "stat") return 5;
    if (node.type === "code-block" || node.type === "table") return 2;
    return 3;
  }
