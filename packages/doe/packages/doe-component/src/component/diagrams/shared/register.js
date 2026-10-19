import { itemIcon, paintItemIcons, itemIconFields } from '../../../shared/item-icon/index.js';
import { WIDTH } from './svg.js';
import { fitContentFrame } from './content-frame.js';
import { layoutDiagramCopy } from './copy-layout.js';
import { COPY_BOUNDS } from '../../../layout/flow/copy-bounds.js';
import { toPixels } from '../../../layout/flow/contract.js';
const px = value => parseFloat(value) || 0;
export const sideOf = (item, index) => item.side || (index % 2 ? 'right' : 'left');

/** Artwork and bounded text regions have separate ownership and measurements. */
export function registerDiagram(engine, config) {
  const definition = {
    category: 'diagrams', family: 'narrative', defaultSpan: 'full', minWidth: 480,
    composition: { minWidth: 480, preferredWidth: WIDTH, allowedWith: ['narrative', 'data', 'media'] },
    flowLayout: { sizing: 'fixed', naturalWidth: WIDTH, expandContentWidth: true, alignX: 'center', itemGeometry: 'bounded', itemMaxHeight: toPixels(COPY_BOUNDS.maximumHeightPt), itemBodyLines: 2 },
    resolveFlowLayout: config.resolveFlowLayout,
    itemCollection: { path: 'items', key: config.type, reorderable: true, fixedLayout: true, showLayoutControls: false, maxColumns: 1,
      minItems: config.min, maxItems: config.max, fields: config.percent ? ['value', 'text'] : ['title', 'text', ...((config.icons || config.artIcons) ? ['icon'] : [])], required: config.percent ? ['value', 'text'] : ['title', 'text'] },
    reconcileContentEdit: config.reconcileContentEdit,
    createItem: config.createItem, canDeleteItem: config.canDeleteItem, prepareItemCollection: config.prepareItemCollection,
    validate(props, warnings) {
      if (!Array.isArray(props.items) || props.items.length < config.min || props.items.length > config.max)
        warnings.push(`${config.type} requires ${config.min}–${config.max} items.`);
      if (config.percent && Array.isArray(props.items) && props.items.some(item => typeof item.value !== 'number' || !Number.isFinite(item.value) || item.value < 0 || item.value > 100)) warnings.push('Percentage must be 0–100.');
    },
    textFields(root, node) {
      const fields = node.props.items.flatMap((_, index) => (config.percent ? ['text'] : ['title', 'text']).map(key => ({
        target: root.querySelector(`[data-collection-item-index="${index}"] .doe-diagram__${key}`),
        path: ['items', index, key], label: key === 'title' ? '标题' : '描述', required: true,
      })));
      if (config.value) node.props.items.forEach((item,index) => { if (item.value) fields.push({target:root.querySelector(`[data-value-item-index="${index}"]`),path:['items',index,'value'],label:'底部数值',required:false}); });
      return fields;
    },
    iconFields(root, node) {
      if (config.artIcons) return itemIconFields(root);
      return config.icons ? node.props.items.map((_, index) => ({ target: root.querySelector(`[data-collection-item-index="${index}"] .doe-diagram__icon svg`), path: ['items', index, 'icon'], label: '图标', required: false })) : [];
    },
    render(node, { element }) {
      const root = element('article', `doe-diagram doe-diagram--${config.type}`);
      const geometry = config.geometry(root.ownerDocument, node.props);
      root.append(geometry.svg); root.diagramGeometry = geometry;
      if (config.artIcons) paintItemIcons(root, node.props.items, config.iconFallback);
      node.props.items.forEach((item, index) => {
        const slot = geometry.slots[index], copy = element('section', 'doe-diagram__copy');
        copy.dataset.collectionItemIndex = String(index);
        for (const [key, tag, token] of [['title', 'h4', 'h4'], ['text', 'p', 'large']]) {
          const field = element(tag, `doe-diagram__${key}`, config.percent && key === 'title' ? `${Number(item.value.toFixed(2))}%` : item[key]); engine.applyTypographyStyle(field, config.percent && key === 'title' ? (node.props.items.length>4?'h3':'h1') : token);
          (root.ownerDocument.defaultView.SemanticTextLayout || globalThis.SemanticTextLayout)?.prepareElement(field, { mode: key === 'title' ? 'title' : 'paragraph', render: 'plaintext', maxLines: 24 });
          copy.append(field);
        }
        if (config.icons) {
          const icon = element('span', 'doe-diagram__icon'); icon.style.setProperty('--diagram-item-color', `var(--yrkie-color-chart-${index % 5 + 1})`);
          icon.append(itemIcon(root.ownerDocument, item.icon, config.iconFallback || 'CircleDot'));
          copy.append(icon);
          if (slot.icon) {
            icon.classList.add('doe-diagram__icon--art');
            if (slot.icon.dark) icon.classList.add('doe-diagram__icon--dark');
          }
        }
        root.append(copy);
        if (slot.value) {
          const box=element('div','doe-diagram__value-box'),value=element('div','doe-diagram__value',item.value);value.dataset.valueItemIndex=String(index);
          box.style.setProperty('--diagram-item-color',`var(--yrkie-color-chart-${index%5+1})`);engine.applyTypographyStyle(value,'normal');
          (root.ownerDocument.defaultView.SemanticTextLayout || globalThis.SemanticTextLayout)?.prepareElement(value,{mode:'paragraph',render:'plaintext',maxLines:24});box.append(value);root.append(box);
        }
      });
      return root;
    },
    adapt(root, node, context) {
      const geometry = root.diagramGeometry, artworkWidth = geometry.width || WIDTH, width = Math.max(artworkWidth, context.width), offset = (width - artworkWidth) / 2;
      geometry.fitHeight?.([], 0);
      if (context.flowLayout) {
        root.style.width = `${width}px`;
        geometry.svg.setAttribute('viewBox', `0 0 ${artworkWidth} ${geometry.height}`);
      }
      root.style.height = `${geometry.height}px`; Object.assign(geometry.svg.style, { width: `${artworkWidth}px`, height: `${geometry.height}px`, left: `${offset}px`, top: '0px' });
      geometry.slots.forEach((slot, index) => {
        const copy = root.querySelector(`[data-collection-item-index="${index}"]`);
        const left = slot.expand === 'left' ? 0 : slot.x + offset;
        const w = slot.w + (slot.expand ? offset : 0);
        Object.assign(copy.style, { left: `${left}px`, top: `${slot.y}px`, width: `${w}px`, height: `${slot.h}px`, textAlign: slot.align || 'left' });
        if(slot.icon) Object.assign(copy.querySelector('.doe-diagram__icon').style,{left:`${slot.icon.x+offset-left}px`,top:`${slot.icon.y-slot.y}px`,width:`${slot.icon.w}px`,height:`${slot.icon.h}px`});
        if(slot.value) Object.assign(root.querySelector(`[data-value-item-index="${index}"]`).parentElement.style,{left:`${slot.value.x+offset}px`,top:`${slot.value.y}px`,width:`${slot.value.w}px`,height:`${slot.value.h}px`});
      });
      (root.ownerDocument.defaultView.SemanticTextLayout || globalThis.SemanticTextLayout)?.applyTree(root, { allowScale: false });
      const scale = root.getBoundingClientRect().width / parseFloat(getComputedStyle(root).width);
      const demands = geometry.slots.map((slot, index) => {
        const copy = root.querySelector(`[data-collection-item-index="${index}"]`), style = getComputedStyle(copy);
        let demand = px(style.paddingTop) + px(style.paddingBottom);
        for (const field of copy.querySelectorAll('.doe-diagram__title,.doe-diagram__text')) {
          const s = getComputedStyle(field); demand += Math.max(field.offsetHeight, field.scrollHeight, field.getBoundingClientRect().height / scale) + px(s.marginTop) + px(s.marginBottom);
        }
        return Math.ceil(demand);
      });
      if (geometry.fitHeight) {
        geometry.fitHeight(demands, context.contentHeightBudget ?? context.availableHeight ?? geometry.height);
        root.style.height = `${geometry.height}px`;
        geometry.svg.style.height = `${geometry.height}px`;
        geometry.svg.setAttribute('viewBox', `0 0 ${artworkWidth} ${geometry.height}`);
        geometry.slots.forEach((slot, index) => {
          if (slot.value) root.querySelector(`[data-value-item-index="${index}"]`).parentElement.style.top = `${slot.value.y}px`;
        });
      }
      geometry.slots.forEach((slot, index) => {
        const copy = root.querySelector(`[data-collection-item-index="${index}"]`), demand = demands[index];
        const alignToContent = slot.alignY === 'bottom' || slot.alignY === 'center';
        const height = Math.min(slot.h, Math.max(alignToContent ? 0 : 100, Math.ceil(demand)));
        copy.style.height = `${height}px`;
        if (alignToContent) {
          const top = slot.y + (slot.h - height) / (slot.alignY === 'center' ? 2 : 1);
          copy.style.top = `${top}px`;
          if (slot.icon) copy.querySelector('.doe-diagram__icon').style.top = `${slot.icon.y - top}px`;
        }
      });
      if (context.flowLayout) {
        layoutDiagramCopy(root, geometry, context, width, offset);
        fitContentFrame(root, geometry, width, offset);
      }
    },
    reflow(root, node, context) { this.adapt(root, node, context); },
  };
  engine.registerComponent(config.type, definition);
  if(config.preview) globalThis.PPTComponents[config.preview]={mount(host,props){
    const element=(tag,className='',text)=>{const el=host.ownerDocument.createElement(tag);el.className=className;if(text!==undefined)el.textContent=text;return el;};
    const node={props},root=definition.render(node,{element}),width=root.diagramGeometry.width||WIDTH;root.style.width=`${width}px`;host.replaceChildren(root);definition.adapt(root,node,{width});
    return {size:{width,height:root.diagramGeometry.height}};
  }};
}
