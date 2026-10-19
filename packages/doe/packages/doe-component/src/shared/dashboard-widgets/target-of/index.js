// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:21


export function targetOf(target, name) {
    const host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error(`${name}: target element was not found.`);
    return host;
  }
