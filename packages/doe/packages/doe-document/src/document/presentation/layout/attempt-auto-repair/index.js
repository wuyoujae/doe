import { throwIfAborted as __doeFn_throwIfAborted } from '../../../../../../doe-core/src/runtime/throw-if-aborted/index.js';
import { deepClone as __doeFn_deepClone } from '../../../../../../doe-core/src/runtime/deep-clone/index.js';
import { repairCandidates as __doeFn_repairCandidates } from '../repair-candidates/index.js';
import { collapseDegenerateCompressionGroups as __doeFn_collapseDegenerateCompressionGroups } from '../collapse-degenerate-compression-groups/index.js';
import { reserveSolverBudget as __doeFn_reserveSolverBudget } from '../reserve-solver-budget/index.js';
import { renderAndMeasure as __doeFn_renderAndMeasure } from "../../canvas/renderer/render-and-measure/index.js";
import { normalizeBlock } from '../../schema/normalize-block/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:10183
import { scope as __doeScope } from "../../runtime/context/index.js";

export async function attemptAutoRepair(state, initialReport) {
    let report = initialReport;
    const log = [];
    const maximumPasses = Math.min(4, state.slide.layout.maxRepairPasses || 4);
    const evaluatedFingerprints = new Set([
      JSON.stringify(state.slide.blocks),
    ]);
    let evaluations = 0;
    let budgetReached = false;

    for (let pass = 1; pass <= maximumPasses && !report.fits; pass += 1) {
      (0, __doeFn_throwIfAborted)(state);
      if (evaluations >= __doeScope.SOLVER_LIMITS.repairEvaluations) {
        budgetReached = true;
        break;
      }
      const baselineBlocks = (0, __doeFn_deepClone)(state.slide.blocks);
      const baselineReport = report;
      const candidates = (0, __doeFn_repairCandidates)(state, report);
      if (!candidates.length) break;

      let best = null;
      for (const candidate of candidates) {
        (0, __doeFn_throwIfAborted)(state);
        if (
          evaluations >= __doeScope.SOLVER_LIMITS.repairEvaluations
        ) {
          budgetReached = true;
          break;
        }
        state.slide.blocks = (0, __doeFn_deepClone)(baselineBlocks);
        let changed = false;
        try {
          changed = candidate.apply(state);
        } catch (error) {
          state.runtimeDiagnostics.push({
            code: "repair-candidate-failed",
            level: "error",
            policy: candidate.id,
            message: error.message,
          });
          continue;
        }
        if (changed === false) continue;
        (0, __doeFn_collapseDegenerateCompressionGroups)(state.slide.blocks);
        try {
          // A runtime candidate must remain readable after saving/reopening.
          // Validate the proposal without replacing its nodes or author fields.
          state.slide.blocks.forEach((block, index) => normalizeBlock(block, [index + 1], []));
        } catch (error) {
          state.runtimeDiagnostics.push({ code: "repair-candidate-invalid", level: "error",
            policy: candidate.id, message: error.message });
          continue;
        }
        const fingerprint = JSON.stringify(state.slide.blocks);
        if (evaluatedFingerprints.has(fingerprint)) continue;
        evaluatedFingerprints.add(fingerprint);
        evaluations += 1;
        (0, __doeFn_reserveSolverBudget)(state, __doeScope.SOLVER_LIMITS.measurementsPerRepair,
          __doeScope.SOLVER_LIMITS.elapsedMsPerRepair);
        const candidateReport = await (0, __doeFn_renderAndMeasure)(state, false);
        const weightedScore =
          candidateReport.score + (Number(candidate.cost) || 0) * 250;
        if (
          !best ||
          (candidateReport.fits === best.report.fits && weightedScore < best.weightedScore) ||
          (candidateReport.fits && !best.report.fits)
        ) {
          best = {
            candidate,
            blocks: (0, __doeFn_deepClone)(state.slide.blocks),
            report: candidateReport,
            weightedScore,
          };
        }
        if (candidateReport.fits) break;
      }

      const baselineWeightedScore = baselineReport.score;
      // Restoring either the baseline or the winner is a fresh bounded solve;
      // an exhausted candidate must never force restoration at default density.
      (0, __doeFn_reserveSolverBudget)(state, __doeScope.SOLVER_LIMITS.measurementsPerRebuild,
        __doeScope.SOLVER_LIMITS.elapsedMsPerRebuild);
      if (!best || (!best.report.fits && best.weightedScore + 0.5 >= baselineWeightedScore)) {
        state.slide.blocks = baselineBlocks;
        report = await (0, __doeFn_renderAndMeasure)(state, false);
        break;
      }

      if (JSON.stringify(state.slide.blocks) === JSON.stringify(best.blocks)) {
        // The winning DOM has already passed settled-geometry verification.
        report = best.report;
      } else {
        state.slide.blocks = best.blocks;
        report = await (0, __doeFn_renderAndMeasure)(state, false);
      }
      log.push({
        pass,
        policy: best.candidate.id,
        label: best.candidate.label || best.candidate.id,
        cost: Number(best.candidate.cost) || 0,
        beforeScore: Math.round(baselineReport.score),
        afterScore: Math.round(report.score),
        safe: report.fits,
      });
      if (budgetReached) break;
    }
    return { report, log, evaluations, budgetReached };
  }
