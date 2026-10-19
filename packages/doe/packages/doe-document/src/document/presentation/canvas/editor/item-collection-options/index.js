import { element as __doeFn_element } from "../../../../../../../doe-core/src/runtime/element/index.js";
import { queueMutation as __doeFn_queueMutation } from "../transaction/queue-mutation/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5825
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function itemCollectionOptions(node, definition, state) {
    const contract = definition.resolveItemCollection?.(node.props) || definition.itemCollection;
    if (!state.slide.editor || !contract) return null;
    // The content sheet owns data-item controls in Studio. A second toolbar at
    // the same anchor would cover its edit button for fixed-shape collections.
    if (document.documentElement.dataset.doeDirectTextEdit === "true" &&
        __doeScope.global.DOEContentEditor?.supports(node.type)) return null;
    const toolbar = (0, __doeFn_element)("div", "block-toolbar block-toolbar--items");
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute(
      "aria-label",
      contract.toolbarAriaLabel || "更改内部项目布局",
    );
    toolbar.dataset.collectionKey = contract.key || node.type;
    toolbar.append(
      (0, __doeFn_element)(
        "span",
        "block-toolbar__label",
        contract.toolbarLabel || `内部集合 · ${contract.key || node.type}`,
      ),
    );
    if (contract.showLayoutControls === false) return toolbar;
    const layoutProp = contract.layoutProp || "itemLayout";
    const columnsProp = contract.columnsProp || "itemColumns";
    const maximumColumns = Math.max(
      1,
      Math.min(6, Number(contract.maxColumns) || 1),
    );
    const minimumColumns = Math.max(
      1,
      Math.min(maximumColumns, Number(contract.minColumns) || 1),
    );
    const options = [
      { label: "自动", layout: "auto", columns: "auto" },
      ...(minimumColumns === 1
        ? [{ label: "单列", layout: "stack", columns: 1 }]
        : []),
      ...Array.from(
        { length: Math.max(0, maximumColumns - Math.max(2, minimumColumns) + 1) },
        (_, index) => ({
          label: `${index + Math.max(2, minimumColumns)}列`,
          layout: "grid",
          columns: index + Math.max(2, minimumColumns),
        }),
      ),
    ];
    options.forEach((option) => {
      const button = (0, __doeFn_element)("button", "block-toolbar__button", option.label);
      button.type = "button";
      const currentLayout = node.props?.[layoutProp] || "auto";
      const currentColumns = Number(node.props?.[columnsProp]) || maximumColumns;
      button.setAttribute(
        "aria-pressed",
        String(
          currentLayout === option.layout &&
            (option.columns === "auto" || currentColumns === option.columns),
        ),
      );
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        (0, __doeFn_queueMutation)(state, "切换列表项布局", () => {
          node.props[layoutProp] = option.layout;
          if (option.columns !== "auto") node.props[columnsProp] = option.columns;
          if (contract.preferenceProp) node.props[contract.preferenceProp] = option.columns;
          state.selectedId = node.id;
          return true;
        });
      });
      toolbar.append(button);
    });
    return toolbar;
  }
