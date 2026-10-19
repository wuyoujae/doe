import { activeSlideId as __doeFn_activeSlideId } from '../active-slide-id/index.js';
import { syncSlideSettings as __doeFn_syncSlideSettings } from '../sync-slide-settings/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1126
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function updateNavigation() {
    __doeScope.elements.previous.disabled = __doeScope.state.activeIndex <= 0;
    __doeScope.elements.next.disabled = __doeScope.state.activeIndex >= __doeScope.state.slides.length - 1;
    const selectedId = (0, __doeFn_activeSlideId)();
    [...__doeScope.elements.filmstrip.querySelectorAll(".work-editor__thumb")].forEach((item) => {
      item.setAttribute("aria-current", item.dataset.slideId === selectedId ? "page" : "false");
      const deleteButton = item.querySelector(".work-editor__thumb-delete");
      if (deleteButton) {
        deleteButton.hidden = __doeScope.state.slides.length <= 1;
        deleteButton.disabled = Boolean(__doeScope.state.hostReadOnly || __doeScope.state.generation);
      }
    });
    (0, __doeFn_syncSlideSettings)();
  }
