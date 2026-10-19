import canvas from '../../canvas/base-attributes/index.json' with { type: 'json' };
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:425


export function normalizeSlideSize(source, diagnostics) {
    if (source === undefined || source === null) {
      return { width: canvas.width, height: canvas.height, unit: canvas.unit };
    }
    const size = source && typeof source === "object" && !Array.isArray(source)
      ? source
      : {};
    const width = Number(size.width);
    const height = Number(size.height);
    const inferredUnit = size.unit ||
      (width === canvas.renderWidth && height === canvas.renderHeight ? "px" : "pt");
    const isPointCanvas =
      inferredUnit === "pt" && width === canvas.width && height === canvas.height;
    const isLegacyPixelCanvas =
      inferredUnit === "px" && width === canvas.renderWidth && height === canvas.renderHeight;
    if (isPointCanvas || isLegacyPixelCanvas) {
      return { width, height, unit: inferredUnit };
    }
    diagnostics.push({
      code: "invalid-slide-size-defaulted",
      level: "repair",
      message: `slide.size 不是当前文档的画布尺寸，已回退为 ${canvas.width}×${canvas.height}pt。`,
    });
    return { width: canvas.width, height: canvas.height, unit: canvas.unit };
  }
