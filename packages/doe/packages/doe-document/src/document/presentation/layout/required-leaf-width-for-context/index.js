import { isCompressionGroup as __doeFn_isCompressionGroup } from '../is-compression-group/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8287


export function requiredLeafWidthForContext(definition, parentGroup, ancestors = []) {
    const defaultWidth = (0, __doeFn_isCompressionGroup)(parentGroup)
      ? Number(definition.compression?.minWidth) || definition.minWidth
      : definition.minWidth;
    if (ancestors.some(group => group.layout?.variant === "columns")) {
      return Number(definition.columnMinWidth) || defaultWidth;
    }
    const isStackedParent =
      parentGroup?.type === "layout-group" &&
      (parentGroup.layout?.variant === "stack" ||
        parentGroup.layout?.direction === "stack" ||
        parentGroup.layout?.intent === "capability-card");
    const belongsToAdaptiveCard =
      (0, __doeFn_isLocalCluster)(parentGroup) ||
      (isStackedParent &&
        (parentGroup.layout?.intent === "capability-card" ||
          ancestors.some((group) => (0, __doeFn_isCollectionGroup)(group))));
    return belongsToAdaptiveCard
      ? Math.min(
          Number(defaultWidth) || 220,
          (0, __doeFn_isLocalCluster)(parentGroup) ? 180 : 220,
        )
      : defaultWidth;
  }
