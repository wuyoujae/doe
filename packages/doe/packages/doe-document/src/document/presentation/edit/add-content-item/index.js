import { findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { itemCollectionValues } from '../../layout/item-collection-values/index.js';
import { setItemCollectionValues } from '../../layout/set-item-collection-values/index.js';
import { itemKey } from '../../canvas/editor/item-selection/state/index.js';
import { scope } from '../../runtime/context/index.js';

export function additionInfo(state, blockId) {
  const node = findLocation(state.slide.blocks, blockId)?.node;
  if (!node || node.layout?.lock) return null;
  const definition = scope.components.get(node.type);
  if (!definition?.itemCollection) return null;
  const model = scope.global.DOEContentsModel;
  const collection = definition.itemCollection;
  const choice = model?.CHOICES.find(entry => entry.id === model.currentChoice(node))
    || (collection.fields && collection.maxItems ? { id: node.type, fields: collection.fields, required: collection.required || [], max: collection.maxItems } : null);
  const values = itemCollectionValues(node, definition);
  if (!choice || !values?.length) return null;
  return { node, definition, choice, values, maximum: choice.max };
}

export function addContentItem(state, blockId) {
  const info = additionInfo(state, blockId);
  if (!info || info.values.length >= info.maximum) return false;
  const { node, definition, choice, values } = info;
  const previous = values.at(-1);
  let value = '描述';
  if (typeof previous !== 'string') {
    const ids = new Set(values.map((entry, i) => entry.id || `${node.id}-item-${i + 1}`));
    let serial = values.length + 1;
    while (ids.has(`${node.id}-item-${serial}`)) serial++;
    value = { id: `${node.id}-item-${serial}` };
    if (choice.fields.includes('title')) value.title = '标题';
    if (choice.fields.includes('text')) value.text = '描述';
    if (choice.id === 'metrics') { value.title = '0'; value.label = '指标'; }
    if (choice.icons) value.icon = previous.icon || 'Plus';
    if (choice.required.includes('src')) { value.src = previous.src; value.alt = previous.alt || ''; }
  }
  if (definition.createItem) value = definition.createItem(value, values);
  setItemCollectionValues(node, definition, [...values, value], [...values.map((_, i) => i), -1]);
  const contract = definition.resolveItemCollection?.(node.props) || definition.itemCollection;
  if (!contract.fixedLayout && !state.flowLayout) {
    node.props[contract.layoutProp || 'itemLayout'] = 'auto';
    node.props[contract.columnsProp || 'itemColumns'] = 'auto';
    if (contract.preferenceProp) node.props[contract.preferenceProp] = 'auto';
  }
  state.selectedId = node.id;
  state.selectedItem = { blockId, index: values.length, key: itemKey(value, values.length) };
  return true;
}
