import { element as __doeFn_element } from "../../../../../../../doe-core/src/runtime/element/index.js";
import { throwIfAborted as __doeFn_throwIfAborted } from "../../../../../../../doe-core/src/runtime/throw-if-aborted/index.js";
import { deepClone as __doeFn_deepClone } from "../../../../../../../doe-core/src/runtime/deep-clone/index.js";
import { queueMutation as __doeFn_queueMutation } from "../transaction/queue-mutation/index.js";
import { findLocation as __doeFn_findLocation } from "../../../../../../../doe-core/src/operation/find-location/index.js";
import { normalizeBlock as __doeFn_normalizeBlock } from "../../../schema/normalize-block/index.js";
import { planContentsReplacement } from '../../../edit/contents-replacement/width-memory.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5129
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function contentsReplacementButton(node, state) {
    const bridge = __doeScope.global.DOEContentsReplacement;
    if (!state.slide.editor || !bridge?.supports(node)) return null;
    const button = (0, __doeFn_element)("button", "block-toolbar__button", "更换样式");
    button.type = "button";
    button.dataset.contentsReplace = "true";
    const resolvedColumns = () => {
      const root = state.leafRecords.find(record => record.node.id === node.id)?.element;
      return Number(root?.dataset.columns) || Number(root && getComputedStyle(root).getPropertyValue('--item-columns')) || undefined;
    };
    button.addEventListener("pointerdown", event => event.stopPropagation());
    button.addEventListener("click", event => {
      event.stopPropagation();
      bridge.open({
        anchor: button,
        nodeId: node.id,
        result: state.result,
        resolvedColumns,
        options: { theme: state.theme, pageNumber: state.pageNumber },
        async snapshot() {
          await state.result.flushPendingEdits();
          (0, __doeFn_throwIfAborted)(state);
          return { slide: (0, __doeFn_deepClone)(state.slide) };
        },
        prepare(next, expected) {
          return { slide: planContentsReplacement(expected.slide, node.id, next) };
        },
        subscribe(callback) {
          state.host.addEventListener("slideengine:change", callback);
          return () => state.host.removeEventListener("slideengine:change", callback);
        },
        async apply(next, expected) {
          await state.result.flushPendingEdits();
          (0, __doeFn_throwIfAborted)(state);
          let stale = false;
          await (0, __doeFn_queueMutation)(state, "切换为 Contents 样式", () => {
            const current = (0, __doeFn_findLocation)(state.slide.blocks, node.id)?.node;
            if (!current || JSON.stringify(state.slide) !== JSON.stringify(expected.slide) || !bridge.canApply(current, next, resolvedColumns())) {
              stale = true; return false;
            }
            const planned = planContentsReplacement(state.slide, node.id, next);
            const target = (0, __doeFn_findLocation)(planned.blocks, node.id).node;
            const normalized = (0, __doeFn_normalizeBlock)(target, [0], []);
            Object.keys(target).forEach(key => delete target[key]);
            Object.assign(target, normalized);
            state.slide.blocks = planned.blocks;
            state.slide.layout = planned.layout;
            if (Object.hasOwn(planned, 'background')) state.slide.background = planned.background;
            else delete state.slide.background;
            state.selectedId = node.id;
            return true;
          });
          if (stale) throw new Error("内容已变化，请重新选择样式。");
          if (state.report?.rejectedAction === "切换为 Contents 样式") throw new Error("空间不足，无法完整显示内容，修改未应用。");
        },
      });
    });
    return button;
  }
