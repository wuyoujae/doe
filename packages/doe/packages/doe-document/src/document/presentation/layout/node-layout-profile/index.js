import { compositionProfile as __doeFn_compositionProfile } from '../composition-profile/index.js';
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { resolveSpacingToken as __doeFn_resolveSpacingToken } from '../resolve-spacing-token/index.js';
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { isContentsGroup as __doeFn_isContentsGroup } from '../is-contents-group/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
import { collectionContract as __doeFn_collectionContract } from '../collection-contract/index.js';
import { preferredCompressionWidth as __doeFn_preferredCompressionWidth } from '../preferred-compression-width/index.js';
import { requestedColumns as __doeFn_requestedColumns } from '../requested-columns/index.js';
import { collectionKey as __doeFn_collectionKey } from '../collection-key/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1819
import { scope as __doeScope } from "../../runtime/context/index.js";

export function nodeLayoutProfile(node) {
    if (!node) return null;
    if (node.type !== "layout-group") return (0, __doeFn_compositionProfile)(node);
    if ((0, __doeFn_isEdgeSplitGroup)(node)) return { enabled: false };
    const childProfiles = node.children.map((child) => (0, nodeLayoutProfile)(child));
    if (!childProfiles.length || childProfiles.some((profile) => !profile?.enabled)) {
      return { enabled: false };
    }
    const gap = (0, __doeFn_resolveSpacingToken)(node.layout?.gap, 0, "18pt");
    // A local cluster can carry the surrounding collection key while still
    // behaving as one virtual grid cell. Measure its own row/stack geometry,
    // not the outer collection's auto-grid geometry.
    if (((0, __doeFn_isCollectionGroup)(node) || (0, __doeFn_isContentsGroup)(node)) && !(0, __doeFn_isLocalCluster)(node)) {
      const contract = (0, __doeFn_collectionContract)(node) || {};
      const minimums = childProfiles.map((profile) =>
        Math.max(1, Number(profile.minWidth) || 1),
      );
      const preferred = childProfiles.map((profile) =>
        (0, __doeFn_preferredCompressionWidth)(profile),
      );
      const requested = Number(node.layout?.columns);
      const preferredColumns = (0, __doeFn_isContentsGroup)(node) ? (0, __doeFn_requestedColumns)({ node }) : Math.max(
        1,
        Math.min(
          node.children.length || 1,
          Number(node.layout?.maxColumns) || contract.maxColumns || 4,
          Number.isFinite(requested) && requested > 0 ? requested : 2,
        ),
      );
      const minimumWidth = Math.max(
        Number(contract.minItemWidth) || 1,
        ...minimums,
      );
      const preferredItemWidth = Math.max(
        Number(contract.preferredItemWidth) || minimumWidth,
        ...preferred,
      );
      const roles = childProfiles.map((profile) => profile.role);
      const childMinHeights = childProfiles.map((profile) =>
        Math.max(0, Number(profile.minHeight) || 0),
      );
      const estimatedRows = Math.max(
        1,
        Math.ceil(childProfiles.length / preferredColumns),
      );
      const estimatedRowHeight = Math.max(0, ...childMinHeights);
      return {
        enabled: true,
        family: "collection",
        collectionKey: (0, __doeFn_collectionKey)(node),
        role: roles.every((role) => role === "compact")
          ? "compact"
          : "collection",
        minWidth: minimumWidth,
        preferredWidth:
          preferredItemWidth * preferredColumns +
          gap * Math.max(0, preferredColumns - 1),
        minHeight: estimatedRowHeight,
        preferredHeight:
          estimatedRowHeight * estimatedRows +
          gap * Math.max(0, estimatedRows - 1),
        weight: 1,
        minFontPt: Math.min(
          ...childProfiles.map(
            (profile) => Number(profile.minFontPt) || __doeScope.MIN_READABLE_FONT_PT,
          ),
        ),
        allowMicroText: childProfiles.some((profile) => profile.allowMicroText),
        preserveAspect: childProfiles.some((profile) => profile.preserveAspect),
        canSplit: true,
        priority: Math.max(
          50,
          ...childProfiles.map((profile) => Number(profile.priority) || 50),
        ),
        orientations: ["row", "stack"],
        shrinkMode: "wrap-collection",
      };
    }
    // A nested local grid is one reflowable composition cell, but it still
    // has real rows and columns inside that cell. Treating it as a generic row
    // summed every child width (a 2x2 KPI grid looked like four columns),
    // which inflated its minimum beyond the whole slide. Model the internal
    // column count so the parent negotiates one safe cell while the inner grid
    // remains free to wrap.
    const requestedLocalColumns = Number(node.layout?.columns);
    const localGridLike =
      (0, __doeFn_isLocalCluster)(node) &&
      (["grid", "auto-grid"].includes(node.layout?.variant) ||
        (Number.isFinite(requestedLocalColumns) && requestedLocalColumns > 1));
    if (localGridLike) {
      const preferredColumns = Math.max(
        1,
        Math.min(
          node.children.length || 1,
          Number(node.layout?.maxColumns) || node.children.length || 1,
          Number.isFinite(requestedLocalColumns) && requestedLocalColumns > 0
            ? Math.round(requestedLocalColumns)
            : Math.min(2, node.children.length || 1),
        ),
      );
      const minimums = childProfiles.map((profile) =>
        Math.max(1, Number(profile.minWidth) || 1),
      );
      const preferred = childProfiles.map((profile) =>
        (0, __doeFn_preferredCompressionWidth)(profile),
      );
      const childMinHeights = childProfiles.map((profile) =>
        Math.max(0, Number(profile.minHeight) || 0),
      );
      const rows = Math.max(
        1,
        Math.ceil(childProfiles.length / preferredColumns),
      );
      const rowHeights = Array.from({ length: rows }, (_, rowIndex) =>
        Math.max(
          0,
          ...childMinHeights.slice(
            rowIndex * preferredColumns,
            (rowIndex + 1) * preferredColumns,
          ),
        ),
      );
      const minWidth = Math.max(...minimums);
      const preferredItemWidth = Math.max(...preferred);
      const minHeight =
        rowHeights.reduce((sum, height) => sum + height, 0) +
        gap * Math.max(0, rows - 1);
      return {
        enabled: true,
        family: "container",
        role: "collection",
        minWidth,
        preferredWidth:
          preferredItemWidth * preferredColumns +
          gap * Math.max(0, preferredColumns - 1),
        minHeight,
        preferredHeight: minHeight,
        weight: 1,
        minFontPt: Math.min(
          ...childProfiles.map(
            (profile) => Number(profile.minFontPt) || __doeScope.MIN_READABLE_FONT_PT,
          ),
        ),
        allowMicroText: childProfiles.some((profile) => profile.allowMicroText),
        preserveAspect: childProfiles.some((profile) => profile.preserveAspect),
        canSplit: true,
        priority: Math.max(
          50,
          ...childProfiles.map((profile) => Number(profile.priority) || 50),
        ),
        orientations: ["row", "stack"],
        shrinkMode: "reflow-local-grid",
      };
    }
    const direction =
      node.layout?.variant === "stack" || node.layout?.direction === "stack"
        ? "stack"
        : "row";
    const minimums = childProfiles.map((profile) =>
      Math.max(1, Number(profile.minWidth) || 1),
    );
    const preferred = childProfiles.map((profile) =>
      (0, __doeFn_preferredCompressionWidth)(profile),
    );
    const rawMinWidth =
      direction === "row"
        ? minimums.reduce((sum, width) => sum + width, 0) +
          gap * Math.max(0, childProfiles.length - 1)
        : Math.max(...minimums);
    // A media + title + copy cluster is a reflowable collection card, not a
    // standalone 340px narrative column.  Its children keep their semantic
    // font sizes and wrap inside one cell, so the outer collection may safely
    // use four equal tracks on a 960pt slide.  Other local clusters retain
    // their component-derived hard floor.
    const reflowableStackCard =
      direction === "stack" &&
      ((0, __doeFn_isLocalCluster)(node) ||
        node.layout?.intent === "capability-card" ||
        childProfiles.some((profile) => profile.role === "media"));
    const minWidth = reflowableStackCard
      ? Math.min(rawMinWidth, 220)
      : rawMinWidth;
    const preferredWidth =
      direction === "row"
        ? preferred.reduce((sum, width) => sum + width, 0) +
          gap * Math.max(0, childProfiles.length - 1)
        : Math.max(...preferred);
    const roles = childProfiles.map((profile) => profile.role);
    const childMinHeights = childProfiles.map((profile) =>
      Math.max(0, Number(profile.minHeight) || 0),
    );
    const minHeight =
      direction === "row"
        ? Math.max(0, ...childMinHeights)
        : childMinHeights.reduce((sum, height) => sum + height, 0) +
          gap * Math.max(0, childProfiles.length - 1);
    const role = roles.includes("media")
      ? "media"
      : roles.includes("wide")
        ? "wide"
        : roles.every((item) => item === "compact")
          ? "compact"
          : roles.includes("flow")
            ? "flow"
            : "collection";
    return {
      enabled: true,
      family: "container",
      role,
      minWidth,
      preferredWidth,
      minHeight,
      preferredHeight: minHeight,
      weight: Math.max(1, preferredWidth / Math.max(1, minWidth)),
      minFontPt: Math.min(
        ...childProfiles.map(
          (profile) => Number(profile.minFontPt) || __doeScope.MIN_READABLE_FONT_PT,
        ),
      ),
      allowMicroText: childProfiles.some((profile) => profile.allowMicroText),
      preserveAspect: childProfiles.some((profile) => profile.preserveAspect),
      canSplit: childProfiles.some((profile) => profile.canSplit),
      priority: Math.max(
        50,
        ...childProfiles.map((profile) => Number(profile.priority) || 50),
      ),
      orientations: ["row", "stack"],
      shrinkMode: "recursive-reflow",
    };
  }
