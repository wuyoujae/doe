import { appendAddContentButton } from '../../editor/add-content-item/index.js';
import { appendProcessDirectionControls } from '../../editor/process-direction-controls/index.js';
import { attachItemCollectionEditor } from '../../editor/attach-item-collection-editor/index.js';
import { syncSelectionOutlines } from '../../../../../../../doe-canvas/src/editor/selection-outline/index.js';
import { syncItemSelection } from '../../editor/item-selection/state/index.js';
import { throwIfAborted as __doeFn_throwIfAborted } from "../../../../../../../doe-core/src/runtime/throw-if-aborted/index.js";
import { beginSolverPass as __doeFn_beginSolverPass } from "../../../layout/begin-solver-pass/index.js";
import { renderAndMeasure as __doeFn_renderAndMeasure } from "../render-and-measure/index.js";
import { attemptAutoRepair as __doeFn_attemptAutoRepair } from "../../../layout/attempt-auto-repair/index.js";
import { continuationPlan as __doeFn_continuationPlan } from "../../../layout/continuation-plan/index.js";
import { applyThemeToDom as __doeFn_applyThemeToDom } from "../apply-theme-to-dom/index.js";
import { withRenderBuffer } from '../render-buffer/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:10294


export async function rebuild(state, options = {}) {
  return withRenderBuffer(state, async () => {
    (0, __doeFn_throwIfAborted)(state);
    const solverStartedAt = Date.now();
    (0, __doeFn_beginSolverPass)(state);
    let report = await (0, __doeFn_renderAndMeasure)(state, true);
    (0, __doeFn_throwIfAborted)(state);
    let repairLog = [];
    if (
      options.allowRepair !== false &&
      !state.flowLayout &&
      state.slide.layout.autoRepair !== false &&
      !report.fits
    ) {
      const repaired = await (0, __doeFn_attemptAutoRepair)(state, report);
      (0, __doeFn_throwIfAborted)(state);
      report = repaired.report;
      repairLog = repaired.log;
      report.repairEvaluations = repaired.evaluations;
      report.repairBudgetReached = repaired.budgetReached;
    }
    report.solverMeasurements = state.solverPerformance.measurements;
    report.solverRuns = state.solverPerformance.runs;
    report.solverElapsedMs = Date.now() - solverStartedAt;
    report.autoRepairs = repairLog;
    report.fallback = report.fits
      ? null
      : !state.flowLayout && state.slide.layout.fallback === "needs-continuation"
        ? (0, __doeFn_continuationPlan)(state, report)
        : {
            status: "unsafe",
            reason: "no-safe-layout-candidate",
            destructive: false,
          };
    state.report = report;
    if (state.result) {
      state.result.element = state.slideElement;
      state.result.layoutElement = state.layoutElement;
      state.result.report = report;
      state.result.slide = state.slide;
    }
    (0, __doeFn_applyThemeToDom)(state);
    (0, __doeFn_throwIfAborted)(state);
    for (const record of state.leafRecords) {
      // Some collection adapters recreate their items while negotiating size.
      attachItemCollectionEditor(record.element, record.node, record.definition, state);
      appendAddContentButton(record.element, record.node, state);
      appendProcessDirectionControls(record, state);
    }
    syncItemSelection(state);
    syncSelectionOutlines(state.slideElement);
    state.renderEpoch += 1;
    if (state.result) state.result.renderEpoch = state.renderEpoch;
    return report;
  });
  }
