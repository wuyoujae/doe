import { alternatingPresentation } from '../../alternating/definition/index.js';
import { appendMarkers } from '../render/index.js';

export function timelinePresentation(cards, presentation, marker) {
  const alternating = alternatingPresentation(cards);
  return {
    ...alternating,
    render(node, helpers) {
      const root = alternating.render(node, helpers);
      root.dataset.contentsPresentation = presentation;
      return appendMarkers(root, marker, { timeline: true, items: node.props.items });
    },
  };
}
