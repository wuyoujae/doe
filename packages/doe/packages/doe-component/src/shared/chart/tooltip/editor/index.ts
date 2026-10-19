import type { ContentForm, UnknownRecord } from '../../../editor/types/index.ts';
import { chartLabels } from '../labels/index.ts';
import { presets, validateTooltip, type Metric } from '../formula/index.ts';

export function withTooltipForm(create: (props: UnknownRecord, changed: () => void) => ContentForm, type: string) {
  return (base: UnknownRecord, onChange: () => void): ContentForm => {
    const form=create(base,onChange), labels=chartLabels();
    const initial=type==='donut-chart'?['share']:type==='risk-matrix'||type==='radar-chart'?[]:['growth','vsAverage'];
    const metrics: Metric[]=structuredClone(base.tooltip?.metrics ?? initial.map(key=>{
      const preset=presets.find(x=>x[0]===key)!;return {label:labels[key as keyof typeof labels],formula:preset[1],format:preset[2],decimals:2};
    }));
    let enabled=base.tooltip?.enabled!==false, dirty=false;
    const changed=()=>{dirty=true;onChange();};
    const section=document.createElement('section');section.className='chart-tooltip-settings';
    const heading=document.createElement('h3');heading.textContent=labels.title;
    const hint=document.createElement('p');hint.className='chart-content-hint';hint.textContent=labels.hint;
    const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=enabled;toggle.name='tooltip-enabled';
    const toggleLabel=document.createElement('label');toggleLabel.className='chart-content-toggle';toggleLabel.append(toggle,document.createTextNode(labels.enabled));
    toggle.addEventListener('change',()=>{enabled=toggle.checked;changed();});
    const list=document.createElement('div'),actions=document.createElement('div');actions.className='chart-content-data-actions';
    const preset=document.createElement('select');preset.setAttribute('aria-label',labels.add);
    for(const [key] of presets){const option=document.createElement('option');option.value=key;option.textContent=labels[key];preset.append(option);}
    const custom=document.createElement('option');custom.value='custom';custom.textContent=labels.custom;preset.append(custom);
    const add=document.createElement('button');add.type='button';add.textContent=labels.add;
    add.addEventListener('click',()=>{if(metrics.length>=6)return;const entry=presets.find(x=>x[0]===preset.value);metrics.push({label:entry?labels[entry[0]]:labels.custom,formula:entry?.[1]||'VALUE',format:entry?.[2]||'number',decimals:2});render();changed();});
    const field=(parent:HTMLElement,label:string,input:HTMLElement)=>{const wrap=document.createElement('label');wrap.className='chart-content-field';const caption=document.createElement('span');caption.textContent=label;wrap.append(caption,input);parent.append(wrap);return wrap;};
    const render=()=>{
      list.replaceChildren();add.disabled=metrics.length>=6;
      metrics.forEach((metric,index)=>{
        const row=document.createElement('div');row.className='chart-tooltip-metric';
        for(const key of ['label','formula'] as const){const input=document.createElement('input');input.name=`tooltip-${key}-${index}`;input.value=metric[key];input.maxLength=key==='label'?80:256;input.addEventListener('input',()=>{metric[key]=input.value;changed();});const wrap=field(row,labels[key],input);if(key==='formula')wrap.classList.add('chart-tooltip-formula');}
        const format=document.createElement('select');format.name=`tooltip-format-${index}`;
        for(const value of ['number','percent'] as const){const option=document.createElement('option');option.value=value;option.textContent=labels[value];format.append(option);}format.value=metric.format;
        format.addEventListener('change',()=>{metric.format=format.value as Metric['format'];changed();});field(row,labels.format,format);
        const decimals=document.createElement('input');decimals.type='number';decimals.min='0';decimals.max='6';decimals.step='1';decimals.name=`tooltip-decimals-${index}`;decimals.value=String(metric.decimals??2);
        decimals.addEventListener('input',()=>{metric.decimals=decimals.value===''?NaN:Number(decimals.value);changed();});field(row,labels.decimals,decimals);
        const remove=document.createElement('button');remove.type='button';remove.textContent=labels.remove;remove.addEventListener('click',()=>{metrics.splice(index,1);render();changed();});row.append(remove);list.append(row);
      });
    };
    render();actions.append(preset,add);section.append(heading,toggleLabel,hint,list,actions);form.element.append(section);
    return {element:form.element,dispose:()=>form.dispose?.(),read(){const result=form.read();if(result.error||!dirty)return result;const tooltip={enabled,metrics};const error=validateTooltip(tooltip);return error?{error:`${labels.invalid} ${error}`}:{props:{...result.props,tooltip:structuredClone(tooltip)}};}};
  };
}
