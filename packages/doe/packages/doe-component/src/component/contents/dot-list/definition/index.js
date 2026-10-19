import { appendMarkers } from '../../markers/render/index.js';

export function dotListPresentation(cards) {
  return {
    ...cards,
    render(node, helpers) {
      const root = cards.render({ ...node, props: { ...node.props, variant: 'filled' } }, helpers);
      root.dataset.contentsPresentation = 'dot-list';
      return appendMarkers(root, 'dot', { items: node.props.items });
    },
  };
}
