import { toolbarIconButton } from '../../../layout/toolbar-icon-button/index.js';
import { queueMutation } from '../transaction/queue-mutation/index.js';

export function appendTimelineControls(shell, node, state) {
  if (!state.slide.editor || node.type !== 'contents' || !['timeline-numbered', 'timeline-dots', 'timeline-dot-cards', 'alternating'].includes(node.props.presentation)) return;
  const toolbar = shell.querySelector(':scope > .block-toolbar');
  if (!toolbar) return;
  const horizontal = node.props.orientation === 'horizontal';
  for (const [prop, icon, label, active] of [
    ['orientation', horizontal ? 'ArrowRight' : 'ArrowDown', horizontal ? '切换为竖向' : '切换为横向', horizontal],
    ['staggered', 'GitFork', '交错卡片', node.props.staggered !== false],
    ['connectors', 'Minus', '连接短线', node.props.connectors !== false],
  ]) {
    const button = toolbarIconButton(icon, label);
    button.querySelector('.text-edit-toolbar__button-label')?.remove();
    button.dataset.timelineControl = prop;
    button.setAttribute('aria-pressed', String(active));
    button.addEventListener('pointerdown', event => { event.preventDefault(); event.stopPropagation(); });
    button.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation();
      void queueMutation(state, label, () => {
        node.props[prop] = prop === 'orientation' ? node.props.orientation === 'horizontal' ? 'vertical' : 'horizontal' : node.props[prop] === false;
        state.selectedId = node.id;
        return true;
      });
    });
    toolbar.append(button);
  }
}
