import { allowsMicroDensity as __doeFn_allowsMicroDensity } from '../allows-micro-density/index.js';
import { automaticCompositionRatioCandidates as __doeFn_automaticCompositionRatioCandidates } from '../automatic-composition-ratio-candidates/index.js';
import { solverBudgetAvailable as __doeFn_solverBudgetAvailable } from '../solver-budget-available/index.js';
import { applyCompositionRatioCandidate as __doeFn_applyCompositionRatioCandidate } from '../apply-composition-ratio-candidate/index.js';
import { measureDensity as __doeFn_measureDensity } from "../../canvas/measurement/measure-density/index.js";
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { diversePromisingStructures as __doeFn_diversePromisingStructures } from '../diverse-promising-structures/index.js';
import { compareStructureFirstAttempts as __doeFn_compareStructureFirstAttempts } from '../compare-structure-first-attempts/index.js';
import { automaticLocalDensityCandidates as __doeFn_automaticLocalDensityCandidates } from '../automatic-local-density-candidates/index.js';
import { measureDensityOnce as __doeFn_measureDensityOnce } from "../../canvas/measurement/measure-density-once/index.js";
import { applyDensity as __doeFn_applyDensity } from '../apply-density/index.js';
import { compositionLayoutPlans as __doeFn_compositionLayoutPlans } from '../composition-layout-plans/index.js';
import { isCompressionGroup as __doeFn_isCompressionGroup } from '../is-compression-group/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { edgeMediaPosition as __doeFn_edgeMediaPosition } from '../edge-media-position/index.js';
import { compositionAncestorDepth as __doeFn_compositionAncestorDepth } from '../composition-ancestor-depth/index.js';
import { itemCollectionValues as __doeFn_itemCollectionValues } from '../item-collection-values/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:9478
import { scope as __doeScope } from "../../runtime/context/index.js";

export function solveLayoutWithinBudget(state) {
    // Exhaust typography and spacing before removing the authored timeline structure.
    state.timelineFallbackStage = 0;
    if (state.solverPerformance) state.solverPerformance.runs += 1;
    const candidateDensities = (0, __doeFn_allowsMicroDensity)(state)
      ? __doeScope.DENSITIES
      : __doeScope.DENSITIES.filter((density) => density.id !== "micro");
    // Five coarse structures cover the meaningful reading-axis choices
    // (authored/content-informed row, balanced row, stack, and one small ratio
    // adjustment). Fine-grained ratios are not allowed to starve typography
    // and collection reflow on dense pages.
    const structuralCandidates = (0, __doeFn_automaticCompositionRatioCandidates)(state, 5);
    const attempts = [];
    let winner = null;

    // Density is the outer loop on purpose. Every legal structural candidate
    // at the preferred typography is exhausted before the next, smaller
    // semantic density is even considered.
    for (const density of candidateDensities) {
      const densityAttempts = [];
      let safeAtThisDensity = [];
      for (
        let spacingCompression = density.compression;
        spacingCompression <= 2;
        spacingCompression += 1
      ) {
        const spacingAttempts = [];
        for (const candidate of structuralCandidates) {
          if (!(0, __doeFn_solverBudgetAvailable)(state)) break;
          state.localDensities = new Map();
          state.spacingCompressionOverride = spacingCompression;
          (0, __doeFn_applyCompositionRatioCandidate)(state, candidate);
          const attempt = (0, __doeFn_measureDensity)(state, density, {
            candidateLimit: 1,
          });
          if (!attempt) break;
          attempt.structuralLayouts = new Map(candidate.layouts);
          attempt.structuralFallbackSteps = candidate.steps;
          attempt.spacingCompression = spacingCompression;
          attempt.localDensities = new Map();
          attempt.localTypographySteps = 0;
          attempt.localTypographyWorstStep = 0;
          attempt.localTypographyCost = 0;
          attempt.groupColumns = new Map(
            state.groupRecords
              .filter((record) => (0, __doeFn_isCollectionGroup)(record.node))
              .map((record) => [record.node.id, record.resolvedColumns]),
          );
          spacingAttempts.push(attempt);
        }
        // Only after each structural candidate has had a preferred-layout
        // measurement do we explore collection reflow. Restrict deepening to
        // the best few structures and the first six semantic column plans;
        // this preserves deterministic recovery without reintroducing the
        // long main-thread stalls that the bounded solver was designed to
        // prevent.
        if (
          !spacingAttempts.some((attempt) => attempt.fits) &&
          (0, __doeFn_solverBudgetAvailable)(state)
        ) {
          const promisingStructures = (0, __doeFn_diversePromisingStructures)(
            spacingAttempts,
            2,
          );
          const deepenedAttempts = [];
          for (const structureAttempt of promisingStructures) {
            if (!(0, __doeFn_solverBudgetAvailable)(state)) break;
            (0, __doeFn_applyCompositionRatioCandidate)(state, {
              layouts: structureAttempt.structuralLayouts,
            });
            state.localDensities = new Map();
            state.spacingCompressionOverride = spacingCompression;
            const attempt = (0, __doeFn_measureDensity)(state, density, {
              candidateOffset: 1,
              candidateLimit: 4,
            });
            if (!attempt) continue;
            attempt.structuralLayouts = new Map(
              structureAttempt.structuralLayouts,
            );
            attempt.structuralFallbackSteps =
              structureAttempt.structuralFallbackSteps;
            attempt.spacingCompression = spacingCompression;
            attempt.localDensities = new Map();
            attempt.localTypographySteps = 0;
            attempt.localTypographyWorstStep = 0;
            attempt.localTypographyCost = 0;
            attempt.groupColumns = new Map(
              state.groupRecords
                .filter((record) => (0, __doeFn_isCollectionGroup)(record.node))
                .map((record) => [record.node.id, record.resolvedColumns]),
            );
            deepenedAttempts.push(attempt);
          }
          spacingAttempts.push(...deepenedAttempts);
        }
        densityAttempts.push(...spacingAttempts);
        attempts.push(...spacingAttempts);
        safeAtThisDensity = spacingAttempts
          .filter((attempt) => attempt.fits)
          .sort(__doeFn_compareStructureFirstAttempts);
        if (safeAtThisDensity.length) break;
        if (!(0, __doeFn_solverBudgetAvailable)(state)) break;
      }
      if (
        !safeAtThisDensity.length &&
        density.compression < 2 &&
        (0, __doeFn_solverBudgetAvailable)(state)
      ) {
        const allLocalCandidates = (0, __doeFn_automaticLocalDensityCandidates)(
          state,
          density,
        ).filter((candidate) => candidate.steps > 0);
        // Keep low-cost one-branch reductions, but always reserve space for
        // the synchronized compact/tight fallbacks appended by the generator.
        // Dense sibling collections often need both branches to step down
        // together; breadth-first local edits alone can never reach that plan
        // before the beam limit.
        const localCandidateKeys = new Set();
        const localCandidates = [
          ...allLocalCandidates.slice(0, 4),
          ...allLocalCandidates.slice(-2),
        ].filter((candidate) => {
          const key = JSON.stringify([...candidate.densities].sort());
          if (localCandidateKeys.has(key)) return false;
          localCandidateKeys.add(key);
          return true;
        });
        const promisingStructures = (0, __doeFn_diversePromisingStructures)(
          densityAttempts,
          2,
        );
        const localizedAttempts = [];
        for (const structureAttempt of promisingStructures) {
          if (!(0, __doeFn_solverBudgetAvailable)(state)) break;
          (0, __doeFn_applyCompositionRatioCandidate)(state, {
            layouts: structureAttempt.structuralLayouts,
          });
          for (const localCandidate of localCandidates) {
            if (!(0, __doeFn_solverBudgetAvailable)(state)) break;
            state.localDensities = new Map(localCandidate.densities);
            state.spacingCompressionOverride =
              structureAttempt.spacingCompression;
            const attempt = (0, __doeFn_measureDensity)(state, density, {
              candidateLimit: 2,
            });
            if (!attempt) continue;
            attempt.structuralLayouts = new Map(
              structureAttempt.structuralLayouts,
            );
            attempt.structuralFallbackSteps =
              structureAttempt.structuralFallbackSteps;
            attempt.spacingCompression =
              structureAttempt.spacingCompression;
            attempt.localDensities = new Map(localCandidate.densities);
            attempt.localTypographySteps = localCandidate.steps;
            attempt.localTypographyWorstStep = localCandidate.worstStep;
            attempt.localTypographyCost = localCandidate.semanticCost || 0;
            attempt.groupColumns = new Map(
              state.groupRecords
                .filter((record) => (0, __doeFn_isCollectionGroup)(record.node))
                .map((record) => [record.node.id, record.resolvedColumns]),
            );
            localizedAttempts.push(attempt);
          }
        }
        attempts.push(...localizedAttempts);
        safeAtThisDensity = localizedAttempts
          .filter((attempt) => attempt.fits)
          .sort(__doeFn_compareStructureFirstAttempts);
      }
      if (safeAtThisDensity.length) {
        winner = safeAtThisDensity[0];
        break;
      }
      if (!(0, __doeFn_solverBudgetAvailable)(state)) break;
    }
    if (!winner) {
      winner = [...attempts].sort(__doeFn_compareStructureFirstAttempts)[0];
    }
    // A rebuild always starts with available budget, so this branch is only a
    // defensive fallback for embedding hosts that supply a zero/expired
    // custom budget. Produce one deterministic report instead of throwing.
    if (!winner) {
      const density = candidateDensities[0] || __doeScope.DENSITIES[0];
      const structural = structuralCandidates[0] || {
        layouts: new Map(),
        steps: 0,
      };
      state.localDensities = new Map();
      state.spacingCompressionOverride = density.compression;
      (0, __doeFn_applyCompositionRatioCandidate)(state, structural);
      winner = (0, __doeFn_measureDensityOnce)(state, density);
      winner.structuralLayouts = new Map(structural.layouts || []);
      winner.structuralFallbackSteps = structural.steps || 0;
      winner.spacingCompression = density.compression;
      winner.localDensities = new Map();
      winner.localTypographySteps = 0;
      winner.localTypographyWorstStep = 0;
      winner.localTypographyCost = 0;
      winner.groupColumns = new Map();
    }
    if (!winner.fits && state.solverPerformance?.budgetReached) {
      // Structure search has a time budget, but must not starve the finite
      // typography ladder. Keep both measured reading axes: a stacked layout
      // can remain too tall even when a row becomes viable at the next size.
      // This is at most two measurements per size, with no new branching.
      const bases = (0, __doeFn_diversePromisingStructures)(attempts.length ? attempts : [winner], 2);
      for (const density of candidateDensities.slice(1)) {
        for (const base of bases) {
          (0, __doeFn_applyCompositionRatioCandidate)(state, { layouts: base.structuralLayouts });
          state.localDensities = new Map();
          state.autoItemColumns = new Map(base.autoItemColumns || []);
          state.spacingCompressionOverride = 2;
          const attempt = {
            ...base,
            ...(0, __doeFn_measureDensityOnce)(state, density),
            localDensities: new Map(),
            localTypographySteps: 0,
            localTypographyWorstStep: 0,
            localTypographyCost: 0,
            spacingCompression: 2,
          };
          attempts.push(attempt);
          if (attempt.score < winner.score) winner = attempt;
          if (attempt.fits) {
            winner = attempt;
            break;
          }
        }
        if (winner.fits) break;
      }
    }
    const hasTimeline = state.leafRecords.some(record => record.node.type === "contents" &&
      ["timeline-numbered", "timeline-dots", "timeline-dot-cards", "alternating"].includes(record.node.props.presentation));
    if (!winner.fits && hasTimeline) {
      const bases = (0, __doeFn_diversePromisingStructures)(attempts.length ? attempts : [winner], 2);
      // Finite fallback ladder, including when broad structure search used its budget.
      // Each stage tries the full legal density ladder before advancing to the next.
      for (const stage of [1, 2]) {
        state.timelineFallbackStage = stage;
        for (const density of candidateDensities) {
          for (const base of bases) {
            (0, __doeFn_applyCompositionRatioCandidate)(state, { layouts: base.structuralLayouts });
            state.localDensities = new Map();
            state.autoItemColumns = new Map(base.autoItemColumns || []);
            state.spacingCompressionOverride = 2;
            const attempt = {
              ...base,
              ...(0, __doeFn_measureDensityOnce)(state, density),
              timelineFallbackStage: stage,
              localDensities: new Map(), localTypographySteps: 0,
              localTypographyWorstStep: 0, localTypographyCost: 0, spacingCompression: 2,
            };
            attempts.push(attempt);
            if (attempt.fits || attempt.score < winner.score) winner = attempt;
            if (attempt.fits) break;
          }
          if (winner.fits) break;
        }
        if (winner.fits) break;
      }
    }
    state.timelineFallbackStage = winner.timelineFallbackStage || 0;
    (0, __doeFn_applyCompositionRatioCandidate)(state, {
      layouts: new Map(winner.structuralLayouts || []),
    });
    state.localDensities = new Map(winner.localDensities || []);
    state.spacingCompressionOverride = winner.spacingCompression;
    state.autoItemColumns = new Map(winner.autoItemColumns || []);
    (0, __doeFn_applyDensity)(state, __doeScope.DENSITIES[winner.densityIndex]);
    // Native components can perform a final, synchronous fit pass after the
    // winning structure is restored. Tables, for example, keep their column
    // width but rebound typography into spare row height; charts can also
    // resize their drawing surface to the restored slot. The solver attempt
    // was measured before that final component-local adaptation, so reporting
    // it directly can leave a stale overflow badge even though the rendered
    // slide is now safe. Re-measure the restored winner exactly once and keep
    // its structural/typography plans. This is deliberately synchronous and
    // one-shot, reserved even after search is exhausted: diagnostics must
    // describe the restored component, not an earlier candidate's geometry.
    {
      const finalMeasurement = (0, __doeFn_measureDensityOnce)(
        state,
        __doeScope.DENSITIES[winner.densityIndex],
      );
      winner = {
        ...winner,
        ...finalMeasurement,
        structuralLayouts: winner.structuralLayouts,
        localDensities: winner.localDensities,
        autoItemColumns: winner.autoItemColumns,
        groupColumns: winner.groupColumns,
        spacingCompression: winner.spacingCompression,
        layoutFallbackSteps: winner.layoutFallbackSteps,
        structuralFallbackSteps: winner.structuralFallbackSteps,
        localTypographySteps: winner.localTypographySteps,
        localTypographyWorstStep: winner.localTypographyWorstStep,
        localTypographyCost: winner.localTypographyCost,
        typographyRefinementProgress: winner.typographyRefinementProgress,
      };
    }
    const overflowLabel = winner.fits
      ? ""
      : winner.overflowX > 0 || winner.overflowY > 0
        ? winner.measurementMode === "locked-bleed-region-geometry"
          ? "贴边区域未对齐安全画布"
          : "内容超出安全区域"
        : winner.diagramFitViolations > 0
          ? "图形空间不足，无法安全容纳完整内容"
        : winner.minWidthViolations > 0 ||
            winner.compressionFitViolations > 0
          ? "组件宽度低于安全阈值"
          : winner.semanticWrapViolations > 0
            ? "文字无法在语义边界内安全换行"
          : winner.minFontViolations > 0
            ? "文字低于最小字号"
            : winner.overlaps > 0
              ? "组件发生重叠"
              : "内容无法安全排版";
    const overflowCode = !winner.fits && (winner.overflowX > 0 || winner.overflowY > 0)
      ? winner.measurementMode === "locked-bleed-region-geometry"
        ? "locked-bleed-overflow"
        : "safe-area-overflow"
      : "";
    state.slideElement.dataset.overflow = String(!winner.fits);
    state.slideElement.dataset.overflowLabel = overflowLabel;
    if (overflowCode) state.slideElement.dataset.overflowCode = overflowCode;
    else delete state.slideElement.dataset.overflowCode;
    state.slideElement.dataset.density = winner.density;
    state.slideElement.dataset.solverVersion = __doeScope.ADAPTIVE_SOLVER_VERSION;
    state.slideElement.dataset.solverBudgetReached = String(
      Boolean(state.solverPerformance?.budgetReached),
    );
    state.slideElement.dataset.structuralPlan = JSON.stringify(
      Object.fromEntries(winner.structuralLayouts || []),
    );
    state.slideElement.dataset.layoutAttemptCount = String(attempts.length);
    state.slideElement.dataset.timelineFallbackStage = String(state.timelineFallbackStage);
    if (!winner.fits) {
      const diagnosticAttempts = [...attempts]
        .sort(__doeFn_compareStructureFirstAttempts)
        .slice(0, 16)
        .map((attempt) => ({
          fits: attempt.fits,
          overflowX: attempt.overflowX,
          overflowY: attempt.overflowY,
          minWidthViolations: attempt.minWidthViolations,
          compressionFitViolations: attempt.compressionFitViolations,
          timelineFallbackStage: attempt.timelineFallbackStage || 0,
        density: attempt.density,
          spacingCompression: attempt.spacingCompression,
          layoutFallbackSteps: attempt.layoutFallbackSteps,
          structuralFallbackSteps: attempt.structuralFallbackSteps,
          structure: Object.fromEntries(attempt.structuralLayouts || []),
          columns: Object.fromEntries(attempt.autoItemColumns || []),
        }));
      state.slideElement.dataset.solverAttemptSummary =
        JSON.stringify(diagnosticAttempts);
    } else {
      delete state.slideElement.dataset.solverAttemptSummary;
    }
    const compositions = (0, __doeFn_compositionLayoutPlans)(state);
    return {
      density: winner.density,
      fits: winner.fits,
      overflowX: winner.overflowX,
      overflowY: winner.overflowY,
      overlaps: winner.overlaps,
      minWidthViolations: winner.minWidthViolations,
      compressionFitViolations: winner.compressionFitViolations,
      semanticWrapViolations: winner.semanticWrapViolations,
      componentOverflowX: winner.componentOverflowX,
      componentOverflowY: winner.componentOverflowY,
      minFontViolations: winner.minFontViolations,
      minimumFontPx: winner.minimumFontPx,
      minimumFontPt:
        winner.minimumFontPx === null
          ? null
          : Math.round((winner.minimumFontPx / __doeScope.CSS_PIXELS_PER_POINT) * 100) /
            100,
      measurementMode: winner.measurementMode,
      bleedGeometry: winner.bleedGeometry || null,
      overflowLabel,
      score: winner.score,
      spacing: winner.spacing,
      spacingCompression: winner.spacingCompression || 0,
      layoutFallbackSteps: winner.layoutFallbackSteps || 0,
      structuralFallbackSteps: winner.structuralFallbackSteps || 0,
      structuralPlan: Object.fromEntries(winner.structuralLayouts || []),
      localTypographySteps: winner.localTypographySteps || 0,
      localTypographyCost: winner.localTypographyCost || 0,
      typographyRefinementProgress:
        winner.typographyRefinementProgress ?? null,
      localTypographyPlan: Object.fromEntries(winner.localDensities || []),
      collectionPlan: Object.fromEntries(winner.groupColumns || []),
      solverVersion: __doeScope.ADAPTIVE_SOLVER_VERSION,
      solverBudgetReached: Boolean(state.solverPerformance?.budgetReached),
      canonicalization: state.v2Canonicalization || [],
      compositions,
      groups: state.groupRecords.map((group) => ({
        id: group.node.id,
        variant: group.node.layout.variant,
        compressed: (0, __doeFn_isCompressionGroup)(group.node),
        composition: (0, __doeFn_isCompositionGroup)(group.node),
        collection: (0, __doeFn_isCollectionGroup)(group.node),
        cluster: (0, __doeFn_isLocalCluster)(group.node),
        collectionKey: group.node.layout.collectionKey || null,
        direction: group.resolvedDirection,
        mediaPosition: (0, __doeFn_isEdgeSplitGroup)(group.node)
          ? (0, __doeFn_edgeMediaPosition)(group.node)
          : null,
        depth: (0, __doeFn_compositionAncestorDepth)(state, group.node.id) + 1,
        childCount: group.node.children.length,
        minBodyPt: group.node.layout.textFit?.minBodyPt || __doeScope.MIN_READABLE_FONT_PT,
        ratio: group.resolvedRatio,
        requestedColumns: group.requestedColumns,
        resolvedColumns: group.resolvedColumns,
        gap: group.gap,
        trackWidths: group.trackWidths,
        compressionScales: group.compressionScales,
        compressionFits: group.compressionFits,
        requiredWidth: group.requiredWidth,
      })),
      itemCollections: state.leafRecords
        .filter((record) => record.definition.itemCollection)
        .map((record) => ({
          id: record.node.id,
          key:
            record.definition.itemCollection.key ||
            record.node.type,
          itemCount:
            (0, __doeFn_itemCollectionValues)(record.node, record.definition)?.length || 0,
          layout:
            record.node.props?.[
              record.definition.itemCollection.layoutProp || "itemLayout"
            ] || "auto",
          resolvedColumns: Math.max(
            1,
            Number(
              getComputedStyle(record.element).getPropertyValue(
                "--item-columns",
              ),
            ) || 1,
          ),
        })),
      timelineFallbackStage: state.timelineFallbackStage,
      attemptCount: attempts.length,
      attempts: attempts.slice(0, __doeScope.SOLVER_LIMITS.reportedAttempts).map((attempt) => ({
        timelineFallbackStage: attempt.timelineFallbackStage || 0,
        density: attempt.density,
        fits: attempt.fits,
        overflowX: attempt.overflowX,
        overflowY: attempt.overflowY,
        overlaps: attempt.overlaps,
        minFontViolations: attempt.minFontViolations,
        compressionFitViolations: attempt.compressionFitViolations,
        componentOverflowX: attempt.componentOverflowX,
        componentOverflowY: attempt.componentOverflowY,
        minimumFontPx: attempt.minimumFontPx,
        measurementMode: attempt.measurementMode,
        spacingCompression: attempt.spacingCompression || 0,
        layoutFallbackSteps: attempt.layoutFallbackSteps || 0,
        structuralFallbackSteps: attempt.structuralFallbackSteps || 0,
        structuralPlan: Object.fromEntries(attempt.structuralLayouts || []),
        localTypographySteps: attempt.localTypographySteps || 0,
        localTypographyCost: attempt.localTypographyCost || 0,
        typographyRefinementProgress:
          attempt.typographyRefinementProgress ?? null,
        localTypographyPlan: Object.fromEntries(attempt.localDensities || []),
        collectionPlan: Object.fromEntries(attempt.groupColumns || []),
        score: Math.round(attempt.score),
      })),
    };
  }
