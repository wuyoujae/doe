import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { isLayoutFeatureLocked as __doeFn_isLayoutFeatureLocked } from '../is-layout-feature-locked/index.js';
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { isContentsGroup } from '../is-contents-group/index.js';
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { edgeMediaPosition as __doeFn_edgeMediaPosition } from '../edge-media-position/index.js';
import { edgeMediaBounds as __doeFn_edgeMediaBounds } from '../edge-media-bounds/index.js';
import { normalizeEdgeMediaRatio as __doeFn_normalizeEdgeMediaRatio } from '../../schema/normalize-edge-media-ratio/index.js';
import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { previousCollectionColumnCount as __doeFn_previousCollectionColumnCount } from '../previous-collection-column-count/index.js';
import { nextCollectionColumnCount as __doeFn_nextCollectionColumnCount } from '../next-collection-column-count/index.js';
import { repairGroupNode as __doeFn_repairGroupNode } from '../repair-group-node/index.js';
import { nodeLayoutProfile as __doeFn_nodeLayoutProfile } from '../node-layout-profile/index.js';
import { isWideProfile as __doeFn_isWideProfile } from '../is-wide-profile/index.js';
import { profileOrderRank as __doeFn_profileOrderRank } from '../profile-order-rank/index.js';
import { makeRepairGroup as __doeFn_makeRepairGroup } from '../make-repair-group/index.js';
import { compositionAncestorDepth as __doeFn_compositionAncestorDepth } from '../composition-ancestor-depth/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
import { collapseDegenerateCompressionGroups as __doeFn_collapseDegenerateCompressionGroups } from '../collapse-degenerate-compression-groups/index.js';
import { makeCollectionGroup as __doeFn_makeCollectionGroup } from '../make-collection-group/index.js';
import { collectionKey as __doeFn_collectionKey } from '../collection-key/index.js';
import { collectionItemCount as __doeFn_collectionItemCount } from '../collection-item-count/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8746
import { scope as __doeScope } from "../../runtime/context/index.js";

export function builtinRepairCandidates(context) {
    const { state, report } = context;
    const candidates = [];
    // A plain stack already supplies the gap between its children. If the
    // page is too tall, use the existing cluster spacing contract to avoid
    // counting standalone slot insets again. Full-row notices stay in a stack.
    if (report.overflowY > 0 || report.compressionFitViolations > 0) {
      state.groupRecords.filter(({ node }) => node.layout?.variant === "stack" &&
        node.layout.origin !== "explicit" && !(0, __doeFn_isLocalCluster)(node) &&
        !(0, __doeFn_isLayoutFeatureLocked)(node, "structure") &&
        !(0, __doeFn_isLayoutFeatureLocked)(node, "spacing") && node.children.length > 1)
        .forEach(({ node }) => candidates.push({
          id: `compact-stack-spacing:${node.id}`, label: `收紧 ${node.id} 中重复的组件外侧留白`, cost: 1,
          apply(nextState) {
            const current = (0, __doeFn_findLocation)(nextState.slide.blocks, node.id)?.node;
            if (!current || current.layout?.variant !== "stack") return false;
            current.kind = "cluster";
            Object.assign(current.layout, { cluster: true, columns: 1, maxColumns: 1, gap: "12pt" });
            return true;
          },
        }));
    }
    const compositionGroups = state.groupRecords.filter(
      (group) =>
        (0, __doeFn_isCompositionGroup)(group.node) && !(0, __doeFn_isLayoutFeatureLocked)(group.node, "structure"),
    );
    const collectionGroups = state.groupRecords.filter(
      (group) =>
        (0, __doeFn_isCollectionGroup)(group.node) && !(0, __doeFn_isLayoutFeatureLocked)(group.node, "structure") &&
        !(0, __doeFn_isLayoutFeatureLocked)(group.node, "columns"),
    );
    const edgeMediaGroups = state.groupRecords.filter((group) =>
      (0, __doeFn_isEdgeSplitGroup)(group.node) && !(0, __doeFn_isLayoutFeatureLocked)(group.node, "structure"),
    );

    edgeMediaGroups.forEach((record) => {
      const node = record.node;
      const position = (0, __doeFn_edgeMediaPosition)(node);
      const bounds = (0, __doeFn_edgeMediaBounds)(position);
      const currentRatio = (0, __doeFn_normalizeEdgeMediaRatio)(
        node.layout.mediaRatio,
        position,
      );
      if (
        (report.overflowX > 0 ||
          report.overflowY > 0 ||
          report.overlaps > 0) &&
        currentRatio > bounds.minimum + 0.001
      ) {
        const nextRatio = Math.max(
          bounds.minimum,
          Math.round((currentRatio - 0.06) * 100) / 100,
        );
        candidates.push({
          id: `edge-media-release:${node.id}:${nextRatio}`,
          label: `缩小 ${node.id} 的贴边媒体占比，为内容区回收空间`,
          cost: 1,
          apply(nextState) {
            const location = (0, __doeFn_findLocation)(nextState.slide.blocks, node.id);
            if (!location || !(0, __doeFn_isEdgeSplitGroup)(location.node)) return false;
            location.node.layout.mediaRatio = nextRatio;
            return true;
          },
        });
      }
    });

    collectionGroups.forEach((record) => {
      const node = record.node;
      const groupReport = report.groups.find((group) => group.id === node.id);
      const currentColumns = groupReport?.resolvedColumns || 1;
      const hasBlockedSemanticText = Boolean(
        record.content?.querySelector?.(
          '[data-semantic-wrap-status="blocked"]',
        ),
      );
      const maximumColumns = Math.max(
        1,
        Math.min(
          node.children.length || 1,
          Number(node.layout.maxColumns) || 4,
          isContentsGroup(node) ? 3 : Infinity,
        ),
      );
      if (
        report.semanticWrapViolations > 0 &&
        hasBlockedSemanticText &&
        node.children.length >= 2 &&
        currentColumns > 1 &&
        !(0, __doeFn_isLayoutFeatureLocked)(node, "columns")
      ) {
        const nextColumns = (0, __doeFn_previousCollectionColumnCount)(currentColumns);
        candidates.push({
          id: `collection-release-semantic-width:${node.id}:${nextColumns}`,
          label: `将 ${node.id} 调整为 ${nextColumns} 列，为语义完整的文字换行释放宽度`,
          cost: 0.5,
          apply(nextState) {
            const location = (0, __doeFn_findLocation)(nextState.slide.blocks, node.id);
            if (!location || !(0, __doeFn_isCollectionGroup)(location.node)) return false;
            location.node.layout.variant = "grid";
            location.node.layout.direction = "row";
            location.node.layout.columns = nextColumns;
            return true;
          },
        });
      }
      if (
        (report.overflowY > 0 || report.overlaps > 0) &&
        node.children.length >= 2 &&
        currentColumns < maximumColumns
      ) {
        const nextColumns = (0, __doeFn_nextCollectionColumnCount)(
          currentColumns,
          maximumColumns,
          node.children.length,
        );
        candidates.push({
          id: `collection-increase-columns:${node.id}:${nextColumns}`,
          label: `将 ${node.id} 增加为 ${nextColumns} 列以优先回收高度`,
          cost: 1,
          apply(nextState) {
            const location = (0, __doeFn_findLocation)(nextState.slide.blocks, node.id);
            if (!location || !(0, __doeFn_isCollectionGroup)(location.node)) return false;
            location.node.layout.variant = "grid";
            location.node.layout.direction = "row";
            location.node.layout.columns = nextColumns;
            return true;
          },
        });
      }
      if (
        (report.overflowY > 0 || report.overlaps > 0) &&
        node.children.length >= 2 &&
        (node.layout.variant === "stack" || currentColumns < maximumColumns)
      ) {
        candidates.push({
          id: `collection-wrap:${node.id}`,
          label: `将 ${node.id} 恢复为自适应多列集合`,
          cost: 1,
          apply(nextState) {
            const location = (0, __doeFn_findLocation)(nextState.slide.blocks, node.id);
            if (!location || !(0, __doeFn_isCollectionGroup)(location.node)) return false;
            location.node.layout.variant = "auto-grid";
            location.node.layout.direction = "row";
            location.node.layout.columns = "auto";
            return true;
          },
        });
      }
      if (
        (report.overflowX > 0 || report.minWidthViolations > 0) &&
        node.layout.variant === "grid" &&
        Number(node.layout.columns) > 1
      ) {
        candidates.push({
          id: `collection-auto-columns:${node.id}`,
          label: `按可用宽度重新计算 ${node.id} 的列数`,
          cost: 1,
          apply(nextState) {
            const location = (0, __doeFn_findLocation)(nextState.slide.blocks, node.id);
            if (!location || !(0, __doeFn_isCollectionGroup)(location.node)) return false;
            location.node.layout.variant = "auto-grid";
            location.node.layout.direction = "row";
            location.node.layout.columns = "auto";
            return true;
          },
        });
      }
    });

    compositionGroups.forEach((record) => {
      const node = record.node;
      if (node.layout.ratio !== "auto") {
        candidates.push({
          id: `ratio-auto:${node.id}`,
          label: `重新分配 ${node.id} 的轨道宽度`,
          cost: 1,
          apply(nextState) {
            const location = (0, __doeFn_repairGroupNode)(nextState, node.id);
            if (!location) return false;
            location.node.layout.ratio = "auto";
            return true;
          },
        });
      }

      const profiles = node.children.map((child) => (0, __doeFn_nodeLayoutProfile)(child));
      const wideIndexes = profiles
        .map((profile, index) => ((0, __doeFn_isWideProfile)(profile) ? index : -1))
        .filter((index) => index >= 0);
      const supportIndexes = profiles
        .map((profile, index) => (!(0, __doeFn_isWideProfile)(profile) ? index : -1))
        .filter((index) => index >= 0);
      if (
        node.layout.direction === "row" &&
        wideIndexes.length === 1 &&
        supportIndexes.length >= 2
      ) {
        candidates.push({
          id: `regroup-support:${node.id}`,
          label: `将 ${node.id} 重组为“支持信息纵排 + 宽组件”`,
          cost: 2,
          apply(nextState) {
            const location = (0, __doeFn_repairGroupNode)(nextState, node.id);
            if (!location) return false;
            const current = location.node;
            const entries = current.children.map((child, index) => ({
              child,
              index,
              profile: (0, __doeFn_nodeLayoutProfile)(child),
            }));
            const wide = entries.filter((entry) => (0, __doeFn_isWideProfile)(entry.profile));
            const support = entries
              .filter((entry) => !(0, __doeFn_isWideProfile)(entry.profile))
              .sort(
                (a, b) =>
                  (0, __doeFn_profileOrderRank)(a.profile) - (0, __doeFn_profileOrderRank)(b.profile) ||
                  a.index - b.index,
              );
            if (wide.length !== 1 || support.length < 2) return false;
            const supportGroup = (0, __doeFn_makeRepairGroup)(
              nextState,
              `${current.id}-support`,
              "stack",
              support.map((entry) => entry.child),
            );
            current.children = [supportGroup, wide[0].child];
            current.layout.direction = "row";
            current.layout.columns = 2;
            current.layout.ratio = "primary-second";
            current.layout.autoGenerated = true;
            return true;
          },
        });
      }

      if (
        wideIndexes.length >= 2 &&
        supportIndexes.length >= 1 &&
        (0, __doeFn_compositionAncestorDepth)(state, node.id) + 2 <=
          __doeScope.MAX_COMPOSITION_DEPTH
      ) {
        candidates.push({
          id: `evidence-row:${node.id}`,
          label: `将 ${node.id} 重组为“支持信息 + 证据组件行”`,
          cost: 3,
          apply(nextState) {
            const location = (0, __doeFn_repairGroupNode)(nextState, node.id);
            if (!location) return false;
            const current = location.node;
            const entries = current.children.map((child, index) => ({
              child,
              index,
              profile: (0, __doeFn_nodeLayoutProfile)(child),
            }));
            const evidence = entries.filter((entry) =>
              (0, __doeFn_isWideProfile)(entry.profile),
            );
            const support = entries
              .filter((entry) => !(0, __doeFn_isWideProfile)(entry.profile))
              .sort(
                (a, b) =>
                  (0, __doeFn_profileOrderRank)(a.profile) - (0, __doeFn_profileOrderRank)(b.profile) ||
                  a.index - b.index,
              );
            if (!support.length || evidence.length < 2) return false;
            const supportNode =
              support.length === 1
                ? support[0].child
                : (0, __doeFn_makeRepairGroup)(
                    nextState,
                    `${current.id}-support`,
                    "stack",
                    support.map((entry) => entry.child),
                  );
            const evidenceNode = (0, __doeFn_makeRepairGroup)(
              nextState,
              `${current.id}-evidence`,
              "row",
              evidence.map((entry) => entry.child),
            );
            current.children = [supportNode, evidenceNode];
            current.layout.direction = "stack";
            current.layout.columns = 1;
            current.layout.ratio = "auto";
            current.layout.autoGenerated = true;
            return true;
          },
        });
      }

      const flowEntries = node.children
        .map((child, index) => ({
          child,
          index,
          profile: profiles[index],
        }))
        .filter((entry) => entry.profile?.role === "flow");
      const compactEntries = node.children
        .map((child, index) => ({
          child,
          index,
          profile: profiles[index],
        }))
        .filter((entry) => entry.profile?.role === "compact");
      if (
        wideIndexes.length === 0 &&
        flowEntries.length >= 1 &&
        compactEntries.length >= 2 &&
        (0, __doeFn_compositionAncestorDepth)(state, node.id) + 2 <=
          __doeScope.MAX_COMPOSITION_DEPTH
      ) {
        candidates.push({
          id: `flow-over-metrics:${node.id}`,
          label: `将 ${node.id} 重组为“说明文字 + 指标行”`,
          cost: 3,
          apply(nextState) {
            const location = (0, __doeFn_repairGroupNode)(nextState, node.id);
            if (!location) return false;
            const current = location.node;
            const currentEntries = current.children.map((child, index) => ({
              child,
              index,
              profile: (0, __doeFn_nodeLayoutProfile)(child),
            }));
            const flows = currentEntries.filter(
              (entry) => entry.profile?.role === "flow",
            );
            const metrics = currentEntries.filter(
              (entry) => entry.profile?.role === "compact",
            );
            const rest = currentEntries.filter(
              (entry) =>
                !["flow", "compact"].includes(entry.profile?.role),
            );
            if (!flows.length || metrics.length < 2 || rest.length) return false;
            const flowNode =
              flows.length === 1
                ? flows[0].child
                : (0, __doeFn_makeRepairGroup)(
                    nextState,
                    `${current.id}-copy`,
                    "stack",
                    flows.map((entry) => entry.child),
                  );
            const metricNode = (0, __doeFn_makeRepairGroup)(
              nextState,
              `${current.id}-metrics`,
              "row",
              metrics.map((entry) => entry.child),
            );
            current.children = [flowNode, metricNode];
            current.layout.direction = "stack";
            current.layout.columns = 1;
            current.layout.ratio = "auto";
            current.layout.autoGenerated = true;
            return true;
          },
        });
      }

      const flippedDirection = node.layout.direction === "row" ? "stack" : "row";
      candidates.push({
        id: `flip-axis:${node.id}`,
        label: `将 ${node.id} 切换为${flippedDirection === "row" ? "横排" : "竖排"}`,
        cost: 3,
        apply(nextState) {
          const location = (0, __doeFn_repairGroupNode)(nextState, node.id);
          if (!location) return false;
          location.node.layout.direction = flippedDirection;
          location.node.layout.columns =
            flippedDirection === "row" ? location.node.children.length : 1;
          location.node.layout.ratio = "auto";
          return true;
        },
      });

      node.children.forEach((child) => {
        if (
          !(0, __doeFn_isCompositionGroup)(child) ||
          ((0, __doeFn_isLocalCluster)(child) &&
            (child.layout.origin === "explicit" || child.layout.keepGroup)) ||
          (0, __doeFn_isLayoutFeatureLocked)(child, "structure") ||
          child.layout.direction !== node.layout.direction ||
          node.children.length - 1 + child.children.length >
            __doeScope.MAX_COMPOSITION_ITEMS
        ) {
          return;
        }
        candidates.push({
          id: `flatten-axis:${child.id}`,
          label: `扁平化同方向容器 ${child.id}`,
          cost: 1,
          apply(nextState) {
            const parent = (0, __doeFn_repairGroupNode)(nextState, node.id);
            if (!parent) return false;
            const index = parent.node.children.findIndex(
              (item) => item.id === child.id,
            );
            if (index < 0) return false;
            const nested = parent.node.children[index];
            if (!(0, __doeFn_isCompositionGroup)(nested)) return false;
            parent.node.children.splice(index, 1, ...nested.children);
            parent.node.layout.columns =
              parent.node.layout.direction === "row"
                ? parent.node.children.length
                : 1;
            return true;
          },
        });
      });

      const groupReport = report.groups.find((group) => group.id === node.id);
      const canUseMicro =
        state.slide.layout.allowEmergency8Pt &&
        Number(node.layout.textFit?.minBodyPt) > __doeScope.MIN_MICRO_FONT_PT &&
        profiles.some((profile) => profile?.allowMicroText);
      if (canUseMicro && (report.overflowY > 0 || report.minWidthViolations > 0)) {
        candidates.push({
          id: `micro-text:${node.id}`,
          label: `将 ${node.id} 的可换行正文下限放宽到 8pt`,
          cost: 7,
          apply(nextState) {
            const location = (0, __doeFn_repairGroupNode)(nextState, node.id);
            if (!location) return false;
            location.node.layout.textFit = {
              mode: "micro",
              minBodyPt: __doeScope.MIN_MICRO_FONT_PT,
              optionalMinBodyPt: __doeScope.MIN_MICRO_FONT_PT,
            };
            return true;
          },
        });
      }

      if (
        groupReport?.compressionFits === false ||
        (0, __doeFn_compositionAncestorDepth)(state, node.id) >= __doeScope.MAX_COMPOSITION_DEPTH - 1
      ) {
        candidates.push({
          id: `exit-composition:${node.id}`,
          label: `解除过度组合 ${node.id}`,
          cost: 5,
          apply(nextState) {
            const location = (0, __doeFn_repairGroupNode)(nextState, node.id);
            if (!location) return false;
            if (
              (0, __doeFn_isCompositionGroup)(location.parentGroup) &&
              location.parentGroup.children.length - 1 +
                location.node.children.length >
                __doeScope.MAX_COMPOSITION_ITEMS
            ) {
              return false;
            }
            location.array.splice(location.index, 1, ...location.node.children);
            (0, __doeFn_collapseDegenerateCompressionGroups)(nextState.slide.blocks);
            return true;
          },
        });
      }
    });

    if (
      (report.overflowY > 0 || report.overlaps > 0) &&
      !state.slide.blocks.some((block) => (0, __doeFn_isEdgeSplitGroup)(block))
    ) {
      const rootEntries = state.slide.blocks.map((child, index) => ({
        child,
        index,
        profile: (0, __doeFn_nodeLayoutProfile)(child),
      }));
      const rootFlow = rootEntries.filter(
        (entry) => entry.profile?.role === "flow",
      );
      const rootCompact = rootEntries.filter(
        (entry) => entry.profile?.role === "compact",
      );
      const rootOther = rootEntries.filter(
        (entry) => !["flow", "compact"].includes(entry.profile?.role),
      );

      if (rootFlow.length && rootCompact.length >= 2 && !rootOther.length) {
        candidates.push({
          id: "root-flow-with-metric-collection",
          label: "将根层文字与指标重排为说明列 + 自适应指标集合",
          cost: 2,
          apply(nextState) {
            const currentEntries = nextState.slide.blocks.map((child, index) => ({
              child,
              index,
              profile: (0, __doeFn_nodeLayoutProfile)(child),
            }));
            const flows = currentEntries.filter(
              (entry) => entry.profile?.role === "flow",
            );
            const compact = currentEntries.filter(
              (entry) => entry.profile?.role === "compact",
            );
            const other = currentEntries.filter(
              (entry) => !["flow", "compact"].includes(entry.profile?.role),
            );
            if (!flows.length || compact.length < 2 || other.length) return false;
            const flowNode =
              flows.length === 1
                ? flows[0].child
                : (0, __doeFn_makeRepairGroup)(
                    nextState,
                    "root-flow",
                    "stack",
                    flows.map((entry) => entry.child),
                  );
            const compactChildren = compact.flatMap((entry) =>
              (0, __doeFn_isCollectionGroup)(entry.child)
                ? entry.child.children
                : [entry.child],
            );
            const metricNode = (0, __doeFn_makeCollectionGroup)(
              nextState,
              "root-metrics",
              compactChildren,
              {
                collectionKey: (0, __doeFn_collectionKey)(compactChildren[0]) || "kpi",
                maxColumns: 3,
              },
            );
            nextState.slide.blocks = [
              (0, __doeFn_makeRepairGroup)(
                nextState,
                "root-semantic-pack",
                "row",
                [flowNode, metricNode],
              ),
            ];
            nextState.slide.blocks[0].layout.ratio = "balanced";
            return true;
          },
        });
      }

      const buckets = new Map();
      rootEntries.forEach((entry) => {
        const key = (0, __doeFn_collectionKey)(entry.child);
        if (!key) return;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(entry);
      });
      buckets.forEach((entries, key) => {
        const itemCount = entries.reduce(
          (sum, entry) => sum + (0, __doeFn_collectionItemCount)(entry.child),
          0,
        );
        if (entries.length < 2 || itemCount > __doeScope.MAX_COLLECTION_ITEMS) return;
        candidates.push({
          id: `root-collection:${key}`,
          label: `将根层 ${key} 项恢复为自适应集合`,
          cost: 1,
          apply(nextState) {
            const selected = nextState.slide.blocks
              .map((child, index) => ({ child, index }))
              .filter(({ child }) => (0, __doeFn_collectionKey)(child) === key);
            if (selected.length < 2) return false;
            const insertionIndex = Math.min(
              ...selected.map((entry) => entry.index),
            );
            const selectedIds = new Set(selected.map((entry) => entry.child.id));
            const children = selected.flatMap((entry) =>
              (0, __doeFn_isCollectionGroup)(entry.child)
                ? entry.child.children
                : [entry.child],
            );
            nextState.slide.blocks = nextState.slide.blocks.filter(
              (child) => !selectedIds.has(child.id),
            );
            nextState.slide.blocks.splice(
              insertionIndex,
              0,
              (0, __doeFn_makeCollectionGroup)(nextState, `root-${key}`, children, {
                collectionKey: key,
              }),
            );
            return true;
          },
        });
      });
    }

    if (
      report.overflowY > 0 &&
      state.slide.blocks.length >= 2 &&
      state.slide.blocks.length <= __doeScope.MAX_COMPOSITION_ITEMS &&
      // A level-one slide heading owns the full page reading axis. Moving it
      // beside the body changes the information hierarchy and often makes a
      // perfectly valid image/text collection narrower and taller. Repair
      // the body itself instead of horizontally packing the slide title.
      !state.slide.blocks.some((block) => block?.type === "heading") &&
      !state.slide.blocks.some((block) => block.layout?.intent === "semantic-heading-support") &&
      state.slide.blocks.every((block) => (0, __doeFn_nodeLayoutProfile)(block)?.enabled) &&
      !state.slide.blocks.some((block) => (0, __doeFn_isEdgeSplitGroup)(block))
    ) {
      candidates.push({
        id: "pack-root-row",
        label: "将根层内容横向打包以回收高度",
        cost: 4,
        apply(nextState) {
          const children = nextState.slide.blocks;
          if (children.length < 2 || children.length > __doeScope.MAX_COMPOSITION_ITEMS) {
            return false;
          }
          const profiles = children.map((child) => (0, __doeFn_nodeLayoutProfile)(child));
          if (profiles.some(profile => !profile?.enabled)) return false;
          const wide = children.filter((_, index) =>
            (0, __doeFn_isWideProfile)(profiles[index]),
          );
          const support = children
            .map((child, index) => ({ child, profile: profiles[index], index }))
            .filter((entry) => !(0, __doeFn_isWideProfile)(entry.profile))
            .sort(
              (a, b) =>
                (0, __doeFn_profileOrderRank)(a.profile) - (0, __doeFn_profileOrderRank)(b.profile) ||
                a.index - b.index,
            );
          let planned = children;
          if (wide.length === 1 && support.length >= 2) {
            planned = [
              (0, __doeFn_makeRepairGroup)(
                nextState,
                "root-support",
                "stack",
                support.map((entry) => entry.child),
              ),
              wide[0],
            ];
          }
          nextState.slide.blocks = [
            (0, __doeFn_makeRepairGroup)(nextState, "root-pack", "row", planned),
          ];
          return true;
        },
      });
    }

    if (
      report.overflowY > 0 &&
      state.slide.blocks.length > __doeScope.MAX_COMPOSITION_ITEMS &&
      !state.slide.blocks.some((block) => (0, __doeFn_isEdgeSplitGroup)(block))
    ) {
      const rootEntries = state.slide.blocks.map((child, index) => ({
        child,
        index,
        profile: (0, __doeFn_nodeLayoutProfile)(child),
      }));
      const rootWide = rootEntries.filter((entry) =>
        (0, __doeFn_isWideProfile)(entry.profile),
      );
      if (rootWide.length) {
        const anchor = rootWide[0];
        const nearbySupport = rootEntries
          .filter((entry) => !(0, __doeFn_isWideProfile)(entry.profile))
          .sort(
            (a, b) =>
              Math.abs(a.index - anchor.index) -
                Math.abs(b.index - anchor.index) ||
              (0, __doeFn_profileOrderRank)(a.profile) - (0, __doeFn_profileOrderRank)(b.profile),
          )
          .slice(0, 2);
        if (nearbySupport.length) {
          candidates.push({
            id: `pack-root-subset:${anchor.child.id}`,
            label: `将 ${anchor.child.id} 与相邻支持信息组成一行`,
            cost: 3,
            apply(nextState) {
              const wideLocation = (0, __doeFn_findLocation)(
                nextState.slide.blocks,
                anchor.child.id,
              );
              if (!wideLocation || wideLocation.array !== nextState.slide.blocks) {
                return false;
              }
              const supportNodes = nearbySupport
                .map((entry) =>
                  (0, __doeFn_findLocation)(nextState.slide.blocks, entry.child.id),
                )
                .filter(
                  (location) =>
                    location && location.array === nextState.slide.blocks,
                )
                .map((location) => location.node)
                .sort(
                  (a, b) =>
                    (0, __doeFn_profileOrderRank)((0, __doeFn_nodeLayoutProfile)(a)) -
                      (0, __doeFn_profileOrderRank)((0, __doeFn_nodeLayoutProfile)(b)),
                );
              if (!supportNodes.length) return false;
              const selectedIds = new Set([
                anchor.child.id,
                ...supportNodes.map((node) => node.id),
              ]);
              const insertionIndex = Math.min(
                ...nextState.slide.blocks
                  .map((node, index) =>
                    selectedIds.has(node.id) ? index : Infinity,
                  )
                  .filter(Number.isFinite),
              );
              const supportNode =
                supportNodes.length === 1
                  ? supportNodes[0]
                  : (0, __doeFn_makeRepairGroup)(
                      nextState,
                      "root-subset-support",
                      "stack",
                      supportNodes,
                    );
              const packed = (0, __doeFn_makeRepairGroup)(
                nextState,
                "root-subset",
                "row",
                [supportNode, wideLocation.node],
              );
              nextState.slide.blocks = nextState.slide.blocks.filter(
                (node) => !selectedIds.has(node.id),
              );
              nextState.slide.blocks.splice(insertionIndex, 0, packed);
              return true;
            },
          });
        }
      }
    }
    return candidates;
  }
