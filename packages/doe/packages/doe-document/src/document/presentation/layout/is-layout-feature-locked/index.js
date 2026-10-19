// Origin: public/yrkie-doe/layout-engine/layout-engine.js:4730


export function isLayoutFeatureLocked(node, feature) {
    const lock = node?.layout?.lock;
    if (lock === true || lock === "all" || lock === "layout") return true;
    if (lock === feature) return true;
    if (Array.isArray(lock)) return lock.includes(feature) || lock.includes("layout");
    return Boolean(
      lock &&
        typeof lock === "object" &&
        (lock[feature] === true || lock.layout === true),
    );
  }
