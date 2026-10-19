import { findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { isLayoutFeatureLocked } from '../../layout/is-layout-feature-locked/index.js';
import { isCollectionGroup } from '../../layout/is-collection-group/index.js';

/** Insert a complete block; item selection never means replacing that item. */
export function insertComponent(blocks, block, selectedId = null, { canCompose = true, normalizeGroup = node => node } = {}) {
  const ids = new Set();
  let count = 0;
  function visit(nodes) {
    for (const node of nodes) {
      ids.add(node.id); count++;
      for (const item of node.props?.items || []) if (item.id) ids.add(item.id);
      if (node.children) visit(node.children);
    }
  }
  visit(blocks);
  if (count >= 2048) throw new Error('insert-limit');
  if (ids.has(block.id) || (block.props?.items || []).some(item => ids.has(item.id))) throw new Error('insert-duplicate-id');
  let location = selectedId ? findLocation(blocks, selectedId) : null;
  if (selectedId && !location) throw new Error('insert-stale');
  // Fixed/locked containers must retain their structure. Their selected child
  // anchors insertion after the whole container instead.
  for (let ancestor = location?.parentGroup; ancestor; ancestor = findLocation(blocks, ancestor.id)?.parentGroup) {
    if (isLayoutFeatureLocked(ancestor, 'structure') || isCollectionGroup(ancestor)
      || (!canCompose && ancestor.layout?.variant === 'composition')
      || (ancestor === location.parentGroup && ['edge-media', 'split-right-bleed'].includes(ancestor.layout?.variant))) {
      location = findLocation(blocks, ancestor.id);
    }
  }
  let target = location?.array || blocks;
  let index = location ? location.index + 1 : target.length;
  // A bleed page has one structural root. Its safe content region owns new
  // blocks, including when the user selected the image or the outer shell.
  if (target === blocks && blocks.length === 1 && ['edge-media', 'split-right-bleed'].includes(blocks[0].layout?.variant)) {
    if (isLayoutFeatureLocked(blocks[0], 'structure')) throw new Error('insert-locked');
    const content = blocks[0].children.find(child => child.layout?.region === 'content');
    if (!content || isLayoutFeatureLocked(content, 'structure')) throw new Error('insert-locked');
    if (content.type !== 'layout-group' || isCollectionGroup(content)) {
      if (count + 1 >= 2048) throw new Error('insert-limit');
      const wrapper = normalizeGroup({ id: `${block.id}-content`, type: 'layout-group', layout: { variant: 'stack', region: 'content' },
        children: [{ ...content, layout: { ...content.layout, region: null } }, block] });
      blocks[0].children[blocks[0].children.indexOf(content)] = wrapper;
      return block.id;
    }
    if (!canCompose && content.layout?.variant === 'composition') throw new Error('insert-locked');
    target = content.children; index = target.length;
  }
  if (target !== blocks && target.length >= 24) throw new Error('insert-limit');
  target.splice(index, 0, block);
  return block.id;
}
