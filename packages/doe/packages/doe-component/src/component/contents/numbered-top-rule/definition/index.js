import { appendMarkers } from '../../markers/render/index.js';

export function numberedTopRulePresentation(cards) {
  return {
    ...cards,
    render(node, helpers) {
      const root = cards.render({ ...node, props: { ...node.props, variant: 'filled' } }, helpers);
      root.dataset.contentsPresentation = 'numbered-top-rule';
      return appendMarkers(root, 'number', { items: node.props.items });
    },
  };
}
