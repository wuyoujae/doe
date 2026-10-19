import { t } from '../../../shared/editor/i18n/index.ts';
import { editorForm } from '../../../shared/editor/form-controls/index.ts';
import type { UnknownRecord } from '../../../shared/editor/types/index.ts';
import { branchEnd, editTree, treeError, identifiedItems } from './model.js';

const treeErrorKeys: Record<string, string> = {
  '需要 1–40 个节点': 'nodeRange', '第一个节点必须是 level=0 的根节点': 'rootError',
  '层级需连续，子节点紧跟父节点，最多六层': 'levelError', '根节点下最多六个分支': 'branchError',
  '每个节点都需要标题和描述': 'contentError',
};

export function createMindMapForm(base: UnknownRecord, onChange: () => void) {
  const e = editorForm(base, onChange), section = e.section(t('doeInteraction:mind.nodes'), t('doeInteraction:mind.hint'));
  e.draft.content.items = identifiedItems(e.draft.content.items);
  const list = document.createElement('div'); list.className = 'chart-content-records'; section.append(list);
  function draw() {
    e.clear(list);
    const items = e.draft.content.items;
    items.forEach((item: any, index: number) => {
      const card = document.createElement('div'); card.className = 'chart-content-record'; card.dataset.nodeIndex = String(index); list.append(card);
      const heading = document.createElement('strong'); heading.textContent = `${index + 1} · ${item.level === 0 ? t('doeInteraction:mind.root') : t('doeInteraction:mind.level', { number: item.level + 1 })}`; card.append(heading);
      e.text(card, `node-title-${index}`, t('doeInteraction:fields.title'), item.title, v => { item.title = v; }, true, true);
      e.text(card, `node-text-${index}`, t('doeInteraction:fields.description'), item.text, v => { item.text = v; }, true, true);
      e.text(card, `node-icon-${index}`, t('doeInteraction:fields.icon'), item.icon || 'User', v => { item.icon = v || 'User'; });
      const actions = e.row(card);
      const count = branchEnd(items, index) - index;
      for (const [action, label] of [['add', t('doeInteraction:mind.add')], ['up', t('collection.moveUp')], ['down', t('collection.moveDown')], ['indent', t('doeInteraction:mind.indent')], ['outdent', t('doeInteraction:mind.outdent')], ['delete', count > 1 ? t('doeInteraction:mind.deleteBranch', { count }) : t('doeInteraction:mind.deleteNode')]]) {
        if (index === 0 && action !== 'add') continue;
        const button = e.button(actions, label, () => { const next = editTree(e.draft.content.items, index, action, { title: t('doeInteraction:fields.title'), text: t('doeInteraction:fields.description') }); if (next) { e.draft.content.items = next; draw(); } }, !editTree(items, index, action));
        button.dataset.treeAction = action;
      }
    });
  }
  draw(); e.validate(() => {
    const error = treeError(e.draft.content.items);
    return error ? t(`doeInteraction:mind.${treeErrorKeys[error]}`) : '';
  }); return e.form;
}
