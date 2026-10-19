// Origin: public/yrkie-doe/components/math-formula/math-formula.js:1087


export function resolveTarget(target, name) {
    const host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error(`${name}: target element was not found.`);
    return host;
  }
