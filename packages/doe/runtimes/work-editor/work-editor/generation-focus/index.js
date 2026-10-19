// Origin: public/yrkie-doe/work-editor/work-editor.js:636


export function generationFocus(slide, generation) {
    const slideId = typeof slide?.id === "string" ? slide.id : "";
    const blockIds = Array.isArray(slide?.blocks)
      ? slide.blocks.flatMap((block) =>
          typeof block?.id === "string" && block.id ? [block.id] : [],
        )
      : [];
    const previous = generation.renderedBlockIdsBySlide.get(slideId) || new Set();
    const arrivingIds = blockIds.filter((blockId) => !previous.has(blockId));
    return {
      slideId,
      blockIds,
      blockId: arrivingIds.at(-1) || blockIds.at(-1) || "",
      animate: arrivingIds.length > 0,
    };
  }
