import { toPixels } from '../../../../../../doe-component/src/layout/flow/contract.js';
import { edgeMediaPosition } from '../edge-media-position/index.js';
import { normalizeEdgeMediaRatio } from '../../schema/normalize-edge-media-ratio/index.js';

/** Slide layouts map the page to a media viewport and a safe content rectangle. */
export function safeArea(width, height, marginPt, edgeNode, background, verticalMarginPt = marginPt) {
  const margin = toPixels(marginPt);
  const verticalMargin = toPixels(verticalMarginPt);
  let region = { x: 0, y: 0, width, height };
  let media = null;
  if (edgeNode) {
    const position = edgeMediaPosition(edgeNode);
    const ratio = normalizeEdgeMediaRatio(edgeNode.layout.mediaRatio, position);
    const horizontal = ['left', 'right'].includes(position);
    const length = (horizontal ? width : height) * ratio;
    media = { x: position === 'right' ? width - length : 0,
      y: position === 'bottom' ? height - length : 0,
      width: horizontal ? length : width, height: horizontal ? height : length };
    region = { x: position === 'left' ? length : 0, y: position === 'top' ? length : 0,
      width: horizontal ? width - length : width, height: horizontal ? height : height - length };
  }
  const content = { x: region.x + margin, y: region.y + verticalMargin,
    width: Math.max(0, region.width - margin * 2), height: Math.max(0, region.height - verticalMargin * 2) };
  const ratio = background?.contentWidth;
  if (!edgeNode && background?.enabled !== false && typeof background?.src === 'string' && background.src.trim()
    && typeof ratio === 'number' && Number.isFinite(ratio) && ratio >= .2 && ratio < 1) {
    const unusedWidth = content.width * (1 - ratio);
    content.x += unusedWidth * ({ left: 0, center: .5, right: 1 }[background.contentAlign] ?? .5);
    content.width *= ratio;
  }
  // Keep the existing brand anchor independent of vertical content expansion.
  return { margin, verticalMargin, logoCenterY: (region.y + margin) / 2, media, content };
}
