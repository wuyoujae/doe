import { WIDTH, art, add } from '../shared/svg.js';
import { reconcilePanelEdit } from '../shared/panel-model.js';

const CARD_WIDTH = 220, CARD_HEIGHT = 345, ARROW_LENGTH = 50, ARROW_CLEARANCE = 8, GAP = ARROW_LENGTH + ARROW_CLEARANCE;
// 9pt of copy clearance in the slide's 96dpi geometry.
const COPY_TOP = 66, COPY_GAP = 12, BOTTOM_INSET = 17, VALUE_HEIGHT = 48;
const naturalWidth = props => Math.max(WIDTH, props.items.length * CARD_WIDTH + (props.items.length - 1) * GAP + 30);
function outline(x, y, connected, height = CARD_HEIGHT) {
  const right = x + CARD_WIDTH, bottom = y + height, tip = right + GAP - ARROW_CLEARANCE;
  const shift = (height - CARD_HEIGHT) / 2;
  const side = connected
    ? `V${y+212+shift}H${tip-20}V${y+194+shift}L${tip} ${y+244+shift}L${tip-20} ${y+294+shift}V${y+276+shift}H${right}`
    : '';
  // One perimeter joins the card to its arrow without a seam or left arrow edge.
  return `M${x+8} ${y}H${right-8}Q${right} ${y} ${right} ${y+8}${side}V${bottom-8}Q${right} ${bottom} ${right-8} ${bottom}H${x+8}Q${x} ${bottom} ${x} ${bottom-8}V${y+8}Q${x} ${y} ${x+8} ${y}Z`;
}

export const config = { type: 'badge-cards', min: 1, max: 4, icons: true, value: true, preview:'badgeCards',reconcileContentEdit:reconcilePanelEdit, resolveFlowLayout:props=>({naturalWidth:naturalWidth(props),layoutRevision:'badge-capacity-v3'}), geometry(document, props) {
  const width=naturalWidth(props),svg=art(document,480),slots=[],step=CARD_WIDTH+GAP,w=CARD_WIDTH,r=46;
  svg.setAttribute('viewBox',`0 0 ${width} 480`);
  const start=(width-(props.items.length*w+(props.items.length-1)*GAP))/2;
  props.items.forEach((item,i)=>{const x=start+i*step,y=70+(i%2)*60,cx=x+w/2,cy=y;
    add(svg,'path',{class:'doe-badge-card__body',d:outline(x,y,i<props.items.length-1),fill:'var(--diagram-card-surface)',stroke:'var(--yrkie-line-strong)','stroke-width':1.5,'stroke-linejoin':'round'});
    add(svg,'path',{class:'doe-badge-card__head',d:`M${cx-r} ${cy}A${r} ${r} 0 1 1 ${cx+r} ${cy}V${cy+r}H${cx}A${r} ${r} 0 0 1 ${cx-r} ${cy}Z`,fill:'var(--yrkie-color-primary)'});
    const valueTop = CARD_HEIGHT - BOTTOM_INSET - VALUE_HEIGHT;
    const copyBottom = item.value ? valueTop - COPY_GAP : CARD_HEIGHT - BOTTOM_INSET;
    slots.push({x:x+14,y:y+COPY_TOP,w:w-28,h:copyBottom-COPY_TOP,align:'center',icon:{x:cx-r*.55,y:cy-r*.55,w:r*1.1,h:r*1.1},value:item.value?{x:x+12,y:y+valueTop,w:w-24,h:VALUE_HEIGHT}:null});
  });
  const geometry = {svg,width,height:480,slots};
  // All staggered cards share a body height. Rebuild from native geometry on
  // every trial so shrinking/shortening text can return borrowed space.
  geometry.fitHeight = (demands, budget) => {
    const required = Math.max(CARD_HEIGHT, ...demands.map((height, i) =>
      COPY_TOP + height + BOTTOM_INSET + (props.items[i].value ? COPY_GAP + VALUE_HEIGHT : 0)));
    const height = Math.min(required, Math.max(CARD_HEIGHT, budget - (480 - CARD_HEIGHT)));
    geometry.height = 480 + height - CARD_HEIGHT;
    slots.forEach((slot, i) => {
      const y = 70 + (i % 2) * 60, bottom = height - BOTTOM_INSET;
      slot.h = bottom - COPY_TOP - (slot.value ? VALUE_HEIGHT + COPY_GAP : 0);
      if (slot.value) slot.value.y = y + bottom - VALUE_HEIGHT;
      svg.querySelectorAll('.doe-badge-card__body')[i].setAttribute('d', outline(start + i * step, y, i < slots.length - 1, height));
    });
  };
  return geometry;
} };
