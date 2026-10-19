import { createThumbnail as __doeFn_createThumbnail } from '../create-thumbnail/index.js';
import { updateThumbnailCard as __doeFn_updateThumbnailCard } from '../update-thumbnail-card/index.js';
import { isEditorMeasurable as __doeFn_isEditorMeasurable } from '../is-editor-measurable/index.js';
import { deepClone as __doeFn_deepClone } from '../deep-clone/index.js';
import { trackMediaSettlement as __doeFn_trackMediaSettlement } from '../track-media-settlement/index.js';
import { slideMountOptions as __doeFn_slideMountOptions } from '../slide-mount-options/index.js';
import { publishLayoutDiagnostic as __doeFn_publishLayoutDiagnostic } from '../publish-layout-diagnostic/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1217
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function ensureThumbnailCoordinator() {
    if (__doeScope.state.thumbnailCoordinator) return __doeScope.state.thumbnailCoordinator;
    const factory = __doeScope.global.WorkSlideThumbnailCoordinator;
    if (!factory?.create) throw new Error("Slides 缩略图协调器未加载");
    __doeScope.state.thumbnailCoordinator = factory.create({
      filmstrip: __doeScope.elements.filmstrip,
      addElement: __doeScope.elements.add,
      createCard: __doeFn_createThumbnail,
      updateCard: __doeFn_updateThumbnailCard,
      getSlides: () => __doeScope.state.slides,
      canRunBackground: () => (
        __doeScope.state.formalDeckLoaded
        && !__doeScope.state.generation
        && !__doeScope.state.dirty
        && (0, __doeFn_isEditorMeasurable)()
        && !__doeScope.state.activeRendering
      ),
      observeVisibility: true,
      async renderInactive({ slide: sourceSlide, index, total, signal, stagingHost }) {
        const previewSlide = (0, __doeFn_deepClone)(sourceSlide);
        previewSlide.editor = false;
        const revision = __doeScope.state.formalDeckRevision;
        const mediaSettlement = (0, __doeFn_trackMediaSettlement)(stagingHost, signal);
        let result = null;
        try {
          result = await __doeScope.global.SlideEngine.mount(
            stagingHost,
            { version: 4, slide: previewSlide },
            {
              ...(0, __doeFn_slideMountOptions)(index, total),
              mode: "static", editable: false,
              theme: __doeScope.state.theme,
              signal,
            },
          );
          const mediaSettled = await mediaSettlement.wait(result);
          if (
            mediaSettled
            && !signal.aborted
            && revision === __doeScope.state.formalDeckRevision
            && __doeScope.state.slides[index]?.id === sourceSlide.id
          ) {
            (0, __doeFn_publishLayoutDiagnostic)(result, index, { revision });
          }
          return await result.captureStaticSnapshot();
        } finally {
          mediaSettlement.dispose();
          result?.dispose?.();
        }
      },
    });
    return __doeScope.state.thumbnailCoordinator;
  }
