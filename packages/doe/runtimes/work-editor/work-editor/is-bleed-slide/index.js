import { currentSlide as __doeFn_currentSlide } from '../current-slide/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:868


export function isBleedSlide(slideValue = (0, __doeFn_currentSlide)()) {
    const preset = String(slideValue?.layout?.preset || "");
    return preset === "edge-media"
      || slideValue?.blocks?.some((block) => block.type === "layout-group" && block.layout?.variant === "edge-media")
      || /(^|-)bleed($|-)|split-(left|right|top|bottom)-bleed/.test(preset);
  }
