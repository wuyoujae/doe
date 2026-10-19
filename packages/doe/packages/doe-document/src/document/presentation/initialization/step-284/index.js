import { applyTypographySizeMode as __doeFn_applyTypographySizeMode } from "../../typography/apply-typography-size-mode/index.js";
import { applyTypographyStyle as __doeFn_applyTypographyStyle } from "../../typography/apply-typography-style/index.js";
import { resolveColumnCount as __doeFn_resolveColumnCount } from '../../layout/resolve-column-count/index.js';
import { componentCategory as __doeFn_componentCategory } from '../../layout/component-category/index.js';
import { sanitizeStaticElement as __doeFn_sanitizeStaticElement } from "../../canvas/renderer/sanitize-static-element/index.js";
import { compressionPairPolicy as __doeFn_compressionPairPolicy } from '../../layout/compression-pair-policy/index.js';
import { collectionKey as __doeFn_collectionKey } from '../../layout/collection-key/index.js';
import { compositionPairPolicy as __doeFn_compositionPairPolicy } from '../../layout/composition-pair-policy/index.js';
import { compressionProfile as __doeFn_compressionProfile } from '../../layout/compression-profile/index.js';
import { allocateProportionalWidths as __doeFn_allocateProportionalWidths } from '../../layout/allocate-proportional-widths/index.js';
import { compositionProfile as __doeFn_compositionProfile } from '../../layout/composition-profile/index.js';
import { reduceLayoutIntent as __doeFn_reduceLayoutIntent } from "../../edit/reduce-layout-intent/index.js";
import { mount as __doeFn_mount } from "../../canvas/renderer/mount/index.js";
import { parse as __doeFn_parse } from '../../schema/parse/index.js';
import { setAssetUrlResolver as __doeFn_setAssetUrlResolver } from '../../layout/set-asset-url-resolver/index.js';
import { normalizeCollectionProps as __doeFn_normalizeCollectionProps } from '../../schema/normalize-collection-props/index.js';
import { registerComponent as __doeFn_registerComponent } from '../../../../../../doe-component/src/registry/component/index.js';
import { registerLayout as __doeFn_registerLayout } from '../../../../../../doe-component/src/registry/layout/index.js';
import { registerLayoutPolicy as __doeFn_registerLayoutPolicy } from '../../../../../../doe-core/src/registry/policy/index.js';
import { applySlideBackgroundView as __doeFn_applySlideBackgroundView } from "../../canvas/renderer/apply-slide-background-view/index.js";
import { beginSolverPass as __doeFn_beginSolverPass } from '../../layout/begin-solver-pass/index.js';
import { reserveSolverBudget as __doeFn_reserveSolverBudget } from '../../layout/reserve-solver-budget/index.js';
import { solverBudgetAvailable as __doeFn_solverBudgetAvailable } from '../../layout/solver-budget-available/index.js';
import { collectionItemCount as __doeFn_collectionItemCount } from '../../layout/collection-item-count/index.js';
import { clusterEligibility as __doeFn_clusterEligibility } from '../../layout/cluster-eligibility/index.js';
import { clusterTogether as __doeFn_clusterTogether } from '../../layout/cluster-together/index.js';
import { reorientSiblingGroup as __doeFn_reorientSiblingGroup } from '../../layout/reorient-sibling-group/index.js';
import { setAncestorGroupAxis as __doeFn_setAncestorGroupAxis } from '../../layout/set-ancestor-group-axis/index.js';
import { liftToAncestor as __doeFn_liftToAncestor } from '../../layout/lift-to-ancestor/index.js';
import { applyLayoutIntent as __doeFn_applyLayoutIntent } from "../../edit/apply-layout-intent/index.js";
import { collapseDegenerateCompressionGroups as __doeFn_collapseDegenerateCompressionGroups } from '../../layout/collapse-degenerate-compression-groups/index.js';
import { balancedAutoGridColumns as __doeFn_balancedAutoGridColumns } from '../../layout/balanced-auto-grid-columns/index.js';
import { columnNodeMinimum as __doeFn_columnNodeMinimum } from '../../layout/column-node-minimum/index.js';
import { nextCollectionColumnCount as __doeFn_nextCollectionColumnCount } from '../../layout/next-collection-column-count/index.js';
import { previousCollectionColumnCount as __doeFn_previousCollectionColumnCount } from '../../layout/previous-collection-column-count/index.js';
import { nodeLayoutProfile as __doeFn_nodeLayoutProfile } from '../../layout/node-layout-profile/index.js';
import { requiredLeafWidthForContext as __doeFn_requiredLeafWidthForContext } from '../../layout/required-leaf-width-for-context/index.js';
import { resolvedChildSpan as __doeFn_resolvedChildSpan } from '../../layout/resolved-child-span/index.js';
import { expandAutoGridSingletonSpans as __doeFn_expandAutoGridSingletonSpans } from '../../layout/expand-auto-grid-singleton-spans/index.js';
import { isHomogeneousCollectionGrid as __doeFn_isHomogeneousCollectionGrid } from '../../layout/is-homogeneous-collection-grid/index.js';
import { edgeMediaPosition as __doeFn_edgeMediaPosition } from '../../layout/edge-media-position/index.js';
import { edgeMediaShape as __doeFn_edgeMediaShape } from '../../layout/edge-media-shape/index.js';
import { edgeMediaContentAlign as __doeFn_edgeMediaContentAlign } from '../../layout/edge-media-content-align/index.js';
import { normalizeEdgeMediaRatio as __doeFn_normalizeEdgeMediaRatio } from '../../schema/normalize-edge-media-ratio/index.js';
import { setEdgeMediaPosition as __doeFn_setEdgeMediaPosition } from '../../layout/set-edge-media-position/index.js';
import { setEdgeMediaRatio as __doeFn_setEdgeMediaRatio } from '../../layout/set-edge-media-ratio/index.js';
import { setEdgeMediaShape as __doeFn_setEdgeMediaShape } from '../../layout/set-edge-media-shape/index.js';
import { setEdgeMediaContentAlign as __doeFn_setEdgeMediaContentAlign } from '../../layout/set-edge-media-content-align/index.js';
import { prepareEdgeMediaRoot as __doeFn_prepareEdgeMediaRoot } from '../../schema/prepare-edge-media-root/index.js';
import { reorderCollectionItems as __doeFn_reorderCollectionItems } from '../../layout/reorder-collection-items/index.js';
import { automaticItemColumnSequence as __doeFn_automaticItemColumnSequence } from '../../layout/automatic-item-column-sequence/index.js';
import { automaticCompositionRatioCandidates as __doeFn_automaticCompositionRatioCandidates } from '../../layout/automatic-composition-ratio-candidates/index.js';
import { automaticLocalDensityCandidates as __doeFn_automaticLocalDensityCandidates } from '../../layout/automatic-local-density-candidates/index.js';
import { builtinRepairCandidates as __doeFn_builtinRepairCandidates } from '../../layout/builtin-repair-candidates/index.js';
import { compositionDensityId as __doeFn_compositionDensityId } from '../../layout/composition-density-id/index.js';
import { typographyCompressionSizes as __doeFn_typographyCompressionSizes } from "../../typography/typography-compression-sizes/index.js";
import { applyTypographyCompression as __doeFn_applyTypographyCompression } from "../../typography/apply-typography-compression/index.js";
import { minimumFontPxForTypographyRole as __doeFn_minimumFontPxForTypographyRole } from "../../typography/minimum-font-px-for-typography-role/index.js";
import { candidateMinimumFontPx as __doeFn_candidateMinimumFontPx } from "../../typography/candidate-minimum-font-px/index.js";
import { resolveAssetRequest as __doeFn_resolveAssetRequest } from '../../layout/resolve-asset-request/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:10663
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.global.SlideEngine = {
    CANVAS: __doeScope.CANVAS,
    SCHEMA_CONTRACT: __doeScope.SCHEMA_CONTRACT,
    SOLVER_LIMITS: __doeScope.SOLVER_LIMITS,
    SPACING_TOKENS: __doeScope.SPACING_TOKENS,
    TYPOGRAPHY: __doeScope.TYPOGRAPHY,
    COMPOSITION_TYPOGRAPHY_SIZE_MODES: __doeScope.COMPOSITION_TYPOGRAPHY_SIZE_MODES,
    applyTypographySizeMode: __doeFn_applyTypographySizeMode,
    applyTypographyStyle: __doeFn_applyTypographyStyle,
    resolveColumnCount: __doeFn_resolveColumnCount,
    componentCategory: __doeFn_componentCategory,
    sanitizeStaticElement: __doeFn_sanitizeStaticElement,
    COMPOSITION_LIMITS: Object.freeze({
      maxItems: __doeScope.MAX_COMPOSITION_ITEMS,
      minimumFontPt: __doeScope.MIN_READABLE_FONT_PT,
      optionalMicroFontPt: __doeScope.MIN_MICRO_FONT_PT,
      minimumFontPx: __doeScope.MIN_READABLE_FONT_PX,
      scaleRule:
        "recursive reflow + density tokens; 11pt default, 8pt only by explicit textFit opt-in",
      minimumGapPt: 12,
      maximumDepth: __doeScope.MAX_COMPOSITION_DEPTH,
    }),
    COLLECTION_LIMITS: Object.freeze({
      maxItems: __doeScope.MAX_COLLECTION_ITEMS,
      maxColumns: 6,
      minimumFontPt: __doeScope.MIN_READABLE_FONT_PT,
      optionalMicroFontPt: __doeScope.MIN_MICRO_FONT_PT,
      overflowRule: "wrap, reflow, compact, split/continue; never overlap",
    }),
    EDGE_MEDIA_LIMITS: Object.freeze({
      positions: __doeScope.EDGE_MEDIA_POSITIONS,
      shapes: __doeScope.EDGE_MEDIA_SHAPES,
      contentAlignments: __doeScope.EDGE_MEDIA_CONTENT_ALIGNMENTS,
      sideRatio: __doeScope.EDGE_MEDIA_RATIO_BOUNDS.row,
      verticalRatio: __doeScope.EDGE_MEDIA_RATIO_BOUNDS.stack,
      overflowRule:
        "live-preflight each ratio and hold the last safe boundary; never crop content",
    }),
    SLIDE_BACKGROUND_LIMITS: Object.freeze({
      directions: Object.freeze(Object.keys(__doeScope.SLIDE_BACKGROUND_DIRECTIONS)),
      minimumOverlayOpacity: 0,
      maximumOverlayOpacity: 0.9,
      supportedPresets: Object.freeze([
        "flow",
        "narrative",
        "balanced",
        "dashboard",
      ]),
      edgeMediaRule:
        "page background is ignored when the resolved layout allows bleed",
    }),
    COMPRESSION_LIMITS: Object.freeze({
      maxItems: __doeScope.MAX_COMPOSITION_ITEMS,
      minimumFontPt: __doeScope.MIN_READABLE_FONT_PT,
      optionalMicroFontPt: __doeScope.MIN_MICRO_FONT_PT,
      minimumFontPx: __doeScope.MIN_READABLE_FONT_PX,
      scaleRule: "legacy alias of COMPOSITION_LIMITS",
    }),
    components: __doeScope.components,
    layouts: __doeScope.layouts,
    layoutPolicies: __doeScope.layoutPolicies,
    canCompressTypes(sourceType, targetType, availableWidth = 0) {
      return (0, __doeFn_compressionPairPolicy)(
        { type: sourceType },
        { type: targetType },
        availableWidth,
      );
    },
    canComposeTypes(
      sourceType,
      targetType,
      availableWidth = 0,
      direction = "auto",
    ) {
      const sourceKey = (0, __doeFn_collectionKey)({ type: sourceType });
      const targetKey = (0, __doeFn_collectionKey)({ type: targetType });
      if (sourceKey && sourceKey === targetKey) {
        return {
          allowed: true,
          mode: "collection",
          collectionKey: sourceKey,
          direction: direction === "stack" ? "stack" : "row",
        };
      }
      return (0, __doeFn_compositionPairPolicy)(
        { type: sourceType },
        { type: targetType },
        availableWidth,
        direction,
      );
    },
    canCollectTypes(sourceType, targetType) {
      const source = { type: sourceType };
      const target = { type: targetType };
      const sourceKey = (0, __doeFn_collectionKey)(source);
      const targetKey = (0, __doeFn_collectionKey)(target);
      return {
        allowed: Boolean(sourceKey && sourceKey === targetKey),
        collectionKey: sourceKey && sourceKey === targetKey ? sourceKey : null,
      };
    },
    solveCompressionTracks(
      componentTypes,
      availableWidth,
      gap = __doeScope.SPACING_TOKENS["18pt"],
      density = "comfortable",
    ) {
      const profiles = componentTypes.map((type) =>
        (0, __doeFn_compressionProfile)({ type }),
      );
      if (profiles.some((profile) => !profile?.enabled)) {
        return { fits: false, widths: [], scales: [], reason: "组件不支持压缩" };
      }
      const allocation = (0, __doeFn_allocateProportionalWidths)(
        availableWidth,
        gap,
        profiles,
        density,
      );
      return allocation;
    },
    solveCompositionTracks(
      componentTypes,
      availableWidth,
      gap = __doeScope.SPACING_TOKENS["18pt"],
      density = "comfortable",
      ratio = "auto",
    ) {
      const profiles = componentTypes.map((type) =>
        (0, __doeFn_compositionProfile)({ type }),
      );
      if (profiles.some((profile) => !profile?.enabled)) {
        return { fits: false, widths: [], scales: [], reason: "组件不支持组合" };
      }
      return (0, __doeFn_allocateProportionalWidths)(
        availableWidth,
        Math.max(__doeScope.SPACING_TOKENS["12pt"], gap),
        profiles,
        density,
        ratio,
      );
    },
    applyIntent: __doeFn_reduceLayoutIntent,
    mount: __doeFn_mount,
    parse: __doeFn_parse,
    setAssetUrlResolver: __doeFn_setAssetUrlResolver,
    normalizeCollectionProps: __doeFn_normalizeCollectionProps,
    registerComponent: __doeFn_registerComponent,
    registerLayout: __doeFn_registerLayout,
    registerLayoutPolicy: __doeFn_registerLayoutPolicy,
    __testing: Object.freeze({
      applySlideBackgroundView: __doeFn_applySlideBackgroundView,
      beginSolverPass: __doeFn_beginSolverPass,
      reserveSolverBudget: __doeFn_reserveSolverBudget,
      solverBudgetAvailable: __doeFn_solverBudgetAvailable,
      collectionItemCount: __doeFn_collectionItemCount,
      collectionKey: __doeFn_collectionKey,
      clusterEligibility: __doeFn_clusterEligibility,
      clusterTogether: __doeFn_clusterTogether,
      reorientSiblingGroup: __doeFn_reorientSiblingGroup,
      setAncestorGroupAxis: __doeFn_setAncestorGroupAxis,
      liftToAncestor: __doeFn_liftToAncestor,
      applyLayoutIntent: __doeFn_applyLayoutIntent,
      collapseDegenerateCompressionGroups: __doeFn_collapseDegenerateCompressionGroups,
      balancedAutoGridColumns: __doeFn_balancedAutoGridColumns,
      columnNodeMinimum: __doeFn_columnNodeMinimum,
      nextCollectionColumnCount: __doeFn_nextCollectionColumnCount,
      previousCollectionColumnCount: __doeFn_previousCollectionColumnCount,
      nodeLayoutProfile: __doeFn_nodeLayoutProfile,
      requiredLeafWidthForContext: __doeFn_requiredLeafWidthForContext,
      resolvedChildSpan: __doeFn_resolvedChildSpan,
      expandAutoGridSingletonSpans: __doeFn_expandAutoGridSingletonSpans,
      isHomogeneousCollectionGrid: __doeFn_isHomogeneousCollectionGrid,
      edgeMediaPosition: __doeFn_edgeMediaPosition,
      edgeMediaShape: __doeFn_edgeMediaShape,
      edgeMediaContentAlign: __doeFn_edgeMediaContentAlign,
      normalizeEdgeMediaRatio: __doeFn_normalizeEdgeMediaRatio,
      setEdgeMediaPosition: __doeFn_setEdgeMediaPosition,
      setEdgeMediaRatio: __doeFn_setEdgeMediaRatio,
      setEdgeMediaShape: __doeFn_setEdgeMediaShape,
      setEdgeMediaContentAlign: __doeFn_setEdgeMediaContentAlign,
      prepareEdgeMediaRoot: __doeFn_prepareEdgeMediaRoot,
      reorderCollectionItems: __doeFn_reorderCollectionItems,
      automaticItemColumnSequence: __doeFn_automaticItemColumnSequence,
      automaticCompositionRatioCandidates: __doeFn_automaticCompositionRatioCandidates,
      automaticLocalDensityCandidates: __doeFn_automaticLocalDensityCandidates,
      allocateProportionalWidths: __doeFn_allocateProportionalWidths,
      builtinRepairCandidates: __doeFn_builtinRepairCandidates,
      compositionDensityId: __doeFn_compositionDensityId,
      typographyCompressionSizes: __doeFn_typographyCompressionSizes,
      applyTypographyCompression: __doeFn_applyTypographyCompression,
      minimumFontPxForTypographyRole: __doeFn_minimumFontPxForTypographyRole,
      candidateMinimumFontPx: __doeFn_candidateMinimumFontPx,
      resolveAssetRequest: __doeFn_resolveAssetRequest,
    }),
  };
}
