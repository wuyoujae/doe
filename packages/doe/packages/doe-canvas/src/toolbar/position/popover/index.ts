import { toolbarAnchors } from "../../constants/index.ts";
import { canvasScale } from "../../geometry/canvas-scale/index.ts";
import { visibleSlideBounds } from "../../geometry/visible-slide-bounds/index.ts";

export function positionPopover(menuRoot: HTMLElement) {
  const trigger = menuRoot.querySelector<HTMLElement>('.doe-toolbar-preview__trigger');
  const popover = menuRoot.querySelector<HTMLElement>('.doe-toolbar-preview__popover');
  const toolbar = menuRoot.closest<HTMLElement>('.doe-toolbar-preview');
  const anchorRecord = toolbar ? toolbarAnchors.get(toolbar) : null;
  const slide = anchorRecord?.slide ?? toolbar?.closest<HTMLElement>('.schema-slide');
  if (!trigger || !popover || !toolbar || !slide || popover.hidden) return;

  const scrollTop = popover.scrollTop;
  popover.style.removeProperty('left');
  popover.style.removeProperty('top');
  const scale = anchorRecord ? 1 : Math.max(0.05, canvasScale(toolbar));
  const menuRect = menuRoot.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  const inset = anchorRecord ? 10 : 7 * scale;
  const gap = anchorRecord ? 8 : 7 * scale;
  const bounds = visibleSlideBounds(slide, inset);
  const { left: safeLeft, right: safeRight, top: safeTop, bottom: safeBottom } = bounds;
  const layout = popover.dataset.layout || 'list';
  const columns = ({ compact: 2, positions: 2, grid: 3, focal: 3, 'edge-shapes': 5 } as Record<string, number>)[layout] || 1;
  popover.style.setProperty('--doe-toolbar-menu-columns', String(columns));
  popover.style.maxWidth = 'none';
  popover.style.maxHeight = 'none';
  const naturalWidth = popover.getBoundingClientRect().width;
  // Keep the spatial 3×3 focal grid; other menus can use fewer columns on narrow canvases.
  if (layout !== 'focal' && naturalWidth > bounds.width && columns > 1) {
    const fittedColumns = Math.max(1, Math.floor(columns * bounds.width / naturalWidth));
    popover.style.setProperty('--doe-toolbar-menu-columns', String(fittedColumns));
  }
  popover.style.setProperty('--doe-toolbar-menu-max-width', `${bounds.width / scale}px`);
  popover.style.removeProperty('max-width');
  const naturalHeight = popover.getBoundingClientRect().height;
  const availableTop = Math.max(0, triggerRect.top - gap - safeTop);
  const availableBottom = Math.max(0, safeBottom - triggerRect.bottom - gap);
  let placement = toolbar.dataset.placement === 'bottom' ? 'top' : 'bottom';
  if ((placement === 'top' ? availableTop : availableBottom) < naturalHeight) {
    placement = availableTop > availableBottom ? 'top' : 'bottom';
  }
  popover.style.setProperty('--doe-toolbar-menu-max-height', `${(placement === 'top' ? availableTop : availableBottom) / scale}px`);
  popover.style.removeProperty('max-height');
  const popoverRect = popover.getBoundingClientRect();

  let screenLeft = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;
  screenLeft = Math.min(
    Math.max(screenLeft, safeLeft),
    Math.max(safeLeft, safeRight - popoverRect.width),
  );
  const bottomTop = triggerRect.bottom + gap;
  const topTop = triggerRect.top - gap - popoverRect.height;
  let screenTop = placement === 'top' ? topTop : bottomTop;
  screenTop = Math.min(
    Math.max(screenTop, safeTop),
    Math.max(safeTop, safeBottom - popoverRect.height),
  );

  popover.dataset.placement = placement;
  popover.style.left = `${(screenLeft - menuRect.left) / scale}px`;
  popover.style.top = `${(screenTop - menuRect.top) / scale}px`;
  popover.scrollTop = scrollTop;
}
