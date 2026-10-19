// Origin: public/yrkie-doe/layout-engine/layout-engine.js:4602
import { scope as __doeScope } from "../../runtime/context/index.js";
import { imageSurfaceInsets } from '../../canvas/renderer/image-surface/index.js';

export function adaptLeafWithResolvedItemColumns(record, context) {
    if (!context.flowLayout) {
      const inset = imageSurfaceInsets(record);
      if (inset.x || inset.y) {
        context = { ...context, width: Math.max(0, context.width - inset.x),
          ...(Number.isFinite(context.height) ? { height: Math.max(0, context.height - inset.y) } : {}),
          ...(Number.isFinite(context.availableHeight) ? { availableHeight: Math.max(0, context.availableHeight - inset.y) } : {}) };
        record.element.style.width = `${context.width}px`;
      }
    }
    const contract = record.definition.itemCollection;
    const resolvedColumns = Number(context.autoItemColumns);
    if (!contract || !Number.isFinite(resolvedColumns)) {
      record.definition.adapt?.(record.element, record.node, context);
      __doeScope.global.DOETextFields?.bind(record.element, record.node);
      __doeScope.global.DOEIconFields?.bind(record.element, record.node, record.element.dataset.doeIconEditable === "true", __doeScope.global.DOEContentEditor?.labels?.replace);
      return;
    }

    const layoutProp = contract.layoutProp || "itemLayout";
    const columnsProp = contract.columnsProp || "itemColumns";
    const props = record.node.props || (record.node.props = {});
    const hadLayout = Object.prototype.hasOwnProperty.call(props, layoutProp);
    const hadColumns = Object.prototype.hasOwnProperty.call(props, columnsProp);
    const previousLayout = props[layoutProp];
    const previousColumns = props[columnsProp];
    const requestedLayout = previousLayout || "auto";

    // Existing component adapters already understand their explicit grid
    // modes. During measurement/rendering we lend them the candidate column
    // count, then restore the source schema immediately so solving stays pure.
    if (requestedLayout !== "auto") {
      props[layoutProp] = resolvedColumns === 1 ? "stack" : "grid";
      props[columnsProp] = resolvedColumns;
    }
    try {
      record.definition.adapt?.(record.element, record.node, context);
      __doeScope.global.DOETextFields?.bind(record.element, record.node);
      __doeScope.global.DOEIconFields?.bind(record.element, record.node, record.element.dataset.doeIconEditable === "true", __doeScope.global.DOEContentEditor?.labels?.replace);
    } finally {
      if (hadLayout) props[layoutProp] = previousLayout;
      else delete props[layoutProp];
      if (hadColumns) props[columnsProp] = previousColumns;
      else delete props[columnsProp];
    }
  }
