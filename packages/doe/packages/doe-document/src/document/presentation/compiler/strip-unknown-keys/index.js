// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:131


export function stripUnknownKeys(source, allowed, diagnostics, nodeId, scope) {
    const input = source && typeof source === "object" && !Array.isArray(source)
      ? source
      : {};
    const output = {};
    const ignored = [];
    Object.keys(input).forEach((key) => {
      if (allowed.has(key)) output[key] = input[key];
      else ignored.push(key);
    });
    if (ignored.length) {
      diagnostics.push({
        code: "unknown-properties-ignored",
        level: "repair",
        nodeId: nodeId || null,
        message: `${nodeId || scope} 包含未支持的 ${scope} 属性 ${ignored.join(", ")}，已忽略并继续渲染。`,
      });
    }
    return output;
  }
