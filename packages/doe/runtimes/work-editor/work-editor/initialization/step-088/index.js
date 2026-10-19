import { customSelectEntry as __doeFn_customSelectEntry } from '../../custom-select-entry/index.js';
import { closeCustomSelects as __doeFn_closeCustomSelects } from '../../close-custom-selects/index.js';
import { openCustomSelect as __doeFn_openCustomSelect } from '../../open-custom-select/index.js';
import { closeCustomSelect as __doeFn_closeCustomSelect } from '../../close-custom-select/index.js';
import { commitPageNumberSettings as __doeFn_commitPageNumberSettings } from '../../commit-page-number-settings/index.js';
import { commitSlideSettings as __doeFn_commitSlideSettings } from '../../commit-slide-settings/index.js';
import { currentSlide as __doeFn_currentSlide } from '../../current-slide/index.js';
import { isBleedSlide as __doeFn_isBleedSlide } from '../../is-bleed-slide/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1498
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.elements.settings.querySelectorAll(".work-editor__custom-select").forEach((select) => {
    const trigger = select.querySelector(".work-editor__custom-select-trigger");
    const menu = (0, __doeFn_customSelectEntry)(select).menu;
    menu.addEventListener("click", (event) => event.stopPropagation());
    trigger.addEventListener("click", () => {
      const nextOpen = trigger.getAttribute("aria-expanded") !== "true";
      (0, __doeFn_closeCustomSelects)(select);
      if (nextOpen) (0, __doeFn_openCustomSelect)(select);
      else (0, __doeFn_closeCustomSelect)(select);
    });
    menu.querySelectorAll("[data-value]").forEach((option) => {
      option.addEventListener("click", () => {
        const value = option.dataset.value;
        const name = select.dataset.slideSelect;
        (0, __doeFn_closeCustomSelect)(select);
        if (name === "background-content-align" || name === "background-text-surface") {
          const slide = (0, __doeFn_currentSlide)();
          if (__doeScope.state.generation || !slide?.background?.src || slide.background.enabled === false || (0, __doeFn_isBleedSlide)(slide)) return;
          const surface = name === "background-text-surface";
          const prop = surface ? "textSurface" : "contentAlign";
          if (!(surface ? ["auto", "none"] : ["left", "center", "right"]).includes(value) || (slide.background[prop] || (surface ? "auto" : "center")) === value) return;
          void (0, __doeFn_commitSlideSettings)(surface ? "调整背景文字阅读底" : "调整背景内容位置", (draft) => {
            draft.background[prop] = value;
          }, __doeScope.state.activeResult);
          return;
        }
        if (name === "page-number-format") {
          void (0, __doeFn_commitPageNumberSettings)("更新页码类型", (draft) => {
            draft.format = value;
          });
          return;
        }
        void (0, __doeFn_commitSlideSettings)("更新页面背景", (draft) => {
          if (!draft.background) return;
          if (name === "background-fit") draft.background.fit = value;
          if (name === "background-position") draft.background.position = value;
          if (name === "background-direction") {
            draft.background.overlay = {
              opacity: Number(draft.background.overlay?.opacity) || 0,
              direction: value,
            };
          }
        });
      });
    });
  });
}
