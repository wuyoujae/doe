import { timelinePresentation } from '../../markers/timeline/index.js';

export function timelineDotsPresentation(cards) {
  return timelinePresentation(cards, 'timeline-dots', 'dot');
}
