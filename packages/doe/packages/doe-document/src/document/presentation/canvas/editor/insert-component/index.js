import { createInsertedComponent } from '../../../../../../../doe-component/src/catalog/insertion.js';
import { insertComponent } from '../../../edit/insert-component/index.js';
import { normalizeLeaf } from '../../../schema/normalize-leaf/index.js';
import { normalizeBlock } from '../../../schema/normalize-block/index.js';
import { nodeLayoutProfile } from '../../../layout/node-layout-profile/index.js';
import { queueMutation } from '../transaction/queue-mutation/index.js';

export async function requestComponentInsertion(state, request, isCurrent = () => true) {
  if (state.mode !== 'editable') return { accepted: false, errorCode: 'insert-readonly' };
  if (state.insertingComponent) return { accepted: false, errorCode: 'insert-busy' };
  state.insertingComponent = true;
  const selectedId = state.selectedId;
  try {
    await state.result.flushPendingEdits();
    if (!isCurrent()) return { accepted: false, errorCode: 'insert-stale' };
    const block = createInsertedComponent(request.name, {
      id: `insert-${crypto.randomUUID()}`, locale: request.locale, media: request.media,
    });
    const normalized = normalizeLeaf(block, [1], []);
    return await queueMutation(state, '新增组件', () => {
      insertComponent(state.slide.blocks, normalized, selectedId, {
        canCompose: Boolean(nodeLayoutProfile(normalized)?.enabled),
        normalizeGroup: node => normalizeBlock(node, [1], [], 1),
      });
      state.selectedId = normalized.id;
      state.selectedItem = null;
    }, { insertion: true, isCurrent });
  } catch (error) {
    return { accepted: false, errorCode: error.message?.startsWith('insert-') ? error.message : 'insert-invalid', reason: error.message };
  } finally {
    state.insertingComponent = false;
  }
}
