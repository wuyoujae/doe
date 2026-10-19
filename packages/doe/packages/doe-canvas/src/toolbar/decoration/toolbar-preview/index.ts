import { toolbarFamily } from "../../dom/toolbar-family/index.ts";
import { decorateTextToolbar } from "../text-toolbar/index.ts";
import { addActionIcon } from "../../icon/add-action-icon/index.ts";
import { decorateMediaToolbar } from "../media-toolbar/index.ts";
import { decorateItemsToolbar } from "../items-toolbar/index.ts";
import { decorateCompositionToolbar } from "../composition-toolbar/index.ts";
import { decorateEdgeMediaToolbar } from "../edge-media-toolbar/index.ts";
import { decorateLayoutToolbar } from "../layout-toolbar/index.ts";
import { mountToolbarOverlay } from "../../overlay/mount-toolbar-overlay/index.ts";
import { toolbarAnchors } from "../../constants/index.ts";
import { closePreviewMenus } from "../../menu/close-preview-menus/index.ts";
import { positionToolbarPreview } from "../../position/toolbar-preview/index.ts";
import { closeAllMenus } from "../../menu/close-all-menus/index.ts";
import { closeTextAlignMenu } from "../../menu/close-text-align-menu/index.ts";
import { restoreToolbarAnchor } from "../../overlay/restore-toolbar-anchor/index.ts";

export function decorateToolbarPreview(toolbar: HTMLElement): (() => void) | null {
  if (toolbar.dataset.doeToolbarPreviewFamily) return null;
  const family = toolbarFamily(toolbar);
  if (!family) return null;
  const documentTarget = toolbar.ownerDocument;
  const documentView = documentTarget.defaultView;
  if (!documentView) return null;
  const originalChildren = [...toolbar.childNodes];
  const originalElements = originalChildren.filter(
    (node): node is Element => node instanceof documentView.Element,
  );
  const buttons = originalChildren.filter(
    (node): node is HTMLButtonElement => node instanceof documentView.HTMLButtonElement && !node.dataset.contentsReplace && !node.dataset.deleteContent && !node.dataset.timelineControl,
  );
  const cleanupCallbacks: Array<() => void> = [];
  const injectedNodes: Element[] = [];
  const originalStyle = toolbar.getAttribute('style');
  const originalPlacement = toolbar.getAttribute('data-placement');

  if (family !== 'text') toolbar.replaceChildren();
  toolbar.classList.add('doe-toolbar-preview');
  toolbar.dataset.doeToolbarPreviewFamily = family;

  if (family === 'text') {
    decorateTextToolbar(toolbar, cleanupCallbacks);
  } else if (family === 'content') {
    buttons.forEach(button => {
      addActionIcon(documentTarget, button, 'Pencil', injectedNodes, cleanupCallbacks);
      button.classList.remove('doe-toolbar-preview__action--icon-only');
      toolbar.append(button);
    });
  } else if (family === 'media') {
    decorateMediaToolbar(toolbar, originalChildren, cleanupCallbacks);
  } else if (family === 'items') {
    decorateItemsToolbar(toolbar, buttons, cleanupCallbacks);
  } else if (family === 'composition') {
    decorateCompositionToolbar(toolbar, buttons, cleanupCallbacks, injectedNodes);
  } else if (family === 'edge-media') {
    decorateEdgeMediaToolbar(toolbar, originalChildren, buttons, cleanupCallbacks);
  } else {
    decorateLayoutToolbar(
      toolbar,
      originalChildren,
      buttons,
      injectedNodes,
      cleanupCallbacks,
    );
  }

  originalChildren.forEach(node => {
    if (node instanceof documentView.HTMLButtonElement && (node.dataset.deleteContent || node.dataset.timelineControl)) {
      const existingIcon = node.querySelector('svg');
      if (existingIcon) {
        node.classList.add('doe-toolbar-preview__action', 'doe-toolbar-preview__action--icon-only');
        existingIcon.classList.add('doe-toolbar-preview__icon');
        cleanupCallbacks.push(() => {
          node.classList.remove('doe-toolbar-preview__action--icon-only');
          existingIcon.classList.remove('doe-toolbar-preview__icon');
        });
      } else addActionIcon(documentTarget, node, 'Trash2', injectedNodes, cleanupCallbacks);
      toolbar.append(node);
    }
    if (node instanceof documentView.HTMLButtonElement && node.dataset.contentsReplace) {
      addActionIcon(documentTarget, node, 'LayoutGrid', injectedNodes, cleanupCallbacks);
      node.classList.remove('doe-toolbar-preview__action--icon-only');
      toolbar.append(node);
    }
  });
  mountToolbarOverlay(toolbar);
  const focusOwner = () => {
    const anchor = toolbarAnchors.get(toolbar)?.anchor;
    if (anchor?.isConnected && !anchor.closest('[hidden], [inert]')) {
      anchor.dispatchEvent(new documentView.CustomEvent('doe:canvas-focus', { bubbles: true }));
    }
  };
  for (const surface of [toolbar, toolbarAnchors.get(toolbar)?.alignMenu?.menu]) {
    if (!surface) continue;
    surface.addEventListener('pointerdown', focusOwner, true);
    surface.addEventListener('focusin', focusOwner, true);
    cleanupCallbacks.push(() => {
      surface.removeEventListener('pointerdown', focusOwner, true);
      surface.removeEventListener('focusin', focusOwner, true);
    });
  }

  const handleToolbarClick = (event: Event) => {
    const target = event.target as Element | null;
    if (!target?.closest('.block-toolbar__button, .text-edit-toolbar__button')) return;
    if (family === 'text' && target.closest('.text-edit-toolbar__align-trigger')) {
      const alignMenu = toolbarAnchors.get(toolbar)?.alignMenu?.menu;
      const willOpen = alignMenu?.hidden ?? false;
      documentTarget.defaultView?.requestAnimationFrame(() => {
        closePreviewMenus(documentTarget);
        positionToolbarPreview(toolbar);
        if (willOpen && alignMenu && !alignMenu.hidden) {
          (alignMenu.querySelector<HTMLElement>('[role="menuitemradio"][aria-checked="true"]')
            ?? alignMenu.querySelector<HTMLElement>('[role="menuitemradio"]'))?.focus();
        }
      });
      return;
    }
    documentTarget.defaultView?.requestAnimationFrame(() => closeAllMenus(documentTarget));
  };
  toolbar.addEventListener('click', handleToolbarClick, true);
  cleanupCallbacks.push(() => toolbar.removeEventListener('click', handleToolbarClick, true));

  return () => {
    const alignMenu = toolbarAnchors.get(toolbar)?.alignMenu?.menu;
    if (alignMenu) closeTextAlignMenu(alignMenu);
    cleanupCallbacks.forEach((cleanup) => cleanup());
    injectedNodes.forEach((node) => node.remove());
    restoreToolbarAnchor(toolbar);
    originalElements.forEach((node) => {
      node.classList.remove('doe-toolbar-preview__action', 'doe-toolbar-preview__readout');
    });
    toolbar.classList.remove('doe-toolbar-preview');
    delete toolbar.dataset.doeToolbarPreviewFamily;
    if (originalPlacement === null) delete toolbar.dataset.placement;
    else toolbar.dataset.placement = originalPlacement;
    if (originalStyle === null) toolbar.removeAttribute('style');
    else toolbar.setAttribute('style', originalStyle);
    if (family !== 'text') toolbar.replaceChildren(...originalChildren);
  };
}
