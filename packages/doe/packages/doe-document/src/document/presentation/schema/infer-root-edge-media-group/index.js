import { normalizeBlock as __doeFn_normalizeBlock } from '../normalize-block/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1141
import { scope as __doeScope } from "../../runtime/context/index.js";

export function inferRootEdgeMediaGroup(blocks, warnings) {
    if (blocks.length !== 2) return null;
    const mediaIndex = blocks.findIndex(
      (block) => block.layout?.region === "media",
    );
    const contentIndex = blocks.findIndex(
      (block) => block.layout?.region === "content",
    );
    const media = blocks[mediaIndex];
    if (
      mediaIndex < 0 ||
      contentIndex < 0 ||
      mediaIndex === contentIndex ||
      media?.type === "layout-group" ||
      __doeScope.components.get(media?.type)?.supportsBleed !== true
    ) {
      return null;
    }

    const usedIds = new Set();
    const collectIds = (nodes) => {
      nodes.forEach((node) => {
        if (node?.id) usedIds.add(node.id);
        if (node?.type === "layout-group") collectIds(node.children || []);
      });
    };
    collectIds(blocks);
    let groupId = "implicit-edge-media-root";
    let suffix = 2;
    while (usedIds.has(groupId)) groupId = `implicit-edge-media-root-${suffix++}`;

    const mediaPosition = mediaIndex === 0 ? "left" : "right";
    warnings.push(
      "检测到唯一的根级 content/media 区域，已恢复为 edge-media 结构。",
    );
    return (0, __doeFn_normalizeBlock)(
      {
        id: groupId,
        type: "layout-group",
        kind: "container",
        layout: {
          variant: "edge-media",
          mediaPosition,
          gap: 0,
          align: "stretch",
          origin: "explicit",
          intent: "root-region-contract",
        },
        children: blocks,
      },
      [1],
      warnings,
    );
  }
