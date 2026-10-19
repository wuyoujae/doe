import { addLines as __doeFn_addLines } from '../add-lines/index.js';
// Origin: public/yrkie-doe/components/competitive-landscape/competitive-landscape.js:22
import { scope as __doeScope } from "../runtime/context/index.js";

export function mount(target, config) {
    const host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error("CompetitiveLandscape: target element was not found.");
    const content = config?.content;
    if (!content || !Array.isArray(content.bubbles) || !content.bubbles.length) {
      throw new Error("CompetitiveLandscape: content.bubbles is required.");
    }
    const width = Number(config.size?.width) || 680;
    const height = Number(config.size?.height) || 620;
    const titleHeight = config.title ? 44 : 0;
    const svgHeight = height - titleHeight;
    const margin = { left: 55, right: 20, top: 14, bottom: 60 };
    const fieldWidth = width - margin.left - margin.right;
    const fieldHeight = svgHeight - margin.top - margin.bottom;
    const xFor = (value) => margin.left + __doeScope.utils.clamp(value, 0, 1) * fieldWidth;
    const yFor = (value) => margin.top + (1 - __doeScope.utils.clamp(value, 0, 1)) * fieldHeight;

    host.replaceChildren();
    host.className = "ppt-competitive-landscape";
    host.style.width = `${width}px`;
    host.style.height = `${height}px`;
    host.setAttribute("role", "img");
    host.setAttribute("aria-label", config.title || "Competitive landscape");
    if (config.title) {
      host.append(__doeScope.utils.element("h2", "ppt-competitive-landscape__title", config.title));
    }
    const svg = __doeScope.utils.svgElement("svg", {
      class: "ppt-competitive-landscape__svg",
      viewBox: `0 0 ${width} ${svgHeight}`,
      "aria-hidden": "true",
    });
    svg.append(
      __doeScope.utils.svgElement("line", {
        x1: margin.left,
        y1: margin.top,
        x2: margin.left,
        y2: margin.top + fieldHeight,
        class: "ppt-competitive-landscape__axis",
      }),
      __doeScope.utils.svgElement("line", {
        x1: margin.left,
        y1: margin.top + fieldHeight,
        x2: margin.left + fieldWidth,
        y2: margin.top + fieldHeight,
        class: "ppt-competitive-landscape__axis",
      })
    );

    (content.yLevels || []).forEach((level) => {
      const label = __doeScope.utils.svgElement("text", {
        x: margin.left - 20,
        y: yFor(level.y) + 6,
        class: "ppt-competitive-landscape__axis-label",
        "text-anchor": "middle",
      });
      label.textContent = level.label;
      svg.append(label);
    });
    (content.xCategories || []).forEach((category) => {
      const label = __doeScope.utils.svgElement("text", {
        x: xFor(category.x),
        y: margin.top + fieldHeight + 28,
        class: "ppt-competitive-landscape__x-label",
      });
      label.textContent = category.label;
      svg.append(label);
    });
    if (content.xLabel) {
      const axisTitle = __doeScope.utils.svgElement("text", {
        x: margin.left + fieldWidth / 2,
        y: svgHeight - 8,
        class: "ppt-competitive-landscape__x-label",
      });
      axisTitle.textContent = content.xLabel;
      svg.append(axisTitle);
    }

    content.bubbles.forEach((bubble) => {
      const cx = xFor(bubble.x);
      const cy = yFor(bubble.y);
      const rx = Number(bubble.rx) || Number(bubble.radius) || 95;
      const ry = Number(bubble.ry) || Number(bubble.radius) || 95;
      svg.append(
        __doeScope.utils.svgElement("ellipse", {
          cx,
          cy,
          rx,
          ry,
          fill: "var(--yrkie-color-primary)",
          opacity: bubble.opacity ?? 1,
        })
      );
      const textColor = "var(--yrkie-color-on-primary)";
      const titleLines = __doeScope.utils.wrapText(bubble.title || "", rx * 1.55, "800 18px Arial");
      const subtitleLines = bubble.subtitle
        ? __doeScope.utils.wrapText(bubble.subtitle, rx * 1.55, "italic 16px Arial")
        : [];
      const bodyLines = bubble.body
        ? __doeScope.utils.wrapText(bubble.body, rx * 1.55, "italic 14px Arial")
        : [];
      const totalLines = titleLines.length + subtitleLines.length + bodyLines.length;
      let y = cy - ((totalLines - 1) * 18) / 2;
      (0, __doeFn_addLines)(svg, titleLines, cx, y, "ppt-competitive-landscape__bubble-title", 19, textColor);
      y += titleLines.length * 19 + 4;
      if (subtitleLines.length) {
        (0, __doeFn_addLines)(svg, subtitleLines, cx, y, "ppt-competitive-landscape__bubble-subtitle", 18, textColor);
        y += subtitleLines.length * 18 + 3;
      }
      if (bodyLines.length) {
        (0, __doeFn_addLines)(svg, bodyLines, cx, y, "ppt-competitive-landscape__bubble-body", 17, textColor);
      }
    });

    host.append(svg);
    return { element: host, size: { width, height } };
  }
