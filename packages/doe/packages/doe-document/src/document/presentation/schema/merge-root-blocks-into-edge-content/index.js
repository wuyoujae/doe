// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1095
import { scope as __doeScope } from "../../runtime/context/index.js";

export function mergeRootBlocksIntoEdgeContent(blocks, edgeGroup, warnings) {
    const edgeIndex = blocks.indexOf(edgeGroup);
    const before = blocks.slice(0, edgeIndex);
    const after = blocks.slice(edgeIndex + 1);
    const contentIndex = edgeGroup.children.findIndex(
      (child) => child.layout?.region === "content",
    );
    const currentContent = edgeGroup.children[contentIndex];
    if (!currentContent) return blocks;

    if (currentContent.type === "layout-group") {
      currentContent.children = [
        ...before,
        ...currentContent.children,
        ...after,
      ];
    } else {
      currentContent.layout.region = null;
      edgeGroup.children[contentIndex] = {
        id: `${edgeGroup.id}-content-stack`,
        type: "layout-group",
        kind: "container",
        layout: {
          variant: "stack",
          direction: "stack",
          gap: "18pt",
          align: "stretch",
          region: "content",
          origin: "implicit",
          textFit: {
            mode: "readable",
            minBodyPt: __doeScope.MIN_READABLE_FONT_PT,
            optionalMinBodyPt: __doeScope.MIN_MICRO_FONT_PT,
          },
        },
        children: [...before, currentContent, ...after],
      };
    }
    if (blocks.length > 1) {
      warnings.push(
        `${edgeGroup.id} 之外的 ${blocks.length - 1} 个根块已自动并入 content 区域。`,
      );
    }
    return [edgeGroup];
  }
