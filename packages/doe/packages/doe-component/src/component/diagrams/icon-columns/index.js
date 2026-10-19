import { art, add } from '../shared/svg.js';
import { ROUND_BADGE_RADIUS } from '../shared/badge-geometry.js';
export const config = { type: 'icon-columns', min: 1, max: 4, icons: true, geometry(document, props) {
  const slots=[], step=1100/props.items.length, r=ROUND_BADGE_RADIUS,height=Math.max(350,r*2+215),svg=art(document,height);
  props.items.forEach((_,i)=>{const cx=(i+.5)*step;
    add(svg,'circle',{cx,cy:r+8,r,fill:'var(--yrkie-color-primary)'});
    slots.push({x:i*step+12,y:r*2+35,w:step-24,h:180,align:'center',icon:{x:cx-r*.55,y:8+r*.45,w:r*1.1,h:r*1.1}});
  });
  return {svg,height:Math.max(350,r*2+215),slots};
} };
