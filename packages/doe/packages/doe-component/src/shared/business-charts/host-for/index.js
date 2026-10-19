// Origin: public/yrkie-doe/components/business-charts/business-charts.js:40
import { scope as __doeScope } from "../runtime/context/index.js";

export function hostFor(target, name, className, config, defaults) {
    const host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error(`${name}: target element was not found.`);
    const width = Number(config.size?.width) || defaults.width;
    const height = Number(config.size?.height) || defaults.height;
    host.replaceChildren();
    host.className = className;
    host.style.width = `${width}px`;
    host.style.height = `${height}px`;
    host.setAttribute("role", "img");
    host.setAttribute("aria-label", config.title || name);
    if (config.title) host.append(__doeScope.utils.element("h2", "ppt-business-chart__title", config.title));
    if (config.subtitle) host.append(__doeScope.utils.element("p", "ppt-business-chart__subtitle", config.subtitle));
    const chrome = (config.title ? 36 : 0) + (config.subtitle ? 28 : 0);
    return { host, width, height, svgHeight: height - chrome };
  }
