// Origin: layout-engine/components.js; preserves definition evaluation and property order.

import { validate } from '../schema/validate/index.js';
import { render } from '../render/render/index.js';

export function createDefinition() {
  return {
    category: "base",
    columnMinWidth: 240,
    defaultSpan: "full",
    minWidth: 420,
    editorControls: {
      label: "标题",
      groups: [{
        label: "样式",
        prop: "variant",
        defaultValue: "section",
        options: [
          { label: "分隔线", value: "section" },
          { label: "纯文字", value: "plain" },
          { label: "大标题", value: "display" },
        ],
      }],
    },
    validate,
    render,
  };
}
