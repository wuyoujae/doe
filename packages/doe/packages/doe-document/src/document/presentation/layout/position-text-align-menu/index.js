// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1550
import { scope as __doeScope } from "../../runtime/context/index.js";

export function positionTextAlignMenu(menu, trigger, shell, state) {
    if (
      !menu ||
      !trigger ||
      !shell ||
      !state.slideElement ||
      menu.hidden ||
      !shell.isConnected
    ) {
      return;
    }
    const slideRect = state.slideElement.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    if (!slideRect.width || !menuRect.width || !menuRect.height) return;

    const scale = slideRect.width / __doeScope.CANVAS.renderWidth || 1;
    const safeScale = Math.max(scale, 0.05);
    const inset = 6 * scale;
    const gap = 7 * scale;
    const safeLeft = slideRect.left + inset;
    const safeRight = slideRect.right - inset;
    const safeTop = slideRect.top + inset;
    const safeBottom = slideRect.bottom - inset;

    // The menu is a sibling overlay of the toolbar, so the toolbar's scroll
    // viewport can never clip it or force the user to scroll to its choices.
    // Compute in screen pixels first, clamp to the fixed Slide, then translate
    // back into the selected shell's local coordinate system.
    let screenLeft =
      triggerRect.left + triggerRect.width / 2 - menuRect.width / 2;
    screenLeft = Math.min(
      Math.max(screenLeft, safeLeft),
      Math.max(safeLeft, safeRight - menuRect.width),
    );

    let placement = "bottom";
    let screenTop = triggerRect.bottom + gap;
    if (screenTop + menuRect.height > safeBottom) {
      placement = "top";
      screenTop = triggerRect.top - gap - menuRect.height;
    }
    screenTop = Math.min(
      Math.max(screenTop, safeTop),
      Math.max(safeTop, safeBottom - menuRect.height),
    );

    menu.dataset.placement = placement;
    menu.style.left = `${(screenLeft - shellRect.left) / safeScale}px`;
    menu.style.top = `${(screenTop - shellRect.top) / safeScale}px`;
  }
