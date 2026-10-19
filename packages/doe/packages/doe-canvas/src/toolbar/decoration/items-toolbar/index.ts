import { COLLECTION_LABELS } from "../../constants/index.ts";
import { createIdentity } from "../../icon/create-identity/index.ts";
import { createMenu } from "../../menu/create-menu/index.ts";
import { createPassiveIcon } from "../../icon/create-passive-icon/index.ts";

export function decorateItemsToolbar(
  toolbar: HTMLElement,
  buttons: HTMLButtonElement[],
  cleanupCallbacks: Array<() => void>,
) {
  const documentTarget = toolbar.ownerDocument;
  const key = toolbar.dataset.collectionKey ?? '';
  const label = COLLECTION_LABELS[key] ?? '内部项目';
  toolbar.append(createIdentity(documentTarget, label, buttons.length ? 'LayoutGrid' : 'GripVertical'));
  if (buttons.length) {
    toolbar.append(createMenu(
      documentTarget,
      '项目布局',
      buttons,
      'LayoutGrid',
      'compact',
      cleanupCallbacks,
    ));
    return;
  }
  toolbar.append(createPassiveIcon(documentTarget, '拖拽换序', 'GripVertical'));
}
