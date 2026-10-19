import { isBleedSlide as __doeFn_isBleedSlide } from '../../is-bleed-slide/index.js';
import { commitSlideSettings as __doeFn_commitSlideSettings } from '../../commit-slide-settings/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1561
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.elements.backgroundRemove.addEventListener("click", () => {
    if ((0, __doeFn_isBleedSlide)()) return;
    void (0, __doeFn_commitSlideSettings)("移除页面背景图片", (draft) => {
      delete draft.background;
    });
  });
}
