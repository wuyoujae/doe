import names from './names.json' with { type: 'json' };

/** Editable, neutral defaults. No gallery/business data is copied into a user's deck. */
export function createInsertedComponent(name, { id, locale = 'en', media } = {}) {
  const entry = names.find(item => item.name === name);
  if (!entry || typeof id !== 'string' || !id) throw new Error('insert-invalid-component');
  const zh = locale.toLowerCase().startsWith('zh');
  const title = zh ? '标题' : 'Title';
  const text = zh ? '说明文字' : 'Description';
  const sample = zh ? '示例数据' : 'Sample data';
  const items = (count = 3) => Array.from({ length: count }, (_, i) => ({ id: `${id}-item-${i + 1}`, title: `${title} ${i + 1}`, text }));
  const image = () => {
    if (!media || typeof media.src !== 'string' || !media.src.trim()) throw new Error('insert-media-required');
    return { src: media.src, alt: typeof media.alt === 'string' ? media.alt : '', fit: 'cover' };
  };
  let props;
  if (entry.type === 'contents') {
    const presentation = entry.presentation;
    let content = items(presentation === 'image-text' ? 1 : presentation === 'shape:semicircle' ? 4 : 3);
    if (presentation.startsWith('list:')) content = content.map(({ id }) => ({ id, text }));
    else if (presentation === 'quotation') content = content.map(({ id }) => ({ id, text, source: zh ? '来源' : 'Source' }));
    else if (presentation === 'metrics') content = content.map(({ id }) => ({ id, title: '0', label: zh ? '指标' : 'Metric', text }));
    else if (presentation === 'image-text') content = content.map(item => ({ ...item, ...image() }));
    else if (presentation.startsWith('shape:') || presentation === 'question' || presentation.includes('numbered') || /icon|capability/.test(presentation)) content = content.map(item => ({ ...item, icon: presentation === 'question' ? 'CircleHelp' : presentation === 'shape:cycle-arrows' ? 'RotateCw' : 'CircleDot' }));
    props = { presentation, items: content };
  } else if (entry.category === 'diagrams') {
    let content = items(['layered-cube', 'double-ring'].includes(entry.type) ? 4 : 3);
    if (entry.type === 'vertical-progress') content = content.map(({ id }) => ({ id, value: 0, text }));
    if (['icon-columns', 'badge-cards', 'concentric-circles', 'serpentine-process', 'folded-arrow', 'droplet-process', 'recycling-arrows', 'wave-arrow', 'layered-cube', 'double-ring'].includes(entry.type)) content = content.map(item => ({ ...item, icon: 'Target', ...(entry.type === 'badge-cards' ? { value: zh ? '标签' : 'Label' } : {}) }));
    props = { items: content };
  } else {
    switch (entry.type) {
      case 'hero': props = { title, subtitle: text }; break;
      case 'heading': props = { text: title, level: 2 }; break;
      case 'text': case 'text-panel': props = { text }; break;
      case 'notice': props = { text, icon: 'Info' }; break;
      case 'media': props = image(); break;
      case 'todo-list': props = { items: items().map(({ id }) => ({ id, text, checked: false })) }; break;
      case 'code-block': props = { code: '// ' + text, language: 'text' }; break;
      case 'math-formula': props = { content: { formula: 'x + y = z', display: true } }; break;
      case 'grouped-bar-chart': case 'line-chart': case 'stacked-bar-chart':
        props = { content: { categories: ['A', 'B', 'C'].map(label => `${sample} ${label}`), series: [{ name: sample, data: [1, 2, 3] }] } }; break;
      case 'radar-chart': props = { subtitle: sample, content: { axes: ['A', 'B', 'C'].map(label => ({ label, max: 5 })), datasets: [{ name: sample, values: [2, 3, 4] }] } }; break;
      case 'risk-matrix': props = { subtitle: sample, content: { xLabel: zh ? '概率' : 'Probability', yLabel: zh ? '影响' : 'Impact', items: [{ label: sample, x: 0.5, y: 0.5 }] } }; break;
      case 'waterfall-chart': props = { subtitle: sample, content: { items: [{ label: `${sample} A`, value: 2, type: 'total' }, { label: `${sample} B`, value: 1, type: 'change' }, { label: `${sample} C`, value: 3, type: 'total' }] } }; break;
      case 'donut-chart': props = { content: { items: ['A', 'B', 'C'].map(label => ({ label: `${sample} ${label}`, value: 1 })), center: { title: sample, value: '3' }, showLegend: true } }; break;
      case 'table': props = { content: { columns: [{ header: `${sample} A` }, { header: `${sample} B` }], rows: [{ cells: [text, text] }, { cells: [text, text] }] } }; break;
      case 'mind-map': props = { content: { items: [{ level: 0, title, text }, { level: 1, title: `${title} 1`, text }, { level: 1, title: `${title} 2`, text }] } }; break;
      default: throw new Error('insert-invalid-component');
    }
  }
  return { id, type: entry.type, props };
}
