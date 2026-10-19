// Origin: public/yrkie-doe/components/process-diagrams/process-diagrams.js:112


export function targetOf(target, name) {
    const host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error(`${name}: target element was not found.`);
    return host;
  }
