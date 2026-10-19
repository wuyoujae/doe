export function chartData(type, config) {
  const content = config.content || {}, data = [];
  if (content.categories && content.series) {
    content.series.forEach((series, seriesIndex) => series.data.forEach((value, index) => data.push({ value:Number(value), category:String(content.categories[index]), series:String(series.name), seriesIndex, index })));
  } else if (type === 'radar-chart') {
    content.datasets.forEach((series, seriesIndex) => series.values.forEach((value, index) => data.push({ value:Number(value), category:String(content.axes[index].label), series:String(series.name), seriesIndex, index })));
  } else {
    let cumulative = 0;
    (content.items || []).forEach((item, index) => {
      let value = Number(item.value) || 0;
      if (type === 'waterfall-chart') {
        if (item.type === 'total') value = item.value === undefined ? cumulative : value;
        cumulative = item.type === 'total' ? value : cumulative + value;
      }
      if (type === 'risk-matrix') value = Number(item.x) * Number(item.y);
      data.push({ value, category:String(item.label || item.name || index + 1), series:String(config.title || ''), seriesIndex:0, index, ...(type === 'risk-matrix' && { x:Number(item.x), y:Number(item.y) }) });
    });
  }
  return data;
}

export function chartTargets(host, type, data) {
  const select = query => [...host.querySelectorAll(query)];
  if (type === 'grouped-bar-chart' || type === 'stacked-bar-chart') {
    const marks = type === 'grouped-bar-chart' ? select('.ppt-grouped-bar-chart__bar') : select('.ppt-stacked-bar-chart__bar > rect');
    const sorted = [...data].sort((a,b)=>a.index-b.index || a.seriesIndex-b.seriesIndex);
    return marks.map((element,index)=>({ element, datum:sorted[index] }));
  }
  const selectors = { 'line-chart':'.ppt-line-chart__point', 'donut-chart':'.ppt-donut-chart__segment', 'radar-chart':'.ppt-business-chart__radar-point', 'risk-matrix':'.ppt-risk-matrix__node', 'waterfall-chart':'.ppt-waterfall-chart__bar' };
  return select(selectors[type]).map((element,index)=>({ element, datum:data[index] }));
}
