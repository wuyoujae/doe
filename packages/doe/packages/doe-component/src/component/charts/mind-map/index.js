import { treeError, treeNodes, reconcileTextOverrides } from './model.js';

const NS = 'http://www.w3.org/2000/svg';
const px = value => parseFloat(value) || 0;
const colors = [1, 3, 4, 5, 1, 3];

export function install(global) {
  const engine = global.SlideEngine;
  const definition = {
    category: 'charts', family: 'data', defaultSpan: 'full', minWidth: 480,
    independentItemText: true,
    reconcileContentEdit: reconcileTextOverrides,
    composition: { minWidth: 480, preferredWidth: 1100, allowedWith: ['narrative', 'data', 'metric'] },
    flowLayout: { sizing: 'fixed', naturalWidth: 1100, expandContentWidth: true, alignX: 'center', itemGeometry: 'bounded', itemMaxHeight: 200, itemBodyLines: 2 },
    itemCollection: { path: 'content.items', minItems: 1, maxItems: 40, reorderable: false, fixedLayout: true, showLayoutControls: false },
    validate(props, warnings) { const error = treeError(props.content?.items); if (error) warnings.push(error); },
    textFields(root, node) {
      return node.props.content.items.flatMap((_, index) => ['title', 'text'].map(key => ({ target: root.querySelector(`[data-collection-item-index="${index}"] .doe-mind-map__${key}`), path: ['content', 'items', index, key], label: key === 'title' ? '标题' : '描述', required: true })));
    },
    iconFields(root, node) {
      return node.props.content.items.map((_, index) => ({ target: root.querySelector(`[data-collection-item-index="${index}"] .doe-mind-map__icon`), path: ['content', 'items', index, 'icon'], label: '图标', required: false }));
    },
    render(node, { element }) {
      const root = element('article', 'doe-mind-map'), doc = root.ownerDocument;
      const lines = doc.createElementNS(NS, 'svg'); lines.classList.add('doe-mind-map__lines'); lines.setAttribute('aria-hidden', 'true'); root.append(lines);
      const nodes = treeNodes(node.props.content.items); root.mindNodes = nodes;
      nodes.forEach(entry => {
        const card = element('section', 'doe-mind-map__node'); entry.card = card;
        card.dataset.collectionItemIndex = String(entry.index);
        if (entry.item.level <= 1) card.classList.add('doe-mind-map__node--filled');
        let branch = entry; while (branch.parent?.parent) branch = branch.parent;
        const color = entry.item.level ? colors[nodes[0].children.indexOf(branch)] : 1;
        card.style.setProperty('--mind-color', `var(--yrkie-color-chart-${color})`);
        for (const [key, tag, token] of [['title', 'h4', 'h4'], ['text', 'p', 'large']]) {
          const field = element(tag, `doe-mind-map__${key}`, entry.item[key]); engine.applyTypographyStyle(field, token);
          global.SemanticTextLayout?.prepareElement(field, { mode: key === 'title' ? 'title' : 'paragraph', render: 'plaintext', maxLines: 24 }); card.append(field);
        }
        const icon = element('span', 'doe-mind-map__icon'), lucide = global.lucide;
        const name = (entry.item.icon || 'User').split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
        const glyph = lucide?.icons?.[name] || lucide?.[name] || lucide?.icons?.User || lucide?.User;
        if (glyph && lucide.createElement) icon.append(lucide.createElement(glyph, { 'aria-hidden': 'true' }));
        card.append(icon); root.append(card);
      });
      return root;
    },
    adapt(root, node, context) {
      const nodes = root.mindNodes, top = nodes[0], width = Math.max(1100, context.width), gap = 36;
      const columns = Math.max(1, top.children.length), columnWidth = (width - gap * (columns - 1)) / columns;
      nodes.forEach(entry => {
        entry.w = entry === top ? Math.min(360, columnWidth) : columnWidth - Math.max(0, entry.item.level - 1) * 22;
        Object.assign(entry.card.style, { width: `${entry.w}px`, height: 'auto' });
      });
      global.SemanticTextLayout?.applyTree(root, { allowScale: false });
      nodes.forEach(entry => {
        const style = global.getComputedStyle(entry.card);
        const demand = [...entry.card.querySelectorAll('h4,p')].reduce((sum, field) => {
          const css = global.getComputedStyle(field); return sum + Math.max(field.offsetHeight, field.scrollHeight) + px(css.marginTop) + px(css.marginBottom);
        }, px(style.paddingTop) + px(style.paddingBottom) + px(style.borderTopWidth) + px(style.borderBottomWidth));
        entry.h = Math.min(200, Math.max(72, Math.ceil(demand)));
        entry.card.style.height = `${entry.h}px`;
      });
      const place = (entry, x, y) => {
        Object.assign(entry, { x, y }); Object.assign(entry.card.style, { left: `${x}px`, top: `${y}px` });
        let bottom = y + entry.h;
        entry.children.forEach(child => { bottom = place(child, x + 22, bottom + 24); });
        return bottom;
      };
      top.x = (width - top.w) / 2; top.y = 0;
      Object.assign(top.card.style, { left: `${top.x}px`, top: '0px' });
      let height = top.h;
      top.children.forEach((child, index) => { height = Math.max(height, place(child, index * (columnWidth + gap), top.h + 48)); });
      root.style.height = `${height}px`;
      const lines = root.querySelector('svg.doe-mind-map__lines'); lines.setAttribute('viewBox', `0 0 ${width} ${height}`);
      lines.setAttribute('width', width); lines.setAttribute('height', height); lines.replaceChildren();
      const line = d => { const path = root.ownerDocument.createElementNS(NS, 'path'); path.setAttribute('d', d); lines.append(path); };
      if (top.children.length) {
        const mid = top.h + 24, first = top.children[0], last = top.children.at(-1);
        line(`M${width / 2} ${top.h}V${mid}M${first.x + first.w / 2} ${mid}H${last.x + last.w / 2}`);
        top.children.forEach(child => line(`M${child.x + child.w / 2} ${mid}V${child.y}`));
      }
      nodes.slice(1).forEach(entry => {
        if (!entry.children.length) return;
        const trunk = entry.x + 10, last = entry.children.at(-1);
        line(`M${trunk} ${entry.y + entry.h}V${last.y + last.h / 2}`);
        entry.children.forEach(child => line(`M${trunk} ${child.y + child.h / 2}H${child.x}`));
      });
    },
    reflow(root, node, context) { this.adapt(root, node, context); },
  };
  engine.registerComponent('mind-map', definition);
  global.PPTComponents.mindMap = { mount(host, props) {
    const element = (tag, className = '', text) => { const el = host.ownerDocument.createElement(tag); el.className = className; if (text !== undefined) el.textContent = text; return el; };
    const node = { props }, root = definition.render(node, { element }); root.style.width = '1100px'; host.replaceChildren(root);
    definition.adapt(root, node, { width: 1100 });
    return { size: { width: 1100, height: px(root.style.height) } };
  } };
}
