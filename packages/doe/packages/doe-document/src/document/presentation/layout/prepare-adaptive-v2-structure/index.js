import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { isLayoutFeatureLocked as __doeFn_isLayoutFeatureLocked } from '../is-layout-feature-locked/index.js';
import { supportedCollectionMaximumColumns as __doeFn_supportedCollectionMaximumColumns } from '../supported-collection-maximum-columns/index.js';
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { nodeLayoutProfile as __doeFn_nodeLayoutProfile } from '../node-layout-profile/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:4757
import { scope as __doeScope } from "../../runtime/context/index.js";

export function prepareAdaptiveV2Structure(slide) {
    const changes = [];
    const visit = (node) => {
      if (!node || node.type !== "layout-group") return;
      node.children.forEach(visit);
      if (
        (0, __doeFn_isCollectionGroup)(node) &&
        node.layout?.columns === "auto" &&
        node.layout?.origin !== "explicit" &&
        !(0, __doeFn_isLayoutFeatureLocked)(node, "columns")
      ) {
        const configuredMaximum = Math.max(
          1,
          Number(node.layout.maxColumns) || 1,
        );
        const supportedMaximum = (0, __doeFn_supportedCollectionMaximumColumns)(node);
        if (supportedMaximum > configuredMaximum) {
          node.layout.maxColumns = supportedMaximum;
          changes.push({
            id: node.id,
            action: "restore-auto-column-capability",
            reason: `implicit-auto-can-try-1-through-${supportedMaximum}-columns`,
            from: configuredMaximum,
            to: supportedMaximum,
          });
        }
      }
      if (
        node.layout?.variant !== "row" ||
        node.layout?.origin === "explicit" ||
        (0, __doeFn_isCollectionGroup)(node) ||
        (0, __doeFn_isEdgeSplitGroup)(node) ||
        node.children.length < 2 ||
        node.children.length > __doeScope.MAX_COMPOSITION_ITEMS
      ) {
        return;
      }
      const profiles = node.children.map((child) => (0, __doeFn_nodeLayoutProfile)(child));
      if (profiles.some((profile) => !profile?.enabled)) return;
      const signatures = profiles.map(
        (profile) => `${profile.family || "unknown"}:${profile.role || "flow"}`,
      );
      if (new Set(signatures).size < 2) return;
      node.layout.variant = "composition";
      node.layout.direction = "row";
      node.layout.ratio = "auto";
      node.layout.preset = "adaptive-v2";
      node.layout.intent = node.layout.intent || "implicit-mixed-row";
      changes.push({
        id: node.id,
        action: "promote-row-to-composition",
        reason: "heterogeneous-children-need-negotiated-widths",
      });
    };
    slide.blocks.forEach(visit);
    return changes;
  }
