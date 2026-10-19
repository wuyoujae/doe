import type { ToolbarPreviewController } from "../../contracts/index.ts";
import { canInstallToolbarPreview } from "../../eligibility/can-install-toolbar-preview/index.ts";
import { canInstallYrkieDoeToolbar } from "../../eligibility/can-install-yrkie-doe-toolbar/index.ts";
import { TOOLBAR_PREVIEW_VERSION } from "../../constants/index.ts";
import type { DecorationRecord } from "../../contracts/index.ts";
import { decorateToolbarPreview } from "../../decoration/toolbar-preview/index.ts";
import { toolbarAnchors } from "../../constants/index.ts";
import { positionToolbarPreview } from "../../position/toolbar-preview/index.ts";
import { TOOLBAR_LAYER_CLASS } from "../../constants/index.ts";
import { closeAllMenus } from "../../menu/close-all-menus/index.ts";
import type { ToolbarLocale } from "../../locale/index.ts";
import toolbarPreviewCssUrl from "../../controller/index.css?no-inline&url";

export function installToolbar(
  frame: HTMLIFrameElement,
  studioOnly: boolean,
  locale: ToolbarLocale,
): ToolbarPreviewController | null {
  const { localizeToolbar } = locale;
  const frameWindow = frame.contentWindow;
  if (!frameWindow) return null;
  let documentTarget: Document | null;
  let frameHref: string;
  try {
    documentTarget = frame.contentDocument;
    frameHref = frameWindow.location.href;
  } catch {
    return null;
  }
  if (!documentTarget) return null;
  const allowed = studioOnly
    ? canInstallToolbarPreview(
        window.location.hostname,
        window.location.origin,
        frameHref,
      )
    : canInstallYrkieDoeToolbar(window.location.origin, frameHref);
  if (!allowed) {
    return null;
  }
  const activeCanvas = documentTarget.getElementById('active-canvas');
  if (!activeCanvas) return null;
  const canvasRoot = activeCanvas.closest('.work-editor__stage') ?? activeCanvas;
  const activeScale = documentTarget.getElementById('active-scale');

  let style = documentTarget.querySelector<HTMLLinkElement>(
    `link[data-doe-studio-toolbar-preview="${TOOLBAR_PREVIEW_VERSION}"]`,
  );
  if (!style) {
    style = documentTarget.createElement('link');
    style.dataset.doeStudioToolbarPreview = TOOLBAR_PREVIEW_VERSION;
    style.rel = 'stylesheet';
    style.href = toolbarPreviewCssUrl;
    documentTarget.head.append(style);
  }

  const decorations = new Map<HTMLElement, DecorationRecord>();
  let previewEnabled = true;
  let scheduledFrame = 0;
  let disposed = false;

  const restoreAll = () => {
    decorations.forEach((record) => { resizeObserver?.unobserve(record.toolbar); record.cleanup(); });
    decorations.clear();
  };

  const enhance = () => {
    scheduledFrame = 0;
    if (disposed || !previewEnabled) return;
    canvasRoot
      .querySelectorAll<HTMLElement>('.block-toolbar')
      .forEach((toolbar) => {
        if (decorations.has(toolbar)) return;
        const cleanup = decorateToolbarPreview(toolbar);
        if (cleanup) {
          const alignMenu = toolbarAnchors.get(toolbar)?.alignMenu?.menu;
          const locale = localizeToolbar(alignMenu ? [toolbar, alignMenu] : [toolbar]);
          decorations.set(toolbar, { toolbar, refreshLocale: locale.refresh, cleanup: () => { locale.dispose(); cleanup(); } });
          resizeObserver?.observe(toolbar);
        }
      });
    decorations.forEach((record, toolbar) => {
      const anchor = toolbarAnchors.get(toolbar)?.anchor;
      if (anchor && !anchor.isConnected) {
        resizeObserver?.unobserve(toolbar);
        record.cleanup();
        decorations.delete(toolbar);
      } else if (!toolbar.isConnected) {
        resizeObserver?.unobserve(toolbar);
        decorations.delete(toolbar);
      }
    });
    decorations.forEach(({ toolbar }) => positionToolbarPreview(toolbar));
  };

  const schedule = () => {
    if (disposed || scheduledFrame) return;
    scheduledFrame = frameWindow.requestAnimationFrame(enhance);
  };

  const observer = new MutationObserver(records => {
    if (records.some(record => record.type === 'childList'
      || record.attributeName === 'hidden' || record.attributeName === 'inert'
      || (record.target as Element).matches('#active-scale, [data-canvas-scale], .doe-canvas__scale'))) schedule();
  });
  style.addEventListener('load', schedule);
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
  resizeObserver?.observe(canvasRoot);
  observer.observe(canvasRoot, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'hidden', 'inert'] });
  if (activeScale && !canvasRoot.contains(activeScale)) observer.observe(activeScale, { attributes: true, attributeFilter: ['style'] });
  const handleCanvasInteraction = () => schedule();
  const handleViewportScroll = (event: Event) => {
    if ((event.target as Element | null)?.closest?.(`.${TOOLBAR_LAYER_CLASS}`)) return;
    schedule();
  };
  const handleLanguageChange = () => {
    decorations.forEach(record => record.refreshLocale());
    schedule();
  };
  locale.on('languageChanged', handleLanguageChange);
  const handleDocumentPointer = (event: Event) => {
    const target = event.target as Element | null;
    if (!target?.closest(
      '.doe-toolbar-preview__menu, .text-edit-toolbar__align-trigger, .doe-toolbar-preview__text-align-menu',
    )) closeAllMenus(documentTarget);
  };
  const handleDocumentKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    const textMenu = (event.target as Element | null)?.closest<HTMLElement>(
      '.doe-toolbar-preview__text-align-menu',
    );
    if (textMenu) return;
    closeAllMenus(documentTarget);
  };
  canvasRoot.addEventListener('slideengine:selectionchange', handleCanvasInteraction, true);
  canvasRoot.addEventListener('click', handleCanvasInteraction, true);
  canvasRoot.addEventListener('pointerdown', handleCanvasInteraction, true);
  documentTarget.addEventListener('pointerdown', handleDocumentPointer, true);
  documentTarget.addEventListener('keydown', handleDocumentKeydown, true);
  frameWindow.addEventListener('resize', schedule);
  frameWindow.addEventListener('scroll', handleViewportScroll, true);
  documentTarget.fonts?.addEventListener('loadingdone', schedule);
  void documentTarget.fonts?.ready.then(schedule);

  const controller: ToolbarPreviewController = {
    get enabled() {
      return previewEnabled;
    },
    setEnabled(enabled) {
      if (disposed || previewEnabled === enabled) return;
      previewEnabled = enabled;
      if (enabled) {
        documentTarget.documentElement.dataset.doeStudioToolbarPreview = TOOLBAR_PREVIEW_VERSION;
        schedule();
      } else {
        closeAllMenus(documentTarget);
        restoreAll();
        delete documentTarget.documentElement.dataset.doeStudioToolbarPreview;
      }
    },
    refresh() {
      schedule();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (scheduledFrame) frameWindow.cancelAnimationFrame(scheduledFrame);
      observer.disconnect();
      resizeObserver?.disconnect();
      locale.off('languageChanged', handleLanguageChange);
      canvasRoot.removeEventListener('slideengine:selectionchange', handleCanvasInteraction, true);
      canvasRoot.removeEventListener('click', handleCanvasInteraction, true);
      canvasRoot.removeEventListener('pointerdown', handleCanvasInteraction, true);
      documentTarget.removeEventListener('pointerdown', handleDocumentPointer, true);
      documentTarget.removeEventListener('keydown', handleDocumentKeydown, true);
      frameWindow.removeEventListener('resize', schedule);
      frameWindow.removeEventListener('scroll', handleViewportScroll, true);
      documentTarget.fonts?.removeEventListener('loadingdone', schedule);
      restoreAll();
      delete documentTarget.documentElement.dataset.doeStudioToolbarPreview;
      style?.removeEventListener('load', schedule);
      style?.remove();
    },
  };

  documentTarget.documentElement.dataset.doeStudioToolbarPreview = TOOLBAR_PREVIEW_VERSION;
  schedule();
  return controller;
}
