import { art, add } from '../shared/svg.js';
import { reconcilePanelEdit } from '../shared/panel-model.js';
export const config = { type: 'vertical-progress', min: 1, max: 4, percent: true,
  preview:'verticalProgress',reconcileContentEdit:reconcilePanelEdit,
  createItem:()=>({value:50,text:'描述'}), geometry(document,props) {
    const svg=art(document,280),slots=[],step=1100/props.items.length;
    props.items.forEach((item,i)=>{const x=i*step+10,h=240,filled=h*item.value/100;
      add(svg,'rect',{class:'doe-progress__track',x,y:10,width:38,height:252,rx:19,fill:'none','stroke-width':2});
      if(filled>0)add(svg,'rect',{class:'doe-progress__fill',x:x+5,y:16+h-filled,width:28,height:filled,rx:Math.min(14,filled/2),'data-progress-value':item.value});
      slots.push({x:x+56,y:25,w:step-78,h:240});
    });
    return {svg,height:280,slots};
  }
};
