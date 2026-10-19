import { prepareFlowText } from '../../../../../../doe-component/src/layout/compression/prepare-flow-text/index.js';
import { applyFlowDensity } from '../flow/apply.js';
import { resolveSpacingToken as __doeFn_resolveSpacingToken } from '../resolve-spacing-token/index.js';
import { applyTypographyCompression as __doeFn_applyTypographyCompression } from "../../typography/apply-typography-compression/index.js";
import { clearLocalTypography as __doeFn_clearLocalTypography } from '../clear-local-typography/index.js';
import { localTypographySpecForNode as __doeFn_localTypographySpecForNode } from '../local-typography-spec-for-node/index.js';
import { nodeLayoutProfile as __doeFn_nodeLayoutProfile } from '../node-layout-profile/index.js';
import { applyCompositionDensity as __doeFn_applyCompositionDensity } from '../apply-composition-density/index.js';
import { prepareEqualHeightNegotiation as __doeFn_prepareEqualHeightNegotiation } from '../prepare-equal-height-negotiation/index.js';
import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
import { applyClusterSlotSpace as __doeFn_applyClusterSlotSpace } from '../apply-cluster-slot-space/index.js';
import { applySlotSpace as __doeFn_applySlotSpace } from '../apply-slot-space/index.js';
import { adaptLeafWithResolvedItemColumns as __doeFn_adaptLeafWithResolvedItemColumns } from '../adapt-leaf-with-resolved-item-columns/index.js';
import { attachItemCollectionEditor as __doeFn_attachItemCollectionEditor } from "../../canvas/editor/attach-item-collection-editor/index.js";
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { isContentsGroup as __doeFn_isContentsGroup } from '../is-contents-group/index.js';
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { leafForShell as __doeFn_leafForShell } from '../leaf-for-shell/index.js';
import { requestedColumns as __doeFn_requestedColumns } from '../requested-columns/index.js';
import { columnNodeMinimum as __doeFn_columnNodeMinimum } from '../column-node-minimum/index.js';
import { compositionRequirements as __doeFn_compositionRequirements } from '../composition-requirements/index.js';
import { ancestorGroups as __doeFn_ancestorGroups } from '../ancestor-groups/index.js';
import { resolveColumnCount as __doeFn_resolveColumnCount } from '../resolve-column-count/index.js';
import { balancedAutoGridColumns as __doeFn_balancedAutoGridColumns } from '../balanced-auto-grid-columns/index.js';
import { allocateProportionalWidths as __doeFn_allocateProportionalWidths } from '../allocate-proportional-widths/index.js';
import { preferredCompressionWidth as __doeFn_preferredCompressionWidth } from '../preferred-compression-width/index.js';
import { edgeMediaPosition as __doeFn_edgeMediaPosition } from '../edge-media-position/index.js';
import { normalizeEdgeMediaRatio as __doeFn_normalizeEdgeMediaRatio } from '../../schema/normalize-edge-media-ratio/index.js';
import { edgeMediaAxis as __doeFn_edgeMediaAxis } from '../edge-media-axis/index.js';
import { edgeMediaShape as __doeFn_edgeMediaShape } from '../edge-media-shape/index.js';
import { edgeMediaContentAlign as __doeFn_edgeMediaContentAlign } from '../edge-media-content-align/index.js';
import { updateEdgeMediaDivider as __doeFn_updateEdgeMediaDivider } from '../update-edge-media-divider/index.js';
import { expandAutoGridSingletonSpans as __doeFn_expandAutoGridSingletonSpans } from '../expand-auto-grid-singleton-spans/index.js';
import { resolvedChildSpan as __doeFn_resolvedChildSpan } from '../resolved-child-span/index.js';
import { compositionDensityId as __doeFn_compositionDensityId } from '../composition-density-id/index.js';
import { typographySpecLabel as __doeFn_typographySpecLabel } from "../../typography/typography-spec-label/index.js";
import { applyGroupChildVerticalAlignment as __doeFn_applyGroupChildVerticalAlignment } from '../apply-group-child-vertical-alignment/index.js';
import { equalizeNegotiatedCardHeights as __doeFn_equalizeNegotiatedCardHeights } from '../equalize-negotiated-card-heights/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7574
import { scope as __doeScope } from "../../runtime/context/index.js";

export function applyDensity(state, density) {
    if (state.flowLayout) return applyFlowDensity(state, density);
    const { slide, layoutElement } = state;
    const compression = Number.isFinite(state.spacingCompressionOverride)
      ? Math.max(0, Math.min(2, state.spacingCompressionOverride))
      : density.compression;
    const safeAreaCompression = slide.layout.lockSafeArea ? 0 : compression;
    const spacing = slide.layout.spacing;
    const pagePadding = (0, __doeFn_resolveSpacingToken)(
      spacing.pagePadding,
      safeAreaCompression,
      "36pt",
    );
    const sectionGap = (0, __doeFn_resolveSpacingToken)(
      spacing.sectionGap,
      compression,
      "18pt",
    );
    const groupGap = (0, __doeFn_resolveSpacingToken)(
      spacing.groupGap,
      compression,
      "18pt",
    );
    const internalGap = (0, __doeFn_resolveSpacingToken)(
      spacing.internalGap,
      compression,
      "12pt",
    );
    const pageNumberBottom = state.pageNumber?.enabled
      ? Math.max(__doeScope.PAGE_NUMBER_MIN_BOTTOM_PX, pagePadding / 2)
      : 0;
    const pageBottomPadding = pagePadding;

    layoutElement.dataset.density = density.id;
    (0, __doeFn_applyTypographyCompression)(
      layoutElement,
      slide.typography?.sizeMode || "default",
      density.id,
    );
    layoutElement.dataset.spacingCompression = String(compression);
    layoutElement.style.setProperty("--page-padding", `${pagePadding}px`);
    layoutElement.style.setProperty(
      "--page-bottom-padding",
      `${pageBottomPadding}px`,
    );
    state.slideElement.style.setProperty("--slide-page-padding", `${pagePadding}px`);
    state.slideElement.style.setProperty(
      "--slide-page-number-bottom",
      `${pageNumberBottom}px`,
    );
    layoutElement.style.setProperty("--section-gap", `${sectionGap}px`);
    layoutElement.style.setProperty("--group-gap", `${groupGap}px`);
    layoutElement.style.setProperty("--component-gap", `${internalGap}px`);

    // Every measurement starts from clean inherited typography. Candidates
    // are applied to branch shells, including root siblings that are not
    // inside an explicit composition.
    [...state.groupRecords, ...state.leafRecords].forEach((record) =>
      (0, __doeFn_clearLocalTypography)(record.shell),
    );
    [...state.groupRecords, ...state.leafRecords].forEach((record) => {
      const localSpec = (0, __doeFn_localTypographySpecForNode)(state, record.node.id);
      if (!localSpec) return;
      const profile = (0, __doeFn_nodeLayoutProfile)(record.node) || {};
      (0, __doeFn_applyCompositionDensity)(
        record.shell,
        localSpec,
        internalGap,
        record.node.layout?.textFit?.minBodyPt,
        profile.allowMicroText === true,
        slide.typography?.sizeMode || "default",
      );
    });

    (0, __doeFn_prepareEqualHeightNegotiation)(state);

    state.leafRecords.forEach((record) => {
      const parentGroup = (0, __doeFn_findLocation)(
        state.slide.blocks,
        record.node.id,
      )?.parentGroup;
      if ((0, __doeFn_isCompositionGroup)(parentGroup)) {
        record.content.style.padding = "0";
      } else if ((0, __doeFn_isLocalCluster)(parentGroup)) {
        (0, __doeFn_applyClusterSlotSpace)(record, compression);
      } else {
        (0, __doeFn_applySlotSpace)(record, compression);
      }
    });

    void layoutElement.offsetHeight;

    const innerWidth = Math.max(
      0,
      layoutElement.clientWidth - (slide.layout.allowsBleed ? 0 : pagePadding * 2),
    );
    state.leafRecords
      .filter((record) => record.level === 0)
      .forEach((record) => {
        (0, __doeFn_adaptLeafWithResolvedItemColumns)(record, {
          columns: 1,
          density: density.id,
          width: innerWidth,
          availableHeight: Math.max(0, layoutElement.clientHeight - pagePadding - pageBottomPadding),
          timelineFallbackStage: state.timelineFallbackStage,
          gap: internalGap,
          autoItemColumns: state.autoItemColumns?.get(record.node.id),
        });
        (0, __doeFn_attachItemCollectionEditor)(record.element, record.node, record.definition, state);
      });

    state.groupRecords.forEach((group) => {
      const edgeSplit = (0, __doeFn_isEdgeSplitGroup)(group.node);
      const contentsGrid = (0, __doeFn_isContentsGroup)(group.node);
      const composition = (0, __doeFn_isCompositionGroup)(group.node) && !contentsGrid;
      const resolvedGap = (0, __doeFn_resolveSpacingToken)(
        group.node.layout.gap ?? spacing.groupGap,
        compression,
        "18pt",
      );
      const groupedGapFloor = compression <= 0
        ? __doeScope.SPACING_TOKENS["12pt"]
        : compression === 1
          ? 12
          : __doeScope.SPACING_TOKENS["6pt"];
      const gap = composition || (0, __doeFn_isCollectionGroup)(group.node)
        ? Math.max(groupedGapFloor, resolvedGap)
        : resolvedGap;
      // clientWidth includes the edge content region's safe-area padding.
      // Child adapters position their contents inside the grid's content box.
      const groupStyle = getComputedStyle(group.content);
      const width = Math.max(0, (group.content.clientWidth || innerWidth)
        - (parseFloat(groupStyle.paddingLeft) || 0)
        - (parseFloat(groupStyle.paddingRight) || 0));
      const childDefinitions = group.childShells
        .map((shell) => (0, __doeFn_leafForShell)(state, shell)?.definition)
        .filter(Boolean);
      const childProfiles = group.node.children
        .map((child) => (0, __doeFn_nodeLayoutProfile)(child))
        .filter(Boolean);
      const desiredColumns = (0, __doeFn_requestedColumns)(group);
      const columnMinimums = group.node.layout.variant === "columns" && desiredColumns === group.node.children.length
        ? group.node.children.map(__doeFn_columnNodeMinimum) : null;
      const columnMinimumTotal = columnMinimums?.reduce((sum, value) => sum + value, 0) || 0;
      const negotiatedColumns = columnMinimums && columnMinimumTotal + gap * (desiredColumns - 1) <= width
        ? columnMinimums.map(value => value + (width - columnMinimumTotal - gap * (desiredColumns - 1)) / desiredColumns)
        : null;
      const profiles = composition
        ? childProfiles
        : [];
      const autoDirection = composition
        ? width + 1 >=
          (0, __doeFn_compositionRequirements)(profiles, gap, density.id).requiredWidth
          ? "row"
          : "stack"
        : null;
      const compositionDirection = composition
        ? group.node.layout.direction === "auto"
          ? autoDirection
          : group.node.layout.direction
        : null;
      const contextualMinimumFloor = (0, __doeFn_isLocalCluster)(group.node) ? 180 : 220;
      const contextualMinimumCap = (0, __doeFn_isLocalCluster)(group.node)
        ? 220
        : Number.POSITIVE_INFINITY;
      const insideColumns = group.node.layout.variant === "columns" || ((0, __doeFn_ancestorGroups)(state.slide.blocks, group.node.id) || []).some(parent => parent.layout.variant === "columns");
      const minimumWidth = insideColumns ? (0, __doeFn_columnNodeMinimum)(group.node) : Math.max(
        contextualMinimumFloor,
        ...childProfiles.map((profile) =>
          Math.min(
            contextualMinimumCap,
            Number(profile.minWidth) || contextualMinimumFloor,
          ),
        ),
        ...childDefinitions.map((definition) =>
          Math.min(
            contextualMinimumCap,
            Number(definition.minWidth) || contextualMinimumFloor,
          ),
        ),
      );
      const feasibleColumns = composition || negotiatedColumns
        ? desiredColumns
        : Math.max(
            1,
            Math.floor((width + gap) / (minimumWidth + gap)),
          );
      const maximumFeasibleColumns = Math.max(
        1,
        Math.min(
          group.node.children.length || 1,
          desiredColumns,
          feasibleColumns,
        ),
      );
      const columns = edgeSplit
        ? desiredColumns
        : composition
          ? compositionDirection === "row"
            ? group.node.children.length
            : 1
          : negotiatedColumns ? desiredColumns
          : contentsGrid
            ? (0, __doeFn_resolveColumnCount)(width, desiredColumns, group.node.children.length, minimumWidth, gap)
          : group.node.layout.variant === "auto-grid"
            ? (0, __doeFn_balancedAutoGridColumns)(
                group.node.children.length || 1,
                maximumFeasibleColumns,
              )
            : maximumFeasibleColumns;
      const columnWidth = Math.max(
        0,
        (width - gap * Math.max(0, columns - 1)) / columns,
      );

      const rowPlan = contentsGrid ? __doeScope.global.DOEContentsLayout.gridPlan(group.childShells.length, columns) : null;
      group.resolvedColumns = columns;
      group.requestedColumns = desiredColumns;
      group.gap = gap;
      group.content.dataset.columns = String(columns);
      if (composition) {
        const allocation =
          compositionDirection === "row"
            ? (0, __doeFn_allocateProportionalWidths)(
                width,
                gap,
                profiles,
                density.id,
                group.node.layout.ratio || "auto",
              )
            : {
                fits: profiles.every(
                  (profile) => width + 0.5 >= Number(profile.minWidth),
                ),
                structuralFits: true,
                widths: profiles.map(() => width),
                scales: profiles.map((profile) =>
                  Math.min(1, width / (0, __doeFn_preferredCompressionWidth)(profile)),
                ),
                requiredWidth: Math.max(
                  ...profiles.map((profile) => Number(profile.minWidth) || 1),
                ),
              };
        group.trackWidths = allocation.widths;
        group.compressionScales = allocation.scales;
        group.compressionFits = allocation.fits;
        group.requiredWidth = allocation.requiredWidth;
        group.resolvedDirection = compositionDirection;
        group.resolvedRatio = group.node.layout.ratio || "auto";
        group.content.dataset.compositionDirection = compositionDirection;
        group.content.dataset.compositionRatio = group.resolvedRatio;
        group.content.style.gridTemplateColumns =
          compositionDirection === "row"
            ? allocation.widths
                .map((trackWidth) => `${trackWidth}px`)
                .join(" ")
            : "minmax(0, 1fr)";
        group.content.style.gridTemplateRows =
          compositionDirection === "stack"
            ? `repeat(${group.node.children.length}, max-content)`
            : "max-content";
      } else if (edgeSplit) {
        const mediaPosition = (0, __doeFn_edgeMediaPosition)(group.node);
        const mediaRatio = (0, __doeFn_normalizeEdgeMediaRatio)(
          group.node.layout.mediaRatio,
          mediaPosition,
        );
        const mediaShare = Math.round(mediaRatio * 1000);
        const contentShare = 1000 - mediaShare;
        const horizontal = (0, __doeFn_edgeMediaAxis)(mediaPosition) === "row";
        group.trackWidths = null;
        group.compressionScales = null;
        group.compressionFits = true;
        group.requiredWidth = 0;
        group.resolvedDirection = horizontal ? "row" : "stack";
        group.resolvedRatio = mediaRatio;
        group.content.dataset.mediaPosition = mediaPosition;
        group.content.dataset.mediaShape = (0, __doeFn_edgeMediaShape)(group.node);
        group.content.dataset.contentAlign = (0, __doeFn_edgeMediaContentAlign)(group.node);
        const contentNode = group.node.children.find(child => child.layout?.region === "content");
        const contentProfile = (0, __doeFn_nodeLayoutProfile)(contentNode);
        const contentWidth = Math.max(Number(contentProfile?.minWidth) || 0, Number(contentProfile?.preferredWidth) || 0);
        group.content.style.setProperty("--edge-content-preferred-width", `${contentWidth}px`);
        group.content.dataset.bleedSide = mediaPosition;
        (0, __doeFn_updateEdgeMediaDivider)(group, mediaRatio, mediaPosition);
        group.content.style.gridTemplateColumns = horizontal
          ? mediaPosition === "left"
            ? `minmax(0, ${mediaShare}fr) minmax(0, ${contentShare}fr)`
            : `minmax(0, ${contentShare}fr) minmax(0, ${mediaShare}fr)`
          : "minmax(0, 1fr)";
        group.content.style.gridTemplateRows = horizontal
          ? "minmax(0, 1fr)"
          : mediaPosition === "top"
            ? `minmax(0, ${mediaShare}fr) minmax(0, ${contentShare}fr)`
            : `minmax(0, ${contentShare}fr) minmax(0, ${mediaShare}fr)`;
      } else {
        group.trackWidths = negotiatedColumns;
        group.compressionScales = null;
        group.compressionFits = true;
        group.requiredWidth = 0;
        group.resolvedDirection = null;
        group.resolvedRatio = null;
        group.content.style.gridTemplateColumns = negotiatedColumns
          ? negotiatedColumns.map(value => `${value}px`).join(" ")
          : `repeat(${rowPlan?.tracks || columns}, minmax(0, 1fr))`;
        group.content.style.gridTemplateRows = "none";
      }
      group.content.style.gap = `${gap}px`;
      group.content.style.alignItems =
        (0, __doeFn_isCompositionGroup)(group.node) && compositionDirection === "row"
          ? group.node.layout.align === "stretch"
            ? "center"
            : group.node.layout.align
          : group.node.layout.align === "center" &&
              (0, __doeFn_isCompositionGroup)(group.node)
            ? "stretch"
            : group.node.layout.align;

      const childSpans = edgeSplit || negotiatedColumns
        ? group.childShells.map(() => 1)
        : (0, __doeFn_expandAutoGridSingletonSpans)(
            group.node,
            group.childShells.map((shell) => {
              const leaf = (0, __doeFn_leafForShell)(state, shell);
              return (0, __doeFn_resolvedChildSpan)(
                group.node,
                leaf?.node,
                leaf?.definition,
                columns,
              );
            }),
            columns,
          );

      void group.content.offsetWidth;

      group.childShells.forEach((shell, childIndex) => {
        const childNode = group.node.children[childIndex];
        if (edgeSplit) {
          const position = (0, __doeFn_edgeMediaPosition)(group.node);
          const isMedia = childNode.layout?.region === "media";
          if ((0, __doeFn_edgeMediaAxis)(position) === "row") {
            shell.style.gridColumn = String(
              isMedia
                ? position === "left"
                  ? 1
                  : 2
                : position === "left"
                  ? 2
                  : 1,
            );
            shell.style.gridRow = "1";
          } else {
            shell.style.gridColumn = "1";
            shell.style.gridRow = String(
              isMedia
                ? position === "top"
                  ? 1
                  : 2
                : position === "top"
                  ? 2
                  : 1,
            );
          }
        }
        const childProfile = (0, __doeFn_nodeLayoutProfile)(childNode) || {};
        const leaf = (0, __doeFn_leafForShell)(state, shell);
        const span = childSpans[childIndex];
        const edgeRatio = edgeSplit
          ? (0, __doeFn_normalizeEdgeMediaRatio)(
              group.node.layout.mediaRatio,
              (0, __doeFn_edgeMediaPosition)(group.node),
            )
          : null;
        const allocatedWidth = edgeSplit
          ? group.resolvedDirection === "row"
            ? width *
              (childNode.layout?.region === "media"
                ? edgeRatio
                : 1 - edgeRatio)
            : width
          : composition
            ? group.trackWidths[childIndex]
            : negotiatedColumns ? negotiatedColumns[childIndex]
            : contentsGrid
              ? (width - gap * (__doeScope.global.DOEContentsLayout.rowSize(group.childShells.length, columns, childIndex) - 1)) / __doeScope.global.DOEContentsLayout.rowSize(group.childShells.length, columns, childIndex)
              : columnWidth * span + gap * Math.max(0, span - 1);
        if (!edgeSplit) {
          shell.style.gridColumn = composition ? "auto" : `span ${rowPlan?.spans[childIndex] || span}`;
          shell.style.gridRow = "auto";
        }
        const inheritedLocalSpec = (0, __doeFn_localTypographySpecForNode)(
          state,
          childNode.id,
        );
        const childDensitySpec = composition
          ? inheritedLocalSpec ||
            (0, __doeFn_compositionDensityId)(
              density.id,
              group.compressionScales[childIndex],
              childProfile.allowMicroText === true &&
                Number(group.node.layout.textFit?.minBodyPt) <=
                  __doeScope.MIN_MICRO_FONT_PT,
            )
          : inheritedLocalSpec || density.id;
        const childDensity = (0, __doeFn_typographySpecLabel)(
          childDensitySpec,
          density.id,
        );
        if (composition) {
          (0, __doeFn_applyCompositionDensity)(
            shell,
            childDensitySpec,
            internalGap,
            group.node.layout.textFit?.minBodyPt,
            childProfile.allowMicroText === true,
            slide.typography?.sizeMode || "default",
          );
        }
        if (!leaf) {
          (0, __doeFn_applyGroupChildVerticalAlignment)(
            group,
            shell,
            null,
            compositionDirection,
          );
          return;
        }
        (0, __doeFn_adaptLeafWithResolvedItemColumns)(leaf, {
          columns,
          density: childDensity,
          width: allocatedWidth,
          availableHeight: Math.max(0, layoutElement.clientHeight - pagePadding - pageBottomPadding),
          timelineFallbackStage: state.timelineFallbackStage,
          gap: internalGap,
          autoItemColumns: state.autoItemColumns?.get(leaf.node.id),
          compressionScale: composition
            ? group.compressionScales[childIndex]
            : 1,
          bleed:
            edgeSplit && leaf.node.layout?.region === slide.layout.bleedRegion,
          height: edgeSplit
            ? group.content.clientHeight *
              (group.resolvedDirection === "stack"
                ? childNode.layout?.region === "media"
                  ? edgeRatio
                  : 1 - edgeRatio
                : 1)
            : null,
        });
        (0, __doeFn_attachItemCollectionEditor)(leaf.element, leaf.node, leaf.definition, state);
        (0, __doeFn_applyGroupChildVerticalAlignment)(
          group,
          shell,
          leaf,
          compositionDirection,
        );
      });
    });

    for (const record of state.leafRecords) {
      if (record.definition.compression?.strategy === "style-first" && record.definition.layoutContract?.text?.reflow) {
        prepareFlowText(record.element, Math.max(0, layoutElement.clientHeight - pagePadding - pageBottomPadding));
      }
    }
    __doeScope.global.PPTTheme?.apply(state.slideElement, state.theme);
    const semanticService = __doeScope.global.SemanticTextLayout;
    state.semanticWrapResults = semanticService?.applyTree
      ? semanticService.applyTree(layoutElement, {
          minFontPt: __doeScope.MIN_MICRO_FONT_PT,
          allowScale: false,
        })
      : [];
    state.equalHeightResults = (0, __doeFn_equalizeNegotiatedCardHeights)(state);
    void layoutElement.offsetHeight;
    return {
      pagePadding,
      pageBottomPadding,
      sectionGap,
      groupGap,
      internalGap,
    };
  }
