import { chartTargetAt } from '../hit-test/index.js';
import { chartData, chartTargets } from '../data/index.js';
import { evaluateFormula, presets, validateTooltip } from '../formula/index.ts';
import { chartLabels, chartLocale } from '../labels/index.ts';
import { fitChartPoints, hideCollidingLabels } from '../geometry/index.js';
import { chartTooltip } from '../popup/index.js';

const documents = new WeakMap();
function lifecycle(host, dispose) {
  const doc=host.ownerDocument;
  if(!documents.has(doc)){
    const entries=new Map();
    new MutationObserver(()=>{for(const [element,record] of entries){if(element.isConnected)record.connected=true;else if(record.connected){record.dispose();entries.delete(element);}}}).observe(doc,{childList:true,subtree:true});
    documents.set(doc,entries);
  }
  documents.get(doc).set(host,{dispose,connected:host.isConnected});
}

export function attachChartInteraction(host, config, type) {
  host.__disposeChartInteraction?.();
  host.dataset.chartRuntime='true';delete host.dataset.chartInteractive;
  const data=chartData(type,config), targets=chartTargets(host,type,data).filter(x=>x.datum);
  const settings=validateTooltip(config.tooltip)?undefined:config.tooltip;
  const enabled=settings?.enabled!==false;
  const doc=host.ownerDocument, view=doc.defaultView, tooltip=chartTooltip(doc), abort=new view.AbortController();
  let active=null, guide=null, frame=0, pinned=false;
  const clear=()=>{active?.element.classList.remove('is-chart-active');active?.element.removeAttribute('aria-describedby');active=null;pinned=false;delete host.dataset.chartActive;guide?.remove();guide=null;};
  const hide=()=>{if(active)tooltip.clear();clear();};
  doc.addEventListener('doe:interaction-reset',event=>{if(event.target.contains?.(host))hide();},{signal:abort.signal});
  const refresh=()=>{fitChartPoints(host);if(enabled)hideCollidingLabels(host);};
  const resize=view.ResizeObserver ? new view.ResizeObserver(()=>{view.cancelAnimationFrame?.(frame);frame=view.requestAnimationFrame(()=>{refresh();hide();});}) : {observe(){},disconnect(){}};
  host.querySelectorAll('svg').forEach(svg=>resize.observe(svg));resize.observe(host);
  host.__disposeChartInteraction=()=>{hide();abort.abort();resize.disconnect();view.cancelAnimationFrame?.(frame);documents.get(doc)?.delete(host);};
  lifecycle(host,host.__disposeChartInteraction);
  refresh();
  if(!enabled)return;
  host.dataset.chartInteractive='true';
  host.setAttribute('role','group');
  host.querySelectorAll('svg').forEach(svg=>svg.removeAttribute('aria-hidden'));
  host.querySelectorAll('.ppt-line-chart__series-path,.ppt-radar-chart svg > polygon[fill]').forEach(el=>el.classList.add('doe-chart-series'));
  const labels=chartLabels(doc), format=(value, options={})=>value===null?'—':new Intl.NumberFormat(chartLocale(doc),{maximumFractionDigits:2,...options}).format(value);
  function show(target,x,y) {
    if (host.closest('[data-canvas-mode="static"], [inert]')) { hide(); return; }
    fitChartPoints(host);
    if(active!==target){
      hide();
      const point=target.datum, fragment=doc.createDocumentFragment();
      const node=(className,text)=>{const el=doc.createElement('div');el.className=className;el.textContent=text;return el;};
      const heading=node('doe-chart-tooltip__heading',point.series||point.category);
      const swatch=doc.createElement('i');swatch.className='doe-chart-tooltip__swatch';
      const computed=view.getComputedStyle(target.element);swatch.style.setProperty('--chart-point-color',target.element.namespaceURI.includes('svg')?computed.fill:computed.backgroundColor);
      heading.prepend(swatch);fragment.append(heading);
      const content=config.content||{};
      if(type==='risk-matrix') fragment.append(node('doe-chart-tooltip__value',`${content.xLabel||labels.x}: ${format(point.x)} · ${content.yLabel||labels.y}: ${format(point.y)}`));
      else fragment.append(node('doe-chart-tooltip__value',`${content.valuePrefix||''}${format(point.value,{maximumFractionDigits:20})}${content.valueSuffix||''}`));
      const defaults=type==='donut-chart'?['share']:type==='risk-matrix'||type==='radar-chart'?[]:['growth','vsAverage'];
      const metrics=settings?.metrics ?? defaults.map(key=>{const preset=presets.find(x=>x[0]===key);return {label:labels[key],formula:preset[1],format:preset[2]};});
      metrics.slice(0,6).forEach(metric=>{
        const value=evaluateFormula(metric.formula,point,data), row=node('doe-chart-tooltip__metric','');
        row.append(node('',metric.label),node('',format(value,{style:metric.format==='percent'?'percent':'decimal',maximumFractionDigits:metric.decimals??2})));
        fragment.append(row);
      });
      fragment.append(node('doe-chart-tooltip__category',point.category));
      tooltip.show(host,fragment,clear);active=target;host.dataset.chartActive='true';target.element.classList.add('is-chart-active');target.element.setAttribute('aria-describedby','doe-chart-tooltip');
      if(type==='line-chart'){
        const svg=target.element.ownerSVGElement;guide=doc.createElementNS(svg.namespaceURI,'line');
        const cx=target.element.getAttribute('cx'),cy=target.element.getAttribute('cy');
        for(const [name,value] of Object.entries({x1:cx,x2:cx,y1:cy,y2:svg.viewBox.baseVal.height,class:'doe-chart-guide','data-slide-export-ignore':'true'}))guide.setAttribute(name,value);
        svg.append(guide);
      }
    }
    tooltip.move(x,y);
  }
  targets.forEach(target=>{
    const el=target.element;el.classList.add('doe-chart-mark');el.tabIndex=0;
    el.setAttribute('aria-label',`${target.datum.series} · ${target.datum.category}: ${target.datum.value}`);
    const on=(event,callback)=>el.addEventListener(event,callback,{signal:abort.signal});

    on('focus',()=>{const box=el.getBoundingClientRect();show(target,box.x+box.width/2,box.y+box.height/2);});
    on('blur',hide);
  });
  const resolve=event=>targets.find(target=>target.element===event.target) || chartTargetAt(host,type,targets,config,event.clientX,event.clientY);
  host.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch')return;
    pinned=false;
    const target=resolve(event);
    if(target)show(target,event.clientX,event.clientY);else hide();
  },{signal:abort.signal});
  host.addEventListener('pointerleave',()=>{if(!pinned)hide();},{signal:abort.signal});
  host.addEventListener('pointerup',event=>{
    if(event.pointerType!=='touch')return;
    const target=resolve(event);
    if(target){show(target,event.clientX,event.clientY);pinned=true;}
  },{signal:abort.signal});
}
