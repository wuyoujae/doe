import { throwIfAborted as __doeFn_throwIfAborted } from "../../../../../../../doe-core/src/runtime/throw-if-aborted/index.js";
import { findLocation as __doeFn_findLocation } from "../../../../../../../doe-core/src/operation/find-location/index.js";
import { deepClone as __doeFn_deepClone } from "../../../../../../../doe-core/src/runtime/deep-clone/index.js";
import { queueMutation as __doeFn_queueMutation } from "../transaction/queue-mutation/index.js";
import { isAbortError as __doeFn_isAbortError } from "../../../../../../../doe-core/src/runtime/is-abort-error/index.js";
import { notify as __doeFn_notify } from "../../../../../../../doe-core/src/operation/notify/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6155
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function attachIconEditor(root, node, state) {
    const contract = __doeScope.global.DOEIconFields;
    const bridge = __doeScope.global.DOEContentEditor;
    if (!state.slide.editor || !contract || !bridge?.openIcon) return;
    root.dataset.doeIconEditable = "true";
    contract.bind(root, node, true, bridge.labels?.replace);
    const fieldAt = target => contract.fields(root, node).find(field => field.target === target || field.target.contains(target) || field.target.closest(".item-cards__icon")?.contains(target));
    // Delegation survives native adapters replacing their inner SVGs. Prevent
    // pointerdown from starting a collection drag or a surrounding text edit.
    root.addEventListener("pointerdown", event => {
      if (!fieldAt(event.target)) return;
      event.preventDefault(); event.stopPropagation();
    }, true);
    root.addEventListener("dragstart", event => {
      if (!fieldAt(event.target)) return;
      event.preventDefault(); event.stopPropagation();
    }, true);
    async function open(field) {
      try {
        document.activeElement?.blur?.();
        await state.queue;
        (0, __doeFn_throwIfAborted)(state);
        const current = (0, __doeFn_findLocation)(state.slide.blocks, node.id)?.node;
        const record = state.leafRecords.find(item => item.node.id === node.id);
        if (!current || !record) return;
        const target = contract.fields(record.element, current).find(item => JSON.stringify(item.path) === JSON.stringify(field.path))?.target;
        if (!target) return;
        const originalProps = (0, __doeFn_deepClone)(current.props);
        bridge.openIcon({
          type: "icon", props: { icon: "", availableIcons: Object.keys(__doeScope.global.lucide?.icons || __doeScope.global.lucide || {}) }, element: target,
          async apply(draft) {
            if (!draft.icon) return;
            await state.queue;
            (0, __doeFn_throwIfAborted)(state);
            const latest = (0, __doeFn_findLocation)(state.slide.blocks, node.id)?.node;
            if (!latest || JSON.stringify(latest.props) !== JSON.stringify(originalProps)) throw new Error(bridge.labels?.changed || "组件内容已变化");
            const iconName = draft.icon.split("-").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join("");
            if (!__doeScope.global.lucide?.icons?.[iconName] && !__doeScope.global.lucide?.[iconName]) throw new Error("Lucide icon unavailable");
            if (contract.read(latest.props, field.path) === iconName) return;
            await (0, __doeFn_queueMutation)(state, "替换图标", () => {
              contract.write(latest.props, field.path, iconName);
              state.selectedId = node.id;
              return true;
            });
            if (state.report?.rejectedAction === "替换图标") throw new Error(bridge.labels?.overflow || "内容超出当前可用空间");
          },
        });
      } catch (error) {
        if (!(0, __doeFn_isAbortError)(error)) (0, __doeFn_notify)(state, { rejected: true, action: "替换图标", reason: error.message });
      }
    }
    root.addEventListener("click", event => {
      const field = fieldAt(event.target);
      if (!field) return;
      event.preventDefault(); event.stopPropagation(); void open(field);
    }, true);
    root.addEventListener("keydown", event => {
      if (!["Enter", " "].includes(event.key)) return;
      const field = fieldAt(event.target);
      if (!field) return;
      event.preventDefault(); event.stopPropagation(); void open(field);
    }, true);
  }
