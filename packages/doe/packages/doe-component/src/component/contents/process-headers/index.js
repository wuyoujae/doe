import { itemIcon } from '../../../shared/item-icon/index.js';
import { arrange } from '../item-cards/arrange/index.js';
import { ascendingColumnOrder } from './columns/index.js';
import { processOrientation } from './orientation.js';

const ns = 'http://www.w3.org/2000/svg';
function paintArtwork(svg, kind, width, height, vertical = false) {
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const inset = .5, right = width - inset, bottom = height - inset;
  const tip = vertical ? Math.min(height / 2, width * .4) : Math.min(width / 4, height * .85), lean = Math.min(width / 4, height * .38);
  const attributes = vertical && kind === 'chevron' ? {d:`M${inset} ${inset}L${width/2} ${tip/2}L${right} ${inset}V${bottom-tip/2}L${width/2} ${bottom}L${inset} ${bottom-tip/2}Z`}
    : vertical && kind === 'parallelogram' ? {d:`M${inset} ${lean}L${right} ${inset}V${bottom-lean}L${inset} ${bottom}Z`}
    : kind === 'parallelogram' ? {d:`M${lean} ${inset}H${right}L${right-lean} ${bottom}H${inset}Z`}
    : kind === 'chevron' ? {d:`M${inset} ${inset}H${right-tip/2}L${right} ${height/2}L${right-tip/2} ${bottom}H${inset}L${tip/2} ${height/2}Z`}
    : kind === 'arrow' ? {d:`M${inset} ${height/6}H${right-tip}V${inset}L${right} ${height/2}L${right-tip} ${bottom}V${height*5/6}H${inset}Z`}
    : {x:inset,y:inset,width:width-1,height:height-1,rx:kind === 'pill' ? (Math.min(width,height)-1)/2 : Math.min(6,(height-1)/2)};
  for (const [key,value] of Object.entries(attributes)) svg.firstElementChild.setAttribute(key,String(value));
}
function artwork(document, kind) {
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const shape = document.createElementNS(ns, kind === 'pill' || kind === 'bar' || kind === 'numbered-bar' ? 'rect' : 'path');
  shape.setAttribute('vector-effect','non-scaling-stroke');svg.append(shape);
  paintArtwork(svg,kind,360,72);return svg;
}

export function processHeaderPresentation(cards, {kind, ascending}) {
  const repaint = root => root.querySelectorAll('.contents-process__header > svg').forEach(svg => {
    paintArtwork(svg, kind, svg.clientWidth || svg.parentElement.clientWidth || 360, svg.clientHeight || 72, root.dataset.processOrientation === 'vertical');
  });
  return {
    ...cards,
    ...(!ascending ? { flowLayout: { ...cards.flowLayout, orientationFallback: 'vertical', layoutRevision: 'process-content-height-columns-v2',
      contentGrid: { ...cards.flowLayout.contentGrid, surface: '.contents-process__copy' } } } : {}),
    render(node, helpers) {
      const root = cards.render({...node,props:{...node.props,variant:'filled'}},helpers);
      root.dataset.processHeader = kind;
      if (!ascending) root.dataset.processOrientation = processOrientation(node.props);
      if (ascending) root.dataset.equalColumns = 'true';
      root.__items.forEach((item,index) => {
        const header = helpers.element('div','contents-process__header');
        header.setAttribute('aria-hidden','true');
        header.append(artwork(root.ownerDocument,kind));
        if (!ascending || kind === 'numbered-bar') {
          const icon = helpers.element('span', 'contents-process__number');
          icon.dataset.itemIconIndex = String(index);
          icon.append(itemIcon(root.ownerDocument, node.props.items[index]?.icon, 'ArrowRight'));
          header.append(icon);
        }
        const surface = item.querySelector('.item-cards__surface');
        if (!ascending) {
          const copy = helpers.element('div', 'contents-process__copy');
          copy.append(...surface.children); surface.append(copy);
        }
        surface.prepend(header);
      });
      if (ascending) {delete root.dataset.columns;arrange(root,ascendingColumnOrder(root.__items.length,node)[0]);}
      return root;
    },
    adapt(root,node,context) {
      if (!ascending) {
        const orientation = processOrientation(node.props, context);
        root.dataset.processOrientation = orientation;
        cards.adapt(root,node,context);
        if (orientation === 'vertical') arrange(root,1);
      }
      else {
      const gap = Number(context.gap) || 24;
      root.style.setProperty('--item-cards-gap',`${gap}px`);
      const columns = Math.max(1,Math.min(5,root.__items.length,Number(context.autoItemColumns) || ascendingColumnOrder(root.__items.length,node)[0]));
      arrange(root,columns);
      }
      repaint(root);
    },
    reflow: repaint,
  };
}
