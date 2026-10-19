import { svgItemIcon } from '../../../../shared/item-icon/index.js';

export function number(svg, x, y, index) {
  return svgItemIcon(svg, x, y, index, undefined, 'CircleDot', 'shape-contents__marker');
}
