import { createIdentity } from "../../icon/create-identity/index.ts";
import { buttonByLabels } from "../../dom/button-by-labels/index.ts";
import { createMenu } from "../../menu/create-menu/index.ts";
import { addActionIcon } from "../../icon/add-action-icon/index.ts";
import { text } from "../../dom/text/index.ts";

export function decorateCompositionToolbar(
  toolbar: HTMLElement,
  buttons: HTMLButtonElement[],
  cleanupCallbacks: Array<() => void>,
  injectedNodes: Element[],
) {
  const documentTarget = toolbar.ownerDocument;
  toolbar.append(createIdentity(documentTarget, '组合布局', 'PanelsTopLeft'));
  const directions = buttonByLabels(buttons, ['左右', '上下']);
  const ratios = buttonByLabels(buttons, ['均分', '主左', '主右']);
  const alignment = buttonByLabels(buttons, ['上', '中', '下']);
  const readability = buttonByLabels(buttons, ['正文≥11pt', '允许8pt']);
  const actions = buttonByLabels(buttons, ['交换', '拆分']);
  if (directions.length) {
    toolbar.append(createMenu(
      documentTarget,
      '组合方向',
      directions,
      'Rows3',
      'compact',
      cleanupCallbacks,
    ));
  }
  if (ratios.length) {
    toolbar.append(createMenu(documentTarget, '比例', ratios, 'Columns2', 'compact', cleanupCallbacks));
  }
  if (alignment.length) {
    toolbar.append(createMenu(
      documentTarget,
      '纵向对齐',
      alignment,
      'AlignVerticalJustifyCenter',
      'compact',
      cleanupCallbacks,
    ));
  }
  if (readability.length) {
    toolbar.append(createMenu(
      documentTarget,
      '文字安全',
      readability,
      'Type',
      'list',
      cleanupCallbacks,
      { '正文≥11pt': '≥11pt', '允许8pt': '8pt' },
    ));
  }
  actions.forEach((button) => {
    addActionIcon(
      documentTarget,
      button,
      text(button) === '交换' ? 'ArrowLeftRight' : 'Ungroup',
      injectedNodes,
      cleanupCallbacks,
    );
    toolbar.append(button);
  });
}
