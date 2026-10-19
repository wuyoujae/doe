import { reconcileFilmstrip as __doeFn_reconcileFilmstrip } from '../reconcile-filmstrip/index.js';
import { isEditorMeasurable as __doeFn_isEditorMeasurable } from '../is-editor-measurable/index.js';
import { ensureThumbnailCoordinator as __doeFn_ensureThumbnailCoordinator } from '../ensure-thumbnail-coordinator/index.js';
import { releaseActiveResult as __doeFn_releaseActiveResult } from '../release-active-result/index.js';
import { trackMediaSettlement as __doeFn_trackMediaSettlement } from '../track-media-settlement/index.js';
import { updateNavigation as __doeFn_updateNavigation } from '../update-navigation/index.js';
import { slideMountOptions as __doeFn_slideMountOptions } from '../slide-mount-options/index.js';
import { publishLayoutDiagnostic as __doeFn_publishLayoutDiagnostic } from '../publish-layout-diagnostic/index.js';
import { refreshActiveThumbnail as __doeFn_refreshActiveThumbnail } from '../refresh-active-thumbnail/index.js';
import { updateCanvasScale as __doeFn_updateCanvasScale } from '../update-canvas-scale/index.js';
import { decorateGenerationFocus as __doeFn_decorateGenerationFocus } from '../decorate-generation-focus/index.js';
import { post as __doeFn_post } from '../post/index.js';
import { syncSlideSettings as __doeFn_syncSlideSettings } from '../sync-slide-settings/index.js';
import { hasIndependentCanvases, renderContinuousSlides, setViewMode } from '../continuous-view/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1295
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export async function renderActiveSlide({ discardPrevious = false, revealContinuous = true } = {}) {
    if (hasIndependentCanvases()) return renderContinuousSlides();
    (0, __doeFn_reconcileFilmstrip)({ revealContinuous });
    if (!(0, __doeFn_isEditorMeasurable)()) {
      __doeScope.state.pendingDeckRender = true;
      return false;
    }
    const token = ++__doeScope.state.renderToken;
    const index = __doeScope.state.activeIndex;
    const slideId = __doeScope.state.slides[index]?.id;
    const coordinator = (0, __doeFn_ensureThumbnailCoordinator)();
    const revision = __doeScope.state.formalDeckRevision;
    __doeScope.state.activeRendering = true;
    coordinator.cancelBackground();
    let controller = null;
    let mediaSettlement = null;
    let mountedResult = null;
    let editorReady = false;
    try {
      const previousResult = __doeScope.state.activeResult;
      if (previousResult && !discardPrevious) {
        await previousResult.flushPendingEdits?.();
        if (token !== __doeScope.state.renderToken) return false;
      }
      (0, __doeFn_releaseActiveResult)();
      controller = new AbortController();
      __doeScope.state.activeMountAbortController = controller;
      mediaSettlement = (0, __doeFn_trackMediaSettlement)(__doeScope.elements.canvas, controller.signal);
      __doeScope.elements.loading.hidden = __doeScope.state.viewMode === 'continuous';
      __doeScope.elements.canvas.replaceChildren();
      (0, __doeFn_updateNavigation)();
      const result = await __doeScope.elements.frame.mount(
        { version: 4, slide: __doeScope.state.slides[index] },
        {
          ...(0, __doeFn_slideMountOptions)(index),
          theme: __doeScope.state.theme,
          mode: __doeScope.state.hostReadOnly ? "present" : "editable",
          signal: controller.signal,
        },
      );
      if (
        token !== __doeScope.state.renderToken
        || controller.signal.aborted
        || slideId !== __doeScope.state.slides[__doeScope.state.activeIndex]?.id
        || !(0, __doeFn_isEditorMeasurable)()
      ) {
        result.dispose?.();
        __doeScope.state.pendingDeckRender = true;
        return false;
      }
      __doeScope.state.activeResult = result;
      mountedResult = result;
      __doeScope.state.activeResultRevision = revision;
      __doeScope.state.slides[index] = result.slide;
      const mediaSettled = __doeScope.state.generation
        ? false
        : await mediaSettlement.wait(result);
      if (
        token !== __doeScope.state.renderToken
        || controller.signal.aborted
        || revision !== __doeScope.state.formalDeckRevision
        || result !== __doeScope.state.activeResult
      ) {
        if (result === __doeScope.state.activeResult) (0, __doeFn_releaseActiveResult)();
        else result.dispose?.();
        __doeScope.state.pendingDeckRender = true;
        return false;
      }
      if (mediaSettled) {
        (0, __doeFn_publishLayoutDiagnostic)(result, index, { requireActive: true, revision });
      }
      editorReady = true;
      (0, __doeFn_reconcileFilmstrip)();
      await (0, __doeFn_refreshActiveThumbnail)(result, index);
      if (token !== __doeScope.state.renderToken || result !== __doeScope.state.activeResult
        || revision !== __doeScope.state.formalDeckRevision) return false;
      __doeScope.elements.loading.hidden = true;
      (0, __doeFn_updateCanvasScale)();
      if (__doeScope.state.generation) (0, __doeFn_decorateGenerationFocus)(__doeScope.state.generation, false);
      (0, __doeFn_post)("active-slide-change", { index, total: __doeScope.state.slides.length });
      (0, __doeFn_syncSlideSettings)();
      return true;
    } catch (error) {
      if (token !== __doeScope.state.renderToken) return false;
      if (!editorReady && mountedResult === __doeScope.state.activeResult) (0, __doeFn_releaseActiveResult)();
      if (error?.name === "AbortError") return false;
      __doeScope.elements.loading.hidden = false;
      __doeScope.elements.loading.textContent = error?.message || "幻灯片渲染失败";
      if (__doeScope.state.generation) {
        (0, __doeFn_post)("generation-state", {
          generationId: __doeScope.state.generation.generationId,
          status: "error",
          message: __doeScope.elements.loading.textContent,
        });
      } else {
        (0, __doeFn_post)("error", { message: __doeScope.elements.loading.textContent });
      }
      return false;
    } finally {
      mediaSettlement?.dispose();
      if (controller && __doeScope.state.activeMountAbortController === controller) {
        __doeScope.state.activeMountAbortController = null;
      }
      if (token === __doeScope.state.renderToken) __doeScope.state.activeRendering = false;
      coordinator.resume();
      if (editorReady && token === __doeScope.state.renderToken
        && __doeScope.state.viewMode === 'continuous' && !hasIndependentCanvases()) {
        await setViewMode('continuous');
      }
    }
  }
