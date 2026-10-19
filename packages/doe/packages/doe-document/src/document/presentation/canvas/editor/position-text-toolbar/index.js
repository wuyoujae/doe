import { positionTextAlignMenu as __doeFn_positionTextAlignMenu } from "../../../layout/position-text-align-menu/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1471
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function positionTextToolbar(toolbar, shell, state) {
    if (!toolbar || !shell || !state.slideElement || !shell.isConnected) return;
    toolbar.style.setProperty("--text-toolbar-shift", "0px");
    toolbar.style.setProperty("--text-toolbar-y-shift", "0px");
    toolbar.dataset.placement = "top";
    const slideRect = state.slideElement.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    let toolbarRect = toolbar.getBoundingClientRect();
    if (!slideRect.width || !toolbarRect.width) return;
    const scale = slideRect.width / __doeScope.CANVAS.renderWidth || 1;
    const inset = 6 * scale;
    toolbar.style.setProperty(
      "--text-toolbar-max-width",
      `${Math.max(160, (slideRect.width - inset * 2) / Math.max(scale, 0.05))}px`,
    );
    // Re-measure after applying the canvas-level cap. The selected component
    // never participates in toolbar sizing; only the fixed Slide can cap it.
    toolbarRect = toolbar.getBoundingClientRect();
    const safeTop = slideRect.top + inset;
    const safeBottom = slideRect.bottom - inset;
    const topFits = toolbarRect.top >= safeTop && toolbarRect.bottom <= safeBottom;

    // The element handle already occupies the top edge. Prefer the familiar
    // top placement when it is safe; otherwise flip below the component where
    // the toolbar can sit closer because it no longer shares the handle side.
    if (!topFits) {
      toolbar.dataset.placement = "bottom";
      toolbarRect = toolbar.getBoundingClientRect();
      const bottomFits =
        toolbarRect.top >= safeTop && toolbarRect.bottom <= safeBottom;
      if (!bottomFits) {
        const roomAbove = shellRect.top - safeTop;
        const roomBelow = safeBottom - shellRect.bottom;
        if (roomAbove > roomBelow) {
          toolbar.dataset.placement = "top";
          toolbarRect = toolbar.getBoundingClientRect();
        }
      }
    }

    // Very tall selections can leave neither side large enough. Keep the
    // control reachable by clamping it into the canvas instead of allowing a
    // toolbar to escape the fixed 960x540pt Slide.
    let screenYShift = 0;
    if (toolbarRect.top < safeTop) {
      screenYShift = safeTop - toolbarRect.top;
    } else if (toolbarRect.bottom > safeBottom) {
      screenYShift = safeBottom - toolbarRect.bottom;
    }
    toolbar.style.setProperty(
      "--text-toolbar-y-shift",
      `${screenYShift / Math.max(scale, 0.05)}px`,
    );

    const placedRect = toolbar.getBoundingClientRect();
    let screenShift = 0;
    const safeLeft = slideRect.left + inset;
    const safeRight = slideRect.right - inset;
    if (placedRect.left < safeLeft) {
      screenShift = safeLeft - placedRect.left;
    } else if (placedRect.right > safeRight) {
      screenShift = safeRight - placedRect.right;
    }
    toolbar.style.setProperty(
      "--text-toolbar-shift",
      `${screenShift / Math.max(scale, 0.05)}px`,
    );

    const openAlignMenu = shell.querySelector(
      ":scope > .text-edit-toolbar__align-menu:not([hidden])",
    );
    if (openAlignMenu) {
      const alignTrigger = toolbar.querySelector(
        ".text-edit-toolbar__align-trigger",
      );
      (0, __doeFn_positionTextAlignMenu)(openAlignMenu, alignTrigger, shell, state);
    }
  }
