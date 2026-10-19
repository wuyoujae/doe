export function install(engine) {
  const { collection, ...textDefinition } = engine.components.get('text');
  engine.registerComponent('text-panel', {
    ...textDefinition,
    layoutContract: { ...textDefinition.layoutContract, minHeight: 240, canSplit: false },
    flowLayout: { width: 'fill', inset: 'component', layoutRevision: 'text-panel-natural-height-v1' },
    textFields(root) {
      return [{ target: root.querySelector('.component-text-panel__body'), path: ['text'], label: '正文', required: true }];
    },
    render(node, { element }) {
      const panel = element('article', 'component-text-panel');
      const body = element('div', 'component-text-panel__body', node.props.text);
      engine.applyTypographyStyle(body, 'large');
      body.ownerDocument.defaultView.SemanticTextLayout?.prepareElement(body, { mode: 'body', render: 'plaintext', maxLines: 24 });
      panel.append(body);
      return panel;
    },
  });
}
