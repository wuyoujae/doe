import { groupingCompression } from '../../../../edit/grouping/compression.js';
import { throwIfAborted as __doeFn_throwIfAborted } from "../../../../../../../../doe-core/src/runtime/throw-if-aborted/index.js";
import { deepClone as __doeFn_deepClone } from "../../../../../../../../doe-core/src/runtime/deep-clone/index.js";
import { rebuild as __doeFn_rebuild } from "../../../renderer/rebuild/index.js";
import { notify as __doeFn_notify } from "../../../../../../../../doe-core/src/operation/notify/index.js";
import { reportWorsened as __doeFn_reportWorsened } from "../../../../../../../../doe-core/src/operation/report-worsened/index.js";
import { findLocation as __doeFn_findLocation } from "../../../../../../../../doe-core/src/operation/find-location/index.js";
import { isCompositionGroup as __doeFn_isCompositionGroup } from "../../../../layout/is-composition-group/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2769
import { scope as __doeScope } from "../../../../runtime/context/index.js";
import { compressionChanges } from '../../../../layout/flow/compression/policy.js';
import { reconcileCompression } from '../../../../layout/flow/compression/reconcile.js';
import { replacementFitIssue } from '../../../../../../../../doe-component/src/component/contents/contents/model/replacement-fit/index.js';
import { withRenderBuffer, commitRender } from '../../../renderer/render-buffer/index.js';

export function queueMutation(state, label, mutation, options = {}) {
    if (state.mode && state.mode !== "editable") return Promise.reject(new Error(`Canvas ${state.mode} mode does not allow editing.`));
    state.queue = state.queue.then(() => withRenderBuffer(state, async () => {
      if (options.insertion && (state.disposed || state.signal?.aborted || options.isCurrent?.() === false)) return { accepted: false, errorCode: 'insert-stale' };
      (0, __doeFn_throwIfAborted)(state);
      const snapshot = (0, __doeFn_deepClone)(state.slide.blocks);
      const backgroundSnapshot = { exists: Object.hasOwn(state.slide, 'background'), value: state.slide.background === undefined ? undefined : (0, __doeFn_deepClone)(state.slide.background) };
      const flowLayoutSnapshot = (state.flowLayout || options.grouping || label === "切换为 Contents 样式") ? (0, __doeFn_deepClone)(state.slide.layout) : null;
      const adding = label === "新增内容项" || options.insertion === true;
      const itemEdit = adding || label === "删除内容";
      const layoutSnapshot = itemEdit ? (0, __doeFn_deepClone)(state.slide.layout) : null;
      const selectedIdSnapshot = state.selectedId;
      const selectedItemSnapshot = state.selectedItem ? { ...state.selectedItem } : null;
      const previousReport = state.report ? (0, __doeFn_deepClone)(state.report) : null;
      let report;
      try {
        const changed = mutation();
        if (changed === false) return;
        if (state.flowLayout) {
          if (state.slide.layout.compression) state.slide.layout.compression = options.grouping?.transfers
            ? groupingCompression(state.slide.layout.compression, snapshot, state.slide.blocks, options.grouping.transfers, options.grouping.collapsed)
            : reconcileCompression(state.slide.layout.compression, snapshot, state.slide.blocks);
          state.groupingCompressionIds = options.grouping?.compressionIds || null;
          state.flowChanges = compressionChanges(snapshot, state.slide.blocks);
          state.flowChanged = true;
        }
        report = await (0, __doeFn_rebuild)(state, (options.grouping || adding || label === "切换为 Contents 样式") ? { allowRepair: false } : undefined);
        if (label === '切换为 Contents 样式' && report.fits && replacementFitIssue(report, state.selectedId, previousReport?.compressionPlan)) {
          report = { ...report, fits: false, overflowLabel: '切换后无法完整显示原文，修改未应用。' };
        }
        if (options.insertion && (state.disposed || state.signal?.aborted || options.isCurrent?.() === false)) throw new Error('insert-stale');
      } catch (error) {
        if (label !== "切换为 Contents 样式" && !itemEdit && !state.flowLayout && !options.grouping) throw error;
        state.slide.blocks = snapshot;
        if (backgroundSnapshot.exists) state.slide.background = backgroundSnapshot.value;
        else delete state.slide.background;
        if (flowLayoutSnapshot) { state.slide.layout = flowLayoutSnapshot; state.selectedId = selectedIdSnapshot; }
        state.flowChanges = []; state.flowChanged = false; state.groupingCompressionIds = null;
        if (itemEdit) { state.slide.layout = layoutSnapshot; state.selectedId = selectedIdSnapshot; }
        state.selectedItem = selectedItemSnapshot;
        if (options.insertion && (state.disposed || state.signal?.aborted)) return { accepted: false, errorCode: 'insert-stale' };
        const restored = await (0, __doeFn_rebuild)(state, { allowRepair: false });
        restored.rejectedAction = label;
        state.report = state.result.report = restored;
        commitRender(state);
        (0, __doeFn_notify)(state, { rejected: true, action: label, reason: error.message });
        return options.insertion ? { accepted: false, errorCode: error.message?.startsWith('insert-') ? error.message : 'insert-invalid', reason: error.message } : undefined;
      }
      let resolvedLabel = label;
      const mustRemainSafe = options.grouping ||
        [
          "组成局部组合",
          "直接换轴并换序",
          "直接切换容器方向",
          "移出子组合",
          "组成自适应集合",
          "组合组件",
          "更新布局意图",
        ].includes(label) ||
        label === "组合组件" ||
        label.startsWith("组成") ||
        label.startsWith("拆分") ||
        label.startsWith("组合切换") ||
        label.startsWith("组合比例") ||
        label.startsWith("切换为") ||
        label.startsWith("切换列表项") ||
        label.startsWith("重排列表项") ||
        label.startsWith("文字下限") ||
        label.startsWith("图片在") ||
        label.startsWith("调整贴边媒体") ||
        label === "切换贴边媒体位置" ||
        label === "交换组合内容" ||
        label === "更新组合布局" ||
        label === "移出组合" || itemEdit;
      let rejectUnsafeEdit =
        !report.fits &&
        (options.grouping || state.flowLayout || adding || state.slide.layout.overflowPolicy === "reject-edit" || label === "切换为 Contents 样式") &&
        (state.flowLayout || label === "切换为 Contents 样式" || mustRemainSafe ||
          previousReport?.fits !== false ||
          (0, __doeFn_reportWorsened)(report, previousReport));
      if (rejectUnsafeEdit && label === "组合组件" && !state.flowCompression) {
        const selected = (0, __doeFn_findLocation)(state.slide.blocks, state.selectedId);
        if (selected && (0, __doeFn_isCompositionGroup)(selected.node)) {
          const currentDirection = selected.node.layout.direction;
          const fallbackDirection =
            currentDirection === "stack" ? "row" : "stack";
          selected.node.layout.direction = fallbackDirection;
          selected.node.layout.columns =
            fallbackDirection === "row" ? selected.node.children.length : 1;
          const fallbackReport = await (0, __doeFn_rebuild)(state);
          const fallbackRejected =
            !fallbackReport.fits &&
            (mustRemainSafe ||
              previousReport?.fits !== false ||
              (0, __doeFn_reportWorsened)(fallbackReport, previousReport));
          if (!fallbackRejected) {
            report = fallbackReport;
            rejectUnsafeEdit = false;
            resolvedLabel = `组合组件（自动改为${fallbackDirection === "row" ? "左右" : "上下"}）`;
          }
        }
      }
      if (rejectUnsafeEdit) {
        state.slide.blocks = snapshot;
        if (backgroundSnapshot.exists) state.slide.background = backgroundSnapshot.value;
        else delete state.slide.background;
        if (flowLayoutSnapshot) { state.slide.layout = flowLayoutSnapshot; state.selectedId = selectedIdSnapshot; }
        state.flowChanges = []; state.flowChanged = false; state.groupingCompressionIds = null;
        if (itemEdit) { state.slide.layout = layoutSnapshot; state.selectedId = selectedIdSnapshot; }
        state.selectedItem = selectedItemSnapshot;
        // Rollback must restore the exact pre-edit tree. Running auto-repair
        // here would make a rejected manual operation appear to mutate data.
        const restored = await (0, __doeFn_rebuild)(state, { allowRepair: false });
        restored.rejectedAction = label;
        restored.rejectedReport = report;
        state.report = restored;
        state.result.report = restored;
        const reason = state.flowCompression ? report.overflowLabel : adding ? "空间不足：已尝试自动排版和压缩，无法添加新内容项" : report.minFontViolations
          ? "组合后出现低于当前文字下限的内容"
          : report.minWidthViolations || report.compressionFitViolations
            ? "组合后组件宽度低于安全阈值"
            : "组合后发生溢出或重叠";
        commitRender(state);
        (0, __doeFn_notify)(state, { rejected: true, action: label, reason });
        return options.insertion ? { accepted: false, errorCode: 'insert-overflow', reason } : undefined;
      }

      report.lastAction = resolvedLabel;
      if (state.slide.editor) {
        if (label === "切换为 Contents 样式" || itemEdit || state.flowLayout || options.grouping) {
          state.contentsUndo ||= [];
          state.contentsUndo.push({ before: snapshot, after: (0, __doeFn_deepClone)(state.slide.blocks), selectedId: state.selectedId,
            beforeBackground: backgroundSnapshot, afterBackground: { exists: Object.hasOwn(state.slide, 'background'), value: state.slide.background === undefined ? undefined : (0, __doeFn_deepClone)(state.slide.background) },
            ...((itemEdit || flowLayoutSnapshot) ? { label, beforeLayout: flowLayoutSnapshot || layoutSnapshot, afterLayout: (0, __doeFn_deepClone)(state.slide.layout), beforeSelectedId: selectedIdSnapshot, beforeSelectedItem: selectedItemSnapshot, afterSelectedItem: state.selectedItem ? { ...state.selectedItem } : null } : {}) });
          if (state.contentsUndo.length > 30) state.contentsUndo.shift();
        } else state.contentsUndo = [];
        state.contentsRedo = [];
      }
      state.report = report;
      state.flowChanges = []; state.flowChanged = false; state.groupingCompressionIds = null;
      state.result.report = report;
      state.result.slide = state.slide;
      commitRender(state);
      (0, __doeFn_notify)(state, { rejected: false, action: resolvedLabel });
      __doeScope.global.DOEContentsReplacement?.updateHistory?.(state.result);
      return options.insertion ? { accepted: true, blockId: state.selectedId } : undefined;
    }));
    const operation = state.queue;
    // A failed recovery may surface an error, but must not poison later edits.
    if (options.insertion || label === "切换为 Contents 样式") state.queue = operation.catch(() => undefined);
    return operation;
  }
