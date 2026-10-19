import { itemCollectionValues as __doeFn_itemCollectionValues } from '../item-collection-values/index.js';
import { isLayoutFeatureLocked as __doeFn_isLayoutFeatureLocked } from '../is-layout-feature-locked/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:4543


export function automaticItemColumnSequence(node, definition) {
    const contract = definition.resolveItemCollection?.(node.props) || definition.itemCollection;
    const values = (0, __doeFn_itemCollectionValues)(node, { itemCollection: contract }) || [];
    if (!contract || values.length < 2) return [];
    if (
      (0, __doeFn_isLayoutFeatureLocked)(node, "structure") ||
      (0, __doeFn_isLayoutFeatureLocked)(node, "itemLayout")
    ) {
      return [];
    }
    const maximumColumns = Math.max(
      1,
      Math.min(values.length, Number(contract.maxColumns) || 1),
    );
    const minimumColumns = Math.max(
      1,
      Math.min(maximumColumns, Number(contract.minColumns) || 1),
    );
    const configuredOrder = definition.itemCollection?.autoColumnOrder ?? contract.autoColumnOrder;
    const configured = typeof configuredOrder === 'function'
      ? configuredOrder(values.length, automaticNode(node, contract)) : configuredOrder;
    const rawOrder = Array.isArray(configured)
      ? configured
      : Array.from(
          { length: maximumColumns - minimumColumns + 1 },
          (_, index) => minimumColumns + index,
        );
    const legalOrder = [...new Set(rawOrder)]
      .map(Number)
      .filter(
        (columns) =>
          Number.isInteger(columns) &&
          columns >= minimumColumns &&
          columns <= maximumColumns,
      );
    const requestedColumns = requestedItemColumns(node, contract);
    if (
      !Number.isFinite(requestedColumns) ||
      !Number.isInteger(requestedColumns) ||
      requestedColumns < minimumColumns ||
      requestedColumns > maximumColumns
    ) {
      return contract.fixedLayout ? legalOrder.slice(0, 1) : legalOrder;
    }

    return [requestedColumns];
  }

function requestsAutomaticColumns(node, contract) {
    const props = node.props || {};
    const preference = props[contract.preferenceProp || 'columnPreference'];
    if (preference !== undefined) return preference === 'auto';
    return props[contract.columnsProp || 'itemColumns'] === 'auto'
      || props[contract.layoutProp || 'itemLayout'] === 'auto';
  }

function automaticNode(node, contract) {
    if (!requestsAutomaticColumns(node, contract)) return node;
    // Legacy controls retain numeric itemColumns when the author selects auto.
    // Component-specific order functions must not revive that stale preference.
    return { ...node, props: { ...node.props, [contract.preferenceProp || 'columnPreference']: 'auto',
      [contract.columnsProp || 'itemColumns']: 'auto', [contract.layoutProp || 'itemLayout']: 'auto' } };
  }

export function requestedItemColumns(node, contract) {
    if (requestsAutomaticColumns(node, contract)) return NaN;
    const props = node.props || {};
    const preference = props[contract.preferenceProp || 'columnPreference'];
    if (preference !== undefined) return Number(preference);
    if (props[contract.layoutProp || 'itemLayout'] === 'stack') return 1;
    return Number(props[contract.columnsProp || 'itemColumns']);
  }

/** Only automatic collections may change rows under pressure. */
export function adaptiveItemColumnSequence(node, definition) {
    const contract = definition.resolveItemCollection?.(node.props) || definition.itemCollection;
    if (!contract) return [];
    const values = (0, __doeFn_itemCollectionValues)(node, { itemCollection: contract }) || [];
    if (!values.length) return [];
    const maximum = Math.max(1, Math.min(values.length, Number(contract.maxColumns) || 1));
    const minimum = Math.max(1, Math.min(maximum, Number(contract.minColumns) || 1));
    const legal = value => Number.isInteger(value) && value >= minimum && value <= maximum;
    const requested = requestedItemColumns(node, contract);
    const configured = definition.itemCollection?.autoColumnOrder ?? contract.autoColumnOrder;
    const order = typeof configured === 'function' ? configured(values.length, automaticNode(node, contract)) : configured;
    if (legal(requested)) return [requested];
    const candidates = [...new Set([
      ...(Array.isArray(order) ? order.map(Number).filter(legal) : []),
      ...Array.from({ length: maximum - minimum + 1 }, (_, index) => maximum - index),
    ])];
    if (contract.fixedLayout || (0, __doeFn_isLayoutFeatureLocked)(node, 'structure')
      || (0, __doeFn_isLayoutFeatureLocked)(node, 'itemLayout')) return candidates.slice(0, 1);
    return candidates;
  }
