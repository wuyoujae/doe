import { retainKnownKeys as __doeFn_retainKnownKeys } from '../retain-known-keys/index.js';
import { normalizeSlideSize as __doeFn_normalizeSlideSize } from '../normalize-slide-size/index.js';
import { sanitizeNode as __doeFn_sanitizeNode } from '../sanitize-node/index.js';
import { normalizeSlideLayout as __doeFn_normalizeSlideLayout } from '../normalize-slide-layout/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1778
import { scope as __doeScope } from "../runtime/context/index.js";

export function sanitizePolicy(schema, context) {
    const slide = schema.slide;
    (0, __doeFn_retainKnownKeys)(slide, __doeScope.PUBLIC_SLIDE_PROPS, context.diagnostics, slide.id || null, "slide");
    slide.size = (0, __doeFn_normalizeSlideSize)(slide.size, context.diagnostics);
    slide.editor = typeof slide.editor === "boolean" ? slide.editor : true;
    if (!Array.isArray(slide.blocks) && Array.isArray(slide.components)) {
      slide.blocks = slide.components;
      delete slide.components;
      context.diagnostics.push({
        code: "components-renamed",
        level: "repair",
        message: "slide.components 已迁移为 slide.blocks",
      });
    }
    if (!Array.isArray(slide.blocks)) {
      context.diagnostics.push({
        code: "blocks-normalized",
        level: "repair",
        message: "slide.blocks 不是数组，已规范化为空数组",
      });
      slide.blocks = [];
    }
    slide.blocks = slide.blocks
      .filter((node) => node !== undefined && node !== null)
      .map((node, index) =>
        (0, __doeFn_sanitizeNode)(node, [index + 1], context.diagnostics),
      );
    if (!slide.blocks.length) {
      slide.blocks.push({
        id: "empty-slide-diagnostic",
        type: "unsupported",
        props: { requestedType: "empty-slide", originalProps: {} },
      });
      context.diagnostics.push({
        code: "empty-slide-preserved",
        level: "repair",
        message: "slide.blocks 为空，已插入诊断组件以避免渲染链路中断",
      });
    }
    slide.layout = (0, __doeFn_normalizeSlideLayout)(slide.layout, context.diagnostics, slide);
    return schema;
  }
