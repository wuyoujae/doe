import { attachChartInteraction } from '../../../../shared/chart/tooltip/runtime/index.js';
import { calculateSize as __doeFn_calculateSize } from '../calculate-size/index.js';
import { appendMultilineText as __doeFn_appendMultilineText } from '../append-multiline-text/index.js';
// Origin: public/yrkie-doe/components/risk-matrix/risk-matrix.js:52
import { scope as __doeScope } from "../runtime/context/index.js";

export function mount(target, config) {
    const host = typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error("RiskMatrix: target element was not found.");
    if (!config?.content?.items?.length) {
      throw new Error("RiskMatrix: content.items must contain data.");
    }

    __doeScope.instanceCount += 1;
    const size = (0, __doeFn_calculateSize)(config);
    const svgHeight = size.height - size.headerHeight;
    const margin = { top: 8, right: 14, bottom: 56, left: 66 };
    const plot = {
      x: margin.left,
      y: margin.top,
      width: Math.max(180, size.width - margin.left - margin.right),
      height: Math.max(180, svgHeight - margin.top - margin.bottom),
    };
    const mapX = (value) => plot.x + value * plot.width;
    const mapY = (value) => plot.y + (1 - value) * plot.height;
    const clipId = `risk-matrix-clip-${__doeScope.instanceCount}`;
    const arrowId = `risk-matrix-arrow-${__doeScope.instanceCount}`;

    host.replaceChildren();
    host.classList.add("ppt-risk-matrix");
    host.style.width = `${size.width}px`;
    host.style.height = `${size.height}px`;
    host.setAttribute("role", "img");
    host.setAttribute(
      "aria-label",
      [config.title, config.subtitle, "Risk matrix"].filter(Boolean).join(". ")
    );

    if (config.title) {
      host.append(__doeScope.utils.element("h2", "ppt-risk-matrix__title", config.title));
    }
    if (config.subtitle) {
      host.append(
        __doeScope.utils.element("h3", "ppt-risk-matrix__subtitle", config.subtitle)
      );
    }

    const svg = __doeScope.utils.svgElement("svg", {
      class: "ppt-risk-matrix__svg",
      viewBox: `0 0 ${size.width} ${svgHeight}`,
      preserveAspectRatio: "xMidYMid meet",
      "aria-hidden": "true",
    });
    const defs = __doeScope.utils.svgElement("defs");
    const clipPath = __doeScope.utils.svgElement("clipPath", { id: clipId });
    clipPath.append(
      __doeScope.utils.svgElement("rect", {
        x: plot.x,
        y: plot.y,
        width: plot.width,
        height: plot.height,
        rx: 8,
        ry: 8,
      })
    );
    const marker = __doeScope.utils.svgElement("marker", {
      id: arrowId,
      markerWidth: 8,
      markerHeight: 8,
      refX: 6,
      refY: 3,
      orient: "auto",
      markerUnits: "strokeWidth",
    });
    marker.append(__doeScope.utils.svgElement("path", { d: "M0,0 L0,6 L6,3 z", fill: __doeScope.AXIS_COLOR }));
    defs.append(clipPath, marker);
    svg.append(defs);

    const bandGroup = __doeScope.utils.svgElement("g", { "clip-path": `url(#${clipId})` });
    const bandColors = __doeScope.DEFAULT_BAND_COLORS;
    const radii = [1.0, 0.75, 0.5];
    radii.forEach((radius, index) => {
      bandGroup.append(
        __doeScope.utils.svgElement("ellipse", {
          cx: plot.x + plot.width,
          cy: plot.y,
          rx: plot.width * radius,
          ry: plot.height * radius,
          fill: bandColors[index],
        })
      );
    });
    svg.append(bandGroup);

    const zone = config.content.priorityZone;
    if (zone) {
      const zoneX = mapX(zone.x);
      const zoneY = mapY(zone.y + zone.height);
      const zoneWidth = zone.width * plot.width;
      const zoneHeight = zone.height * plot.height;
      svg.append(
        __doeScope.utils.svgElement("rect", {
          x: zoneX,
          y: zoneY,
          width: zoneWidth,
          height: zoneHeight,
          class: "ppt-risk-matrix__priority-zone",
        })
      );
      const labelLines = zone.labelLines || [zone.label || "Prioritized", "Risks"];
      (0, __doeFn_appendMultilineText)(
        svg,
        labelLines,
        zoneX + zoneWidth / 2,
        zoneY + 38,
        26,
        "ppt-risk-matrix__priority-label"
      );
    }

    config.content.items.forEach((item) => {
      const x = mapX(item.x);
      const y = mapY(item.y);
      svg.append(
        __doeScope.utils.svgElement("circle", {
          cx: x,
          cy: y,
          r: item.radius || 18,
          class: "ppt-risk-matrix__node",
          style: `fill: ${__doeScope.NODE_COLOR}`,
        })
      );
      const label = __doeScope.utils.svgElement("text", {
        x,
        y: y + 6,
        class: "ppt-risk-matrix__node-label",
      });
      label.textContent = item.label;
      svg.append(label);
    });

    svg.append(
      __doeScope.utils.svgElement("rect", {
        x: plot.x,
        y: plot.y,
        width: plot.width,
        height: plot.height,
        rx: 8,
        ry: 8,
        class: "ppt-risk-matrix__plot-border",
      }),
      __doeScope.utils.svgElement("line", {
        x1: plot.x,
        y1: plot.y + plot.height + 18,
        x2: plot.x + plot.width + 6,
        y2: plot.y + plot.height + 18,
        class: "ppt-risk-matrix__axis",
        "marker-end": `url(#${arrowId})`,
      }),
      __doeScope.utils.svgElement("line", {
        x1: plot.x - 20,
        y1: plot.y + plot.height + 8,
        x2: plot.x - 20,
        y2: plot.y + 4,
        class: "ppt-risk-matrix__axis",
        "marker-end": `url(#${arrowId})`,
      })
    );

    const xLabel = __doeScope.utils.svgElement("text", {
      x: plot.x + plot.width / 2,
      y: plot.y + plot.height + 48,
      class: "ppt-risk-matrix__axis-label",
      "text-anchor": "middle",
    });
    xLabel.textContent = config.content.xLabel || "Impact";
    const yLabel = __doeScope.utils.svgElement("text", {
      x: plot.x - 48,
      y: plot.y + plot.height / 2,
      class: "ppt-risk-matrix__axis-label",
      "text-anchor": "middle",
      transform: `rotate(-90 ${plot.x - 48} ${plot.y + plot.height / 2})`,
    });
    yLabel.textContent = config.content.yLabel || "Likelihood";
    svg.append(xLabel, yLabel);
    host.append(svg);

    attachChartInteraction(host, config, 'risk-matrix');

    return { element: host, size: { width: size.width, height: size.height } };
  }
