import { appendMarkers } from '../../markers/render/index.js';

export function dotCardPresentation(cards) {
  return {
    ...cards,
    render(node, helpers) {
      const root = cards.render({ ...node, props: { ...node.props, variant: 'filled' } }, helpers);
      root.dataset.contentsPresentation = 'dot-card';
      return appendMarkers(root, 'dot', { items: node.props.items });
    },
  };
}
