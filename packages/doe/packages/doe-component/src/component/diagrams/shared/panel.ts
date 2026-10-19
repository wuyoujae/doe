import { t } from '../../../shared/editor/i18n/index.ts';
import { editorForm } from '../../../shared/editor/form-controls/index.ts';
import type { UnknownRecord } from '../../../shared/editor/types/index.ts';
import { identify } from './panel-model.js';
export function createDiagramPanel(percent: boolean) {
  return (base: UnknownRecord,onChange:()=>void)=>{
    const e=editorForm(base,onChange);delete e.draft.content;
    const section=e.section(t(percent?'doeInteraction:catalog.vertical-percentage-bars':'doeInteraction:catalog.staggered-arrow-cards'),t(percent?'doeInteraction:diagram.percentageHint':'doeInteraction:diagram.valueHint'));
    const items=e.draft.items=identify(e.draft.items);
    let serial=0;
    e.collection(section,t('doeInteraction:fields.items'),items,(item,index,card)=>{
      if(percent)e.number(card,`value-${index}`,t('doeInteraction:fields.percentage'),item.value,v=>{item.value=v;},{min:0,max:100});
      else {
        e.text(card,`title-${index}`,t('doeInteraction:fields.title'),item.title,v=>{item.title=v;},true,true);
        e.text(card,`icon-${index}`,t('doeInteraction:fields.icon'),item.icon||'Star',v=>{item.icon=v||'Star';});
        e.text(card,`value-${index}`,t('doeInteraction:fields.bottomValue'),item.value,v=>{if(v.trim())item.value=v;else delete item.value;});
      }
      e.text(card,`text-${index}`,t('doeInteraction:fields.description'),item.text,v=>{item.text=v;},true,true);
    },()=>{let id:string;do{id=`diagram-added-${++serial}`;}while(items.some((item:any)=>item.id===id));return percent?{id,value:50,text:t('doeInteraction:fields.description')}:{id,title:t('doeInteraction:fields.title'),text:t('doeInteraction:fields.description'),icon:'Star'};},1,undefined,{maximum:4,reorderable:true});
    return e.form;
  };
}
