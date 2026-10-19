import { timelinePresentation } from '../../markers/timeline/index.js';

export function timelineNumberedPresentation(cards) {
  return timelinePresentation(cards, 'timeline-numbered', 'number');
}
