import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";

export function createScene() {
  return {
      id: "gallery-notice",
      name: "组件展厅 · 提示条",
      schema: (0, __doeFn_slide)("gallery-notice", [
        { id: "notice-title", type: "heading", props: { text: "提示条", level: 2 } },
        { id: "notice-example", type: "notice", props: { text: "请在提交前确认所有信息，修改后的内容会自动保存。" } },
      ]),
    };
}
