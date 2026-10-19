export function iconHorizontalPresentation(cards) {
  return {
    ...cards,
    render(node, helpers) {
      const root = cards.render({ ...node, props: { ...node.props, variant: 'filled-icon', items: node.props.items.map(item => ({ ...item, icon: item.icon || 'ArrowRight' })) } }, helpers);
      root.dataset.contentsPresentation = 'icon-horizontal';
      return root;
    },
  };
}
