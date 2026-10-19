import { throwIfAborted as __doeFn_throwIfAborted } from "../../../../../../../../doe-core/src/runtime/throw-if-aborted/index.js";
import { deepClone as __doeFn_deepClone } from "../../../../../../../../doe-core/src/runtime/deep-clone/index.js";
import { rebuild as __doeFn_rebuild } from "../../../renderer/rebuild/index.js";
import { notify as __doeFn_notify } from "../../../../../../../../doe-core/src/operation/notify/index.js";
import { withRenderBuffer, commitRender } from '../../../renderer/render-buffer/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2878
import { scope as __doeScope } from "../../../../runtime/context/index.js";

export function restoreContentsHistory(state, redo) {
    if (state.mode && state.mode !== 'editable') return Promise.reject(new Error('Readonly canvas cannot change history.'));
    state.queue = state.queue.then(() => withRenderBuffer(state, async () => {
      (0, __doeFn_throwIfAborted)(state);
      const from = redo ? state.contentsRedo : state.contentsUndo;
      const entry = from?.at(-1);
      if (!entry) return;
      const expected = redo ? entry.before : entry.after;
      const expectedLayout = redo ? entry.beforeLayout : entry.afterLayout;
      const expectedBackground = redo ? entry.beforeBackground : entry.afterBackground;
      if (JSON.stringify(state.slide.blocks) !== JSON.stringify(expected) || expectedLayout && JSON.stringify(state.slide.layout) !== JSON.stringify(expectedLayout)
        || expectedBackground && (Object.hasOwn(state.slide, 'background') !== expectedBackground.exists || JSON.stringify(state.slide.background) !== JSON.stringify(expectedBackground.value))) {
        state.contentsUndo = []; state.contentsRedo = [];
        __doeScope.global.DOEContentsReplacement?.updateHistory?.(state.result);
        return;
      }
      const snapshot = (0, __doeFn_deepClone)(state.slide);
      const selectedIdSnapshot = state.selectedId;
      const selectedItemSnapshot = state.selectedItem ? { ...state.selectedItem } : null;
      const reportSnapshot = state.report;
      try {
        state.slide.blocks = (0, __doeFn_deepClone)(redo ? entry.after : entry.before);
        if (entry.beforeLayout) state.slide.layout = (0, __doeFn_deepClone)(redo ? entry.afterLayout : entry.beforeLayout);
        const background = redo ? entry.afterBackground : entry.beforeBackground;
        if (background?.exists) state.slide.background = background.value === undefined ? undefined : (0, __doeFn_deepClone)(background.value);
        else if (background) delete state.slide.background;
        state.selectedId = !redo && entry.beforeSelectedId !== undefined ? entry.beforeSelectedId : entry.selectedId;
        const selectedItem = redo ? entry.afterSelectedItem : entry.beforeSelectedItem;
        state.selectedItem = selectedItem ? { ...selectedItem } : null;
        await (0, __doeFn_rebuild)(state, { allowRepair: false });
      } catch (error) {
        state.slide.blocks = snapshot.blocks;
        state.slide.layout = snapshot.layout;
        if (Object.hasOwn(snapshot, 'background')) state.slide.background = snapshot.background;
        else delete state.slide.background;
        state.selectedId = selectedIdSnapshot;
        state.selectedItem = selectedItemSnapshot;
        state.report = state.result.report = reportSnapshot;
        state.result.slide = state.slide;
        if (!state.disposed && !state.signal?.aborted) {
          await (0, __doeFn_rebuild)(state, { allowRepair: false });
          commitRender(state);
        }
        throw error;
      }
      from.pop();
      const to = redo ? (state.contentsUndo ||= []) : (state.contentsRedo ||= []);
      to.push(entry);
      commitRender(state);
      (0, __doeFn_notify)(state, { rejected: false, action: entry.label ? `${redo ? '重做' : '撤销'}${entry.label}` : redo ? "重做 Contents 替换" : "撤销 Contents 替换" });
      __doeScope.global.DOEContentsReplacement?.updateHistory?.(state.result);
    }));
    const operation = state.queue;
    state.queue = operation.catch(() => undefined);
    return operation;
  }
