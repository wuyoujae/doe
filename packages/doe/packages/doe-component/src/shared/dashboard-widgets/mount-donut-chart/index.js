import { attachChartInteraction } from '../../chart/tooltip/runtime/index.js';
import { targetOf as __doeFn_targetOf } from '../target-of/index.js';
import { positiveNumber as __doeFn_positiveNumber } from '../positive-number/index.js';
import { setHost as __doeFn_setHost } from '../set-host/index.js';
import { appendHeader as __doeFn_appendHeader } from '../append-header/index.js';
import { headerHeight as __doeFn_headerHeight } from '../header-height/index.js';
import { donutSector as __doeFn_donutSector } from '../donut-sector/index.js';
import { polar as __doeFn_polar } from '../polar/index.js';
import { svgText as __doeFn_svgText } from '../svg-text/index.js';
import { contrastTextColor as __doeFn_contrastTextColor } from '../contrast-text-color/index.js';
import { layoutDonutCenter as __doeFn_layoutDonutCenter } from '../layout-donut-center/index.js';
// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:210
import { scope as __doeScope } from "../runtime/context/index.js";

export function mountDonutChart(target, config) {
    const host = (0, __doeFn_targetOf)(target, "DonutChart");
    const content = config?.content || {};
    const items = content.items;
    if (!Array.isArray(items) || items.length < 2) {
      throw new Error("DonutChart: content.items requires at least two items.");
    }
    const values = items.map((item) => Math.max(0, Number(item.value) || 0));
    const total = values.reduce((sum, value) => sum + value, 0);
    if (!total) throw new Error("DonutChart: at least one value must be greater than zero.");

    const variant = content.variant || "standard";
    const defaultWidth = variant === "hero" ? 620 : variant === "compact" ? 270 : 390;
    const defaultHeight = variant === "hero" ? 560 : variant === "compact" ? 300 : 360;
    const width = (0, __doeFn_positiveNumber)(config.size?.width, defaultWidth);
    const height = (0, __doeFn_positiveNumber)(config.size?.height, defaultHeight);
    const prefix = "ppt-donut-chart";
    (0, __doeFn_setHost)(
      host,
      `${prefix} ${prefix}--${variant}`,
      width,
      height,
      [config.title, content.center?.title, "Donut chart"].filter(Boolean).join(". ")
    );
    (0, __doeFn_appendHeader)(host, config, prefix);

    const header = (0, __doeFn_headerHeight)(config, width);
    const showLegend = content.showLegend ?? (variant === "standard");
    const legendGap = showLegend ? 24 : 0;
    host.style.setProperty("--donut-legend-gap", `${legendGap}px`);
    let legendRows = 0;
    if (showLegend) {
      const legendWidth = Math.max(80, width - 20);
      let occupied = 0;
      items.forEach((item) => {
        const entryWidth = Math.min(
          legendWidth,
          14 + __doeScope.utils.measureText(item.label || "Series", `17px ${__doeScope.FONT_STACK}`),
        );
        const nextWidth = occupied ? occupied + 22 + entryWidth : entryWidth;
        if (!occupied || nextWidth <= legendWidth) {
          occupied = nextWidth;
        } else {
          legendRows += 1;
          occupied = entryWidth;
        }
      });
      if (occupied) legendRows += 1;
    }
    const legendHeight = legendRows ? legendRows * 20 + (legendRows - 1) * 8 + 7 + legendGap : 0;
    const svgHeight = Math.max(72, height - header - legendHeight);
    const svg = __doeScope.utils.svgElement("svg", {
      class: `${prefix}__svg`,
      viewBox: `0 0 ${width} ${svgHeight}`,
      preserveAspectRatio: "xMidYMid meet",
      "aria-hidden": "true",
    });
    svg.style.flexBasis = `${svgHeight}px`;

    const noteReserve = 4;
    const availableHeight = Math.max(40, svgHeight - noteReserve - 8);
    const outerRadius = Math.max(20, Math.min((width - 28) / 2, availableHeight / 2));
    const holeRatio = __doeScope.utils.clamp(
      Number(content.holeRatio) || (variant === "hero" ? 0.42 : variant === "compact" ? 0.34 : 0.5),
      0.18,
      0.72
    );
    const innerRadius = outerRadius * holeRatio;
    const cx = width / 2;
    const cy = Math.max(
      outerRadius + 4,
      Math.min(
        svgHeight - noteReserve - outerRadius - 4,
        (svgHeight - noteReserve) / 2,
      ),
    );
    let angle = Number.isFinite(content.startAngle) ? Number(content.startAngle) : -90;
    svg.dataset.chartHitRing = JSON.stringify([cx, cy, innerRadius, outerRadius, angle]);

    items.forEach((item, index) => {
      const share = values[index] / total;
      const end = angle + share * 360;
      const start = angle;
      const color = __doeScope.DEFAULT_DONUT_COLORS[index % __doeScope.DEFAULT_DONUT_COLORS.length];
      svg.append(
        __doeScope.utils.svgElement("path", {
          class: `${prefix}__segment`,
          d: (0, __doeFn_donutSector)(cx, cy, innerRadius, outerRadius, start, end),
          fill: color,
          stroke: content.separatorColor || __doeScope.SURFACE_COLOR,
          "stroke-width": (0, __doeFn_positiveNumber)(content.separatorWidth, 2),
          "stroke-linejoin": "round",
        })
      );

      const middle = (start + end) / 2;
      const percent = item.percentLabel || `${Math.round(share * 100)}%`;
      if (variant === "hero" || item.badge) {
        const detailPoint = (0, __doeFn_polar)(
          cx,
          cy,
          innerRadius + (outerRadius - innerRadius) * (item.detailRadius || 0.44),
          middle
        );
        const detailY = detailPoint.y + (Number(item.detailDy) || 16);
        if (item.valueLabel !== false) {
          const valueLabel = item.valueLabel ?? __doeScope.utils.formatValue(item.value, content);
          (0, __doeFn_svgText)(svg, {
            x: detailPoint.x + (Number(item.detailDx) || 0),
            y: detailY,
            text: valueLabel,
            className: `${prefix}__segment-value`,
            style: `fill:${(0, __doeFn_contrastTextColor)(color)}`,
          });
        }
      } else if (share >= (content.minimumLabelShare || 0.035) || item.forceLabel) {
        const labelPoint = (0, __doeFn_polar)(cx, cy, (innerRadius + outerRadius) / 2, middle);
        const fontSize = (0, __doeScope.typographyPixelSize)("normal");
        (0, __doeFn_svgText)(svg, {
          x: labelPoint.x,
          y: labelPoint.y + fontSize * 0.34,
          text: percent,
          className: `${prefix}__segment-label`,
          style: `fill:${(0, __doeFn_contrastTextColor)(color)}`,
        });
      }
      angle = end;
    });

    svg.append(
      __doeScope.utils.svgElement("circle", {
        cx,
        cy,
        r: Math.max(1, innerRadius - 1),
        fill: content.centerColor || __doeScope.SURFACE_COLOR,
      })
    );

    host.append(svg);
    (0, __doeFn_layoutDonutCenter)(host, svg, content.center || {}, cx, cy, innerRadius);

    if (showLegend) {
      const legend = __doeScope.utils.element("ul", `${prefix}__legend`);
      legend.setAttribute("aria-label", "Data series");
      items.forEach((item, index) => {
        const entry = __doeScope.utils.element("li", `${prefix}__legend-item`);
        const swatch = __doeScope.utils.element("span", `${prefix}__legend-swatch`);
        swatch.style.background = __doeScope.DEFAULT_DONUT_COLORS[index % __doeScope.DEFAULT_DONUT_COLORS.length];
        entry.append(swatch, document.createTextNode(item.label || `Series ${index + 1}`));
        legend.append(entry);
      });
      host.append(legend);
    }

    attachChartInteraction(host, config, 'donut-chart');

    return { element: host, size: { width, height }, total };
  }
