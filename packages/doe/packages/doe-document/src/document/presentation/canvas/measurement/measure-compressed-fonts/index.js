import { ancestorGroups as __doeFn_ancestorGroups } from "../../../layout/ancestor-groups/index.js";
import { isCompressionGroup as __doeFn_isCompressionGroup } from "../../../layout/is-compression-group/index.js";
import { compositionProfile as __doeFn_compositionProfile } from "../../../layout/composition-profile/index.js";
import { isRenderedTextCandidate as __doeFn_isRenderedTextCandidate } from "../../../../../../../doe-canvas/src/measurement/is-rendered-text-candidate/index.js";
import { hasDirectText as __doeFn_hasDirectText } from "../../../layout/has-direct-text/index.js";
import { candidateMinimumFontPx as __doeFn_candidateMinimumFontPx } from "../../../typography/candidate-minimum-font-px/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8121
import { scope as __doeScope } from "../../../runtime/context/index.js";
import { paintedScale } from '../../../layout/flow/compression/targets.js';

export function measureCompressedFonts(state) {
    let violations = 0;
    let minimumFontPx = Infinity;
    state.leafRecords.forEach((leaf) => {
      const groups = ((0, __doeFn_ancestorGroups)(state.slide.blocks, leaf.node.id) || []).filter(
        (group) => (0, __doeFn_isCompressionGroup)(group),
      );
      const closestGroup = groups[groups.length - 1];
      const profile = (0, __doeFn_compositionProfile)(leaf.node) || {};
      const minimumPt =
        profile.allowMicroText === true &&
        Number(closestGroup?.layout.textFit?.minBodyPt) <= __doeScope.MIN_MICRO_FONT_PT
          ? __doeScope.MIN_MICRO_FONT_PT
          : __doeScope.MIN_READABLE_FONT_PT;
      const minimumPx = minimumPt * __doeScope.CSS_PIXELS_PER_POINT;
      const diagramScale = Number(leaf.element.dataset.diagramScale) || 1;
      const contentFloor = leaf.definition.resolveLayoutContract?.(leaf.node.props || {})?.text?.minPt;
      [leaf.element, ...leaf.element.querySelectorAll("*")].forEach(
        (candidate) => {
          if (!(0, __doeFn_isRenderedTextCandidate)(candidate, state.flowCompression ? state.slideElement : undefined)) return;
          if (!(0, __doeFn_hasDirectText)(candidate)) return;
          const scale = state.flowCompression ? paintedScale(candidate) : 1;
          const fontSize = Number.parseFloat(
            getComputedStyle(candidate).fontSize,
          ) * diagramScale * scale;
          if (!Number.isFinite(fontSize)) return;
          minimumFontPx = Math.min(minimumFontPx, fontSize);
          let candidateFloor = (0, __doeFn_candidateMinimumFontPx)(candidate, Number.isFinite(contentFloor) ? contentFloor * __doeScope.CSS_PIXELS_PER_POINT : minimumPx);
          // Whole-component scaling preserves internal proportions. It is
          // governed by the cumulative 3x limit, never a second font-size floor.
          if (state.flowCompression) candidateFloor = 0;
          if (fontSize + 0.1 < candidateFloor) violations += 1;
        },
      );
    });
    return {
      violations,
      minimumFontPx:
        minimumFontPx === Infinity
          ? null
          : Math.round(minimumFontPx * 100) / 100,
    };
  }
