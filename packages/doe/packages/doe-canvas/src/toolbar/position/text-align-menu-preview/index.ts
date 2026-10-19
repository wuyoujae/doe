import { toolbarAnchors } from "../../constants/index.ts";
import { visibleSlideBounds } from "../../geometry/visible-slide-bounds/index.ts";

export function positionTextAlignMenuPreview(toolbar: HTMLElement) {
  const record = toolbarAnchors.get(toolbar);
  const menu = record?.alignMenu?.menu;
  const trigger = toolbar.querySelector<HTMLElement>('.text-edit-toolbar__align-trigger');
  const slide = record?.slide;
  if (!record || !menu || !trigger || !slide || menu.hidden) return;

  const slideRect = slide.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  if (!slideRect.width || !menuRect.width || !menuRect.height) return;
  const inset = 8;
  const gap = 5;
  const { left: safeLeft, right: safeRight, top: safeTop, bottom: safeBottom } = visibleSlideBounds(slide, inset);
  let screenLeft = triggerRect.left + triggerRect.width / 2 - menuRect.width / 2;
  screenLeft = Math.min(
    Math.max(screenLeft, safeLeft),
    Math.max(safeLeft, safeRight - menuRect.width),
  );
  const bottomTop = triggerRect.bottom + gap;
  const topTop = triggerRect.top - gap - menuRect.height;
  const preferTop = toolbar.dataset.placement === 'bottom';
  let placement = preferTop ? 'top' : 'bottom';
  let screenTop = preferTop ? topTop : bottomTop;
  if (preferTop && screenTop < safeTop && bottomTop + menuRect.height <= safeBottom) {
    placement = 'bottom';
    screenTop = bottomTop;
  } else if (!preferTop && screenTop + menuRect.height > safeBottom) {
    placement = 'top';
    screenTop = topTop;
  }
  screenTop = Math.min(
    Math.max(screenTop, safeTop),
    Math.max(safeTop, safeBottom - menuRect.height),
  );
  menu.dataset.placement = placement;
  menu.style.left = `${screenLeft}px`;
  menu.style.top = `${screenTop}px`;
}
