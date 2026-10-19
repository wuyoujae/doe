import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:4640


export function applyGroupChildVerticalAlignment(
    group,
    shell,
    leaf,
    compositionDirection,
  ) {
    const columns = ["columns", "grid"].includes(group.node.layout.variant);
    const horizontal = columns || compositionDirection === "row";
    const requestedVerticalAlign = ["start", "center", "end"].includes(
      group.node.layout.align,
    )
      ? group.node.layout.align
      : group.node.layout.align === "stretch" && horizontal
        ? "center"
        : null;
    const componentOwnsRowHeight =
      leaf?.definition?.rowSlotMode === "stretch" ||
      (leaf?.definition?.rowSlotMode === "filled-media" &&
        leaf?.element?.dataset?.mediaFit !== "natural");
    if (
      ((0, __doeFn_isCompositionGroup)(group.node) || columns) &&
      horizontal &&
      requestedVerticalAlign &&
      !componentOwnsRowHeight
    ) {
      shell.style.height = "fit-content";
      shell.style.alignSelf = requestedVerticalAlign;
      const trackHeight = group.content.getBoundingClientRect().height;
      const childHeight = shell.getBoundingClientRect().height;
      const resolvedVerticalAlign =
        requestedVerticalAlign !== "start" &&
        trackHeight > 0 &&
        childHeight > trackHeight + 0.5
          ? "start"
          : requestedVerticalAlign;
      shell.style.alignSelf = resolvedVerticalAlign;
      shell.dataset.groupVerticalAlign = resolvedVerticalAlign;
      return;
    }
    if (!shell.dataset.groupVerticalAlign) return;
    delete shell.dataset.groupVerticalAlign;
    if (leaf?.definition?.rowSlotMode === "stretch") {
      shell.style.alignSelf = "stretch";
      shell.style.height = "";
    } else if (leaf?.definition?.alignSelf) {
      shell.style.alignSelf = leaf.definition.alignSelf;
      shell.style.height = "fit-content";
    } else {
      shell.style.removeProperty("align-self");
      shell.style.removeProperty("height");
    }
  }
