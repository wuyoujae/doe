import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { isLayoutFeatureLocked as __doeFn_isLayoutFeatureLocked } from '../is-layout-feature-locked/index.js';
import { nodeLayoutProfile as __doeFn_nodeLayoutProfile } from '../node-layout-profile/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:4815
import { scope as __doeScope } from "../../runtime/context/index.js";

export function automaticCompositionRatioCandidates(
    state,
    limit = __doeScope.SOLVER_LIMITS.structuralCandidates,
  ) {
    const records = state.groupRecords
      .filter(
        (record) =>
          (0, __doeFn_isCompositionGroup)(record.node) &&
          !(0, __doeFn_isLayoutFeatureLocked)(record.node, "structure") &&
          record.node.children.length === 2,
      )
      .map((record) => {
        const current = {
          direction: record.node.layout.direction || "auto",
          ratio: record.node.layout.ratio || "auto",
        };
        const containsType = (node, predicate) =>
          predicate(node?.type) ||
          (node?.type === "layout-group" &&
            node.children.some((child) => containsType(child, predicate)));
        const tableIndex = record.node.children.findIndex((child) =>
          containsType(child, (type) => type === "table"),
        );
        const mediaIndex = record.node.children.findIndex((child) =>
          containsType(child, (type) => type === "media"),
        );
        const narrativeIndex = record.node.children.findIndex((child) => {
          const profile = (0, __doeFn_nodeLayoutProfile)(child);
          return profile?.role === "flow" && profile?.preserveAspect !== true;
        });
        const visualIndex = record.node.children.findIndex((child) =>
          containsType(
            child,
            (type) =>
              typeof type === "string" &&
              (type.endsWith("-chart") ||
                [
                  "risk-matrix",
                ].includes(type)),
          ),
        );
        // A table needs enough horizontal room to preserve semantic atoms and
        // useful row density. A chart can scale its drawing inside the other
        // branch without changing the row geometry, so this mixed pair should
        // start from a content-informed row rather than equal tracks or stack.
        const contentPreferred =
          mediaIndex >= 0 &&
          narrativeIndex >= 0 &&
          mediaIndex !== narrativeIndex
            ? { direction: "row", ratio: "auto" }
            : tableIndex >= 0 && visualIndex >= 0 && tableIndex !== visualIndex
            ? {
                direction: "row",
                ratio: tableIndex === 0 ? [58, 42] : [42, 58],
              }
            : null;
        const fluidRatios = [];
        [48, 45, 42, 40].forEach((percentage) => {
          fluidRatios.push(
            { direction: "row", ratio: [percentage, 100 - percentage] },
            { direction: "row", ratio: [100 - percentage, percentage] },
          );
        });
        const rawSequence = [
          ...(contentPreferred ? [contentPreferred] : []),
          current,
          { direction: "row", ratio: "auto" },
          { direction: "row", ratio: "balanced" },
          // A schema-authored row is a preference unless structure is locked.
          // Try the alternate reading axis before the long tail of fine-grained
          // row ratios. Dense decks commonly have two collection components
          // that become much shorter when each receives the full slide width.
          // Keeping stack near the front also guarantees that it is evaluated
          // inside the bounded structural beam.
          { direction: "stack", ratio: "auto" },
          ...fluidRatios,
          { direction: "row", ratio: "primary-first" },
          { direction: "row", ratio: "primary-second" },
        ];
        const seen = new Set();
        return {
          id: record.node.id,
          sequence: rawSequence.filter((ratio) => {
            const key = JSON.stringify(ratio);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }),
        };
      });
    if (!records.length) return [{ layouts: new Map(), steps: 0 }];

    const queue = [Array(records.length).fill(0)];
    const seen = new Set();
    const candidates = [];
    while (queue.length && candidates.length < limit) {
      const indexes = queue.shift();
      const key = indexes.join(":");
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        layouts: new Map(
          records.map((record, index) => [
            record.id,
            record.sequence[indexes[index]],
          ]),
        ),
        steps: indexes.reduce((sum, index) => sum + index, 0),
      });
      records.forEach((record, index) => {
        if (indexes[index] + 1 >= record.sequence.length) return;
        const next = [...indexes];
        next[index] += 1;
        queue.push(next);
      });
    }
    return candidates;
  }
