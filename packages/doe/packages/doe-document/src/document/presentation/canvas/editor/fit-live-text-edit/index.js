import { settledGeometryOverflow as __doeFn_settledGeometryOverflow } from "../../measurement/settled-geometry-overflow/index.js";
import { positionSelectedTextToolbars as __doeFn_positionSelectedTextToolbars } from "../position-selected-text-toolbars/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5404
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function fitLiveTextEdit(session, state) {
    if (!session || session.finished || !session.target?.isConnected) return;
    const { target } = session;
    target.style.removeProperty("max-height");
    target.style.removeProperty("overflow-y");
    delete target.dataset.liveFitOverflow;

    const geometryFits = (fontSizePx) => {
      target.style.fontSize = `${fontSizePx.toFixed(2)}px`;
      void target.offsetHeight;
      const overflow = (0, __doeFn_settledGeometryOverflow)(state);
      return (
        overflow.overflowX <= __doeScope.GEOMETRY_ROUNDING_TOLERANCE_PX &&
        overflow.overflowY <= __doeScope.GEOMETRY_ROUNDING_TOLERANCE_PX
      );
    };

    const maximum = session.baseFontPx;
    // Keep the draft readable and the caret stable. The commit runs all
    // geometry/reflow candidates before the shared typography ladder.
    const resolved = maximum;
    const fits = geometryFits(maximum);

    session.resolvedFontPx = resolved;
    target.dataset.liveFitFontPt = (
      resolved / __doeScope.CSS_PIXELS_PER_POINT
    ).toFixed(2);
    if (!fits) {
      // Scroll an oversized draft inside the slide until it is committed.
      const overflow = (0, __doeFn_settledGeometryOverflow)(state);
      const lineHeight = Number.parseFloat(getComputedStyle(target).lineHeight);
      const minimumViewport = Number.isFinite(lineHeight) ? lineHeight * 2 : 32;
      const safeHeight = Math.max(
        minimumViewport,
        target.clientHeight - overflow.overflowY - 2,
      );
      target.style.maxHeight = `${safeHeight.toFixed(2)}px`;
      target.style.overflowY = "auto";
      target.dataset.liveFitOverflow = "true";
    }
    (0, __doeFn_positionSelectedTextToolbars)(state);
  }
