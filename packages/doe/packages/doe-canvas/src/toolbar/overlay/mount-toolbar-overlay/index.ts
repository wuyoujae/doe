import { getOrCreateToolbarLayer } from "../get-or-create-toolbar-layer/index.ts";
import { toolbarAnchors } from "../../constants/index.ts";

export function mountToolbarOverlay(toolbar: HTMLElement) {
  const anchor = toolbar.parentElement;
  const slide = anchor?.closest<HTMLElement>('.schema-slide');
  if (!anchor || !slide) return;
  const layer = getOrCreateToolbarLayer(toolbar.ownerDocument);
  const alignTrigger = toolbar.querySelector<HTMLButtonElement>(
    '.text-edit-toolbar__align-trigger[aria-controls]',
  );
  const controlledMenu = alignTrigger?.getAttribute('aria-controls')
    ? toolbar.ownerDocument.getElementById(alignTrigger.getAttribute('aria-controls')!)
    : null;
  const alignMenu = controlledMenu instanceof toolbar.ownerDocument.defaultView!.HTMLElement
    && controlledMenu.classList.contains('text-edit-toolbar__align-menu')
    && controlledMenu.parentElement
    ? {
        menu: controlledMenu,
        parent: controlledMenu.parentElement,
        nextSibling: controlledMenu.nextSibling,
        style: controlledMenu.getAttribute('style'),
        placement: controlledMenu.getAttribute('data-placement'),
        hidden: controlledMenu.hidden,
      }
    : undefined;
  toolbarAnchors.set(toolbar, {
    anchor,
    slide,
    layer,
    nextSibling: toolbar.nextSibling,
    alignMenu,
  });
  toolbar.classList.add('doe-toolbar-preview--viewport-overlay');
  toolbar.dataset.anchorSelected = String(anchor.classList.contains('is-selected'));
  layer.append(toolbar);
  if (alignMenu) {
    alignMenu.menu.classList.add('doe-toolbar-preview__text-align-menu');
    alignMenu.menu.dataset.anchorSelected = toolbar.dataset.anchorSelected;
    layer.append(alignMenu.menu);
  }
}
