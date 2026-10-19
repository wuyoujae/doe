import { commitFlowPlan } from '../../../layout/flow/compression/commit.js';
import { fontRevision } from '../../../layout/flow/compression/cache.js';
import { layoutDiagnostics } from '../../../layout/flow/compression/diagnostics.js';
import { throwIfAborted as __doeFn_throwIfAborted } from "../../../../../../../doe-core/src/runtime/throw-if-aborted/index.js";
import { buildDom as __doeFn_buildDom } from "../build-dom/index.js";
import { solveLayoutCooperatively } from "../../../layout/flow/compression/cooperative.js";
import { finalizeSemanticWrapping as __doeFn_finalizeSemanticWrapping } from "../finalize-semantic-wrapping/index.js";
import { settledGeometryOverflow as __doeFn_settledGeometryOverflow } from "../../measurement/settled-geometry-overflow/index.js";
import { solverBudgetAvailable as __doeFn_solverBudgetAvailable } from "../../../layout/solver-budget-available/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:9966
import { scope as __doeScope } from "../../../runtime/context/index.js";

export async function renderAndMeasure(state, waitForFonts = false) {
    (0, __doeFn_throwIfAborted)(state);
    (0, __doeFn_buildDom)(state);
    if (waitForFonts && state.waitForFonts && document.fonts?.ready) await document.fonts.ready;
    (0, __doeFn_throwIfAborted)(state);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    (0, __doeFn_throwIfAborted)(state);
    state.deferFlowCommit = true;
    try {
    let fonts = fontRevision();
    let report = await solveLayoutCooperatively(state);

    // Font shaping, semantic wrapping, and decoded media can settle one frame
    // after the winning candidate is applied. Verify the painted geometry once
    // and rerun the bounded solver only when that final geometry drifted.
    for (let pass = 0; pass < 2; pass += 1) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      (0, __doeFn_throwIfAborted)(state);
      // A new glyph subset can make a different direction preferable without
      // creating overflow. A fitting frame is not stable until fonts settle.
      if (document.fonts?.status === 'loading' || fonts !== fontRevision()) {
        await document.fonts?.ready;
        (0, __doeFn_throwIfAborted)(state);
        if (pass === 0 && (0, __doeFn_solverBudgetAvailable)(state)) {
          fonts = fontRevision();
          report = await solveLayoutCooperatively(state);
          continue;
        }
        state.slideElement.dataset.overflow = 'true';
        state.slideElement.dataset.overflowCode = 'font-input-changed';
        state.slideElement.dataset.overflowLabel = '字体仍在变化，排版计划尚未稳定';
        return { ...report, fits: false, overflowLabel: state.slideElement.dataset.overflowLabel,
          diagnostics: [{ code: 'font-input-changed', stage: 'final-paint' }] };
      }
      (0, __doeFn_finalizeSemanticWrapping)(state);
      const settled = (0, __doeFn_settledGeometryOverflow)(state);
      const drifted = state.flowCompression?.version === 'local-v4' ? !settled.fits :
        settled.overflowX > __doeScope.GEOMETRY_ROUNDING_TOLERANCE_PX ||
        settled.overflowY > __doeScope.GEOMETRY_ROUNDING_TOLERANCE_PX;
      if (!drifted || !report.fits) {
        if (!drifted) commitFlowPlan(state, report);
        return report;
      }
      if (pass === 0 && (0, __doeFn_solverBudgetAvailable)(state)) {
        report = await solveLayoutCooperatively(state);
        continue;
      }
      report = {
        ...report,
        ...(state.flowCompression ? { internalPressure: settled.internalPressure, externalPressure: settled.externalPressure } : {}),
        fits: false,
        diagnostics: state.flowCompression ? layoutDiagnostics(state, settled, 'final-paint') : [],
        overflowX: Math.ceil(settled.overflowX),
        overflowY: Math.ceil(settled.overflowY),
        overflowLabel: "内容在最终排版后超出安全区域",
        score: report.score + (settled.overflowX + settled.overflowY) * 10_000,
      };
      state.slideElement.dataset.overflow = "true";
      state.slideElement.dataset.overflowLabel =
        "内容在最终排版后超出安全区域";
      state.slideElement.dataset.overflowCode = "final-paint-overflow";
    }
    return report;
    } finally { state.deferFlowCommit = false; state.pendingFlowPlan = null; }
  }
