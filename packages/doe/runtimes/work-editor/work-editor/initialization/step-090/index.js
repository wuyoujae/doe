import { isBleedSlide as __doeFn_isBleedSlide } from '../../is-bleed-slide/index.js';
import { currentSlide as __doeFn_currentSlide } from '../../current-slide/index.js';
import { setSettingsOpen as __doeFn_setSettingsOpen } from '../../set-settings-open/index.js';
import { commitSlideSettings as __doeFn_commitSlideSettings } from '../../commit-slide-settings/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1541
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.elements.backgroundReplace.addEventListener("click", () => {
    const bridge = __doeScope.global.DOEContentEditor;
    const target = __doeScope.state.activeResult;
    if (!target || __doeScope.state.generation || (0, __doeFn_isBleedSlide)() || !bridge?.openBackground) return;
    const slideValue = (0, __doeFn_currentSlide)();
    (0, __doeFn_setSettingsOpen)(false);
    bridge.openBackground({
      element: __doeScope.elements.settingsTrigger || __doeScope.elements.backgroundReplace,
      props: { src: slideValue.background?.src || "", aspectRatio: `${slideValue.size?.width || __doeScope.CANVAS.width}:${slideValue.size?.height || __doeScope.CANVAS.height}` },
      async apply(props) {
        const src = typeof props.src === "string" ? props.src.trim() : "";
        if (!src) throw new Error(bridge.labels?.changed || "请选择图片。");
        await (0, __doeFn_commitSlideSettings)("更换页面背景图片", (draft) => {
          const previous = draft.background && typeof draft.background === "object" ? draft.background : {};
          draft.background = { fit: "cover", position: "50% 50%", foreground: "auto", overlay: { opacity: 0, direction: "to-right" }, ...previous, src };
        }, target);
      },
    });
  });
}
