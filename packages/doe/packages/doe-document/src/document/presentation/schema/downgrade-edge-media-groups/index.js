import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../../layout/is-edge-split-group/index.js';
import { edgeMediaAxis as __doeFn_edgeMediaAxis } from '../../layout/edge-media-axis/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1072


export function downgradeEdgeMediaGroups(node) {
    if (!node || node.type !== "layout-group") return;
    node.children.forEach(downgradeEdgeMediaGroups);
    if (!(0, __doeFn_isEdgeSplitGroup)(node)) return;
    const position = node.layout.mediaPosition || "right";
    const media = node.children.find((child) => child.layout?.region === "media");
    const content = node.children.find(
      (child) => child.layout?.region === "content",
    );
    if (media && content) {
      node.children = ["left", "top"].includes(position)
        ? [media, content]
        : [content, media];
      node.children.forEach((child) => {
        child.layout.region = null;
      });
    }
    node.layout.variant = "composition";
    node.layout.direction = (0, __doeFn_edgeMediaAxis)(position);
    node.layout.gap = "18pt";
    node.layout.intent = "edge-media-safe-fallback";
  }
