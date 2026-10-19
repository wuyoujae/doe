// Origin: layout-engine/components.js; preserves definition evaluation and property order.

import { createComposition } from '../layout/composition/index.js';
import { createSlotSpace } from '../layout/slot-space/index.js';
import { validate } from '../schema/validate/index.js';
import { render } from '../render/render/index.js';
import { adapt } from '../render/adapt/index.js';

export function createDefinition() {
  return {
    category: "base",
    // Filled media is a viewport owned by its row; natural media remains
    // content-sized so explicit vertical alignment still applies to it.
    rowSlotMode: "filled-media",
    defaultSpan: "full",
    minWidth: 320,
    family: "media",
    supportsBleed: true,
    composition: createComposition(),
    slotSpace: createSlotSpace(),
    editorControls: {
      label: "图片",
      groups: [
        {
          label: "格式",
          prop: "format",
          defaultValue: "auto",
          options: [
            { label: "自动", value: "auto" },
            { label: "GIF 动图", value: "gif" },
          ],
        },
        {
          label: "填充",
          prop: "fit",
          defaultValue: "auto",
          options: [
            { label: "自动", value: "auto" },
            { label: "原比例", value: "natural" },
            { label: "拉伸铺满", value: "fill" },
            { label: "等比裁切", value: "cover" },
            { label: "完整适配", value: "contain" },
          ],
        },
        {
          label: "比例",
          prop: "aspectRatio",
          defaultValue: "auto",
          options: [
            { label: "自动", value: "auto" },
            { label: "1:1", value: "1:1" },
            { label: "4:3", value: "4:3" },
            { label: "3:4", value: "3:4" },
            { label: "16:9", value: "16:9" },
            { label: "9:16", value: "9:16" },
          ],
        },
        {
          label: "焦点",
          prop: "position",
          defaultValue: "50% 50%",
          options: [
            { label: "左上", value: "0% 0%" },
            { label: "上", value: "50% 0%" },
            { label: "右上", value: "100% 0%" },
            { label: "左", value: "0% 50%" },
            { label: "中", value: "50% 50%" },
            { label: "右", value: "100% 50%" },
            { label: "左下", value: "0% 100%" },
            { label: "下", value: "50% 100%" },
            { label: "右下", value: "100% 100%" },
          ],
        },
      ],
    },
    validate,
    render,
    adapt,
  };
}
