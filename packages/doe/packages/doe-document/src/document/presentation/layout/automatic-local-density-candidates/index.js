import { isLayoutFeatureLocked as __doeFn_isLayoutFeatureLocked } from '../is-layout-feature-locked/index.js';
import { nodeLayoutProfile as __doeFn_nodeLayoutProfile } from '../node-layout-profile/index.js';
import { localTypographyPenalty as __doeFn_localTypographyPenalty } from '../local-typography-penalty/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:4969
import { scope as __doeScope } from "../../runtime/context/index.js";

export function automaticLocalDensityCandidates(
    state,
    globalDensity,
    limit = __doeScope.SOLVER_LIMITS.localTypographyCandidates,
  ) {
    const globalIndex = Math.max(
      0,
      __doeScope.DENSITIES.findIndex((density) => density.id === globalDensity.id),
    );
    const maximumIndex = __doeScope.DENSITIES.length - 2;
    if (globalIndex >= maximumIndex) {
      return [{ densities: new Map(), steps: 0, worstStep: 0 }];
    }
    const records = [];
    const seenIds = new Set();
    const addRecord = (node) => {
      if (!node?.id || seenIds.has(node.id)) return;
      if ((0, __doeFn_isLayoutFeatureLocked)(node, "typography")) return;
      if (node.type === "hero" || (node.type === "heading" && node.props?.level === 1)) {
        return;
      }
      const profile = (0, __doeFn_nodeLayoutProfile)(node);
      if (!profile?.enabled || profile.preserveAspect === true) return;
      seenIds.add(node.id);
      records.push({
        id: node.id,
        penalty: (0, __doeFn_localTypographyPenalty)(node),
        sequence: __doeScope.DENSITIES.slice(globalIndex, maximumIndex + 1).map(
          (density) => density.id,
        ),
      });
    };

    // Top-level siblings are independent typography branches even when the
    // source schema did not wrap them in a composition. This prevents one
    // dense list/card from shrinking an unrelated slide title or KPI block.
    state.slide.blocks.forEach((node) => {
      if ((0, __doeFn_isCompositionGroup)(node)) node.children.forEach(addRecord);
      else addRecord(node);
    });

    // Nested compositions expose their direct children as finer-grained
    // branches. A direct child override wins over an ancestor override.
    state.groupRecords
      .filter((record) => (0, __doeFn_isCompositionGroup)(record.node))
      .forEach((record) => record.node.children.forEach(addRecord));
    if (!records.length) {
      return [{ densities: new Map(), steps: 0, worstStep: 0 }];
    }

    const queue = [Array(records.length).fill(0)];
    const seen = new Set();
    const candidates = [];
    while (queue.length && candidates.length < limit) {
      const indexes = queue.shift();
      const key = indexes.join(":");
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        densities: new Map(
          records
            .map((record, index) => [
              record.id,
              record.sequence[indexes[index]],
              indexes[index],
            ])
            .filter(([, , step]) => step > 0)
            .map(([id, density]) => [id, density]),
        ),
        steps: indexes.reduce((sum, index) => sum + index, 0),
        worstStep: Math.max(0, ...indexes),
        semanticCost: indexes.reduce(
          (sum, step, index) => sum + step * records[index].penalty,
          0,
        ),
      });
      records.forEach((record, index) => {
        if (indexes[index] + 1 >= record.sequence.length) return;
        const next = [...indexes];
        next[index] += 1;
        queue.push(next);
      });
    }
    // Always include synchronized fallbacks. Breadth-first enumeration favors
    // small local edits, but with many branches it may otherwise hit the beam
    // limit before reaching the legal "all branches one step smaller" plan.
    for (let step = 1; step <= maximumIndex - globalIndex; step += 1) {
      const key = Array(records.length).fill(step).join(":");
      if (seen.has(key)) continue;
      candidates.push({
        densities: new Map(
          records.map((record) => [record.id, record.sequence[step]]),
        ),
        steps: step * records.length,
        worstStep: step,
        semanticCost: step * records.reduce(
          (sum, record) => sum + record.penalty,
          0,
        ),
      });
    }
    return candidates;
  }
