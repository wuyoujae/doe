import { toolbarAnchors } from "../../constants/index.ts";

export function restoreToolbarAnchor(toolbar: HTMLElement) {
  const record = toolbarAnchors.get(toolbar);
  if (!record) return;
  const insertionPoint = record.nextSibling?.parentNode === record.anchor
    ? record.nextSibling
    : null;
  record.anchor.insertBefore(toolbar, insertionPoint);
  if (record.alignMenu) {
    const { menu, parent, nextSibling, style, placement, hidden } = record.alignMenu;
    const menuInsertionPoint = nextSibling?.parentNode === parent ? nextSibling : null;
    parent.insertBefore(menu, menuInsertionPoint);
    menu.classList.remove('doe-toolbar-preview__text-align-menu');
    delete menu.dataset.anchorSelected;
    if (style === null) menu.removeAttribute('style');
    else menu.setAttribute('style', style);
    if (placement === null) delete menu.dataset.placement;
    else menu.dataset.placement = placement;
    menu.hidden = hidden;
  }
  toolbarAnchors.delete(toolbar);
  toolbar.classList.remove('doe-toolbar-preview--viewport-overlay');
  delete toolbar.dataset.anchorSelected;
  if (!record.layer.childElementCount) record.layer.remove();
}
