import { text } from "../../dom/text/index.ts";
import { createIdentity } from "../../icon/create-identity/index.ts";
import { createMenu } from "../../menu/create-menu/index.ts";
import { addActionIcon } from "../../icon/add-action-icon/index.ts";

export function decorateLayoutToolbar(
  toolbar: HTMLElement,
  originalChildren: Node[],
  buttons: HTMLButtonElement[],
  injectedNodes: Element[],
  cleanupCallbacks: Array<() => void>,
) {
  const documentTarget = toolbar.ownerDocument;
  const splitActions = buttons.filter((button) => text(button) === '拆为独立块');
  const layoutButtons = buttons.filter((button) => !splitActions.includes(button));
  const originalLabel = text(originalChildren.find(
    (node) => node instanceof documentTarget.defaultView!.Element
      && node.classList.contains('block-toolbar__label'),
  ) as Element);
  const label = originalLabel.startsWith('集合') ? '集合布局' : '容器布局';
  toolbar.append(createIdentity(documentTarget, label, 'LayoutGrid'));
  if (layoutButtons.length) {
    toolbar.append(createMenu(
      documentTarget,
      label,
      layoutButtons,
      'Columns3',
      'compact',
      cleanupCallbacks,
    ));
  }
  splitActions.forEach((button) => {
    addActionIcon(documentTarget, button, 'Ungroup', injectedNodes, cleanupCallbacks);
    toolbar.append(button);
  });
}
