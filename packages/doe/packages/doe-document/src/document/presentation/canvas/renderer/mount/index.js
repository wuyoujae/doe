import { resolveCanvasMode, applyCanvasMode } from '../../../../../../../doe-core/src/runtime/canvas-mode/index.js';
import { requestComponentInsertion } from '../../editor/insert-component/index.js';
import { resolveFlowLayout } from '../../../../../../../doe-component/src/layout/flow/contract.js';
import { createFlowTextPreview } from '../../../layout/flow/compression/live.js';
import { installOverflowTooltip } from '../../../../../../../doe-component/src/shared/chart/tooltip/text-overflow.js';
import { installDeletionKeyboard, requestDelete } from '../../editor/delete-content/index.js';
import { parse as __doeFn_parse } from "../../../schema/parse/index.js";
import { disposeMountedState as __doeFn_disposeMountedState } from "../dispose-mounted-state/index.js";
import { prepareAdaptiveV2Structure as __doeFn_prepareAdaptiveV2Structure } from "../../../layout/prepare-adaptive-v2-structure/index.js";
import { normalizeRuntimePageNumber as __doeFn_normalizeRuntimePageNumber } from "../../../schema/normalize-runtime-page-number/index.js";
import { throwIfAborted as __doeFn_throwIfAborted } from "../../../../../../../doe-core/src/runtime/throw-if-aborted/index.js";
import { rebuild as __doeFn_rebuild } from "../rebuild/index.js";
import { notify as __doeFn_notify } from "../../../../../../../doe-core/src/operation/notify/index.js";
import { isAbortError as __doeFn_isAbortError } from "../../../../../../../doe-core/src/runtime/is-abort-error/index.js";
import { updateSelection as __doeFn_updateSelection } from "../../editor/update-selection/index.js";
import { queueMutation as __doeFn_queueMutation } from "../../editor/transaction/queue-mutation/index.js";
import { moveBlock as __doeFn_moveBlock } from "../../../edit/move-block/index.js";
import { moveBlockToRoot as __doeFn_moveBlockToRoot } from "../../../edit/move-block-to-root/index.js";
import { compressTogether as __doeFn_compressTogether } from "../../../layout/compress-together/index.js";
import { composeTogether as __doeFn_composeTogether } from "../../../layout/compose-together/index.js";
import { collectTogether as __doeFn_collectTogether } from "../../../layout/collect-together/index.js";
import { applyLayoutIntent as __doeFn_applyLayoutIntent } from "../../../edit/apply-layout-intent/index.js";
import { splitCompressionGroup as __doeFn_splitCompressionGroup } from "../../../layout/split-compression-group/index.js";
import { splitCompositionGroup as __doeFn_splitCompositionGroup } from "../../../layout/split-composition-group/index.js";
import { updateCompositionLayout as __doeFn_updateCompositionLayout } from "../../../layout/update-composition-layout/index.js";
import { swapEdgeRegions as __doeFn_swapEdgeRegions } from "../../../layout/swap-edge-regions/index.js";
import { setEdgeMediaPosition as __doeFn_setEdgeMediaPosition } from "../../../layout/set-edge-media-position/index.js";
import { setEdgeMediaRatio as __doeFn_setEdgeMediaRatio } from "../../../layout/set-edge-media-ratio/index.js";
import { setEdgeMediaShape as __doeFn_setEdgeMediaShape } from "../../../layout/set-edge-media-shape/index.js";
import { setEdgeMediaContentAlign as __doeFn_setEdgeMediaContentAlign } from "../../../layout/set-edge-media-content-align/index.js";
import { findLocation as __doeFn_findLocation } from "../../../../../../../doe-core/src/operation/find-location/index.js";
import { isCompositionGroup as __doeFn_isCompositionGroup } from "../../../layout/is-composition-group/index.js";
import { isContentsGroup as __doeFn_isContentsGroup } from "../../../layout/is-contents-group/index.js";
import { contentsMaximumColumns as __doeFn_contentsMaximumColumns } from "../../../layout/contents-maximum-columns/index.js";
import { isCollectionGroup as __doeFn_isCollectionGroup } from "../../../layout/is-collection-group/index.js";
import { restoreContentsHistory as __doeFn_restoreContentsHistory } from "../../editor/transaction/restore-contents-history/index.js";
import { sanitizeStaticElement as __doeFn_sanitizeStaticElement } from "../sanitize-static-element/index.js";
import { whenSettled } from '../when-settled/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:10362
import { scope as __doeScope } from "../../../runtime/context/index.js";

export async function mount(target, schema, options = {}) {
    const host =
      typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error("SlideEngine.mount: 找不到目标容器。");

    const flowLayout = resolveFlowLayout(options.flowLayout);
    const parsed = (0, __doeFn_parse)(schema, { flowLayout });
    const mode = resolveCanvasMode(options, parsed.slide.editor ? 'editable' : 'present');
    parsed.slide.editor = mode === 'editable';
    (0, __doeFn_disposeMountedState)(__doeScope.mountedStates.get(host));
    const v2Canonicalization = flowLayout ? [] : (0, __doeFn_prepareAdaptiveV2Structure)(parsed.slide);
    const normalizeThemeId = __doeScope.global.PPTTheme?.normalizeThemeId;
    const requestedTheme =
      options.theme
      || schema?.deck?.theme
      || schema?.theme
      || schema?.slide?.theme;
    applyCanvasMode(host, mode);
    const state = {
      host, mode, flowLayout,
      // The old ladder is available only as a non-persisted Studio comparison.
      previewEnumTextFit: options.previewTextFit === 'enum' && mode === 'present',
      logo: Object.hasOwn(options, 'logo') ? options.logo : schema?.logo,
      slide: parsed.slide,
      theme: normalizeThemeId ? normalizeThemeId(requestedTheme) : "yrkie-theme",
      pageNumber: (0, __doeFn_normalizeRuntimePageNumber)(options.pageNumber || schema?.pageNumber),
      warnings: parsed.warnings,
      compilerDiagnostics: parsed.compilerDiagnostics || [],
      runtimeDiagnostics: [],
      selectedId: null,
      dragId: null,
      activeTextEdit: null,
      v2Canonicalization,
      localDensities: new Map(),
      spacingCompressionOverride: null,
      signal: options.signal || null,
      waitForFonts: options.waitForFonts !== false,
      disposed: false,
      renderEpoch: 0,
      mediaMetadataFrame: 0,
      mediaMetadataListener: null,
      queue: Promise.resolve(),
      result: null,
    };
    (0, __doeFn_throwIfAborted)(state);
    if (flowLayout && mode === 'editable') state.previewFlowText = createFlowTextPreview(state);
    if (flowLayout && mode !== 'static') state.overflowTooltipCleanup = installOverflowTooltip(host);
    if (state.slide.editor) state.deletionCleanup = installDeletionKeyboard(state);
    const handleMediaMetadata = () => {
      if (state.disposed || state.signal?.aborted) return;
      if (state.mediaMetadataRebuildQueued) return;
      state.mediaMetadataRebuildQueued = true;
      const schedule = __doeScope.global.requestAnimationFrame || ((callback) => callback());
      state.mediaMetadataFrame = schedule(() => {
        state.mediaMetadataFrame = 0;
        if (state.disposed || state.signal?.aborted) {
          state.mediaMetadataRebuildQueued = false;
          return;
        }
        state.mediaMetadataRebuildQueued = false;
        state.queue = state.queue
          .then(async () => {
            (0, __doeFn_throwIfAborted)(state);
            await (0, __doeFn_rebuild)(state);
            state.mediaMetadataError = null;
            // Intrinsic image metadata can change the selected media ratio,
            // row height, and even the final DOM node.  Publish that rebuilt
            // result just like an editor mutation so Studio/export never keeps
            // the detached pre-image element while the visible canvas has
            // already reflowed.
            (0, __doeFn_notify)(state, {
              rejected: false,
              action: "media-metadata-settled",
            });
          })
          .catch((error) => {
            if ((0, __doeFn_isAbortError)(error)) return;
            state.mediaMetadataError = error;
            state.runtimeDiagnostics.push({
              level: "warning",
              code: "media-metadata-reflow-failed",
              message: error.message,
            });
          });
      });
    };
    state.mediaMetadataListener = handleMediaMetadata;
    host.addEventListener("slideengine:media-metadata", handleMediaMetadata);
    __doeScope.mountedStates.set(host, state);
    const result = {
      element: null,
      layoutElement: null,
      report: null,
      slide: state.slide,
      warnings: state.warnings,
      compilerDiagnostics: state.compilerDiagnostics,
      runtimeDiagnostics: state.runtimeDiagnostics,
      renderEpoch: state.renderEpoch,
      async clearSelection() {
        if (state.disposed || !state.slide.editor) return;
        const selectedId = state.selectedId;
        const selectedItemKey = state.selectedItem?.key;
        const session = state.activeTextEdit;
        await session?.finish?.(true);
        await state.queue;
        if (state.disposed || state.signal?.aborted) return;
        // Do not clear a different selection made while a text commit was pending.
        if (state.selectedId && (state.selectedId !== selectedId || state.selectedItem?.key !== selectedItemKey)) return;
        if (state.activeTextEdit === session) await session?.finish?.(false);
        state.selectedId = null;
        (0, __doeFn_updateSelection)(state);
      },
      moveBlock(sourceId, targetId, position = "after") {
        return (0, __doeFn_queueMutation)(state, "移动组件", () =>
          (0, __doeFn_moveBlock)(state, sourceId, targetId, position),
        );
      },
      deleteContent(blockId, key) {
        return requestDelete(state, { blockId, key });
      },
      moveBlockToRoot(sourceId, position = "end") {
        return (0, __doeFn_queueMutation)(state, "移出组合", () =>
          (0, __doeFn_moveBlockToRoot)(state, sourceId, position),
        );
      },
      compressTogether(sourceId, targetId) {
        return (0, __doeFn_queueMutation)(state, "组合组件", () =>
          (0, __doeFn_compressTogether)(state, sourceId, targetId),
        );
      },
      composeTogether(
        sourceId,
        targetId,
        placement = "auto",
        direction = "auto",
      ) {
        return (0, __doeFn_queueMutation)(state, "组合组件", () =>
          (0, __doeFn_composeTogether)(
            state,
            sourceId,
            targetId,
            placement,
            direction,
          ),
        );
      },
      collectTogether(
        sourceId,
        targetId,
        placement = "auto",
        direction = "auto",
      ) {
        return (0, __doeFn_queueMutation)(state, "组成自适应集合", () =>
          (0, __doeFn_collectTogether)(
            state,
            sourceId,
            targetId,
            placement,
            direction,
          ),
        );
      },
      clusterTogether(
        sourceId,
        targetId,
        placement = "auto",
        direction = "auto",
      ) {
        return (0, __doeFn_queueMutation)(state, "组成局部组合", () =>
          (0, __doeFn_applyLayoutIntent)(state, {
            op: "cluster",
            sourceId,
            targetId,
            placement,
            direction,
          }),
        );
      },
      applyIntent(intent) {
        const labels = {
          cluster: "组成局部组合",
          reorient: "直接换轴并换序",
          axis: "直接切换容器方向",
          lift: "移出子组合",
          collect: "组成自适应集合",
          compose: "组合组件",
          "edge-media-position": "切换贴边媒体位置",
          "edge-media-ratio": "调整贴边媒体比例",
          "edge-media-content-align": "调整贴边内容对齐",
          "detach-root": "移出子组合",
        };
        return (0, __doeFn_queueMutation)(
          state,
          labels[intent?.op] || "更新布局意图",
          () => (0, __doeFn_applyLayoutIntent)(state, intent || {}),
        );
      },
      splitCompressionGroup(groupId) {
        return (0, __doeFn_queueMutation)(state, "拆分组合", () =>
          (0, __doeFn_splitCompressionGroup)(state, groupId),
        );
      },
      splitCompositionGroup(groupId) {
        return (0, __doeFn_queueMutation)(state, "拆分组合", () =>
          (0, __doeFn_splitCompositionGroup)(state, groupId),
        );
      },
      splitCollectionGroup(groupId) {
        return (0, __doeFn_queueMutation)(state, "拆分集合", () =>
          (0, __doeFn_splitCompositionGroup)(state, groupId),
        );
      },
      setCompositionLayout(groupId, updates) {
        return (0, __doeFn_queueMutation)(state, "更新组合布局", () =>
          (0, __doeFn_updateCompositionLayout)(state, groupId, updates || {}),
        );
      },
      swapEdgeRegions(sourceId, targetId) {
        return (0, __doeFn_queueMutation)(state, "切换贴边媒体位置", () =>
          (0, __doeFn_swapEdgeRegions)(state, sourceId, targetId),
        );
      },
      setEdgeMediaPosition(groupId, position, mediaRatio) {
        return (0, __doeFn_queueMutation)(state, `图片在${position}`, () =>
          (0, __doeFn_setEdgeMediaPosition)(state, groupId, position, mediaRatio),
        );
      },
      setEdgeMediaRatio(groupId, mediaRatio) {
        return (0, __doeFn_queueMutation)(state, "调整贴边媒体比例", () =>
          (0, __doeFn_setEdgeMediaRatio)(state, groupId, mediaRatio),
        );
      },
      setEdgeMediaShape(groupId, shape) {
        return (0, __doeFn_queueMutation)(state, `切换贴边媒体边界为 ${shape}`, () =>
          (0, __doeFn_setEdgeMediaShape)(state, groupId, shape),
        );
      },
      setEdgeMediaContentAlign(groupId, contentAlign) {
        return (0, __doeFn_queueMutation)(state, `贴边内容对齐为 ${contentAlign}`, () =>
          (0, __doeFn_setEdgeMediaContentAlign)(state, groupId, contentAlign),
        );
      },
      setGroupColumns(groupId, columns) {
        const requested = columns === "auto" ? "auto" : Number(columns);
        return (0, __doeFn_queueMutation)(
          state,
          requested === "auto" ? "切换为自动列" : `切换为${requested}列`,
          () => {
            const location = (0, __doeFn_findLocation)(state.slide.blocks, groupId);
            if (!location || location.node.type !== "layout-group") return false;
            if ((0, __doeFn_isCompositionGroup)(location.node) && !(0, __doeFn_isContentsGroup)(location.node)) return false;
            const maximum = (0, __doeFn_isContentsGroup)(location.node) ? (0, __doeFn_contentsMaximumColumns)(location.node) : Math.max(
              1,
              Math.min(6, Number(location.node.layout.maxColumns) || 4),
            );
            if (
              requested !== "auto" &&
              (!Number.isInteger(requested) ||
                requested < 1 ||
                requested > maximum)
            ) {
              return false;
            }
            location.node.layout.variant =
              location.node.layout.variant === "columns" ? "columns" : requested === "auto"
                ? "auto-grid"
                : requested === 1
                  ? "stack"
                  : "grid";
            location.node.layout.columns = requested;
            if ((0, __doeFn_isCollectionGroup)(location.node)) {
              location.node.layout.direction =
                requested === 1 ? "stack" : "row";
            }
            state.selectedId = groupId;
            return true;
          },
        );
      },
      clearInteractions() { state.host.dispatchEvent(new CustomEvent('doe:interaction-reset', { bubbles: true })); },
      flushPendingEdits() {
        const active = state.activeTextEdit;
        if (active?.finish) active.finish(true);
        if (active?.validationError) return Promise.reject(new Error(active.validationError));
        return state.queue;
      },
      insertComponent(request, isCurrent) { return requestComponentInsertion(state, request, isCurrent); },
      get contentsHistory() { return { undo: state.contentsUndo?.length || 0, redo: state.contentsRedo?.length || 0 }; },
      undoContentsReplacement() { return (0, __doeFn_restoreContentsHistory)(state, false); },
      redoContentsReplacement() { return (0, __doeFn_restoreContentsHistory)(state, true); },
      async captureStaticSnapshot() {
        (0, __doeFn_throwIfAborted)(state);
        await whenSettled(state);
        (0, __doeFn_throwIfAborted)(state);
        if (!state.slideElement) {
          throw new Error("SlideEngine.captureStaticSnapshot: 当前 Slide 尚未完成渲染。");
        }
        return {
          element: (0, __doeFn_sanitizeStaticElement)(state.slideElement.cloneNode(true)),
          renderEpoch: state.renderEpoch,
        };
      },
      whenSettled(options) { return whenSettled(state, options); },
      dispose() {
        state.activeTextEdit?.finish?.(false);
        (0, __doeFn_disposeMountedState)(state);
      },
    };
    state.result = result;
    try {
      state.queue = state.queue.then(() => (0, __doeFn_rebuild)(state));
      await state.queue;
      if (state.slide.editor) __doeScope.global.DOEContentsReplacement?.updateHistory?.(result);
      return result;
    } catch (error) {
      (0, __doeFn_disposeMountedState)(state);
      throw error;
    }
  }
