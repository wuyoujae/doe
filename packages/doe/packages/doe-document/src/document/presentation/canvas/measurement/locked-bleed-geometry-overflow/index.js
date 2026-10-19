import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from "../../../layout/is-edge-split-group/index.js";
import { computedPixelValue as __doeFn_computedPixelValue } from "../../../../../../../doe-canvas/src/measurement/computed-pixel-value/index.js";
import { containsId as __doeFn_containsId } from "../../../../../../../doe-core/src/operation/contains-id/index.js";
import { paintedRectForShell as __doeFn_paintedRectForShell } from "../../../../../../../doe-canvas/src/measurement/painted-rect-for-shell/index.js";
import { edgeMediaPosition as __doeFn_edgeMediaPosition } from "../../../layout/edge-media-position/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8166


export function lockedBleedGeometryOverflow(state) {
    const edgeRecord = state.groupRecords.find((group) =>
      (0, __doeFn_isEdgeSplitGroup)(group.node),
    );
    if (!edgeRecord) return null;

    const layoutRect = state.layoutElement.getBoundingClientRect();
    const scaleX = layoutRect.width / Math.max(1, state.layoutElement.clientWidth);
    const scaleY = layoutRect.height / Math.max(1, state.layoutElement.clientHeight);
    const contentNode = edgeRecord.node.children.find(
      (child) => child.layout?.region === "content",
    );
    const mediaIndex = edgeRecord.node.children.findIndex(
      (child) => child.layout?.region === "media",
    );
    const contentRecord = state.groupRecords.find(
      (group) => group.node === contentNode,
    );

    let overflowX = 0;
    let overflowY = 0;
    if (contentNode && contentRecord) {
      const contentRect = contentRecord.content.getBoundingClientRect();
      const safeBounds = {
        left:
          contentRect.left +
          (0, __doeFn_computedPixelValue)(contentRecord.content, "paddingLeft") * scaleX,
        right:
          contentRect.right -
          (0, __doeFn_computedPixelValue)(contentRecord.content, "paddingRight") * scaleX,
        top:
          contentRect.top +
          (0, __doeFn_computedPixelValue)(contentRecord.content, "paddingTop") * scaleY,
        bottom:
          contentRect.bottom -
          (0, __doeFn_computedPixelValue)(contentRecord.content, "paddingBottom") * scaleY,
      };
      state.leafRecords
        .filter((record) => (0, __doeFn_containsId)(contentNode, record.node.id))
        .forEach((record) => {
          const shellRect = record.shell.getBoundingClientRect();
          const paintedRect = (0, __doeFn_paintedRectForShell)(record.shell);
          // A component can retain a semantic minimum width after its grid
          // track becomes narrower. The shell still follows the track, while
          // the real title/card paint crosses into the bleed media. Measure
          // their union so the ratio guard stops at the last visually safe
          // position instead of accepting a shell-only false positive.
          const rect = {
            left: Math.min(shellRect.left, paintedRect.left),
            right: Math.max(shellRect.right, paintedRect.right),
            top: Math.min(shellRect.top, paintedRect.top),
            bottom: Math.max(shellRect.bottom, paintedRect.bottom),
          };
          const scrollOverflowX = Math.max(
            0,
            record.content.scrollWidth - record.shell.clientWidth,
            record.element.scrollWidth - record.shell.clientWidth,
          );
          const scrollOverflowY = Math.max(
            0,
            record.content.scrollHeight - record.shell.clientHeight,
            record.element.scrollHeight - record.shell.clientHeight,
          );
          overflowX = Math.max(
            overflowX,
            safeBounds.left - rect.left,
            rect.right - safeBounds.right,
            scrollOverflowX * scaleX,
          );
          overflowY = Math.max(
            overflowY,
            safeBounds.top - rect.top,
            rect.bottom - safeBounds.bottom,
            scrollOverflowY * scaleY,
          );
        });
    }

    const mediaShell = edgeRecord.childShells[mediaIndex];
    if (mediaShell) {
      const mediaPosition = (0, __doeFn_edgeMediaPosition)(edgeRecord.node);
      const mediaLeft = mediaShell.offsetLeft;
      const mediaTop = mediaShell.offsetTop;
      const mediaRightGap =
        edgeRecord.content.clientWidth -
        (mediaLeft + mediaShell.offsetWidth);
      const mediaBottomGap =
        edgeRecord.content.clientHeight -
        (mediaTop + mediaShell.offsetHeight);
      if (mediaPosition === "left" || mediaPosition === "right") {
        overflowX = Math.max(
          overflowX,
          Math.abs(mediaPosition === "left" ? mediaLeft : mediaRightGap) *
            scaleX,
        );
        overflowY = Math.max(
          overflowY,
          Math.abs(mediaTop) * scaleY,
          Math.abs(mediaBottomGap) * scaleY,
        );
      } else {
        overflowX = Math.max(
          overflowX,
          Math.abs(mediaLeft) * scaleX,
          Math.abs(mediaRightGap) * scaleX,
        );
        overflowY = Math.max(
          overflowY,
          Math.abs(mediaPosition === "top" ? mediaTop : mediaBottomGap) *
            scaleY,
        );
      }
    }

    return {
      overflowX: Math.max(0, overflowX) / Math.max(scaleX, 0.0001),
      overflowY: Math.max(0, overflowY) / Math.max(scaleY, 0.0001),
      mode: "locked-bleed-region-geometry",
    };
  }
