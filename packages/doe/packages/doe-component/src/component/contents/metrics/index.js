import { arrange } from '../item-cards/arrange/index.js';

export function metricColumnOrder(count, node) {
  const props = node?.props || {};
  const requested = props.itemLayout === 'stack' ? 1
    : props.itemLayout === 'grid' ? Number(props.columnPreference === 'auto' ? props.itemColumns : props.columnPreference ?? props.itemColumns) : 0;
  if (requested) return [Math.max(1, Math.min(count, 12, requested))];
  const columns = Array.from({ length: count }, (_, i) => count - i);
  // Even collections prefer uniform rows; odd collections try a single row first.
  return count % 2 ? columns : [...new Set([2, ...columns.filter(n => count % n === 0 && n > 1).reverse(), ...columns, 1])].filter(n => n <= count);
}

export function metricProps(item) {
  return { value: item.title || '', label: String(item.label ?? ''), description: item.text || '' };
}

export function metricsPresentation(cards, stat) {
  return {
    ...cards,
    render(node, helpers) {
      const root = cards.render({ ...node, props: { ...node.props, variant: 'filled' } }, helpers);
      root.dataset.equalColumns = 'true';
      const singleValue = node.props.items.length === 1 ? String(node.props.items[0].title ?? '') : '';
      if (/\p{N}/u.test(singleValue) && !/[\r\n]/u.test(singleValue) && [...singleValue.trim()].length <= 12) {
        root.dataset.metricEmphasis = 'single';
      }
      root.__items.forEach((item, index) => {
        item.querySelector('.item-cards__surface').replaceChildren(stat.render({ props: metricProps(node.props.items[index]) }, helpers));
      });
      arrange(root, metricColumnOrder(root.__items.length, node)[0]);
      return root;
    },
    adapt(root, node, context) {
      root.style.setProperty('--item-cards-gap', `${Number(context.gap) || 24}px`);
      arrange(root, Math.max(1, Math.min(root.__items.length, Number(context.autoItemColumns) || metricColumnOrder(root.__items.length, node)[0])));
    },
  };
}
