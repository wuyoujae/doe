import { slide as __doeFn_slide } from '../slide/index.js';
import { scope as __doeScope } from '../../../../integrations/work/editor/runtime/context/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1146


export function blankSlide() {
    const suffix = Math.random().toString(36).slice(2, 8);
    return (0, __doeFn_slide)(`slide-${suffix}`, [
      {
        id: `heading-${suffix}`,
        type: "heading",
        props: { text: __doeScope.global.DOEWorkLocale?.t("newSlide") || "New slide", level: 1, divider: true },
      },
      {
        id: `text-${suffix}`,
        type: "text",
        props: {
          text: __doeScope.global.DOEWorkLocale?.t("newSlideBody") || "Drag this component to reposition it, or replace it when generating content.",
        },
      },
    ]);
  }
