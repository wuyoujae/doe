export function fitChartPoints(host) {
  host.querySelectorAll('svg').forEach(svg => {
    const matrix = svg.getScreenCTM?.();
    if (!matrix) return;
    const sx = Math.hypot(matrix.a,matrix.b), sy = Math.hypot(matrix.c,matrix.d), scale = Math.min(sx,sy);
    if (!scale) return;
    const signature = `${sx}:${sy}`;
    if (svg.__chartPointScale === signature) return;
    svg.__chartPointScale = signature;
    svg.querySelectorAll('.ppt-line-chart__point,.ppt-business-chart__radar-point,.ppt-risk-matrix__node').forEach(point => {
    const x = point.getAttribute('cx'), y = point.getAttribute('cy');
    point.setAttribute('transform',`translate(${x} ${y}) scale(${scale/sx} ${scale/sy}) translate(${-Number(x)} ${-Number(y)})`);
    });
  });
}

export function hideCollidingLabels(host) {
  const labels = [...host.querySelectorAll('.ppt-grouped-bar-chart__value,.ppt-line-chart__value-label,.ppt-stacked-bar-chart__segment-label,.ppt-waterfall-chart__value-label,.ppt-donut-chart__segment-value,.ppt-donut-chart__segment-label')];
  labels.forEach(label => label.classList.remove('doe-chart-value-hidden'));
  const rects = labels.map(label => label.getBoundingClientRect());
  const hidden = new Set();
  const bounds = (host.querySelector('.ppt-grouped-bar-chart__field') || host).getBoundingClientRect();
  rects.forEach((box,index)=>{
    if (box.width && (box.left < bounds.left - 1 || box.right > bounds.right + 1)) hidden.add(index);
    const maxWidth = Number(labels[index].dataset.chartLabelMaxWidth);
    if (maxWidth && labels[index].getBBox?.().width > maxWidth) hidden.add(index);
  });
  rects.forEach((a,i) => rects.forEach((b,j) => {
    if (j<=i || !a.width || !b.width) return;
    if(a.left < b.right+3 && a.right+3>b.left && a.top<b.bottom+2 && a.bottom+2>b.top){hidden.add(i);hidden.add(j);}
  }));
  labels.forEach((label,index) => label.classList.toggle('doe-chart-value-hidden',hidden.has(index)));
  return hidden.size;
}
