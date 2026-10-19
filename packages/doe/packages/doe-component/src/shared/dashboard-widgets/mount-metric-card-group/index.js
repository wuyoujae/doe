import { targetOf as __doeFn_targetOf } from '../target-of/index.js';
import { positiveNumber as __doeFn_positiveNumber } from '../positive-number/index.js';
import { headerHeight as __doeFn_headerHeight } from '../header-height/index.js';
import { setHost as __doeFn_setHost } from '../set-host/index.js';
import { appendHeader as __doeFn_appendHeader } from '../append-header/index.js';
import { iconSvg as __doeFn_iconSvg } from '../icon-svg/index.js';
// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:587
import { scope as __doeScope } from "../runtime/context/index.js";

export function mountMetricCardGroup(target, config) {
    const host = (0, __doeFn_targetOf)(target, "MetricCardGroup");
    const content = config?.content || {};
    const items = content.items;
    if (!Array.isArray(items) || !items.length) {
      throw new Error("MetricCardGroup: content.items is required.");
    }
    const variant = content.variant || "standard";
    const compact = variant === "compact";
    const mosaic = variant === "mosaic";
    const narrative = variant === "narrative";
    const columns = Math.max(1, Math.min(items.length, Number(content.columns) || items.length));
    const rows = Math.ceil(items.length / columns);
    const gap = (0, __doeFn_positiveNumber)(content.gap, mosaic ? 4 : narrative ? 0 : 14);
    const defaultCardWidth = compact ? 250 : narrative ? 380 : mosaic ? 680 : 290;
    const width = (0, __doeFn_positiveNumber)(
      config.size?.width,
      mosaic
        ? defaultCardWidth
        : Math.min(1200, columns * defaultCardWidth + Math.max(0, columns - 1) * gap)
    );
    const header = (0, __doeFn_headerHeight)(config, width);
    const cardHeight = compact ? 118 : narrative ? 300 : mosaic ? 500 : 248;
    const stepHeight = content.steps?.length ? 48 : 0;
    const height = (0, __doeFn_positiveNumber)(
      config.size?.height,
      header + (mosaic ? cardHeight : rows * cardHeight + Math.max(0, rows - 1) * gap) + stepHeight
    );
    const prefix = "ppt-metric-card-group";
    const variantClass = variant === "standard" ? "" : `${prefix}--${variant}`;
    (0, __doeFn_setHost)(
      host,
      `${prefix} ${variantClass}`.trim(),
      width,
      height,
      config.title || "Metric card group"
    );
    (0, __doeFn_appendHeader)(host, config, prefix);
    const cards = __doeScope.utils.element("div", `${prefix}__cards`);
    cards.style.gap = `${gap}px`;
    if (mosaic) {
      const gridColumns = Math.max(2, Number(content.gridColumns) || 10);
      const gridRows = Math.max(2, Number(content.gridRows) || 6);
      cards.style.gridTemplateColumns = `repeat(${gridColumns}, minmax(0, 1fr))`;
      cards.style.gridTemplateRows = `repeat(${gridRows}, minmax(0, 1fr))`;
    } else if (Array.isArray(content.columnRatios) && content.columnRatios.length === columns) {
      cards.style.gridTemplateColumns = content.columnRatios.map((ratio) => `${(0, __doeFn_positiveNumber)(ratio, 1)}fr`).join(" ");
    } else {
      cards.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
    }
    cards.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;

    items.forEach((item, index) => {
      const card = __doeScope.utils.element("article", `${prefix}__card`);
      card.style.background = item.color || (mosaic || narrative
        ? __doeScope.SOFT_SURFACE_COLOR
        : __doeScope.DEFAULT_COLORS[index % __doeScope.DEFAULT_COLORS.length]);
      if (mosaic) {
        const layout = item.layout || {};
        const column = Math.max(1, Number(layout.column) || 1);
        const row = Math.max(1, Number(layout.row) || 1);
        const columnSpan = Math.max(1, Number(layout.columnSpan) || 1);
        const rowSpan = Math.max(1, Number(layout.rowSpan) || 1);
        if (rowSpan === 1) card.classList.add(`${prefix}__card--micro`);
        else if (rowSpan === 2) card.classList.add(`${prefix}__card--small`);
        card.style.gridColumn = `${column} / span ${columnSpan}`;
        card.style.gridRow = `${row} / span ${rowSpan}`;
        card.style.color = item.textColor || __doeScope.BODY_COLOR;
        card.style.setProperty("--mosaic-icon-size", `${(0, __doeFn_positiveNumber)(item.iconSize, rowSpan >= 4 ? 175 : 54)}px`);
        card.append(__doeScope.utils.element("div", `${prefix}__name`, item.label || ""));
        const value = __doeScope.utils.element("div", `${prefix}__metric`);
        const numberNode = __doeScope.utils.element("strong", `${prefix}__number`, String(item.value ?? ""));
        value.append(numberNode, __doeScope.utils.element("span", `${prefix}__unit`, item.unit || ""));
        card.append(value);
        if (item.icon && item.showIcon !== false) card.append((0, __doeFn_iconSvg)(item.icon, `${prefix}__icon`));
        if (item.description) card.append(__doeScope.utils.element("p", `${prefix}__description`, item.description));
      } else if (narrative) {
        card.style.background = item.color || __doeScope.SURFACE_COLOR;
        card.style.color = item.textColor || __doeScope.BODY_COLOR;
        const top = __doeScope.utils.element("div", `${prefix}__top`);
        if (item.icon) top.append((0, __doeFn_iconSvg)(item.icon, `${prefix}__icon`));
        top.append(__doeScope.utils.element("div", `${prefix}__name`, item.label || ""));
        card.append(top);
        if (item.description) card.append(__doeScope.utils.element("p", `${prefix}__description`, item.description));
        const footer = __doeScope.utils.element("div", `${prefix}__narrative-footer`);
        footer.append(__doeScope.utils.element("div", `${prefix}__metric-label`, item.metricLabel || ""));
        const value = __doeScope.utils.element("div", `${prefix}__metric`);
        value.append(
          __doeScope.utils.element("strong", `${prefix}__number`, String(item.value ?? "")),
          __doeScope.utils.element("span", `${prefix}__unit`, item.unit || "")
        );
        footer.append(value);
        card.append(footer);
      } else if (compact) {
        if (item.icon) card.append((0, __doeFn_iconSvg)(item.icon, `${prefix}__icon`));
        const copy = __doeScope.utils.element("div", `${prefix}__copy`);
        copy.append(__doeScope.utils.element("div", `${prefix}__name`, item.label || ""));
        const value = __doeScope.utils.element("div", `${prefix}__metric`);
        value.append(
          __doeScope.utils.element("strong", `${prefix}__number`, String(item.value ?? "")),
          __doeScope.utils.element("span", `${prefix}__unit`, item.unit || "")
        );
        copy.append(value);
        if (item.description) copy.append(__doeScope.utils.element("p", `${prefix}__description`, item.description));
        card.append(copy);
      } else {
        const top = __doeScope.utils.element("div", `${prefix}__top`);
        top.append(__doeScope.utils.element("div", `${prefix}__name`, item.label || ""));
        if (item.icon) top.append((0, __doeFn_iconSvg)(item.icon, `${prefix}__icon`));
        const value = __doeScope.utils.element("div", `${prefix}__metric`);
        const numberNode = __doeScope.utils.element("strong", `${prefix}__number`, String(item.value ?? ""));
        value.append(numberNode, __doeScope.utils.element("span", `${prefix}__unit`, item.unit || ""));
        card.append(top, value);
        if (item.description) card.append(__doeScope.utils.element("p", `${prefix}__description`, item.description));
      }
      cards.append(card);
    });
    host.append(cards);

    if (Array.isArray(content.steps) && content.steps.length) {
      const steps = __doeScope.utils.element("div", `${prefix}__steps`);
      steps.style.gridTemplateColumns = `repeat(${content.steps.length}, minmax(0, 1fr))`;
      content.steps.forEach((step) => steps.append(__doeScope.utils.element("div", `${prefix}__step`, step)));
      host.append(steps);
    }
    return { element: host, size: { width, height } };
  }
