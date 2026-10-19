import { text } from "../../dom/text/index.ts";
import { createIdentity } from "../../icon/create-identity/index.ts";
import { MEDIA_GROUPS } from "../../constants/index.ts";
import { createMenu } from "../../menu/create-menu/index.ts";

export function decorateMediaToolbar(
  toolbar: HTMLElement,
  originalChildren: Node[],
  cleanupCallbacks: Array<() => void>,
) {
  const documentTarget = toolbar.ownerDocument;
  const identityLabel = text(originalChildren.find(
    (node) => node instanceof documentTarget.defaultView!.Element
      && node.classList.contains('block-toolbar__label'),
  ) as Element) || '图片';
  toolbar.append(createIdentity(documentTarget, identityLabel, 'Image'));

  let currentLabel = '';
  let currentButtons: HTMLButtonElement[] = [];
  const flush = () => {
    if (!currentLabel || !currentButtons.length) return;
    const config = MEDIA_GROUPS[currentLabel] ?? { icon: 'SlidersHorizontal', layout: 'list' };
    toolbar.append(createMenu(
      documentTarget,
      currentLabel,
      currentButtons,
      config.icon,
      config.layout,
      cleanupCallbacks,
    ));
    currentButtons = [];
  };

  originalChildren.forEach((node) => {
    if (!(node instanceof documentTarget.defaultView!.Element)) return;
    if (node.classList.contains('block-toolbar__group-label')) {
      flush();
      currentLabel = text(node);
      return;
    }
    if (node instanceof documentTarget.defaultView!.HTMLButtonElement) {
      if (node.dataset.deleteContent || node.dataset.contentsReplace || node.dataset.timelineControl) return;
      if (node.dataset.contentAction) {
        flush();
        toolbar.append(node);
        return;
      }
      currentButtons.push(node);
    }
  });
  flush();
}
