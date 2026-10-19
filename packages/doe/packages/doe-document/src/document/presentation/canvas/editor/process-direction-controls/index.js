import { directionalProcessHeader } from '../../../../../../../doe-component/src/component/contents/process-headers/orientation.js';
import { toolbarIconButton } from '../../../layout/toolbar-icon-button/index.js';
import { isLayoutFeatureLocked } from '../../../layout/is-layout-feature-locked/index.js';
import { queueMutation } from '../transaction/queue-mutation/index.js';

export function appendProcessDirectionControls(record, state) {
  const { node, shell, element } = record;
  if (!state.slide.editor || node.type !== 'contents' || !directionalProcessHeader(node.props)) return;
  const toolbar = shell.querySelector(':scope > .block-toolbar');
  if (!toolbar) return;
  toolbar.querySelector('[data-process-direction-control]')?.remove();
  const vertical = element.dataset.processOrientation === 'vertical';
  const automatic = Boolean(state.flowCompression?.orientation?.[node.id]);
  const label = vertical ? '切换为横向' : '切换为竖向';
  const button = toolbarIconButton(vertical ? 'ArrowDown' : 'ArrowRight', automatic ? `${label}（当前自动适配为${vertical ? '竖排' : '横排'}）` : label);
  button.querySelector('.text-edit-toolbar__button-label')?.remove();
  button.dataset.processDirectionControl = vertical ? 'vertical' : 'horizontal';
  button.dataset.automatic = String(automatic);
  button.setAttribute('aria-pressed', String(vertical));
  button.disabled = isLayoutFeatureLocked(node, 'structure') || isLayoutFeatureLocked(node, 'itemLayout');
  button.addEventListener('pointerdown', event => { event.preventDefault(); event.stopPropagation(); });
  button.addEventListener('click', event => {
    event.preventDefault(); event.stopPropagation();
    void queueMutation(state, label, () => {
      node.props.orientation = vertical ? 'horizontal' : 'vertical';
      state.selectedId = node.id;
      return true;
    });
  });
  toolbar.append(button);
}
