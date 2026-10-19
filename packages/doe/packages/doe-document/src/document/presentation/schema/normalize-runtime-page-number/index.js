// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6959


export function normalizeRuntimePageNumber(value) {
    const source = value && typeof value === "object" ? value : {};
    const current = Math.max(1, Math.round(Number(source.current) || 1));
    const total = Math.max(current, Math.round(Number(source.total) || current));
    return {
      enabled: source.enabled !== false,
      format: source.format === "fraction" ? "fraction" : "number",
      current,
      total,
    };
  }
