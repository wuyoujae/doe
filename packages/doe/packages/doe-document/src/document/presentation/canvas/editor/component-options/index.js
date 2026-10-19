import { element as __doeFn_element } from "../../../../../../../doe-core/src/runtime/element/index.js";
import { deepClone as __doeFn_deepClone } from "../../../../../../../doe-core/src/runtime/deep-clone/index.js";
import { throwIfAborted as __doeFn_throwIfAborted } from "../../../../../../../doe-core/src/runtime/throw-if-aborted/index.js";
import { findLocation as __doeFn_findLocation } from "../../../../../../../doe-core/src/operation/find-location/index.js";
import { queueMutation as __doeFn_queueMutation } from "../transaction/queue-mutation/index.js";
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from "../../../layout/is-edge-split-group/index.js";
import { edgeMediaPosition as __doeFn_edgeMediaPosition } from "../../../layout/edge-media-position/index.js";
import { setEdgeMediaPosition as __doeFn_setEdgeMediaPosition } from "../../../layout/set-edge-media-position/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5179
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function componentOptions(node, definition, state) {
    let contentAction;
    const contentEditor = document.documentElement.dataset.doeDirectTextEdit === "true"
      ? __doeScope.global.DOEContentEditor : null;
    if (state.slide.editor && contentEditor?.supports(node.type)) {
      const toolbar = (0, __doeFn_element)("div", "block-toolbar block-toolbar--content");
      toolbar.setAttribute("role", "toolbar");
      toolbar.setAttribute("aria-label", contentEditor.labels?.toolbar || "图表内容");
      const button = (0, __doeFn_element)("button", "block-toolbar__button", ["media", "image-text"].includes(node.type) ? contentEditor.labels?.replace || "替换" : contentEditor.labels?.edit || "编辑内容");
      button.dataset.contentAction = "true";
      button.type = "button";
      button.addEventListener("pointerdown", (event) => event.stopPropagation());
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const originalProps = (0, __doeFn_deepClone)(node.props);
        const component = state.leafRecords.find((record) => record.node.id === node.id)?.element;
        if (!component) return;
        contentEditor.open({
          type: node.type, props: originalProps, element: component,
          async apply(props) {
            await state.queue;
            (0, __doeFn_throwIfAborted)(state);
            const current = (0, __doeFn_findLocation)(state.slide.blocks, node.id)?.node;
            if (!current || JSON.stringify(current.props) !== JSON.stringify(originalProps)) {
              throw new Error(contentEditor.labels?.changed || "组件内容已变化，请关闭面板后重新打开");
            }
            if (JSON.stringify(props) === JSON.stringify(originalProps)) return;
            await (0, __doeFn_queueMutation)(state, "编辑图表内容", () => {
              definition.reconcileContentEdit?.(current, props);
              current.props = (0, __doeFn_deepClone)(props);
              state.selectedId = node.id;
              return true;
            });
            if (state.report?.rejectedAction === "编辑图表内容") {
              throw new Error(contentEditor.labels?.overflow || "内容超出当前图表可用空间，请减少数据或缩短名称后重试");
            }
          },
        });
      });
      toolbar.append(button);
      if (!["media", "image-text"].includes(node.type)) return toolbar;
      contentAction = button;
    }
    const contract = definition.resolveEditorControls?.(node.props) || definition.editorControls;
    if (!state.slide.editor || !contract?.groups?.length) return null;
    const toolbar = (0, __doeFn_element)("div", "block-toolbar block-toolbar--component");
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", `编辑${contract.label || node.type}`);
    toolbar.append(
      (0, __doeFn_element)(
        "span",
        "block-toolbar__label",
        contract.label || node.type,
      ),
    );
    const location =
      node.layout?.region === "media"
        ? (0, __doeFn_findLocation)(state.slide.blocks, node.id)
        : null;
    const edgeGroup =
      location && (0, __doeFn_isEdgeSplitGroup)(location.parentGroup)
        ? location.parentGroup
        : null;
    if (edgeGroup) {
      toolbar.append(
        (0, __doeFn_element)("span", "block-toolbar__group-label", "图片位置"),
      );
      [
        { label: "图片在左", position: "left" },
        { label: "图片在右", position: "right" },
        { label: "图片在上", position: "top" },
        { label: "图片在下", position: "bottom" },
      ].forEach((option) => {
        const button = (0, __doeFn_element)(
          "button",
          "block-toolbar__button",
          option.label,
        );
        button.type = "button";
        button.dataset.edgeMediaPosition = option.position;
        button.setAttribute(
          "aria-pressed",
          String((0, __doeFn_edgeMediaPosition)(edgeGroup) === option.position),
        );
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          if ((0, __doeFn_edgeMediaPosition)(edgeGroup) === option.position) return;
          (0, __doeFn_queueMutation)(state, option.label, () => {
            const changed = (0, __doeFn_setEdgeMediaPosition)(
              state,
              edgeGroup.id,
              option.position,
            );
            if (changed) state.selectedId = node.id;
            return changed;
          });
        });
        toolbar.append(button);
      });
    }
    contract.groups.forEach((group) => {
      if (!group?.prop || !Array.isArray(group.options)) return;
      if (group.label) {
        toolbar.append(
          (0, __doeFn_element)("span", "block-toolbar__group-label", group.label),
        );
      }
      const currentValue = node.props?.[group.prop] ?? group.defaultValue;
      group.options.forEach((option) => {
        const button = (0, __doeFn_element)(
          "button",
          "block-toolbar__button",
          option.label,
        );
        button.type = "button";
        button.setAttribute(
          "aria-pressed",
          String(currentValue === option.value),
        );
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          if (node.props?.[group.prop] === option.value) return;
          (0, __doeFn_queueMutation)(state, `${contract.label || node.type} ${option.label}`, () => {
            node.props[group.prop] = option.value;
            state.selectedId = node.id;
            return true;
          });
        });
        toolbar.append(button);
      });
    });
    if (contentAction) toolbar.append(contentAction);
    return toolbar;
  }
