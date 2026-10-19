import { arrangeTimeline, adaptTimeline } from '../layout.js';
import { layoutTimelineLanes } from '../lanes.js';

export function alternatingPresentation(cards) {
  return {
    ...cards,
    resolveFlowLayout(props) {
      return props.orientation !== 'horizontal' && props.staggered !== false && props.items.length > 1
        ? { itemGeometry: 'bounded', layoutRevision: 'timeline-lanes-v1' } : {};
    },
    reflow(root, node, context) { layoutTimelineLanes(root, node, context); },
    render(node, helpers) {
      const root = cards.render({ ...node, props: { ...node.props, variant: 'filled' } }, helpers);
      root.dataset.contentsPresentation = 'alternating';
      root.dataset.contentsAxis = 'alternating';
      const grid = root.querySelector('.item-cards__grid');
      grid.replaceChildren(...root.__items);
      arrangeTimeline(root, node.props.orientation === 'horizontal', node.props.staggered === false, node.props.connectors !== false);
      return root;
    },
    adapt(root, node, context) {
      adaptTimeline(root, node, context, cards.columnMinWidth);
    },
  };
}
