// Text is independently editable; sector geometry remains owned by the chart.
export function textFields(root, node) {
  const fields = [];
  root.querySelectorAll('.ppt-donut-chart__legend-item').forEach((target, index) => {
    fields.push({ target, path: ['content', 'items', index, 'label'], label: '图例名称', required: true });
  });
  for (const role of ['title', 'eyebrow', 'value', 'subtitle']) {
    const target = root.querySelector(`.ppt-donut-chart__center-${role}`);
    if (target && node.props.content?.center?.[role] != null) {
      fields.push({ target, path: ['content', 'center', role], label: '中心文字' });
    }
  }
  return fields;
}
