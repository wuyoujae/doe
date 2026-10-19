import { FUNNEL, funnelGeometry, funnelSize } from './geometry.js';
import { layoutCopies } from './copy-layout.js';

export function install(engine) {
  engine.registerComponent('3d-funnel', {
    category: 'diagrams', family: 'narrative', defaultSpan: 'full', minWidth: 480,
    composition: { minWidth: 480, preferredWidth: FUNNEL.width, allowedWith: ['narrative', 'data', 'media'] },
    flowLayout: { sizing: 'fixed', naturalWidth: FUNNEL.width, expandContentWidth: true, layoutRevision: 'funnel-narrowing-v2',
      alignX: 'center', itemGeometry: 'bounded', itemMaxHeight: FUNNEL.copyMaxHeight, itemBodyLines: 2 },
    resolveFlowLayout: props => ({ naturalWidth: Math.max(FUNNEL.width, funnelSize(props.items.length).width) }),
    itemCollection: { path: 'items', key: '3d-funnel', reorderable: true, fixedLayout: true,
      showLayoutControls: false, maxColumns: 1, minItems: FUNNEL.minItems, maxItems: FUNNEL.maxItems,
      fields: ['title', 'text'], required: ['title', 'text'] },
    validate(props, warnings) {
      if (!Array.isArray(props.items) || props.items.length < FUNNEL.minItems || props.items.length > FUNNEL.maxItems
        || props.items.some(item => typeof item?.title !== 'string' || typeof item?.text !== 'string'))
        warnings.push('3d-funnel requires 1–4 title/text items.');
    },
    textFields(root, node) {
      return node.props.items.flatMap((_, index) => ['title', 'text'].map(key => ({
        target: root.querySelectorAll(`.diagram-3d-funnel__${key}`)[index], path: ['items', index, key],
        label: key === 'title' ? '标题' : '正文', required: true,
      })));
    },
    render(node, { element }) {
      const root = element('article', 'diagram-3d-funnel');
      const svgNode = (tag, attributes) => {
        const child = root.ownerDocument.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [name, value] of Object.entries(attributes)) child.setAttribute(name, String(value));
        return child;
      };
      const size = funnelSize(node.props.items.length);
      const svg = svgNode('svg', { viewBox: `0 0 ${size.width} ${size.height}`, width: size.width, height: size.height,
        class: 'diagram-3d-funnel__art', 'aria-hidden': 'true' });
      const sections = funnelGeometry(node.props.items.length);
      // Paint the narrow rear first so wider opening faces retain their depth.
      sections.slice().reverse().forEach(section => {
        svg.append(svgNode('path', { d: section.d, class: 'diagram-3d-funnel__body' }));
        const ellipse = { cx: section.front, cy: section.cy, rx: section.rx, ry: section.ry };
        svg.append(svgNode('ellipse', { ...ellipse, class: 'diagram-3d-funnel__face' }), svgNode('ellipse', { ...ellipse, class: 'diagram-3d-funnel__shade' }));
      });
      root.append(svg);
      node.props.items.forEach((item, index) => {
        const copy = element('section', 'diagram-3d-funnel__copy'); copy.dataset.collectionItemIndex = String(index);
        for (const [key, tag, token, mode] of [['title', 'h4', 'h4', 'title'], ['text', 'p', 'large', 'paragraph']]) {
          const field = element(tag, `diagram-3d-funnel__${key}`, item[key]);
          engine.applyTypographyStyle(field, token);
          root.ownerDocument.defaultView.SemanticTextLayout?.prepareElement(field, { mode, render: 'plaintext', maxLines: 24 });
          copy.append(field);
        }
        root.append(copy);
      });
      return root;
    },
    adapt(root, node, context) { layoutCopies(root, funnelGeometry(node.props.items.length), context); },
    reflow(root, node, context) { this.adapt(root, node, context); },
  });
}
