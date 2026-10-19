import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
import { childPlanningWidths as __doeFn_childPlanningWidths } from '../child-planning-widths/index.js';
import { isComposition as __doeFn_isComposition } from '../is-composition/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
import { directionOf as __doeFn_directionOf } from '../direction-of/index.js';
import { summarize as __doeFn_summarize } from '../summarize/index.js';
import { collectionMembershipKey as __doeFn_collectionMembershipKey } from '../collection-membership-key/index.js';
import { collectionContractFor as __doeFn_collectionContractFor } from '../collection-contract-for/index.js';
import { collectionKeyFor as __doeFn_collectionKeyFor } from '../collection-key-for/index.js';
import { container as __doeFn_container } from '../container/index.js';
import { collection as __doeFn_collection } from '../collection/index.js';
import { roleRank as __doeFn_roleRank } from '../role-rank/index.js';
import { planningGap as __doeFn_planningGap } from '../planning-gap/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1289
import { scope as __doeScope } from "../runtime/context/index.js";

export function autoPlanNode(node, diagnostics, innerWidth) {
    if (!(0, __doeFn_isGroup)(node)) return node;
    const plannedWidths = (0, __doeFn_childPlanningWidths)(node, innerWidth);
    node.children = (node.children || []).map((child, index) =>
      (0, autoPlanNode)(child, diagnostics, plannedWidths[index] || innerWidth),
    );
    if (!(0, __doeFn_isComposition)(node)) return node;
    if (
      (0, __doeFn_isLocalCluster)(node) &&
      (node.layout?.origin === "explicit" || node.layout?.keepGroup === true)
    ) {
      return node;
    }

    const shouldPlan =
      (0, __doeFn_directionOf)(node) === "auto" ||
      node.layout?.intent ||
      node.layout?.autoPlan === true;
    if (!shouldPlan || node.layout?.lock === "structure") return node;

    // `auto` is an authoring hint, not a renderer variant. Resolve it to the
    // generic composition container before the core engine normalizes nodes.
    // This keeps AI-authored schemas declarative without adding a new hardcoded
    // component or DOM path.
    node.layout.variant = "composition";

    const entries = node.children.map((child, index) => ({
      child,
      index,
      summary: (0, __doeFn_summarize)(child),
    }));
    const entryCollectionKeys = entries.map((entry) =>
      (0, __doeFn_collectionMembershipKey)(entry.child),
    );
    const sameLeafType =
      entries.length >= 2 &&
      entryCollectionKeys.every(Boolean) &&
      new Set(entryCollectionKeys).size === 1;
    if (sameLeafType && !(0, __doeFn_isLocalCluster)(node)) {
      const collectionContract = (0, __doeFn_collectionContractFor)(entries[0].child) || {};
      const gap = __doeScope.engine.SPACING_TOKENS["18pt"];
      const minimum = Math.max(
        1,
        ...entries.map((entry) => entry.summary.minWidth),
      );
      const feasibleColumns = Math.max(
        1,
        Math.floor((innerWidth + gap) / (minimum + gap)),
      );
      node.layout.variant = "auto-grid";
      node.layout.direction = "row";
      node.layout.columns = "auto";
      node.layout.maxColumns = Math.max(
        1,
        Math.min(
          6,
          entries.length,
          feasibleColumns,
          Number(collectionContract.maxColumns) || 4,
        ),
      );
      node.layout.maxItems = Math.max(
        2,
        Math.min(
          __doeScope.MAX_COLLECTION_ITEMS,
          Number(collectionContract.maxItems) || __doeScope.MAX_COLLECTION_ITEMS,
        ),
      );
      node.layout.collectionKey = (0, __doeFn_collectionKeyFor)(entries[0].child);
      node.layout.origin = node.layout.origin || "implicit";
      node.kind = "collection";
      diagnostics.push({
        code: "same-type-collection-planned",
        level: "plan",
        nodeId: node.id,
        message: `${node.id} 已规划为同类型可换序集合`,
      });
      return node;
    }
    const flowEntries = entries.filter(
      (entry) => entry.summary.role === "flow",
    );
    const compactEntries = entries.filter(
      (entry) => entry.summary.role === "compact",
    );
    const flowCompactRemainder = entries.filter(
      (entry) => !["flow", "compact"].includes(entry.summary.role),
    );
    if (
      flowEntries.length >= 1 &&
      compactEntries.length >= 2 &&
      flowCompactRemainder.length === 0
    ) {
      const orderedFlow = [...flowEntries].sort((a, b) => a.index - b.index);
      const orderedCompact = [...compactEntries].sort(
        (a, b) => a.index - b.index,
      );
      const flowNode =
        orderedFlow.length === 1
          ? orderedFlow[0].child
          : (0, __doeFn_container)(
              `${node.id}-narrative-stack`,
              "stack",
              orderedFlow.map((entry) => entry.child),
              { keepGroup: true },
            );
      const metricNode = (0, __doeFn_collection)(
        `${node.id}-metric-collection`,
        orderedCompact.map((entry) => entry.child),
        {
          collectionKey: (0, __doeFn_collectionKeyFor)(orderedCompact[0].child) || "kpi",
          maxColumns: 3,
        },
      );
      const required =
        (0, __doeFn_summarize)(flowNode).minWidth +
        (0, __doeFn_summarize)(metricNode).minWidth +
        __doeScope.engine.SPACING_TOKENS["18pt"];
      node.children = [flowNode, metricNode];
      node.layout.direction = required <= innerWidth ? "row" : "stack";
      node.layout.columns = node.layout.direction === "row" ? 2 : 1;
      node.layout.ratio = "balanced";
      node.layout.keepGroup = true;
      diagnostics.push({
        code: "flow-with-metric-collection-planned",
        level: "plan",
        nodeId: node.id,
        message: `${node.id} 已规划为说明列与可换行指标集合`,
      });
      return node;
    }
    const wide = entries.filter((entry) =>
      ["wide", "media"].includes(entry.summary.role),
    );
    const support = entries.filter(
      (entry) => !["wide", "media"].includes(entry.summary.role),
    );

    if (wide.length === 1 && support.length >= 1) {
      const orderedSupport = [...support].sort(
        (a, b) =>
          (0, __doeFn_roleRank)(a.summary.role) - (0, __doeFn_roleRank)(b.summary.role) ||
          a.index - b.index,
      );
      const supportNode =
        orderedSupport.length === 1
          ? orderedSupport[0].child
          : (0, __doeFn_container)(
              `${node.id}-support-stack`,
              "stack",
              orderedSupport.map((entry) => entry.child),
              { keepGroup: true },
            );
      const gap = (0, __doeFn_planningGap)(node);
      const comfortableRequired =
        (0, __doeFn_summarize)(supportNode).preferredWidth +
        wide[0].summary.preferredWidth +
        gap;
      const minimumRequired =
        (0, __doeFn_summarize)(supportNode).minWidth + wide[0].summary.minWidth + gap;
      const rowIsComfortable =
        comfortableRequired <= innerWidth || minimumRequired <= innerWidth * 0.82;
      node.children = [supportNode, wide[0].child];
      node.layout.direction = rowIsComfortable ? "row" : "stack";
      node.layout.columns = rowIsComfortable ? 2 : 1;
      node.layout.ratio = rowIsComfortable ? "primary-second" : "auto";
      diagnostics.push({
        code: "wide-with-support-planned",
        level: "plan",
        nodeId: node.id,
        message: `${node.id} 已按真实可用宽度规划为${rowIsComfortable ? "左右" : "上下"}图文组合`,
      });
      return node;
    }

    if (wide.length >= 2) {
      const wideRequired =
        wide.reduce((sum, entry) => sum + entry.summary.minWidth, 0) +
        __doeScope.engine.SPACING_TOKENS["18pt"] * Math.max(0, wide.length - 1);
      if (support.length && wideRequired <= innerWidth) {
        const orderedSupport = [...support].sort(
          (a, b) =>
            (0, __doeFn_roleRank)(a.summary.role) - (0, __doeFn_roleRank)(b.summary.role) ||
            a.index - b.index,
        );
        const supportNode =
          orderedSupport.length === 1
            ? orderedSupport[0].child
            : (0, __doeFn_container)(
                `${node.id}-support-stack`,
                "stack",
                orderedSupport.map((entry) => entry.child),
                { keepGroup: true },
              );
        const wideNode = (0, __doeFn_container)(
          `${node.id}-evidence-row`,
          "row",
          wide.map((entry) => entry.child),
          { keepGroup: true },
        );
        node.children = [supportNode, wideNode];
        node.layout.direction = "stack";
        node.layout.columns = 1;
        node.layout.ratio = "auto";
        diagnostics.push({
          code: "multi-wide-with-support-planned",
          level: "plan",
          nodeId: node.id,
          message: `${node.id} 已规划为“支持信息 + 宽组件行”`,
        });
        return node;
      }
      const required =
        entries.reduce((sum, entry) => sum + entry.summary.minWidth, 0) +
        __doeScope.engine.SPACING_TOKENS["18pt"] * Math.max(0, entries.length - 1);
      node.layout.direction = required <= innerWidth ? "row" : "stack";
      node.layout.columns = node.layout.direction === "row" ? entries.length : 1;
      node.layout.ratio = "auto";
      return node;
    }

    const allCompact = entries.every(
      (entry) => entry.summary.role === "compact",
    );
    const compactRequired =
      entries.reduce((sum, entry) => sum + entry.summary.minWidth, 0) +
      __doeScope.engine.SPACING_TOKENS["18pt"] * Math.max(0, entries.length - 1);
    node.layout.direction =
      allCompact &&
      entries.length <= __doeScope.MAX_ITEMS &&
      compactRequired <= innerWidth
        ? "row"
        : "stack";
    node.layout.columns = node.layout.direction === "row" ? entries.length : 1;
    node.layout.ratio = "auto";
    return node;
  }
