import { svgText as __doeFn_svgText } from '../svg-text/index.js';
// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:152
import { scope as __doeScope } from "../runtime/context/index.js";

export function layoutDonutCenter(host, svg, center, cx, cy, radius) {
    const group = __doeScope.utils.svgElement("g", { class: "ppt-donut-chart__center" });
    svg.append(group);
    const fields = center.value !== undefined
      ? [["eyebrow", center.eyebrow], ["value", center.value], ["subtitle", center.subtitle]]
      : [["title", center.title]];
    const entries = fields.filter(([, value]) => value !== undefined && value !== null && String(value).length).map(([role, value]) => {
      const node = (0, __doeFn_svgText)(group, { x: cx, y: cy, text: "", className: `ppt-donut-chart__center-${role}` });
      const style = __doeScope.global.getComputedStyle(node);
      return { node, text: Array.isArray(value) ? value.join("\n") : String(value),
        size: parseFloat(style.fontSize), font: `${style.fontWeight} SIZEpx ${style.fontFamily}` };
    });
    if (!entries.length) { host.dataset.diagramFits = "true"; return; }
    const sizes = __doeScope.global.PPTTheme.theme.typography.styles;
    const floor = sizes.small.sizes.compact * 4 / 3;
    const caps = [...new Set([...entries.map(entry => entry.size), ...["h3", "h4", "normal", "small"].flatMap(role =>
      Object.values(sizes[role].sizes).map(pt => pt * 4 / 3))])]
      .filter(size => size >= floor && size <= Math.max(...entries.map(entry => entry.size)))
      .sort((a, b) => b - a);
    const safeRadius = Math.max(1, radius - 6);
    let selected;
    for (const cap of caps) {
      // An inscribed rectangle keeps every line box inside the circle. Try
      // wider/shorter and narrower/taller shapes before reducing typography.
      for (const fraction of [Math.SQRT1_2, 0.8, 0.9, 0.6, 0.5]) {
        const width = safeRadius * 2 * fraction;
        const height = safeRadius * 2 * Math.sqrt(1 - fraction * fraction);
        const rows = entries.map(entry => {
          const size = Math.min(entry.size, cap);
          const lines = __doeScope.utils.wrapText(entry.text, width, entry.font.replace("SIZE", size));
          return { ...entry, size, lines, height: lines.length * size * 1.2 };
        });
        const gap = 4;
        const usedHeight = rows.reduce((sum, row) => sum + row.height, 0) + gap * (rows.length - 1);
        const fits = usedHeight <= height && rows.every(row => row.lines.every(line =>
          __doeScope.utils.measureText(line, row.font.replace("SIZE", row.size)) <= width + 0.1));
        if (!selected || usedHeight < selected.usedHeight) selected = { rows, gap, usedHeight, fits };
        if (fits) { selected = { rows, gap, usedHeight, fits }; break; }
      }
      if (selected.fits) break;
    }
    let top = cy - selected.usedHeight / 2;
    selected.rows.forEach(row => {
      row.node.textContent = "";
      row.node.style.fontSize = `${row.size}px`;
      // Mark local compression explicitly so the shared minimum-font check
      // uses the same small floor instead of the original center-value role.
      row.node.dataset.semanticMinPt = String(sizes.small.sizes.compact);
      row.lines.forEach((line, index) => {
        const span = __doeScope.utils.svgElement("tspan", { x: cx, y: top + row.size * (0.92 + index * 1.2) });
        span.textContent = line; row.node.append(span);
      });
      top += row.height + selected.gap;
    });
    host.dataset.diagramFits = String(selected.fits);
    group.dataset.centerFits = String(selected.fits);
  }
