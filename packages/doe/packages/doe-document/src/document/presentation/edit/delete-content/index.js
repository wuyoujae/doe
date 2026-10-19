import { findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { itemCollectionValues } from '../../layout/item-collection-values/index.js';
import { setItemCollectionValues } from '../../layout/set-item-collection-values/index.js';
import { itemKey } from '../../canvas/editor/item-selection/state/index.js';
import { scope } from '../../runtime/context/index.js';
import { isCollectionGroup } from '../../layout/is-collection-group/index.js';

export function canDeleteContent(state, target) {
  const node = findLocation(state.slide.blocks, target.blockId)?.node;
  if (!node) return false;
  if (target.key != null) {
    const definition = scope.components.get(node.type);
    const values = definition && itemCollectionValues(node, definition);
    const model = scope.global.DOEContentsModel;
    const choice = model?.CHOICES.find(entry => entry.id === model.currentChoice(node));
    const minimum = Math.max(1, Number(choice?.min) || Number(definition?.itemCollection?.minItems) || 1);
    const index = values?.findIndex((value, i) => itemKey(value, i) === target.key) ?? -1;
    return Boolean(values?.length > minimum && index >= 0 && (!definition.canDeleteItem || definition.canDeleteItem(values, index)));
  }
  const survivors = nodes => nodes.reduce((count, current) => count + (current.id === node.id ? 0 : current.type === 'layout-group' ? survivors(current.children) : 1), 0);
  return survivors(state.slide.blocks) > 0;
}

function prune(nodes) {
  return nodes.flatMap(node => {
    if (node.type !== 'layout-group') return [node];
    node.children = prune(node.children);
    if (!node.children.length) return [];
    if (node.layout?.variant === 'edge-media' && node.children.length < 2) {
      return node.children.map(child => {
        child.layout = { ...child.layout, region: null };
        return child;
      });
    }
    return [node];
  });
}

/** Mutate only the requested target; the surrounding transaction rebuilds and measures. */
export function deleteContent(state, target) {
  if (!canDeleteContent(state, target)) return false;
  const location = findLocation(state.slide.blocks, target.blockId);
  if (!location) return false;
  const node = location.node;
  if (target.key != null) {
    const definition = scope.components.get(node.type);
    const values = definition && itemCollectionValues(node, definition);
    const index = values?.findIndex((value, i) => itemKey(value, i) === target.key) ?? -1;
    if (index < 0) return false;
    if (values.length > 1) {
      const order = values.map((_, i) => i).filter(i => i !== index);
      const next = JSON.parse(JSON.stringify(node));
      setItemCollectionValues(next, definition, order.map(i => values[i]), order);
      const contract = definition.resolveItemCollection?.(node.props) || definition.itemCollection;
      if (!contract.fixedLayout && !state.flowLayout) {
        next.props[contract.layoutProp || 'itemLayout'] = 'auto';
        next.props[contract.columnsProp || 'itemColumns'] = 'auto';
        if (contract.preferenceProp) next.props[contract.preferenceProp] = 'auto';
      }
      location.array[location.index] = next;
      state.selectedId = node.id;
      const selectedIndex = Math.min(index, order.length - 1);
      state.selectedItem = { blockId: node.id, index: selectedIndex, key: itemKey(values[order[selectedIndex]], selectedIndex) };
      return true;
    }
  }
  location.array.splice(location.index, 1);
  const parent = location.parentGroup;
  if (!state.flowLayout && parent && (isCollectionGroup(parent) || parent.layout?.variant === 'columns')) {
    parent.layout.columns = 'auto';
    if (parent.layout.variant !== 'columns') parent.layout.variant = 'auto-grid';
    parent.layout.direction = 'row';
  }
  state.slide.blocks = prune(state.slide.blocks);
  if (state.slide.layout.allowsBleed && !state.slide.blocks.some(block => block.layout?.variant === 'edge-media')) {
    state.slide.layout = { ...state.slide.layout, preset: 'flow', allowsBleed: false, bleedRegion: null };
  }
  state.selectedId = null;
  state.selectedItem = null;
  return true;
}
