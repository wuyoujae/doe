import { toolbarAnchors } from "../../constants/index.ts";
import { closeTextAlignMenu } from "../../menu/close-text-align-menu/index.ts";
import { positionViewportOverlayToolbar } from "../viewport-overlay-toolbar/index.ts";
import { canvasScale } from "../../geometry/canvas-scale/index.ts";
import { positionPopover } from "../popover/index.ts";
import { visibleSlideBounds } from "../../geometry/visible-slide-bounds/index.ts";

export function positionToolbarPreview(toolbar: HTMLElement) {
  const anchorRecord = toolbarAnchors.get(toolbar);
  const shell = anchorRecord?.anchor ?? toolbar.parentElement;
  const slide = anchorRecord?.slide ?? toolbar.closest<HTMLElement>('.schema-slide');
  if (!shell || !slide) return;
  let isSelected = !shell.closest('[hidden], [inert]') &&
    (shell.classList.contains('is-selected') || shell.classList.contains('is-item-selected')) &&
    (!shell.classList.contains('has-selected-item') || toolbar.classList.contains('text-edit-toolbar'));
  const stage = slide.closest('.work-editor__continuous-page')?.closest('.work-editor__stage');
  if (isSelected && stage) {
    const anchor = shell.getBoundingClientRect(), clip = stage.getBoundingClientRect();
    const visible = visibleSlideBounds(slide, 0);
    isSelected = Math.min(anchor.right, clip.right, visible.right) > Math.max(anchor.left, clip.left, visible.left)
      && Math.min(anchor.bottom, clip.bottom, visible.bottom) > Math.max(anchor.top, clip.top, visible.top);
  }
  if (anchorRecord) toolbar.dataset.anchorSelected = String(isSelected);
  if (anchorRecord?.alignMenu) {
    anchorRecord.alignMenu.menu.dataset.anchorSelected = String(isSelected);
    if (!isSelected) closeTextAlignMenu(anchorRecord.alignMenu.menu);
  }
  if (!isSelected) return;
  toolbar.style.setProperty('--doe-toolbar-shift', '0px');
  toolbar.style.setProperty('--doe-toolbar-y-shift', '0px');
  if (anchorRecord) {
    positionViewportOverlayToolbar(toolbar, shell, slide);
    return;
  }
  const forceBottom = toolbar.dataset.doeToolbarPreviewFamily === 'edge-media';
  toolbar.dataset.placement = forceBottom ? 'bottom' : 'top';
  const slideRect = slide.getBoundingClientRect();
  const shellRect = shell.getBoundingClientRect();
  let toolbarRect = toolbar.getBoundingClientRect();
  if (!slideRect.width || !toolbarRect.width) return;
  const scale = Math.max(0.05, canvasScale(toolbar));
  const inset = 7 * scale;
  toolbar.style.setProperty(
    '--doe-toolbar-max-width',
    `${Math.max(180, (slideRect.width - inset * 2) / scale)}px`,
  );
  toolbarRect = toolbar.getBoundingClientRect();
  const safeTop = slideRect.top + inset;
  const safeBottom = slideRect.bottom - inset;
  if (!forceBottom && (toolbarRect.top < safeTop || toolbarRect.bottom > safeBottom)) {
    toolbar.dataset.placement = 'bottom';
    toolbarRect = toolbar.getBoundingClientRect();
    if (toolbarRect.bottom > safeBottom && shellRect.top - safeTop > safeBottom - shellRect.bottom) {
      toolbar.dataset.placement = 'top';
      toolbarRect = toolbar.getBoundingClientRect();
    }
  }

  let screenYShift = 0;
  if (toolbarRect.top < safeTop) screenYShift = safeTop - toolbarRect.top;
  else if (toolbarRect.bottom > safeBottom) screenYShift = safeBottom - toolbarRect.bottom;
  toolbar.style.setProperty('--doe-toolbar-y-shift', `${screenYShift / scale}px`);

  const placedRect = toolbar.getBoundingClientRect();
  let screenShift = 0;
  const safeLeft = slideRect.left + inset;
  const safeRight = slideRect.right - inset;
  if (placedRect.left < safeLeft) screenShift = safeLeft - placedRect.left;
  else if (placedRect.right > safeRight) screenShift = safeRight - placedRect.right;
  toolbar.style.setProperty('--doe-toolbar-shift', `${screenShift / scale}px`);
  toolbar
    .querySelectorAll<HTMLElement>('.doe-toolbar-preview__menu[data-open="true"]')
    .forEach(positionPopover);
}
