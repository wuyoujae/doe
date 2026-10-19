// Origin: public/yrkie-doe/components/math-formula/math-formula.js:1020


export function estimateEmHeight(node, isTop) {
    if (!node) return 1;
    switch (node.kind) {
      case "root":
      case "seq":
        return node.children.reduce((max, child) => Math.max(max, (0, estimateEmHeight)(child)), 1);
      case "group":
        return (0, estimateEmHeight)(node.body);
      case "script":
        return Math.max(
          node.base ? (0, estimateEmHeight)(node.base) : 0.5,
          node.sup ? (0, estimateEmHeight)(node.sup) * 0.8 : 0,
          node.sub ? (0, estimateEmHeight)(node.sub) * 0.8 : 0,
        ) + (node.sup || node.sub ? 0.35 : 0);
      case "frac":
        return (0, estimateEmHeight)(node.num) * 0.85 + (0, estimateEmHeight)(node.den) * 0.85 + 0.45;
      case "sqrt":
        return (0, estimateEmHeight)(node.radicand) + 0.35;
      case "delim":
        return (0, estimateEmHeight)(node.body);
      case "bigop":
        return 1.2 + (node.upper ? (0, estimateEmHeight)(node.upper) * 0.8 : 0) +
          (node.lower ? (0, estimateEmHeight)(node.lower) * 0.8 : 0);
      case "accent":
        return (0, estimateEmHeight)(node.body) + 0.3;
      case "matrix": {
        const rowCount = node.rows.length;
        const rowHeight = node.rows.reduce((max, row) =>
          Math.max(max, row.reduce((cellMax, cell) => Math.max(cellMax, (0, estimateEmHeight)(cell)), 1)), 1);
        return rowCount * (rowHeight + 0.15) + (node.env === "cases" ? 0.3 : 0);
      }
      case "aligned": {
        return node.rows.reduce((sum, row) =>
          sum + row.reduce((max, cell) => Math.max(max, (0, estimateEmHeight)(cell)), 1) + 0.15, 0);
      }
      case "text":
      case "symbol":
      case "operator":
      case "space":
      case "fixed-delim":
        return 1;
      case "unknown":
        return 1;
      default:
        return 1;
    }
  }
