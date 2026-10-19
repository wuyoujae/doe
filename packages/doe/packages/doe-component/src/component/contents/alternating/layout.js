import { clearTimelineLanes } from './lanes.js';

export function arrangeTimeline(root, horizontal, single = false, connectors = true) {
  clearTimelineLanes(root);
  const count = root.__items.length;
  const overlap = !single && root.dataset.contentsMarkerLayout === 'timeline' && count > 1;
  root.dataset.timelineLayout = horizontal ? 'horizontal' : single ? 'single' : 'alternating';
  root.dataset.timelineStaggered = String(!single);
  root.dataset.timelineConnectors = String(connectors);
  root.dataset.columns = String(horizontal ? count : single ? 1 : 2);
  root.style.setProperty('--timeline-tracks', String(overlap ? count + 1 : count));
  root.__items.forEach((item, index) => {
    item.style.gridColumn = horizontal ? `${index + 1} / span ${overlap ? 2 : 1}` : single ? '1' : String(index % 2 + 1);
    item.style.gridRow = String(horizontal ? single ? 1 : index % 2 + 1 : index + 1);
    item.dataset.side = horizontal ? single || index % 2 ? 'bottom' : 'top' : single || index % 2 ? 'right' : 'left';
  });
}

export function adaptTimeline(root, node, context, minWidth) {
  root.style.setProperty('--item-cards-gap', `${Number(context.gap) || 24}px`);
  const grid = root.querySelector('.item-cards__grid');
  const staged = Number.isInteger(context.timelineFallbackStage);
  let single = node.props.staggered === false || context.timelineFallbackStage >= 1;
  const connectors = node.props.connectors !== false && !(context.timelineFallbackStage >= 2);
  // Measure the theme gutter in a stable vertical mode before considering axes.
  arrangeTimeline(root, false, single, connectors);
  const gutter = parseFloat(getComputedStyle(grid).columnGap) || 0;
  if (!staged && context.width < minWidth * 2 + gutter) single = true;
  const marked = root.dataset.contentsMarkerLayout === 'timeline';
  const tracks = !single && marked && root.__items.length > 1 ? (root.__items.length + 1) / 2 : root.__items.length;
  let horizontal = node.props.orientation === 'horizontal' && context.width >= minWidth * tracks;
  if (context.flowLayout) {
    // Orientation is authored structure. The flow solver handles any pressure
    // by scaling the complete timeline, without changing its axis between trials.
    arrangeTimeline(root, node.props.orientation === 'horizontal', single, connectors);
    return;
  }
  const budget = Number(context.height) > 0 ? Number(context.height) : Number(context.availableHeight);
  const semantic = root.ownerDocument.defaultView?.SemanticTextLayout;
  if (Number.isFinite(budget) && budget > 0 && root.isConnected) {
    arrangeTimeline(root, true, single, connectors);
    semantic?.applyTree(root, { allowScale: false });
    const horizontalHeight = root.offsetHeight;
    arrangeTimeline(root, false, single, connectors);
    semantic?.applyTree(root, { allowScale: false });
    const verticalHeight = root.offsetHeight;
    if (horizontalHeight > 0 && verticalHeight > 0) {
      if (verticalHeight <= budget && horizontalHeight > budget) horizontal = false;
      else if (horizontalHeight <= budget && verticalHeight > budget) horizontal = true;
    }
  }
  arrangeTimeline(root, horizontal, single, connectors);
  // The last probe may use the other axis; do not leave its explicit text wraps
  // behind for the winning layout or the next measurement.
  semantic?.applyTree(root, { allowScale: false });
}
