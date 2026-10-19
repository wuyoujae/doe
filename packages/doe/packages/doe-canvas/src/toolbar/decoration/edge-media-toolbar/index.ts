import { createIdentity } from "../../icon/create-identity/index.ts";
import { createMenu } from "../../menu/create-menu/index.ts";
import { text } from "../../dom/text/index.ts";
import { createIcon } from "../../icon/create-icon/index.ts";

export function decorateEdgeMediaToolbar(
  toolbar: HTMLElement,
  originalChildren: Node[],
  buttons: HTMLButtonElement[],
  cleanupCallbacks: Array<() => void>,
) {
  const documentTarget = toolbar.ownerDocument;
  const positionButtons = buttons.filter((button) => Boolean(button.dataset.edgeMediaPosition));
  const contentAlignButtons = buttons.filter(
    (button) => Boolean(button.dataset.edgeMediaContentAlign),
  );
  const shapeButtons = buttons.filter((button) => Boolean(button.dataset.edgeMediaShape));
  toolbar.append(createIdentity(documentTarget, '贴边媒体', 'PanelRight'));
  const readout = originalChildren.find(
    (node) => node instanceof documentTarget.defaultView!.Element
      && node.classList.contains('edge-media-ratio-readout'),
  );
  if (readout) {
    (readout as HTMLElement).classList.add('doe-toolbar-preview__readout');
    toolbar.append(readout);
  }
  if (positionButtons.length) {
    toolbar.append(createMenu(
      documentTarget,
      '图片位置',
      positionButtons,
      'GalleryHorizontalEnd',
      'positions',
      cleanupCallbacks,
      {
        图片在左: '左',
        图片在右: '右',
        图片在上: '上',
        图片在下: '下',
      },
    ));
  }
  if (contentAlignButtons.length) {
    toolbar.append(createMenu(
      documentTarget,
      '内容对齐',
      contentAlignButtons,
      'AlignVerticalJustifyCenter',
      'compact',
      cleanupCallbacks,
      {
        居上: '上',
        居中: '中',
        居下: '下',
      },
    ));
  }
  if (shapeButtons.length) {
    shapeButtons.forEach((button) => {
      const label = text(button);
      const originalAriaLabel = button.getAttribute('aria-label');
      const originalTitle = button.getAttribute('title');
      button.classList.add('doe-toolbar-preview__edge-shape-option');
      button.setAttribute('aria-label', label);
      button.title = label;
      const icon = createIcon(
        documentTarget,
        'Image',
        'doe-toolbar-preview__edge-shape-icon',
      );
      if (icon) button.append(icon);
      cleanupCallbacks.push(() => {
        button.classList.remove('doe-toolbar-preview__edge-shape-option');
        icon?.remove();
        if (originalAriaLabel === null) button.removeAttribute('aria-label');
        else button.setAttribute('aria-label', originalAriaLabel);
        if (originalTitle === null) button.removeAttribute('title');
        else button.setAttribute('title', originalTitle);
      });
    });
    toolbar.append(createMenu(
      documentTarget,
      '边界',
      shapeButtons,
      'Blend',
      'edge-shapes',
      cleanupCallbacks,
      {
        直线: '直线',
        Fade: 'Fade',
        斜线: '斜线',
        圆: '圆',
        内圆: '内圆',
      },
    ));
  }
}
