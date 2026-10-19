import { throwIfAborted as __doeFn_throwIfAborted } from "../../../../../../../doe-core/src/runtime/throw-if-aborted/index.js";
import { applyDensity as __doeFn_applyDensity } from "../../../layout/apply-density/index.js";
import { lockedBleedGeometryOverflow as __doeFn_lockedBleedGeometryOverflow } from "../locked-bleed-geometry-overflow/index.js";
import { findLocation as __doeFn_findLocation } from "../../../../../../../doe-core/src/operation/find-location/index.js";
import { ancestorGroups as __doeFn_ancestorGroups } from "../../../layout/ancestor-groups/index.js";
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from "../../../layout/is-edge-split-group/index.js";
import { requiredLeafWidthForContext as __doeFn_requiredLeafWidthForContext } from "../../../layout/required-leaf-width-for-context/index.js";
import { countOverlaps as __doeFn_countOverlaps } from "../../../../../../../doe-canvas/src/measurement/count-overlaps/index.js";
import { measureCompressedFonts as __doeFn_measureCompressedFonts } from "../measure-compressed-fonts/index.js";
import { isCompressionGroup as __doeFn_isCompressionGroup } from "../../../layout/is-compression-group/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8323
import { scope as __doeScope } from "../../../runtime/context/index.js";
import { paintedScale } from '../../../layout/flow/compression/targets.js';
import { measureCompressionPressure } from '../../../layout/flow/compression/pressure.js';

export function measureDensityContent(state, density) {
    (0, __doeFn_throwIfAborted)(state);
    if (state.solverPerformance) state.solverPerformance.measurements += 1;
    const applied = (0, __doeFn_applyDensity)(state, density);
    if (state.flowCompression?.version === 'local-v4') return measureCompressionPressure(state, density, applied);
    const lockedBleed =
      state.slide.layout.allowsBleed && state.slide.layout.lockSafeArea;
    const lockedGeometry = lockedBleed
      ? (0, __doeFn_lockedBleedGeometryOverflow)(state)
      : null;
    const boundaryInset = state.slide.layout.allowsBleed
      ? 0
      : applied.pagePadding;
    const boundaryBottomInset = state.slide.layout.allowsBleed
      ? 0
      : applied.pageBottomPadding;
    let contentBottom = boundaryBottomInset;
    let contentRight = boundaryInset;
    let minWidthViolations = 0;
    let componentOverflowX = 0;
    let componentOverflowY = 0;

    if (!lockedGeometry) {
      state.rootShells.forEach((shell) => {
        contentBottom = Math.max(
          contentBottom,
          shell.offsetTop + shell.offsetHeight,
        );
        contentRight = Math.max(
          contentRight,
          shell.offsetLeft + shell.offsetWidth,
        );
      });
    }
    state.leafRecords.forEach((record) => {
      const location = (0, __doeFn_findLocation)(state.slide.blocks, record.node.id);
      const parentGroup = location?.parentGroup;
      const ancestors = (0, __doeFn_ancestorGroups)(state.slide.blocks, record.node.id) || [];
      const belongsToBleedRegion =
        record.node.layout?.region === state.slide.layout.bleedRegion ||
        ancestors.some(
          (group) =>
            group.layout?.region === state.slide.layout.bleedRegion,
        );
      const intentionalBleedMedia =
        lockedBleed &&
        belongsToBleedRegion &&
        ancestors.some((group) => (0, __doeFn_isEdgeSplitGroup)(group));
      const requiredWidth = (0, __doeFn_requiredLeafWidthForContext)(
        record.definition,
        parentGroup,
        ancestors,
      );
      const contentBoundary = record.definition.resolveLayoutContract?.(record.node.props || {});
      const chartWidthFits = state.flowLayout ? record.element.dataset.chartWidthFits : undefined;
      if (
        !intentionalBleedMedia &&
        (chartWidthFits === 'false' || (chartWidthFits !== 'true' &&
        !(state.flowLayout && (contentBoundary?.text?.reflow ?? record.definition.layoutContract?.text?.reflow)) &&
        record.element.offsetWidth + 0.5 < (contentBoundary?.minWidth ?? requiredWidth)))
      ) {
        minWidthViolations += 1;
      }
      // A bleed media component is a crop viewport by definition. Its image may
      // have larger intrinsic paint bounds, but only the viewport geometry is
      // relevant to export safety. Editor handles and selection decoration live
      // outside this component and are intentionally excluded as well.
      if (!intentionalBleedMedia) {
        const paintScale = state.flowCompression ? paintedScale(record.element) : 1;
        const scaledCards = state.flowCompression && record.element.querySelector('.item-cards__surface[data-flow-paint-scale]');
        if (state.flowCompression) {
          for (const surface of record.element.querySelectorAll('.item-cards__surface[data-flow-paint-scale]')) {
            const scale = paintedScale(surface);
            // Quotes, tails and floating icons intentionally extend beyond the
            // surface into the item's reserved padding. Measure that complete
            // item; text still has to stay inside the surface's content box.
            const item = surface.parentElement;
            componentOverflowX = Math.max(componentOverflowX, item.scrollWidth - item.clientWidth);
            componentOverflowY = Math.max(componentOverflowY, item.scrollHeight - item.clientHeight);
            const rect = surface.getBoundingClientRect(), style = getComputedStyle(surface);
            const visualScale = rect.width / Math.max(1, surface.offsetWidth);
            const right = rect.right - (parseFloat(style.paddingRight) + parseFloat(style.borderRightWidth)) * visualScale;
            const bottom = rect.bottom - (parseFloat(style.paddingBottom) + parseFloat(style.borderBottomWidth)) * visualScale;
            for (const text of surface.querySelectorAll('[data-semantic-wrap]')) {
              const bounds = text.getBoundingClientRect();
              componentOverflowX = Math.max(componentOverflowX, (bounds.right - right) * scale / Math.max(.001, visualScale));
              componentOverflowY = Math.max(componentOverflowY, (bounds.bottom - bottom) * scale / Math.max(.001, visualScale));
            }
          }
        }
        const isTransparentTextPrimitive =
          __doeScope.TRANSPARENT_TEXT_COMPONENT_TYPES.has(record.node.type);
        if (scaledCards) {
          // Chromium scroll metrics can retain the unzoomed protrusion of a
          // quote/tail. Inspect painted descendants against the complete slot.
          const slot = record.shell.getBoundingClientRect();
          const viewportScale = slot.width / Math.max(1, record.shell.offsetWidth);
          for (const child of record.element.querySelectorAll('*')) {
            if (!child.getClientRects().length || child.closest('[data-slide-export-ignore], [hidden], defs')) continue;
            const rect = child.getBoundingClientRect();
            componentOverflowX = Math.max(componentOverflowX, (rect.right - slot.right) / viewportScale, (slot.left - rect.left) / viewportScale);
            componentOverflowY = Math.max(componentOverflowY, (rect.bottom - slot.bottom) / viewportScale, (slot.top - rect.top) / viewportScale);
          }
        }
        // Large text glyphs (notably CJK punctuation and descenders) can extend
        // a few pixels beyond the CSS line box. scrollHeight counts that ink as
        // overflow even though the auto-sized block-content/shell already owns
        // enough layout space. Measuring the text element against itself caused
        // false 3-6px failures and unnecessarily downgraded the whole slide.
        // Keep shell-based checks so a genuinely constrained text block still
        // fails, but ignore the harmless optical self-overhang.
        const elementSelfOverflowX = isTransparentTextPrimitive || scaledCards
          ? 0
          : (record.element.scrollWidth - record.element.clientWidth) * paintScale;
        const elementSelfOverflowY = isTransparentTextPrimitive || scaledCards
          ? 0
          : (record.element.scrollHeight - record.element.clientHeight) * paintScale;
        componentOverflowX = Math.max(
          componentOverflowX,
          elementSelfOverflowX,
          scaledCards ? 0 : record.content.scrollWidth - record.shell.clientWidth,
          scaledCards ? 0 : record.element.scrollWidth * paintScale - record.shell.clientWidth,
        );
        componentOverflowY = Math.max(
          componentOverflowY,
          elementSelfOverflowY,
          scaledCards ? 0 : record.content.scrollHeight - record.shell.clientHeight,
          scaledCards ? 0 : record.element.scrollHeight * paintScale - record.shell.clientHeight,
        );
      }
    });

    const allowedBottom =
      state.layoutElement.clientHeight - boundaryBottomInset;
    const allowedRight = state.layoutElement.clientWidth - boundaryInset;
    const layoutOverflowY = lockedGeometry
      ? 0
      : state.layoutElement.scrollHeight - state.layoutElement.clientHeight;
    const groupOverflowX = state.groupRecords.reduce(
      (maximum, group) =>
        Math.max(maximum, group.content.scrollWidth - group.content.clientWidth),
      0,
    );
    const rawOverflowX = lockedGeometry
      ? Math.max(0, lockedGeometry.overflowX)
      : Math.max(
          0,
          contentRight - allowedRight,
          groupOverflowX,
          componentOverflowX,
        );
    const rawOverflowY = lockedGeometry
      ? Math.max(0, lockedGeometry.overflowY)
      : Math.max(
          0,
          contentBottom - allowedBottom,
          layoutOverflowY,
          componentOverflowY,
        );
    // A table row, its 1px border and the scaled 960pt canvas can land on
    // different device-pixel boundaries. The resulting scroll metric is often
    // 1-3 CSS pixels even when every painted edge is still inside its slot.
    // Treat that rounding noise as safe; genuine content overflow remains well
    // above this narrow tolerance and is still reported normally.
    const overflowTolerance = __doeScope.GEOMETRY_ROUNDING_TOLERANCE_PX;
    const overflowX = rawOverflowX <= overflowTolerance ? 0 : rawOverflowX;
    const overflowY = rawOverflowY <= overflowTolerance ? 0 : rawOverflowY;
    const overlaps = (0, __doeFn_countOverlaps)(state.siblingSets);
    const compressedFonts = (0, __doeFn_measureCompressedFonts)(state);
    const semanticWrapViolations = state.layoutElement.querySelectorAll(
      '[data-semantic-wrap-status="blocked"]:not([data-semantic-editing="true"])',
    ).length;
    const diagramFitViolations = state.leafRecords.filter(record => record.element.dataset.diagramFits === "false").length;
    const compressionFitViolations = state.groupRecords.filter(
      (group) => (0, __doeFn_isCompressionGroup)(group.node) && !group.compressionFits,
    ).length + diagramFitViolations;
    const fits =
      overflowX <= 1 &&
      overflowY <= 1 &&
      minWidthViolations === 0 &&
      compressionFitViolations === 0 &&
      semanticWrapViolations === 0 &&
      compressedFonts.violations === 0 &&
      overlaps === 0;
    const unusedHeight = lockedGeometry
      ? 0
      : Math.max(0, allowedBottom - contentBottom);
    const densityIndex = __doeScope.DENSITIES.indexOf(density);
    const score =
      (fits ? 0 : 1_000_000) +
      overflowY * 10_000 +
      overflowX * 10_000 +
      minWidthViolations * 50_000 +
      compressionFitViolations * 100_000 +
      semanticWrapViolations * 100_000 +
      compressedFonts.violations * 100_000 +
      overlaps * 100_000 +
      densityIndex * 8_000 +
      unusedHeight * 0.2;

    return {
      density: density.id,
      densityIndex,
      fits,
      overflowX: Math.ceil(overflowX),
      overflowY: Math.ceil(overflowY),
      pageOverflowY: Math.ceil(Math.max(0, contentBottom - allowedBottom, layoutOverflowY)),
      overlaps,
      minWidthViolations,
      compressionFitViolations,
      diagramFitViolations,
      semanticWrapViolations,
      componentOverflowX: Math.ceil(Math.max(0, componentOverflowX)),
      componentOverflowY: Math.ceil(Math.max(0, componentOverflowY)),
      minFontViolations: compressedFonts.violations,
      minimumFontPx: compressedFonts.minimumFontPx,
      unusedHeight: Math.ceil(unusedHeight),
      measurementMode: lockedGeometry?.mode || "flow-scroll-metrics",
      bleedGeometry: lockedGeometry,
      score,
      spacing: applied,
    };
  }
