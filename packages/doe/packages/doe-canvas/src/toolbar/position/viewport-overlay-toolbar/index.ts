import { visibleSlideBounds } from "../../geometry/visible-slide-bounds/index.ts";
import { positionPopover } from "../popover/index.ts";
import { positionTextAlignMenuPreview } from "../text-align-menu-preview/index.ts";

export function positionViewportOverlayToolbar(
  toolbar: HTMLElement,
  anchor: HTMLElement,
  slide: HTMLElement,
) {
  const slideRect = slide.getBoundingClientRect();
  const anchorRect = anchor.getBoundingClientRect();
  if (!slideRect.width || !anchorRect.width) return;
  const inset = 10;
  const bounds = visibleSlideBounds(slide, inset);
  const { left: safeLeft, right: safeRight, top: safeTop, bottom: safeBottom } = bounds;
  toolbar.style.setProperty(
    '--doe-toolbar-max-width',
    `${bounds.width}px`,
  );

  const toolbarRect = toolbar.getBoundingClientRect();
  const toolbarWidth = toolbarRect.width || toolbar.offsetWidth;
  const toolbarHeight = toolbarRect.height || toolbar.offsetHeight;
  if (!toolbarWidth || !toolbarHeight) return;
  const forceBottom = toolbar.dataset.doeToolbarPreviewFamily === 'edge-media';
  const topGap = 12;
  const bottomGap = 8;
  const topCandidate = anchorRect.top - topGap - toolbarHeight;
  const bottomCandidate = anchorRect.bottom + bottomGap;
  const topFits = topCandidate >= safeTop;
  const bottomFits = bottomCandidate + toolbarHeight <= safeBottom;
  const availableTop = anchorRect.top - safeTop - topGap;
  const availableBottom = safeBottom - anchorRect.bottom - bottomGap;
  const placement = forceBottom || (!topFits && (bottomFits || availableBottom >= availableTop))
    ? 'bottom'
    : 'top';
  const unclampedTop = forceBottom
    ? safeBottom - toolbarHeight
    : placement === 'top'
      ? topCandidate
      : bottomCandidate;
  const screenTop = Math.min(
    Math.max(unclampedTop, safeTop),
    Math.max(safeTop, safeBottom - toolbarHeight),
  );
  const anchorCenter = forceBottom
    ? slideRect.left + slideRect.width / 2
    : anchorRect.left + anchorRect.width / 2;
  const centeredLeft = anchorCenter - toolbarWidth / 2;
  const screenLeft = Math.min(
    Math.max(centeredLeft, safeLeft),
    Math.max(safeLeft, safeRight - toolbarWidth),
  );

  toolbar.dataset.placement = placement;
  toolbar.style.left = `${screenLeft}px`;
  toolbar.style.top = `${screenTop}px`;
  toolbar
    .querySelectorAll<HTMLElement>('.doe-toolbar-preview__menu[data-open="true"]')
    .forEach(positionPopover);
  positionTextAlignMenuPreview(toolbar);
}
