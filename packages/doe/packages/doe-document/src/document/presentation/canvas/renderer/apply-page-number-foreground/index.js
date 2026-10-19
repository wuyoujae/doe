import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from "../../../layout/is-edge-split-group/index.js";
import { edgeMediaPosition as __doeFn_edgeMediaPosition } from "../../../layout/edge-media-position/index.js";
import { resolveAutomaticBackgroundForeground as __doeFn_resolveAutomaticBackgroundForeground } from "../../../layout/resolve-automatic-background-foreground/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6996
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function applyPageNumberForeground(state) {
    delete state.slideElement.dataset.pageNumberForeground;
    if (!state.pageNumber?.enabled) return;
    const edgeGroup = state.slide.blocks.find((block) => (0, __doeFn_isEdgeSplitGroup)(block));
    if (!edgeGroup || (0, __doeFn_edgeMediaPosition)(edgeGroup) !== "right") return;
    const media = edgeGroup.children.find(
      (child) => child.layout?.region === "media" && child.type === "media",
    );
    const source = String(media?.props?.src || "").trim();
    if (!source) return;
    const requestedFit = String(media.props.fit || "auto").toLowerCase();
    const sampleFit = requestedFit === "cover" || requestedFit === "fill"
      ? requestedFit
      : "contain";

    const contrastRevision = (state.pageNumberContrastRevision || 0) + 1;
    state.pageNumberContrastRevision = contrastRevision;
    state.slideElement.dataset.pageNumberForeground = "dark";
    (0, __doeFn_resolveAutomaticBackgroundForeground)({
      src: source,
      fit: sampleFit,
      position: media.props.position,
      overlay: {
        color: __doeScope.global.PPTTheme.color("mask"),
        opacity: 0,
        direction: "bottom-right",
      },
    }).then((foreground) => {
      if (
        state.pageNumberContrastRevision !== contrastRevision ||
        !state.slideElement?.isConnected
      ) {
        return;
      }
      state.slideElement.dataset.pageNumberForeground = foreground;
    });
  }
