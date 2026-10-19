import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { compositionProfile as __doeFn_compositionProfile } from '../composition-profile/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:10140


export function continuationPlan(state, report) {
    let source = state.slide.blocks;
    let parentId = null;
    if (
      source.length === 1 &&
      ((0, __doeFn_isCompositionGroup)(source[0]) || (0, __doeFn_isCollectionGroup)(source[0])) &&
      source[0].children.length > 1
    ) {
      parentId = source[0].id;
      source = source[0].children;
    }
    const moveStart = Math.max(1, Math.ceil(source.length / 2));
    const moveBlockIds = source.slice(moveStart).map((node) => node.id);
    const splitNodeIds = [];
    function collectSplittable(nodes) {
      nodes.forEach((node) => {
        if (node.type === "layout-group") collectSplittable(node.children);
        else if ((0, __doeFn_compositionProfile)(node)?.canSplit) splitNodeIds.push(node.id);
      });
    }
    collectSplittable(source);
    return {
      status: "needs-continuation",
      reason:
        report.overflowY > 0
          ? "content-height-exceeds-slide"
          : report.overflowX > 0 || report.minWidthViolations > 0
            ? "minimum-width-cannot-be-satisfied"
            : "no-safe-layout-candidate",
      parentId,
      moveBlockIds,
      splitNodeIds,
      preserveOrder: true,
      destructive: false,
      message:
        moveBlockIds.length > 0
          ? "当前页无法在字体底线内安全容纳；建议将标记节点按原顺序续到下一页。"
          : splitNodeIds.length > 0
            ? "单个可拆分组件超过安全容量；请由组件插件按语义段落生成续页。"
            : "单个不可拆分组件超过安全容量；请更换版式或生成独立续页。",
    };
  }
