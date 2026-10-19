import { activeSlideId as __doeFn_activeSlideId } from '../active-slide-id/index.js';
import { slideIndexById as __doeFn_slideIndexById } from '../slide-index-by-id/index.js';
import { deleteSlide as __doeFn_deleteSlide } from '../delete-slide/index.js';
import { setActiveSlide as __doeFn_setActiveSlide } from '../set-active-slide/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1165
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function createThumbnail(slideId) {
    const item = document.createElement("div");
    item.className = "work-editor__thumb";
    item.dataset.slideId = slideId;
    item.setAttribute("aria-current", slideId === (0, __doeFn_activeSlideId)() ? "page" : "false");

    const preview = document.createElement("button");
    preview.type = "button";
    preview.className = "work-editor__thumb-preview";

    const number = document.createElement("span");
    number.className = "work-editor__thumb-number";

    const frame = document.createElement("span");
    frame.className = "work-editor__thumb-frame";
    const scale = document.createElement("span");
    scale.className = "work-editor__thumb-scale";
    const canvas = document.createElement("span");
    canvas.className = "work-editor__thumb-canvas";
    scale.append(canvas);
    frame.append(scale);
    preview.append(frame);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "work-editor__thumb-delete";
    deleteButton.title = "删除幻灯片";
    deleteButton.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/></svg>';
    deleteButton.hidden = __doeScope.state.slides.length <= 1;
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const index = (0, __doeFn_slideIndexById)(slideId);
      if (index >= 0) void (0, __doeFn_deleteSlide)(index);
    });

    item.append(preview, number, deleteButton);
    preview.addEventListener("click", () => {
      const index = (0, __doeFn_slideIndexById)(slideId);
      if (index >= 0) void (0, __doeFn_setActiveSlide)(index);
    });
    return { item, preview, number, deleteButton, canvas };
  }
