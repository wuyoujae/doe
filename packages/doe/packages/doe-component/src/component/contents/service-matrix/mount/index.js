// Origin: public/yrkie-doe/components/service-matrix/service-matrix.js:7
import { scope as __doeScope } from "../runtime/context/index.js";

export function mount(target, config) {
    const host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error("ServiceMatrix: target element was not found.");
    const rows = config?.content?.rows;
    if (!Array.isArray(rows) || !rows.length) {
      throw new Error("ServiceMatrix: content.rows is required.");
    }
    const width = Number(config.size?.width) || 760;
    const height = Number(config.size?.height) || Math.max(360, rows.length * 150 + 40);
    host.replaceChildren();
    host.className = "ppt-service-matrix";
    host.style.width = `${width}px`;
    host.style.height = `${height}px`;
    host.setAttribute("role", "group");
    host.setAttribute("aria-label", config.title || "Service matrix");
    if (config.title) {
      host.append(__doeScope.utils.element("h2", "ppt-service-matrix__title", config.title));
    }
    const list = __doeScope.utils.element("div", "ppt-service-matrix__rows");
    list.style.gridTemplateRows = `repeat(${rows.length}, minmax(0, 1fr))`;
    const fallbackBackgrounds = [
      "linear-gradient(135deg, var(--yrkie-color-primary), var(--yrkie-color-secondary))",
      "linear-gradient(135deg, var(--yrkie-color-dark), var(--yrkie-color-primary))",
      "linear-gradient(135deg, var(--yrkie-color-body), var(--yrkie-color-secondary))",
    ];
    rows.forEach((row, index) => {
      const item = __doeScope.utils.element("article", "ppt-service-matrix__row");
      const visual = __doeScope.utils.element("div", "ppt-service-matrix__visual");
      visual.style.backgroundImage = row.image
        ? `url("${String(row.image).replace(/"/g, "\\\"")}")`
        : fallbackBackgrounds[index % fallbackBackgrounds.length];
      const overlay = __doeScope.utils.element("div", "ppt-service-matrix__overlay");
      overlay.append(
        __doeScope.utils.element("span", "ppt-service-matrix__headline", row.headline || ""),
        __doeScope.utils.element("span", "ppt-service-matrix__description", row.description || "")
      );
      visual.append(overlay);
      item.append(
        __doeScope.utils.element("div", "ppt-service-matrix__label", row.label),
        visual,
        __doeScope.utils.element("div", "ppt-service-matrix__right", row.rightText || "")
      );
      list.append(item);
    });
    host.append(list);
    return { element: host, size: { width, height } };
  }
