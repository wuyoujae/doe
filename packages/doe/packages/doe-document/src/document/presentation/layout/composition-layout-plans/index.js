import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8585
import { scope as __doeScope } from "../../runtime/context/index.js";

export function compositionLayoutPlans(state) {
    const layoutRect = state.layoutElement.getBoundingClientRect();
    const scaleX = layoutRect.width / Math.max(1, state.layoutElement.clientWidth);
    const scaleY = layoutRect.height / Math.max(1, state.layoutElement.clientHeight);
    const roundPt = (value) => Math.round(value * 100) / 100;
    return state.groupRecords
      .filter((group) => (0, __doeFn_isCompositionGroup)(group.node))
      .map((group) => {
        const groupRect = group.content.getBoundingClientRect();
        const rects = group.childShells.map((shell, index) => {
          const rect = shell.getBoundingClientRect();
          return {
            id: group.node.children[index]?.id || `child-${index + 1}`,
            x: roundPt(
              (rect.left - layoutRect.left) /
                Math.max(scaleX, 0.0001) /
                __doeScope.CSS_PIXELS_PER_POINT,
            ),
            y: roundPt(
              (rect.top - layoutRect.top) /
                Math.max(scaleY, 0.0001) /
                __doeScope.CSS_PIXELS_PER_POINT,
            ),
            width: roundPt(
              rect.width /
                Math.max(scaleX, 0.0001) /
                __doeScope.CSS_PIXELS_PER_POINT,
            ),
            height: roundPt(
              rect.height /
                Math.max(scaleY, 0.0001) /
                __doeScope.CSS_PIXELS_PER_POINT,
            ),
          };
        });
        const trackTotal = (group.trackWidths || []).reduce(
          (sum, track) => sum + track,
          0,
        );
        return {
          id: group.node.id,
          preset: group.node.layout.preset || "auto",
          direction: group.resolvedDirection,
          ratio:
            trackTotal > 0
              ? group.trackWidths.map(
                  (track) => Math.round((track / trackTotal) * 1000) / 1000,
                )
              : [],
          gapPt: roundPt(group.gap / __doeScope.CSS_PIXELS_PER_POINT),
          widthPt: roundPt(
            groupRect.width /
              Math.max(scaleX, 0.0001) /
              __doeScope.CSS_PIXELS_PER_POINT,
          ),
          heightPt: roundPt(
            groupRect.height /
              Math.max(scaleY, 0.0001) /
              __doeScope.CSS_PIXELS_PER_POINT,
          ),
          rects,
          safe: group.compressionFits !== false,
        };
      });
  }
